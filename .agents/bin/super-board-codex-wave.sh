#!/usr/bin/env bash
# Dispatch an explicitly selected Codex wave; stdout/--output matches the
# Claude workflow's {cards:[summary...], halted} reconciliation contract.
# Usage: --config f --cards '<JSON array>' --codex[=model] [--tier low|medium|high] [--output f]
# Unless one model is pinned (--codex=<model> or codex.model), a cheap router
# (ROUTER_MODEL) grades each Ready card low/medium/high; the lane launcher maps
# tier x grade to a model through its Codex.LADDERS table.
set -euo pipefail
export PYTHONUTF8=1 PYTHONIOENCODING=utf-8
PYTHON=python3
if ! "$PYTHON" -c 'import sys; sys.exit(sys.version_info < (3, 9))' 2>/dev/null; then
  PYTHON=python
fi
exec "$PYTHON" - "${BASH_SOURCE[0]}" "$@" <<'PY'
import argparse
import importlib.util
from concurrent.futures import ThreadPoolExecutor
import json
import os
from pathlib import Path
import signal
import subprocess
import sys
import tempfile
import threading
import time

launcher = Path(sys.argv[1]).resolve().with_name('super-board-lane.sh')
spec_p = importlib.util.spec_from_file_location('sb_platform', launcher.with_name('super-board-platform.py'))
platform_mod = importlib.util.module_from_spec(spec_p)
spec_p.loader.exec_module(platform_mod)

spec_t = importlib.util.spec_from_file_location('sb_t3', launcher.with_name('super-board-t3.py'))
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

parser = argparse.ArgumentParser(description='Dispatch one explicitly opted-in headless wave.')
parser.add_argument('--config', required=True)
parser.add_argument('--cards', required=True, help='planner card array JSON or JSON file')
parser.add_argument('--output')
parser.add_argument('--tier', default='medium', choices=['low', 'medium', 'high'])
raw = sys.argv[2:]
codex_flags = [arg for arg in raw if arg == '--codex' or arg.startswith('--codex=')]
ag_flags = [arg for arg in raw if arg == '--antigravity' or arg.startswith('--antigravity=')]
if len(codex_flags) + len(ag_flags) != 1 or any('=' in f and not f.partition('=')[2].strip() for f in (codex_flags + ag_flags)):
    parser.error('exactly one explicit --codex[=<non-empty-model>] or --antigravity[=<non-empty-model>] is required'
                 if ag_flags or not codex_flags else 'exactly one explicit --codex[=<non-empty-model>] is required')
backend_flag = (codex_flags + ag_flags)[0]
backend_name = 'antigravity' if backend_flag.startswith('--antigravity') else 'codex'
args = parser.parse_args([arg for arg in raw if arg != backend_flag])
output_path = Path(args.output).resolve() if args.output else None
try:
    config_path = Path(args.config).resolve()
    config = json.loads(config_path.read_text())
    cards = json.loads(args.cards if args.cards.lstrip().startswith('[') else Path(args.cards).read_text())
    if not isinstance(config, dict) or not isinstance(cards, list):
        raise ValueError('config must be an object; cards must be an array')
    numbers = set()
    for card in cards:
        if (not isinstance(card, dict) or type(card.get('number')) is not int or card['number'] < 1
                or card.get('status') not in ['Ready', 'QA', 'Review']):
            raise ValueError('each card needs a positive number and Ready/QA/Review status')
        if card['number'] in numbers:
            raise ValueError('duplicate card number')
        numbers.add(card['number'])
        if card.get('lane') not in [None, 'build', 'qa', 'review']:
            raise ValueError('invalid card lane')
        if card['status'] == 'Ready' and card.get('lane') == 'review':
            raise ValueError('a Ready card must enter build or qa')
    workers = config.get('max_workers', 0)
    if type(workers) is not int or workers < 0:
        raise ValueError('max_workers must be a non-negative integer')
    workers = workers or max(1, min(16, (os.cpu_count() or 2) - 2))
    root = Path(subprocess.check_output(['git', 'rev-parse', '--show-toplevel'], text=True).strip()).resolve()
    configured = (config.get(backend_name) or {}).get('model')
    flag_prefix = f'--{backend_name}='
    pinned = backend_flag.startswith(flag_prefix) or (isinstance(configured, str) and configured.strip())
except (OSError, ValueError, subprocess.CalledProcessError) as error:
    parser.error(str(error))
