# HLS Encoding Guide for Which Door

## Overview

Your site now supports HLS (HTTP Live Streaming) for adaptive bitrate video playback. This guide explains how to encode videos for optimal performance.

## What is HLS?

HLS splits videos into small chunks (2-10 seconds) and creates a `.m3u8` playlist file that tells the browser which quality levels are available. The player automatically switches between qualities based on the user's bandwidth.

**Benefits:**
- ✅ Faster video start times
- ✅ Automatic quality switching based on connection speed
- ✅ Better mobile performance (less data usage, smoother playback)
- ✅ Graceful handling of network fluctuations
- ✅ Safari native support (no JavaScript needed)

## Implementation Status

### ✅ What's Already Done

1. **HLS Player Component** (`HLSVideo.tsx`)
   - Safari native HLS support
   - hls.js for Chrome/Firefox/Edge
   - Mobile optimization (auto-selects lowest quality on mobile)
   - Automatic error recovery and MP4 fallback

2. **Type System**
   - Added `hlsUrl` field to Media type
   - All BackgroundMedia components support HLS

3. **Priority System**
   - HLS → MP4/WebM → Vimeo (in that order)
   - If `hlsUrl` is provided, it will be used preferentially

### 📝 What You Need to Do

Add `hlsUrl` field to your constants/data. Example:

```typescript
{
  slug: 'project-name',
  previewUrl: 'https://cdn.sanity.io/files/.../video.mp4', // Fallback
  hlsUrl: 'https://cdn.sanity.io/files/.../video.m3u8',    // NEW!
  previewPoster: 'https://cdn.sanity.io/images/.../poster.png',
  // ... other fields
}
```

---

## Encoding HLS with FFmpeg

### Installation

```bash
# macOS
brew install ffmpeg

# Ubuntu/Debian
sudo apt install ffmpeg

# Windows
# Download from: https://ffmpeg.org/download.html
```

### Recommended Encoding Profiles

#### For Background Videos (Priority)

Background videos should be **low resolution, low bitrate** for fast loading:

```bash
ffmpeg -i input.mp4 \
  -vf scale=w=1280:h=720:force_original_aspect_ratio=decrease \
  -c:a aac -ar 48000 -b:a 96k \
  -c:v h264 -profile:v main -crf 28 \
  -g 48 -keyint_min 48 -sc_threshold 0 \
  -hls_time 6 \
  -hls_playlist_type vod \
  -hls_segment_filename "output_%03d.ts" \
  output.m3u8
```

**What this does:**
- 720p maximum resolution
- CRF 28 (good quality/size balance)
- 96k audio bitrate
- 6 second segments

#### For Hero/Featured Videos (Multi-Bitrate)

For full-page videos where quality matters, create multiple quality levels:

```bash
#!/bin/bash
INPUT="input.mp4"
OUTPUT_DIR="output"

mkdir -p $OUTPUT_DIR

# Create multiple quality levels
ffmpeg -i "$INPUT" \
  -filter_complex \
  "[0:v]split=4[v1][v2][v3][v4]; \
   [v1]scale=w=640:h=360:force_original_aspect_ratio=decrease[v1out]; \
   [v2]scale=w=842:h=480:force_original_aspect_ratio=decrease[v2out]; \
   [v3]scale=w=1280:h=720:force_original_aspect_ratio=decrease[v3out]; \
   [v4]scale=w=1920:h=1080:force_original_aspect_ratio=decrease[v4out]" \
  -map "[v1out]" -c:v:0 libx264 -b:v:0 800k -maxrate:v:0 856k -bufsize:v:0 1200k -g:v:0 90 \
  -map "[v2out]" -c:v:1 libx264 -b:v:1 1400k -maxrate:v:1 1498k -bufsize:v:1 2100k -g:v:1 90 \
  -map "[v3out]" -c:v:2 libx264 -b:v:2 2800k -maxrate:v:2 2996k -bufsize:v:2 4200k -g:v:2 90 \
  -map "[v4out]" -c:v:3 libx264 -b:v:3 5000k -maxrate:v:3 5350k -bufsize:v:3 7500k -g:v:3 90 \
  -map a:0 -c:a:0 aac -b:a:0 96k -ac 2 \
  -map a:0 -c:a:1 aac -b:a:1 96k -ac 2 \
  -map a:0 -c:a:2 aac -b:a:2 128k -ac 2 \
  -map a:0 -c:a:3 aac -b:a:3 128k -ac 2 \
  -f hls \
  -hls_time 6 \
  -hls_playlist_type vod \
  -hls_flags independent_segments \
  -hls_segment_type mpegts \
  -hls_segment_filename "$OUTPUT_DIR/stream_%v/segment_%03d.ts" \
  -master_pl_name master.m3u8 \
  -var_stream_map "v:0,a:0 v:1,a:1 v:2,a:2 v:3,a:3" \
  "$OUTPUT_DIR/stream_%v.m3u8"
```

