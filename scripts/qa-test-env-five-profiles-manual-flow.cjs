const { chromium, request } = require('playwright')

const BASE_URL = String(process.env.QA_BASE_URL || 'http://127.0.0.1:3007').replace(/\/+$/, '')
const ADMIN_SESSION_COOKIE = 'admin_session=vivaah_admin_session_token_2024'
const PROD_URL_PATTERN = /^https:\/\/(www\.)?vivaahready\.com$/i

const USER_BLUEPRINTS = [
  {
    key: 'A',
    gender: 'female',
    height: `5'5"`,
    dateOfBirth: '03/15/1995',
    currentLocation: 'San Jose, California',
    zipCode: '95112',
    prefHeightMin: `5'6"`,
  },
  {
    key: 'B',
    gender: 'male',
    height: `5'6"`,
    dateOfBirth: '05/10/1993',
    currentLocation: 'Sunnyvale, California',
    zipCode: '94086',
    prefHeightMin: `5'0"`,
  },
  {
    key: 'C',
    gender: 'male',
    height: `5'8"`,
    dateOfBirth: '08/22/1992',
    currentLocation: 'Santa Clara, California',
    zipCode: '95050',
    prefHeightMin: `5'0"`,
  },
  {
    key: 'D',
    gender: 'female',
    height: `5'4"`,
    dateOfBirth: '11/07/1994',
    currentLocation: 'Mountain View, California',
    zipCode: '94043',
    prefHeightMin: `5'0"`,
  },
  {
    key: 'E',
    gender: 'female',
    height: `5'7"`,
    dateOfBirth: '01/30/1991',
    currentLocation: 'Palo Alto, California',
    zipCode: '94301',
    prefHeightMin: `5'0"`,
  },
]

function assertSafeTarget() {
  if (PROD_URL_PATTERN.test(BASE_URL)) {
    throw new Error(
      `Refusing to run on production target (${BASE_URL}). ` +
      'Set QA_BASE_URL to a test/dev URL.'
    )
  }
}

function ensure(condition, message) {
  if (!condition) throw new Error(message)
}

async function parseJson(response) {
  const text = await response.text()
  try {
    return JSON.parse(text)
  } catch {
    return { raw: text }
  }
}

async function expectOk(response, label) {
  if (response.ok()) return parseJson(response)
  const body = await parseJson(response)
  throw new Error(`${label} failed (${response.status()}): ${JSON.stringify(body)}`)
}

function buildUsers(seed) {
  return USER_BLUEPRINTS.map((bp, idx) => {
    const suffix = `${seed}${bp.key.toLowerCase()}`
    return {
      ...bp,
      firstName: `QAManual${bp.key}`,
      lastName: `Flow${seed.slice(-4)}`,
      email: `qa.manual.${suffix}@example.com`,
      phone: `9255${String(100000 + idx).slice(-6)}`,
      password: `QaManual!${seed}${bp.key}`,
      odNumber: `VRQAMAN${seed}${bp.key}`,
      referralCode: `QAMAN${seed}${bp.key}`,
      educationEntries: [
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
      ],
    }
  })
}

function buildCreatePayload(user) {
  return {
    email: user.email,
    phone: user.phone,
    createdBy: 'self',
    firstName: user.firstName,
    lastName: user.lastName,
    gender: user.gender,
    dateOfBirth: user.dateOfBirth,
    height: user.height,
    maritalStatus: 'never_married',
    motherTongue: 'Kannada',
    country: 'USA',
    currentLocation: user.currentLocation,
    zipCode: user.zipCode,
    citizenship: 'USA',
    grewUpIn: 'India',
    openToRelocation: 'yes',
    familyLocationCountry: 'USA',
    familyValues: 'moderate',
    qualification: 'masters_cs',
    educationLevel: 'masters',
    fieldOfStudy: 'cs_it',
    university: 'Stanford University',
    educationEntries: user.educationEntries,
    occupation: 'software_engineer',
    employerName: `QAManual ${user.key} Systems`,
    annualIncome: '150k-200k',
    religion: 'Hindu',
    community: 'Iyer',
    dietaryPreference: 'vegetarian',
    smoking: 'no',
    drinking: 'social',
    pets: 'no_but_open',
    aboutMe: `${user.firstName} values family, growth, and long-term commitment.`,
    linkedinProfile: 'no_linkedin',
    referralSource: 'google',
    prefAgeMin: '25',
    prefAgeMax: '40',
    prefHeightMin: user.prefHeightMin,
    prefHeightMax: `6'6"`,
    prefMaritalStatus: 'never_married',
    prefReligion: 'Hindu',
    prefQualification: 'bachelors',
    prefAgeIsDealbreaker: true,
    prefHeightIsDealbreaker: true,
    prefMaritalStatusIsDealbreaker: true,
    prefReligionIsDealbreaker: true,
  }
}

