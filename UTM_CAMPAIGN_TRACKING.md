# UTM Campaign Tracking Setup

Your VivaahReady app now tracks all marketing campaigns end-to-end with UTM parameters and stores acquisition channel data on user profiles.

## How It Works

### 1. **Campaign Links**
Create ads/campaigns with UTM parameters:
```
https://vivaahready.com?utm_source=google&utm_medium=cpc&utm_campaign=spring-promo
https://vivaahready.com?utm_source=facebook&utm_medium=social&utm_campaign=summer-launch&utm_content=carousel-ad-v2
```

**Standard UTM Parameters:**
- `utm_source` — Where the traffic comes from (google, facebook, instagram, linkedin, etc.)
- `utm_medium` — Type of marketing (cpc, cpm, social, email, organic, referral, etc.)
- `utm_campaign` — Campaign name (spring-promo, summer-launch, holiday-sale, etc.)
- `utm_content` — Ad variant (ad-v1, email-banner, carousel, etc.) — optional
- `utm_term` — Keyword (indian matrimony, marriage partner, etc.) — optional

### 2. **Automatic Capture**
When a visitor lands on your site with UTM params:
- Params are **automatically captured** on page load via `useUTMTracking()` hook
- Stored in **localStorage** so they persist across page navigation
- Attached to **all analytics events** (pageview, signup, purchase)
- **Saved to user profile** at signup time in `Profile.utm_*` fields

### 3. **Analytics Flow**
```
User clicks ad with UTM → Landing page → Signup → Profile created
                                ↓
                         UTM params stored in DB
                                ↓
                    Query by campaign to see ROI
```

## Implementation

### Client-Side Hook (Auto-captures UTM)

```typescript
'use client'

import { useUTMTracking } from '@/hooks/useUTMTracking'

export function HomePage() {
  const utm = useUTMTracking() // Auto-captures and stores
  // utm.utm_source, utm.utm_medium, utm.utm_campaign, etc.
  return <div>...</div>
}
```

### Event Tracking (Includes UTM Automatically)

```typescript
import { trackSignUp, trackPurchase } from '@/lib/metaPixel'

// Track signup — automatically includes UTM from localStorage
await trackSignUp()

// Track payment — UTM included automatically
await trackPurchase(99, 'USD')
```

### Querying Campaign Performance

#### Database Query Example (Prisma)
```typescript
// Get all signups by campaign
const signupsByCampaign = await prisma.profile.groupBy({
  by: ['utm_campaign'],
  _count: {
    id: true,
  },
  where: {
    utm_campaign: { not: null },
  },
})
// Result: [
//   { utm_campaign: 'spring-promo', _count: { id: 45 } },
//   { utm_campaign: 'google-ads', _count: { id: 120 } },
// ]
```

#### By Source & Medium
```typescript
const signupsBySource = await prisma.profile.groupBy({
  by: ['utm_source', 'utm_medium'],
  _count: { id: true },
  where: {
    utm_source: { not: null },
  },
})
// Result: [
//   { utm_source: 'google', utm_medium: 'cpc', _count: { id: 150 } },
//   { utm_source: 'facebook', utm_medium: 'social', _count: { id: 80 } },
// ]
```

#### By Acquisition Channel
```typescript
const byChannel = await prisma.profile.groupBy({
  by: ['acquisitionChannel'],
  _count: { id: true },
})
// Result: [
//   { acquisitionChannel: 'paid_search', _count: { id: 150 } },
//   { acquisitionChannel: 'social', _count: { id: 80 } },
//   { acquisitionChannel: 'organic', _count: { id: 200 } },
// ]
```

#### With Conversion Metrics
```typescript
// Signups that converted to paid subscribers
const convertedBySource = await prisma.profile.findMany({
  where: {
    user: {
      subscription: {
        plan: { not: 'free' },
      },
    },
    utm_source: { not: null },
  },
  select: {
    id: true,
    utm_source: true,
    utm_campaign: true,
    user: {
      select: {
        subscription: { select: { plan: true } },
      },
    },
  },
})
```

## Database Migration

The schema has been updated with new fields:

```prisma
// Campaign/Acquisition Tracking
utm_source        String?
utm_medium        String?
utm_campaign      String?
utm_content       String?
utm_term          String?
acquisitionChannel String?  // High-level: "organic", "paid_search", "social", "referral"
```

### Run Migration

```bash
npx prisma migrate dev --name add_utm_tracking
```

This will:
1. Create the new `utm_*` and `acquisitionChannel` columns
2. Update Prisma Client with new types
3. You're ready to start capturing campaigns!

## Example: Build a Campaign Dashboard

```typescript
// src/app/admin/campaigns/page.tsx
'use client'

import { useState, useEffect } from 'react'

export default function CampaignDashboard() {
  const [campaigns, setCampaigns] = useState<any[]>([])

  useEffect(() => {
    fetch('/api/admin/campaigns-stats')
      .then(r => r.json())
      .then(setCampaigns)
  }, [])

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Campaign Performance</h1>
      <table className="w-full border">
        <thead>
          <tr className="bg-gray-100">
            <th className="p-2 text-left">Campaign</th>
            <th className="p-2 text-left">Source</th>
            <th className="p-2 text-left">Medium</th>
            <th className="p-2 text-right">Signups</th>
            <th className="p-2 text-right">Paid Conversions</th>
            <th className="p-2 text-right">Conversion Rate</th>
          </tr>
        </thead>
        <tbody>
          {campaigns.map(c => (
            <tr key={`${c.utm_source}-${c.utm_campaign}`} className="border-t">
              <td className="p-2">{c.utm_campaign || 'Direct'}</td>
              <td className="p-2">{c.utm_source}</td>
              <td className="p-2">{c.utm_medium}</td>
              <td className="p-2 text-right">{c.total_signups}</td>
              <td className="p-2 text-right">{c.paid_conversions}</td>
              <td className="p-2 text-right">
                {((c.paid_conversions / c.total_signups) * 100).toFixed(1)}%
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
```

## Testing

1. **Add UTM to a test link:**
   ```
   http://localhost:3000?utm_source=test&utm_medium=manual&utm_campaign=test-campaign
   ```

2. **Check localStorage:**
   ```js
   localStorage.getItem('vivaah_utm_params')
   // Output: {"utm_source":"test","utm_medium":"manual","utm_campaign":"test-campaign"}
   ```

3. **Sign up and verify in DB:**
   ```sql
   SELECT utm_source, utm_medium, utm_campaign FROM "Profile" 
   WHERE "createdAt" > NOW() - INTERVAL 1 HOUR;
   ```

## Next Steps

- Set up admin dashboard to visualize campaign ROI
- Create conversion funnel reports by source
- Set budget alerts for high-CAC campaigns
- A/B test landing pages by UTM content
- Sync conversion data back to Meta Ads Manager for optimization
