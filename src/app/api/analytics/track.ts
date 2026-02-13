import { NextRequest, NextResponse } from 'next/server'

interface UTMParams {
  utm_source?: string
  utm_medium?: string
  utm_campaign?: string
  utm_content?: string
  utm_term?: string
  utm_id?: string
}

interface MetaPixelEvent {
  event_name: string
  event_id?: string
  event_source_url?: string
  action_source?: 'website' | 'app'
  utm_params?: UTMParams
  user_data?: {
    em?: string // hashed email
    ph?: string // hashed phone
    ge?: string // hashed gender
    db?: string // hashed DOB
    ln?: string // hashed last name
    fn?: string // hashed first name
    ct?: string // hashed city
    st?: string // hashed state
    zp?: string // hashed zip
    country?: string // hashed country
  }
  custom_data?: {
    value?: number
    currency?: string
    content_name?: string
    content_type?: string
    content_ids?: string[]
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { event_name, event_id, user_data, custom_data, event_source_url, utm_params } = body as MetaPixelEvent & { utm_params?: UTMParams }

    const pixelId = process.env.META_PIXEL_ID
    const accessToken = process.env.META_PIXEL_ACCESS_TOKEN

    if (!pixelId || !accessToken) {
      return NextResponse.json(
        { error: 'Meta Pixel not configured' },
        { status: 400 }
      )
    }

    // Enrich custom_data with UTM params for reporting
    const enrichedCustomData = {
      ...custom_data,
      ...(utm_params?.utm_source && { utm_source: utm_params.utm_source }),
      ...(utm_params?.utm_medium && { utm_medium: utm_params.utm_medium }),
      ...(utm_params?.utm_campaign && { utm_campaign: utm_params.utm_campaign }),
    }

    // Send to Meta's Conversions API (server-side tracking)
    const response = await fetch(
      `https://graph.facebook.com/v18.0/${pixelId}/events`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          data: [
            {
              event_name,
              event_id: event_id || `${Date.now()}-${Math.random()}`,
              event_time: Math.floor(Date.now() / 1000),
              event_source_url: event_source_url || request.headers.get('referer'),
              action_source: 'website',
              user_data,
              custom_data: enrichedCustomData,
            },
          ],
          access_token: accessToken,
        }),
      }
    )

    if (!response.ok) {
      const error = await response.text()
      console.error('Meta Pixel API error:', error)
      return NextResponse.json(
        { error: 'Failed to track event' },
        { status: response.status }
      )
    }

    const result = await response.json()
    return NextResponse.json({ success: true, result, utm_params })
  } catch (error) {
    console.error('Analytics tracking error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
