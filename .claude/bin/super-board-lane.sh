#!/usr/bin/env bash
# One headless board lane on a non-Claude worker host, chosen by --backend.
# Usage: --backend codex --config f --card '<JSON>' --lane build|qa|review
#        [--<backend>[=model]] [--tier low|medium|high] [--complexity low|medium|high]
# --<backend> (e.g. --codex) is the run owner's explicit opt-in; without it,
# usage fallback may build/test but must never own a review or merge, and the
# board config must say "usage_fallback": "<backend>" (exit 78 otherwise).
# Model: --<backend>=<model>, else <backend>.model, else the backend's LADDERS[tier][complexity]
# when --tier is given (an ungraded card takes the medium cell), else the host's default.
# A missing, unknown or not-yet-built backend exits 64 and names the valid ones.
# Shared here: input checks, readiness/GitHub gates, lane prompt, result schema and
# validation, signal handling. Per host: one class in BACKENDS below.
set -euo pipefail
export PYTHONUTF8=1 PYTHONIOENCODING=utf-8
PYTHON=python3
if ! "$PYTHON" -c 'import sys; sys.exit(sys.version_info < (3, 9))' 2>/dev/null; then
  PYTHON=python
fi
exec "$PYTHON" - "${BASH_SOURCE[0]}" "$@" <<'PY'
import argparse
import importlib.util
import json
import os
from pathlib import Path
import signal
import subprocess
import sys
import tempfile

def fail(message, code=64):
    print(message, file=sys.stderr)
    sys.exit(code)

script_path = Path(sys.argv[1]).resolve()
spec_p = importlib.util.spec_from_file_location('sb_platform', script_path.with_name('super-board-platform.py'))
platform_mod = importlib.util.module_from_spec(spec_p)
spec_p.loader.exec_module(platform_mod)

spec_t = importlib.util.spec_from_file_location('sb_t3', script_path.with_name('super-board-t3.py'))
t3_mod = importlib.util.module_from_spec(spec_t)
spec_t.loader.exec_module(t3_mod)

if sys.platform == 'win32':
    for path_dir in os.environ.get('PATH', '').split(os.pathsep):
        if not path_dir or not os.path.isdir(path_dir):
            continue
        p = Path(path_dir)
        for target in ('gh', 'codex'):
            target_path = p / target
            if target_path.is_file():
                cmd_path = p / f'{target}.cmd'
                if not cmd_path.exists():
                    try:
                        cmd_path.write_text(f'@echo off\npython "%~dp0{target}" %*\n', encoding='utf-8')
                    except OSError:
                        pass
                exe_path = p / f'{target}.exe'
                if not exe_path.exists():
                    csc = Path(r'C:\Windows\Microsoft.NET\Framework64\v4.0.30319\csc.exe')
                    if csc.is_file():
                        cs_code = f'using System; using System.Diagnostics; class P {{ static int Main(string[] a) {{ var p = Process.Start(new ProcessStartInfo {{ FileName = "python", Arguments = "\\"" + AppDomain.CurrentDomain.BaseDirectory + "{target}\\" " + string.Join(" ", a), UseShellExecute = false }}); p.WaitForExit(); return p.ExitCode; }} }}'
                        cs_file = p / f'_{target}.cs'
                        try:
                            cs_file.write_text(cs_code, encoding='utf-8')
                            subprocess.run([str(csc), '-nologo', f'-out:{exe_path.name}', cs_file.name], cwd=str(p), capture_output=True)
                            cs_file.unlink(missing_ok=True)
                        except OSError:
                            pass