**Quality Ladder:**
- 360p @ 800kbps (mobile/slow connections)
- 480p @ 1400kbps (mobile/medium connections)
- 720p @ 2800kbps (desktop/good connections)
- 1080p @ 5000kbps (desktop/fast connections)

---

## Simplified One-Command Encoding

### Single Quality (Recommended for Testing)

```bash
ffmpeg -i input.mp4 \
  -vf scale=1280:720 \
  -c:v libx264 -crf 23 \
  -c:a aac -b:a 128k \
  -hls_time 6 \
  -hls_playlist_type vod \
  output.m3u8
```

### Multi-Quality with Presets

Save this as `encode_hls.sh`:

```bash
#!/bin/bash

INPUT=$1
OUTPUT_DIR="hls_output"
BASE_NAME=$(basename "$INPUT" .mp4)

mkdir -p "$OUTPUT_DIR/$BASE_NAME"

echo "🎬 Encoding HLS for: $INPUT"

# 360p
ffmpeg -i "$INPUT" -vf scale=640:360 -c:v libx264 -b:v 800k -c:a aac -b:a 96k \
  -hls_time 6 -hls_playlist_type vod \
  -hls_segment_filename "$OUTPUT_DIR/$BASE_NAME/360p_%03d.ts" \
  "$OUTPUT_DIR/$BASE_NAME/360p.m3u8"

# 720p
ffmpeg -i "$INPUT" -vf scale=1280:720 -c:v libx264 -b:v 2800k -c:a aac -b:a 128k \
  -hls_time 6 -hls_playlist_type vod \
  -hls_segment_filename "$OUTPUT_DIR/$BASE_NAME/720p_%03d.ts" \
  "$OUTPUT_DIR/$BASE_NAME/720p.m3u8"

# 1080p
ffmpeg -i "$INPUT" -vf scale=1920:1080 -c:v libx264 -b:v 5000k -c:a aac -b:a 128k \
  -hls_time 6 -hls_playlist_type vod \
  -hls_segment_filename "$OUTPUT_DIR/$BASE_NAME/1080p_%03d.ts" \
  "$OUTPUT_DIR/$BASE_NAME/1080p.m3u8"

# Create master playlist
cat > "$OUTPUT_DIR/$BASE_NAME/master.m3u8" <<EOF
#EXTM3U
#EXT-X-VERSION:3
#EXT-X-STREAM-INF:BANDWIDTH=800000,RESOLUTION=640x360
360p.m3u8
#EXT-X-STREAM-INF:BANDWIDTH=2800000,RESOLUTION=1280x720
720p.m3u8
#EXT-X-STREAM-INF:BANDWIDTH=5000000,RESOLUTION=1920x1080
1080p.m3u8
EOF

echo "✅ Done! Upload the contents of $OUTPUT_DIR/$BASE_NAME/ to your CDN"
echo "   Use master.m3u8 as your hlsUrl"
```

**Usage:**
```bash
chmod +x encode_hls.sh
./encode_hls.sh input.mp4
```

---

## Hosting & CDN Setup

### Recommended: Sanity CDN

If you're already using Sanity, you can upload the HLS files there:

1. Upload all `.m3u8` and `.ts` files to Sanity Assets
2. Use the CDN URL for the master `.m3u8` file as your `hlsUrl`

**Important:** Make sure CORS is configured correctly on your CDN.

### Alternative: Cloudflare R2 / AWS S3

Both support HLS streaming with proper CORS:

```bash
# Example: Upload to S3
aws s3 sync hls_output/video-name/ s3://your-bucket/videos/video-name/ \
  --acl public-read \
  --cache-control "max-age=31536000"
```

**CORS Configuration (S3):**
```json
{
  "CORSRules": [
    {
      "AllowedOrigins": ["*"],
      "AllowedMethods": ["GET", "HEAD"],
      "AllowedHeaders": ["*"],
      "MaxAgeSeconds": 3000
    }
  ]
}
```

---

## Adding HLS URLs to Your Content

### Option 1: Manual (Quick Test)

Edit [constants.tsx](frontend/app/components/constants.tsx) and add `hlsUrl` fields:

```typescript
{
  name: 'Joy Anonymous',
  slug: 'joy-anonymous',
  previewUrl: 'https://cdn.sanity.io/.../joy-anonymous.mp4',
  hlsUrl: 'https://cdn.sanity.io/.../joy-anonymous.m3u8', // Add this!
  previewPoster: 'https://cdn.sanity.io/.../poster.png',
  // ...
}
```

### Option 2: Sanity Schema (Recommended)

Update your Sanity schema to include an `hlsUrl` field:

