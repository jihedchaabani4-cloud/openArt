const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');

function replaceInFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;

    // 1. UI Components
    content = content.replace(/["']@\/components\/ui\/([^"']+)["']/g, '"@/shared/ui/$1"');
    content = content.replace(/["'](\.\.\/)+components\/ui\/([^"']+)["']/g, '"@/shared/ui/$2"');

    // 2. Utils
    content = content.replace(/["']@\/lib\/utils["']/g, '"@/shared/lib/utils"');
    content = content.replace(/["'](\.\.\/)+lib\/utils["']/g, '"@/shared/lib/utils"');
    content = content.replace(/["']\.\/lib\/utils["']/g, '"@/shared/lib/utils"');

    // 3. API
    content = content.replace(/["']@\/lib\/api["']/g, '"@/shared/api/client"');
    content = content.replace(/["'](\.\.\/)+lib\/api["']/g, '"@/shared/api/client"');

    // 4. Hooks, Config, Types
    content = content.replace(/["']@\/(hooks|config|types)\/([^"']+)["']/g, '"@/shared/$1/$2"');
    content = content.replace(/["'](\.\.\/)+(hooks|config|types)\/([^"']+)["']/g, '"@/shared/$2/$3"');

    if (content !== original) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log('Updated:', filePath);
    }
}

function walkDir(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            walkDir(fullPath);
        } else if (fullPath.endsWith('.js') || fullPath.endsWith('.jsx') || fullPath.endsWith('.ts') || fullPath.endsWith('.tsx')) {
            replaceInFile(fullPath);
        }
    }
}

walkDir(srcDir);
