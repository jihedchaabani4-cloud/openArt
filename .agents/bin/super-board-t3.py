#!/usr/bin/env python3
"""super-board-t3.py — T3 CLI driver and structured lane extraction for Antigravity.

Provides:
- resolve_t3_bin(): locates the t3 executable across environment variables and PATH
- start_command(root, model, title): builds the t3 thread start argument list
- last_json_object(text): locates the last balanced {...} in text, ignoring braces in strings
- extract_result(stdout, column=""): extracts and validates lane JSON from t3 output
- CLI:
    super-board-t3.py [--project <path>] check / --check
    super-board-t3.py [--project <path>] wait-idle --issue <n> --timeout <s>
"""
from __future__ import annotations

import argparse
import json
import os
import re
import shutil
import subprocess
import sys
import time
from pathlib import Path


def resolve_t3_bin() -> str:
    """Resolve the t3 CLI binary path according to precedence order:
    1. SUPER_BOARD_T3_BIN
    2. T3CODE_CLI_PATH
    3. User home directory ~/.t3/bin/t3.cmd (Windows) or ~/.t3/bin/t3
    4. PATH lookup for t3.cmd / t3
    """
    for env_var in ("SUPER_BOARD_T3_BIN", "T3CODE_CLI_PATH"):
        val = os.environ.get(env_var)
        if val:
            if sys.platform == "win32" and re.match(r"^/[a-zA-Z]/", val):
                val = val[1] + ":" + val[2:]
            if os.path.isfile(val) or shutil.which(val):
                return os.path.abspath(val) if os.path.isfile(val) else val
            if sys.platform == "win32" and not val.lower().endswith((".cmd", ".bat", ".exe")):
                for ext in (".cmd", ".bat", ".exe"):
                    if os.path.isfile(val + ext):
                        return os.path.abspath(val + ext)

    home_env = os.environ.get("USERPROFILE") if sys.platform == "win32" else os.environ.get("HOME")
    if not home_env:
        home_env = os.environ.get("HOME") or os.environ.get("USERPROFILE")
    if home_env:
        try:
            home = Path(home_env).expanduser()
            if sys.platform == "win32":
                candidate = home / ".t3" / "bin" / "t3.cmd"
                if candidate.is_file():
                    return str(candidate)
            else:
                candidate = home / ".t3" / "bin" / "t3"
                if candidate.is_file():
                    return str(candidate)
        except Exception:
            pass

    which_t3 = shutil.which("t3.cmd" if sys.platform == "win32" else "t3") or shutil.which("t3")
    if which_t3:
        return which_t3

    raise FileNotFoundError("t3 CLI not found; set T3CODE_CLI_PATH or SUPER_BOARD_T3_BIN")


def start_command(root: Path | str, model: str, title: str) -> list[str]:
    """Construct argument list for t3 thread start."""
    t3_bin = resolve_t3_bin()
    return [
        t3_bin,
        "thread",
        "start",
        "--provider",
        "antigravity",
        "--model",
        model,
        "--title",
        title,
        "--wait",
        "--json",
        str(root),
        "-",
    ]


def last_json_object(text: str) -> str | None:
    """Find the last balanced {...} substring in text, ignoring braces inside strings."""
    if not text:
        return None

    # Scan from the right to find matching closing and opening braces
    closing_indices = [i for i, ch in enumerate(text) if ch == '}']
    for end_idx in reversed(closing_indices):
        depth = 0
        in_string = False
        escape = False
        start_idx = -1

        for i in range(end_idx, -1, -1):
            ch = text[i]
            # When scanning backwards, handle string escapes simply:
            # Check if this character is a quote not escaped from preceding backslashes
            if ch == '"':
                # Count consecutive backslashes preceding this quote
                bs_count = 0
                k = i - 1
                while k >= 0 and text[k] == '\\':
                    bs_count += 1
                    k -= 1
                if bs_count % 2 == 0:
                    in_string = not in_string

            if not in_string:
                if ch == '}':
                    depth += 1
                elif ch == '{':
                    depth -= 1
                    if depth == 0:
                        start_idx = i
                        break

        if start_idx != -1 and depth == 0:
            candidate = text[start_idx : end_idx + 1]
            try:
                parsed = json.loads(candidate)
                if isinstance(parsed, dict):
                    return candidate
            except json.JSONDecodeError:
                continue

    return None


