// Pricing Configuration
// Update these values to change pricing across the site

export const PRICING = {
  // Regular price (shown as strikethrough during promos)
  regularPrice: 99,

  // Current active price
  currentPrice: 50,

  // Promotion details
  promo: {
    active: true,
    name: 'Launch Special',
    endDate: new Date('2025-03-01T00:00:00'),
    savings: 49, // regularPrice - currentPrice
  },
}

// Helper to check if promo is still active
export function isPromoActive(): boolean {
  if (!PRICING.promo.active) return false
  return new Date() < PRICING.promo.endDate
}

// Helper to get days remaining in promo
export function getPromoTimeRemaining(): { days: number; hours: number; minutes: number } | null {
  if (!isPromoActive()) return null

  const now = new Date()
  const end = PRICING.promo.endDate
  const diff = end.getTime() - now.getTime()

  if (diff <= 0) return null

  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))

  return { days, hours, minutes }
}

// Get the price to charge (for payment processing)
export function getActivePrice(): number {
  return isPromoActive() ? PRICING.currentPrice : PRICING.regularPrice
}
