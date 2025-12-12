# Converting Existing Sanity Videos to HLS

This guide shows you how to convert your existing Sanity videos to HLS format.

---

## Prerequisites

### 1. Install FFmpeg

```bash
# macOS
brew install ffmpeg

# Verify installation
ffmpeg -version
```

### 2. Make scripts executable

```bash
cd /Users/sofiasantamaria/Documents/which-door
chmod +x scripts/convert-to-hls.sh
chmod +x scripts/batch-convert.sh
```

---

## Method 1: Convert Single Video (Quick Test)

Perfect for testing with one video first.

### Step 1: Pick a video from constants.tsx

Example from your constants:
```typescript
{
  slug: 'joy-anonymous',
  previewUrl: 'https://cdn.sanity.io/files/xerhtqd5/production/39307a58130a77d181ee0f7a126b45175917e9f7.mp4',
}
```

### Step 2: Run the conversion script

```bash
./scripts/convert-to-hls.sh \
  "https://cdn.sanity.io/files/xerhtqd5/production/39307a58130a77d181ee0f7a126b45175917e9f7.mp4" \
  "joy-anonymous"
```

**What this does:**
- Downloads the video from Sanity
- Encodes it to HLS (720p, optimized)
- Creates `.m3u8` playlist + `.ts` segments
- Saves to `hls_output/joy-anonymous/`

### Step 3: Check the output

```bash
ls -lh hls_output/joy-anonymous/
```

You should see:
```
joy-anonymous.m3u8       ← This is your hlsUrl!
joy-anonymous_000.ts     ← Video chunk 1
joy-anonymous_001.ts     ← Video chunk 2
joy-anonymous_002.ts     ← Video chunk 3
... etc
```

### Step 4: Upload to Sanity

1. Open Sanity Studio
2. Go to Assets
3. Upload ALL files (`.m3u8` + all `.ts` files)
4. Copy the URL of the `.m3u8` file

### Step 5: Add to constants.tsx

```typescript
{
  slug: 'joy-anonymous',
  previewUrl: 'https://cdn.sanity.io/files/.../joy-anonymous.mp4',    // Keep this!
  hlsUrl: 'https://cdn.sanity.io/files/.../joy-anonymous.m3u8',       // Add this!
  previewPoster: 'https://cdn.sanity.io/.../poster.png',
}
```

### Step 6: Test

```bash
cd frontend
npm run dev
```

Navigate to the page with that video and check console:
```
🎬 Using hls.js for HLS playback
✅ HLS manifest parsed, ready to play
```

---

## Method 2: Batch Convert Multiple Videos

Perfect for converting all your videos at once.

### Step 1: Extract video URLs automatically

```bash
node scripts/extract-video-urls.js
```

This creates `scripts/videos-to-convert.txt` with all videos from constants.tsx:
```
joy-anonymous|https://cdn.sanity.io/.../video1.mp4
sam-mulvey|https://cdn.sanity.io/.../video2.mp4
ufc-london|https://cdn.sanity.io/.../video3.mp4
```

### Step 2: Review and edit (optional)

```bash
nano scripts/videos-to-convert.txt
```

Remove any videos you don't want to convert, or add comments:
```
# Priority videos (backgrounds)
joy-anonymous|https://cdn.sanity.io/.../video1.mp4
sam-mulvey|https://cdn.sanity.io/.../video2.mp4

# Skip this one for now
# old-video|https://cdn.sanity.io/.../old.mp4
```

### Step 3: Batch convert

```bash
./scripts/batch-convert.sh scripts/videos-to-convert.txt
```

This will:
- Process each video one by one
- Show progress (1/10, 2/10, etc.)
- Display success/failure summary
- Save all outputs to `hls_output/`

**Example output:**
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Processing 1/10: joy-anonymous
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎬 Converting joy-anonymous to HLS
📥 Step 1/3: Downloading video...
✅ Downloaded: 45MB
⚙️  Step 2/3: Encoding to HLS (720p)...
✅ Encoding complete!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### Step 4: Upload all files to Sanity

```bash
# Check what was generated
ls -R hls_output/
```

