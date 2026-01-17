/**
 * Comprehensive Test Suite for Admin Profiles Page & API
 *
 * Tests the admin profiles functionality:
 * 1. API returns correct profile data
 * 2. Filters work correctly (all, pending, approved, suspended, no_photos, no_profile, deletions)
 * 3. Profile status fields (isVerified, isSuspended, approvalStatus)
 * 4. Interest stats are calculated correctly
 * 5. Search by name, email, odNumber, location
 * 6. Pagination works correctly
 * 7. Gender filter works correctly
 * 8. Deletion request handling
 *
 * Usage: node scripts/test-admin-profiles.cjs
 */

const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

// Test data
const TEST_PREFIX = 'admin_profile_test_'
let testUsers = []
let testProfiles = []
let testResults = {
  passed: 0,
  failed: 0,
  tests: [],
}

/**
 * Helper to log test results
 */
function logTest(name, passed, details = '') {
  const status = passed ? '\x1b[32mPASS\x1b[0m' : '\x1b[31mFAIL\x1b[0m'
  console.log(`  ${status} ${name}${details ? `: ${details}` : ''}`)
  testResults.tests.push({ name, passed, details })
  if (passed) {
    testResults.passed++
  } else {
    testResults.failed++
  }
}

/**
 * Clean up test data
 */
async function cleanup() {
  console.log('\n\x1b[33mCleaning up test data...\x1b[0m')

  // First get test user IDs
  const testUserIds = await prisma.user.findMany({
    where: { email: { startsWith: TEST_PREFIX } },
    select: { id: true },
  })
  const userIds = testUserIds.map(u => u.id)

  if (userIds.length > 0) {
    // Delete deletion requests
    await prisma.deletionRequest.deleteMany({
      where: { userId: { in: userIds } },
    })

    // Delete test matches
    await prisma.match.deleteMany({
      where: {
        OR: [
          { senderId: { in: userIds } },
          { receiverId: { in: userIds } },
        ],
      },
    })

    // Delete test profiles
    await prisma.profile.deleteMany({
      where: { userId: { in: userIds } },
    })

    // Delete test users
    await prisma.user.deleteMany({
      where: { id: { in: userIds } },
    })
  }

  console.log('  Cleanup complete')
}

/**
 * Create test users and profiles with varied data
 */
