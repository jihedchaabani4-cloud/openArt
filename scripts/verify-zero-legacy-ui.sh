#!/usr/bin/env bash
set -euo pipefail

echo "=========================================================="
echo " Running Automated Zero-Residue Design System Verification"
echo "=========================================================="

FAILED=0

fail_check() {
  echo "❌ FAILED: $1"
  FAILED=1
}

pass_check() {
  echo "✅ PASSED: $1"
}

# 1. Check for legacy CSS variable prefixes (--qc-, --hf-, --mat-)
if grep -rnE "(--qc-|--hf-|--mat-)" src/ --exclude-dir=node_modules 2>/dev/null; then
  fail_check "Found legacy CSS variables (--qc-, --hf-, --mat-)"
else
  pass_check "Zero legacy CSS variables found"
fi

# 2. Check for legacy class prefixes (.q-, .hf-)
if grep -rnE "((\.|\"|')q-[a-zA-Z]|(\.|\"|')hf-[a-zA-Z])" src/ --exclude-dir=node_modules 2>/dev/null; then
  fail_check "Found legacy class prefixes (.q-, .hf-)"
else
  pass_check "Zero legacy class prefixes found"
fi

# 3. Check for banned hardcoded hex colors (#d1fe17, #EFFE17, #0f1113, #131416, #1c1e20, #282a2c)
if grep -rnEi "(#d1fe17|#effe17|#0f1113|#131416|#1c1e20|#282a2c)" src/ --exclude-dir=node_modules 2>/dev/null; then
  fail_check "Found banned hardcoded hex colors"
else
  pass_check "Zero banned hardcoded hex colors found"
fi

# 4. Check for generic Tailwind slate/gray classes
if grep -rnE "\b(bg|text|border|ring|divide)-(slate|gray)-" src/ --exclude-dir=node_modules 2>/dev/null; then
  fail_check "Found generic Tailwind slate/gray classes"
else
  pass_check "Zero generic Tailwind slate/gray classes found"
fi

# 5. Check for deleted legacy file references
if grep -rnE "(google-flow-tokens|saas-tokens)" src/ --exclude-dir=node_modules 2>/dev/null; then
  fail_check "Found references to deleted legacy token files"
else
  pass_check "Zero references to deleted legacy token files"
fi

echo "=========================================================="
if [ $FAILED -ne 0 ]; then
  echo "❌ Verification FAILED with legacy residues!"
  exit 1
else
  echo "🎉 All Zero-Residue verification gates PASSED!"
  exit 0
fi
