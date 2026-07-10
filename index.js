#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

const targetDir = process.argv[2] || process.cwd(); 

if (!fs.existsSync(targetDir)) {
    console.error(`Error: Directory "${targetDir}" does not exist.`);
    process.exit(1);
}

const FILE_MAP = {
    'Images': ['.jpg', '.jpeg', '.png', '.gif', '.svg', '.webp'],
    'Documents': ['.pdf', '.doc', '.docx', '.txt', '.xlsx', '.pptx'],
    'Archives': ['.zip', '.tar', '.gz', '.rar', '.7z'],
    'Code': ['.js', '.html', '.css', '.py', '.json', '.cpp', '.ts']
};

// Files that the tool should NEVER move
const IGNORE_FILES = ['index.js', 'package.json', 'package-lock.json'];

function getFolderName(ext) {
    for (const [folder, extensions] of Object.entries(FILE_MAP)) {
        if (extensions.includes(ext.toLowerCase())) {
            return folder;
        }
    }
    return 'Others';
}

try {
    const files = fs.readdirSync(targetDir);
    let movedCount = 0;

    files.forEach(file => {
        // Skip ignored files entirely
        if (IGNORE_FILES.includes(file)) return;

        const fullPath = path.join(targetDir, file);
        const stat = fs.statSync(fullPath);

        if (stat.isFile()) {
            const ext = path.extname(file);
            const folderName = getFolderName(ext);
            const destDir = path.join(targetDir, folderName);

            if (!fs.existsSync(destDir)) {
                fs.mkdirSync(destDir);
            }

            const destPath = path.join(destDir, file);
            fs.renameSync(fullPath, destPath);
            console.log(`Moved: ${file} ➡️  ${folderName}/`);
            movedCount++;
        }
    });

    if (movedCount === 0) {
        console.log('✨ No loose files found to organize!');
    } else {
        console.log(`\n🎉 Successfully organized ${movedCount} files!`);
    }

} catch (error) {
    console.error('An error occurred during organization:', error.message);
}
