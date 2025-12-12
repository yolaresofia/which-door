#!/usr/bin/env node

/**
 * fix-m3u8-urls.js
 * Converts relative URLs in .m3u8 to absolute Sanity CDN URLs
 *
 * Usage: node scripts/fix-m3u8-urls.js <m3u8-file> <sanity-base-url>
 *
 * Example:
 * node scripts/fix-m3u8-urls.js \
 *   ~/Desktop/hls_output/joy-anonymous~/joy-anonymous~.m3u8 \
 *   "https://cdn.sanity.io/files/xerhtqd5/production"
 */

const fs = require('fs');
const readline = require('readline');

if (process.argv.length < 3) {
    console.log('Usage: node scripts/fix-m3u8-urls.js <m3u8-file>');
    console.log('');
    console.log('This script will:');
    console.log('1. Read your .m3u8 file');
    console.log('2. Find all .ts references');
    console.log('3. Ask you for the Sanity CDN URL for each .ts file');
    console.log('4. Create a new .m3u8 with absolute URLs');
    console.log('');
    process.exit(1);
}

const m3u8Path = process.argv[2];

if (!fs.existsSync(m3u8Path)) {
    console.error(`❌ File not found: ${m3u8Path}`);
    process.exit(1);
}

console.log('📝 M3U8 URL Fixer\n');
console.log(`Reading: ${m3u8Path}\n`);

const content = fs.readFileSync(m3u8Path, 'utf8');
const lines = content.split('\n');

// Find .ts references
const tsFiles = lines.filter(line => line.trim().endsWith('.ts'));

if (tsFiles.length === 0) {
    console.log('❌ No .ts files found in m3u8');
    process.exit(1);
}

console.log(`Found ${tsFiles.length} video chunk(s):\n`);
tsFiles.forEach((file, i) => {
    console.log(`  ${i + 1}. ${file.trim()}`);
});
console.log('');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const replacements = {};
let currentIndex = 0;

function askForUrl() {
    if (currentIndex >= tsFiles.length) {
        createFixedFile();
        rl.close();
        return;
    }

    const tsFile = tsFiles[currentIndex].trim();

    console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`Chunk ${currentIndex + 1}/${tsFiles.length}: ${tsFile}`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);

    rl.question(`\nEnter the full Sanity CDN URL for "${tsFile}":\n> `, (url) => {
        if (url.trim()) {
            replacements[tsFile] = url.trim();
        }
        currentIndex++;
        askForUrl();
    });
}

function createFixedFile() {
    console.log('\n\n✨ Creating fixed .m3u8 file...\n');

    let newContent = content;

    Object.keys(replacements).forEach(oldPath => {
        const newUrl = replacements[oldPath];
        console.log(`  ${oldPath} → ${newUrl}`);
        newContent = newContent.replace(oldPath, newUrl);
    });

    const outputPath = m3u8Path.replace('.m3u8', '-fixed.m3u8');
    fs.writeFileSync(outputPath, newContent);

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`✅ Created: ${outputPath}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n📋 Next steps:');
    console.log('1. Upload the new -fixed.m3u8 file to Sanity');
    console.log('2. Copy its Sanity CDN URL');
    console.log('3. Use that URL in constants.tsx as hlsUrl');
    console.log('');
}

console.log('For each chunk, you need to provide its Sanity CDN URL.');
console.log('This is the URL you got when you uploaded the .ts file to Sanity.\n');

rl.question('Ready to start? (y/n): ', (answer) => {
    if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
        askForUrl();
    } else {
        console.log('\nCancelled.');
        rl.close();
    }
});
