import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(process.cwd(), 'src');
let failed = false;

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      if (file !== 'node_modules') {
        results = results.concat(walk(fullPath));
      }
    } else if (/\.(js|jsx|ts|tsx|css|json)$/.test(file)) {
      results.push(fullPath);
    }
  }
  return results;
}

const files = walk(ROOT);

const checks = [
  {
    id: 'CSS Variables',
    pattern: /(--qc-|--hf-|--mat-)/,
    desc: 'Legacy CSS variable prefixes (--qc-, --hf-, --mat-)',
  },
  {
    id: 'Classes',
    pattern: /(?:[\.\s"']q-[a-zA-Z]|[\.\s"']hf-[a-zA-Z])/,
    desc: 'Legacy class prefixes (.q-, .hf-)',
  },
  {
    id: 'Banned Hex',
    pattern: /(#d1fe17|#effe17|#0f1113|#131416|#1c1e20|#282a2c)/i,
    desc: 'Banned hardcoded hex colors (#d1fe17, #0f1113, etc.)',
  },
  {
    id: 'Generic Grays',
    pattern: /\b(?:bg|text|border|ring|divide)-(?:slate|gray)-\d+\b/,
    desc: 'Generic Tailwind slate/gray classes',
  },
  {
    id: 'Deleted Files',
    pattern: /(google-flow-tokens|saas-tokens)/,
    desc: 'References to deleted legacy token files',
  },
];

console.log('==========================================================');
console.log(' Running Automated Zero-Residue Design System Verification');
console.log('==========================================================');

const violations = {};

for (const check of checks) {
  violations[check.id] = [];
}

for (const file of files) {
  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split('\n');
  lines.forEach((line, index) => {
    for (const check of checks) {
      if (check.pattern.test(line)) {
        violations[check.id].push({
          file: path.relative(process.cwd(), file),
          line: index + 1,
          content: line.trim(),
        });
      }
    }
  });
}

for (const check of checks) {
  const count = violations[check.id].length;
  if (count > 0) {
    failed = true;
    console.error(`❌ FAILED: ${check.desc} (${count} occurrences)`);
    // print up to 5 examples
    violations[check.id].slice(0, 5).forEach((v) => {
      console.error(`   ${v.file}:${v.line} -> ${v.content.slice(0, 80)}`);
    });
  } else {
    console.log(`✅ PASSED: ${check.desc} (0 occurrences)`);
  }
}

console.log('==========================================================');
if (failed) {
  console.error('❌ Verification FAILED with legacy residues! (RED PHASE)');
  process.exit(1);
} else {
  console.log('🎉 All Zero-Residue verification gates PASSED! (GREEN PHASE)');
  process.exit(0);
}
