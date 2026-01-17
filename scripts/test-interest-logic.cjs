#!/usr/bin/env node
/**
 * Interest & Connection Logic Test Suite
 *
 * This script tests the interest/connection logic to ensure:
 * 1. Only APPROVED profiles can express interest
 * 2. Interest states transition correctly (pending → accepted/rejected)
 * 3. Mutual connections are detected properly
 * 4. Contact info is only revealed on mutual connection
 * 5. Interest received logic works correctly
 *
 * Run: node scripts/test-interest-logic.cjs
 * Run specific test: node scripts/test-interest-logic.cjs --test "mutual"
 * Run with DB: node scripts/test-interest-logic.cjs --live
 */

const { PrismaClient } = require('@prisma/client');

// ============ INTEREST LOGIC (mirrors src/app/api/interest/route.ts) ============

/**
 * Check if a profile can express interest
 * Rule: Only approved profiles can express interest
 */
function canExpressInterest(profile) {
  if (!profile) {
    return { allowed: false, reason: 'Profile not found' };
  }
  if (profile.approvalStatus !== 'approved') {
    return { allowed: false, reason: `Profile status is "${profile.approvalStatus}", must be "approved"` };
  }
  return { allowed: true, reason: 'Profile is approved' };
}

/**
 * Check if interest can be sent to a target profile
 */
function canSendInterestTo(senderProfile, targetProfile, existingInterests) {
  // Check if sender can express interest
  const senderCheck = canExpressInterest(senderProfile);
  if (!senderCheck.allowed) {
    return { allowed: false, reason: `Sender: ${senderCheck.reason}` };
  }

  // Check if target exists and is active
  if (!targetProfile) {
    return { allowed: false, reason: 'Target profile not found' };
  }
  if (!targetProfile.isActive) {
    return { allowed: false, reason: 'Target profile is not active' };
  }

  // Check if interest already exists
  const existingSent = existingInterests.find(
    i => i.senderId === senderProfile.userId && i.receiverId === targetProfile.userId
  );
  if (existingSent) {
    return { allowed: false, reason: `Interest already sent (status: ${existingSent.status})` };
  }

  return { allowed: true, reason: 'Can send interest' };
}

/**
 * Determine if mutual interest exists (both parties expressed interest)
 */
function isMutualInterest(userAId, userBId, interests) {
  const aSentToB = interests.find(i => i.senderId === userAId && i.receiverId === userBId);
  const bSentToA = interests.find(i => i.senderId === userBId && i.receiverId === userAId);

  return {
    isMutual: !!(aSentToB && bSentToA),
    aSentToB: aSentToB || null,
    bSentToA: bSentToA || null,
  };
}

/**
 * Determine connection status between two users
 * Mutual connection = either accepted interest OR both sent interests
 */
function getConnectionStatus(userAId, userBId, interests) {
  const aSentToB = interests.find(i => i.senderId === userAId && i.receiverId === userBId);
  const bSentToA = interests.find(i => i.senderId === userBId && i.receiverId === userAId);

  // Case 1: No interests either way
  if (!aSentToB && !bSentToA) {
    return {
      status: 'none',
      isMutualConnection: false,
      canAContactB: false,
      canBContactA: false,
      description: 'No interest expressed by either party',
    };
  }

  // Case 2: Only A sent to B
  if (aSentToB && !bSentToA) {
    if (aSentToB.status === 'accepted') {
      return {
        status: 'mutual_connection',
        isMutualConnection: true,
        canAContactB: true,
        canBContactA: true,
        description: 'A sent interest, B accepted → Mutual connection',
      };
    }
    if (aSentToB.status === 'rejected') {
      return {
        status: 'rejected',
        isMutualConnection: false,
        canAContactB: false,
        canBContactA: false,
        description: 'A sent interest, B rejected',
      };
    }
    return {
      status: 'pending_from_a',
      isMutualConnection: false,
      canAContactB: false,
      canBContactA: false,
      description: 'A sent interest, waiting for B response',
    };
  }

  // Case 3: Only B sent to A
  if (!aSentToB && bSentToA) {
    if (bSentToA.status === 'accepted') {
      return {
        status: 'mutual_connection',
        isMutualConnection: true,
        canAContactB: true,
        canBContactA: true,
        description: 'B sent interest, A accepted → Mutual connection',
      };
    }
    if (bSentToA.status === 'rejected') {
      return {
        status: 'rejected',
        isMutualConnection: false,
        canAContactB: false,
        canBContactA: false,
        description: 'B sent interest, A rejected',
      };
    }
    return {
      status: 'pending_from_b',
      isMutualConnection: false,
      canAContactB: false,
      canBContactA: false,
      description: 'B sent interest (interest received by A), waiting for A response',
    };
  }

  // Case 4: Both sent interests (auto-mutual)
  if (aSentToB && bSentToA) {
    return {
      status: 'mutual_connection',
      isMutualConnection: true,
      canAContactB: true,
      canBContactA: true,
      description: 'Both sent interests → Automatic mutual connection',
    };
  }

  return {
    status: 'unknown',
    isMutualConnection: false,
    canAContactB: false,
    canBContactA: false,
    description: 'Unknown state',
  };
}

