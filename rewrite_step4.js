const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');

function replaceInFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;

    // ImageStatusView
    content = content.replace(/["']@\/components\/skeleton\/ImageStatusView["']/g, '"@/features/generations/ui/ImageStatusView"');
    content = content.replace(/["'](\.\.\/)+components\/skeleton\/ImageStatusView["']/g, '"@/features/generations/ui/ImageStatusView"');
    
    // ProjectCard
    content = content.replace(/["']@\/components\/features\/projects\/ProjectCard["']/g, '"@/features/projects/ui/ProjectCard"');
    content = content.replace(/["'](\.\.\/)+components\/features\/projects\/ProjectCard["']/g, '"@/features/projects/ui/ProjectCard"');

    // Also remove any direct Zustand store imports where possible
    // Note: A full store migration across the app is too destructive for an automated string replace if the methods changed. 
    // They will need to be refactored specifically, but we strictly followed FSD scaffolding for now.

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
