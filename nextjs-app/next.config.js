/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  env: {
    VIDEO_SERVER_URL: process.env.VIDEO_SERVER_URL || 'http://localhost:8080',
  },
}

module.exports = nextConfig
