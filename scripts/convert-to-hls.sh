#!/bin/bash

# convert-to-hls.sh
# Converts videos from Sanity CDN to HLS format
# Usage: ./convert-to-hls.sh <video-url> <output-name>
# Example: ./convert-to-hls.sh "https://cdn.sanity.io/.../video.mp4" "joy-anonymous"

set -e  # Exit on error

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if FFmpeg is installed
if ! command -v ffmpeg &> /dev/null; then
    echo -e "${RED}❌ FFmpeg is not installed${NC}"
    echo "Install it with: brew install ffmpeg"
    exit 1
fi

# Check arguments
if [ $# -lt 2 ]; then
    echo "Usage: $0 <video-url> <output-name>"
    echo "Example: $0 'https://cdn.sanity.io/.../video.mp4' 'joy-anonymous'"
    exit 1
fi

VIDEO_URL=$1
OUTPUT_NAME=$2
OUTPUT_DIR="hls_output/${OUTPUT_NAME}"

echo -e "${BLUE}🎬 Converting ${OUTPUT_NAME} to HLS${NC}"
echo ""

# Create output directory
mkdir -p "$OUTPUT_DIR"

# Step 1: Download the video
echo -e "${YELLOW}📥 Step 1/3: Downloading video...${NC}"
curl -L -o "${OUTPUT_DIR}/source.mp4" "$VIDEO_URL"

if [ ! -f "${OUTPUT_DIR}/source.mp4" ]; then
    echo -e "${RED}❌ Failed to download video${NC}"
    exit 1
fi

FILE_SIZE=$(du -h "${OUTPUT_DIR}/source.mp4" | cut -f1)
echo -e "${GREEN}✅ Downloaded: ${FILE_SIZE}${NC}"
echo ""

# Step 2: Get video info
echo -e "${YELLOW}📊 Video info:${NC}"
ffprobe -v quiet -print_format json -show_format -show_streams "${OUTPUT_DIR}/source.mp4" | \
    grep -E '"width"|"height"|"duration"|"bit_rate"' | head -4
echo ""

# Step 3: Encode to HLS (single quality for simplicity)
echo -e "${YELLOW}⚙️  Step 2/3: Encoding to HLS (720p)...${NC}"
echo "This may take a few minutes..."
echo ""

ffmpeg -i "${OUTPUT_DIR}/source.mp4" \
    -vf scale=w=1280:h=720:force_original_aspect_ratio=decrease \
    -c:v libx264 \
    -crf 23 \
    -preset medium \
    -c:a aac \
    -b:a 128k \
    -ac 2 \
    -ar 48000 \
    -hls_time 6 \
    -hls_playlist_type vod \
    -hls_segment_type mpegts \
    -hls_segment_filename "${OUTPUT_DIR}/${OUTPUT_NAME}_%03d.ts" \
    "${OUTPUT_DIR}/${OUTPUT_NAME}.m3u8" \
    -y \
    -loglevel warning \
    -stats

if [ ! -f "${OUTPUT_DIR}/${OUTPUT_NAME}.m3u8" ]; then
    echo -e "${RED}❌ Failed to encode video${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}✅ Encoding complete!${NC}"
echo ""

# Step 4: Show results
echo -e "${YELLOW}📦 Step 3/3: Generated files:${NC}"
ls -lh "$OUTPUT_DIR" | grep -E '\.m3u8|\.ts' | awk '{print "  " $9 " (" $5 ")"}'
echo ""

# Count segments
SEGMENT_COUNT=$(ls -1 "$OUTPUT_DIR"/*.ts 2>/dev/null | wc -l | tr -d ' ')
echo -e "${GREEN}✅ Created ${SEGMENT_COUNT} video segments${NC}"
echo ""

# Step 5: Instructions
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✨ Next Steps:${NC}"
echo ""
echo "1. Upload these files to Sanity:"
echo -e "   ${YELLOW}${OUTPUT_DIR}/${OUTPUT_NAME}.m3u8${NC}"
echo -e "   ${YELLOW}${OUTPUT_DIR}/${OUTPUT_NAME}_*.ts${NC} (all segment files)"
echo ""
echo "2. Get the CDN URL for the .m3u8 file"
echo ""
echo "3. Add to your constants.tsx:"
echo -e "${YELLOW}   hlsUrl: 'https://cdn.sanity.io/files/.../$(basename $OUTPUT_NAME).m3u8'${NC}"
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "Output directory: $OUTPUT_DIR"
