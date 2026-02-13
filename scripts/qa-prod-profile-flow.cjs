const { chromium } = require('playwright')

const BASE_URL = 'https://vivaahready.com'
const defects = []
const notes = []

function addDefect({ title, severity = 'High', steps, expected, actual }) {
  defects.push({ title, severity, steps, expected, actual })
}

function note(msg) {
  notes.push(msg)
  console.log(`[note] ${msg}`)
}

async function isVisible(locator) {
  try {
    return await locator.isVisible()
  } catch {
    return false
  }
}

async function openSignupModal(page) {
  await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle', timeout: 60000 })
  const ctas = [
    page.getByRole('button', { name: /find my match/i }).first(),
    page.getByText(/find my match/i).first(),
  ]

  let clicked = false
  for (const cta of ctas) {
    if (await isVisible(cta)) {
      await cta.click()
      clicked = true
      break
    }
  }

  if (!clicked) {
    throw new Error('Could not find Find My Match CTA on homepage')
  }

  await page.getByText(/Step 1 of 9/i).first().waitFor({ timeout: 30000 })
}

async function createAccountAndReachBasics(page, seed) {
  const firstName = `QA${seed}`
  const lastName = `Prod${seed}`
  const phone10 = `92555${String(seed).slice(-5).padStart(5, '0')}`.slice(0, 10)
  const email = `qa.profile.${seed}@example.com`
  const password = `QaProd!${seed}`

  await openSignupModal(page)

  await page.locator('input[name="firstName"]').fill(firstName)
  await page.locator('input[name="lastName"]').fill(lastName)

  const phoneInput = page.locator('input[type="tel"]').first()
  await phoneInput.fill(phone10.slice(0, 9))
  await page.waitForTimeout(300)

  const signupChoice = page.getByText(/Choose how to sign up/i)
  if (await isVisible(signupChoice)) {
    addDefect({
      title: 'Signup options appear before 10-digit phone is entered',
      severity: 'Medium',
      steps: [
        'Open signup modal',
        'Enter valid first/last name',
        'Enter only 9 digits in phone field',
      ],
      expected: 'Signup options should remain hidden until minimum phone length is met.',
      actual: 'Signup options appeared with only 9 digits entered.',
    })
  }

  await phoneInput.fill(phone10)
  await page.waitForTimeout(400)

  if (!(await isVisible(signupChoice))) {
    addDefect({
      title: 'Signup options do not appear after valid phone entry',
      steps: [
        'Open signup modal',
        'Enter name and 10-digit phone',
      ],
      expected: 'Signup options should appear after valid phone input.',
      actual: 'Signup options remained hidden.',
    })
  }

  await page.getByRole('button', { name: /Don\'t have Gmail\? Use another email/i }).click()
  await page.locator('input[type="email"]').fill(email)
  await page.locator('input[placeholder=\"Enter password\"]').first().fill(password)
  await page.locator('input[placeholder=\"Re-enter password\"]').first().fill(password)

  const createBtn = page.getByRole('button', { name: /Create Account & Continue/i })
  if (await createBtn.isDisabled()) {
    addDefect({
      title: 'Account creation button stays disabled for valid inputs',
      steps: [
        'Open signup modal',
        'Enter valid name/phone/email/password/confirm password',
      ],
      expected: 'Create Account & Continue should become enabled.',
      actual: 'Button remained disabled despite valid inputs.',
    })
  }

  await createBtn.click()
  await page.getByText(/Step 2 of 9/i).first().waitFor({ timeout: 45000 })

  return { firstName, lastName, phone10, email, password }
}

async function fillBasics(page) {
  const continueBtn = page.getByRole('button', { name: /^Continue$/ }).last()
  if (!(await continueBtn.isDisabled())) {
    addDefect({
      title: 'Basic Info continue enabled before required fields are filled',
      severity: 'Medium',
      steps: ['Reach Step 2 (Basic Info) with empty required fields.'],
      expected: 'Continue should be disabled.',
      actual: 'Continue was enabled.',
    })
  }

  await page.selectOption('select[name="createdBy"]', 'self')
  await page.selectOption('select[name="gender"]', 'male')
  await page.locator('input[name="dateOfBirth"]').fill('01/01/1992')
  await page.selectOption('select[name="height"]', `5'8"`)
  await page.selectOption('select[name="motherTongue"]', 'English')

  await page.waitForTimeout(300)
  if (await continueBtn.isDisabled()) {
    addDefect({
      title: 'Basic Info continue remains disabled after required fields are filled',
      steps: ['Fill Created By, Gender, DOB, Height, Mother Tongue.'],
      expected: 'Continue should be enabled.',
      actual: 'Continue stayed disabled.',
    })
  }

  await continueBtn.click()
  await page.getByText(/Step 3 of 9/i).first().waitFor({ timeout: 30000 })
}

async function chooseUniversity(page, university = 'San Jose State University') {
  const uniInput = page.locator('input[placeholder="Type to search universities..."]').first()
  await uniInput.click()
  await uniInput.fill(university)
  const opt = page.getByRole('button', { name: new RegExp(university.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')) }).first()
  await opt.waitFor({ timeout: 10000 })
  await opt.click()
  await page.waitForTimeout(200)
}

async function fillLocationEducationWorking(page) {
  const continueBtn = page.getByRole('button', { name: /^Continue$/ }).last()
  if (!(await continueBtn.isDisabled())) {
    addDefect({
      title: 'Education & Career continue enabled before required fields are filled',
      severity: 'Medium',
      steps: ['Reach Step 3 (Education & Career) with required fields empty.'],
      expected: 'Continue should be disabled.',
      actual: 'Continue was enabled.',
    })
  }

  const zip = page.locator('input[name="zipCode"]')
  if (await isVisible(zip)) {
    await zip.fill('95112')
  }

  await page.selectOption('select[name="qualification"]', 'bachelors_cs')
  await page.selectOption('select[name="occupation"]', 'software_engineer')
  await page.selectOption('select[name="annualIncome"]', '75k-100k')
  await page.selectOption('select[name="openToRelocation"]', 'yes')

  // keep university empty and check blocking
  await page.waitForTimeout(400)
  if (!(await continueBtn.isDisabled())) {
    addDefect({
      title: 'College/University is not enforced as required',
      steps: [
        'Step 3: Fill all required fields except College/University.',
      ],
      expected: 'Continue should stay disabled until College/University is selected.',
      actual: 'Continue became enabled without College/University.',
    })
  }

  await chooseUniversity(page)

  // keep company empty for working occupation
  const employer = page.locator('input[name="employerName"]').first()
  await employer.fill('')
  await page.waitForTimeout(300)
  if (!(await continueBtn.isDisabled())) {
    addDefect({
      title: 'Company/Organization is not enforced for working occupation',
      steps: [
        'Step 3: Select occupation Software Engineer.',
        'Leave Company/Organization empty.',
      ],
      expected: 'Continue should remain disabled for working occupations without company.',
      actual: 'Continue became enabled with empty company.',
    })
  }

  await employer.fill('QA Systems Inc')
  await page.waitForTimeout(300)

  if (await continueBtn.isDisabled()) {
    addDefect({
      title: 'Education & Career continue stays disabled after all required fields are filled',
      steps: ['Fill all required fields including company for working occupation.'],
      expected: 'Continue should be enabled.',
      actual: 'Continue stayed disabled.',
    })
  }

  await continueBtn.click()
  await page.getByText(/Step 4 of 9/i).first().waitFor({ timeout: 30000 })
}

async function fillReligion(page) {
  const continueBtn = page.getByRole('button', { name: /^Continue$/ }).last()
  if (!(await continueBtn.isDisabled())) {
    addDefect({
      title: 'Religion step continue enabled before required fields are filled',
      severity: 'Medium',
      steps: ['Reach Step 4 (Religion & Astro) with religion/community empty.'],
      expected: 'Continue should be disabled.',
      actual: 'Continue was enabled.',
    })
  }

  await page.selectOption('select[name="religion"]', 'Hindu')
  await page.waitForTimeout(300)
  const community = page.locator('select[name="community"]')
  await community.selectOption({ index: 1 })

  await page.waitForTimeout(300)
  if (await continueBtn.isDisabled()) {
    addDefect({
      title: 'Religion step continue disabled despite required fields filled',
      steps: ['Select religion and community.'],
      expected: 'Continue should be enabled.',
      actual: 'Continue stayed disabled.',
    })
  }

  await continueBtn.click()
  await page.getByText(/Step 5 of 9/i).first().waitFor({ timeout: 30000 })
}

async function fillFamily(page) {
  const continueBtn = page.getByRole('button', { name: /^Continue$/ }).last()
  if (!(await continueBtn.isDisabled())) {
    addDefect({
      title: 'Family step continue enabled before required fields are filled',
      severity: 'Medium',
      steps: ['Reach Step 5 (Family) with family location/values empty.'],
      expected: 'Continue should be disabled.',
      actual: 'Continue was enabled.',
    })
  }

  await page.selectOption('select[name="familyLocation"]', { index: 1 })
  await page.selectOption('select[name="familyValues"]', { index: 1 })
  await page.waitForTimeout(200)

  if (await continueBtn.isDisabled()) {
    addDefect({
      title: 'Family step continue disabled despite required fields filled',
      steps: ['Select family location and family values.'],
      expected: 'Continue should be enabled.',
      actual: 'Continue stayed disabled.',
    })
  }

  await continueBtn.click()
  await page.getByText(/Step 6 of 9/i).first().waitFor({ timeout: 30000 })
}

async function fillLifestyle(page) {
  const continueBtn = page.getByRole('button', { name: /^Continue$/ }).last()
  if (!(await continueBtn.isDisabled())) {
    addDefect({
      title: 'Lifestyle step continue enabled before required fields are filled',
      severity: 'Medium',
      steps: ['Reach Step 6 (Lifestyle) with required fields empty.'],
      expected: 'Continue should be disabled.',
      actual: 'Continue was enabled.',
    })
  }

  await page.selectOption('select[name="dietaryPreference"]', { index: 1 })
  await page.selectOption('select[name="smoking"]', { index: 1 })
  await page.selectOption('select[name="drinking"]', { index: 1 })
  await page.selectOption('select[name="pets"]', { index: 1 })

  await page.waitForTimeout(200)
  if (await continueBtn.isDisabled()) {
    addDefect({
      title: 'Lifestyle step continue disabled despite required fields filled',
      steps: ['Fill diet, smoking, drinking, pets.'],
      expected: 'Continue should be enabled.',
      actual: 'Continue stayed disabled.',
    })
  }

  await continueBtn.click()
  await page.getByText(/Step 7 of 9/i).first().waitFor({ timeout: 30000 })
}

async function fillAbout(page) {
  const continueBtn = page.getByRole('button', { name: /^Continue$/ }).last()

  await page.locator('textarea[name="aboutMe"]').fill('QA production profile flow validation text.')

  const linkedinUrl = page.locator('input[name="linkedinProfile"]')
  await linkedinUrl.fill('linkedin.com/company/test')
  await linkedinUrl.blur()
  await page.waitForTimeout(300)

  if (!(await continueBtn.isDisabled())) {
    addDefect({
      title: 'Invalid LinkedIn URL does not block About Me continuation',
      steps: [
        'Step 7: Fill About Me',
        'Enter company LinkedIn URL (not profile URL)',
      ],
      expected: 'Continue should stay disabled until a valid LinkedIn profile URL (or no-linkedin) is selected.',
      actual: 'Continue became enabled with invalid LinkedIn URL.',
    })
  }

  const linkedinModeSelect = page.locator('label:has-text("LinkedIn")').first().locator('..').locator('select').first()
  await linkedinModeSelect.selectOption('no_linkedin').catch(() => {})
  await page.selectOption('select[name="referralSource"]', 'google')
  await page.waitForTimeout(300)

  if (await continueBtn.isDisabled()) {
    // Fallback: switch to valid LinkedIn profile URL path if no_linkedin did not apply.
    await linkedinModeSelect.selectOption('has_linkedin').catch(() => {})
    await linkedinUrl.fill('https://www.linkedin.com/in/qa-prod-flow')
    await linkedinUrl.blur()
    await page.waitForTimeout(300)
  }

  if (await continueBtn.isDisabled()) {
    addDefect({
      title: 'About Me continue disabled despite valid required fields',
      steps: [
        'Set LinkedIn to no_linkedin',
        'Set referral source',
        'Fill about me',
      ],
      expected: 'Continue should be enabled.',
      actual: 'Continue stayed disabled.',
    })
  }

  await continueBtn.click()
  await page.getByText(/Step 8 of 9/i).first().waitFor({ timeout: 30000 })
}

async function testPreferencesAndProceed(page) {
  const continueBtn = page.getByRole('button', { name: /^Continue$/ }).last()

  const ageToggle = page.locator('input[aria-label="prefAge deal-breaker"], div:has(label:has-text("Age Range")) label:has-text("Deal-breaker") input[type="checkbox"]').first()
  const heightToggle = page.locator('input[aria-label="prefHeight deal-breaker"], div:has(label:has-text("Height Range")) label:has-text("Deal-breaker") input[type="checkbox"]').first()
  const maritalToggle = page.locator('input[aria-label="prefMaritalStatus deal-breaker"], div:has(h4:has-text("Marital Status")) label:has-text("Deal-breaker") input[type="checkbox"]').first()
  const religionToggle = page.locator('input[aria-label="prefReligion deal-breaker"], div:has(h4:has-text("Religion Preference")) label:has-text("Deal-breaker") input[type="checkbox"]').first()

  const setToggleState = async (toggle, shouldBeChecked) => {
    const current = await toggle.isChecked().catch(() => null)
    if (current === null) return null
    if (current !== shouldBeChecked) {
      await toggle.click().catch(() => {})
      await page.waitForTimeout(200)
    }
    return await toggle.isChecked().catch(() => null)
  }

  const checks = [
    ['Age', ageToggle],
    ['Height', heightToggle],
    ['Marital Status', maritalToggle],
    ['Religion', religionToggle],
  ]

  for (const [name, loc] of checks) {
    const exists = (await loc.count().catch(() => 0)) > 0
    if (!exists) {
      addDefect({
        title: `${name} deal-breaker toggle is missing`,
        severity: 'High',
        steps: ['Reach Step 8 Partner Preferences.'],
        expected: `${name} deal-breaker toggle should be visible.`,
        actual: `${name} deal-breaker toggle was not found in UI.`,
      })
      continue
    }
    const checked = await loc.isChecked().catch(() => false)
    if (!checked) {
      addDefect({
        title: `${name} deal-breaker is not enabled by default`,
        steps: ['Reach Step 8 Partner Preferences.'],
        expected: `${name} deal-breaker should default to enabled.`,
        actual: `${name} deal-breaker was not enabled by default.`,
      })
    }
  }

  const anyMarital = page.locator('div:has(h4:has-text("Marital Status")) label:has-text("Any")')
  const maritalDefaultChecked = await maritalToggle.isChecked().catch(() => false)
  if (maritalDefaultChecked && await anyMarital.count() > 0 && await anyMarital.first().isVisible()) {
    addDefect({
      title: '“Any/Doesn\'t Matter” is visible for marital status while deal-breaker is enabled',
      steps: ['Reach Step 8 with default deal-breakers.'],
      expected: 'When deal-breaker is ON, “Any” should not be shown for marital status.',
      actual: '“Any” option is visible while marital-status deal-breaker is enabled.',
    })
  }

  const dmReligion = page.getByRole('button', { name: /Doesn\'t Matter \(Any Religion\)/i })
  const religionDefaultChecked = await religionToggle.isChecked().catch(() => false)
  if (religionDefaultChecked && await dmReligion.count() > 0 && await dmReligion.first().isVisible()) {
    addDefect({
      title: '“Doesn\'t Matter (Any Religion)” is visible while religion deal-breaker is enabled',
      steps: ['Reach Step 8 with default deal-breakers.'],
      expected: 'When religion deal-breaker is ON, “Doesn\'t Matter” should be hidden.',
      actual: '“Doesn\'t Matter (Any Religion)” is visible.',
    })
  }

  // Ensure core deal-breakers are ON before required-field gating checks.
  await setToggleState(ageToggle, true)
  await setToggleState(heightToggle, true)
  await setToggleState(maritalToggle, true)
  await setToggleState(religionToggle, true)

  // Clear required ranges and verify gating
  await page.selectOption('select[name="prefAgeMin"]', '')
  await page.selectOption('select[name="prefAgeMax"]', '')
  await page.selectOption('select[name="prefHeightMin"]', '')
  await page.selectOption('select[name="prefHeightMax"]', '')
  await page.waitForTimeout(300)

  if (!(await continueBtn.isDisabled())) {
    addDefect({
      title: 'Partner Preferences allows continuation with required deal-breaker fields empty',
      severity: 'Critical',
      steps: [
        'Step 8: Clear Age Min/Max and Height Min/Max.',
        'Leave marital/religion specific selections empty under deal-breaker defaults.',
      ],
      expected: 'Continue should be disabled until required partner-preference deal-breaker fields are valid.',
      actual: 'Continue remained enabled and user can proceed.',
    })
  }

  // Test deal-breaker toggle behavior for marital status
  await setToggleState(maritalToggle, false)
  if (!(await anyMarital.first().isVisible().catch(() => false))) {
    addDefect({
      title: 'Marital-status “Any” option does not appear after turning deal-breaker OFF',
      severity: 'Medium',
      steps: ['Step 8: Turn off marital-status deal-breaker.'],
      expected: '“Any” option should appear when deal-breaker is OFF.',
      actual: '“Any” option did not appear.',
    })
  }

  if (await anyMarital.count() > 0) {
    await anyMarital.first().click().catch(() => {})
  }

  await setToggleState(maritalToggle, true)
  if (await anyMarital.count() > 0 && await anyMarital.first().isVisible().catch(() => false)) {
    addDefect({
      title: 'Marital-status “Any” option remains visible after turning deal-breaker ON',
      steps: ['Step 8: Turn marital-status deal-breaker ON after selecting Any.'],
      expected: '“Any” should be removed when deal-breaker is ON.',
      actual: '“Any” remains visible.',
    })
  }

  const setFirstEnabledValue = async (selector) => {
    const value = await page.locator(selector).evaluate((el) => {
      const opts = Array.from(el.options || [])
      const firstEnabled = opts.find(o => o.value && !o.disabled)
      return firstEnabled ? firstEnabled.value : ''
    }).catch(() => '')
    if (!value) return false
    await page.selectOption(selector, value).catch(() => {})
    return true
  }

  const setLastEnabledValue = async (selector) => {
    const value = await page.locator(selector).evaluate((el) => {
      const opts = Array.from(el.options || []).filter(o => o.value && !o.disabled)
      return opts.length ? opts[opts.length - 1].value : ''
    }).catch(() => '')
    if (!value) return false
    await page.selectOption(selector, value).catch(() => {})
    return true
  }

  // Fill required fields so the flow can proceed after negative-gating checks above.
  await setFirstEnabledValue('select[name="prefAgeMin"]')
  await setLastEnabledValue('select[name="prefAgeMax"]')
  await setFirstEnabledValue('select[name="prefHeightMin"]')
  await setLastEnabledValue('select[name="prefHeightMax"]')
  await setToggleState(ageToggle, true)
  await setToggleState(heightToggle, true)
  await setToggleState(maritalToggle, true)
  await setToggleState(religionToggle, true)

  const neverMarried = page.locator('div:has(h4:has-text("Marital Status")) label:has-text("Never Married") input[type="checkbox"]').first()
  if (!(await neverMarried.isChecked().catch(() => false))) {
    await neverMarried.click().catch(() => {})
  }

  const hinduButton = page.locator('div:has(h4:has-text("Religion Preference")) button', { hasText: 'Hindu' }).first()
  if (await hinduButton.count() > 0) {
    const hinduSelected = (await hinduButton.textContent().catch(() => '') || '').includes('✓')
    if (!hinduSelected) {
      await hinduButton.click().catch(() => {})
    }
  }
  await page.waitForTimeout(300)

  if (await continueBtn.isDisabled()) {
    addDefect({
      title: 'Partner Preferences continue disabled despite valid required fields',
      severity: 'High',
      steps: [
        'Step 8: Set age and height ranges.',
        'Select marital status (Never Married).',
        'Select religion (Hindu).',
      ],
      expected: 'Continue should be enabled when required partner-preference fields are valid.',
      actual: 'Continue stayed disabled.',
    })
    return null
  }

  // Proceed to more preferences and then photos
  await continueBtn.click()
  try {
    await page.getByText(/Step 9 of 9/i).first().waitFor({ timeout: 30000 })
  } catch (err) {
    addDefect({
      title: 'Unable to navigate to More Preferences after valid Partner Preferences',
      severity: 'High',
      steps: ['Step 8: Fill required fields and click Continue.'],
      expected: 'Should move to Step 9 of 9.',
      actual: err instanceof Error ? err.message : String(err),
    })
    return null
  }

  const continueBtn2 = page.getByRole('button', { name: /^Continue$/ }).last()
  if (await continueBtn2.isDisabled()) {
    addDefect({
      title: 'More Preferences continue disabled unexpectedly',
      severity: 'Medium',
      steps: ['Reach Step 9 of 9 and attempt to proceed.'],
      expected: 'Continue should be enabled when no required optional fields are missing.',
      actual: 'Continue was disabled.',
    })
    return null
  }
  await continueBtn2.click()
  try {
    await page.waitForURL(/\/profile\/photos\?profileId=/, { timeout: 30000 })
  } catch (err) {
    addDefect({
      title: 'Unable to reach photo upload step after preferences',
      severity: 'High',
      steps: ['Complete Step 8 and Step 9, then continue.'],
      expected: 'Should navigate to /profile/photos with profileId.',
      actual: err instanceof Error ? err.message : String(err),
    })
    return null
  }

  const url = page.url()
  const profileId = new URL(url).searchParams.get('profileId')
  return profileId
}

async function loginAndReadProfile(context, creds, profileIdExpected) {
  const page = await context.newPage()
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle', timeout: 60000 })
  await page.getByRole('button', { name: /Don\'t have Gmail\? Sign in with email/i }).click()
  await page.locator('#email').fill(creds.email)
  await page.locator('#password').fill(creds.password)
  const emailSubmit = page.getByRole('button', { name: /^Sign In with Email$/i }).first()
  if (await emailSubmit.count().catch(() => 0)) {
    await emailSubmit.click()
  } else {
    await page.locator('form:has(#email) button[type="submit"]').first().click()
  }

  await page.waitForLoadState('networkidle', { timeout: 45000 })
  await page.waitForURL(url => !url.pathname.startsWith('/login'), { timeout: 45000 }).catch(() => {})

  const statusResp = await context.request.get(`${BASE_URL}/api/user/profile-status`)
  if (!statusResp.ok()) {
    addDefect({
      title: 'Unable to fetch profile status after credential login',
      severity: 'High',
      steps: ['Login via email/password for newly created profile.', 'Call /api/user/profile-status.'],
      expected: 'API should return current user profile status.',
      actual: `API returned HTTP ${statusResp.status()}.`,
    })
    return
  }

  const statusData = await statusResp.json()
  const profileId = statusData.profileId

  if (profileIdExpected && profileId !== profileIdExpected) {
    addDefect({
      title: 'Profile ID mismatch after signup flow',
      severity: 'Medium',
      steps: ['Create profile through modal flow.', 'Login and fetch profile status.'],
      expected: `Expected profileId ${profileIdExpected}.`,
      actual: `Returned profileId ${profileId}.`,
    })
  }

  const profileResp = await context.request.get(`${BASE_URL}/api/profile/${profileId}`)
  if (!profileResp.ok()) {
    addDefect({
      title: 'Unable to fetch saved profile data after login',
      severity: 'High',
      steps: ['Login with created account.', 'Call /api/profile/{id}.'],
      expected: 'Profile data should be retrievable for owner.',
      actual: `API returned HTTP ${profileResp.status()}.`,
    })
    return
  }

  const p = await profileResp.json()

  const checks = [
    ['createdBy', 'self'],
    ['gender', 'male'],
    ['dateOfBirth', '01/01/1992'],
    ['zipCode', '95112'],
    ['qualification', 'bachelors_cs'],
    ['university', 'San Jose State University'],
    ['occupation', 'software_engineer'],
    ['employerName', 'QA Systems Inc'],
    ['openToRelocation', 'yes'],
    ['aboutMe', 'QA production profile flow validation text.'],
    ['linkedinProfile', null],
    ['referralSource', 'google'],
  ]

  for (const [field, expected] of checks) {
    const actual = p[field]
    const matches = expected === null ? actual === null : actual === expected
    if (!matches) {
      addDefect({
        title: `Field persistence issue: ${field}`,
        severity: 'High',
        steps: ['Complete profile flow and save sections.', 'Login and retrieve saved profile via owner API.'],
        expected: `${field} should be saved as ${JSON.stringify(expected)}.`,
        actual: `${field} was ${JSON.stringify(actual)}.`,
      })
    }
  }
}

async function testNonWorkingCompanyRule(page, seed) {
  const creds = await createAccountAndReachBasics(page, seed)
  await fillBasics(page)

  const continueBtn = page.getByRole('button', { name: /^Continue$/ }).last()

  const zip = page.locator('input[name="zipCode"]')
  if (await isVisible(zip)) {
    await zip.fill('95113')
  }

  await page.selectOption('select[name="qualification"]', 'bachelors_cs')
  await chooseUniversity(page, 'Santa Clara University')
  await page.selectOption('select[name="occupation"]', 'student')
  await page.locator('input[name="employerName"]').first().fill('')
  await page.selectOption('select[name="annualIncome"]', 'student')
  await page.selectOption('select[name="openToRelocation"]', 'yes')

  await page.waitForTimeout(500)
  if (await continueBtn.isDisabled()) {
    addDefect({
      title: 'Company/Organization incorrectly required for non-working occupation',
      severity: 'High',
      steps: [
        'Step 3: Select occupation Student.',
        'Leave Company/Organization empty.',
        'Fill all other required fields.',
      ],
      expected: 'Continue should be enabled for non-working occupations without company.',
      actual: 'Continue stayed disabled.',
    })
  }

  note(`Non-working rule scenario account: ${creds.email}`)
}

async function run() {
  const browser = await chromium.launch({ headless: true })

  // Scenario A/C/D: end-to-end with persistence + preferences rules
  try {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } })
    const page = await context.newPage()
    const seed = Date.now().toString().slice(-8)
    const creds = await createAccountAndReachBasics(page, seed)
    note(`Primary scenario account: ${creds.email}`)

    await fillBasics(page)
    await fillLocationEducationWorking(page)
    await fillReligion(page)
    await fillFamily(page)
    await fillLifestyle(page)
    await fillAbout(page)
    const profileId = await testPreferencesAndProceed(page)

    await loginAndReadProfile(context, creds, profileId)
    await context.close()
  } catch (err) {
    addDefect({
      title: 'Primary scenario execution failure',
      severity: 'High',
      steps: ['Run end-to-end production profile creation scenario.'],
      expected: 'Scenario should complete and validate persistence.',
      actual: err instanceof Error ? err.message : String(err),
    })
  }

  // Scenario B: non-working occupation should not require company
  try {
    const context = await browser.newContext({ viewport: { width: 1280, height: 900 } })
    const page = await context.newPage()
    const seed = (Date.now() + 17).toString().slice(-8)
    await testNonWorkingCompanyRule(page, seed)
    await context.close()
  } catch (err) {
    addDefect({
      title: 'Non-working occupation scenario execution failure',
      severity: 'High',
      steps: ['Run non-working occupation requirement validation scenario.'],
      expected: 'Scenario should execute successfully.',
      actual: err instanceof Error ? err.message : String(err),
    })
  }

  await browser.close()

  const report = {
    testedAt: new Date().toISOString(),
    baseUrl: BASE_URL,
    defects,
    notes,
    defectCount: defects.length,
  }

  console.log('\n===== QA REPORT JSON =====')
  console.log(JSON.stringify(report, null, 2))
}

run()