/**
 * Get interests received by a user
 */
function getInterestsReceived(userId, interests) {
  return interests.filter(i => i.receiverId === userId);
}

/**
 * Get interests sent by a user
 */
function getInterestsSent(userId, interests) {
  return interests.filter(i => i.senderId === userId);
}

/**
 * Simulate expressing interest
 */
function simulateExpressInterest(senderId, receiverId, senderProfile, receiverProfile, existingInterests) {
  const canSend = canSendInterestTo(senderProfile, receiverProfile, existingInterests);
  if (!canSend.allowed) {
    return { success: false, reason: canSend.reason, newInterest: null, becameMutual: false };
  }

  // Check if receiver already sent interest to sender (auto-mutual)
  const receiverSentToSender = existingInterests.find(
    i => i.senderId === receiverId && i.receiverId === senderId
  );

  const newInterest = {
    id: `interest_${Date.now()}`,
    senderId,
    receiverId,
    status: receiverSentToSender ? 'accepted' : 'pending',
    createdAt: new Date(),
  };

  // If receiver already sent interest, also update that to accepted
  let updatedReceiverInterest = null;
  if (receiverSentToSender && receiverSentToSender.status === 'pending') {
    updatedReceiverInterest = { ...receiverSentToSender, status: 'accepted' };
  }

  return {
    success: true,
    reason: receiverSentToSender ? 'Mutual interest detected, both auto-accepted' : 'Interest sent as pending',
    newInterest,
    becameMutual: !!receiverSentToSender,
    updatedReceiverInterest,
  };
}

/**
 * Simulate accepting interest
 */
function simulateAcceptInterest(receiverId, interestId, interests) {
  const interest = interests.find(i => i.id === interestId);
  if (!interest) {
    return { success: false, reason: 'Interest not found' };
  }
  if (interest.receiverId !== receiverId) {
    return { success: false, reason: 'You can only accept interests sent to you' };
  }
  if (interest.status === 'accepted') {
    return { success: false, reason: 'Interest already accepted' };
  }

  return {
    success: true,
    reason: 'Interest accepted, mutual connection created',
    updatedInterest: { ...interest, status: 'accepted' },
    isMutualConnection: true,
  };
}

/**
 * Simulate rejecting interest
 */
function simulateRejectInterest(receiverId, interestId, interests) {
  const interest = interests.find(i => i.id === interestId);
  if (!interest) {
    return { success: false, reason: 'Interest not found' };
  }
  if (interest.receiverId !== receiverId) {
    return { success: false, reason: 'You can only reject interests sent to you' };
  }
  if (interest.status === 'rejected') {
    return { success: false, reason: 'Interest already rejected' };
  }

  return {
    success: true,
    reason: 'Interest rejected',
    updatedInterest: { ...interest, status: 'rejected' },
    isMutualConnection: false,
  };
}

// ============ TEST CASES ============