function buildFullUpdatePayload(user) {
  return {
    firstName: user.firstName,
    lastName: user.lastName,
    createdBy: 'self',
    gender: user.gender,
    dateOfBirth: user.dateOfBirth,
    height: user.height,
    weight: '65',
    motherTongue: 'Kannada',
    languagesKnown: 'English, Hindi, Kannada, Telugu',
    maritalStatus: 'never_married',
    hasChildren: 'no',
    bloodGroup: 'O+',
    healthInfo: 'No known conditions',
    anyDisability: 'none',
    disabilityDetails: '',
    dietaryPreference: 'vegetarian',
    smoking: 'no',
    drinking: 'social',
    pets: 'no_but_open',
    hobbies: 'Hiking, Cooking, Reading',
    fitness: 'Yoga, Running',
    interests: 'Travel, Music, Community Service',
    allergiesOrMedical: 'None',
    openToDate: 'yes',
    openToPrenup: 'no',
    aboutMe: `${user.firstName} is family-oriented, values growth, and is looking for a long-term partner.`,
    linkedinProfile: `https://www.linkedin.com/in/${user.key.toLowerCase()}-${user.odNumber.toLowerCase()}`,
    facebookInstagram: `https://instagram.com/${user.key.toLowerCase()}_${user.odNumber.toLowerCase()}`,
    facebook: `https://facebook.com/${user.key.toLowerCase()}-${user.odNumber.toLowerCase()}`,
    instagram: `@${user.key.toLowerCase()}_${user.odNumber.toLowerCase()}`,
    profileImageUrl: `https://picsum.photos/seed/${user.odNumber}-1/400/500`,
    photoUrls: `https://picsum.photos/seed/${user.odNumber}-1/400/500,https://picsum.photos/seed/${user.odNumber}-2/400/500,https://picsum.photos/seed/${user.odNumber}-3/400/500`,
    drivePhotosLink: `https://drive.google.com/drive/folders/${user.odNumber}`,
    photoVisibility: 'verified_only',
    currentLocation: user.currentLocation,
    zipCode: user.zipCode,
    country: 'USA',
    citizenship: 'USA',
    residencyStatus: 'citizen',
    grewUpIn: 'India',
    openToRelocation: 'yes',
    familyLocation: 'USA',
    familyType: 'nuclear',
    familyValues: 'moderate',
    familyDetails: 'Close-knit family valuing education and culture',
    livesWithFamily: 'no',
    fatherName: `${user.firstName} Father`,
    motherName: `${user.firstName} Mother`,
    fatherOccupation: 'Retired Engineer',
    motherOccupation: 'Teacher',
    numberOfBrothers: '1',
    numberOfSisters: '1',
    siblingDetails: 'One brother in Seattle and one sister in Austin',
    religion: 'Hindu',
    community: 'Iyer',
    subCommunity: 'Smartha',
    caste: 'Iyer',
    gotra: 'Kashyapa',
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
    qualification: 'masters_cs',
    educationLevel: 'masters',
    fieldOfStudy: 'cs_it',
    university: user.educationEntries[0].university,
    educationEntries: user.educationEntries,
    occupation: 'software_engineer',
    employerName: `QAManual ${user.key} Systems`,
    workingAs: 'Senior Engineer',
    annualIncome: '150k-200k',
    educationCareerDetails: 'Leading reliability automation for matching systems',
    odNumber: user.odNumber,
    referralCode: user.referralCode,
    referralSource: 'google',
    prefAgeMin: '25',
    prefAgeMax: '40',
    prefHeightMin: user.prefHeightMin,
    prefHeightMax: `6'6"`,
    prefLocation: 'doesnt_matter',
    prefLocationList: 'California, Texas, Washington',
    prefCountry: 'doesnt_matter',
    prefCitizenship: 'doesnt_matter',
    prefGrewUpIn: 'doesnt_matter',
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
    prefHobbies: 'doesnt_matter',
    prefSpecificHobbies: '',
    prefFitness: 'doesnt_matter',
    prefSpecificFitness: '',
    prefInterests: 'doesnt_matter',
    prefSpecificInterests: '',
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
  }
}

