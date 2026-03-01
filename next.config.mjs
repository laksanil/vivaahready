/** @type {import('next').NextConfig} */
const isPlaywrightTest = process.env.PLAYWRIGHT_TEST === 'true'

const nextConfig = {
  // Keep E2E dev-server artifacts isolated from local dev/build output.
  ...(isPlaywrightTest ? { distDir: '.next-e2e' } : {}),
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
