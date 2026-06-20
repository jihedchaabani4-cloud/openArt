const fs = require('fs');
const path = require('path');

const SRC_DIR = path.join(__dirname, '..', 'src');
const REPORT_JSON = path.join(__dirname, 'audit-report.json');
const REPORT_MD = path.join(__dirname, 'audit-report.md');

// Helper to recursively list files
function getFiles(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat && stat.isDirectory()) {
      results = results.concat(getFiles(filePath));
    } else {
      // Only audit JS, JSX, TS, TSX files
      if (/\.(js|jsx|ts|tsx)$/.test(file)) {
        results.push(filePath);
      }
    }
  });
  return results;
}

// Classify file type based on path and contents
function classifyFile(relativeRoute, content) {
  const normalized = relativeRoute.replace(/\\/g, '/');
  if (normalized.includes('/app/') || normalized.endsWith('page.js') || normalized.endsWith('page.jsx') || normalized.endsWith('layout.js')) {
    return 'page';
  }
  if (normalized.includes('/hooks/') || path.basename(normalized).startsWith('use')) {
    return 'hook';
  }
  if (normalized.includes('/api/') || normalized.includes('/services/')) {
    return 'service';
  }
  if (normalized.includes('/store/')) {
    return 'store';
  }
  if (normalized.includes('/components/') || normalized.includes('/ui/') || normalized.endsWith('.jsx') || normalized.endsWith('.tsx')) {
    return 'component';
  }
  return 'util';
}

// Perform static analysis on file content
function analyzeFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const relativePath = path.relative(path.join(__dirname, '..'), filePath).replace(/\\/g, '/');
  const fileType = classifyFile(relativePath, content);

  const violations = [];
  let hasMixedConcerns = false;

  // 1. Detect Direct Fetch / Axios calls
  // Allowed only in src/shared/api or src/features/*/api
  const isAllowedApiLocation = relativePath.includes('shared/api') || /\/api\/[a-zA-Z0-9]+\.js$/.test(relativePath);
  if (!isAllowedApiLocation) {
    const fetchMatches = [...content.matchAll(/fetch\s*\(/g)];
    fetchMatches.forEach(match => {
      const line = content.substring(0, match.index).split('\n').length;
      violations.push({
        type: 'DIRECT_FETCH',
        severity: 'HIGH',
        line: line,
        details: 'Direct fetch() call found outside shared api services.'
      });
      hasMixedConcerns = true;
    });

    const axiosMatches = [...content.matchAll(/axios\s*\./g)];
    axiosMatches.forEach(match => {
      const line = content.substring(0, match.index).split('\n').length;
      violations.push({
        type: 'DIRECT_FETCH',
        severity: 'HIGH',
        line: line,
        details: 'Direct axios call found outside shared api services.'
      });
      hasMixedConcerns = true;
    });
  }

  // 2. Detect direct AI SDK references
  const aiKeywords = ['@fal-ai/client', '@google/generative-ai', '@huggingface/inference', 'openai'];
  aiKeywords.forEach(keyword => {
    if (content.includes(keyword)) {
      const regex = new RegExp(keyword, 'g');
      const matches = [...content.matchAll(regex)];
      matches.forEach(match => {
        const line = content.substring(0, match.index).split('\n').length;
        violations.push({
          type: 'FRONTEND_AI_SDK',
          severity: 'HIGH',
          line: line,
          details: `Direct frontend import/usage of AI SDK: "${keyword}". Violation of Principle II.`
        });
      });
    }
  });

  // 3. Detect mixed UI and hook state dump/business logic
  if (fileType === 'component' || fileType === 'page') {
    // If component file is very large (> 400 lines), flag as God Component
    const lineCount = content.split('\n').length;
    if (lineCount > 400) {
      violations.push({
        type: 'GOD_COMPONENT',
        severity: 'MEDIUM',
        line: 1,
        details: `File has ${lineCount} lines. God component candidate; should be decomposed.`
      });
      hasMixedConcerns = true;
    }
  }

  // 4. Extract local dependencies (imports from src)
  const dependencies = [];
  const importRegex = /import\s+.*\s+from\s+['"]([^'"]+)['"]/g;
  let match;
  while ((match = importRegex.exec(content)) !== null) {
    const importPath = match[1];
    if (importPath.startsWith('.') || importPath.startsWith('#') || importPath.startsWith('shared/') || importPath.startsWith('features/') || importPath.startsWith('entities/')) {
      dependencies.push(importPath);
    }
  }

  return {
    filePath: relativePath,
    type: fileType,
    responsibility: `${fileType.toUpperCase()} file handling code`,
    hasMixedConcerns: hasMixedConcerns || violations.length > 0,
    violations: violations,
    dependencies: dependencies
  };
}