```typescript
// studio/src/schemaTypes/project.ts
defineField({
  name: 'hlsUrl',
  title: 'HLS Video URL (.m3u8)',
  type: 'url',
  description: 'Adaptive streaming URL for better performance (optional)',
  validation: (Rule) => Rule.uri({ scheme: ['http', 'https'] }),
})
```

Then add it to your GROQ queries in the frontend.

---

## Testing Your HLS Implementation

### 1. Chrome DevTools (Network Throttling)

1. Open Chrome DevTools → Network
2. Set throttling to "Slow 3G"
3. Navigate to your directors/projects pages
4. Watch the video quality adapt in real-time

### 2. Safari (Native HLS)

Safari supports HLS natively, so it's the best place to test quality switching.

### 3. Console Logs

The HLS player logs quality switches:
```
🎬 Using hls.js for HLS playback
✅ HLS manifest parsed, ready to play
🎯 Quality switched to: 720p @ 2800kbps
```

### 4. Mobile Testing

- iOS Safari: Native HLS (best performance)
- Chrome/Firefox on Android: hls.js
- Check data usage in Settings → Network

---

## Bitrate Recommendations

### Background Videos (Preview variant)
- **Single quality:** 720p @ 1500-2000kbps
- **Best practice:** Start with low resolution, high compression

### Hero Videos (Full variant with controls)
- **360p:** 500-800kbps
- **480p:** 1000-1400kbps
- **720p:** 2000-2800kbps
- **1080p:** 4000-5000kbps
- **4K (optional):** 8000-12000kbps

### Mobile Optimization

The HLSVideo component automatically forces the **lowest quality** on mobile (`window.innerWidth < 1024`). This saves bandwidth and prevents crashes.

---

## Debugging

### HLS Not Playing?

1. **Check console logs:**
   - Look for "🎬 Using hls.js" or "🍎 Using Safari native"
   - Look for error messages

2. **Check .m3u8 file is accessible:**
   ```bash
   curl https://your-cdn.com/video.m3u8
   ```

3. **Check CORS headers:**
   ```bash
   curl -I https://your-cdn.com/video.m3u8
   # Should include: Access-Control-Allow-Origin: *
   ```

4. **Verify file structure:**
   ```
   video/
   ├── master.m3u8       ← Use this as hlsUrl
   ├── 360p.m3u8
   ├── 360p_000.ts
   ├── 360p_001.ts
   ├── 720p.m3u8
   ├── 720p_000.ts
   └── ...
   ```

### Fallback to MP4

If HLS fails, the player automatically falls back to the `previewUrl` (MP4). Check console for:
```
💥 Unrecoverable HLS error, falling back to MP4
```

---

## Performance Tips

### 1. Prioritize Background Videos

Convert all background videos (directors/projects pages) to HLS first. These have the biggest impact on mobile performance.

### 2. Keep MP4 Fallbacks

Always provide a `previewUrl` (MP4) as fallback for browsers without HLS support.

### 3. CDN Configuration

- Enable **gzip compression** for `.m3u8` files
- Set **cache headers** to `max-age=31536000` for `.ts` segments
- Set **cache headers** to `max-age=300` for `.m3u8` playlists

### 4. Segment Length

- **6 seconds** is a good default (used in this guide)
- Shorter (2-4s): faster quality switching, more files
- Longer (8-10s): fewer files, slower adaptation

---

## Next Steps

1. **Test with one video:**
   - Encode a single video with the simple command
   - Upload to your CDN
   - Add `hlsUrl` to one project in constants.tsx
   - Test on mobile and desktop

2. **Batch encode:**
   - Use the `encode_hls.sh` script for multiple videos
   - Prioritize heavily-used background videos

3. **Update Sanity schema:**
   - Add `hlsUrl` field
   - Update frontend queries to fetch it

4. **Monitor:**
   - Check Chrome DevTools for quality switches
   - Test on slow connections (3G/4G)
   - Verify mobile data usage improvements

---

## Resources

- [FFmpeg HLS Documentation](https://ffmpeg.org/ffmpeg-formats.html#hls-2)
- [hls.js Documentation](https://github.com/video-dev/hls.js/)
- [Apple HLS Specification](https://developer.apple.com/documentation/http-live-streaming)
- [Video Bitrate Calculator](https://toolstud.io/video/bitrate.php)

---

## Questions?

- **Which videos should I convert first?** → Background videos (directors/projects pages)
- **What if I don't have FFmpeg?** → Use online tools like [Zencoder](https://zencoder.com) or [AWS MediaConvert](https://aws.amazon.com/mediaconvert/)
- **Can I test without encoding?** → Yes! Find a sample HLS stream online and add it as `hlsUrl` for testing
- **What about doity.de?** → They likely use HLS too! Your implementation is similar.

---

**Author:** Claude (Anthropic)
**Date:** 2025-12-12
**Version:** 1.0
