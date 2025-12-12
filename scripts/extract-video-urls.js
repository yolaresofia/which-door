#!/usr/bin/env node

/**
 * extract-video-urls.js
 * Extracts video URLs from constants.tsx and creates a batch conversion file
 * Usage: node scripts/extract-video-urls.js
 */

const fs = require('fs');
const path = require('path');

const CONSTANTS_PATH = path.join(__dirname, '../frontend/app/components/constants.tsx');
const OUTPUT_PATH = path.join(__dirname, 'videos-to-convert.txt');

console.log('🔍 Extracting video URLs from constants.tsx...\n');

// Read constants.tsx
const content = fs.readFileSync(CONSTANTS_PATH, 'utf8');

// Extract all previewUrl entries with their slugs
const videos = [];
const lines = content.split('\n');

let currentSlug = null;
let currentPreviewUrl = null;

for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Find slug
    const slugMatch = line.match(/slug:\s*['"]([^'"]+)['"]/);
    if (slugMatch) {
        currentSlug = slugMatch[1];
    }

    // Find previewUrl
    const previewUrlMatch = line.match(/previewUrl:\s*['"]([^'"]+)['"]/);
    if (previewUrlMatch && currentSlug) {
        currentPreviewUrl = previewUrlMatch[1];

        // Only add if it's a video file (.mp4, .webm, .mov)
        if (/\.(mp4|webm|mov)$/i.test(currentPreviewUrl)) {
            videos.push({
                slug: currentSlug,
                url: currentPreviewUrl
            });
        }

        currentSlug = null;
        currentPreviewUrl = null;
    }
}

// Remove duplicates
const uniqueVideos = Array.from(
    new Map(videos.map(v => [v.url, v])).values()
);

console.log(`✅ Found ${uniqueVideos.length} unique videos\n`);

// Create output file
const outputLines = uniqueVideos.map(v => `${v.slug}|${v.url}`);
fs.writeFileSync(OUTPUT_PATH, outputLines.join('\n'));

console.log(`📝 Created: ${OUTPUT_PATH}\n`);

// Print preview
console.log('Preview (first 5):');
console.log('─────────────────────────────────────────────');
uniqueVideos.slice(0, 5).forEach((v, i) => {
    console.log(`${i + 1}. ${v.slug}`);
    console.log(`   ${v.url.substring(0, 60)}...`);
    console.log('');
});

if (uniqueVideos.length > 5) {
    console.log(`... and ${uniqueVideos.length - 5} more\n`);
}

console.log('─────────────────────────────────────────────');
console.log('\n✨ Next steps:');
console.log('1. Review the generated file: scripts/videos-to-convert.txt');
console.log('2. Edit it to remove videos you don\'t want to convert');
console.log('3. Run: ./scripts/batch-convert.sh scripts/videos-to-convert.txt');
console.log('');
