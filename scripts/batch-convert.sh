#!/bin/bash

# batch-convert.sh
# Batch converts multiple Sanity videos to HLS
# Usage: ./batch-convert.sh videos.txt

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Check FFmpeg
if ! command -v ffmpeg &> /dev/null; then
    echo -e "${RED}❌ FFmpeg is not installed${NC}"
    echo "Install it with: brew install ffmpeg"
    exit 1
fi

# Check for input file
if [ $# -lt 1 ]; then
    echo "Usage: $0 <videos.txt>"
    echo ""
    echo "Create a videos.txt file with this format:"
    echo "name|url"
    echo ""
    echo "Example videos.txt:"
    echo "joy-anonymous|https://cdn.sanity.io/.../video.mp4"
    echo "sam-mulvey|https://cdn.sanity.io/.../video2.mp4"
    exit 1
fi

INPUT_FILE=$1

if [ ! -f "$INPUT_FILE" ]; then
    echo -e "${RED}❌ File not found: $INPUT_FILE${NC}"
    exit 1
fi

echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  Batch HLS Conversion Script          ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════╝${NC}"
echo ""

# Count total videos
TOTAL=$(wc -l < "$INPUT_FILE" | tr -d ' ')
CURRENT=0
SUCCESS=0
FAILED=0

echo -e "${GREEN}📋 Found ${TOTAL} videos to convert${NC}"
echo ""

# Process each line
while IFS='|' read -r NAME URL; do
    # Skip empty lines and comments
    [[ -z "$NAME" || "$NAME" =~ ^#.*$ ]] && continue

    CURRENT=$((CURRENT + 1))

    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${YELLOW}Processing ${CURRENT}/${TOTAL}: ${NAME}${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""

    # Call the single conversion script
    if ./scripts/convert-to-hls.sh "$URL" "$NAME"; then
        SUCCESS=$((SUCCESS + 1))
        echo -e "${GREEN}✅ ${NAME} completed${NC}"
    else
        FAILED=$((FAILED + 1))
        echo -e "${RED}❌ ${NAME} failed${NC}"
    fi

    echo ""
    echo ""
done < "$INPUT_FILE"

# Summary
echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  Conversion Complete                   ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════╝${NC}"
echo ""
echo -e "${GREEN}✅ Success: ${SUCCESS}${NC}"
echo -e "${RED}❌ Failed: ${FAILED}${NC}"
echo -e "${BLUE}📊 Total: ${TOTAL}${NC}"
echo ""
echo "All outputs are in: ./hls_output/"
