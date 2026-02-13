import { test, expect, type Page } from '@playwright/test'
import path from 'path'

const uniqueId = Date.now().toString(36)
const password = 'E2EPass123!'

const userA = {
  firstName: `E2E${uniqueId}A`,
  lastName: 'Alpha',
  email: `e2e-alpha-${uniqueId}@example.com`,
  phone: '5551234567',
  gender: 'male',
}

const userB = {
  firstName: `E2E${uniqueId}B`,
  lastName: 'Beta',
  email: `e2e-beta-${uniqueId}@example.com`,
  phone: '5559876543',
  gender: 'female',
}

const userC = {
  firstName: `E2E${uniqueId}C`,
  lastName: 'Gamma',
  email: `e2e-gamma-${uniqueId}@example.com`,
  phone: '5550001122',
  gender: 'female',
}

const photoPath = path.join(process.cwd(), 'public', 'logo-couple.png')

async function mockZipLookup(page: Page) {
  await page.route('https://api.zippopotam.us/us/**', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        'post code': '10001',
        country: 'United States',
        places: [{ 'place name': 'New York', state: 'NY' }],
      }),
    })
  })
}

async function openSignupModal(page: Page) {
  await page.goto('/?e2eOpenModal=1', { waitUntil: 'domcontentloaded' })
  // First step is now "Get Started" (account step with email + phone)
  const getStartedHeading = page.getByRole('heading', { name: /Get Started/i })
  try {
    await getStartedHeading.waitFor({ state: 'visible', timeout: 30000 })
    return
  } catch {
    // Fall back to clicking the CTA if the auto-open hook didn't fire yet.
  }
  const ctaButton = page.getByRole('button', { name: /Find My Match|Get Started|Register/i }).first()
  await expect(ctaButton).toBeVisible({ timeout: 15000 })
  await page.waitForTimeout(300)
  for (let attempt = 0; attempt < 3; attempt += 1) {
    await ctaButton.click({ force: true, timeout: 5000 })
    try {
      await getStartedHeading.waitFor({ state: 'visible', timeout: 8000 })
      return
    } catch {
      await page.waitForTimeout(500)
    }
  }
  await expect(getStartedHeading).toBeVisible({ timeout: 10000 })
}

// Step 1: Account - name first, then phone, then email/password to create USER only
async function completeAccountStep(page: Page, user: typeof userA) {
  // Fill name first (mandatory before phone appears)
  await page.fill('input[name="firstName"]', user.firstName)
  await page.fill('input[name="lastName"]', user.lastName)
  await page.waitForTimeout(300)

  // Fill phone (mandatory before auth options appear)
  await page.locator('input[type="tel"]').fill(user.phone)
  await page.waitForTimeout(500) // Wait for auth options to appear

  // Expand email form (click "Don't have Gmail?" toggle)
  await page.click('text=Don\'t have Gmail')
  await page.waitForTimeout(300)

  // Fill email and password fields
  await page.fill('input[type="email"]', user.email)
  await page.fill('input[placeholder="Enter password"]', password)
  await page.fill('input[placeholder="Re-enter password"]', password)

  // Wait for register API response only (profile is created in basics step)
  const registerResponse = page.waitForResponse(
    (response) => response.url().includes('/api/register') && response.request().method() === 'POST'
  )

  await page.getByRole('button', { name: /Create Account & Continue/i }).click()
  await registerResponse
  await expect(page.getByRole('heading', { name: /Basic Info/i })).toBeVisible({ timeout: 30000 })
}

// Step 2: Basic Info - Creates PROFILE after basics are filled
async function completeBasics(page: Page, user: typeof userA) {
  await page.selectOption('select[name="createdBy"]', 'self')
  await page.selectOption('select[name="gender"]', user.gender)
  // firstName and lastName already filled in account step
  await page.fill('input[name="dateOfBirth"]', '01/01/1992')
  await page.selectOption('select[name="height"]', "5'8\"")
  await page.selectOption('select[name="maritalStatus"]', 'never_married')
  await page.selectOption('select[name="motherTongue"]', 'English')

  // Wait for profile creation response
  const profileResponse = page.waitForResponse(
    (response) => response.url().includes('/api/profile/create-from-modal') && response.request().method() === 'POST'
  )

  await page.getByRole('button', { name: /Continue/i }).click()
  await profileResponse
  await expect(page.getByRole('heading', { name: /Education & Career/i })).toBeVisible()
}