function runAudit() {
  console.log('Starting frontend architecture audit...');
  
  if (!fs.existsSync(SRC_DIR)) {
    console.error(`Error: Source directory ${SRC_DIR} not found.`);
    process.exit(1);
  }

  const files = getFiles(SRC_DIR);
  console.log(`Scanning ${files.length} files under src/...`);

  const fileAudits = files.map(file => analyzeFile(file));

  // Compute summary stats
  const totalFiles = fileAudits.length;
  const violationsCount = fileAudits.reduce((acc, f) => acc + f.violations.length, 0);
  const mixedConcernsCount = fileAudits.filter(f => f.hasMixedConcerns).length;

  const report = {
    summary: {
      totalFiles,
      violationsCount,
      mixedConcernsCount
    },
    files: fileAudits
  };

  // Write JSON report
  fs.writeFileSync(REPORT_JSON, JSON.stringify(report, null, 2));
  console.log(`Saved JSON report to ${REPORT_JSON}`);

  // Group violations into clusters
  const clusters = {
    'Direct API / Fetch Calls': [],
    'Frontend AI SDK Violations': [],
    'God Components / Mixed Concerns': [],
    'Other Concerns': []
  };

  fileAudits.forEach(file => {
    file.violations.forEach(v => {
      const entry = { filePath: file.filePath, line: v.line, details: v.details, severity: v.severity };
      if (v.type === 'DIRECT_FETCH') {
        clusters['Direct API / Fetch Calls'].push(entry);
      } else if (v.type === 'FRONTEND_AI_SDK') {
        clusters['Frontend AI SDK Violations'].push(entry);
      } else if (v.type === 'GOD_COMPONENT') {
        clusters['God Components / Mixed Concerns'].push(entry);
      } else {
        clusters['Other Concerns'].push(entry);
      }
    });
  });

  // Generate Markdown report
  let md = `# Architecture Audit Report: Labveil Frontend\n\n`;
  md += `**Date**: ${new Date().toISOString().split('T')[0]}\n`;
  md += `**Total Files Scanned**: ${totalFiles}\n`;
  md += `**Total Mixed Concerns Files**: ${mixedConcernsCount}\n`;
  md += `**Total Violations Detected**: ${violationsCount}\n\n`;

  md += `## Summary Dashboard\n\n`;
  md += `| Metric | Count |\n`;
  md += `|--------|-------|\n`;
  md += `| Files Scanned | ${totalFiles} |\n`;
  md += `| Files with Mixed Concerns | ${mixedConcernsCount} |\n`;
  md += `| Total Violations | ${violationsCount} |\n\n`;

  md += `## Problem Clusters\n\n`;

  for (const [clusterName, items] of Object.entries(clusters)) {
    md += `### ${clusterName} (${items.length} items)\n\n`;
    if (items.length === 0) {
      md += `*No violations found in this cluster.*\n\n`;
    } else {
      md += `| File Path | Line | Severity | Violation Details |\n`;
      md += `|-----------|------|----------|-------------------|\n`;
      items.forEach(item => {
        md += `| [\`${path.basename(item.filePath)}\`](file:///c:/Users/jihad/Desktop/open%20art/my-app/${item.filePath}#L${item.line}) | ${item.line} | **${item.severity}** | ${item.details} |\n`;
      });
      md += `\n`;
    }
  }

  md += `## File Classification Summary\n\n`;
  const typeCounts = {};
  fileAudits.forEach(file => {
    typeCounts[file.type] = (typeCounts[file.type] || 0) + 1;
  });

  md += `| File Type | Count |\n`;
  md += `|-----------|-------|\n`;
  for (const [type, count] of Object.entries(typeCounts)) {
    md += `| ${type.toUpperCase()} | ${count} |\n`;
  }

  fs.writeFileSync(REPORT_MD, md);
  console.log(`Saved Markdown report to ${REPORT_MD}`);
  console.log('Audit run completed successfully.');
}

runAudit();
