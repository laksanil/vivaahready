import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function setAllDealbreakers() {
  try {
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

    console.log(`Successfully set all preferences as deal-breakers for ${result.count} profiles`)
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

setAllDealbreakers()
