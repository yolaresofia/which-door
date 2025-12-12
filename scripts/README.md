# Video Conversion Scripts

Automated tools for converting your Sanity videos to HLS format.

## Quick Start

### 1. Convert a single video (test first!)

```bash
./scripts/convert-to-hls.sh \
  "https://cdn.sanity.io/files/xerhtqd5/production/YOUR_VIDEO.mp4" \
  "video-name"
```

### 2. Extract all videos from constants.tsx

```bash
node scripts/extract-video-urls.js
```

Creates `scripts/videos-to-convert.txt`

### 3. Batch convert all videos

```bash
./scripts/batch-convert.sh scripts/videos-to-convert.txt
```

## Files

- **convert-to-hls.sh** - Convert single video to HLS
- **batch-convert.sh** - Batch convert multiple videos
- **extract-video-urls.js** - Extract video URLs from constants.tsx

## Requirements

- **FFmpeg** - `brew install ffmpeg`
- **Node.js** - Already installed

## Output

All converted videos go to: `hls_output/`

```
hls_output/
├── video-name/
│   ├── video-name.m3u8      ← Upload this to Sanity
│   └── video-name_*.ts       ← Upload all of these too
```

## Full Documentation

See [../CONVERTING_EXISTING_VIDEOS.md](../CONVERTING_EXISTING_VIDEOS.md)
