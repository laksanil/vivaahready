// @vitest-environment node

import { beforeAll, describe, expect, it, vi } from 'vitest'
import { prisma } from '@/lib/prisma'

const getServerSessionMock = vi.fn()
const getTargetUserIdMock = vi.fn()
const sendNewInterestEmailMock = vi.fn()
const sendInterestAcceptedEmailMock = vi.fn()
const awardInterestPointsMock = vi.fn()
const awardResponsePointsMock = vi.fn()

vi.mock('next-auth', () => ({
  getServerSession: getServerSessionMock,
}))

vi.mock('@/lib/auth', () => ({
  authOptions: {},
}))

vi.mock('@/lib/admin', () => ({
  getTargetUserId: getTargetUserIdMock,
}))

vi.mock('@/lib/email', () => ({
  sendNewInterestEmail: sendNewInterestEmailMock,
  sendInterestAcceptedEmail: sendInterestAcceptedEmailMock,
}))

vi.mock('@/lib/engagementPoints', () => ({
  awardInterestPoints: awardInterestPointsMock,
  awardResponsePoints: awardResponsePointsMock,
}))

type SeedUser = {
  id: string
  email: string
  name: string
  phone: string
  gender: 'male' | 'female'
  height: string
  dateOfBirth: string
  currentLocation: string
  zipCode: string
  odNumber: string
  referralCode: string
  prefHeightMin: string
}

const QA_USERS: SeedUser[] = [
  {
    id: 'qa_full_user_a',
    email: 'qa.full.a+local@vivaahready.test',
    name: 'QA User A',
    phone: '+14085550001',
    gender: 'female',
    height: `5'5"`,
    dateOfBirth: '03/15/1995',
    currentLocation: 'San Jose, California',
    zipCode: '95112',
    odNumber: 'VRQA20260303A',
    referralCode: 'QAREF2026A',
    prefHeightMin: `5'6"`,
  },
  {
    id: 'qa_full_user_b',
    email: 'qa.full.b+local@vivaahready.test',
    name: 'QA User B',
    phone: '+14085550002',
    gender: 'male',
    height: `5'6"`,
    dateOfBirth: '05/10/1993',
    currentLocation: 'Sunnyvale, California',
    zipCode: '94086',
    odNumber: 'VRQA20260303B',
    referralCode: 'QAREF2026B',
    prefHeightMin: `5'0"`,
  },
  {
    id: 'qa_full_user_c',
    email: 'qa.full.c+local@vivaahready.test',
    name: 'QA User C',
    phone: '+14085550003',
    gender: 'male',
    height: `5'8"`,
    dateOfBirth: '08/22/1992',
    currentLocation: 'Santa Clara, California',
    zipCode: '95050',
    odNumber: 'VRQA20260303C',
    referralCode: 'QAREF2026C',
    prefHeightMin: `5'0"`,
  },
  {
    id: 'qa_full_user_d',
    email: 'qa.full.d+local@vivaahready.test',
    name: 'QA User D',
    phone: '+14085550004',
    gender: 'female',
    height: `5'4"`,
    dateOfBirth: '11/07/1994',
    currentLocation: 'Mountain View, California',
    zipCode: '94043',
    odNumber: 'VRQA20260303D',
    referralCode: 'QAREF2026D',
    prefHeightMin: `5'0"`,
  },
  {
    id: 'qa_full_user_e',
    email: 'qa.full.e+local@vivaahready.test',
    name: 'QA User E',
    phone: '+14085550005',
    gender: 'female',
    height: `5'7"`,
    dateOfBirth: '01/30/1991',
    currentLocation: 'Palo Alto, California',
    zipCode: '94301',
    odNumber: 'VRQA20260303E',
    referralCode: 'QAREF2026E',
    prefHeightMin: `5'0"`,
  },
]

const PROFILE_BY_USER_ID = new Map<string, string>()

const activeUser = { userId: '' }

