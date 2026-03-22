const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');

function replaceInFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;

    // StudioNavbar
    content = content.replace(/["']@\/components\/studio\/StudioNavbar(.*)["']/g, '"@/widgets/StudioNavbar$1"');
    content = content.replace(/["'](\.\.\/)+components\/studio\/StudioNavbar(.*)["']/g, '"@/widgets/StudioNavbar$2"');

    // Dialogs
    content = content.replace(/["']@\/components\/studio\/dialogs(.*)["']/g, '"@/widgets/dialogs$1"');
    content = content.replace(/["'](\.\.\/)+components\/studio\/dialogs(.*)["']/g, '"@/widgets/dialogs$2"');

    // ImportMediaDialog
    content = content.replace(/["']@\/components\/features\/ImportMediaDialog(.*)["']/g, '"@/widgets/ImportMediaDialog$1"');
    content = content.replace(/["'](\.\.\/)+components\/features\/ImportMediaDialog(.*)["']/g, '"@/widgets/ImportMediaDialog$2"');

    // Studio Layout Wrappers
    content = content.replace(/["']@\/components\/studio\/(GenerationsStudio|GenerationsStudioView|NewProjectView)(.*)["']/g, '"@/widgets/StudioLayout/$1$2"');
    content = content.replace(/["'](\.\.\/)+components\/studio\/(GenerationsStudio|GenerationsStudioView|NewProjectView)(.*)["']/g, '"@/widgets/StudioLayout/$2$3"');

    // Any remaining raw `components/studio` base dir imports just in case
    content = content.replace(/["']@\/components\/studio\/(.*)["']/g, '"@/widgets/StudioLayout/$1"');
    content = content.replace(/["'](\.\.\/)+components\/studio\/(.*)["']/g, '"@/widgets/StudioLayout/$2"');

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
