#!/usr/bin/env node

/**
 * generate-constants-update.js
 * Generates the hlsUrl fields to add to constants.tsx after uploading HLS files
 * Usage: node scripts/generate-constants-update.js
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const HLS_OUTPUT_DIR = path.join(__dirname, '../hls_output');

console.log('📝 HLS Constants Generator\n');

// Check if hls_output exists
if (!fs.existsSync(HLS_OUTPUT_DIR)) {
    console.log('❌ No hls_output directory found');
    console.log('   Run the conversion scripts first!');
    process.exit(1);
}

// Get all converted videos
const videoFolders = fs.readdirSync(HLS_OUTPUT_DIR).filter(f => {
    return fs.statSync(path.join(HLS_OUTPUT_DIR, f)).isDirectory();
});

if (videoFolders.length === 0) {
    console.log('❌ No converted videos found in hls_output/');
    process.exit(1);
}

console.log(`✅ Found ${videoFolders.length} converted videos\n`);

// Interactive mode to get Sanity CDN URLs
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const results = [];
let currentIndex = 0;

function askForUrl() {
    if (currentIndex >= videoFolders.length) {
        generateOutput();
        rl.close();
        return;
    }

    const videoName = videoFolders[currentIndex];
    const m3u8File = `${videoName}.m3u8`;

    console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`Video ${currentIndex + 1}/${videoFolders.length}: ${videoName}`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`\nYou need to upload these files to Sanity:`);
    console.log(`  📄 hls_output/${videoName}/${m3u8File}`);
    console.log(`  📦 hls_output/${videoName}/${videoName}_*.ts (all segments)`);
    console.log('');

    rl.question(`Enter the Sanity CDN URL for ${m3u8File} (or "skip"): `, (url) => {
        if (url.toLowerCase() !== 'skip' && url.trim() !== '') {
            results.push({
                slug: videoName,
                hlsUrl: url.trim()
            });
        }

        currentIndex++;
        askForUrl();
    });
}

function generateOutput() {
    console.log('\n\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✨ Generated constants.tsx updates:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');

    if (results.length === 0) {
        console.log('No URLs provided. Exiting.');
        return;
    }

    console.log('Copy and paste these lines into your video objects:\n');

    results.forEach(({ slug, hlsUrl }) => {
        console.log(`// ${slug}`);
        console.log(`hlsUrl: '${hlsUrl}',`);
        console.log('');
    });

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');
    console.log('Example placement in constants.tsx:');
    console.log('');
    console.log('```typescript');
    console.log('{');
    console.log('  slug: \'' + results[0].slug + '\',');
    console.log('  previewUrl: \'https://cdn.sanity.io/.../video.mp4\',  // Keep this!');
    console.log('  hlsUrl: \'' + results[0].hlsUrl + '\',      // Add this!');
    console.log('  previewPoster: \'https://cdn.sanity.io/.../poster.png\',');
    console.log('  // ...');
    console.log('}');
    console.log('```');
    console.log('');
}

// Start interactive mode
console.log('This script will help you add hlsUrl fields to constants.tsx\n');
console.log('Steps:');
console.log('1. Upload the .m3u8 and .ts files to Sanity Studio');
console.log('2. Copy the CDN URL for each .m3u8 file');
console.log('3. Paste the URLs when prompted\n');

rl.question('Ready to start? (y/n): ', (answer) => {
    if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
        askForUrl();
    } else {
        console.log('\nCancelled. Run again when ready!');
        rl.close();
    }
});
