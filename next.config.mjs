/** @type {import('next').NextConfig} */
const nextConfig = {
  // Increase body size limit for file uploads (default is 4.5MB)
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  webpack: (config, { isServer }) => {
    // Fix for face-api.js which tries to use fs module
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        encoding: false,
      }
    }
    return config
  },
}

export default nextConfig
