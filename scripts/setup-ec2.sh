#!/bin/bash

# Script to setup the application on EC2 instance
# Run this script on the EC2 instance after SSH'ing into it

echo "Setting up video streaming application on EC2..."

# Clone or copy the repository
# Assuming the code is already on the instance or cloned
cd /home/ec2-user

# Create application directory
mkdir -p video-streaming-app
cd video-streaming-app

# Copy docker-compose.yml and other files
# (You'll need to copy files from your local machine or clone from git)

# Download test video
mkdir -p video-server/videos
curl -L "https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4" -o video-server/videos/test-video.mp4

# Start Docker Compose
docker-compose up -d --build

echo "Application setup complete!"
echo "Next.js app should be available at http://$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4):3000"
echo "Video server should be available at http://$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4):8080"