readiness = launcher.with_name('super-board-verification-ready.py')
if subprocess.run([sys.executable, str(readiness), '--config', str(config_path)]).returncode:
    result = json.dumps({'cards': [dict(number=c['number'], finalStatus='halted', lastLane='none',
                                       column=c['status'], detail='verification-readiness: repair verify_commands and restart explicitly',
                                       prUrl=None, priorFindings=None, lanesRun='none:halted') for c in cards], 'halted': True})
    if output_path:
        output_path.write_text(result + '\n')
    print(result)
    sys.exit(9)
os.chdir(root)
resolver_path = launcher.with_name('super-board-skills-ready.py')
try:
    spec = importlib.util.spec_from_file_location('skills_ready', resolver_path)
    resolver = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(resolver)
    resolver.hydrate(cards, root)
    skills = resolver.report(root, backend_name, cards, home=os.environ.get('SUPER_BOARD_SKILLS_HOME'),
                             catalog=os.environ.get('SUPER_BOARD_SKILLS_CATALOG'))
except SystemExit as error:
    code, detail = error.code, 'required GitHub reads halted while hydrating skills; preserve claims and worktrees'
except (OSError, ValueError, TypeError, KeyError) as error:
    code, detail = 64, 'skills-readiness: ' + str(error)
else:
    code = 0 if skills['ready'] else 10
    detail = 'skills-readiness: missing ' + ', '.join(dict.fromkeys(e['name'] for e in skills['entries'] if e['status'] == 'missing'))
if code:
    result = json.dumps(dict(cards=[dict(number=c['number'], finalStatus='halted', lastLane='none', column=c['status'],
                                       detail=detail, prUrl=None, priorFindings=None, lanesRun='none:halted') for c in cards], halted=True))
    if output_path:
        output_path.write_text(result + '\n')
    print(result)
    sys.exit(code)
readiness_halted = threading.Event()
skills_halted = threading.Event()
halted = threading.Event()
mutex = threading.RLock()
active = set()
inflight = root / '.claude/super-board/inflight'
codex_marker = root / '.claude/super-board/codex-wave.pid'
ag_marker = root / '.claude/super-board/antigravity-wave.pid'
marker = ag_marker if backend_name == 'antigravity' else codex_marker
inflight.mkdir(parents=True, exist_ok=True)
owner = str(os.getpid())

if codex_marker.exists() or ag_marker.exists():
    detail = f'{backend_name.capitalize()} wave PID marker exists; another wave is already in progress. Reconcile the previous wave before starting another'
    result = json.dumps(dict(cards=[dict(number=c['number'], finalStatus='halted', lastLane='none', column=c['status'],
                                       detail=detail, prUrl=None, priorFindings=None, lanesRun='none:halted') for c in cards], halted=True))
    if output_path:
        output_path.write_text(result + '\n')
    print(result)
    sys.exit(1)

def cancel(signum, frame):
    halted.set()
    with mutex:
        processes = list(active)
        for process in processes:
            try:
                platform_mod.terminate_tree(process, force=False)
            except Exception:
                pass
    time.sleep(2)
    for process in processes:
        try:
            platform_mod.terminate_tree(process, force=True)
        except Exception:
            pass

signal.signal(signal.SIGTERM, cancel)
signal.signal(signal.SIGINT, cancel)
try:
    with marker.open('x') as stream:
        stream.write(owner + '\n')
except FileExistsError:
    detail = f'{backend_name.capitalize()} wave PID marker exists; another wave is already in progress. Reconcile the previous wave before starting another'
    result = json.dumps(dict(cards=[dict(number=c['number'], finalStatus='halted', lastLane='none', column=c['status'],
                                       detail=detail, prUrl=None, priorFindings=None, lanesRun='none:halted') for c in cards], halted=True))
    if output_path:
        output_path.write_text(result + '\n')
    print(result)
    sys.exit(1)

ROUTER_MODEL = 'gemini-3.8-flash' if backend_name == 'antigravity' else 'gpt-6-luna'
GRADE_SCHEMA = {'type': 'object', 'additionalProperties': False, 'required': ['complexity'],
                'properties': {'complexity': {'type': 'string', 'enum': ['low', 'medium', 'high']}}}