You'll see folders for each video:
```
hls_output/
├── joy-anonymous/
│   ├── joy-anonymous.m3u8
│   └── joy-anonymous_*.ts
├── sam-mulvey/
│   ├── sam-mulvey.m3u8
│   └── sam-mulvey_*.ts
└── ...
```

**Upload via Sanity Studio:**
1. Open each folder
2. Upload ALL files (`.m3u8` + `.ts`) to Sanity Assets
3. Keep track of the `.m3u8` URLs

### Step 5: Update constants.tsx

I can create a helper script to generate the updates for you.

---

## Method 3: Using Sanity CLI (Advanced)

If you have Sanity CLI configured:

```bash
# Install Sanity CLI globally
npm install -g @sanity/cli

# Login
sanity login

# Upload files programmatically
sanity assets upload hls_output/joy-anonymous/*.ts
sanity assets upload hls_output/joy-anonymous/*.m3u8
```

---

## Encoding Options

### Default (720p, Balanced)
```bash
# This is what the scripts use
# Good for most background videos
# File size: ~30-50% of original
```

### High Quality (1080p)
```bash
./scripts/convert-to-hls.sh \
  "URL" \
  "name" \
  --quality high  # Not implemented yet, edit script
```

### Low Quality (480p, Mobile-optimized)
```bash
ffmpeg -i input.mp4 \
  -vf scale=854:480 \
  -c:v libx264 -crf 28 \
  -c:a aac -b:a 96k \
  -hls_time 6 \
  -hls_playlist_type vod \
  output.m3u8
```

---

## Troubleshooting

### FFmpeg not found

```bash
# Install FFmpeg
brew install ffmpeg

# Or download from:
https://ffmpeg.org/download.html
```

### Script permission denied

```bash
chmod +x scripts/convert-to-hls.sh
chmod +x scripts/batch-convert.sh
```

### Video download fails

Check if the URL is accessible:
```bash
curl -I "https://cdn.sanity.io/.../video.mp4"
```

Should return `200 OK`.

### Encoding is slow

This is normal! A 1-minute video can take 30-60 seconds to encode.

**Tips:**
- Use `-preset fast` (lower quality, faster)
- Use `-preset slow` (higher quality, slower)
- Default is `-preset medium` (balanced)

### Out of disk space

HLS files are similar size to original MP4. Check space:
```bash
df -h
```

Clean up after uploading:
```bash
rm -rf hls_output/
```

---

## File Size Comparison

**Original MP4:** 50MB
**HLS 720p:** ~25-35MB (split across many files)

**Why HLS feels smaller:**
- Browser only downloads chunks it needs
- Can switch to lower quality on slow connections
- Better caching (individual chunks cached separately)

---

## Priority List (What to Convert First)

### High Priority
1. **Directors page backgrounds** - Heavy mobile traffic
2. **Projects page backgrounds** - Same reason
3. **Most viewed project videos** - Check analytics

### Medium Priority
4. **Other project previews**
5. **Hero videos**

### Low Priority
6. **Short loops** (<10s)
7. **Rarely viewed content**
8. **Vimeo-hosted videos** (already adaptive)

---

## Automation Script (Future)

Would you like me to create a script that:
1. Extracts videos from constants.tsx
2. Converts them to HLS
3. Uploads to Sanity automatically
4. Generates updated constants.tsx with `hlsUrl` fields

This would make the entire process one command:
```bash
npm run convert-all-videos
```

Let me know if you want this!

---

## Quick Reference

```bash
# Single video
./scripts/convert-to-hls.sh "URL" "name"

# Extract all videos from constants
node scripts/extract-video-urls.js

# Batch convert
./scripts/batch-convert.sh scripts/videos-to-convert.txt

# Clean up after uploading
rm -rf hls_output/
```

---

## Next Steps

1. **Test with one video** (Method 1)
2. **Verify it works on mobile**
3. **Batch convert priority videos** (Method 2)
4. **Update constants.tsx with hlsUrl fields**
5. **Deploy and monitor**

---

**Questions?** Check the main [HLS_ENCODING_GUIDE.md](HLS_ENCODING_GUIDE.md) or the code comments in the scripts.