async function registerUser(appRequest, user) {
  const response = await appRequest.post('/api/register', {
    data: {
      name: `${user.firstName} ${user.lastName}`,
      email: user.email,
      password: user.password,
      phone: user.phone,
    },
  })
  const payload = await expectOk(response, `Register ${user.email}`)
  ensure(payload.userId, `Register ${user.email} returned no userId`)
  return payload.userId
}

async function createProfileFromModal(appRequest, user) {
  const response = await appRequest.post('/api/profile/create-from-modal', {
    data: buildCreatePayload(user),
  })
  const payload = await expectOk(response, `Create profile from modal ${user.email}`)
  ensure(payload.profileId, `Create profile ${user.email} returned no profileId`)
  return payload.profileId
}

async function approveProfile(adminRequest, profileId) {
  const response = await adminRequest.post('/api/admin/approve', {
    data: {
      profileId,
      action: 'approve',
    },
  })
  await expectOk(response, `Approve profile ${profileId}`)
}

async function updateFullProfile(adminRequest, user, userId) {
  const response = await adminRequest.put(`/api/profile?viewAsUser=${encodeURIComponent(userId)}`, {
    data: buildFullUpdatePayload(user),
  })
  await expectOk(response, `Full profile update ${user.email}`)
}

async function getProfile(adminRequest, userId) {
  const response = await adminRequest.get(`/api/profile?viewAsUser=${encodeURIComponent(userId)}`)
  return expectOk(response, `Get profile ${userId}`)
}

async function getMatches(adminRequest, userId) {
  const response = await adminRequest.get(`/api/matches/auto?viewAsUser=${encodeURIComponent(userId)}`)
  const payload = await expectOk(response, `Get matches ${userId}`)
  const ids = new Set()
  const all = [
    ...(Array.isArray(payload.freshMatches) ? payload.freshMatches : []),
    ...(Array.isArray(payload.mutualMatches) ? payload.mutualMatches : []),
    ...(Array.isArray(payload.matches) ? payload.matches : []),
  ]
  for (const m of all) {
    if (m && typeof m.userId === 'string') ids.add(m.userId)
  }
  return { payload, ids }
}

async function sendInterest(adminRequest, senderUserId, receiverProfileId) {
  const response = await adminRequest.post(`/api/interest?viewAsUser=${encodeURIComponent(senderUserId)}`, {
    data: { profileId: receiverProfileId },
  })
  return expectOk(response, `Send interest ${senderUserId} -> ${receiverProfileId}`)
}

async function getSentInterests(adminRequest, userId) {
  const response = await adminRequest.get(`/api/interest?viewAsUser=${encodeURIComponent(userId)}&type=sent`)
  return expectOk(response, `Get sent interests ${userId}`)
}

async function getReceivedPending(adminRequest, userId) {
  const response = await adminRequest.get(`/api/interest?viewAsUser=${encodeURIComponent(userId)}&type=received&status=pending`)
  return expectOk(response, `Get received pending ${userId}`)
}