// Step 3: Education & Career
async function completeLocationEducation(page: Page) {
  await mockZipLookup(page)
  await page.fill('input[name="zipCode"]', '10001')
  await page.selectOption('select[name="qualification"]', 'bachelors_cs')
  const universityInput = page.locator('input[placeholder="Type to search universities..."]').first()
  await universityInput.click()
  await universityInput.fill('Stanford')
  const universityOption = page.getByRole('button', { name: /Stanford University/i }).first()
  if (await universityOption.isVisible({ timeout: 3000 }).catch(() => false)) {
    await universityOption.click()
  } else {
    await page.getByRole('button', { name: /Other \(specify below\)/i }).first().click()
    await page.fill('input[name="universityOther"]', 'Stanford University')
  }
  await page.selectOption('select[name="occupation"]', 'software_engineer')
  await page.fill('input[name="employerName"]', 'E2E QA Systems')
  await page.selectOption('select[name="annualIncome"]', '75k-100k')
  await page.selectOption('select[name="openToRelocation"]', 'yes')
  await page.getByRole('button', { name: /Continue/i }).click()
  // After account-first flow, next step is Religion & Astro (not Create Account)
  await expect(page.getByRole('heading', { name: /Religion & Astro/i })).toBeVisible()
}

async function completeReligion(page: Page) {
  await page.selectOption('select[name="religion"]', 'Agnostic')
  await expect(page.locator('select[name="community"]')).toBeEnabled()
  await page.selectOption('select[name="community"]', 'Agnostic')
  await page.getByRole('button', { name: /Continue/i }).click()
  await expect(page.getByRole('heading', { name: /Family Details/i })).toBeVisible()
}

async function completeFamily(page: Page) {
  await page.selectOption('select[name="familyLocation"]', 'USA')
  await page.selectOption('select[name="familyValues"]', 'moderate')
  await page.getByRole('button', { name: /Continue/i }).click()
  await expect(page.getByRole('heading', { name: /Lifestyle/i })).toBeVisible()
}

async function completeLifestyle(page: Page) {
  await page.selectOption('select[name="dietaryPreference"]', 'Vegetarian')
  await page.selectOption('select[name="smoking"]', 'No')
  await page.selectOption('select[name="drinking"]', 'No')
  await page.selectOption('select[name="pets"]', 'no_but_love')
  await page.getByRole('button', { name: /Continue/i }).click()
  await expect(page.getByRole('heading', { name: /About Me/i })).toBeVisible()
}

async function completeAboutMe(page: Page) {
  await page.fill('textarea[name="aboutMe"]', 'I am a test user who values family, growth, and kindness.')
  const linkedinSelect = page.locator('label:has-text("LinkedIn")').locator('..').locator('select')
  await linkedinSelect.selectOption('no_linkedin')
  await page.getByRole('button', { name: /Continue/i }).click()
  await expect(page.getByRole('heading', { name: /Partner Preferences/i })).toBeVisible()
}

async function completePartnerPreferences(page: Page) {
  await page.selectOption('select[name="prefAgeMin"]', '25')
  await page.selectOption('select[name="prefAgeMax"]', '35')
  await page.selectOption('select[name="prefHeightMin"]', `5'0"`)
  await page.selectOption('select[name="prefHeightMax"]', `6'2"`)

  const neverMarried = page
    .locator('div:has(h4:has-text("Marital Status")) label:has-text("Never Married") input[type="checkbox"]')
    .first()
  if (!(await neverMarried.isChecked().catch(() => false))) {
    await neverMarried.check()
  }

  const continueButton = page.getByRole('button', { name: /Continue/i }).first()
  if (await continueButton.isDisabled()) {
    const hinduPill = page
      .locator('div:has(h4:has-text("Religion Preference")) button:has-text("Hindu")')
      .first()
    if (await hinduPill.isVisible().catch(() => false)) {
      await hinduPill.click()
    }
  }

  await expect(continueButton).toBeEnabled({ timeout: 15000 })
  const preferences1Save = page.waitForResponse(
    (response) => response.url().includes('/api/profile/') && response.request().method() === 'PUT'
  )
  await continueButton.click()
  const preferences1SaveResponse = await preferences1Save
  if (!preferences1SaveResponse.ok()) {
    const body = await preferences1SaveResponse.text()
    throw new Error(`Failed to save partner preferences step (${preferences1SaveResponse.status()}): ${body}`)
  }
  await expect(page.getByRole('heading', { name: /More Preferences/i })).toBeVisible()

  const preferences2Save = page.waitForResponse(
    (response) => response.url().includes('/api/profile/') && response.request().method() === 'PUT'
  )
  await page.getByRole('button', { name: /Continue|Create Profile/i }).first().click()
  const preferences2SaveResponse = await preferences2Save
  if (!preferences2SaveResponse.ok()) {
    const body = await preferences2SaveResponse.text()
    throw new Error(`Failed to save more preferences step (${preferences2SaveResponse.status()}): ${body}`)
  }

  const movedToPhotos = await page.waitForURL(/\/profile\/photos/i, { timeout: 30000 })
    .then(() => true)
    .catch(() => false)

  if (!movedToPhotos) {
    await expect(page.getByRole('heading', { name: /Add Your Photos|Almost Done! Add Your Photos/i })).toBeVisible({ timeout: 30000 })
  }
}

