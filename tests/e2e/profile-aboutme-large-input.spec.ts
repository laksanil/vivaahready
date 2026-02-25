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

async function openSectionEditor(page: Page, headingText: RegExp, modalHeadingText: RegExp) {
  const heading = page.getByRole('heading', { name: headingText }).first()
  await expect(heading).toBeVisible()
  await heading.locator('xpath=../button[contains(., "Edit")]').click()
  await expect(page.getByRole('heading', { name: modalHeadingText })).toBeVisible()
}

test.describe('Profile page About Me large-input coverage', () => {
  test.describe.configure({ timeout: 180000 })

  test('persists very large About Me text and keeps profile sections functional', async ({ request, browser }) => {
    const suffix = Date.now().toString(36)
    const user = buildTestUser(`${suffix}-aboutme`, 'female')

    const { profileId } = await createUserWithProfile(request, baseURL, user, DEFAULT_PASSWORD, {
      firstName: `About${suffix}`,
      lastName: 'LargeData',
      aboutMe: 'Initial about me text used to verify overwrite behavior.',
      referralSource: 'google',
      linkedinProfile: 'no_linkedin',
      dietaryPreference: 'Vegetarian',
      smoking: 'No',
      drinking: 'No',
      pets: 'no_but_love',
      hobbies: 'Reading, Travel',
      fitness: 'Yoga, Walking',
      interests: 'Music, Cooking',
      prefQualification: 'bachelors',
    })

    const context = await browser.newContext({ baseURL })
    const page = await context.newPage()

    await loginViaApiCredentials(context.request, baseURL, user.email, DEFAULT_PASSWORD)
    await page.goto('/profile')
    await dismissCookieBanner(page)

    await expect(page.getByRole('heading', { name: /^Basic Info$/i })).toBeVisible({ timeout: 60000 })
    await expect(page.getByRole('heading', { name: /^Education & Career$/i })).toBeVisible()
    await expect(page.getByRole('heading', { name: /^Religion & Astro$/i })).toBeVisible()
    await expect(page.getByRole('heading', { name: /^Family$/i })).toBeVisible()
    await expect(page.getByRole('heading', { name: /^Lifestyle$/i })).toBeVisible()
    await expect(page.getByRole('heading', { name: /^About Me$/i })).toBeVisible()

    await openSectionEditor(page, /^Lifestyle$/i, /Edit Lifestyle/i)
    await expect(page.locator('select[name="dietaryPreference"]')).toHaveValue('Vegetarian')
    await expect(page.locator('select[name="smoking"]')).toHaveValue('No')
    await expect(page.locator('select[name="drinking"]')).toHaveValue('No')
    await expect(page.locator('select[name="pets"]')).toHaveValue('no_but_love')
    await page.getByRole('button', { name: /^Cancel$/i }).click()
    await expect(page.getByRole('heading', { name: /Edit Lifestyle/i })).toHaveCount(0)

    await openSectionEditor(page, /^About Me$/i, /Edit About Me/i)

    const largeAboutMe = Array.from(
      { length: 220 },
      (_, index) =>
        `Paragraph ${index + 1}: I value family, emotional maturity, kindness, and long-term commitment while balancing ambition, community, and personal growth.`
    ).join(' ')

    await page.locator('textarea[name="aboutMe"]').fill(largeAboutMe)
    await expect(page.getByRole('button', { name: /Save Changes/i })).toBeEnabled()
    await page.getByRole('button', { name: /Save Changes/i }).click()
    await expect(page.getByRole('heading', { name: /Edit About Me/i })).toHaveCount(0)

    const aboutMePreview = page.locator('div.p-6:has(h2:has-text("About Me")) p.text-gray-700').first()
    await expect(aboutMePreview).toContainText('Paragraph 1:')
    await expect(aboutMePreview).toContainText('Paragraph 220:')

    const profileResponse = await page.request.get('/api/profile')
    expect(profileResponse.ok()).toBeTruthy()
    const profilePayload = await profileResponse.json() as { id: string; aboutMe: string }
    expect(profilePayload.id).toBe(profileId)
    expect(profilePayload.aboutMe).toBe(largeAboutMe)
    expect(profilePayload.aboutMe.length).toBe(largeAboutMe.length)

    await page.reload()
    await dismissCookieBanner(page)
    await expect(page.locator('div.p-6:has(h2:has-text("About Me")) p.text-gray-700').first()).toContainText('Paragraph 220:')

    await page.goto('/profile?tab=preferences')
    await expect(page.getByRole('heading', { name: /^Partner Preferences$/i })).toBeVisible()
    await expect(page.getByRole('heading', { name: /^More Preferences$/i })).toBeVisible()

    await context.close()
  })
})