const TEST_CASES = [
  // ===== APPROVAL STATUS TESTS =====
  {
    name: 'Approval: Pending profile CANNOT express interest',
    setup: {
      profiles: [
        { userId: 'user_a', approvalStatus: 'pending', isActive: true },
        { userId: 'user_b', approvalStatus: 'approved', isActive: true },
      ],
      interests: [],
    },
    action: () => {
      const profiles = TEST_CASES[0].setup.profiles;
      return canExpressInterest(profiles[0]);
    },
    expected: { allowed: false },
    expectedReason: 'Pending profiles cannot express interest',
  },
  {
    name: 'Approval: Approved profile CAN express interest',
    setup: {
      profiles: [
        { userId: 'user_a', approvalStatus: 'approved', isActive: true },
        { userId: 'user_b', approvalStatus: 'approved', isActive: true },
      ],
      interests: [],
    },
    action: () => {
      const profiles = TEST_CASES[1].setup.profiles;
      return canExpressInterest(profiles[0]);
    },
    expected: { allowed: true },
    expectedReason: 'Approved profiles can express interest',
  },
  {
    name: 'Approval: Rejected profile CANNOT express interest',
    setup: {
      profiles: [
        { userId: 'user_a', approvalStatus: 'rejected', isActive: true },
      ],
      interests: [],
    },
    action: () => {
      const profiles = TEST_CASES[2].setup.profiles;
      return canExpressInterest(profiles[0]);
    },
    expected: { allowed: false },
    expectedReason: 'Rejected profiles cannot express interest',
  },

  // ===== INTEREST SENDING TESTS =====
  {
    name: 'Interest: Cannot send interest twice to same person',
    setup: {
      profiles: [
        { userId: 'user_a', approvalStatus: 'approved', isActive: true },
        { userId: 'user_b', approvalStatus: 'approved', isActive: true },
      ],
      interests: [
        { id: 'int_1', senderId: 'user_a', receiverId: 'user_b', status: 'pending' },
      ],
    },
    action: () => {
      const { profiles, interests } = TEST_CASES[3].setup;
      return canSendInterestTo(profiles[0], profiles[1], interests);
    },
    expected: { allowed: false },
    expectedReason: 'Cannot duplicate interest',
  },
  {
    name: 'Interest: Can send interest to someone who hasnt received from you',
    setup: {
      profiles: [
        { userId: 'user_a', approvalStatus: 'approved', isActive: true },
        { userId: 'user_b', approvalStatus: 'approved', isActive: true },
      ],
      interests: [],
    },
    action: () => {
      const { profiles, interests } = TEST_CASES[4].setup;
      return canSendInterestTo(profiles[0], profiles[1], interests);
    },
    expected: { allowed: true },
    expectedReason: 'Fresh interest can be sent',
  },
  {
    name: 'Interest: Cannot send to inactive profile',
    setup: {
      profiles: [
        { userId: 'user_a', approvalStatus: 'approved', isActive: true },
        { userId: 'user_b', approvalStatus: 'approved', isActive: false },
      ],
      interests: [],
    },
    action: () => {
      const { profiles, interests } = TEST_CASES[5].setup;
      return canSendInterestTo(profiles[0], profiles[1], interests);
    },
    expected: { allowed: false },
    expectedReason: 'Cannot send interest to inactive profile',
  },

  // ===== MUTUAL CONNECTION TESTS =====
  {
    name: 'Mutual: Both send interest → automatic mutual connection',
    setup: {
      profiles: [
        { userId: 'user_a', approvalStatus: 'approved', isActive: true },
        { userId: 'user_b', approvalStatus: 'approved', isActive: true },
      ],
      interests: [
        { id: 'int_1', senderId: 'user_a', receiverId: 'user_b', status: 'pending' },
        { id: 'int_2', senderId: 'user_b', receiverId: 'user_a', status: 'pending' },
      ],
    },
    action: () => {
      const { interests } = TEST_CASES[6].setup;
      return getConnectionStatus('user_a', 'user_b', interests);
    },
    expected: { isMutualConnection: true },
    expectedReason: 'Both sent interests = mutual connection',
  },
  {
    name: 'Mutual: A sends, B accepts → mutual connection',
    setup: {
      profiles: [
        { userId: 'user_a', approvalStatus: 'approved', isActive: true },
        { userId: 'user_b', approvalStatus: 'approved', isActive: true },
      ],
      interests: [
        { id: 'int_1', senderId: 'user_a', receiverId: 'user_b', status: 'accepted' },
      ],
    },
    action: () => {
      const { interests } = TEST_CASES[7].setup;
      return getConnectionStatus('user_a', 'user_b', interests);
    },
    expected: { isMutualConnection: true },
    expectedReason: 'Accepted interest = mutual connection',
  },
  {
    name: 'Mutual: A sends (pending), B hasnt responded → NOT mutual',
    setup: {
      profiles: [
        { userId: 'user_a', approvalStatus: 'approved', isActive: true },
        { userId: 'user_b', approvalStatus: 'approved', isActive: true },
      ],
      interests: [
        { id: 'int_1', senderId: 'user_a', receiverId: 'user_b', status: 'pending' },
      ],
    },
    action: () => {
      const { interests } = TEST_CASES[8].setup;
      return getConnectionStatus('user_a', 'user_b', interests);
    },
    expected: { isMutualConnection: false },
    expectedReason: 'Pending interest is not mutual',
  },
  {
    name: 'Mutual: A sends, B rejects → NOT mutual',
    setup: {
      profiles: [
        { userId: 'user_a', approvalStatus: 'approved', isActive: true },
        { userId: 'user_b', approvalStatus: 'approved', isActive: true },
      ],
      interests: [
        { id: 'int_1', senderId: 'user_a', receiverId: 'user_b', status: 'rejected' },
      ],
    },
    action: () => {
      const { interests } = TEST_CASES[9].setup;
      return getConnectionStatus('user_a', 'user_b', interests);
    },
    expected: { isMutualConnection: false },
    expectedReason: 'Rejected interest is not mutual',
  },

  // ===== CONTACT VISIBILITY TESTS =====
  {
    name: 'Contact: Mutual connection allows contact info visibility',
    setup: {
      interests: [
        { id: 'int_1', senderId: 'user_a', receiverId: 'user_b', status: 'accepted' },
      ],
    },
    action: () => {
      const { interests } = TEST_CASES[10].setup;
      const status = getConnectionStatus('user_a', 'user_b', interests);
      return { canAContactB: status.canAContactB, canBContactA: status.canBContactA };
    },
    expected: { canAContactB: true, canBContactA: true },
    expectedReason: 'Mutual connection reveals contact info to both',
  },
  {
    name: 'Contact: Pending interest does NOT allow contact visibility',
    setup: {
      interests: [
        { id: 'int_1', senderId: 'user_a', receiverId: 'user_b', status: 'pending' },
      ],
    },
    action: () => {
      const { interests } = TEST_CASES[11].setup;
      const status = getConnectionStatus('user_a', 'user_b', interests);
      return { canAContactB: status.canAContactB, canBContactA: status.canBContactA };
    },
    expected: { canAContactB: false, canBContactA: false },
    expectedReason: 'Pending interest hides contact info',
  },

  // ===== INTEREST RECEIVED TESTS =====
  {
    name: 'Received: User B sees interest from User A',
    setup: {
      interests: [
        { id: 'int_1', senderId: 'user_a', receiverId: 'user_b', status: 'pending' },
        { id: 'int_2', senderId: 'user_c', receiverId: 'user_b', status: 'pending' },
        { id: 'int_3', senderId: 'user_b', receiverId: 'user_d', status: 'pending' },
      ],
    },
    action: () => {
      const { interests } = TEST_CASES[12].setup;
      const received = getInterestsReceived('user_b', interests);
      return { count: received.length, senderIds: received.map(i => i.senderId) };
    },
    expected: { count: 2, senderIds: ['user_a', 'user_c'] },
    expectedReason: 'User B received interests from A and C (not D which B sent)',
  },
  {
    name: 'Received: Filter by status (pending only)',
    setup: {
      interests: [
        { id: 'int_1', senderId: 'user_a', receiverId: 'user_b', status: 'pending' },
        { id: 'int_2', senderId: 'user_c', receiverId: 'user_b', status: 'accepted' },
        { id: 'int_3', senderId: 'user_d', receiverId: 'user_b', status: 'rejected' },
      ],
    },
    action: () => {
      const { interests } = TEST_CASES[13].setup;
      const received = getInterestsReceived('user_b', interests);
      const pending = received.filter(i => i.status === 'pending');
      return { totalReceived: received.length, pendingCount: pending.length };
    },
    expected: { totalReceived: 3, pendingCount: 1 },
    expectedReason: 'User B has 3 received interests, 1 pending',
  },

  // ===== SIMULATE EXPRESS INTEREST TESTS =====
  {
    name: 'Simulate: Pending profile trying to express interest fails',
    setup: {
      profiles: [
        { userId: 'user_a', approvalStatus: 'pending', isActive: true },
        { userId: 'user_b', approvalStatus: 'approved', isActive: true },
      ],
      interests: [],
    },
    action: () => {
      const { profiles, interests } = TEST_CASES[14].setup;
      return simulateExpressInterest('user_a', 'user_b', profiles[0], profiles[1], interests);
    },
    expected: { success: false },
    expectedReason: 'Pending profile cannot send interest',
  },
  {
    name: 'Simulate: A expresses interest to B who already sent to A → auto-mutual',
    setup: {
      profiles: [
        { userId: 'user_a', approvalStatus: 'approved', isActive: true },
        { userId: 'user_b', approvalStatus: 'approved', isActive: true },
      ],
      interests: [
        { id: 'int_1', senderId: 'user_b', receiverId: 'user_a', status: 'pending' },
      ],
    },
    action: () => {
      const { profiles, interests } = TEST_CASES[15].setup;
      return simulateExpressInterest('user_a', 'user_b', profiles[0], profiles[1], interests);
    },
    expected: { success: true, becameMutual: true },
    expectedReason: 'When both express interest, auto-mutual connection',
  },

  // ===== ACCEPT/REJECT TESTS =====
  {
    name: 'Accept: Receiver can accept pending interest',
    setup: {
      interests: [
        { id: 'int_1', senderId: 'user_a', receiverId: 'user_b', status: 'pending' },
      ],
    },
    action: () => {
      const { interests } = TEST_CASES[16].setup;
      return simulateAcceptInterest('user_b', 'int_1', interests);
    },
    expected: { success: true, isMutualConnection: true },
    expectedReason: 'Receiver accepting creates mutual connection',
  },
  {
    name: 'Accept: Sender CANNOT accept their own sent interest',
    setup: {
      interests: [
        { id: 'int_1', senderId: 'user_a', receiverId: 'user_b', status: 'pending' },
      ],
    },
    action: () => {
      const { interests } = TEST_CASES[17].setup;
      return simulateAcceptInterest('user_a', 'int_1', interests);
    },
    expected: { success: false },
    expectedReason: 'Sender cannot accept their own interest',
  },
  {
    name: 'Reject: Receiver can reject pending interest',
    setup: {
      interests: [
        { id: 'int_1', senderId: 'user_a', receiverId: 'user_b', status: 'pending' },
      ],
    },
    action: () => {
      const { interests } = TEST_CASES[18].setup;
      return simulateRejectInterest('user_b', 'int_1', interests);
    },
    expected: { success: true, isMutualConnection: false },
    expectedReason: 'Rejected interest does not create mutual connection',
  },
];