async function uploadModalPhoto(page: Page) {
  await page.setInputFiles('input[type="file"]', photoPath)
  await page.getByRole('button', { name: /Complete Registration/i }).click()
  await page.waitForURL(/dashboard|login/, { timeout: 120000 })
}

async function completeSignupFlow(page: Page, user: typeof userA) {
  await openSignupModal(page)
  // NEW ORDER: Account step is FIRST (email + phone mandatory)
  await completeAccountStep(page, user)
  await completeBasics(page, user)
  await completeLocationEducation(page)
  // Account step removed - now handled at the beginning
  await completeReligion(page)
  await completeFamily(page)
  await completeLifestyle(page)
  await completeAboutMe(page)
  await completePartnerPreferences(page)
  await uploadModalPhoto(page)

  if (page.url().includes('/login')) {
    await login(page, user.email, password)
  }

  await signOut(page, user.firstName)
}

async function login(page: Page, email: string, userPassword: string) {
  await page.goto('/login')

  const emailInput = page.locator('#email')
  const emailInputVisible = await emailInput.isVisible().catch(() => false)
  if (!emailInputVisible) {
    const toggle = page.getByRole('button', { name: /Don't have Gmail\? Sign in with email/i }).first()
    if (await toggle.isVisible().catch(() => false)) {
      await toggle.click()
    }
    await expect(emailInput).toBeVisible({ timeout: 15000 })
  }

  await page.fill('#email', email)
  await page.fill('#password', userPassword)
  const emailSignIn = page.getByRole('button', { name: /Sign In with Email/i }).first()
  if (await emailSignIn.isVisible().catch(() => false)) {
    await emailSignIn.click()
  } else {
    await page.getByRole('button', { name: /^Sign In$/i }).first().click()
  }

  await page.waitForURL(url => {
    const path = url.pathname.toLowerCase()
    return !path.startsWith('/login') &&
      (path.startsWith('/dashboard') || path.startsWith('/matches') || path.startsWith('/profile'))
  }, { timeout: 60000 })
}

async function signOut(page: Page, firstName: string) {
  const profileButton = page.getByRole('button', { name: new RegExp(firstName, 'i') })
  await expect(profileButton).toBeVisible()
  await profileButton.click()
  await page.getByRole('button', { name: /Sign Out/i }).click()
  await page.waitForURL(/\//)
}

async function approveProfileByEmail(page: Page, email: string) {
  const card = page.locator('div.bg-white.rounded-xl', { has: page.getByText(email) }).first()
  await expect(card).toBeVisible({ timeout: 15000 })
  await card.getByRole('button', { name: 'Approve' }).click()
  await expect(card).toHaveCount(0)
}

async function rejectProfileByEmail(page: Page, email: string) {
  const card = page.locator('div.bg-white.rounded-xl', { has: page.getByText(email) }).first()
  await expect(card).toBeVisible({ timeout: 15000 })
  await card.getByRole('button', { name: 'Reject' }).click()
  const modal = page.getByRole('dialog', { name: /Reject Profile/i })
  await expect(modal).toBeVisible()
  await modal.getByRole('textbox').fill('Incomplete details for verification.')
  await modal.getByRole('button', { name: /Confirm Rejection/i }).click()
  await expect(modal).toBeHidden()
  await expect(card).toHaveCount(0)
}

async function likeProfile(page: Page, firstName: string) {
  const searchInput = page.locator('input[placeholder*="Search"]')
  await expect(searchInput).toBeVisible()
  await searchInput.fill(firstName)
  const card = page.locator('div.bg-white.rounded-lg', { has: page.getByRole('heading', { name: new RegExp(firstName, 'i') }) }).first()
  await expect(card).toBeVisible()
  await card.locator('button[title*="Like"]').click()
  await expect(card).toHaveCount(0)
  await searchInput.fill('')
}

async function openConnectionAndMessage(page: Page, firstName: string) {
  const card = page.locator('div.bg-white.rounded-xl', { has: page.getByRole('heading', { name: new RegExp(firstName, 'i') }) }).first()
  await expect(card).toBeVisible()
  await card.getByRole('button', { name: /Message/i }).click()
  const modal = page.getByRole('dialog')
  await expect(modal).toBeVisible()
  await modal.getByLabel('Type a message').fill('Hi! Excited to connect and learn more about you.')
  const sendResponse = page.waitForResponse((res) => res.url().includes('/api/messages') && res.request().method() === 'POST')
  await modal.getByRole('button', { name: /Send message/i }).click()
  await sendResponse
  await expect(modal.getByText('Hi! Excited to connect and learn more about you.')).toBeVisible({ timeout: 15000 })
  await modal.getByRole('button', { name: /Close conversation/i }).click()
}

async function lookupUserIdFromAdminProfiles(page: Page, email: string) {
  await page.goto('/admin/profiles', { waitUntil: 'domcontentloaded' })
  await expect(page.getByRole('heading', { name: /Profiles/i })).toBeVisible({ timeout: 15000 })
  const searchInput = page.getByPlaceholder(/Search by name, email, VR ID|Search\.\.\./i)
  await expect(searchInput).toBeVisible({ timeout: 15000 })
  await searchInput.fill(email)
  await searchInput.press('Enter')

  const row = page.locator('tr', { has: page.getByText(email) }).first()
  await expect(row).toBeVisible()
  const viewAsLink = row.getByRole('link', { name: /View as this user/i }).first()
  const href = await viewAsLink.getAttribute('href')
  expect(href).toBeTruthy()
  const match = href?.match(/viewAsUser=([^&]+)/)
  return match ? match[1] : ''
}

test.describe.serial('End-to-end user journey', () => {
  test.describe.configure({ timeout: 180000 })
  let userAId = ''
  let userBId = ''

  test('User A signs up and completes profile with photo upload', async ({ page }) => {
    await completeSignupFlow(page, userA)
  })

  test('User B signs up and completes profile with photo upload', async ({ page }) => {
    await completeSignupFlow(page, userB)
  })

  test('User C signs up and completes profile with photo upload', async ({ page }) => {
    await completeSignupFlow(page, userC)
  })

  test('Admin approves new profiles', async ({ page }) => {
    await page.goto('/admin/login')
    await page.fill('input[placeholder="Enter username"]', 'admin')
    await page.fill('input[placeholder="Enter password"]', 'vivaah2024')
    await page.getByRole('button', { name: /Sign In/i }).click()
    await page.waitForURL(/\/admin/, { timeout: 60000 })

    await page.goto('/admin/approvals')
    await expect(page.getByRole('heading', { name: /Profile Approvals/i })).toBeVisible()
    await approveProfileByEmail(page, userA.email)
    await approveProfileByEmail(page, userB.email)
    await rejectProfileByEmail(page, userC.email)

    userAId = await lookupUserIdFromAdminProfiles(page, userA.email)
    expect(userAId).toBeTruthy()

    userBId = await lookupUserIdFromAdminProfiles(page, userB.email)
    expect(userBId).toBeTruthy()
  })

  test('User B logs in, completes photos, and likes User A', async ({ page }) => {
    await login(page, userB.email, password)
    await page.waitForURL(/profile\/photos|dashboard/, { timeout: 60000 })

    if (page.url().includes('/profile/photos')) {
      await page.locator('input[placeholder="Phone number"]').fill(userB.phone)
      await page.setInputFiles('input[type="file"]', photoPath)
      await page.getByRole('button', { name: /Complete Registration/i }).click()
      await page.waitForURL(/dashboard/, { timeout: 60000 })
    }

    await page.goto('/matches')
    await likeProfile(page, userA.firstName)
    await signOut(page, userB.firstName)
  })

  test('User A matches, messages, and edits profile', async ({ page }) => {
    await login(page, userA.email, password)
    await page.waitForURL(/dashboard/, { timeout: 60000 })

    await page.goto('/matches')
    await likeProfile(page, userB.firstName)

    await page.goto('/admin/login')
    await page.fill('input[placeholder="Enter username"]', 'admin')
    await page.fill('input[placeholder="Enter password"]', 'vivaah2024')
    await page.getByRole('button', { name: /Sign In/i }).click()
    await page.waitForURL(/\/admin/, { timeout: 60000 })

    await page.goto(`/connections?viewAsUser=${userAId}`)
    await openConnectionAndMessage(page, userB.firstName)

    await page.goto('/profile')
    const aboutHeading = page.getByRole('heading', { name: 'About Me', level: 2 })
    await expect(aboutHeading).toBeVisible()
    await aboutHeading.locator('..').getByRole('button', { name: /Edit/i }).click()
    await expect(page.getByRole('heading', { name: /Edit About Me/i })).toBeVisible()

    const updatedBio = 'Updated bio: thoughtful, adventurous, and family-oriented.'
    await page.fill('textarea[name="aboutMe"]', updatedBio)
    const referralSelect = page.locator('select[name="referralSource"]')
    if (await referralSelect.isVisible()) {
      await referralSelect.selectOption('google')
    }
    const saveResponse = page.waitForResponse((response) =>
      response.url().includes('/api/profile') &&
      response.request().method() === 'PUT' &&
      response.ok()
    )
    await page.getByRole('button', { name: /Save Changes/i }).click()
    await saveResponse
    await expect(page.getByRole('heading', { name: /Edit About Me/i })).toBeHidden()
    await expect(page.getByText(updatedBio).first()).toBeVisible()

    await expect(page.getByText(/Photo Uploaded/i)).toBeVisible()
    await expect(page.locator('img[alt^="Photo"]').first()).toBeVisible()
  })

  test('User A explores matches, connections, messages, search, and reconsider', async ({ page }) => {
    await login(page, userA.email, password)
    await page.waitForURL(/dashboard/, { timeout: 60000 })

    await page.goto('/matches')
    await expect(page.locator('h1, h2').first()).toBeVisible()
    const searchInput = page.locator('input[placeholder*="Search"]').first()
    if (await searchInput.isVisible()) {
      await searchInput.fill(userB.firstName)
      await page.waitForTimeout(300)
      await searchInput.fill('')
    }

    const tabButtons = [
      page.getByRole('button', { name: /Matches/i }),
      page.getByRole('button', { name: /Sent/i }),
      page.getByRole('button', { name: /Received/i }),
    ]
    for (const tab of tabButtons) {
      if (await tab.first().isVisible()) {
        await tab.first().click()
      }
    }

    await page.goto('/connections')
    await expect(page.getByRole('heading', { name: /Connections/i })).toBeVisible()
    const messageButton = page.getByRole('button', { name: /^Message$/ }).first()
    if (await messageButton.isVisible()) {
      await messageButton.click()
      const modal = page.getByRole('dialog')
      await expect(modal).toBeVisible()
      await modal.getByLabel('Type a message').fill('Hello from the E2E user flow.')
      await modal.getByRole('button', { name: /Send message/i }).click()
      await modal.getByRole('button', { name: /Close conversation/i }).click()
    }

    await page.goto('/messages')
    await expect(page.getByRole('heading', { name: /Messages/i })).toBeVisible()
    await expect(page.getByText(new RegExp(userB.firstName, 'i')).first()).toBeVisible()

    await page.goto('/search')
    await expect(page.getByRole('heading', { name: /Your Matches|Browse Profiles/i })).toBeVisible()

    await page.goto('/reconsider')
    await expect(page.getByRole('heading', { name: 'Passed Profiles', exact: true })).toBeVisible()
  })

  test('Admin reviews management pages', async ({ page }) => {
    await page.goto('/admin/login')
    await page.fill('input[placeholder="Enter username"]', 'admin')
    await page.fill('input[placeholder="Enter password"]', 'vivaah2024')
    await page.getByRole('button', { name: /Sign In/i }).click()
    await page.waitForURL(/\/admin/, { timeout: 60000 })

    await page.goto('/admin')
    await expect(page.getByRole('heading', { name: /Dashboard/i })).toBeVisible()

    await page.goto('/admin/profiles')
    await expect(page.locator('text=/Profiles|All Profiles/i').first()).toBeVisible()

    const searchInput = page.locator('input[placeholder*="Search"]').first()
    if (await searchInput.isVisible()) {
      await searchInput.fill(userA.email)
      await page.waitForTimeout(500)
    }

    const viewAsUserLink = page.locator('a:has-text("View as User")').first()
    if (await viewAsUserLink.isVisible()) {
      const href = await viewAsUserLink.getAttribute('href')
      expect(href || '').toContain('viewAsUser')
    }

    await page.goto('/admin/matches')
    await expect(page.locator('text=/Matches/i').first()).toBeVisible()

    await page.goto('/admin/reports')
    await expect(page.locator('text=/Reports/i').first()).toBeVisible()

    await page.goto(`/admin/users/${userAId}`)
    await expect(page.locator('text=/User Details|Profile/i').first()).toBeVisible()
  })
})
