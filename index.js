#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { parseArgs } from 'util';

// 1. Configure allowed command-line options
const options = {
    'dry-run': { type: 'boolean', short: 'd' },
    'help': { type: 'boolean', short: 'h' }
};

const { values, positionals } = parseArgs({ options, allowPositionals: true });

if (values.help) {
    console.log(`
📁 Smart File Organizer CLI - Advanced Help

Usage:
  organize [path] [options]

Options:
  -d, --dry-run    Preview changes without moving any files
  -h, --help       Show this help menu
    `);
    process.exit(0);
}

const targetDir = positionals[0] || process.cwd(); 
const isDryRun = values['dry-run'];

if (!fs.existsSync(targetDir)) {
    console.error(`Error: Directory "${targetDir}" does not exist.`);
    process.exit(1);
}

// 2. Default extension mappings
let FILE_MAP = {
    'Images': ['.jpg', '.jpeg', '.png', '.gif', '.svg', '.webp'],
    'Documents': ['.pdf', '.doc', '.docx', '.txt', '.xlsx', '.pptx'],
    'Archives': ['.zip', '.tar', '.gz', '.rar', '.7z'],
    'Code': ['.js', '.html', '.css', '.py', '.json', '.cpp', '.ts']
};

const IGNORE_FILES = ['index.js', 'package.json', 'package-lock.json', 'config.json'];

// 3. Dynamic Configuration Loading
const configPath = path.join(process.cwd(), 'config.json');
if (fs.existsSync(configPath)) {
    try {
        const configFile = fs.readFileSync(configPath, 'utf8');
        const configData = JSON.parse(configFile);
        if (configData.CustomFolders) {
            FILE_MAP = { ...FILE_MAP, ...configData.CustomFolders };
            console.log('⚙️  Successfully loaded custom rules from config.json\n');
        }
    } catch (err) {
        console.warn('⚠️  Failed to parse config.json, reverting to default rules.');
    }
}

if (isDryRun) {
    console.log('🔍 Running in DRY-RUN mode. No files will be moved.\n');
}

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
        if (IGNORE_FILES.includes(file)) return;

        const fullPath = path.join(targetDir, file);
        const stat = fs.statSync(fullPath);

        if (stat.isFile()) {
            const ext = path.extname(file);
            const folderName = getFolderName(ext);
            const destDir = path.join(targetDir, folderName);

            if (isDryRun) {
                console.log(`[PREVIEW] Would move: ${file} ➡️  ${folderName}/`);
            } else {
                if (!fs.existsSync(destDir)) {
                    fs.mkdirSync(destDir);
                }
                const destPath = path.join(destDir, file);
                fs.renameSync(fullPath, destPath);
                console.log(`Moved: ${file} ➡️  ${folderName}/`);
            }
            movedCount++;
        }
    });

    if (movedCount === 0) {
        console.log('✨ No loose files found to organize!');
    } else {
        console.log(`\n🎉 Successfully processed ${movedCount} files!`);
    }

} catch (error) {
    console.error('An error occurred during organization:', error.message);
}