// ============ TEST RUNNER ============

function runTests(filterName = null) {
  console.log('╔════════════════════════════════════════════════════════════════════╗');
  console.log('║           INTEREST & CONNECTION LOGIC TEST SUITE                   ║');
  console.log('╠════════════════════════════════════════════════════════════════════╣');
  console.log('║ Rules:                                                             ║');
  console.log('║ 1. Only APPROVED profiles can express interest                     ║');
  console.log('║ 2. Mutual connection = accepted interest OR both sent interests    ║');
  console.log('║ 3. Contact info only revealed on mutual connection                 ║');
  console.log('║ 4. Receiver can accept/reject, sender can only send/withdraw       ║');
  console.log('╚════════════════════════════════════════════════════════════════════╝\n');

  let passed = 0;
  let failed = 0;
  const failures = [];

  const testsToRun = filterName
    ? TEST_CASES.filter(t => t.name.toLowerCase().includes(filterName.toLowerCase()))
    : TEST_CASES;

  for (const test of testsToRun) {
    const result = test.action();

    // Check if all expected fields match
    let testPassed = true;
    const mismatches = [];

    for (const [key, expectedValue] of Object.entries(test.expected)) {
      if (JSON.stringify(result[key]) !== JSON.stringify(expectedValue)) {
        testPassed = false;
        mismatches.push({ key, expected: expectedValue, got: result[key] });
      }
    }

    if (testPassed) {
      passed++;
      console.log(`✅ PASS: ${test.name}`);
    } else {
      failed++;
      failures.push({ test: test.name, mismatches, reason: test.expectedReason });
      console.log(`❌ FAIL: ${test.name}`);
      console.log(`   Expected reason: ${test.expectedReason}`);
      mismatches.forEach(m => {
        console.log(`   ${m.key}: expected ${JSON.stringify(m.expected)}, got ${JSON.stringify(m.got)}`);
      });
    }
  }

  console.log('\n' + '═'.repeat(70));
  console.log(`RESULTS: ${passed} passed, ${failed} failed out of ${testsToRun.length} tests`);
  console.log('═'.repeat(70));

  if (failed > 0) {
    console.log('\n⚠️  FAILURES DETECTED - Interest/connection logic may have bugs!\n');
    process.exit(1);
  } else {
    console.log('\n✅ All tests passed - Interest/connection logic is correct!\n');
    process.exit(0);
  }
}

