import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET - Fetch current verification price (public)
export async function GET() {
  try {
    // Dev price override for local testing
    const devPrice = process.env.DEV_VERIFICATION_PRICE
    if (devPrice) {
      return NextResponse.json({
        price: parseFloat(devPrice),
        isPromo: false,
        regularPrice: parseFloat(devPrice),
      })
    }

    let settings = await prisma.settings.findUnique({
      where: { id: 'default' },
    })

    // Default if no settings exist
    if (!settings) {
      return NextResponse.json({
        price: 50,
        isPromo: false,
        regularPrice: 50,
      })
    }

    // Check if promo is active
    const now = new Date()
    const isPromoActive = settings.promoPrice &&
      settings.promoEndDate &&
      new Date(settings.promoEndDate) > now

    const currentPrice = isPromoActive ? settings.promoPrice! : settings.verificationPrice

    return NextResponse.json({
      price: currentPrice,
      isPromo: isPromoActive,
      regularPrice: settings.verificationPrice,
      promoEndDate: isPromoActive ? settings.promoEndDate : null,
    })
  } catch (error) {
    console.error('Error fetching pricing:', error)
    // Return default on error
    return NextResponse.json({
      price: 50,
      isPromo: false,
      regularPrice: 50,
    })
  }
}