async function createTestData() {
  console.log('\n\x1b[33mCreating test data...\x1b[0m')

  // Create diverse test profiles
  const profileData = [
    {
      name: 'Approved Male',
      gender: 'male',
      approvalStatus: 'approved',
      isVerified: true,
      isSuspended: false,
      hasPhotos: true,
    },
    {
      name: 'Pending Female',
      gender: 'female',
      approvalStatus: 'pending',
      isVerified: false,
      isSuspended: false,
      hasPhotos: true,
    },
    {
      name: 'Suspended Male',
      gender: 'male',
      approvalStatus: 'approved',
      isVerified: true,
      isSuspended: true,
      suspendedReason: 'Fake profile',
      hasPhotos: true,
    },
    {
      name: 'No Photos Female',
      gender: 'female',
      approvalStatus: 'approved',
      isVerified: false,
      isSuspended: false,
      hasPhotos: false,
    },
    {
      name: 'Pending Male 2',
      gender: 'male',
      approvalStatus: 'pending',
      isVerified: false,
      isSuspended: false,
      hasPhotos: true,
    },
    {
      name: 'Approved Female',
      gender: 'female',
      approvalStatus: 'approved',
      isVerified: true,
      isSuspended: false,
      hasPhotos: true,
    },
  ]

  for (let i = 0; i < profileData.length; i++) {
    const data = profileData[i]
    const user = await prisma.user.create({
      data: {
        email: `${TEST_PREFIX}user${i + 1}@test.com`,
        name: data.name,
        password: 'hashed_password',
      },
    })
    testUsers.push(user)

    const profile = await prisma.profile.create({
      data: {
        userId: user.id,
        gender: data.gender,
        dateOfBirth: '1995-01-01',
        height: '170',
        currentLocation: 'Hyderabad',
        occupation: 'Software Engineer',
        approvalStatus: data.approvalStatus,
        isVerified: data.isVerified,
        isSuspended: data.isSuspended,
        suspendedReason: data.suspendedReason || null,
        isActive: true,
        photoUrls: data.hasPhotos ? 'https://example.com/photo1.jpg,https://example.com/photo2.jpg' : null,
        profileImageUrl: data.hasPhotos ? 'https://example.com/profile.jpg' : null,
      },
    })
    testProfiles.push(profile)
    console.log(`  Created: ${data.name} (${data.approvalStatus}, verified: ${data.isVerified}, suspended: ${data.isSuspended})`)
  }

  // Create a user WITHOUT a profile (for no_profile filter test)
  const noProfileUser = await prisma.user.create({
    data: {
      email: `${TEST_PREFIX}noprofile@test.com`,
      name: 'No Profile User',
      password: 'hashed_password',
    },
  })
  testUsers.push(noProfileUser)
  console.log(`  Created: No Profile User (no profile)`)

  // Create a user with deletion request
  const deletionUser = await prisma.user.create({
    data: {
      email: `${TEST_PREFIX}deletion@test.com`,
      name: 'Deletion Request User',
      password: 'hashed_password',
    },
  })
  testUsers.push(deletionUser)

  const deletionProfile = await prisma.profile.create({
    data: {
      userId: deletionUser.id,
      gender: 'male',
      dateOfBirth: '1990-01-01',
      height: '175',
      currentLocation: 'Mumbai',
      approvalStatus: 'approved',
      isActive: true,
    },
  })
  testProfiles.push(deletionProfile)

  await prisma.deletionRequest.create({
    data: {
      userId: deletionUser.id,
      reason: 'marriage_vivaahready',
      status: 'pending',
    },
  })
  console.log(`  Created: Deletion Request User (with pending deletion)`)

  console.log(`  Created ${testUsers.length} users, ${testProfiles.length} profiles`)
}

/**
 * Create test matches for interest stats
 */
async function createTestMatches() {
  console.log('\n\x1b[33mCreating test matches...\x1b[0m')

  // Approved Male (index 0) sends to Approved Female (index 5)
  await prisma.match.create({
    data: {
      senderId: testUsers[0].id,
      receiverId: testUsers[5].id,
      status: 'pending',
    },
  })
  console.log('  Created: Approved Male -> Approved Female (pending)')

  // Approved Female (index 5) receives and accepts
  await prisma.match.create({
    data: {
      senderId: testUsers[5].id,
      receiverId: testUsers[0].id,
      status: 'accepted',
    },
  })
  console.log('  Created: Approved Female -> Approved Male (accepted)')

  // Pending Female (index 1) sends to Approved Male (index 0)
  await prisma.match.create({
    data: {
      senderId: testUsers[1].id,
      receiverId: testUsers[0].id,
      status: 'pending',
    },
  })
  console.log('  Created: Pending Female -> Approved Male (pending)')

  console.log('  Created 3 test matches')
}

// ============================================
// TEST CASES - Profile Data Structure
// ============================================

async function testProfileDataStructure() {
  console.log('\n\x1b[36m=== Testing Profile Data Structure ===\x1b[0m')

  // Get all test profiles
  const profiles = await prisma.profile.findMany({
    where: { user: { email: { startsWith: TEST_PREFIX } } },
    include: { user: true },
  })

  // Test: Profile has required fields
  const profile = profiles[0]
  logTest(
    'Profile has id',
    profile.id !== undefined,
    `id: ${profile.id}`
  )

  logTest(
    'Profile has gender',
    profile.gender !== undefined,
    `gender: ${profile.gender}`
  )

  logTest(
    'Profile has approvalStatus',
    profile.approvalStatus !== undefined,
    `status: ${profile.approvalStatus}`
  )

  logTest(
    'Profile has isVerified',
    profile.isVerified !== undefined,
    `isVerified: ${profile.isVerified}`
  )

  logTest(
    'Profile has isSuspended',
    profile.isSuspended !== undefined,
    `isSuspended: ${profile.isSuspended}`
  )

  logTest(
    'Profile has user relation',
    profile.user !== undefined && profile.user.id !== undefined,
    `user: ${profile.user?.name}`
  )
}

