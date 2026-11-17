#!/usr/bin/env bash
# Zero-legacy CSS gate (from total_css_purge_prompt.md). Exits 1 on any violation.
# Uses grep (not rg) so it runs in Git Bash on Windows too.
set -uo pipefail
cd "$(dirname "$0")/.."

ALLOW_CSS_FILE="src/app/globals.css"
FAILED=0
# Tests assert on class strings / fixtures; the gate polices shipped code.
EXCL=(--exclude=*.test.js --exclude=*.test.jsx --exclude=*.test.ts --exclude=*.test.tsx --exclude-dir=__tests__)
# Folder palette = user data: `hex` values are persisted on folders and matched by value.
DATA=(--exclude=folder-color-tokens.js)

echo "🔍 Checking for leftover legacy CSS files..."
EXTRA_CSS=$(find src -type f \( -name "*.css" -o -name "*.scss" -o -name "*.sass" -o -name "*.less" \) ! -path "$ALLOW_CSS_FILE")
if [ -n "$EXTRA_CSS" ]; then
  echo "❌ Found unauthorized stylesheet files (must be deleted):"
  echo "$EXTRA_CSS"
  FAILED=1
fi

echo "🔍 Checking for legacy prefixes (--qc-, --hf-, .q-, .hf-)..."
if grep -rnE "${EXCL[@]}" -e "(--qc-|--hf-|\.q-|\.hf-|#d1fe17)" src/; then
  echo "❌ Found legacy design tokens/classes."
  FAILED=1
fi

echo "🔍 Checking for hardcoded hex colors outside $ALLOW_CSS_FILE..."
if grep -rnE "${EXCL[@]}" "${DATA[@]}" --exclude=globals.css -e "#[0-9a-fA-F]{3,8}\b" src/ | grep -vE "url\(#|href=\"#"; then
  echo "❌ Found hardcoded hex colors in components/pages. Use CSS tokens or .ds-* classes instead."
  FAILED=1
fi

echo "🔍 Checking for arbitrary Tailwind gray/slate/zinc color classes..."
if grep -rnE "${EXCL[@]}" "${DATA[@]}" -e "\b(bg|text|border|ring)-(slate|gray|neutral|zinc|stone)-[0-9]+" src/; then
  echo "❌ Found arbitrary Tailwind gray/slate classes. Use .ds-* classes or DESIGN.md tokens."
  FAILED=1
fi

echo "🔍 Checking for inline style={{ color / background / border }}..."
if grep -rnE "style=\{\{[^}]*(color|background|borderColor|borderRadius)" src/ "${EXCL[@]}"; then
  echo "❌ Found inline visual styles. Move to $ALLOW_CSS_FILE."
  FAILED=1
fi

if [ "$FAILED" -ne 0 ]; then
  echo "💥 PURGE GATE FAILED. Fix all violations above."
  exit 1
fi

echo "✅ ZERO LEGACY CSS DETECTED — 100% DESIGN.md TOKEN COMPLIANCE!"
