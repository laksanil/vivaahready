import { test, expect, type Page } from '@playwright/test'
import {
  buildTestUser,
  createUserWithProfile,
  loginViaApiCredentials,
  DEFAULT_PASSWORD,
} from './helpers'

const baseURL = process.env.TEST_BASE_URL || 'http://127.0.0.1:3001'

async function dismissCookieBanner(page: Page) {
  const cookieButton = page.getByRole('button', { name: /Got it/i }).first()
  if (await cookieButton.isVisible().catch(() => false)) {
    await cookieButton.click({ force: true })
  }
}

async function openSectionEditor(page: Page, sectionHeading: RegExp, modalHeading: RegExp) {
  const heading = page.getByRole('heading', { name: sectionHeading }).first()
  await expect(heading).toBeVisible({ timeout: 60000 })
  await heading.locator('xpath=../button[contains(., "Edit")]').click()
  await expect(page.getByRole('heading', { name: modalHeading })).toBeVisible()
}

async function closeEditor(page: Page, modalHeading: RegExp) {
  await page.getByRole('button', { name: /^Cancel$/i }).click()
  await expect(page.getByRole('heading', { name: modalHeading })).toHaveCount(0)
}

test.describe('Profile form required-field enforcement', () => {
  test.describe.configure({ timeout: 180000 })

  test('disables save when required fields are cleared in each required section', async ({ request, browser }) => {
    const suffix = Date.now().toString(36)
    const user = buildTestUser(`${suffix}-required-form`, 'male')

    await createUserWithProfile(request, baseURL, user, DEFAULT_PASSWORD, {
      firstName: `Required${suffix}`,
      lastName: 'Form',
      createdBy: 'self',
      gender: 'male',
      dateOfBirth: '01/01/1992',
      height: `5'10"`,
      maritalStatus: 'never_married',
      motherTongue: 'English',
      religion: 'Hindu',
      community: 'Iyer',
      familyLocation: 'USA',
      familyValues: 'moderate',
      dietaryPreference: 'Vegetarian',
      smoking: 'No',
      drinking: 'No',
      pets: 'no_but_love',
      aboutMe: 'I value family, growth, and long-term commitment built on kindness and trust.',
      linkedinProfile: 'no_linkedin',
      referralSource: 'google',
      prefQualification: 'bachelors',
    })

    const context = await browser.newContext({ baseURL })
    const page = await context.newPage()
    await loginViaApiCredentials(context.request, baseURL, user.email, DEFAULT_PASSWORD)

    await page.goto('/profile')
    await dismissCookieBanner(page)
    await expect(page.getByRole('heading', { name: /^Basic Info$/i }).first()).toBeVisible({ timeout: 60000 })

    await openSectionEditor(page, /^Basic Info$/i, /Edit Basic Info/i)
    await page.fill('input[name="firstName"]', '')
    await expect(page.getByRole('button', { name: /Save Changes/i })).toBeDisabled()
    await expect(page.getByText(/First name is required/i)).toBeVisible()
    await closeEditor(page, /Edit Basic Info/i)

    await openSectionEditor(page, /^Religion & Astro$/i, /Edit Religion & Astro/i)
    await page.selectOption('select[name="religion"]', '')
    await expect(page.getByRole('button', { name: /Save Changes/i })).toBeDisabled()
    await expect(page.getByText(/Religion is required/i)).toBeVisible()
    await closeEditor(page, /Edit Religion & Astro/i)

    await openSectionEditor(page, /^Family$/i, /Edit Family Details/i)
    await page.selectOption('select[name="familyLocation"]', '')
    await expect(page.getByRole('button', { name: /Save Changes/i })).toBeDisabled()
    await expect(page.getByText(/Family location is required/i)).toBeVisible()
    await closeEditor(page, /Edit Family Details/i)

    await openSectionEditor(page, /^Lifestyle$/i, /Edit Lifestyle/i)
    await page.selectOption('select[name="dietaryPreference"]', '')
    await expect(page.getByRole('button', { name: /Save Changes/i })).toBeDisabled()
    await expect(page.getByText(/Diet is required/i)).toBeVisible()
    await closeEditor(page, /Edit Lifestyle/i)

    await openSectionEditor(page, /^About Me$/i, /Edit About Me/i)
    await page.fill('textarea[name="aboutMe"]', '')
    await expect(page.getByRole('button', { name: /Save Changes/i })).toBeDisabled()
    await expect(page.getByText(/About Me is required/i).first()).toBeVisible()
    await closeEditor(page, /Edit About Me/i)

    await context.close()
  })

  test('allows saving location/education when university is Other and custom value is entered', async ({ request, browser }) => {
    const suffix = Date.now().toString(36)
    const user = buildTestUser(`${suffix}-university-other`, 'female')

    await createUserWithProfile(request, baseURL, user, DEFAULT_PASSWORD, {
      firstName: `UniOther${suffix}`,
      lastName: 'Form',
      createdBy: 'self',
      gender: 'female',
      dateOfBirth: '01/01/1993',
      height: `5'5"`,
      maritalStatus: 'never_married',
      motherTongue: 'English',
      religion: 'Hindu',
      community: 'Iyer',
      familyLocation: 'USA',
      familyValues: 'moderate',
      dietaryPreference: 'Vegetarian',
      smoking: 'No',
      drinking: 'No',
      pets: 'no_but_love',
      aboutMe: 'I value compassion, family, and building a calm life with shared purpose and joy.',
      linkedinProfile: 'no_linkedin',
      referralSource: 'google',
      prefQualification: 'bachelors',
    })

    const context = await browser.newContext({ baseURL })
    const page = await context.newPage()
    await loginViaApiCredentials(context.request, baseURL, user.email, DEFAULT_PASSWORD)

    await page.goto('/profile')
    await dismissCookieBanner(page)
    await expect(page.getByRole('heading', { name: /^Basic Info$/i }).first()).toBeVisible({ timeout: 60000 })

    await openSectionEditor(page, /^Education & Career$/i, /Edit Education & Career/i)

    await page.locator('input[placeholder="Type to search universities..."]').first().click()
    await page.getByRole('button', { name: /Other \(specify below\)/i }).click()
    await page.fill('input[name="universityOther"]', 'California State University, Northridge')

    await expect(page.getByRole('button', { name: /Save Changes/i })).toBeEnabled()
    await page.getByRole('button', { name: /Save Changes/i }).click()
    await expect(page.getByRole('heading', { name: /Edit Education & Career/i })).toHaveCount(0)

    await openSectionEditor(page, /^Education & Career$/i, /Edit Education & Career/i)
    await expect(page.locator('input[placeholder="Type to search universities..."]').first()).toHaveValue(
      'California State University, Northridge'
    )

    await context.close()
  })

  test('accepts typed custom university without selecting Other option', async ({ request, browser }) => {
    const suffix = Date.now().toString(36)
    const user = buildTestUser(`${suffix}-university-typed`, 'male')
    const customUniversity = 'Northern School of Behavioral Sciences'

    await createUserWithProfile(request, baseURL, user, DEFAULT_PASSWORD, {
      firstName: `UniTyped${suffix}`,
      lastName: 'Form',
      createdBy: 'self',
      gender: 'male',
      dateOfBirth: '01/01/1992',
      height: `5'9"`,
      maritalStatus: 'never_married',
      motherTongue: 'English',
      religion: 'Hindu',
      community: 'Iyer',
      familyLocation: 'USA',
      familyValues: 'moderate',
      dietaryPreference: 'Vegetarian',
      smoking: 'No',
      drinking: 'No',
      pets: 'no_but_love',
      aboutMe: 'I am grounded, family-oriented, and focused on building a meaningful partnership.',
      linkedinProfile: 'no_linkedin',
      referralSource: 'google',
      prefQualification: 'bachelors',
    })

    const context = await browser.newContext({ baseURL })
    const page = await context.newPage()
    await loginViaApiCredentials(context.request, baseURL, user.email, DEFAULT_PASSWORD)

    await page.goto('/profile')
    await dismissCookieBanner(page)
    await expect(page.getByRole('heading', { name: /^Basic Info$/i }).first()).toBeVisible({ timeout: 60000 })

    await openSectionEditor(page, /^Education & Career$/i, /Edit Education & Career/i)

    const universityInput = page.locator('input[placeholder="Type to search universities..."]').first()
    await universityInput.fill(customUniversity)
    await page.locator('input[name="employerName"]').click()

    await expect(page.getByRole('button', { name: /Save Changes/i })).toBeEnabled()
    await page.getByRole('button', { name: /Save Changes/i }).click()
    await expect(page.getByRole('heading', { name: /Edit Education & Career/i })).toHaveCount(0)

    await openSectionEditor(page, /^Education & Career$/i, /Edit Education & Career/i)
    await expect(page.locator('input[placeholder="Type to search universities..."]').first()).toHaveValue(customUniversity)

    const profileResponse = await context.request.get(`${baseURL}/api/profile`)
    expect(profileResponse.ok()).toBeTruthy()
    const profile = await profileResponse.json()
    expect(profile.university).toBe(customUniversity)

    await context.close()
  })
})