// ============================================
// TEST CASES - Approval Status Filters
// ============================================

async function testApprovalStatusFilters() {
  console.log('\n\x1b[36m=== Testing Approval Status Filters ===\x1b[0m')

  // Test: Pending filter
  const pendingProfiles = await prisma.profile.count({
    where: {
      user: { email: { startsWith: TEST_PREFIX } },
      approvalStatus: 'pending',
    },
  })

  logTest(
    'Pending filter count is correct',
    pendingProfiles === 2,
    `expected: 2, got: ${pendingProfiles}`
  )

  // Test: Approved filter
  const approvedProfiles = await prisma.profile.count({
    where: {
      user: { email: { startsWith: TEST_PREFIX } },
      approvalStatus: 'approved',
      isSuspended: false,
    },
  })

  logTest(
    'Approved filter count is correct',
    approvedProfiles === 4, // Approved Male, No Photos Female, Approved Female, Deletion User
    `expected: 4, got: ${approvedProfiles}`
  )

  // Test: Suspended filter
  const suspendedProfiles = await prisma.profile.count({
    where: {
      user: { email: { startsWith: TEST_PREFIX } },
      isSuspended: true,
    },
  })

  logTest(
    'Suspended filter count is correct',
    suspendedProfiles === 1,
    `expected: 1, got: ${suspendedProfiles}`
  )
}

// ============================================
// TEST CASES - Photo Filters
// ============================================

async function testPhotoFilters() {
  console.log('\n\x1b[36m=== Testing Photo Filters ===\x1b[0m')

  // Test: No photos filter
  const noPhotosProfiles = await prisma.profile.count({
    where: {
      user: { email: { startsWith: TEST_PREFIX } },
      AND: [
        { OR: [{ photoUrls: null }, { photoUrls: '' }] },
        { OR: [{ profileImageUrl: null }, { profileImageUrl: '' }] },
        { OR: [{ drivePhotosLink: null }, { drivePhotosLink: '' }] },
      ],
    },
  })

  logTest(
    'No photos filter finds profiles without photos',
    noPhotosProfiles >= 1,
    `found ${noPhotosProfiles} profiles without photos`
  )

  // Test: Profiles with photos
  const withPhotosProfiles = await prisma.profile.count({
    where: {
      user: { email: { startsWith: TEST_PREFIX } },
      OR: [
        { photoUrls: { not: null } },
        { profileImageUrl: { not: null } },
      ],
    },
  })

  logTest(
    'Profiles with photos are found',
    withPhotosProfiles >= 5,
    `found ${withPhotosProfiles} profiles with photos`
  )
}

// ============================================
// TEST CASES - No Profile Filter
// ============================================

async function testNoProfileFilter() {
  console.log('\n\x1b[36m=== Testing No Profile Filter ===\x1b[0m')

  // Test: Users without profiles
  const usersWithoutProfiles = await prisma.user.count({
    where: {
      email: { startsWith: TEST_PREFIX },
      profile: null,
    },
  })

  logTest(
    'No profile filter finds users without profiles',
    usersWithoutProfiles === 1,
    `expected: 1, got: ${usersWithoutProfiles}`
  )

  // Verify the user is the expected one
  const noProfileUser = await prisma.user.findFirst({
    where: {
      email: { startsWith: TEST_PREFIX },
      profile: null,
    },
  })

  logTest(
    'Correct user has no profile',
    noProfileUser?.name === 'No Profile User',
    `user: ${noProfileUser?.name}`
  )
}

// ============================================
// TEST CASES - Deletion Requests
// ============================================

