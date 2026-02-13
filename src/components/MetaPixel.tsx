"use client"

import { useEffect, useState } from 'react'
import Script from 'next/script'
import { usePathname } from 'next/navigation'

const PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID

export default function MetaPixel() {
  const [consent, setConsent] = useState<boolean | null>(null)
  const pathname = usePathname()

  useEffect(() => {
    try {
      const allowed = localStorage.getItem('cookie-analytics-allowed')
      setConsent(allowed === 'true')
    } catch (e) {
      setConsent(false)
    }
  }, [])

  useEffect(() => {
    if (consent && typeof window !== 'undefined' && (window as any).fbq) {
      ;(window as any).fbq('track', 'PageView')
    }
  }, [pathname, consent])

  if (!PIXEL_ID) return null
  if (consent === null) return null // wait for client consent check
  if (!consent) return null

  return (
    <>
      <Script
        id="meta-pixel-loader"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window, document,'script','https://connect.facebook.net/en_US/fbevents.js'); fbq('init', '${PIXEL_ID}'); fbq('track', 'PageView');`,
        }}
      />
      <noscript>
        <img
          height="1"
          width="1"
          style={{ display: 'none' }}
          src={`https://www.facebook.com/tr?id=${PIXEL_ID}&ev=PageView&noscript=1`}
          alt=""
        />
      </noscript>
    </>
  )
}
