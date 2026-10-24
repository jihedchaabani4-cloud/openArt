#!/usr/bin/env node
'use strict';
// UI ratchet for my-app: the number of "style decisions made in the wrong place" can only go DOWN.
//   node scripts/ui-check.cjs                    check (default), fails on NEW violations
//   node scripts/ui-check.cjs --report           list all current violations
//   node scripts/ui-check.cjs --init-baseline    create ui-baseline.json (once; a human reviews the counts)
//   node scripts/ui-check.cjs --shrink-baseline  lower the baseline after cleaning screens (never raises)
// Edit the two lists below once the primitives/tokens folders exist (ask the human).
const fs = require('fs');
const path = require('path');
const ratchet = require('./lib/ratchet.cjs');

const ROOT = path.resolve(__dirname, '..');
const BASELINE = path.join(ROOT, 'ui-baseline.json');
const SRC_DIRS = ['src', 'app', 'components', 'pages'];
const TOKEN_FILES = ['globals.css', 'tokens', 'tailwind.config', 'theme'];       // may contain raw colors
const PRIMITIVE_DIRS = ['components/ui/', 'components/primitives/'];              // may contain raw <button>
const SKIP = new Set(['node_modules', '.next', '.git', 'coverage', 'dist', 'build', 'out']);
const rel = (p) => path.relative(ROOT, p).split(path.sep).join('/');
const isComment = (l) => /^\s*(\/\/|\/\*|\*)/.test(l);

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) { if (!SKIP.has(e.name) && e.name !== '__tests__') walk(full, out); }
    else if (/\.(jsx?|tsx?|css|mjs)$/.test(e.name) && !/\.(test|spec)\./.test(e.name)) out.push(full);
  }
  return out;
}

const RULES = [
  { id: 'U1', desc: 'raw color literal (#hex, rgb(), hsl()) outside token files', ext: /\.(jsx?|tsx?|css)$/,
    skip: (r) => TOKEN_FILES.some((t) => r.includes(t)),
    re: /#(?:[0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{3,4})\b|\b(?:rgba?|hsla?)\(\s*\d/g },
  { id: 'U2', desc: 'Tailwind arbitrary value (w-[437px], p-[13px], ...)', ext: /\.(jsx?|tsx?)$/,
    re: /(?<![\w-])(?!(?:data|aria|supports|has|group|peer|min|max|nth)-)[a-z][a-z0-9-]*-\[[^\]\s]+\]/g },
  { id: 'U3', desc: 'raw <button> outside the primitives folder (use the Button primitive)', ext: /\.(jsx?|tsx?)$/,
    skip: (r) => PRIMITIVE_DIRS.some((p) => r.includes(p)), re: /<button\b/g },
  { id: 'U4', desc: 'fetch( inside components/ (use the API client or a hook)', ext: /\.(jsx?|tsx?)$/,
    only: (r) => /(^|\/)components\//.test(r), re: /\bfetch\s*\(/g },
  { id: 'U5', desc: 'inline style={{ }} (use tokens/classes; allowed only for truly dynamic values)', ext: /\.(jsx?|tsx?)$/,
    re: /style=\{\{/g },
];

function collect() {
  const violations = [];
  const seen = new Set();
  for (const d of SRC_DIRS) {
    for (const f of walk(path.join(ROOT, d))) {
      if (seen.has(f)) continue;
      seen.add(f);
      const r = rel(f);
      const lines = fs.readFileSync(f, 'utf8').split(/\r?\n/);
      for (const rule of RULES) {
        if (!rule.ext.test(f) || (rule.skip && rule.skip(r)) || (rule.only && !rule.only(r))) continue;
        lines.forEach((l, i) => {
          if (isComment(l)) return;
          const m = l.match(rule.re);
          if (m) m.forEach(() => violations.push({ rule: rule.id, key: `${rule.id}|${r}`, detail: `${r}:${i + 1}  ${l.trim().slice(0, 100)}` }));
        });
      }
    }
  }
  return violations;
}

function summary(violations, baseline, fresh) {
  const now = {}; const base = {}; const neu = {};
  for (const v of violations) now[v.rule] = (now[v.rule] || 0) + 1;
  for (const [k, n] of Object.entries(baseline || {})) base[k.split('|')[0]] = (base[k.split('|')[0]] || 0) + n;
  for (const x of fresh) neu[x.key.split('|')[0]] = (neu[x.key.split('|')[0]] || 0) + (x.found - x.allowed);
  console.log('Rule   Now  Baseline  New  Description');
  for (const r of RULES) console.log(`${r.id.padEnd(5)} ${String(now[r.id] || 0).padStart(4)}  ${String(base[r.id] || 0).padStart(8)}  ${String(neu[r.id] || 0).padStart(3)}  ${r.desc}`);
}

function main() {
  const arg = process.argv[2] || '--check';
  const violations = collect();
  const counts = ratchet.countByKey(violations);
  if (arg === '--report') { violations.forEach((v) => console.log(`${v.rule} ${v.detail}`)); console.log(''); summary(violations, ratchet.loadBaseline(BASELINE), []); return 0; }
  if (arg === '--init-baseline') {
    if (fs.existsSync(BASELINE)) { console.error('ui-baseline.json already exists. Use --shrink-baseline.'); return 1; }
    ratchet.writeBaseline(BASELINE, counts); summary(violations, counts, []);
    console.log(`\nWrote ui-baseline.json (${Object.keys(counts).length} entries). Review before committing.`); return 0;
  }
  const baseline = ratchet.loadBaseline(BASELINE);
  if (!baseline) { console.error('No ui-baseline.json. A human must run: node scripts/ui-check.cjs --init-baseline'); return 1; }
  if (arg === '--shrink-baseline') {
    const next = ratchet.shrink(counts, baseline); ratchet.writeBaseline(BASELINE, next);
    console.log(`Baseline shrunk: ${Object.keys(baseline).length} -> ${Object.keys(next).length} entries (never raised).`); return 0;
  }
  const { fresh } = ratchet.compare(violations, baseline);
  summary(violations, baseline, fresh);
  if (fresh.length) {
    console.log('\nNEW UI VIOLATIONS (use a token/primitive; do NOT edit ui-baseline.json):');
    for (const f of fresh) { console.log(`  ${f.key}  allowed ${f.allowed}, found ${f.found}`); f.items.forEach((i) => console.log('    ' + i.detail)); }
    return 1;
  }
  console.log('\nui-check: OK (no new violations)');
  return 0;
}
process.exit(main());