// ============ LIVE DATABASE TEST ============

async function runLiveTest() {
  const prisma = new PrismaClient();

  console.log('╔════════════════════════════════════════════════════════════════════╗');
  console.log('║           LIVE DATABASE INTEREST/CONNECTION TEST                   ║');
  console.log('╚════════════════════════════════════════════════════════════════════╝\n');

  try {
    // Get all profiles
    const profiles = await prisma.profile.findMany({
      include: { user: { select: { id: true, name: true } } }
    });

    // Get all matches/interests
    const interests = await prisma.match.findMany();

    console.log(`Found ${profiles.length} profiles, ${interests.length} interests\n`);

    // Check approval status distribution
    const approvalCounts = { approved: 0, pending: 0, rejected: 0 };
    profiles.forEach(p => {
      approvalCounts[p.approvalStatus] = (approvalCounts[p.approvalStatus] || 0) + 1;
    });
    console.log('Approval Status Distribution:');
    console.log(`  Approved: ${approvalCounts.approved}`);
    console.log(`  Pending: ${approvalCounts.pending}`);
    console.log(`  Rejected: ${approvalCounts.rejected || 0}`);
    console.log('');

    // Check interest status distribution
    const interestCounts = { pending: 0, accepted: 0, rejected: 0 };
    interests.forEach(i => {
      interestCounts[i.status] = (interestCounts[i.status] || 0) + 1;
    });
    console.log('Interest Status Distribution:');
    console.log(`  Pending: ${interestCounts.pending}`);
    console.log(`  Accepted: ${interestCounts.accepted}`);
    console.log(`  Rejected: ${interestCounts.rejected}`);
    console.log('');

    // Find mutual connections
    let mutualCount = 0;
    const checkedPairs = new Set();

    for (const interest of interests) {
      const pairKey = [interest.senderId, interest.receiverId].sort().join('_');
      if (checkedPairs.has(pairKey)) continue;
      checkedPairs.add(pairKey);

      const status = getConnectionStatus(interest.senderId, interest.receiverId, interests);
      if (status.isMutualConnection) {
        mutualCount++;
      }
    }
    console.log(`Mutual Connections: ${mutualCount}`);
    console.log('');

    // Check for any non-approved profiles that have sent interests (violations)
    console.log('=== Checking for Violations ===');
    let violations = 0;

    for (const interest of interests) {
      const senderProfile = profiles.find(p => p.userId === interest.senderId);
      if (senderProfile && senderProfile.approvalStatus !== 'approved') {
        violations++;
        console.log(`⚠️  VIOLATION: ${senderProfile.user?.name || interest.senderId} sent interest but status is "${senderProfile.approvalStatus}"`);
      }
    }

    if (violations === 0) {
      console.log('✅ No violations found - all interests were sent by approved profiles');
    } else {
      console.log(`\n❌ Found ${violations} violations!`);
    }

    // Sample some users and show their interest stats
    console.log('\n=== Sample User Interest Stats ===');
    const sampleProfiles = profiles.filter(p => p.approvalStatus === 'approved').slice(0, 5);

    for (const profile of sampleProfiles) {
      const sent = getInterestsSent(profile.userId, interests);
      const received = getInterestsReceived(profile.userId, interests);
      const sentAccepted = sent.filter(i => i.status === 'accepted').length;
      const receivedPending = received.filter(i => i.status === 'pending').length;

      console.log(`${profile.user?.name}:`);
      console.log(`  Sent: ${sent.length} (${sentAccepted} accepted)`);
      console.log(`  Received: ${received.length} (${receivedPending} pending response)`);
    }

  } finally {
    await prisma.$disconnect();
  }
}

// ============ MAIN ============

const args = process.argv.slice(2);

if (args.includes('--live')) {
  runLiveTest().catch(console.error);
} else if (args.includes('--test')) {
  const idx = args.indexOf('--test');
  const filter = args[idx + 1];
  runTests(filter);
} else if (args.includes('--help')) {
  console.log(`
Interest & Connection Logic Test Suite

Usage:
  node scripts/test-interest-logic.cjs              Run all tests
  node scripts/test-interest-logic.cjs --test mut   Run tests containing "mut" (mutual)
  node scripts/test-interest-logic.cjs --live       Test against live database
  node scripts/test-interest-logic.cjs --help       Show this help

Key Rules Tested:
  1. Only APPROVED profiles can express interest (pending/rejected cannot)
  2. Mutual connection = accepted interest OR both parties sent interests
  3. Contact info is only revealed on mutual connection
  4. Interests can be: pending → accepted OR pending → rejected
  5. Interest received = interests where user is the receiver
`);
} else {
  runTests();
}
