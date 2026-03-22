const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');

function replaceInFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;

    content = content.replace(/["']@\/components\/features\/ImagePromptBar(.*)["']/g, '"@/features/prompt-bar"');
    content = content.replace(/["'](\.\.\/)+components\/features\/ImagePromptBar(.*)["']/g, '"@/features/prompt-bar"');

    content = content.replace(/["']@\/components\/features\/GenerationsPromptBar(.*)["']/g, '"@/features/prompt-bar"');
    content = content.replace(/["'](\.\.\/)+components\/features\/GenerationsPromptBar(.*)["']/g, '"@/features/prompt-bar"');

    if (content !== original) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log('Updated imports in:', filePath);
    }
}

function walkDir(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            walkDir(fullPath);
        } else if (fullPath.endsWith('.js') || fullPath.endsWith('.jsx')) {
            replaceInFile(fullPath);
        }
    }
}

walkDir(srcDir);