class Codex:
    """`codex exec` with a bounded permission profile; the answer lands in --output-last-message."""
    name, label = 'codex', 'Codex'
    # Codex run ladders, the one copy: run tier x card complexity -> model.
    # Mirrors the Claude LADDERS in workflows/super-board-wave.js. gpt-6.1-sol
    # ties gpt-6-astra on DeepSWE v1.1 (75.2% vs 74.1-74.8%) at a fifth of the
    # price, so it carries the default; Astra takes hard cards and --high.
    LADDERS = {
        'low': {'low': 'gpt-6-luna', 'medium': 'gpt-6.1-sol', 'high': 'gpt-6.1-sol'},
        'medium': {'low': 'gpt-6.1-sol', 'medium': 'gpt-6.1-sol', 'high': 'gpt-6-astra'},
        'high': {'low': 'gpt-6-astra', 'medium': 'gpt-6-astra', 'high': 'gpt-6-astra'},
    }
    capture_stdout = False  # Codex logs go to our stderr; the answer is a file

    def command(self, run):
        """(argv, stdin text) for one lane run; run holds root, git_dir, common_dir, model, prompt, schema_path, output."""
        # A custom profile deliberately does NOT extend :workspace, which protects
        # .git as read-only. Explicit git/common-dir grants also cover submodules.
        # https://learn.chatgpt.com/docs/permissions → File access limited to workspace
        filesystem = {':root': 'read', ':slash_tmp': 'write', ':tmpdir': 'write',
                      str(run['root']): 'write', str(run['git_dir']): 'write', str(run['common_dir']): 'write'}
        grants = '{' + ', '.join(json.dumps(key) + '=' + json.dumps(value) for key, value in filesystem.items()) + '}'
        command = ['codex', 'exec', '-C', str(run['root']), '-c', 'approval_policy="never"',
                   '-c', 'default_permissions="super-board-lane"',
                   '-c', 'permissions.super-board-lane.filesystem=' + grants,
                   '-c', 'permissions.super-board-lane.network.enabled=true',
                   '--output-schema', str(run['schema_path']), '--output-last-message', str(run['output']), '-']
        if run['model'] and run['model'].strip():
            command[2:2] = ['-m', run['model']]
        return command, run['prompt']

    def final_message(self, run, stdout):
        """The host's last message, which must be the lane result JSON."""
        return run['output'].read_text()


class Antigravity:
    """`t3 thread start` against the local T3 server using the Antigravity provider."""
    name, label = 'antigravity', 'Antigravity'
    # Antigravity run ladders: run tier x card complexity -> model.
    # low: flash, flash, argon
    # medium: flash, argon, argon
    # high: argon, argon, argon
    LADDERS = {
        'low': {'low': 'gemini-3.8-flash', 'medium': 'gemini-3.8-flash', 'high': 'gemini-4-argon'},
        'medium': {'low': 'gemini-3.8-flash', 'medium': 'gemini-4-argon', 'high': 'gemini-4-argon'},
        'high': {'low': 'gemini-4-argon', 'medium': 'gemini-4-argon', 'high': 'gemini-4-argon'},
    }
    capture_stdout = True

    def command(self, run):
        """(argv, stdin text) for one lane run."""
        model = run['model'] if run['model'] and run['model'].strip() else 'gemini-4-argon'
        title = f"[super-board] #{run['issue_number']} {run['lane']}"
        prompt = run['prompt'] + (
            "\nWindows PowerShell execution instruction: invoke all .sh scripts explicitly via "
            "`bash .claude/bin/<script>.sh` using Git Bash; do not use bare `source` or direct .sh execution.\n"
            "Return only the lane result JSON object as your final message, with no enclosing commentary.\n"
        )
        command = t3_mod.start_command(run['root'], model, title)
        return command, prompt

    def final_message(self, run, stdout):
        """Extract lane result from t3 thread start output."""
        column = run.get('card', {}).get('status', '')
        return t3_mod.extract_result(stdout, column=column)


# One entry per worker host. A new host is one more class with the same members:
# name, label, LADDERS (or None), capture_stdout (True hands stdout to final_message),
# command(run) and final_message(run, stdout). Everything else in this file is shared.
BACKENDS = {backend.name: backend for backend in [Codex(), Antigravity()]}

raw = sys.argv[2:]
choice = None
for index, arg in enumerate(raw):
    if arg == '--backend' or arg.startswith('--backend='):
        choice = arg.partition('=')[2] if '=' in arg else (raw[index + 1] if index + 1 < len(raw) else '')
        del raw[index:index + (1 if '=' in arg else 2)]
        break
if choice not in BACKENDS:
    fail(('missing --backend' if choice is None else f'unknown or not-yet-built backend {choice!r}')
         + '; valid backends: ' + ', '.join(BACKENDS))
backend = BACKENDS[choice]
flag = '--' + backend.name

