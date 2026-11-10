#!/usr/bin/env python3
"""Cross-platform process management and bash resolution for super-board."""

import argparse
import os
import signal
import subprocess
import sys
import shutil


def posix_bash() -> str:
    """Resolves an authentic POSIX/Git bash executable path across platforms."""
    custom = os.environ.get("SUPER_BOARD_BASH")
    if custom and os.path.isfile(custom):
        return custom

    if sys.platform == "win32":
        prog_files = os.environ.get("ProgramFiles", r"C:\Program Files")
        prog_files_x86 = os.environ.get("ProgramFiles(x86)", r"C:\Program Files (x86)")
        for candidate in [
            os.path.join(prog_files, "Git", "bin", "bash.exe"),
            os.path.join(prog_files_x86, "Git", "bin", "bash.exe"),
            os.path.join(prog_files, "Git", "usr", "bin", "bash.exe"),
        ]:
            if os.path.isfile(candidate):
                return candidate

        path_bash = shutil.which("bash")
        if path_bash and "system32" not in path_bash.lower():
            return path_bash

        return "bash"

    return shutil.which("bash") or "bash"


def group_popen_kwargs() -> dict:
    """Returns platform-specific popen keyword arguments for process group isolation."""
    if sys.platform == "win32":
        CREATE_NEW_PROCESS_GROUP = 0x00000200
        return {"creationflags": CREATE_NEW_PROCESS_GROUP}
    return {"start_new_session": True}


def terminate_tree(target, force: bool = False) -> None:
    """Terminates an entire process tree given a Popen object or an integer PID."""
    pid = target.pid if hasattr(target, "pid") else int(target)
    if sys.platform == "win32":
        cmd = ["taskkill", "/PID", str(pid), "/T"]
        if force:
            cmd.append("/F")
        try:
            subprocess.run(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        except Exception:
            pass
        return

    sig = getattr(signal, "SIGKILL", 9) if force else getattr(signal, "SIGTERM", 15)
    try:
        if os.getpgid(pid) == pid:
            os.killpg(pid, sig)
        elif hasattr(target, "kill") and force:
            target.kill()
        elif hasattr(target, "terminate") and not force:
            target.terminate()
        else:
            os.kill(pid, sig)
    except (ProcessLookupError, PermissionError):
        pass


def _pid_exists(pid: int) -> bool:
    """Checks whether a process with the given PID is currently alive."""
    if sys.platform == "win32":
        try:
            out = subprocess.check_output(
                ["tasklist", "/FI", f"PID eq {pid}", "/FO", "CSV", "/NH"],
                text=True,
                stderr=subprocess.DEVNULL,
            )
            return str(pid) in out
        except Exception:
            return False
    try:
        os.kill(pid, 0)
        return True
    except (ProcessLookupError, PermissionError):
        return False


def _get_process_args(pid: int) -> str:
    """Reads the full command line arguments of a live process by PID."""
    if not _pid_exists(pid):
        raise ProcessLookupError(f"Process {pid} does not exist")

    if sys.platform == "win32":
        ps_cmd = f'(Get-CimInstance Win32_Process -Filter "ProcessId = {pid}").CommandLine'
        out = subprocess.check_output(
            ["powershell", "-NoProfile", "-Command", ps_cmd],
            text=True,
            stderr=subprocess.DEVNULL,
        ).strip()
        return out

    out = subprocess.check_output(
        ["ps", "-p", str(pid), "-o", "args="],
        text=True,
        stderr=subprocess.DEVNULL,
    ).strip()
    return out


def main(argv=None):
    parser = argparse.ArgumentParser(description="Platform process management utility")
    subparsers = parser.add_subparsers(dest="command")

    kill_parser = subparsers.add_parser("kill-tree", help="Kill a process and its child processes")
    kill_parser.add_argument("pid", type=int, help="Process ID to kill")
    kill_parser.add_argument("--force", action="store_true", help="Force kill (/F or SIGKILL)")

    args_parser = subparsers.add_parser("process-args", help="Get command line arguments of a PID")
    args_parser.add_argument("pid", type=int, help="Process ID to inspect")

    args = parser.parse_args(argv)
    if args.command == "kill-tree":
        if not _pid_exists(args.pid):
            sys.stderr.write(f"kill-tree: PID {args.pid} does not exist\n")
            sys.exit(1)
        terminate_tree(args.pid, force=args.force)
        sys.exit(0)
    elif args.command == "process-args":
        try:
            line = _get_process_args(args.pid)
            if not line:
                sys.exit(1)
            print(line)
            sys.exit(0)
        except Exception as err:
            sys.stderr.write(f"process-args: {err}\n")
            sys.exit(1)
    else:
        parser.print_usage(sys.stderr)
        sys.exit(64)


if __name__ == "__main__":
    main()
