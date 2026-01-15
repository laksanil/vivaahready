import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isAdminAuthenticated } from '@/lib/admin'

export async function POST() {
  try {
    const isAdmin = await isAdminAuthenticated()
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Update all profiles to set all preferences as deal-breakers
    const result = await prisma.profile.updateMany({
      data: {
        prefAgeIsDealbreaker: true,
        prefHeightIsDealbreaker: true,
        prefMaritalStatusIsDealbreaker: true,
        prefCommunityIsDealbreaker: true,
        prefGotraIsDealbreaker: true,
        prefDietIsDealbreaker: true,
        prefSmokingIsDealbreaker: true,
        prefDrinkingIsDealbreaker: true,
        prefLocationIsDealbreaker: true,
        prefCitizenshipIsDealbreaker: true,
        prefGrewUpInIsDealbreaker: true,
        prefRelocationIsDealbreaker: true,
        prefEducationIsDealbreaker: true,
        prefWorkAreaIsDealbreaker: true,
        prefIncomeIsDealbreaker: true,
        prefOccupationIsDealbreaker: true,
        prefFamilyValuesIsDealbreaker: true,
        prefFamilyLocationIsDealbreaker: true,
        prefMotherTongueIsDealbreaker: true,
        prefSubCommunityIsDealbreaker: true,
        prefPetsIsDealbreaker: true,
      }
    })

    return NextResponse.json({
      message: `Successfully set all preferences as deal-breakers for ${result.count} profiles`,
      count: result.count,
    })
  } catch (error) {
    console.error('Set dealbreakers error:', error)
    return NextResponse.json({ error: 'Failed to set deal-breakers' }, { status: 500 })
  }
}