parser = argparse.ArgumentParser(description=f'Run one {backend.label} board lane (no Claude sub-agents).')
parser.add_argument('--config', required=True)
parser.add_argument('--card', required=True, help='card JSON or a JSON file')
parser.add_argument('--lane', required=True, choices=['build', 'qa', 'review'])
parser.add_argument('--tier', choices=['low', 'medium', 'high'], help='run ladder (--low / default / --high)')
parser.add_argument('--complexity', choices=['low', 'medium', 'high'], help="router's grade for this card")
explicit = False
model = None
rest = []
for arg in raw:
    if arg == flag:
        explicit = True
    elif arg.startswith(flag + '='):
        explicit = True
        model = arg.partition('=')[2]
        if not model.strip():
            fail(f'{flag}=<model> requires a non-empty model')
    else:
        rest.append(arg)
args = parser.parse_args(rest)
if args.lane == 'review' and not explicit:
    fail(f'{backend.label} review refused: run must be started with explicit {flag}; usage fallback cannot review.', 78)
try:
    config_path = Path(args.config).resolve()
    config = json.loads(config_path.read_text())
    card = json.loads(args.card if args.card.lstrip().startswith('{') else Path(args.card).read_text())
    if not isinstance(config, dict) or not isinstance(card, dict):
        raise ValueError('config/card must be objects')
    if type(card.get('number')) is not int or card['number'] < 1 or not isinstance(card.get('status'), str):
        raise ValueError('card needs a positive issue number and status')
    configured = config.get(backend.name, {}).get('model') if config.get(backend.name) else None
    if configured is not None and not isinstance(configured, str):
        raise ValueError(f'{backend.name}.model must be a string')
    model = model if model is not None else (configured if configured and configured.strip() else None)
    if model is None and args.tier and backend.LADDERS:
        model = backend.LADDERS[args.tier][args.complexity or 'medium']
except (OSError, ValueError, AttributeError) as error:
    fail(f'Invalid {backend.label} lane input: {error}')
if backend.name == 'antigravity' and args.lane == 'review':
    config_host = config.get('host')
    merge_default = (config.get('merge_policy') or {}).get('default') if isinstance(config.get('merge_policy'), dict) else None
    if config_host in (None, '', 'claude') and not merge_default:
        fail(f'{backend.label} review refused: host is {config_host or "unset"} without merge_policy.default; unattended review cannot proceed.', 78)
# Without --<backend> this is the usage fallback, and that is opt-in per board.
if not explicit and config.get('usage_fallback', 'none') != backend.name:
    fail(f'{backend.label} fallback refused: usage_fallback is not "{backend.name}" in {config_path}; pass {flag} for an explicit {backend.label} run.', 78)

column = card['status']
def result(status, detail):
    print(json.dumps({'status': status, 'column': column, 'detail': detail}))

readiness = script_path.with_name('super-board-verification-ready.py')
def require_verification_ready():
    if subprocess.run([sys.executable, str(readiness), '--config', str(config_path)]).returncode:
        result('halted', 'verification-readiness: repair verify_commands; preserve claims, worktrees and card state, then restart explicitly')
        sys.exit(9)
require_verification_ready()

def git_path(option):
    return Path(subprocess.check_output(['git', 'rev-parse', option], text=True).strip()).resolve()

try:
    root = git_path('--show-toplevel')
    git_dir = git_path('--git-dir')
    common_dir = git_path('--git-common-dir')
except subprocess.CalledProcessError:
    fail(f'{backend.label} lane must start inside the target git repository')
os.chdir(root)
helper = script_path.with_name('super-board-github-read.py')
if not helper.exists() or subprocess.run([sys.executable, str(helper), '--check']).returncode:
    result('halted', 'required GitHub reads halted or helper missing; preserve claims and worktrees')
    sys.exit(79)

resolver_path = script_path.with_name('super-board-skills-ready.py')
try:
    spec = importlib.util.spec_from_file_location('skills_ready', resolver_path)
    resolver = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(resolver)
    resolver.hydrate([card], root)
    skills = resolver.report(root, backend.name, [card], lane=args.lane,
                             home=os.environ.get('SUPER_BOARD_SKILLS_HOME'), catalog=os.environ.get('SUPER_BOARD_SKILLS_CATALOG'))
except SystemExit as error:
    result('halted', 'required GitHub reads halted while hydrating skills; preserve claims and worktrees')
    sys.exit(error.code)
except (OSError, ValueError, TypeError, KeyError) as error:
    result('halted', 'skills-readiness: ' + str(error))
    sys.exit(64)
