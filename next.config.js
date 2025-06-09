/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: ["placeholder.svg"],
    unoptimized: true,
  },
  // Add this to prevent server-side rendering issues with browser APIs
  experimental: {
    // This helps with components that use browser APIs
    appDir: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
}

module.exports = nextConfig
