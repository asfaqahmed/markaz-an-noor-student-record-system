/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [],
  },
  // Additional config to handle hydration issues
  reactStrictMode: true,
  // Handle hydration issues from browser extensions
  compiler: {
    // Remove console.errors in production that contain 'Hydration failed'
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error']
    } : false,
  },
}

module.exports = nextConfig