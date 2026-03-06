import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'VivaahReady',
    short_name: 'VivaahReady',
    description: 'Premium Indian matchmaking service for US diaspora',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#E31C25',
    icons: [
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icon.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  }
}
