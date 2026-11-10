#!/usr/bin/env bash
# Thin wrapper around super-board-codex-wave.sh enforcing the --antigravity backend.
set -euo pipefail
if ! [[ " $* " =~ " --antigravity" ]]; then
  echo "Usage: super-board-antigravity-wave.sh --antigravity[=<model>] ..." >&2
  exit 2
fi
exec bash "$(dirname "${BASH_SOURCE[0]}")/super-board-codex-wave.sh" "$@"