def extract_result(stdout: str, column: str = "") -> str:
    """Extract lane result JSON string from t3 thread start output.
    Synthesizes compliant lane payload on failure or quota exhaustion.
    """
    def fallback(status: str, detail: str) -> str:
        return json.dumps({
            "status": status,
            "column": column,
            "detail": detail,
            "prUrl": None,
            "branch": None,
            "priorFindings": None,
        })

    if not stdout or not stdout.strip():
        return fallback("failed", "empty output from t3 thread start")

    try:
        envelope = json.loads(stdout.strip())
    except json.JSONDecodeError:
        # Might be wrapped in noise; try finding envelope JSON
        cand = last_json_object(stdout)
        if cand:
            try:
                envelope = json.loads(cand)
            except Exception:
                return fallback("failed", f"t3 output not valid JSON: {stdout[:200]}")
        else:
            return fallback("failed", f"t3 output not valid JSON: {stdout[:200]}")

    if not isinstance(envelope, dict):
        return fallback("failed", f"t3 output was not a JSON object: {stdout[:200]}")

    thread_id = envelope.get("threadId", "unknown")
    run_status = envelope.get("status")
    run_error = envelope.get("error")

    # Check for quota exhaustion
    err_str = str(run_error or "") + " " + str(envelope.get("reply") or "")
    if any(q in err_str.upper() for q in ("RESOURCE_EXHAUSTED", "429", "QUOTA EXCEEDED", "QUOTA_EXHAUSTED")):
        return fallback("halted", f"quota-exhausted: {run_error or 'HTTP 429 quota exceeded'}")

    if run_status != "completed" or run_error is not None:
        return fallback("failed", f"t3 thread {thread_id} failed: {run_error or run_status}")

    reply = envelope.get("reply", "")
    if not reply:
        return fallback("failed", f"t3 thread {thread_id} emitted empty reply")

    # Locate the JSON object within reply (handling code fences or surrounding prose)
    clean_reply = re.sub(r"^```(?:json)?\s*", "", reply.strip())
    clean_reply = re.sub(r"\s*```$", "", clean_reply.strip())

    cand = last_json_object(clean_reply) or last_json_object(reply)
    if not cand:
        return fallback("failed", f"t3 thread {thread_id} emitted unparseable reply")

    try:
        result = json.loads(cand)
    except json.JSONDecodeError:
        return fallback("failed", f"t3 thread {thread_id} emitted unparseable JSON")

    if not isinstance(result, dict):
        return fallback("failed", f"t3 thread {thread_id} emitted non-dict JSON")

    valid_statuses = {"advanced", "bounced", "blocked", "human-gate", "failed", "halted"}
    if "status" not in result or result["status"] not in valid_statuses:
        return fallback("failed", f"t3 thread {thread_id} emitted invalid status: {result.get('status')}")

    # Ensure required conforming schema fields
    if "column" not in result or not isinstance(result.get("column"), str):
        result["column"] = column
    if "detail" not in result:
        result["detail"] = ""
    if "prUrl" not in result:
        result["prUrl"] = None
    if "branch" not in result:
        result["branch"] = None
    if "priorFindings" not in result:
        result["priorFindings"] = None

    return json.dumps(result)


def check_t3(project_root: Path | str) -> int:
    """Run check command. Exits 0 on success, 69 if t3 is unreachable or failed."""
    try:
        t3_bin = resolve_t3_bin()
    except FileNotFoundError as err:
        print(f"t3 check failed: {err}", file=sys.stderr)
        return 69

    cmd = [t3_bin, "thread", "list", "--project", str(project_root), "--json"]
    try:
        res = subprocess.run(cmd, stdin=subprocess.DEVNULL, capture_output=True, text=True, encoding="utf-8")
        if res.returncode == 0:
            return 0
        print(f"t3 check failed: {res.stderr or res.stdout}".strip(), file=sys.stderr)
        return 69
    except Exception as err:
        print(f"t3 check failed: {err}", file=sys.stderr)
        return 69


def wait_idle(project_root: Path | str, issue: int | str, timeout: float = 60.0) -> int:
    """Poll t3 thread list every 3 seconds for threads whose title starts with
    '[super-board] #<issue> ' and whose status is 'running'.
    Returns 0 when none are running.
    Returns 1 on timeout with lingering thread details.
    Returns 69 if t3 is unreachable.
    """
    try:
        t3_bin = resolve_t3_bin()
    except FileNotFoundError as err:
        print(f"t3 wait-idle failed: {err}", file=sys.stderr)
        return 69

    prefix = f"[super-board] #{issue} "
    start_time = time.time()

    while True:
        cmd = [t3_bin, "thread", "list", "--project", str(project_root), "--json"]
        try:
            res = subprocess.run(cmd, stdin=subprocess.DEVNULL, capture_output=True, text=True, encoding="utf-8")
            if res.returncode != 0:
                print(f"t3 unreachable: {res.stderr or res.stdout}".strip(), file=sys.stderr)
                return 69
            threads = json.loads(res.stdout or "[]")
        except Exception as err:
            print(f"t3 unreachable: {err}", file=sys.stderr)
            return 69

        running = [
            t for t in threads
            if str(t.get("title", "")).startswith(prefix) and t.get("status") == "running"
        ]

        if not running:
            return 0

        if time.time() - start_time >= timeout:
            for t in running:
                print(f"lingering thread {t.get('threadId')}: {t.get('title')}")
            return 1

        time.sleep(min(3.0, max(0.5, timeout - (time.time() - start_time))))


def main():
    parser = argparse.ArgumentParser(description="super-board-t3 helper CLI")
    parser.add_argument("--project", default=str(Path.cwd()), help="Path to project root")
    parser.add_argument("--check", action="store_true", help="Alias for check command")

    subparsers = parser.add_subparsers(dest="command")
    subparsers.add_parser("check", help="Verify t3 connection")

    wait_parser = subparsers.add_parser("wait-idle", help="Wait for issue threads to finish")
    wait_parser.add_argument("--issue", required=True, help="Issue number")
    wait_parser.add_argument("--timeout", type=float, default=60.0, help="Timeout in seconds")

    args = parser.parse_args()

    if args.check or args.command == "check":
        sys.exit(check_t3(args.project))

    if args.command == "wait-idle":
        sys.exit(wait_idle(args.project, args.issue, args.timeout))

    parser.print_help(sys.stderr)
    sys.exit(64)


if __name__ == "__main__":
    main()