function buildRequest(method: 'GET' | 'POST' | 'PUT', url: string, body?: Record<string, unknown>) {
  return new Request(url, {
    method,
    headers: body ? { 'content-type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  })
}

function isLocalDb(): boolean {
  const databaseUrl = process.env.DATABASE_URL || ''
  let host = ''
  try {
    host = new URL(databaseUrl).hostname
  } catch {
    host = ''
  }

  const allowRemoteQaSeed = process.env.ALLOW_QA_TEST_ENV_SEED === 'true'
  const isLocal = host === 'localhost' || host === '127.0.0.1' || host.endsWith('.local')

  if (!isLocal && allowRemoteQaSeed) {
    console.warn(`WARNING: ALLOW_QA_TEST_ENV_SEED=true for remote DB host: ${host || 'unknown'}`)
    return true
  }
  return isLocal
}

function buildRichProfileData(user: SeedUser) {
  const userCode = user.id.replace('qa_full_user_', '').toUpperCase()
  const firstName = user.name.split(' ')[2] || user.name.split(' ')[1] || user.name
  const lastName = `${userCode}Test`
  const educationEntries = [
    {
      educationLevel: 'bachelors',
      fieldOfStudy: 'engineering',
      university: 'National Institute of Technology Surathkal',
    },
    {
      educationLevel: 'masters',
      fieldOfStudy: 'cs_it',
      university: 'University of Illinois Urbana-Champaign',
    },
    {
      educationLevel: 'doctorate',
      fieldOfStudy: 'business',
      university: 'Stanford University',
    },
  ]

  return {
    odNumber: user.odNumber,
    firstName,
    lastName,
    gender: user.gender,
    dateOfBirth: user.dateOfBirth,
    age: '',
    placeOfBirth: 'Mysore, Karnataka',
    height: user.height,
    weight: '65',
    dietaryPreference: 'vegetarian',
    motherTongue: 'Kannada',
    healthInfo: 'No known conditions',
    anyDisability: 'none',
    disabilityDetails: '',
    bloodGroup: 'O+',
    languagesKnown: 'English, Hindi, Kannada, Telugu',
    maritalStatus: 'never_married',
    hasChildren: 'no',
    linkedinProfile: `https://www.linkedin.com/in/${user.id}`,
    facebookInstagram: `https://instagram.com/${user.id}`,
    facebook: `https://facebook.com/${user.id}`,
    instagram: `@${user.id}`,
    photoUrls: `https://picsum.photos/seed/${user.id}-1/400/500,https://picsum.photos/seed/${user.id}-2/400/500,https://picsum.photos/seed/${user.id}-3/400/500`,
    profileImageUrl: `https://picsum.photos/seed/${user.id}-1/400/500`,
    drivePhotosLink: `https://drive.google.com/drive/folders/${user.id}`,
    photoVisibility: 'verified_only',
    fatherName: `${firstName} Father`,
    motherName: `${firstName} Mother`,
    fatherOccupation: 'Retired Engineer',
    motherOccupation: 'Teacher',
    numberOfBrothers: '1',
    numberOfSisters: '1',
    siblingDetails: 'One brother in Seattle and one sister in Austin',
    familyDetails: 'Close-knit family valuing education and culture',
    familyType: 'nuclear',
    familyValues: 'moderate',
    familyLocation: 'USA',
    qualification: 'masters_cs',
    educationLevel: 'masters',
    fieldOfStudy: 'cs_it',
    university: 'Stanford University',
    educationEntries,
    occupation: 'software_engineer',
    annualIncome: '150k-200k',
    currentLocation: user.currentLocation,
    zipCode: user.zipCode,
    religion: 'Hindu',
    community: 'Iyer',
    subCommunity: 'Smartha',
    caste: 'Iyer',
    gotra: 'Kashyapa',
    employerName: 'VivaahReady QA Systems',
    workingAs: 'Senior Engineer',
    educationCareerDetails: 'Leading reliability automation for matching systems',
    livesWithFamily: 'no',
    createdBy: 'self',
    placeOfBirthCountry: 'India',
    placeOfBirthState: 'Karnataka',
    placeOfBirthCity: 'Mysore',
    timeOfBirth: '10:30 AM',
    manglik: 'no',
    raasi: 'Kanya',
    nakshatra: 'Hasta',
    doshas: 'none',
    maslak: 'hanafi',
    namazPractice: 'sometimes',
    amritdhari: 'no',
    turban: 'no',
    churchAttendance: 'occasionally',
    baptized: 'yes',
    smoking: 'no',
    drinking: 'social',
    hobbies: 'Hiking, Cooking, Reading',
    fitness: 'Yoga, Running',
    interests: 'Travel, Music, Community Service',
    pets: 'no_but_open',
    allergiesOrMedical: 'None',
    openToDate: 'yes',
    openToPrenup: 'no',
    aboutMe: `${firstName} is family-oriented, values growth, and is looking for a long-term partner.`,
    prefHeight: '',
    prefHeightMin: user.prefHeightMin,
    prefHeightMax: `6'6"`,
    prefAgeDiff: '',
    prefAgeMin: '25',
    prefAgeMax: '40',
    prefLocation: 'doesnt_matter',
    prefLocationList: 'California, Texas, Washington',
    prefDiet: 'doesnt_matter',
    prefSmoking: 'doesnt_matter',
    prefDrinking: 'doesnt_matter',
    prefCommunity: 'doesnt_matter',
    prefSubCommunity: 'doesnt_matter',
    prefCaste: 'doesnt_matter',
    prefGotra: 'doesnt_matter',
    prefQualification: 'bachelors',
    prefWorkArea: 'doesnt_matter',
    prefOccupation: 'doesnt_matter',
    prefIncome: 'doesnt_matter',
    prefLanguage: 'doesnt_matter',
    prefCountry: 'doesnt_matter',
    prefCitizenship: 'doesnt_matter',
    prefHobbies: 'doesnt_matter',
    prefSpecificHobbies: '',
    prefFitness: 'doesnt_matter',
    prefSpecificFitness: '',
    prefInterests: 'doesnt_matter',
    prefSpecificInterests: '',
    prefGrewUpIn: 'doesnt_matter',
    prefMaritalStatus: 'never_married',
    prefHasChildren: 'doesnt_matter',
    prefRelocation: 'doesnt_matter',
    prefMotherTongue: 'doesnt_matter',
    prefPets: 'doesnt_matter',
    prefReligion: 'Hindu',
    prefReligions: ['Hindu'],
    prefFamilyValues: 'doesnt_matter',
    prefFamilyLocation: 'doesnt_matter',
    prefFamilyLocationCountry: 'USA',
    idealPartnerDesc: 'Looking for compatibility, shared values, and clear communication.',
    prefAgeIsDealbreaker: true,
    prefHeightIsDealbreaker: true,
    prefMaritalStatusIsDealbreaker: true,
    prefHasChildrenIsDealbreaker: false,
    prefReligionIsDealbreaker: true,
    prefCommunityIsDealbreaker: false,
    prefGotraIsDealbreaker: false,
    prefDietIsDealbreaker: false,
    prefSmokingIsDealbreaker: false,
    prefDrinkingIsDealbreaker: false,
    prefLocationIsDealbreaker: false,
    prefCitizenshipIsDealbreaker: false,
    prefGrewUpInIsDealbreaker: false,
    prefRelocationIsDealbreaker: false,
    prefEducationIsDealbreaker: false,
    prefWorkAreaIsDealbreaker: false,
    prefIncomeIsDealbreaker: false,
    prefOccupationIsDealbreaker: false,
    prefFamilyValuesIsDealbreaker: false,
    prefFamilyLocationIsDealbreaker: false,
    prefMotherTongueIsDealbreaker: false,
    prefSubCommunityIsDealbreaker: false,
    prefPetsIsDealbreaker: false,
    citizenship: 'USA',
    residencyStatus: 'citizen',
    grewUpIn: 'India',
    country: 'USA',
    openToRelocation: 'yes',
    promoCode: 'QA2026',
    referralSource: 'google',
    referralCode: user.referralCode,
    isImported: false,
    signupStep: 10,
    approvalStatus: 'approved',
    approvalDate: new Date(),
    isVerified: true,
    isActive: true,
    isSuspended: false,
    profileScore: 98,
  }
}

async function cleanupQaUsers() {
  const qaIds = QA_USERS.map(u => u.id)

  await prisma.declinedProfile.deleteMany({
    where: {
      OR: [{ userId: { in: qaIds } }, { declinedUserId: { in: qaIds } }],
    },
  })
  await prisma.match.deleteMany({
    where: {
      OR: [{ senderId: { in: qaIds } }, { receiverId: { in: qaIds } }],
    },
  })
  await prisma.message.deleteMany({
    where: {
      OR: [{ senderId: { in: qaIds } }, { receiverId: { in: qaIds } }],
    },
  })
  await prisma.user.deleteMany({
    where: {
      OR: [
        { id: { in: qaIds } },
        { email: { in: QA_USERS.map(u => u.email) } },
      ],
    },
  })
}

async function seedQaUsers() {
  for (const user of QA_USERS) {
    await prisma.user.upsert({
      where: { id: user.id },
      update: {
        email: user.email,
        name: user.name,
        phone: user.phone,
        emailVerified: new Date(),
        phoneVerified: new Date(),
        lastLogin: new Date(),
      },
      create: {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        emailVerified: new Date(),
        phoneVerified: new Date(),
        lastLogin: new Date(),
      },
    })

    const profileData = buildRichProfileData(user)
    const profile = await prisma.profile.upsert({
      where: { userId: user.id },
      update: profileData,
      create: {
        userId: user.id,
        ...profileData,
      },
    })

    PROFILE_BY_USER_ID.set(user.id, profile.id)

    await prisma.subscription.upsert({
      where: { userId: user.id },
      update: { plan: 'premium', status: 'active', profilePaid: true },
      create: { userId: user.id, plan: 'premium', status: 'active', profilePaid: true },
    })
  }
}

describe.skipIf(!isLocalDb())('QA: 5 full profiles + edit modal prefill + matching/interest behavior', () => {
  let matchesAutoGET: (request: Request) => Promise<Response>
  let profileGET: (request: Request) => Promise<Response>
  let profilePUT: (request: Request) => Promise<Response>
  let interestGET: (request: Request) => Promise<Response>
  let interestPOST: (request: Request) => Promise<Response>

  beforeAll(async () => {

    getServerSessionMock.mockResolvedValue({ user: { id: 'qa-admin-session' } })
    getTargetUserIdMock.mockImplementation(async () => {
      if (!activeUser.userId) return null
      return { userId: activeUser.userId, isAdminView: true }
    })

    sendNewInterestEmailMock.mockResolvedValue({ success: true })
    sendInterestAcceptedEmailMock.mockResolvedValue({ success: true })
    awardInterestPointsMock.mockResolvedValue({ awarded: true })
    awardResponsePointsMock.mockResolvedValue({ awarded: true })

    const matchesModule = await import('@/app/api/matches/auto/route')
    const profileModule = await import('@/app/api/profile/route')
    const interestModule = await import('@/app/api/interest/route')
    matchesAutoGET = matchesModule.GET
    profileGET = profileModule.GET
    profilePUT = profileModule.PUT
    interestGET = interestModule.GET
    interestPOST = interestModule.POST

    await cleanupQaUsers()
    await seedQaUsers()
  }, 120_000)

  it('creates 5 rich profiles with 3 education entries and full optional data', async () => {
    expect(PROFILE_BY_USER_ID.size).toBe(5)

    for (const qaUser of QA_USERS) {
      const profile = await prisma.profile.findUnique({
        where: { userId: qaUser.id },
      })
      expect(profile).not.toBeNull()
      if (!profile) continue

      expect(profile.odNumber).toBe(qaUser.odNumber)
      expect(profile.profileImageUrl).toContain(`seed/${qaUser.id}-1`)
      expect(profile.photoUrls).toContain(`seed/${qaUser.id}-2`)
      expect(profile.approvalStatus).toBe('approved')
      expect(profile.signupStep).toBe(10)
      expect(profile.isVerified).toBe(true)
      expect(profile.isActive).toBe(true)

      const educationEntries = profile.educationEntries as Array<Record<string, string>>
      expect(Array.isArray(educationEntries)).toBe(true)
      expect(educationEntries).toHaveLength(3)
      for (const entry of educationEntries) {
        expect(entry.educationLevel).toBeTruthy()
        expect(entry.fieldOfStudy).toBeTruthy()
        expect(entry.university).toBeTruthy()
      }

      const requiredOptionalFields: (keyof typeof profile)[] = [
        'weight',
        'healthInfo',
        'bloodGroup',
        'fatherName',
        'motherName',
        'fatherOccupation',
        'motherOccupation',
        'siblingDetails',
        'familyType',
        'familyValues',
        'familyLocation',
        'hobbies',
        'fitness',
        'interests',
        'pets',
        'allergiesOrMedical',
        'linkedinProfile',
        'facebook',
        'instagram',
        'educationCareerDetails',
        'citizenship',
        'grewUpIn',
        'country',
        'openToRelocation',
        'residencyStatus',
      ]

      for (const field of requiredOptionalFields) {
        const value = profile[field]
        expect(value, `${qaUser.id}.${String(field)} should be populated`).toBeTruthy()
      }
    }
  })

  it('ensures edit-profile payload (modal source) is populated and contains 3 education records', async () => {
    const target = QA_USERS[0]
    activeUser.userId = target.id

    const response = await profileGET(buildRequest('GET', 'http://localhost/api/profile'))
    expect(response.status).toBe(200)
    const payload = await response.json()

    expect(payload.firstName).toBeTruthy()
    expect(payload.lastName).toBeTruthy()
    expect(payload.country).toBe('USA')
    expect(payload.grewUpIn).toBe('India')
    expect(payload.citizenship).toBe('USA')
    expect(payload.occupation).toBe('software_engineer')
    expect(payload.employerName).toBe('VivaahReady QA Systems')
    expect(payload.annualIncome).toBe('150k-200k')
    expect(payload.openToRelocation).toBe('yes')
    expect(payload.profileImageUrl).toContain(`seed/${target.id}-1`)
    expect(payload.photoUrls).toContain(`seed/${target.id}-2`)

    expect(Array.isArray(payload.educationEntries)).toBe(true)
    expect(payload.educationEntries).toHaveLength(3)
    expect(payload.educationEntries[0].educationLevel).toBeTruthy()
    expect(payload.educationEntries[0].fieldOfStudy).toBeTruthy()
    expect(payload.educationEntries[0].university).toBeTruthy()
  })

  it('gives every seeded user at least 2 matches with the live matching route', async () => {
    for (const qaUser of QA_USERS) {
      activeUser.userId = qaUser.id
      const response = await matchesAutoGET(buildRequest('GET', 'http://localhost/api/matches/auto'))
      expect(response.status).toBe(200)
      const payload = await response.json()

      const matchedUserIds = new Set<string>([
        ...((payload.freshMatches || []) as Array<{ userId: string }>).map(m => m.userId),
        ...((payload.mutualMatches || []) as Array<{ userId: string }>).map(m => m.userId),
      ])

      expect(
        matchedUserIds.size,
        `${qaUser.id} expected >=2 matches but got ${matchedUserIds.size}`
      ).toBeGreaterThanOrEqual(2)
    }
  }, 120_000)

  it("reflects edit changes immediately: 5'6\" -> 5'4\" breaks A's height preference but pending interest remains", async () => {
    const userA = QA_USERS.find(u => u.id === 'qa_full_user_a')
    const userB = QA_USERS.find(u => u.id === 'qa_full_user_b')
    expect(userA).toBeTruthy()
    expect(userB).toBeTruthy()
    if (!userA || !userB) return

    const userAProfileId = PROFILE_BY_USER_ID.get(userA.id)
    const userBProfileId = PROFILE_BY_USER_ID.get(userB.id)
    expect(userAProfileId).toBeTruthy()
    expect(userBProfileId).toBeTruthy()
    if (!userAProfileId || !userBProfileId) return

    await prisma.match.deleteMany({
      where: {
        OR: [
          { senderId: userA.id, receiverId: userB.id },
          { senderId: userB.id, receiverId: userA.id },
        ],
      },
    })

    activeUser.userId = userA.id
    const beforeMatchResponse = await matchesAutoGET(buildRequest('GET', 'http://localhost/api/matches/auto'))
    expect(beforeMatchResponse.status).toBe(200)
    const beforeMatchPayload = await beforeMatchResponse.json()
    const userAVisibleBefore = new Set<string>([
      ...((beforeMatchPayload.freshMatches || []) as Array<{ userId: string }>).map(m => m.userId),
      ...((beforeMatchPayload.mutualMatches || []) as Array<{ userId: string }>).map(m => m.userId),
    ])
    expect(userAVisibleBefore.has(userB.id)).toBe(true)

    const sendInterestResponse = await interestPOST(
      buildRequest('POST', 'http://localhost/api/interest', { profileId: userBProfileId })
    )
    expect(sendInterestResponse.status).toBe(200)
    const sendInterestPayload = await sendInterestResponse.json()
    expect(sendInterestPayload.mutual).toBe(false)

    const sentBeforeChangeRes = await interestGET(
      buildRequest('GET', 'http://localhost/api/interest?type=sent')
    )
    expect(sentBeforeChangeRes.status).toBe(200)
    const sentBeforeChangePayload = await sentBeforeChangeRes.json()
    expect(
      (sentBeforeChangePayload.interests as Array<{ receiverId: string; status: string }>)
        .some(i => i.receiverId === userB.id && i.status === 'pending')
    ).toBe(true)

    activeUser.userId = userB.id
    const receivedBeforeChangeRes = await interestGET(
      buildRequest('GET', 'http://localhost/api/interest?type=received&status=pending')
    )
    expect(receivedBeforeChangeRes.status).toBe(200)
    const receivedBeforeChangePayload = await receivedBeforeChangeRes.json()
    expect(
      (receivedBeforeChangePayload.interests as Array<{ senderId: string; status: string }>)
        .some(i => i.senderId === userA.id && i.status === 'pending')
    ).toBe(true)

    const updateHeightResponse = await profilePUT(
      buildRequest('PUT', 'http://localhost/api/profile', {
        _editSection: 'basics',
        height: `5'4"`,
      })
    )
    expect(updateHeightResponse.status).toBe(200)

    const userBProfileAfterEdit = await profileGET(buildRequest('GET', 'http://localhost/api/profile'))
    expect(userBProfileAfterEdit.status).toBe(200)
    const userBProfileAfterEditPayload = await userBProfileAfterEdit.json()
    expect(userBProfileAfterEditPayload.height).toBe(`5'4"`)

    const userBMatchesAfterEdit = await matchesAutoGET(buildRequest('GET', 'http://localhost/api/matches/auto'))
    expect(userBMatchesAfterEdit.status).toBe(200)
    const userBMatchesAfterEditPayload = await userBMatchesAfterEdit.json()
    const userBVisibleAfter = new Set<string>([
      ...((userBMatchesAfterEditPayload.freshMatches || []) as Array<{ userId: string }>).map(m => m.userId),
      ...((userBMatchesAfterEditPayload.mutualMatches || []) as Array<{ userId: string }>).map(m => m.userId),
    ])
    expect(userBVisibleAfter.has(userA.id)).toBe(false)

    const receivedAfterChangeRes = await interestGET(
      buildRequest('GET', 'http://localhost/api/interest?type=received&status=pending')
    )
    expect(receivedAfterChangeRes.status).toBe(200)
    const receivedAfterChangePayload = await receivedAfterChangeRes.json()
    expect(
      (receivedAfterChangePayload.interests as Array<{ senderId: string; status: string }>)
        .some(i => i.senderId === userA.id && i.status === 'pending')
    ).toBe(true)

    activeUser.userId = userA.id
    const sentAfterChangeRes = await interestGET(
      buildRequest('GET', 'http://localhost/api/interest?type=sent')
    )
    expect(sentAfterChangeRes.status).toBe(200)
    const sentAfterChangePayload = await sentAfterChangeRes.json()
    expect(
      (sentAfterChangePayload.interests as Array<{ receiverId: string; status: string }>)
        .some(i => i.receiverId === userB.id && i.status === 'pending')
    ).toBe(true)

    activeUser.userId = userB.id
    const acceptAfterMismatchRes = await interestPOST(
      buildRequest('POST', 'http://localhost/api/interest', { profileId: userAProfileId })
    )
    expect(acceptAfterMismatchRes.status).toBe(200)
    const acceptAfterMismatchPayload = await acceptAfterMismatchRes.json()
    expect(acceptAfterMismatchPayload.mutual).toBe(true)

    activeUser.userId = userA.id
    const sentAfterAcceptRes = await interestGET(
      buildRequest('GET', 'http://localhost/api/interest?type=sent')
    )
    expect(sentAfterAcceptRes.status).toBe(200)
    const sentAfterAcceptPayload = await sentAfterAcceptRes.json()
    expect(
      (sentAfterAcceptPayload.interests as Array<{ receiverId: string }>)
        .some(i => i.receiverId === userB.id)
    ).toBe(false)

    const userAMatchesAfterAccept = await matchesAutoGET(buildRequest('GET', 'http://localhost/api/matches/auto'))
    expect(userAMatchesAfterAccept.status).toBe(200)
    const userAMatchesAfterAcceptPayload = await userAMatchesAfterAccept.json()
    const userAVisibleAfterAccept = new Set<string>([
      ...((userAMatchesAfterAcceptPayload.freshMatches || []) as Array<{ userId: string }>).map(m => m.userId),
      ...((userAMatchesAfterAcceptPayload.mutualMatches || []) as Array<{ userId: string }>).map(m => m.userId),
    ])
    expect(userAVisibleAfterAccept.has(userB.id)).toBe(false)

    // Restore B height so seeded QA data remains in baseline state.
    activeUser.userId = userB.id
    const restoreHeightResponse = await profilePUT(
      buildRequest('PUT', 'http://localhost/api/profile', {
        _editSection: 'basics',
        height: `5'6"`,
      })
    )
    expect(restoreHeightResponse.status).toBe(200)
  }, 120_000)
})