if not skills['ready']:
    result('halted', 'skills-readiness: missing ' + ', '.join(dict.fromkeys(e['name'] for e in skills['entries'] if e['status'] == 'missing')))
    sys.exit(10)

skill = {'build': 'super-build', 'qa': 'super-qa', 'review': 'super-review'}[args.lane]
section = {'build': 'Builder', 'qa': 'Tester', 'review': 'Reviewer'}[args.lane]
prompt = f'''Run {skill} for issue #{card['number']} as a {backend.label} lane worker.
First operation: recheck .claude/bin/super-board-skills-ready.py --root {root} --host {backend.name} --cards - --lane {args.lane} with the Card JSON below as a one-element stdin array, before worktree creation, classification or lifecycle writes. Exit 10 means status=halted, detail=skills-readiness:, preserve all state. Load resolved_path files and only declared fallback IDs from the report. Before activating any conditional helper, repeat with --require <exact-name>.
Resolved skill report: {json.dumps(skills)}
Config: {config_path}
Card: {json.dumps(card)}
Read .claude/skills/{skill}/SKILL.md and .claude/skills/super-board/references/run.md → {section} lifecycle; follow all its board, branch, worktree, comments, test and merge requirements.
Source .claude/bin/super-board-gh-guard.sh and use its quota checks. Required GitHub reads go through .claude/bin/super-board-github-read.py; a read that misses its --kind shape exits 64 for that call only and prints the valid form, so fix the read. A --kind diff read needs --meta <file> from a --kind metadata read first. Check --check before new writes, migrations and merges; exit 79 means status=halted, no more GitHub calls, preserve claims/worktree/card/approval. Never retry a mutation.
Use .claude/bin/super-board-card.sh for board reads/moves and .claude/bin/super-board-pr-body.sh for owned PR blocks; follow writing-standard.md and pr-author-notes.md.
Use your own worktree under .claude/worktrees/; never edit the main checkout. Clean up on ordinary exit, preserve work on halt/interruption.
{backend.label} adaptation: do not launch Claude or other sub-agents. Perform preflight, classification, independent review and truth-check duties inline. This changes the execution host, never the evidence requirements, confidence threshold or merge policy.
Return JSON: status=advanced|bounced|blocked|human-gate|failed|halted; column=current board column; detail=one line; prUrl/branch when known, otherwise null; priorFindings=review counts or null. A non-advanced exit ends this card's lane chain. On merge-gate exit 9, return status=halted with detail starting exactly "verification-readiness:"; preserve work and never bounce/retry.
'''
if args.lane == 'build':
    prompt += '''Before creating any worktree or changing code, perform run.md's Builder pre-flight inline: call super-board-preflight.sh, judge its candidates semantically, and act on proceed/hold/sequence/skipped. Blind preflight leaves Ready and returns failed. Your own issue branch PR is not a duplicate. Read the issue and all comments; preserve qa/bug/feature labels. Existing docs/ux/tests/refactor/tech-debt rows keep their label chain: classify complexity without adding feature/bug. If truly untyped, classify feature or bug, re-run skills-ready on the proposed labelled card before adding that label, never qa. Then follow the Builder lifecycle.
'''
elif args.lane == 'qa' and card['status'] == 'Ready':
    prompt += 'This qa-labelled Ready card skips Building: move Ready → QA and create the issue branch from the base; test the existing product per run.md qa cards.\n'
elif args.lane == 'review':
    prompt += f'''The owner explicitly chose run {flag}: you may review and own the merge. First load the latest <!-- super-review:report -->; grade prior R-ids fixed/not fixed/no longer applies, bounce any not fixed and edit the same report in place. Form hypotheses from the issue AC and diff before reading the Builder narrative.
Rerun the Tester's tests. When truth_gate triggers, apply super-review's fixed Adversarial mode brief inline in two distinct passes (code-grounder and historian); collect evidence and aggregate confidence against truth_threshold. Over-engineering is Should fix, never Blocker alone and never lowers confidence. Missing evidence fails closed.
Merge ONLY through the unchanged .claude/bin/super-board-merge-gate.sh, pinning the exact head you reviewed at review pass using --expect-head "$HEAD" --config <config> --pr <N> --subject <title> --body-file <msg.md>. Never run bare gh pr merge or bypass the gate. Follow run.md Merge protocol and route every gate exit exactly: 2/5 rebase pass, 3 Blocked, 4 stay Review, 6 fresh review, 7/8 human gate with pinned approval-request; 9 verification-readiness means halt and preserve card/worktree/approval/claims until config repair and explicit restart, never a Build bounce or rebase retry. Respect human_approves_merge and merge_policy. Confirm MERGED <sha>, fetch base and prove merge-base --is-ancestor <sha> origin/<base> before closing issue or moving Done.
'''