def grade(card):
    """Return (complexity or None, halted). A failed grade falls back to the medium cell."""
    if pinned or card['status'] != 'Ready':
        return card.get('complexity') if card.get('complexity') in ['low', 'medium', 'high'] else None, False
    if card.get('complexity') in ['low', 'medium', 'high']:
        return card['complexity'], False

    if backend_name == 'antigravity':
        title = f"[super-board] #{card['number']} grade"
        prompt = (
            f"You are a router evaluating task complexity for GitHub issue #{card['number']}.\n"
            f"Title: {card.get('title', '')}\n"
            f"Labels: {', '.join(str(l) for l in card.get('labels', []))}\n"
            f"Body:\n{card.get('body', '')}\n\n"
            "Evaluate the complexity of this task as exactly one of: 'low', 'medium', 'high'.\n"
            "Return ONLY a single JSON object conforming to:\n"
            '{"complexity": "low" | "medium" | "high"}\n'
            "Do not execute any tools, read/write files, or output any conversational text or markdown code fences."
        )
        cmd = t3_mod.start_command(root, ROUTER_MODEL, title=title)
        with mutex:
            if halted.is_set():
                return None, True
            try:
                process = subprocess.Popen(
                    cmd,
                    stdin=subprocess.PIPE,
                    stdout=subprocess.PIPE,
                    stderr=subprocess.PIPE,
                    text=True,
                    encoding='utf-8',
                    **platform_mod.group_popen_kwargs()
                )
            except OSError:
                return None, False
            active.add(process)
        try:
            stdout, _ = process.communicate(prompt)
        finally:
            with mutex:
                active.discard(process)
        if process.returncode != 0:
            return None, False
        try:
            envelope = json.loads(stdout.strip()) if stdout.strip() else {}
            reply = envelope.get('reply', '')
            obj = t3_mod.last_json_object(reply)
            if obj and obj.get('complexity') in ['low', 'medium', 'high']:
                return obj['complexity'], False
        except Exception:
            pass
        return None, False

    prompt = (f"Read GitHub issue #{card['number']} (\"{card.get('title', '')}\") - body and all comments - with "
              f".claude/bin/super-board-github-read.py --kind issue -- issue view {card['number']} --json number,title,body and "
              f"--kind comments -- api repos/{{owner}}/{{repo}}/issues/{card['number']}/comments --paginate --slurp. "
              'Grade complexity (low|medium|high) by the scope of change required. Read only: change no file, '
              'label, comment or board state. Exit 79 from the read helper means stop and return nothing.\n')
    with tempfile.TemporaryDirectory(prefix='super-board-codex-grade-') as temporary:
        schema_path, output = Path(temporary) / 'schema.json', Path(temporary) / 'grade.json'
        schema_path.write_text(json.dumps(GRADE_SCHEMA))
        command = ['codex', 'exec', '-m', ROUTER_MODEL, '-C', str(root), '-c', 'approval_policy="never"',
                   '-c', 'default_permissions="super-board-grade"',
                   '-c', 'permissions.super-board-grade.filesystem={":root"="read", ":slash_tmp"="write", ":tmpdir"="write"}',
                   '-c', 'permissions.super-board-grade.network.enabled=true',
                   '--output-schema', str(schema_path), '--output-last-message', str(output), '-']
        with mutex:
            if halted.is_set():
                return None, True
            try:
                process = subprocess.Popen(
                    command,
                    stdin=subprocess.PIPE,
                    stdout=subprocess.DEVNULL,
                    text=True,
                    encoding='utf-8',
                    **platform_mod.group_popen_kwargs()
                )
            except OSError:
                return None, False
            active.add(process)
        try:
            process.communicate(prompt)
        finally:
            with mutex:
                active.discard(process)
        if process.returncode == 79:
            return None, True
        try:
            value = json.loads(output.read_text()).get('complexity')
        except (OSError, ValueError, AttributeError):
            return None, False
        return (value if value in ['low', 'medium', 'high'] else None), False