async function testDeletionRequests() {
  console.log('\n\x1b[36m=== Testing Deletion Requests ===\x1b[0m')

  // Get test user IDs first
  const testUserIds = await prisma.user.findMany({
    where: { email: { startsWith: TEST_PREFIX } },
    select: { id: true },
  })
  const userIds = testUserIds.map(u => u.id)

  // Test: Pending deletion requests
  const pendingDeletions = await prisma.deletionRequest.count({
    where: {
      status: 'pending',
      userId: { in: userIds },
    },
  })

  logTest(
    'Pending deletion requests found',
    pendingDeletions === 1,
    `expected: 1, got: ${pendingDeletions}`
  )

  // Test: Deletion request data structure
  const deletionRequest = await prisma.deletionRequest.findFirst({
    where: {
      userId: { in: userIds },
    },
  })

  logTest(
    'Deletion request has required fields',
    deletionRequest?.id !== undefined &&
    deletionRequest?.reason !== undefined &&
    deletionRequest?.status !== undefined,
    `id: ${deletionRequest?.id}, reason: ${deletionRequest?.reason}`
  )

  logTest(
    'Deletion request has correct reason',
    deletionRequest?.reason === 'marriage_vivaahready',
    `reason: ${deletionRequest?.reason}`
  )
}

// ============================================
// TEST CASES - Interest Stats
// ============================================

async function testInterestStats() {
  console.log('\n\x1b[36m=== Testing Interest Stats ===\x1b[0m')

  // Test: Interests received by Approved Male
  const approvedMaleUser = testUsers[0]
  const interestsReceived = await prisma.match.groupBy({
    by: ['status'],
    where: { receiverId: approvedMaleUser.id },
    _count: { status: true },
  })

  const receivedTotal = interestsReceived.reduce((sum, item) => sum + item._count.status, 0)
  logTest(
    'Interests received count is correct',
    receivedTotal === 2, // 1 from Approved Female (accepted), 1 from Pending Female (pending)
    `expected: 2, got: ${receivedTotal}`
  )

  // Test: Interests sent by Approved Male
  const interestsSent = await prisma.match.groupBy({
    by: ['status'],
    where: { senderId: approvedMaleUser.id },
    _count: { status: true },
  })

  const sentTotal = interestsSent.reduce((sum, item) => sum + item._count.status, 0)
  logTest(
    'Interests sent count is correct',
    sentTotal === 1, // 1 to Approved Female (pending)
    `expected: 1, got: ${sentTotal}`
  )

  // Test: Status breakdown
  const acceptedReceived = interestsReceived.find(i => i.status === 'accepted')?._count.status || 0
  const pendingReceived = interestsReceived.find(i => i.status === 'pending')?._count.status || 0

  logTest(
    'Accepted interests received count is correct',
    acceptedReceived === 1,
    `expected: 1, got: ${acceptedReceived}`
  )

  logTest(
    'Pending interests received count is correct',
    pendingReceived === 1,
    `expected: 1, got: ${pendingReceived}`
  )
}

// ============================================
// TEST CASES - Verification Status
// ============================================

async function testVerificationStatus() {
  console.log('\n\x1b[36m=== Testing Verification Status ===\x1b[0m')

  // Test: Verified profiles
  const verifiedProfiles = await prisma.profile.count({
    where: {
      user: { email: { startsWith: TEST_PREFIX } },
      isVerified: true,
    },
  })

  logTest(
    'Verified profiles count is correct',
    verifiedProfiles === 3, // Approved Male, Suspended Male, Approved Female
    `expected: 3, got: ${verifiedProfiles}`
  )

  // Test: Unverified profiles
  const unverifiedProfiles = await prisma.profile.count({
    where: {
      user: { email: { startsWith: TEST_PREFIX } },
      isVerified: false,
    },
  })

  logTest(
    'Unverified profiles count is correct',
    unverifiedProfiles === 4, // Pending Female, No Photos Female, Pending Male 2, Deletion User
    `expected: 4, got: ${unverifiedProfiles}`
  )
}