counts = {key: {'type': 'integer'} for key in ['fixed', 'notFixed', 'noLongerApplies']}
properties = {
    'status': {'type': 'string', 'enum': ['advanced', 'bounced', 'blocked', 'human-gate', 'failed', 'halted']},
    'column': {'type': 'string'}, 'detail': {'type': 'string'},
    'prUrl': {'type': ['string', 'null']}, 'branch': {'type': ['string', 'null']},
    'priorFindings': {'anyOf': [{'type': 'null'}, {'type': 'object', 'properties': counts,
                      'required': list(counts), 'additionalProperties': False}]},
}
schema = {'type': 'object', 'properties': properties, 'required': list(properties), 'additionalProperties': False}
JSON_TYPES = {'object': dict, 'array': list, 'string': str, 'null': type(None)}
def conforms(value, rule):
    # The subset of JSON Schema the lane schema uses: type, enum, anyOf, properties/required/additionalProperties.
    if 'anyOf' in rule:
        return any(conforms(value, option) for option in rule['anyOf'])
    kinds = rule['type'] if isinstance(rule['type'], list) else [rule['type']]
    if not any(type(value) is int if kind == 'integer' else isinstance(value, JSON_TYPES[kind]) for kind in kinds):
        return False
    if 'enum' in rule and value not in rule['enum']:
        return False
    if isinstance(value, dict):
        if set(value) - set(rule['properties']) or not set(rule['required']) <= set(value):
            return False
        return all(conforms(value[key], rule['properties'][key]) for key in value)
    return True
child = None
def interrupted(signum, frame):
    if child is not None:
        platform_mod.terminate_tree(child, force=True)
    result('halted', 'lane interrupted; preserve claims and worktrees')
    sys.exit(128 + signum)
signal.signal(signal.SIGTERM, interrupted)
signal.signal(signal.SIGINT, interrupted)
with tempfile.TemporaryDirectory(prefix=f'super-board-{backend.name}-') as temporary:
    run = dict(root=root, git_dir=git_dir, common_dir=common_dir, model=model, prompt=prompt,
               schema_path=Path(temporary) / 'schema.json', output=Path(temporary) / 'result.json',
               issue_number=card['number'], lane=args.lane, card=card)
    run['schema_path'].write_text(json.dumps(schema))
    try:
        command, stdin = backend.command(run)
        child = subprocess.Popen(command, stdin=subprocess.PIPE if stdin is not None else subprocess.DEVNULL,
                                 stdout=subprocess.PIPE if backend.capture_stdout else sys.stderr, text=True,
                                 encoding='utf-8', **platform_mod.group_popen_kwargs())
        stdout, _ = child.communicate(stdin)
        require_verification_ready()
        if child.returncode:
            if backend.name == 'antigravity' and child.returncode == 2:
                result('failed', 't3 thread paused for approval or input; T3 runtime mode must be full-access for unattended runs')
                sys.exit(1)
            result('halted' if child.returncode in (9, 10, 79) else 'failed',
                   'verification-readiness: repair verify_commands and restart explicitly; preserve work'
                   if child.returncode == 9 else 'skills-readiness: required skills became unavailable; preserve work' if child.returncode == 10 else f"{' '.join(command[:2])} exited {child.returncode}")
            sys.exit(child.returncode if child.returncode in (9, 10, 79) else 1)
        parsed = json.loads(backend.final_message(run, stdout))
        if not conforms(parsed, schema):
            raise ValueError('lane result does not match the lane schema')
        print(json.dumps(parsed))
        sys.exit(10 if parsed['status'] == 'halted' and parsed['detail'].startswith('skills-readiness:')
                 else 9 if parsed['status'] == 'halted' and parsed['detail'].startswith('verification-readiness:')
                 else 79 if parsed['status'] == 'halted' else 0)
    except (OSError, ValueError) as error:
        result('failed', f'{backend.label} returned no valid lane result: {error}')
        sys.exit(1)
PY
