import path from 'node:path'
import { fileURLToPath } from 'node:url'

/** @type {import('next').NextConfig} */
const isPlaywrightTest = process.env.PLAYWRIGHT_TEST === 'true'
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

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
    if (isPlaywrightTest) {
      config.resolve.alias = {
        ...config.resolve.alias,
        '@botpress/webchat': path.resolve(__dirname, 'src/lib/e2e/botpressWebchatStub.tsx'),
      }
    }
    return config
  },
}

export default nextConfig
