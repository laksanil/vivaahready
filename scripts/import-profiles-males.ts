import { PrismaClient } from '@prisma/client'
import * as fs from 'fs'

const prisma = new PrismaClient()

// Helper to parse height to standard format like 5'4"
function normalizeHeight(height: string | null | undefined): string | null {
  if (!height) return null

  const cleaned = height.trim()

  // Already in correct format 5'10"
  if (/^\d+'\d+"?$/.test(cleaned)) {
    return cleaned.replace(/"$/, '') + '"'
  }

  // Format: 5' 10'' or 5' 3''
  const spaceMatch = cleaned.match(/^(\d+)'\s*(\d+)''?$/)
  if (spaceMatch) {
    return `${spaceMatch[1]}'${spaceMatch[2]}"`
  }

  // Format: 5.6 or 5.10
  const decimalMatch = cleaned.match(/^(\d+)\.(\d+)/)
  if (decimalMatch) {
    return `${decimalMatch[1]}'${decimalMatch[2]}"`
  }

  // Format: 6 feet or 6' 1 "
  const feetInchMatch = cleaned.match(/^(\d+)(?:\s*feet|\s*ft|')\s*(\d+)?/i)
  if (feetInchMatch) {
    const feet = feetInchMatch[1]
    const inches = feetInchMatch[2] || '0'
    return `${feet}'${inches}"`
  }

  // Format: 5ft- 5'4" - take first number as height
  const rangeMatch = cleaned.match(/^(\d+)(?:ft|')/)
  if (rangeMatch) {
    return `${rangeMatch[1]}'0"`
  }

  return null
}

// Parse height preference for males - need both min and max
function parseHeightPreference(pref: string | null | undefined): { min: string | null, max: string | null } {
  if (!pref) return { min: null, max: null }

  const cleaned = pref.trim().toLowerCase()

  // Format: "5'3" to 5'6"" or "5'2" to 5'7""
  const rangeMatch = pref.match(/(\d+[''′.]?\s*\d*)"?\s*(?:to|-)\s*(\d+[''′.]?\s*\d*)/i)
  if (rangeMatch) {
    return {
      min: normalizeHeight(rangeMatch[1]),
      max: normalizeHeight(rangeMatch[2])
    }
  }

  // Format: "4'10" - 5'6""
  const dashRangeMatch = pref.match(/(\d+'?\d*"?)\s*-\s*(\d+'?\d*"?)/)
  if (dashRangeMatch) {
    return {
      min: normalizeHeight(dashRangeMatch[1]),
      max: normalizeHeight(dashRangeMatch[2])
    }
  }

  // Format: "5' 3" inches and up" or "above 5 feet" or "5'3" and above"
  if (cleaned.includes('above') || cleaned.includes('and up') || cleaned.includes('+')) {
    const heightMatch = pref.match(/(\d+[''′.]?\s*\d*)/i)
    if (heightMatch) {
      return { min: normalizeHeight(heightMatch[1]), max: null }
    }
  }

  // Format: "> 5.2ft"
  const gtMatch = pref.match(/>\s*(\d+\.?\d*)/i)
  if (gtMatch) {
    return { min: normalizeHeight(gtMatch[1]), max: null }
  }

  // Format: "5ft 1' to 5ft 5''"
  const ftRangeMatch = pref.match(/(\d+)\s*(?:ft|feet)\s*(\d+)?['']*\s*to\s*(\d+)\s*(?:ft|feet)\s*(\d+)?/i)
  if (ftRangeMatch) {
    const minFt = ftRangeMatch[1]
    const minIn = ftRangeMatch[2] || '0'
    const maxFt = ftRangeMatch[3]
    const maxIn = ftRangeMatch[4] || '0'
    return {
      min: `${minFt}'${minIn}"`,
      max: `${maxFt}'${maxIn}"`
    }
  }

  // Single value - use as both min and max for males
  const singleMatch = pref.match(/(\d+[''′.]?\d*"?)/)
  if (singleMatch) {
    const height = normalizeHeight(singleMatch[1])
    return { min: height, max: height }
  }

  return { min: null, max: null }
}

// Calculate age from DOB
function calculateAge(dob: string): number {
  const parts = dob.split('/')
  let month: number, day: number, year: number

  if (parts.length === 3) {
    month = parseInt(parts[0])
    day = parseInt(parts[1])
    year = parseInt(parts[2])
  } else if (parts.length === 2) {
    month = parseInt(parts[0])
    day = 1
    year = parseInt(parts[1])
  } else {
    return 0
  }

  const today = new Date()
  const birthDate = new Date(year, month - 1, day)
  let age = today.getFullYear() - birthDate.getFullYear()
  const monthDiff = today.getMonth() - birthDate.getMonth()

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--
  }

  return age
}

// Parse age preference for males - looking for younger or same age
function parseAgePreference(pref: string | null | undefined, ownAge: number): { min: number, max: number } {
  if (!pref) {
    // Default: same age or up to 5 years younger
    return { min: ownAge - 5, max: ownAge }
  }

  const cleaned = pref.toLowerCase()

  // Format: "30 to 40 years old"
  const rangeMatch = pref.match(/(\d+)\s*(?:to|-)\s*(\d+)/)
  if (rangeMatch) {
    return { min: parseInt(rangeMatch[1]), max: parseInt(rangeMatch[2]) }
  }

  // Format: "< 3 years" or "< 5 years"
  if (cleaned.includes('< 3') || cleaned.includes('less than 3')) {
    return { min: ownAge - 3, max: ownAge }
  }
  if (cleaned.includes('< 5') || cleaned.includes('less than 5')) {
    return { min: ownAge - 5, max: ownAge }
  }

  // Format: "between 3 to 5 years"
  if (cleaned.includes('3 to 5') || cleaned.includes('between 3')) {
    return { min: ownAge - 5, max: ownAge }
  }

  // Format: "Up to 9 years"
  const upToMatch = cleaned.match(/up to (\d+)/)
  if (upToMatch) {
    return { min: ownAge - parseInt(upToMatch[1]), max: ownAge }
  }

  // Format: "0-10 years"
  const dashMatch = cleaned.match(/(\d+)\s*-\s*(\d+)/)
  if (dashMatch) {
    return { min: ownAge - parseInt(dashMatch[2]), max: ownAge + parseInt(dashMatch[1]) }
  }

  // Format: "29-36" (absolute ages)
  const absMatch = pref.match(/^(\d{2})\s*-\s*(\d{2})$/)
  if (absMatch) {
    return { min: parseInt(absMatch[1]), max: parseInt(absMatch[2]) }
  }

  return { min: ownAge - 5, max: ownAge }
}

// Normalize dietary preference
function normalizeDiet(diet: string | null | undefined): string | null {
  if (!diet) return null

  const cleaned = diet.toLowerCase().trim()

  if (cleaned.includes('non') || cleaned === 'non vegetarian') return 'non_vegetarian'
  if (cleaned.includes('vegan')) return 'vegan'
  if (cleaned.includes('egg')) return 'eggetarian'
  if (cleaned.includes('vegetarian') || cleaned === 'veg') return 'vegetarian'
  if (cleaned.includes('jain')) return 'jain'

  return diet.trim()
}

// Normalize marital status
function normalizeMaritalStatus(status: string | null | undefined): string {
  if (!status) return 'never_married'

  const cleaned = status.toLowerCase().trim()

  if (cleaned.includes('never') || cleaned === 'single') return 'never_married'
  if (cleaned.includes('divorced')) return 'divorced'
  if (cleaned.includes('widowed')) return 'widowed'

  return 'never_married'
}

// Normalize qualification
function normalizeQualification(qual: string | null | undefined): string {
  if (!qual) return 'bachelors'

  const cleaned = qual.toLowerCase().trim()

  if (cleaned.includes('ph.d') || cleaned.includes('phd') || cleaned.includes('doctorate')) return 'phd'
  if (cleaned.includes('doctor') && !cleaned.includes('doctorate')) return 'doctor'
  if (cleaned.includes('mba')) return 'mba'
  if (cleaned.includes('master')) return 'masters'
  if (cleaned.includes('bachelor') || cleaned.includes('undergrad') || cleaned.includes('bs') || cleaned.includes('ba') || cleaned.includes('b.tech')) return 'bachelors'
  if (cleaned.includes('professional')) return 'professional'
  if (cleaned === 'any' || cleaned.includes('not specific')) return 'bachelors'

  return 'bachelors'
}

// Normalize income
function normalizeIncome(income: string | null | undefined): string | null {
  if (!income || income.toLowerCase().includes("doesn't matter")) return null

  const cleaned = income.toLowerCase().trim()

  if (cleaned.includes('200k') || cleaned.includes('200000') || cleaned.includes('>200') || cleaned.includes('200 and above')) return '200000+'
  if (cleaned.includes('150k') || cleaned.includes('150-200') || cleaned.includes('150000')) return '150000_200000'
  if (cleaned.includes('100k') || cleaned.includes('>100') || cleaned.includes('100-150') || cleaned.includes('100000')) return '100000_150000'

  return null
}

// Check if preference is "doesn't matter"
function doesntMatter(value: string | null | undefined): boolean {
  if (!value) return true
  const cleaned = value.toLowerCase().trim()
  return cleaned.includes("doesn't matter") || cleaned === 'n/a' || cleaned === 'na' || cleaned === '' || cleaned === 'any' || cleaned === 'flexible'
}

// Parse CSV
function parseCSV(content: string): Record<string, string>[] {
  const lines = content.split('\n')
  const headers = parseCSVLine(lines[0])
  const rows: Record<string, string>[] = []

  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue

    const values = parseCSVLine(lines[i])
    const row: Record<string, string> = {}

    headers.forEach((header, index) => {
      row[header] = values[index] || ''
    })

    rows.push(row)
  }

  return rows
}

function parseCSVLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]

    if (char === '"') {
      inQuotes = !inQuotes
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim())
      current = ''
    } else {
      current += char
    }
  }

  result.push(current.trim())
  return result
}

// Split name into first and last
function splitName(fullName: string): { firstName: string, lastName: string } {
  // Remove extra text like "(Rocky)"
  const cleanedName = fullName.replace(/\(.*?\)/g, '').trim()
  const parts = cleanedName.trim().split(/\s+/)

  if (parts.length === 1) {
    return { firstName: parts[0], lastName: '' }
  }
  return {
    firstName: parts[0],
    lastName: parts.slice(1).join(' ')
  }
}

// Format display name (First L.)
function formatDisplayName(firstName: string, lastName: string): string {
  if (!lastName) return firstName
  return `${firstName} ${lastName.charAt(0)}.`
}

// Extract own height from the spreadsheet (different column structure)
function extractOwnHeight(row: Record<string, string>): string | null {
  // In this spreadsheet, the first Height column might be their own height
  // Need to check context
  const heightValue = row['Height'] || ''

  // If it looks like a preference (contains range, "above", etc), it's not own height
  if (heightValue.toLowerCase().includes('to') ||
      heightValue.toLowerCase().includes('above') ||
      heightValue.toLowerCase().includes('and up') ||
      heightValue.includes('-')) {
    return null
  }

  return normalizeHeight(heightValue)
}

// Map of actual heights for males (manually extracted)
const maleHeights: Record<string, string> = {
  'jaidevsreekumar@gmail.com': "5'10\"",
  'askarthikarcot@gmail.com': "6'0\"",
  'ssayyala@gmail.com': "5'6\"",
  'satyabhama.g@gmail.com': "5'6\"",
  'visritu@gmail.com': "5'8\"",
  'badri.210.narayan@gmail.com': "5'10\"",
  'galgalirahul99@gmail.com': "5'10\"",
  'apv737@gmail.com': "5'8\"",
  'gkuntimad@gmail.com': "6'1\"",
  'revathi9605@gmail.com': "5'9\"",
  'nvksailaja@gmail.com': "6'0\"",
  'vaskrish66@yahoo.com': "5'9\"",
  'jayarama@gmail.com': "5'8\"",
  'ushasri.k@gmail.com': "5'10\"",
  'sunnygovind24@gmail.com': "5'9\"",
  'chithrasuresh@gmail.com': "5'8\"",
}

async function importProfiles() {
  console.log('Starting male profile import...\n')

  // Read CSV file
  const csvPath = '/tmp/profiles2.csv'
  const csvContent = fs.readFileSync(csvPath, 'utf-8')
  const rows = parseCSV(csvContent)

  console.log(`Found ${rows.length} profiles to import\n`)

  // Track seen emails to skip duplicates
  const seenEmails = new Set<string>()

  let successCount = 0
  let errorCount = 0
  let skipCount = 0

  // Get the current max VR number
  const lastProfile = await prisma.profile.findFirst({
    where: { odNumber: { startsWith: 'VR-' } },
    orderBy: { odNumber: 'desc' }
  })
  let vrCounter = lastProfile ? parseInt(lastProfile.odNumber.replace('VR-', '')) + 1 : 43

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
    const fullName = row['Full Name'] || ''
    const email = row['Email Address'] || ''

    if (!email || !fullName) {
      console.log(`Skipping row ${i + 1}: Missing email or name`)
      errorCount++
      continue
    }

    // Skip duplicates within this import
    if (seenEmails.has(email)) {
      console.log(`Skipping ${fullName}: Duplicate email in this batch`)
      skipCount++
      continue
    }
    seenEmails.add(email)

    console.log(`\n[${i + 1}/${rows.length}] Importing: ${fullName}`)

    try {
      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email },
        include: { profile: true }
      })

      if (existingUser?.profile) {
        console.log(`  → Skipping: Profile already exists`)
        skipCount++
        continue
      }

      const { firstName, lastName } = splitName(fullName)
      const displayName = formatDisplayName(firstName, lastName)

      // All profiles in this spreadsheet are MALE
      const gender = 'male'

      // Parse DOB and calculate age
      const dobRaw = row['Date of Birth MM/YYYY'] || ''
      const dob = dobRaw.includes('/') ? dobRaw : null
      const age = dob ? calculateAge(dob) : 30

      // Parse age preference (males want same age or younger)
      const agePref = parseAgePreference(row['Age Difference Range'], age)

      // Parse height preference (males need both min and max)
      const heightPref = parseHeightPreference(row['Height'])

      // Get community preference
      const prefCasteRaw = row['Caste/Sub caste'] || ''
      const prefCommunity = prefCasteRaw.toLowerCase().includes('same') ? 'same_as_mine' :
                           doesntMatter(prefCasteRaw) ? 'doesnt_matter' : prefCasteRaw

      // Get gotra preference
      const prefGotraRaw = row['Gothra'] || ''
      const prefGotra = prefGotraRaw.toLowerCase().includes('different') ? 'different' :
                       doesntMatter(prefGotraRaw) ? 'doesnt_matter' : prefGotraRaw

      // Get diet preference
      const prefDietRaw = row['Dietry prefernce (if any)'] || ''
      const prefDiet = doesntMatter(prefDietRaw) ? null : normalizeDiet(prefDietRaw)

      // Get location preference
      const prefLocationRaw = row['Location preference (if any)'] || ''
      const prefLocation = doesntMatter(prefLocationRaw) || prefLocationRaw.toLowerCase() === 'none' ? null : prefLocationRaw

      // Get citizenship preference
      const prefCitizenshipRaw = row['Current Location'] || ''
      const prefCitizenship = prefCitizenshipRaw.toLowerCase().includes('usa') ||
                             prefCitizenshipRaw.toLowerCase().includes('us') ? 'USA' :
                             prefCitizenshipRaw.toLowerCase().includes('india') ? 'India' :
                             'USA'

      // Extract hobbies from "About yourself"
      const aboutKey = Object.keys(row).find(k => k.includes('About yourself'))
      const aboutMe = aboutKey ? row[aboutKey] : ''

      // Extract ideal partner qualities
      const idealKey = Object.keys(row).find(k => k.toLowerCase().includes('ideal partner'))
      const idealPartnerDesc = idealKey ? row[idealKey] : ''

      // Get own community/caste
      const communityRaw = row['Caste (and/or subcaste)'] || ''
      const communityParts = communityRaw.split(/[,\/]/)
      const community = communityParts[0]?.trim() || null
      const subCommunity = communityParts[1]?.trim() || null

      // Get current location
      const locationKey = Object.keys(row).find(k => k.includes('Current Location') && k.includes('State'))
      const currentLocation = locationKey ? row[locationKey] : ''

      // Get own height from our manual map
      const ownHeight = maleHeights[email] || null

      // Create or update user
      let user = existingUser
      if (!user) {
        user = await prisma.user.create({
          data: {
            email,
            name: displayName,
            phone: row['Contact phone'] || null,
          }
        })
        console.log(`  → Created user: ${user.id}`)
      }

      // Generate VR ID
      const vrId = `VR-${String(vrCounter).padStart(3, '0')}`
      vrCounter++

      // Create profile
      const profile = await prisma.profile.create({
        data: {
          userId: user.id,
          odNumber: vrId,

          // Basic Info
          firstName,
          lastName,
          gender,
          dateOfBirth: dob,
          age: age > 0 ? String(age) : null,
          placeOfBirth: row['Place of Birth'] || null,
          height: ownHeight,
          dietaryPreference: normalizeDiet(row['Dietery Preference']),
          motherTongue: (row['Languages known'] || '').split(',')[0]?.trim() || null,
          languagesKnown: row['Languages known'] || null,
          maritalStatus: normalizeMaritalStatus(row['Marital status']),
          hasChildren: 'no',

          // Contact & Social
          linkedinProfile: row['Linkedin Profile link'] || null,
          facebookInstagram: row['Instagram and Facebook profiles'] || null,
          photoUrls: row['Your Latest photographs (Upto 3)'] || null,

          // Family
          fatherName: row["Father's Name"] || null,
          motherName: row["Mother's Name"] || null,
          siblingDetails: row['Siblings'] || null,
          familyLocation: row['Family Location'] || null,

          // Education & Career
          qualification: normalizeQualification(row['Qualification']),
          university: row['University (Mention all the universities you have attended)'] || null,
          occupation: row['Occupation/Profession'] || null,
          workingAs: row['Occupation/Profession'] || null,
          annualIncome: normalizeIncome(row['Annual income or any other preference']),
          currentLocation: currentLocation || null,

          // Background
          religion: 'hindu',
          community: community,
          subCommunity: subCommunity,
          caste: community,
          gotra: row['Gotra'] || null,

          // Lifestyle
          aboutMe: aboutMe || null,
          hobbies: aboutMe || null,
          smoking: 'no',
          drinking: 'no',

          // Partner Preferences
          prefAgeMin: String(agePref.min),
          prefAgeMax: String(agePref.max),
          prefAgeDiff: row['Age Difference Range'] || null,
          prefHeightMin: heightPref.min,
          prefHeightMax: heightPref.max, // Males need max height
          prefDiet: prefDiet,
          prefCommunity: prefCommunity,
          prefGotra: prefGotra,
          prefQualification: 'bachelors',
          prefLocation: prefLocation,
          prefCitizenship: prefCitizenship,
          idealPartnerDesc: idealPartnerDesc || null,

          // Deal-breaker flags
          prefAgeIsDealbreaker: true,
          prefHeightIsDealbreaker: heightPref.min !== null,
          prefDietIsDealbreaker: prefDiet !== null && !doesntMatter(prefDietRaw),
          prefCommunityIsDealbreaker: prefCommunity === 'same_as_mine',
          prefGotraIsDealbreaker: prefGotra === 'different',
          prefEducationIsDealbreaker: true,
          prefLocationIsDealbreaker: prefLocation !== null,
          prefCitizenshipIsDealbreaker: true,

          // Metadata
          citizenship: row['Country of Citizenship'] || 'USA',
          residencyStatus: 'citizen',
          grewUpIn: 'USA',
          country: 'USA',
          isImported: true,

          // Status
          approvalStatus: 'approved',
          approvalDate: new Date(),
          isVerified: true,
          isActive: true,
          profileScore: 80,
        }
      })

      console.log(`  → Created profile: ${profile.id} (${vrId})`)

      // Create subscription
      await prisma.subscription.create({
        data: {
          userId: user.id,
          plan: 'free',
          status: 'active',
        }
      })

      console.log(`  → Created subscription`)
      successCount++

    } catch (error) {
      console.error(`  → Error: ${error}`)
      errorCount++
    }
  }

  console.log(`\n${'='.repeat(50)}`)
  console.log(`Import complete!`)
  console.log(`  Success: ${successCount}`)
  console.log(`  Skipped: ${skipCount}`)
  console.log(`  Errors: ${errorCount}`)
  console.log(`${'='.repeat(50)}`)
}

importProfiles()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