def run_card(card):
    complexity, stop = grade(card)
    if stop:
        halted.set()
        return dict(number=card['number'], finalStatus='halted', lastLane='none', column=card['status'],
                    detail='run halted while grading; preserve claims and worktrees', prUrl=None,
                    priorFindings=None, lanesRun='none:halted')
    labels = [str(label).lower() for label in card.get('labels', [])]
    first = card.get('lane') or ('qa' if 'qa' in labels else 'build')
    entry = 'review' if card['status'] == 'Review' else 'qa' if card['status'] == 'QA' else first
    lanes = ['build', 'qa', 'review'][['build', 'qa', 'review'].index(entry):]
    history = []
    current = dict(card)
    for lane in lanes:
        with mutex:
            if halted.is_set():
                history.append(dict(lane='none', status='halted', column=current['status'], detail='run halted; preserve claims and worktrees'))
                break
            boundary = resolver.report(root, backend_name, [current], lane=lane,
                                       home=os.environ.get('SUPER_BOARD_SKILLS_HOME'), catalog=os.environ.get('SUPER_BOARD_SKILLS_CATALOG'))
            if not boundary['ready']:
                skills_halted.set()
                halted.set()
                history.append(dict(lane=lane, status='halted', column=current['status'],
                                    detail='skills-readiness: missing ' + ', '.join(e['name'] for e in boundary['entries'] if e['status'] == 'missing')))
                break
            process = None
            lock = inflight / str(card['number'])
            try:
                cmd = [platform_mod.posix_bash(), str(launcher), '--backend', backend_name, '--config', str(config_path),
                       '--card', json.dumps(current), '--lane', lane, backend_flag,
                       '--tier', args.tier] + (['--complexity', complexity] if complexity else [])
                process = subprocess.Popen(
                    cmd,
                    stdout=subprocess.PIPE,
                    text=True,
                    encoding='utf-8',
                    **platform_mod.group_popen_kwargs()
                )
                active.add(process)
                lock.write_text(f'PID={process.pid}\nLANE={lane}\nSTARTED={time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())}\n')
            except OSError as error:
                if process is not None:
                    try:
                        platform_mod.terminate_tree(process, force=True)
                    except Exception:
                        pass
                    process.wait()
                    active.discard(process)
                history.append(dict(lane=lane, status='failed', column=current['status'],
                                    detail=f'could not start {lane} lane: {error}'))
                break
        preserve_lock = False
        try:
            stdout, _ = process.communicate()
            if process.returncode in (9, 10, 79):
                preserve_lock = True
                if process.returncode == 9:
                    readiness_halted.set()
                elif process.returncode == 10:
                    skills_halted.set()
                else:
                    halted.set()
            try:
                result = json.loads(stdout)
                if (not isinstance(result, dict) or result.get('status') not in
                    ['advanced', 'bounced', 'blocked', 'human-gate', 'failed', 'halted']
                    or not all(isinstance(result.get(key), str) for key in ['column', 'detail'])):
                    raise ValueError('invalid lane result')
                if process.returncode and result['status'] != 'halted':
                    raise ValueError(f'lane exited {process.returncode}')
            except (ValueError, TypeError):
                result = dict(status='halted' if process.returncode in (9, 10, 79) or halted.is_set() else 'failed',
                              column=current['status'], detail=f'{lane} lane returned no valid result (exit {process.returncode})')
            with mutex:
                if result['status'] == 'halted':
                    halted.set()
                active.discard(process)
            history.append(dict(lane=lane, **result))
            if result['status'] != 'advanced':
                break
            expected = {'build': 'QA', 'qa': 'Review', 'review': 'Done'}[lane]
            if result['column'] != expected:
                history[-1].update(status='failed', detail=f'{lane} claimed advanced without reaching {expected}')
                break
            current['status'] = result['column']
            current.pop('lane', None)
        finally:
            try:
                if not preserve_lock and lock.read_text().startswith(f'PID={process.pid}\n'):
                    lock.unlink()
            except (FileNotFoundError, OSError):
                pass
    last = history[-1]
    return dict(number=card['number'], finalStatus=last['status'], lastLane=last['lane'],
                column=last['column'], detail=last['detail'], prUrl=last.get('prUrl'),
                priorFindings=last.get('priorFindings'),
                lanesRun=' → '.join(f"{item['lane']}:{item['status']}" for item in history))

try:
    with ThreadPoolExecutor(max_workers=workers) as pool:
        summaries = list(pool.map(run_card, cards))
    result = json.dumps(dict(cards=summaries, halted=halted.is_set()))
    if output_path:
        output = output_path
        temporary = output.with_name(output.name + f'.{owner}.tmp')
        temporary.write_text(result + '\n')
        temporary.replace(output)
    print(result)
finally:
    if marker.exists() and marker.read_text().strip() == owner:
        marker.unlink()
sys.exit(10 if skills_halted.is_set() else 9 if readiness_halted.is_set() else 79 if halted.is_set() else 0)
PY