async function loginAndVerifyEducationModal(browser, user) {
  const context = await browser.newContext({ baseURL: BASE_URL, viewport: { width: 1440, height: 900 } })
  const page = await context.newPage()

  try {
    await page.goto('/login', { waitUntil: 'networkidle', timeout: 60000 })

    const emailToggle = page.getByRole('button', { name: /Don\'t have Gmail|Use another email|Sign in with email/i }).first()
    if (await emailToggle.isVisible().catch(() => false)) {
      await emailToggle.click()
    }

    await page.fill('#email', user.email)
    await page.fill('#password', user.password)
    const emailSubmit = page.getByRole('button', { name: /^Sign In with Email$/i }).first()
    if (await emailSubmit.count()) {
      await emailSubmit.click()
    } else {
      await page.locator('form:has(#email) button[type="submit"]').first().click()
    }

    await page.waitForURL(url => !url.pathname.startsWith('/login'), { timeout: 60000 })
    await page.goto('/profile', { waitUntil: 'networkidle', timeout: 60000 })
    await page.waitForResponse(
      (resp) =>
        resp.url().includes('/api/profile') &&
        resp.request().method() === 'GET' &&
        resp.status() === 200,
      { timeout: 60000 }
    ).catch(() => null)
    await page.waitForTimeout(500)

    const ownerProfileResponse = await context.request.get('/api/profile')
    const ownerProfile = await expectOk(ownerProfileResponse, `Owner profile fetch ${user.email}`)
    ensure(
      Array.isArray(ownerProfile.educationEntries) && ownerProfile.educationEntries.length === 3,
      `Owner profile did not return 3 education entries for ${user.email}`
    )

    const heading = page.getByRole('heading', { name: /^Education & Career$/i }).first()
    ensure(await heading.isVisible().catch(() => false), `Education heading not visible for ${user.email}`)
    await heading.locator('xpath=../button[contains(., "Edit")]').click()

    const modalHeading = page.getByRole('heading', { name: /Edit Education & Career/i }).first()
    ensure(await modalHeading.isVisible().catch(() => false), `Education modal did not open for ${user.email}`)

    const zipValue = (await page.locator('input[name="zipCode"]').first().inputValue()).trim()
    ensure(zipValue === user.zipCode, `zipCode mismatch for ${user.email}: expected ${user.zipCode}, got ${zipValue}`)

    const occValue = await page.locator('select[name="occupation"]').first().inputValue()
    ensure(occValue === 'software_engineer', `occupation mismatch for ${user.email}: ${occValue}`)

    const incomeValue = await page.locator('select[name="annualIncome"]').first().inputValue()
    ensure(incomeValue === '150k-200k', `annualIncome mismatch for ${user.email}: ${incomeValue}`)

    const employerValue = (await page.locator('input[name="employerName"]').first().inputValue()).trim()
    ensure(
      employerValue === `QAManual ${user.key} Systems`,
      `employer mismatch for ${user.email}: ${employerValue}`
    )

    const universityInputs = page.locator('input[placeholder="Type to search universities..."]')
    const universityCount = await universityInputs.count()
    ensure(universityCount >= 3, `Expected 3 university fields for ${user.email}, found ${universityCount}`)

    for (let i = 0; i < 3; i += 1) {
      const actualUniversity = (await universityInputs.nth(i).inputValue()).trim()
      const expectedUniversity = user.educationEntries[i].university
      ensure(
        actualUniversity === expectedUniversity,
        `University ${i + 1} mismatch for ${user.email}: expected "${expectedUniversity}", got "${actualUniversity}"`
      )
    }
    return { ok: true }
  } finally {
    await context.close()
  }
}

function assertHasThreeEducationEntries(profile, user) {
  ensure(Array.isArray(profile.educationEntries), `${user.email}: educationEntries is not an array`)
  ensure(profile.educationEntries.length === 3, `${user.email}: expected 3 education entries`)
  for (let i = 0; i < 3; i += 1) {
    const entry = profile.educationEntries[i]
    ensure(entry.educationLevel, `${user.email}: educationLevel missing at index ${i}`)
    ensure(entry.fieldOfStudy, `${user.email}: fieldOfStudy missing at index ${i}`)
    ensure(entry.university, `${user.email}: university missing at index ${i}`)
  }
}

function hasPendingSentTo(interestsPayload, receiverId) {
  return (interestsPayload.interests || []).some((interest) => interest.receiverId === receiverId && interest.status === 'pending')
}

function hasPendingReceivedFrom(interestsPayload, senderId) {
  return (interestsPayload.interests || []).some((interest) => interest.senderId === senderId && interest.status === 'pending')
}

async function run() {
  assertSafeTarget()

  const seed = Date.now().toString()
  const users = buildUsers(seed)
  const report = {
    testedAt: new Date().toISOString(),
    baseUrl: BASE_URL,
    seed,
    profiles: [],
    checks: {
      profilePrefill: [],
      matchesPerUser: [],
      interestScenario: {},
    },
  }

  const appRequest = await request.newContext({ baseURL: BASE_URL })
  const adminRequest = await request.newContext({
    baseURL: BASE_URL,
    extraHTTPHeaders: {
      cookie: ADMIN_SESSION_COOKIE,
    },
  })
  const browser = await chromium.launch({ headless: true })

  try {
    for (const user of users) {
      const userId = await registerUser(appRequest, user)
      const profileId = await createProfileFromModal(appRequest, user)
      await approveProfile(adminRequest, profileId)
      await updateFullProfile(adminRequest, user, userId)

      const profile = await getProfile(adminRequest, userId)
      assertHasThreeEducationEntries(profile, user)

      const requiredFields = [
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

      for (const field of requiredFields) {
        ensure(profile[field], `${user.email}: expected "${field}" to be populated`)
      }

      let modalResult = { ok: true, error: '' }
      try {
        await loginAndVerifyEducationModal(browser, user)
      } catch (error) {
        modalResult = {
          ok: false,
          error: error instanceof Error ? error.message : String(error),
        }
      }

      report.profiles.push({
        key: user.key,
        email: user.email,
        password: user.password,
        userId,
        profileId,
        odNumber: profile.odNumber,
      })
      report.checks.profilePrefill.push({
        key: user.key,
        email: user.email,
        profileApiPopulated: true,
        editModalPopulated: modalResult.ok,
        editModalError: modalResult.error || undefined,
      })
    }

    for (const created of report.profiles) {
      const { ids } = await getMatches(adminRequest, created.userId)
      ensure(ids.size >= 2, `${created.email}: expected at least 2 matches, got ${ids.size}`)
      report.checks.matchesPerUser.push({
        key: created.key,
        email: created.email,
        matchCount: ids.size,
      })
    }

    const userA = report.profiles.find((p) => p.key === 'A')
    const userB = report.profiles.find((p) => p.key === 'B')
    ensure(userA && userB, 'Could not locate scenario users A and B')

    const matchesBefore = await getMatches(adminRequest, userA.userId)
    ensure(matchesBefore.ids.has(userB.userId), 'User B must be in User A matches before height edit')

    const sendPayload = await sendInterest(adminRequest, userA.userId, userB.profileId)
    ensure(sendPayload.mutual === false, 'A->B initial interest should be pending, not mutual')

    const sentBefore = await getSentInterests(adminRequest, userA.userId)
    ensure(hasPendingSentTo(sentBefore, userB.userId), 'Pending sent interest A->B should exist before height edit')

    const receivedBefore = await getReceivedPending(adminRequest, userB.userId)
    ensure(hasPendingReceivedFrom(receivedBefore, userA.userId), 'Pending received interest at B should exist before height edit')

    const heightUpdateResponse = await adminRequest.put(`/api/profile?viewAsUser=${encodeURIComponent(userB.userId)}`, {
      data: {
        _editSection: 'basics',
        height: `5'4"`,
      },
    })
    await expectOk(heightUpdateResponse, 'Update user B height to 5\'4"')

    const matchesAfter = await getMatches(adminRequest, userA.userId)
    ensure(!matchesAfter.ids.has(userB.userId), 'User B should no longer be in User A matches after height edit')

    const sentAfter = await getSentInterests(adminRequest, userA.userId)
    ensure(hasPendingSentTo(sentAfter, userB.userId), 'Pending sent interest A->B should remain after mismatch')

    const receivedAfter = await getReceivedPending(adminRequest, userB.userId)
    ensure(hasPendingReceivedFrom(receivedAfter, userA.userId), 'Pending received interest at B should remain after mismatch')

    const mutualPayload = await sendInterest(adminRequest, userB.userId, userA.profileId)
    ensure(mutualPayload.mutual === true, 'B->A should become a mutual match even after mismatch')

    const sentAfterMutual = await getSentInterests(adminRequest, userA.userId)
    ensure(
      !hasPendingSentTo(sentAfterMutual, userB.userId),
      'Accepted mutual interest should not remain in sent-pending list'
    )

    report.checks.interestScenario = {
      userA: userA.email,
      userB: userB.email,
      beforeEditMatched: true,
      afterEditMatched: false,
      pendingInterestRetainedAfterMismatch: true,
      mutualCreatedAfterBResponded: true,
      pendingRemovedFromSentAfterMutual: true,
    }
  } finally {
    await appRequest.dispose()
    await adminRequest.dispose()
    await browser.close()
  }

  console.log(JSON.stringify(report, null, 2))
}

run().catch((error) => {
  console.error('QA manual five-profile flow failed:')
  console.error(error)
  process.exit(1)
})