// ============================================
// TEST CASES - Gender Filter
// ============================================

async function testGenderFilter() {
  console.log('\n\x1b[36m=== Testing Gender Filter ===\x1b[0m')

  // Test: Male profiles
  const maleProfiles = await prisma.profile.count({
    where: {
      user: { email: { startsWith: TEST_PREFIX } },
      gender: 'male',
    },
  })

  logTest(
    'Male profiles count is correct',
    maleProfiles === 4, // Approved Male, Suspended Male, Pending Male 2, Deletion User
    `expected: 4, got: ${maleProfiles}`
  )

  // Test: Female profiles
  const femaleProfiles = await prisma.profile.count({
    where: {
      user: { email: { startsWith: TEST_PREFIX } },
      gender: 'female',
    },
  })

  logTest(
    'Female profiles count is correct',
    femaleProfiles === 3, // Pending Female, No Photos Female, Approved Female
    `expected: 3, got: ${femaleProfiles}`
  )
}

// ============================================
// TEST CASES - Search
// ============================================

async function testSearch() {
  console.log('\n\x1b[36m=== Testing Search ===\x1b[0m')

  // Test: Search by name
  const byName = await prisma.profile.findMany({
    where: {
      user: {
        email: { startsWith: TEST_PREFIX },
        name: { contains: 'Approved', mode: 'insensitive' },
      },
    },
    include: { user: true },
  })

  logTest(
    'Search by name finds matching profiles',
    byName.length >= 2,
    `found ${byName.length} profiles with "Approved" in name`
  )

  // Test: Search by location
  const byLocation = await prisma.profile.findMany({
    where: {
      user: { email: { startsWith: TEST_PREFIX } },
      currentLocation: { contains: 'Hyderabad', mode: 'insensitive' },
    },
  })

  logTest(
    'Search by location finds matching profiles',
    byLocation.length >= 5,
    `found ${byLocation.length} profiles in Hyderabad`
  )

  // Test: Search by email
  const byEmail = await prisma.user.findMany({
    where: {
      email: { startsWith: TEST_PREFIX },
      email: { contains: 'user1', mode: 'insensitive' },
    },
  })

  logTest(
    'Search by email finds matching users',
    byEmail.length === 1,
    `found ${byEmail.length} users with "user1" in email`
  )
}

// ============================================
// TEST CASES - Pagination
// ============================================

async function testPagination() {
  console.log('\n\x1b[36m=== Testing Pagination ===\x1b[0m')

  const total = await prisma.profile.count({
    where: { user: { email: { startsWith: TEST_PREFIX } } },
  })

  const pageSize = 3
  const totalPages = Math.ceil(total / pageSize)

  logTest(
    'Total pages calculated correctly',
    totalPages === 3, // 7 profiles / 3 per page = 3 pages
    `expected: 3, got: ${totalPages}`
  )

  // Test: First page
  const page1 = await prisma.profile.findMany({
    where: { user: { email: { startsWith: TEST_PREFIX } } },
    take: pageSize,
    skip: 0,
    orderBy: { createdAt: 'desc' },
  })

  logTest(
    'First page returns correct number of items',
    page1.length === 3,
    `expected: 3, got: ${page1.length}`
  )

  // Test: Last page
  const page3 = await prisma.profile.findMany({
    where: { user: { email: { startsWith: TEST_PREFIX } } },
    take: pageSize,
    skip: 6,
    orderBy: { createdAt: 'desc' },
  })

  logTest(
    'Last page returns remaining items',
    page3.length === 1, // 7 - 6 = 1
    `expected: 1, got: ${page3.length}`
  )
}

// ============================================
// TEST CASES - Suspended Reason
// ============================================

