// Pricing Configuration
// Update these values to change pricing across the site

export const PRICING = {
  // Verification price
  regularPrice: 100,
}

// Get the price to charge (for payment processing)
export function getActivePrice(): number {
  return PRICING.regularPrice
}
