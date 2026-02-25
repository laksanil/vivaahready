'use client'

import { useEffect } from 'react'

declare global {
  interface Window {
    botpress?: {
      init: (config: Record<string, unknown>) => void
      open: () => void
      close: () => void
    }
  }
}

const CLIENT_ID = process.env.NEXT_PUBLIC_BOTPRESS_CLIENT_ID || ''

export default function BotpressChat() {
  useEffect(() => {
    if (!CLIENT_ID) return

    // Avoid double-loading
    if (document.getElementById('bp-webchat-script')) return

    const script = document.createElement('script')
    script.id = 'bp-webchat-script'
    script.src = 'https://cdn.botpress.cloud/webchat/v2.2/inject.js'
    script.async = true
    script.onload = () => {
      window.botpress?.init({
        clientId: CLIENT_ID,
        configuration: {
          botName: 'VivaahReady Assistant',
          botDescription: 'Ask me anything about VivaahReady — matchmaking, features, pricing, and more!',
          color: '#7c3aed',
          variant: 'solid',
          themeMode: 'light',
          fontFamily: 'inter',
          radius: 1,
        },
      })
    }
    document.head.appendChild(script)

    return () => {
      // Cleanup on unmount (unlikely for homepage, but good practice)
      const el = document.getElementById('bp-webchat-script')
      if (el) el.remove()
    }
  }, [])

  // Renders nothing — Botpress injects its own FAB + chat window
  return null
}