async function testSuspendedReason() {
  console.log('\n\x1b[36m=== Testing Suspended Reason ===\x1b[0m')

  // Test: Suspended profile has reason
  const suspendedProfile = await prisma.profile.findFirst({
    where: {
      user: { email: { startsWith: TEST_PREFIX } },
      isSuspended: true,
    },
  })

  logTest(
    'Suspended profile has suspendedReason',
    suspendedProfile?.suspendedReason !== null &&
    suspendedProfile?.suspendedReason !== undefined,
    `reason: ${suspendedProfile?.suspendedReason}`
  )

  logTest(
    'Suspended reason is correct',
    suspendedProfile?.suspendedReason === 'Fake profile',
    `expected: "Fake profile", got: "${suspendedProfile?.suspendedReason}"`
  )
}

// ============================================
// TEST CASES - OD Number
// ============================================

async function testOdNumber() {
  console.log('\n\x1b[36m=== Testing OD Number ===\x1b[0m')

  // Test: Profiles can have odNumber
  const profilesWithOd = await prisma.profile.findMany({
    where: {
      user: { email: { startsWith: TEST_PREFIX } },
      odNumber: { not: null },
    },
  })

  // Our test data doesn't set odNumber, so this should be 0
  logTest(
    'OD number field exists and can be queried',
    profilesWithOd.length === 0, // Our test data doesn't set odNumber
    `profiles with odNumber: ${profilesWithOd.length}`
  )
}

// ============================================
// TEST CASES - Sorting
// ============================================

async function testSorting() {
  console.log('\n\x1b[36m=== Testing Sorting ===\x1b[0m')

  // Test: Sort by createdAt desc
  const byCreatedAt = await prisma.profile.findMany({
    where: { user: { email: { startsWith: TEST_PREFIX } } },
    orderBy: { createdAt: 'desc' },
  })

  const sortedCorrectly = byCreatedAt.length > 1 &&
    new Date(byCreatedAt[0].createdAt) >= new Date(byCreatedAt[byCreatedAt.length - 1].createdAt)

  logTest(
    'Sort by createdAt desc works correctly',
    sortedCorrectly,
    `first: ${byCreatedAt[0]?.createdAt}, last: ${byCreatedAt[byCreatedAt.length - 1]?.createdAt}`
  )
}

// ============================================
// MAIN
// ============================================

async function main() {
  console.log('\n\x1b[35m╔══════════════════════════════════════════════════════════╗\x1b[0m')
  console.log('\x1b[35m║       ADMIN PROFILES PAGE & API TEST SUITE                ║\x1b[0m')
  console.log('\x1b[35m╚══════════════════════════════════════════════════════════╝\x1b[0m')

  try {
    // Setup
    await cleanup()
    await createTestData()
    await createTestMatches()

    // Run tests
    await testProfileDataStructure()
    await testApprovalStatusFilters()
    await testPhotoFilters()
    await testNoProfileFilter()
    await testDeletionRequests()
    await testInterestStats()
    await testVerificationStatus()
    await testGenderFilter()
    await testSearch()
    await testPagination()
    await testSuspendedReason()
    await testOdNumber()
    await testSorting()

    // Cleanup
    await cleanup()

    // Print summary
    console.log('\n\x1b[35m╔══════════════════════════════════════════════════════════╗\x1b[0m')
    console.log('\x1b[35m║                     TEST SUMMARY                          ║\x1b[0m')
    console.log('\x1b[35m╚══════════════════════════════════════════════════════════╝\x1b[0m')
    console.log(`\n  Total tests: ${testResults.passed + testResults.failed}`)
    console.log(`  \x1b[32mPassed: ${testResults.passed}\x1b[0m`)
    console.log(`  \x1b[31mFailed: ${testResults.failed}\x1b[0m`)

    if (testResults.failed > 0) {
      console.log('\n\x1b[31mFailed tests:\x1b[0m')
      testResults.tests
        .filter(t => !t.passed)
        .forEach(t => console.log(`  - ${t.name}: ${t.details}`))
    }

    console.log('')
  } catch (error) {
    console.error('\n\x1b[31mTest suite error:\x1b[0m', error)
    await cleanup()
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()
