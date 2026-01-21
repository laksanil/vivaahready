import { PrismaClient } from '@prisma/client'
import * as fs from 'fs'
import * as path from 'path'

const prisma = new PrismaClient()

// Helper to parse height to standard format like 5'4"
function normalizeHeight(height: string | null | undefined): string | null {
  if (!height) return null

  // Already in correct format
  if (/^\d+'\d+"?$/.test(height.trim())) {
    return height.trim().replace(/"$/, '') + '"'
  }

  // Format: 5.4 or 5.2
  const decimalMatch = height.match(/^(\d+)\.(\d+)/)
  if (decimalMatch) {
    return `${decimalMatch[1]}'${decimalMatch[2]}"`
  }

  // Format: 5'3 (missing ")
  const partialMatch = height.match(/^(\d+)'(\d+)$/)
  if (partialMatch) {
    return `${partialMatch[1]}'${partialMatch[2]}"`
  }

  // Format: 5 Feet or 5ft
  const feetOnlyMatch = height.match(/^(\d+)\s*(feet|ft|f)/i)
  if (feetOnlyMatch) {
    return `${feetOnlyMatch[1]}'0"`
  }

  // Format: 166cm - convert to feet/inches
  const cmMatch = height.match(/^(\d+)\s*cm/i)
  if (cmMatch) {
    const cm = parseInt(cmMatch[1])
    const totalInches = cm / 2.54
    const feet = Math.floor(totalInches / 12)
    const inches = Math.round(totalInches % 12)
    return `${feet}'${inches}"`
  }

  // Return cleaned version
  return height.trim()
}

// Parse height preference for min/max
function parseHeightPreference(pref: string | null | undefined, gender: string): { min: string | null, max: string | null } {
  if (!pref) return { min: null, max: null }

  const cleaned = pref.trim().toLowerCase()

  // Format: "5'5" and above" or "5'8+"
  if (cleaned.includes('above') || cleaned.includes('+') || cleaned.includes('or above')) {
    const heightMatch = pref.match(/(\d+[''′]?\d*"?)/i)
    if (heightMatch) {
      return { min: normalizeHeight(heightMatch[1]), max: null }
    }
  }

  // Format: "5.2 to 5.7" or "5'0" - 5'9""
  const rangeMatch = pref.match(/(\d+[.'']?\d*)"?\s*(?:to|-)\s*(\d+[.'']?\d*)/i)
  if (rangeMatch) {
    return {
      min: normalizeHeight(rangeMatch[1]),
      max: gender === 'male' ? normalizeHeight(rangeMatch[2]) : null
    }
  }

  // Format: "5ft 5in - 6ft 4inch"
  const ftInRangeMatch = pref.match(/(\d+)\s*(?:ft|feet)\s*(\d+)?\s*(?:in|inch)?\s*-\s*(\d+)\s*(?:ft|feet)\s*(\d+)?\s*(?:in|inch)?/i)
  if (ftInRangeMatch) {
    const minFt = ftInRangeMatch[1]
    const minIn = ftInRangeMatch[2] || '0'
    const maxFt = ftInRangeMatch[3]
    const maxIn = ftInRangeMatch[4] || '0'
    return {
      min: `${minFt}'${minIn}"`,
      max: gender === 'male' ? `${maxFt}'${maxIn}"` : null
    }
  }

  // Single height value - treat as minimum
  const singleMatch = pref.match(/(\d+[''′.]?\d*"?)/)
  if (singleMatch) {
    return { min: normalizeHeight(singleMatch[1]), max: null }
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
    // MM/YYYY format
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

// Parse age difference preference
function parseAgeDiff(pref: string | null | undefined): number {
  if (!pref) return 5 // Default to 5 years

  const cleaned = pref.toLowerCase()

  // "< 3 years" or "less than 3"
  if (cleaned.includes('< 3') || cleaned.includes('less than 3')) return 3

  // "< 5 years" or "less than 5"
  if (cleaned.includes('< 5') || cleaned.includes('less than 5')) return 5

  // "3 to 5 years" or "between 3 to 5"
  if (cleaned.includes('3 to 5') || cleaned.includes('between 3') || cleaned.includes('3-5')) return 5

  // "-1 to +3" format
  const rangeMatch = cleaned.match(/-?\d+\s*to\s*\+?(\d+)/)
  if (rangeMatch) return parseInt(rangeMatch[1])

  return 5
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
  if (cleaned.includes('bachelor') || cleaned.includes('undergrad') || cleaned.includes('bs') || cleaned.includes('ba')) return 'bachelors'
  if (cleaned.includes('professional')) return 'professional'

  return 'bachelors'
}

// Normalize income
function normalizeIncome(income: string | null | undefined): string | null {
  if (!income || income.toLowerCase().includes("doesn't matter")) return null

  const cleaned = income.toLowerCase().trim()

  if (cleaned.includes('200k') || cleaned.includes('200000') || cleaned.includes('>200')) return '200000+'
  if (cleaned.includes('150k') || cleaned.includes('150-200') || cleaned.includes('150000')) return '150000_200000'
  if (cleaned.includes('100k') || cleaned.includes('>100') || cleaned.includes('100-150') || cleaned.includes('100000')) return '100000_150000'

  return null
}

// Check if preference is "doesn't matter"
function doesntMatter(value: string | null | undefined): boolean {
  if (!value) return true
  const cleaned = value.toLowerCase().trim()
  return cleaned.includes("doesn't matter") || cleaned === 'n/a' || cleaned === 'na' || cleaned === ''
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
  const parts = fullName.trim().split(/\s+/)
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

// Extract own height from profile (not preference)
function extractOwnHeight(row: Record<string, string>): string | null {
  // The spreadsheet has "Height" column for their own height
  // and partner preferences in later columns
  const placeOfBirth = row['Place of Birth'] || ''
  const heightValue = row['Height'] || ''

  // If the height value looks like a preference (contains "above", range, etc), skip it
  if (heightValue.toLowerCase().includes('above') ||
      heightValue.includes(' - ') ||
      heightValue.includes(' to ') ||
      heightValue.includes('+')) {
    // This is likely the preference column, need to find actual height
    // Try to extract from other patterns
    return null
  }

  return normalizeHeight(heightValue)
}

async function importProfiles() {
  console.log('Starting profile import...\n')

  // Read CSV file
  const csvPath = '/tmp/profiles.csv'
  const csvContent = fs.readFileSync(csvPath, 'utf-8')
  const rows = parseCSV(csvContent)

  console.log(`Found ${rows.length} profiles to import\n`)

  let successCount = 0
  let errorCount = 0

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
    const fullName = row['Full Name'] || ''
    const email = row['Email Address'] || ''

    if (!email || !fullName) {
      console.log(`Skipping row ${i + 1}: Missing email or name`)
      errorCount++
      continue
    }

    console.log(`\n[${ i + 1}/${rows.length}] Importing: ${fullName}`)

    try {
      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email },
        include: { profile: true }
      })

      if (existingUser?.profile) {
        console.log(`  → Skipping: Profile already exists`)
        continue
      }

      const { firstName, lastName } = splitName(fullName)
      const displayName = formatDisplayName(firstName, lastName)

      // Determine gender (all female except Harish Raman)
      const gender = fullName.toLowerCase().includes('harish') ? 'male' : 'female'

      // Parse DOB and calculate age
      const dobRaw = row['Date of Birth MM/YYYY'] || ''
      const dob = dobRaw.includes('/') ? dobRaw : null
      const age = dob ? calculateAge(dob) : 0

      // Parse age preference
      const ageDiff = parseAgeDiff(row['Age Difference Range'])
      let prefAgeMin: number, prefAgeMax: number

      if (gender === 'female') {
        // Females want same age or older
        prefAgeMin = age
        prefAgeMax = age + ageDiff
      } else {
        // Males want same age or younger
        prefAgeMin = age - ageDiff
        prefAgeMax = age
      }

      // Parse height preference
      const heightPrefRaw = row['Age Difference Range'] ?
        // Height preference is in a different column - need to find it
        Object.entries(row).find(([k, v]) => k === 'Height' && (v.includes('above') || v.includes(' - ') || v.includes('+')))?.[1] || ''
        : ''

      // Actually, let's look for the second Height column or parse from the data
      // The spreadsheet structure has the preference columns after personal info
      const heightPref = parseHeightPreference(
        row['Height'] && (row['Height'].includes('above') || row['Height'].includes('-') || row['Height'].includes('+'))
          ? row['Height']
          : null,
        gender
      )

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
      const prefLocation = doesntMatter(prefLocationRaw) ? null : prefLocationRaw

      // Get citizenship preference
      const prefCitizenshipRaw = row['Current Location'] || '' // This is partner's location preference
      const prefCitizenship = prefCitizenshipRaw.toLowerCase().includes('usa') ||
                             prefCitizenshipRaw.toLowerCase().includes('us') ? 'USA' :
                             prefCitizenshipRaw.toLowerCase().includes('india') ? 'India' :
                             prefCitizenshipRaw || 'USA'

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

      // Determine own height (need to extract from spreadsheet properly)
      // Looking at the data, the first "Height" value might be preference for some profiles
      // We need to infer own height - for now set to null and fix manually if needed
      const ownHeight = extractOwnHeight(row)

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
      const vrId = `VR-${String(i + 1).padStart(3, '0')}`

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
          motherTongue: (row['Languages Known'] || '').split(',')[0]?.trim() || null,
          languagesKnown: row['Languages Known'] || null,
          maritalStatus: normalizeMaritalStatus(row['Marital status']),
          hasChildren: 'no',

          // Contact & Social
          linkedinProfile: row['LinkedIn profile link'] || null,
          facebookInstagram: row['Face book and Instagram profiles'] || null,
          photoUrls: row['Your photos ( please upload up to 3 photos)'] || null,

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
          hobbies: aboutMe || null, // Use about me for hobbies
          smoking: 'no',
          drinking: 'no',

          // Partner Preferences
          prefAgeMin: String(prefAgeMin),
          prefAgeMax: String(prefAgeMax),
          prefAgeDiff: row['Age Difference Range'] || null,
          prefHeightMin: heightPref.min,
          prefHeightMax: heightPref.max,
          prefDiet: prefDiet,
          prefCommunity: prefCommunity,
          prefGotra: prefGotra,
          prefQualification: 'bachelors', // Minimum bachelors for all
          prefLocation: prefLocation,
          prefCitizenship: prefCitizenship,
          idealPartnerDesc: idealPartnerDesc || null,

          // Deal-breaker flags
          prefAgeIsDealbreaker: true,
          prefHeightIsDealbreaker: heightPref.min !== null,
          prefDietIsDealbreaker: prefDiet !== null,
          prefCommunityIsDealbreaker: prefCommunity === 'same_as_mine',
          prefGotraIsDealbreaker: prefGotra === 'different',
          prefEducationIsDealbreaker: true, // Always dealbreaker
          prefLocationIsDealbreaker: prefLocation !== null,
          prefCitizenshipIsDealbreaker: true,

          // Metadata
          citizenship: row['Country of citizenship'] || 'USA',
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
  console.log(`  Errors: ${errorCount}`)
  console.log(`${'='.repeat(50)}`)
}

importProfiles()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
