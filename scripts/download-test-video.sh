#!/bin/bash

# Script to download a test video file
# Uses a sample video from a public source

VIDEO_DIR="./video-server/videos"
TEST_VIDEO_URL="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4"
TEST_VIDEO_NAME="test-video.mp4"

# Create videos directory if it doesn't exist
mkdir -p "$VIDEO_DIR"

# Download test video
echo "Downloading test video..."
curl -L "$TEST_VIDEO_URL" -o "$VIDEO_DIR/$TEST_VIDEO_NAME"

if [ $? -eq 0 ]; then
    echo "Test video downloaded successfully to $VIDEO_DIR/$TEST_VIDEO_NAME"
else
    echo "Failed to download test video. You can manually add a video file to $VIDEO_DIR/"
fi
