const { exec } = require('child_process');
const fs = require('fs');

exec('npx eslint "src/**/*.{js,jsx}" --format json', { maxBuffer: 1024 * 1024 * 10 }, (error, stdout, stderr) => {
  try {
    const results = JSON.parse(stdout);
    const unused = [];
    results.forEach(file => {
      file.messages.forEach(msg => {
        if (msg.ruleId === 'no-unused-vars') {
          // Keep only capital letters indicating unused Components, or anything resembling an import
          if (msg.message.includes("'") && msg.message.match(/'[A-Z]/)) {
               unused.push(`${file.filePath}:${msg.line} -> ${msg.message}`);
          }
        }
      });
    });
    fs.writeFileSync('unused_imports.txt', unused.join('\n'));
    console.log('Wrote unused_imports.txt');
  } catch(e) {
    console.error('Error parsing JSON:', e);
  }
});
