import { test, expect, request as apiRequest, type APIRequestContext, type BrowserContext } from '@playwright/test'
import {
  buildTestUser,
  createUserWithProfile,
  adminLogin,
  adminApproveProfile,
  loginViaApiCredentials,
  DEFAULT_PASSWORD,
  type TestUser,
} from './helpers'

const baseURL = process.env.TEST_BASE_URL || 'http://127.0.0.1:3001'

interface SeededUser {
  user: TestUser
  userId: string
  profileId: string
}

test.describe.serial('Education filters on Search and Matches pages', () => {
  test.describe.configure({ timeout: 240000 })

  let adminRequest: APIRequestContext
  let seeker: SeededUser
  let legacyMastersDallas: SeededUser
  let phdCsDallas: SeededUser
  let phdPsychAustin: SeededUser
  let mbaCsDallas: SeededUser
  let bachelorsDallas: SeededUser
  let mastersAustin: SeededUser

  const createNamedUser = (suffix: string, gender: 'male' | 'female', firstName: string): TestUser => {
    const user = buildTestUser(suffix, gender)
    user.firstName = firstName
    user.lastName = 'Case'
    return user
  }

  const seed = async (
    request: APIRequestContext,
    user: TestUser,
    overrides: Record<string, unknown>
  ): Promise<SeededUser> => {
    const created = await createUserWithProfile(request, baseURL, user, DEFAULT_PASSWORD, overrides)
    await adminApproveProfile(adminRequest, baseURL, created.profileId)
    return {
      user,
      userId: created.userId,
      profileId: created.profileId,
    }
  }

  test.beforeAll(async ({ request }) => {
    adminRequest = await apiRequest.newContext({ baseURL })
    await adminLogin(adminRequest, baseURL)

    const suffix = Date.now().toString(36)

    seeker = await seed(
      request,
      createNamedUser(`${suffix}-seeker`, 'female', `SeekerFilter${suffix}`),
      {
        religion: 'Hindu',
        community: 'Iyer',
        dateOfBirth: '01/01/1993',
        height: `5'4"`,
      }
    )

    legacyMastersDallas = await seed(
      request,
      createNamedUser(`${suffix}-legacy-masters`, 'male', `LegacyMasters${suffix}`),
      {
        qualification: 'masters_cs',
        educationLevel: '',
        fieldOfStudy: '',
        major: '',
        currentLocation: 'Dallas, Texas',
        religion: 'Hindu',
        community: 'Iyer',
        dateOfBirth: '01/01/1991',
      }
    )

    phdCsDallas = await seed(
      request,
      createNamedUser(`${suffix}-phd-cs`, 'male', `PhdCs${suffix}`),
      {
        qualification: 'phd',
        educationLevel: 'doctorate',
        fieldOfStudy: 'cs_it',
        major: 'Computer Science',
        university: 'Carnegie Mellon University',
        currentLocation: 'Dallas, Texas',
        religion: 'Hindu',
        community: 'Iyer',
        dateOfBirth: '01/01/1991',
      }
    )

    phdPsychAustin = await seed(
      request,
      createNamedUser(`${suffix}-phd-psych`, 'male', `PhdPsych${suffix}`),
      {
        qualification: 'phd',
        educationLevel: 'doctorate',
        fieldOfStudy: 'social_sciences',
        major: 'Psychology',
        university: 'UCLA',
        currentLocation: 'Austin, Texas',
        religion: 'Hindu',
        community: 'Iyer',
        dateOfBirth: '01/01/1991',
      }
    )

    mbaCsDallas = await seed(
      request,
      createNamedUser(`${suffix}-mba-cs`, 'male', `MbaCs${suffix}`),
      {
        qualification: 'mba',
        educationLevel: 'mba',
        fieldOfStudy: 'cs_it',
        major: 'Technology Management',
        university: 'UT Dallas',
        currentLocation: 'Dallas, Texas',
        religion: 'Hindu',
        community: 'Iyer',
        dateOfBirth: '01/01/1991',
      }
    )

    bachelorsDallas = await seed(
      request,
      createNamedUser(`${suffix}-bachelors-dallas`, 'male', `BachelorsDallas${suffix}`),
      {
        qualification: 'bachelors_cs',
        educationLevel: 'bachelors',
        fieldOfStudy: 'cs_it',
        major: 'Computer Science',
        university: 'UT Arlington',
        currentLocation: 'Dallas, Texas',
        religion: 'Hindu',
        community: 'Iyer',
        dateOfBirth: '01/01/1991',
      }
    )

    mastersAustin = await seed(
      request,
      createNamedUser(`${suffix}-masters-austin`, 'male', `MastersAustin${suffix}`),
      {
        qualification: 'masters_science',
        educationLevel: 'masters',
        fieldOfStudy: 'science',
        major: 'Biochemistry',
        university: 'UT Austin',
        currentLocation: 'Austin, Texas',
        religion: 'Hindu',
        community: 'Iyer',
        dateOfBirth: '01/01/1991',
      }
    )
  })

  test.afterAll(async () => {
    await adminRequest?.dispose()
  })

  const withSeekerSession = async (
    browser: import('@playwright/test').Browser,
    run: (context: BrowserContext) => Promise<void>
  ) => {
    const context = await browser.newContext({ baseURL })
    try {
      await loginViaApiCredentials(context.request, baseURL, seeker.user.email, DEFAULT_PASSWORD)
      await run(context)
    } finally {
      await context.close()
    }
  }

  test('Search page: legacy fallback, combo filters, zero-results empty state, clear filters', async ({ browser }) => {
    await withSeekerSession(browser, async (context) => {
      const page = await context.newPage()
      await page.goto('/search')

      await expect(page.getByRole('heading', { name: /Your Matches/i })).toBeVisible({ timeout: 60000 })

      const educationFilter = page.locator('select').nth(0)
      const fieldFilter = page.locator('select').nth(1)

      await educationFilter.selectOption('masters')
      await expect(page.getByText(new RegExp(legacyMastersDallas.user.firstName, 'i'))).toBeVisible()
      await expect(page.getByText(new RegExp(phdCsDallas.user.firstName, 'i'))).toHaveCount(0)

      await educationFilter.selectOption('doctorate')
      await fieldFilter.selectOption('cs_it')
      await expect(page.getByText(new RegExp(phdCsDallas.user.firstName, 'i'))).toBeVisible()
      await expect(page.getByText(new RegExp(phdPsychAustin.user.firstName, 'i'))).toHaveCount(0)
      await expect(page.getByText(new RegExp(mbaCsDallas.user.firstName, 'i'))).toHaveCount(0)

      await educationFilter.selectOption('law')
      await fieldFilter.selectOption('cs_it')
      await expect(page.getByRole('heading', { name: /No Matching Profiles/i })).toBeVisible()
      await expect(page.getByText(/Try adjusting your education filters/i)).toBeVisible()

      await page.getByRole('button', { name: /Clear Filters/i }).click()
      await expect(educationFilter).toHaveValue('')
      await expect(fieldFilter).toHaveValue('')
      await expect(page.getByText(new RegExp(phdCsDallas.user.firstName, 'i'))).toBeVisible()
    })
  })

  test('Matches page: filter + text search combination, clear search keeps filter, clear filters keeps search', async ({ browser }) => {
    await withSeekerSession(browser, async (context) => {
      const page = await context.newPage()
      await page.goto('/matches')

      await expect(page.getByRole('heading', { name: /My Matches/i })).toBeVisible({ timeout: 60000 })

      const searchInput = page.getByPlaceholder(/Search by name, location, occupation, university/i)
      const educationFilter = page.locator('select').nth(0)

      await educationFilter.selectOption('masters')
      await searchInput.fill('Dallas')

      await expect(page.getByText(new RegExp(legacyMastersDallas.user.firstName, 'i'))).toBeVisible()
      await expect(page.getByText(new RegExp(mastersAustin.user.firstName, 'i'))).toHaveCount(0)
      await expect(page.getByText(new RegExp(bachelorsDallas.user.firstName, 'i'))).toHaveCount(0)

      await searchInput.fill('')
      await expect(educationFilter).toHaveValue('masters')
      await expect(page.getByText(new RegExp(legacyMastersDallas.user.firstName, 'i'))).toBeVisible()
      await expect(page.getByText(new RegExp(mastersAustin.user.firstName, 'i'))).toBeVisible()
      await expect(page.getByText(new RegExp(bachelorsDallas.user.firstName, 'i'))).toHaveCount(0)

      await searchInput.fill('Dallas')
      await page.getByRole('button', { name: /Clear filters/i }).click()
      await expect(searchInput).toHaveValue('Dallas')
      await expect(educationFilter).toHaveValue('')
      await expect(page.getByText(new RegExp(legacyMastersDallas.user.firstName, 'i'))).toBeVisible()
      await expect(page.getByText(new RegExp(bachelorsDallas.user.firstName, 'i'))).toBeVisible()
      await expect(page.getByText(new RegExp(mastersAustin.user.firstName, 'i'))).toHaveCount(0)

      await searchInput.fill('')
      await educationFilter.selectOption('law')
      await expect(page.getByRole('heading', { name: /No Matching Profiles/i })).toBeVisible()
      await expect(page.getByText(/Try adjusting your search or filters/i)).toBeVisible()
      await expect(page.getByRole('button', { name: /Clear Search & Filters/i })).toBeVisible()
    })
  })
})
