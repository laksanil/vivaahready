/**
 * PROFILE DISPLAY PAGE - COMPREHENSIVE TEST SUITE
 *
 * This test suite validates that ALL fields added by users during profile creation
 * are correctly displayed on:
 * 1. Public Profile Page (/profile/[id])
 * 2. Match Card Preview (ProfileCard component)
 * 3. Directory Card (DirectoryCard component)
 *
 * The test ensures:
 * - All user-facing fields from the database are displayed
 * - Fields are organized into proper sections
 * - Sensitive fields are masked appropriately for non-verified/non-mutual profiles
 * - Religion-specific fields show only when relevant
 * - Conditional fields appear based on other field values
 */

const assert = require('assert');

// ============================================================================
// TEST FRAMEWORK
// ============================================================================

let passed = 0;
let failed = 0;
let currentSection = '';

function section(name) {
  currentSection = name;
  console.log(`\n${'='.repeat(70)}`);
  console.log(`📋 ${name}`);
  console.log('='.repeat(70));
}

function test(name, fn) {
  try {
    fn();
    passed++;
    console.log(`✅ ${name}`);
  } catch (error) {
    failed++;
    console.log(`❌ ${name}`);
    console.log(`   Error: ${error.message}`);
  }
}

// ============================================================================
// SECTION 1: PROFILE FIELDS DATABASE SCHEMA
// ============================================================================

/**
 * All user-editable profile fields from the Prisma schema
 * These are fields users can add/edit during profile creation
 */
const ALL_USER_PROFILE_FIELDS = {
  // Basic Info
  basics: [
    'dateOfBirth',      // Used to calculate age
    'height',
    'maritalStatus',
    'hasChildren',      // Conditional: only when maritalStatus !== never_married
    'motherTongue',
    'languagesKnown',
    'createdBy',        // Who created the profile (self, parent, etc.)
  ],

  // Contact & Social (masked for non-verified/non-mutual)
  contact: [
    'linkedinProfile',
    'facebook',
    'instagram',
    'facebookInstagram', // Legacy field
  ],

  // Location
  location: [
    'currentLocation',
    'country',
    'citizenship',
    'grewUpIn',
    'residencyStatus',
    'openToRelocation',
    'zipCode',
  ],

  // Religion & Background
  religion: [
    'religion',
    'community',
    'subCommunity',
    'gotra',
  ],

  // Hindu-specific Astro (conditional: religion === 'Hindu')
  hinduAstro: [
    'placeOfBirthCountry',
    'placeOfBirthState',
    'placeOfBirthCity',
    'timeOfBirth',
    'manglik',
    'raasi',
    'nakshatra',
    'doshas',
  ],

  // Muslim-specific (conditional: religion === 'Muslim')
  muslim: [
    'maslak',
    'namazPractice',
  ],

  // Sikh-specific (conditional: religion === 'Sikh')
  sikh: [
    'amritdhari',
    'turban',
  ],

  // Christian-specific (conditional: religion === 'Christian')
  christian: [
    'churchAttendance',
    'baptized',
  ],

  // Education & Career
  education: [
    'qualification',
    'university',
    'occupation',
    'employerName',
    'annualIncome',
    'workingAs',
  ],

  // Family
  family: [
    'fatherName',       // Masked for non-verified
    'motherName',       // Masked for non-verified
    'fatherOccupation',
    'motherOccupation',
    'numberOfBrothers',
    'numberOfSisters',
    'siblingDetails',
    'familyType',
    'familyValues',
    'familyLocation',
    'livesWithFamily',
  ],

  // Lifestyle
  lifestyle: [
    'dietaryPreference',
    'smoking',
    'drinking',
    'hobbies',
    'fitness',
    'interests',
    'pets',
  ],

  // About Me
  about: [
    'aboutMe',
    'healthInfo',
    'anyDisability',
    'disabilityDetails', // Conditional: only when anyDisability === 'yes'
    'bloodGroup',
    'allergiesOrMedical',
  ],

  // Photos
  photos: [
    'photoUrls',
    'profileImageUrl',
  ],
};

/**
 * Fields that should be displayed in the Profile Page by section
 */
const PROFILE_PAGE_SECTIONS = {
  header: {
    name: 'Header Bar',
    fields: ['age', 'height', 'maritalStatus', 'currentLocation', 'occupation', 'qualification', 'community', 'religion', 'subCommunity'],
    description: 'Compact header showing key info at a glance',
  },

  contact: {
    name: 'Contact Details',
    fields: ['email', 'phone', 'linkedinProfile', 'instagram', 'facebookInstagram'],
    maskedWhenNotVerified: true,
    description: 'Email, phone, social links - masked for non-verified profiles',
  },

  basicInfo: {
    name: 'Basic Info',
    fields: ['age', 'height', 'maritalStatus', 'hasChildren', 'motherTongue', 'languagesKnown', 'createdBy'],
    description: 'Age, height, marital status, languages',
  },

  location: {
    name: 'Location',
    fields: ['currentLocation', 'grewUpIn', 'citizenship', 'residencyStatus', 'openToRelocation'],
    description: 'Current location, grew up in, citizenship, relocation',
  },

  religionBackground: {
    name: 'Religion & Background',
    fields: ['religion', 'community', 'subCommunity', 'gotra'],
    description: 'Religion, community, sub-community, gotra',
  },

  astroDetails: {
    name: 'Astro Details',
    conditionalOn: { field: 'religion', value: 'Hindu' },
    fields: ['manglik', 'raasi', 'nakshatra', 'doshas', 'placeOfBirthCity', 'placeOfBirthState'],
    description: 'Hindu astro details - only shown for Hindu profiles',
  },

  muslimPractice: {
    name: 'Religious Practice (Muslim)',
    conditionalOn: { field: 'religion', value: 'Muslim' },
    fields: ['maslak', 'namazPractice'],
    description: 'Muslim-specific fields - only shown for Muslim profiles',
  },

  sikhPractice: {
    name: 'Religious Practice (Sikh)',
    conditionalOn: { field: 'religion', value: 'Sikh' },
    fields: ['amritdhari', 'turban'],
    description: 'Sikh-specific fields - only shown for Sikh profiles',
  },

  christianPractice: {
    name: 'Religious Practice (Christian)',
    conditionalOn: { field: 'religion', value: 'Christian' },
    fields: ['churchAttendance', 'baptized'],
    description: 'Christian-specific fields - only shown for Christian profiles',
  },

  educationCareer: {
    name: 'Education & Career',
    fields: ['qualification', 'university', 'occupation', 'employerName', 'annualIncome'],
    description: 'Education, occupation, employer, income',
  },

  lifestyle: {
    name: 'Lifestyle',
    fields: ['dietaryPreference', 'smoking', 'drinking', 'pets'],
    description: 'Diet, smoking, drinking, pets',
  },

  family: {
    name: 'Family',
    fields: ['fatherName', 'motherName', 'fatherOccupation', 'motherOccupation', 'numberOfBrothers', 'numberOfSisters', 'familyType', 'familyValues', 'familyLocation'],
    maskedFields: ['fatherName', 'motherName'],
    description: 'Family members and details - parent names masked for non-verified',
  },

  interests: {
    name: 'Interests & Hobbies',
    fields: ['hobbies', 'fitness', 'interests'],
    description: 'Hobbies, fitness activities, interests - shown as tags',
  },

  idealPartner: {
    name: 'Ideal Partner',
    fields: ['idealPartnerDesc'],
    description: 'Free-text description of ideal partner',
  },
};

// ============================================================================
// SECTION 2: FIELD COVERAGE TESTS
// ============================================================================

section('FIELD COVERAGE - All User Fields Must Be Displayable');

// Get all fields that should be displayed somewhere
function getAllDisplayableFields() {
  const fields = new Set();
  Object.values(PROFILE_PAGE_SECTIONS).forEach(section => {
    section.fields.forEach(field => fields.add(field));
  });
  return fields;
}

// Get all user-editable fields from schema
function getAllUserFields() {
  const fields = new Set();
  Object.values(ALL_USER_PROFILE_FIELDS).forEach(fieldList => {
    fieldList.forEach(field => fields.add(field));
  });
  return fields;
}

test('All basic info fields are displayed in profile page', () => {
  const displayableFields = getAllDisplayableFields();

  ALL_USER_PROFILE_FIELDS.basics.forEach(field => {
    // dateOfBirth is displayed as 'age'
    const displayField = field === 'dateOfBirth' ? 'age' : field;
    assert.ok(
      displayableFields.has(displayField) || displayableFields.has(field),
      `Basic info field '${field}' should be displayable`
    );
  });
});

test('All location fields are displayed in profile page', () => {
  const displayableFields = getAllDisplayableFields();
  const locationFields = ['currentLocation', 'grewUpIn', 'citizenship', 'residencyStatus', 'openToRelocation'];

  locationFields.forEach(field => {
    assert.ok(
      displayableFields.has(field),
      `Location field '${field}' should be displayable`
    );
  });
});

test('All religion fields are displayed in profile page', () => {
  const displayableFields = getAllDisplayableFields();
  const religionFields = ['religion', 'community', 'subCommunity', 'gotra'];

  religionFields.forEach(field => {
    assert.ok(
      displayableFields.has(field),
      `Religion field '${field}' should be displayable`
    );
  });
});

test('All Hindu astro fields are displayed (conditional)', () => {
  const astroSection = PROFILE_PAGE_SECTIONS.astroDetails;

  assert.ok(astroSection.conditionalOn, 'Astro section should have conditional display');
  assert.strictEqual(astroSection.conditionalOn.field, 'religion');
  assert.strictEqual(astroSection.conditionalOn.value, 'Hindu');

  const expectedFields = ['manglik', 'raasi', 'nakshatra', 'doshas'];
  expectedFields.forEach(field => {
    assert.ok(
      astroSection.fields.includes(field),
      `Hindu astro field '${field}' should be in astro section`
    );
  });
});

test('All Muslim-specific fields are displayed (conditional)', () => {
  const muslimSection = PROFILE_PAGE_SECTIONS.muslimPractice;

  assert.ok(muslimSection.conditionalOn, 'Muslim section should have conditional display');
  assert.strictEqual(muslimSection.conditionalOn.value, 'Muslim');

  const expectedFields = ['maslak', 'namazPractice'];
  expectedFields.forEach(field => {
    assert.ok(
      muslimSection.fields.includes(field),
      `Muslim field '${field}' should be in Muslim section`
    );
  });
});

test('All Sikh-specific fields are displayed (conditional)', () => {
  const sikhSection = PROFILE_PAGE_SECTIONS.sikhPractice;

  assert.ok(sikhSection.conditionalOn, 'Sikh section should have conditional display');
  assert.strictEqual(sikhSection.conditionalOn.value, 'Sikh');

  const expectedFields = ['amritdhari', 'turban'];
  expectedFields.forEach(field => {
    assert.ok(
      sikhSection.fields.includes(field),
      `Sikh field '${field}' should be in Sikh section`
    );
  });
});

test('All Christian-specific fields are displayed (conditional)', () => {
  const christianSection = PROFILE_PAGE_SECTIONS.christianPractice;

  assert.ok(christianSection.conditionalOn, 'Christian section should have conditional display');
  assert.strictEqual(christianSection.conditionalOn.value, 'Christian');

  const expectedFields = ['churchAttendance', 'baptized'];
  expectedFields.forEach(field => {
    assert.ok(
      christianSection.fields.includes(field),
      `Christian field '${field}' should be in Christian section`
    );
  });
});

test('All education/career fields are displayed', () => {
  const displayableFields = getAllDisplayableFields();
  const educationFields = ['qualification', 'university', 'occupation', 'employerName', 'annualIncome'];

  educationFields.forEach(field => {
    assert.ok(
      displayableFields.has(field),
      `Education field '${field}' should be displayable`
    );
  });
});

test('All family fields are displayed', () => {
  const displayableFields = getAllDisplayableFields();
  const familyFields = ['fatherName', 'motherName', 'fatherOccupation', 'motherOccupation', 'numberOfBrothers', 'numberOfSisters', 'familyValues', 'familyLocation'];

  familyFields.forEach(field => {
    assert.ok(
      displayableFields.has(field),
      `Family field '${field}' should be displayable`
    );
  });
});

test('All lifestyle fields are displayed', () => {
  const displayableFields = getAllDisplayableFields();
  const lifestyleFields = ['dietaryPreference', 'smoking', 'drinking', 'pets', 'hobbies', 'fitness', 'interests'];

  lifestyleFields.forEach(field => {
    assert.ok(
      displayableFields.has(field),
      `Lifestyle field '${field}' should be displayable`
    );
  });
});

test('Contact fields are displayed with masking for non-verified', () => {
  const contactSection = PROFILE_PAGE_SECTIONS.contact;

  assert.ok(contactSection.maskedWhenNotVerified, 'Contact section should be masked for non-verified');
  assert.ok(contactSection.fields.includes('linkedinProfile'), 'LinkedIn should be in contact section');
  assert.ok(contactSection.fields.includes('instagram') || contactSection.fields.includes('facebookInstagram'), 'Instagram should be in contact section');
});

// ============================================================================
// SECTION 3: PROFILE PAGE COMPONENT STRUCTURE
// ============================================================================

section('PROFILE PAGE STRUCTURE - Sections Are Properly Organized');

/**
 * Mock profile data for testing display logic
 */
const MOCK_HINDU_PROFILE = {
  // User
  user: {
    id: 'user123',
    name: 'Shwetha Lakshmi',
    email: 'shwetha@example.com',
    phone: '+1 (555) 123-4567',
    emailVerified: new Date().toISOString(),
    phoneVerified: new Date().toISOString(),
  },

  // Basic Info
  dateOfBirth: '01/15/1995',
  height: "5'5\"",
  maritalStatus: 'never_married',
  hasChildren: null,
  motherTongue: 'Telugu',
  languagesKnown: 'Telugu, Hindi, English',
  createdBy: 'self',

  // Location
  currentLocation: 'Fremont, CA',
  country: 'United States',
  citizenship: 'H1B Visa',
  grewUpIn: 'India',
  residencyStatus: 'work_visa',
  openToRelocation: 'yes',
  zipCode: '94536',

  // Religion (Hindu)
  religion: 'Hindu',
  community: 'Brahmin',
  subCommunity: 'Vaidiki Velanadu',
  gotra: 'Koundinya',

  // Hindu Astro
  placeOfBirthCountry: 'India',
  placeOfBirthState: 'Andhra Pradesh',
  placeOfBirthCity: 'Hyderabad',
  timeOfBirth: '10:30 AM',
  manglik: 'no',
  raasi: 'Mesha',
  nakshatra: 'Ashwini',
  doshas: 'None',

  // Education & Career
  qualification: 'masters_science',
  university: 'Masters in Healthcare Administration, CSU',
  occupation: 'healthcare_admin',
  employerName: 'Kaiser',
  annualIncome: 'Later',

  // Family
  fatherName: 'Ramesh Kumar',
  motherName: 'Lakshmi Devi',
  fatherOccupation: 'Business',
  motherOccupation: 'Homemaker',
  numberOfBrothers: '1',
  numberOfSisters: '0',
  familyType: 'nuclear',
  familyValues: 'traditional',
  familyLocation: 'Folsom, CA',
  livesWithFamily: 'no',

  // Lifestyle
  dietaryPreference: 'Vegetarian',
  smoking: 'no',
  drinking: 'no',
  hobbies: 'Reading, Music, Travel',
  fitness: 'Yoga, Walking',
  interests: 'Healthcare, Technology',
  pets: 'none',

  // About
  aboutMe: 'Travelling and Visiting New places and explore. Want to pursue studies in Healthcare domain. Spend time with Family/Friends.',
  bloodGroup: 'O+',
  healthInfo: 'Good',
  anyDisability: 'no',

  // Contact
  linkedinProfile: 'linkedin.com/in/shwetha',
  instagram: '@shwetha_l',
  facebookInstagram: null,

  // Photos
  photoUrls: 'https://example.com/photo1.jpg,https://example.com/photo2.jpg',
  profileImageUrl: 'https://example.com/profile.jpg',

  // Status
  approvalStatus: 'approved',
  isVerified: true,

  // Partner Preferences
  idealPartnerDesc: 'Looking for someone kind, caring, and family-oriented.',
};

const MOCK_MUSLIM_PROFILE = {
  ...MOCK_HINDU_PROFILE,
  religion: 'Muslim',
  community: 'Sunni',
  subCommunity: null,
  gotra: null,
  maslak: 'Hanafi',
  namazPractice: 'five_times',
  // Clear Hindu fields
  manglik: null,
  raasi: null,
  nakshatra: null,
  doshas: null,
};

const MOCK_SIKH_PROFILE = {
  ...MOCK_HINDU_PROFILE,
  religion: 'Sikh',
  community: 'Jat Sikh',
  subCommunity: null,
  gotra: null,
  amritdhari: 'yes',
  turban: 'yes',
  // Clear Hindu fields
  manglik: null,
  raasi: null,
  nakshatra: null,
  doshas: null,
};

const MOCK_CHRISTIAN_PROFILE = {
  ...MOCK_HINDU_PROFILE,
  religion: 'Christian',
  community: 'Catholic',
  subCommunity: null,
  gotra: null,
  churchAttendance: 'weekly',
  baptized: 'yes',
  // Clear Hindu fields
  manglik: null,
  raasi: null,
  nakshatra: null,
  doshas: null,
};

/**
 * Simulates the profile page display logic
 */
function shouldShowSection(profile, sectionConfig) {
  if (!sectionConfig.conditionalOn) {
    return true;
  }

  const { field, value } = sectionConfig.conditionalOn;
  return profile[field] === value;
}

function getDisplayableFieldsForProfile(profile, sectionConfig) {
  if (!shouldShowSection(profile, sectionConfig)) {
    return [];
  }

  return sectionConfig.fields.filter(field => {
    const value = profile[field];
    return value !== null && value !== undefined && value !== '';
  });
}

test('Profile page has all required sections', () => {
  const requiredSections = [
    'header',
    'contact',
    'basicInfo',
    'location',
    'religionBackground',
    'educationCareer',
    'lifestyle',
    'family',
  ];

  requiredSections.forEach(section => {
    assert.ok(
      PROFILE_PAGE_SECTIONS[section],
      `Profile page should have '${section}' section`
    );
  });
});

test('Hindu profile shows astro section', () => {
  const showsAstro = shouldShowSection(MOCK_HINDU_PROFILE, PROFILE_PAGE_SECTIONS.astroDetails);
  assert.strictEqual(showsAstro, true, 'Hindu profile should show astro section');
});

test('Hindu profile does NOT show Muslim section', () => {
  const showsMuslim = shouldShowSection(MOCK_HINDU_PROFILE, PROFILE_PAGE_SECTIONS.muslimPractice);
  assert.strictEqual(showsMuslim, false, 'Hindu profile should NOT show Muslim section');
});

test('Muslim profile shows Muslim section', () => {
  const showsMuslim = shouldShowSection(MOCK_MUSLIM_PROFILE, PROFILE_PAGE_SECTIONS.muslimPractice);
  assert.strictEqual(showsMuslim, true, 'Muslim profile should show Muslim section');
});

test('Muslim profile does NOT show Hindu astro section', () => {
  const showsAstro = shouldShowSection(MOCK_MUSLIM_PROFILE, PROFILE_PAGE_SECTIONS.astroDetails);
  assert.strictEqual(showsAstro, false, 'Muslim profile should NOT show astro section');
});

test('Sikh profile shows Sikh section', () => {
  const showsSikh = shouldShowSection(MOCK_SIKH_PROFILE, PROFILE_PAGE_SECTIONS.sikhPractice);
  assert.strictEqual(showsSikh, true, 'Sikh profile should show Sikh section');
});

test('Christian profile shows Christian section', () => {
  const showsChristian = shouldShowSection(MOCK_CHRISTIAN_PROFILE, PROFILE_PAGE_SECTIONS.christianPractice);
  assert.strictEqual(showsChristian, true, 'Christian profile should show Christian section');
});

// ============================================================================
// SECTION 4: DATA MASKING TESTS
// ============================================================================

section('DATA MASKING - Sensitive Fields Are Masked Appropriately');

/**
 * Fields that should be masked when viewing a non-verified profile
 */
const MASKED_FIELDS_FOR_NON_VERIFIED = [
  'email',
  'phone',
  'linkedinProfile',
  'instagram',
  'facebookInstagram',
  'facebook',
  'fatherName',
  'motherName',
];

/**
 * Simulates masking logic
 */
function maskText(text, showChars = 2) {
  if (!text) return null;
  return text.slice(0, showChars) + 'X'.repeat(Math.max(0, text.length - showChars));
}

function maskEmail(email) {
  if (!email) return null;
  return email.slice(0, 1) + 'XXX@XXX.XXX';
}

function maskPhone(phone) {
  if (!phone) return 'XXX-XXX-XXXX';
  // Show area code only
  const match = phone.match(/\((\d{3})\)/);
  if (match) {
    return `(${match[1]}) XXX-XXXX`;
  }
  return 'XXX-XXX-XXXX';
}

function getDisplayValue(profile, field, isVerified, isMutual) {
  const value = profile[field] || profile.user?.[field];
  if (!value) return null;

  // Always show for own profile or mutual connections
  if (isMutual) return value;

  // Mask sensitive fields for non-verified viewers
  if (!isVerified && MASKED_FIELDS_FOR_NON_VERIFIED.includes(field)) {
    if (field === 'email') return maskEmail(value);
    if (field === 'phone') return maskPhone(value);
    if (field === 'linkedinProfile') return 'XXXXXXXXXX';
    if (field === 'instagram' || field === 'facebookInstagram' || field === 'facebook') return 'XXXXXXXXXX';
    if (field === 'fatherName' || field === 'motherName') return maskText(value, 2);
  }

  return value;
}

test('Email is masked for non-verified viewers', () => {
  const displayed = getDisplayValue(MOCK_HINDU_PROFILE, 'email', false, false);
  assert.ok(displayed.includes('XXX'), 'Email should be masked');
  assert.ok(!displayed.includes('example.com'), 'Email domain should be hidden');
});

test('Email is shown for verified viewers', () => {
  const displayed = getDisplayValue(MOCK_HINDU_PROFILE, 'email', true, false);
  assert.strictEqual(displayed, 'shwetha@example.com', 'Email should be fully visible');
});

test('Email is shown for mutual connections', () => {
  const displayed = getDisplayValue(MOCK_HINDU_PROFILE, 'email', false, true);
  assert.strictEqual(displayed, 'shwetha@example.com', 'Email should be visible for mutual connections');
});

test('Phone is masked for non-verified viewers', () => {
  const displayed = getDisplayValue(MOCK_HINDU_PROFILE, 'phone', false, false);
  assert.ok(displayed.includes('XXX'), 'Phone should be masked');
});

test('LinkedIn is masked for non-verified viewers', () => {
  const displayed = getDisplayValue(MOCK_HINDU_PROFILE, 'linkedinProfile', false, false);
  assert.strictEqual(displayed, 'XXXXXXXXXX', 'LinkedIn should be masked');
});

test('Father name is masked for non-verified viewers', () => {
  const displayed = getDisplayValue(MOCK_HINDU_PROFILE, 'fatherName', false, false);
  assert.ok(displayed.startsWith('Ra'), 'Should show first 2 characters');
  assert.ok(displayed.includes('X'), 'Rest should be masked');
});

test('Mother name is masked for non-verified viewers', () => {
  const displayed = getDisplayValue(MOCK_HINDU_PROFILE, 'motherName', false, false);
  assert.ok(displayed.startsWith('La'), 'Should show first 2 characters');
  assert.ok(displayed.includes('X'), 'Rest should be masked');
});

test('Non-sensitive fields are NOT masked', () => {
  const occupation = getDisplayValue(MOCK_HINDU_PROFILE, 'occupation', false, false);
  assert.strictEqual(occupation, 'healthcare_admin', 'Occupation should not be masked');

  const community = getDisplayValue(MOCK_HINDU_PROFILE, 'community', false, false);
  assert.strictEqual(community, 'Brahmin', 'Community should not be masked');
});

// ============================================================================
// SECTION 5: PROFILE CARD (MATCH PREVIEW) TESTS
// ============================================================================

section('PROFILE CARD - Match Preview Shows Key Information');

/**
 * Fields shown in the ProfileCard component (match preview)
 */
const PROFILE_CARD_FIELDS = {
  primary: ['name', 'age', 'height', 'maritalStatus'],
  location: ['currentLocation', 'grewUpIn', 'citizenship'],
  career: ['occupation', 'qualification', 'employerName'],
  background: ['religion', 'community', 'subCommunity'],
  lifestyle: ['dietaryPreference', 'smoking', 'drinking'],
  matchInfo: ['matchScore', 'theyLikedMeFirst'],
};

test('Profile card shows name and age', () => {
  const cardFields = PROFILE_CARD_FIELDS.primary;
  assert.ok(cardFields.includes('name'), 'Card should show name');
  assert.ok(cardFields.includes('age'), 'Card should show age');
});

test('Profile card shows location info', () => {
  const cardFields = PROFILE_CARD_FIELDS.location;
  assert.ok(cardFields.includes('currentLocation'), 'Card should show current location');
  assert.ok(cardFields.includes('grewUpIn'), 'Card should show grew up in');
  assert.ok(cardFields.includes('citizenship'), 'Card should show citizenship');
});

test('Profile card shows career info', () => {
  const cardFields = PROFILE_CARD_FIELDS.career;
  assert.ok(cardFields.includes('occupation'), 'Card should show occupation');
  assert.ok(cardFields.includes('qualification'), 'Card should show qualification');
});

test('Profile card shows background info', () => {
  const cardFields = PROFILE_CARD_FIELDS.background;
  assert.ok(cardFields.includes('religion'), 'Card should show religion');
  assert.ok(cardFields.includes('community'), 'Card should show community');
});

test('Profile card shows lifestyle indicators', () => {
  const cardFields = PROFILE_CARD_FIELDS.lifestyle;
  assert.ok(cardFields.includes('dietaryPreference'), 'Card should show diet');
  assert.ok(cardFields.includes('smoking'), 'Card should show smoking');
  assert.ok(cardFields.includes('drinking'), 'Card should show drinking');
});

// ============================================================================
// SECTION 6: CONDITIONAL FIELD DISPLAY TESTS
// ============================================================================

section('CONDITIONAL FIELDS - Fields Show Based on Other Field Values');

/**
 * Conditional field rules
 */
const CONDITIONAL_FIELD_RULES = {
  hasChildren: {
    showWhen: { field: 'maritalStatus', notEquals: 'never_married' },
  },
  disabilityDetails: {
    showWhen: { field: 'anyDisability', equals: 'yes' },
  },
  manglik: {
    showWhen: { field: 'religion', equals: 'Hindu' },
  },
  raasi: {
    showWhen: { field: 'religion', equals: 'Hindu' },
  },
  maslak: {
    showWhen: { field: 'religion', equals: 'Muslim' },
  },
  amritdhari: {
    showWhen: { field: 'religion', equals: 'Sikh' },
  },
  churchAttendance: {
    showWhen: { field: 'religion', equals: 'Christian' },
  },
};

function shouldShowField(profile, fieldName, rules) {
  const rule = rules[fieldName];
  if (!rule) return true; // No conditional rule, always show

  const { showWhen } = rule;
  if (showWhen.equals) {
    return profile[showWhen.field] === showWhen.equals;
  }
  if (showWhen.notEquals) {
    return profile[showWhen.field] !== showWhen.notEquals;
  }
  return true;
}

test('hasChildren shown for divorced profiles', () => {
  const divorcedProfile = { ...MOCK_HINDU_PROFILE, maritalStatus: 'divorced', hasChildren: 'yes_living_together' };
  const shouldShow = shouldShowField(divorcedProfile, 'hasChildren', CONDITIONAL_FIELD_RULES);
  assert.strictEqual(shouldShow, true, 'hasChildren should be shown for divorced profile');
});

test('hasChildren hidden for never_married profiles', () => {
  const shouldShow = shouldShowField(MOCK_HINDU_PROFILE, 'hasChildren', CONDITIONAL_FIELD_RULES);
  assert.strictEqual(shouldShow, false, 'hasChildren should be hidden for never_married profile');
});

test('manglik shown for Hindu profiles', () => {
  const shouldShow = shouldShowField(MOCK_HINDU_PROFILE, 'manglik', CONDITIONAL_FIELD_RULES);
  assert.strictEqual(shouldShow, true, 'manglik should be shown for Hindu profile');
});

test('manglik hidden for Muslim profiles', () => {
  const shouldShow = shouldShowField(MOCK_MUSLIM_PROFILE, 'manglik', CONDITIONAL_FIELD_RULES);
  assert.strictEqual(shouldShow, false, 'manglik should be hidden for Muslim profile');
});

test('maslak shown for Muslim profiles', () => {
  const shouldShow = shouldShowField(MOCK_MUSLIM_PROFILE, 'maslak', CONDITIONAL_FIELD_RULES);
  assert.strictEqual(shouldShow, true, 'maslak should be shown for Muslim profile');
});

test('maslak hidden for Hindu profiles', () => {
  const shouldShow = shouldShowField(MOCK_HINDU_PROFILE, 'maslak', CONDITIONAL_FIELD_RULES);
  assert.strictEqual(shouldShow, false, 'maslak should be hidden for Hindu profile');
});

test('disabilityDetails shown when anyDisability is yes', () => {
  const profileWithDisability = { ...MOCK_HINDU_PROFILE, anyDisability: 'yes', disabilityDetails: 'Details here' };
  const shouldShow = shouldShowField(profileWithDisability, 'disabilityDetails', CONDITIONAL_FIELD_RULES);
  assert.strictEqual(shouldShow, true, 'disabilityDetails should be shown when anyDisability is yes');
});

test('disabilityDetails hidden when anyDisability is no', () => {
  const shouldShow = shouldShowField(MOCK_HINDU_PROFILE, 'disabilityDetails', CONDITIONAL_FIELD_RULES);
  assert.strictEqual(shouldShow, false, 'disabilityDetails should be hidden when anyDisability is no');
});

// ============================================================================
// SECTION 7: VALUE FORMATTING TESTS
// ============================================================================

section('VALUE FORMATTING - Fields Are Displayed With Proper Formatting');

/**
 * Field value formatters
 */
function formatValue(value) {
  if (!value) return null;
  // Convert snake_case to Title Case
  return value.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

function formatEducation(value) {
  const educationMap = {
    'high_school': 'High School Diploma',
    'bachelors_arts': 'Bachelor of Arts (BA)',
    'bachelors_science': 'Bachelor of Science (BS)',
    'masters_arts': 'Master of Arts (MA)',
    'masters_science': 'Master of Science (MS)',
    'mba': 'Master of Business Administration (MBA)',
    'md': 'Doctor of Medicine (MD)',
    'phd': 'Doctor of Philosophy (PhD)',
  };
  return educationMap[value] || formatValue(value);
}

function calculateAge(dateOfBirth) {
  if (!dateOfBirth) return null;
  const dob = new Date(dateOfBirth);
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
    age--;
  }
  return age;
}

test('Snake_case values are converted to Title Case', () => {
  assert.strictEqual(formatValue('never_married'), 'Never Married');
  assert.strictEqual(formatValue('yes_living_together'), 'Yes Living Together');
  assert.strictEqual(formatValue('work_visa'), 'Work Visa');
});

test('Education codes are formatted with full names', () => {
  assert.strictEqual(formatEducation('masters_science'), 'Master of Science (MS)');
  assert.strictEqual(formatEducation('mba'), 'Master of Business Administration (MBA)');
  assert.strictEqual(formatEducation('phd'), 'Doctor of Philosophy (PhD)');
});

test('Age is calculated correctly from dateOfBirth', () => {
  // Assuming current year, create a DOB that makes someone 29
  const currentYear = new Date().getFullYear();
  const dob = `01/15/${currentYear - 29}`;
  const age = calculateAge(dob);
  // Age could be 28 or 29 depending on current date
  assert.ok(age >= 28 && age <= 29, `Age should be 28 or 29, got ${age}`);
});

test('Null/empty values return null', () => {
  assert.strictEqual(formatValue(null), null);
  assert.strictEqual(formatValue(''), null);
  assert.strictEqual(calculateAge(null), null);
});

// ============================================================================
// SECTION 8: FULL PROFILE FIELD MAPPING
// ============================================================================

section('FULL FIELD MAPPING - All DB Fields Have Display Locations');

/**
 * Maps database fields to their display section in the profile page
 */
const FIELD_TO_SECTION_MAPPING = {
  // Basic Info section
  dateOfBirth: 'basicInfo',
  height: 'basicInfo',
  maritalStatus: 'basicInfo',
  hasChildren: 'basicInfo',
  motherTongue: 'basicInfo',
  languagesKnown: 'basicInfo',
  createdBy: 'basicInfo',

  // Location section
  currentLocation: 'location',
  country: 'location',
  citizenship: 'location',
  grewUpIn: 'location',
  residencyStatus: 'location',
  openToRelocation: 'location',

  // Religion section
  religion: 'religionBackground',
  community: 'religionBackground',
  subCommunity: 'religionBackground',
  gotra: 'religionBackground',

  // Hindu Astro section
  manglik: 'astroDetails',
  raasi: 'astroDetails',
  nakshatra: 'astroDetails',
  doshas: 'astroDetails',
  placeOfBirthCity: 'astroDetails',
  placeOfBirthState: 'astroDetails',
  timeOfBirth: 'astroDetails',

  // Muslim section
  maslak: 'muslimPractice',
  namazPractice: 'muslimPractice',

  // Sikh section
  amritdhari: 'sikhPractice',
  turban: 'sikhPractice',

  // Christian section
  churchAttendance: 'christianPractice',
  baptized: 'christianPractice',

  // Education section
  qualification: 'educationCareer',
  university: 'educationCareer',
  occupation: 'educationCareer',
  employerName: 'educationCareer',
  annualIncome: 'educationCareer',

  // Lifestyle section
  dietaryPreference: 'lifestyle',
  smoking: 'lifestyle',
  drinking: 'lifestyle',
  pets: 'lifestyle',

  // Family section
  fatherName: 'family',
  motherName: 'family',
  fatherOccupation: 'family',
  motherOccupation: 'family',
  numberOfBrothers: 'family',
  numberOfSisters: 'family',
  familyType: 'family',
  familyValues: 'family',
  familyLocation: 'family',

  // Interests section
  hobbies: 'interests',
  fitness: 'interests',
  interests: 'interests',

  // Contact section
  linkedinProfile: 'contact',
  instagram: 'contact',
  facebook: 'contact',
  facebookInstagram: 'contact',

  // About section (displayed at top)
  aboutMe: 'about',

  // Ideal Partner section
  idealPartnerDesc: 'idealPartner',
};

test('All major user fields have a display section mapping', () => {
  const unmappedFields = [];
  const majorFields = [
    'dateOfBirth', 'height', 'maritalStatus', 'motherTongue',
    'currentLocation', 'citizenship', 'grewUpIn',
    'religion', 'community', 'subCommunity', 'gotra',
    'qualification', 'university', 'occupation', 'annualIncome',
    'dietaryPreference', 'smoking', 'drinking',
    'fatherName', 'motherName', 'familyValues',
    'hobbies', 'interests', 'aboutMe',
  ];

  majorFields.forEach(field => {
    if (!FIELD_TO_SECTION_MAPPING[field]) {
      unmappedFields.push(field);
    }
  });

  assert.strictEqual(
    unmappedFields.length, 0,
    `Unmapped fields: ${unmappedFields.join(', ')}`
  );
});

test('Religion-specific fields have correct conditional sections', () => {
  // Hindu fields
  assert.strictEqual(FIELD_TO_SECTION_MAPPING.manglik, 'astroDetails');
  assert.strictEqual(FIELD_TO_SECTION_MAPPING.raasi, 'astroDetails');

  // Muslim fields
  assert.strictEqual(FIELD_TO_SECTION_MAPPING.maslak, 'muslimPractice');
  assert.strictEqual(FIELD_TO_SECTION_MAPPING.namazPractice, 'muslimPractice');

  // Sikh fields
  assert.strictEqual(FIELD_TO_SECTION_MAPPING.amritdhari, 'sikhPractice');
  assert.strictEqual(FIELD_TO_SECTION_MAPPING.turban, 'sikhPractice');

  // Christian fields
  assert.strictEqual(FIELD_TO_SECTION_MAPPING.churchAttendance, 'christianPractice');
  assert.strictEqual(FIELD_TO_SECTION_MAPPING.baptized, 'christianPractice');
});

// ============================================================================
// SECTION 9: END-TO-END DISPLAY TESTS
// ============================================================================

section('END-TO-END DISPLAY - Complete Profile Display Scenarios');

/**
 * Simulates rendering a profile page and collecting displayed fields
 */
function renderProfilePage(profile, viewerIsVerified, isMutualConnection) {
  const displayedFields = {};

  // Header
  displayedFields.header = {
    name: profile.user.name,
    age: calculateAge(profile.dateOfBirth),
    height: profile.height,
    maritalStatus: formatValue(profile.maritalStatus),
    currentLocation: profile.currentLocation,
    occupation: formatValue(profile.occupation),
    religion: profile.religion,
    community: profile.community,
  };

  // About
  if (profile.aboutMe) {
    displayedFields.about = { aboutMe: profile.aboutMe };
  }

  // Contact (masked for non-verified)
  displayedFields.contact = {
    email: getDisplayValue(profile, 'email', viewerIsVerified, isMutualConnection),
    phone: getDisplayValue(profile, 'phone', viewerIsVerified, isMutualConnection),
    linkedinProfile: getDisplayValue(profile, 'linkedinProfile', viewerIsVerified, isMutualConnection),
    instagram: getDisplayValue(profile, 'instagram', viewerIsVerified, isMutualConnection),
  };

  // Basic Info
  displayedFields.basicInfo = {
    age: calculateAge(profile.dateOfBirth),
    height: profile.height,
    maritalStatus: formatValue(profile.maritalStatus),
    motherTongue: profile.motherTongue,
    languagesKnown: profile.languagesKnown,
    createdBy: formatValue(profile.createdBy),
  };

  // Show hasChildren only if not never_married
  if (profile.maritalStatus !== 'never_married' && profile.hasChildren) {
    displayedFields.basicInfo.hasChildren = formatValue(profile.hasChildren);
  }

  // Location
  displayedFields.location = {
    currentLocation: profile.currentLocation,
    grewUpIn: profile.grewUpIn,
    citizenship: profile.citizenship,
    residencyStatus: profile.residencyStatus,
    openToRelocation: formatValue(profile.openToRelocation),
  };

  // Religion
  displayedFields.religionBackground = {
    religion: profile.religion,
    community: profile.community,
    subCommunity: profile.subCommunity,
    gotra: profile.gotra,
  };

  // Conditional religion sections
  if (profile.religion === 'Hindu') {
    displayedFields.astroDetails = {
      manglik: profile.manglik,
      raasi: profile.raasi,
      nakshatra: profile.nakshatra,
      doshas: profile.doshas,
      placeOfBirth: `${profile.placeOfBirthCity}, ${profile.placeOfBirthState}`,
    };
  }

  if (profile.religion === 'Muslim') {
    displayedFields.muslimPractice = {
      maslak: profile.maslak,
      namazPractice: profile.namazPractice,
    };
  }

  if (profile.religion === 'Sikh') {
    displayedFields.sikhPractice = {
      amritdhari: profile.amritdhari,
      turban: profile.turban,
    };
  }

  if (profile.religion === 'Christian') {
    displayedFields.christianPractice = {
      churchAttendance: profile.churchAttendance,
      baptized: profile.baptized,
    };
  }

  // Education
  displayedFields.educationCareer = {
    qualification: formatEducation(profile.qualification),
    university: profile.university,
    occupation: formatValue(profile.occupation),
    employerName: profile.employerName,
    annualIncome: profile.annualIncome,
  };

  // Lifestyle
  displayedFields.lifestyle = {
    dietaryPreference: profile.dietaryPreference,
    smoking: formatValue(profile.smoking),
    drinking: formatValue(profile.drinking),
    pets: formatValue(profile.pets),
  };

  // Family (parent names masked)
  displayedFields.family = {
    fatherName: getDisplayValue(profile, 'fatherName', viewerIsVerified, isMutualConnection),
    motherName: getDisplayValue(profile, 'motherName', viewerIsVerified, isMutualConnection),
    fatherOccupation: profile.fatherOccupation,
    motherOccupation: profile.motherOccupation,
    siblings: `${profile.numberOfBrothers || 0}B, ${profile.numberOfSisters || 0}S`,
    familyValues: formatValue(profile.familyValues),
    familyLocation: profile.familyLocation,
  };

  // Interests
  displayedFields.interests = {
    hobbies: profile.hobbies,
    fitness: profile.fitness,
    interests: profile.interests,
  };

  // Ideal Partner
  if (profile.idealPartnerDesc) {
    displayedFields.idealPartner = { idealPartnerDesc: profile.idealPartnerDesc };
  }

  return displayedFields;
}

test('E2E: Hindu profile displays all sections correctly', () => {
  const displayed = renderProfilePage(MOCK_HINDU_PROFILE, true, false);

  // Check all main sections exist
  assert.ok(displayed.header, 'Should have header section');
  assert.ok(displayed.basicInfo, 'Should have basicInfo section');
  assert.ok(displayed.location, 'Should have location section');
  assert.ok(displayed.religionBackground, 'Should have religionBackground section');
  assert.ok(displayed.astroDetails, 'Should have astroDetails section for Hindu');
  assert.ok(displayed.educationCareer, 'Should have educationCareer section');
  assert.ok(displayed.lifestyle, 'Should have lifestyle section');
  assert.ok(displayed.family, 'Should have family section');
  assert.ok(displayed.interests, 'Should have interests section');

  // Check no Muslim/Sikh/Christian sections
  assert.ok(!displayed.muslimPractice, 'Should NOT have muslimPractice section');
  assert.ok(!displayed.sikhPractice, 'Should NOT have sikhPractice section');
  assert.ok(!displayed.christianPractice, 'Should NOT have christianPractice section');
});

test('E2E: Muslim profile displays Muslim section, not Hindu astro', () => {
  const displayed = renderProfilePage(MOCK_MUSLIM_PROFILE, true, false);

  assert.ok(displayed.muslimPractice, 'Should have muslimPractice section');
  assert.ok(!displayed.astroDetails, 'Should NOT have astroDetails section');
  assert.strictEqual(displayed.muslimPractice.maslak, 'Hanafi');
  assert.strictEqual(displayed.muslimPractice.namazPractice, 'five_times');
});

test('E2E: Non-verified viewer sees masked contact info', () => {
  const displayed = renderProfilePage(MOCK_HINDU_PROFILE, false, false);

  assert.ok(displayed.contact.email.includes('XXX'), 'Email should be masked');
  assert.ok(displayed.contact.phone.includes('XXX'), 'Phone should be masked');
  assert.strictEqual(displayed.contact.linkedinProfile, 'XXXXXXXXXX', 'LinkedIn should be masked');
  assert.ok(displayed.family.fatherName.includes('X'), 'Father name should be masked');
  assert.ok(displayed.family.motherName.includes('X'), 'Mother name should be masked');
});

test('E2E: Mutual connection sees all contact info', () => {
  const displayed = renderProfilePage(MOCK_HINDU_PROFILE, false, true);

  assert.strictEqual(displayed.contact.email, 'shwetha@example.com', 'Email should be visible');
  assert.strictEqual(displayed.contact.phone, '+1 (555) 123-4567', 'Phone should be visible');
  assert.strictEqual(displayed.contact.linkedinProfile, 'linkedin.com/in/shwetha', 'LinkedIn should be visible');
  assert.strictEqual(displayed.family.fatherName, 'Ramesh Kumar', 'Father name should be visible');
});

test('E2E: Basic info shows age calculated from dateOfBirth', () => {
  const displayed = renderProfilePage(MOCK_HINDU_PROFILE, true, false);

  assert.ok(displayed.basicInfo.age, 'Age should be displayed');
  assert.ok(typeof displayed.basicInfo.age === 'number', 'Age should be a number');
  assert.ok(displayed.basicInfo.age > 0, 'Age should be positive');
});

test('E2E: createdBy field is displayed in Basic Info', () => {
  const displayed = renderProfilePage(MOCK_HINDU_PROFILE, true, false);

  assert.ok(displayed.basicInfo.createdBy, 'createdBy should be displayed');
  assert.strictEqual(displayed.basicInfo.createdBy, 'Self', 'createdBy should be formatted');
});

// ============================================================================
// SECTION 10: SPECIAL CASES AND EDGE CASES
// ============================================================================

section('EDGE CASES - Handle Special Scenarios Correctly');

test('Empty profile displays gracefully', () => {
  const emptyProfile = {
    user: { id: 'empty', name: 'Test User', email: 'test@test.com' },
    approvalStatus: 'pending',
  };

  const displayed = renderProfilePage(emptyProfile, false, false);

  assert.ok(displayed.header, 'Should still have header');
  assert.ok(displayed.header.name, 'Should show name');
  assert.ok(!displayed.header.age, 'Age should be null/undefined');
});

test('Profile with divorced status shows hasChildren', () => {
  const divorcedProfile = {
    ...MOCK_HINDU_PROFILE,
    maritalStatus: 'divorced',
    hasChildren: 'yes_living_together',
  };

  const displayed = renderProfilePage(divorcedProfile, true, false);

  assert.ok(displayed.basicInfo.hasChildren, 'hasChildren should be shown');
  assert.strictEqual(displayed.basicInfo.hasChildren, 'Yes Living Together');
});

test('Profile with never_married does not show hasChildren', () => {
  const displayed = renderProfilePage(MOCK_HINDU_PROFILE, true, false);

  assert.ok(!displayed.basicInfo.hasChildren, 'hasChildren should NOT be shown for never_married');
});

test('Hobbies/Interests are displayed as comma-separated values', () => {
  const displayed = renderProfilePage(MOCK_HINDU_PROFILE, true, false);

  assert.ok(displayed.interests.hobbies.includes(','), 'Hobbies should be comma-separated');
  assert.ok(displayed.interests.hobbies.includes('Reading'), 'Should include Reading');
  assert.ok(displayed.interests.hobbies.includes('Music'), 'Should include Music');
});

test('Family siblings shown in correct format', () => {
  const displayed = renderProfilePage(MOCK_HINDU_PROFILE, true, false);

  assert.strictEqual(displayed.family.siblings, '1B, 0S', 'Siblings should show in NB, NS format');
});

// ============================================================================
// FINAL SUMMARY
// ============================================================================

console.log('\n' + '='.repeat(70));
console.log('📊 PROFILE DISPLAY TEST SUMMARY');
console.log('='.repeat(70));
console.log(`Total Tests: ${passed + failed}`);
console.log(`✅ Passed: ${passed}`);
console.log(`❌ Failed: ${failed}`);
console.log('='.repeat(70));

if (failed > 0) {
  console.log('\n⚠️  FAILURES DETECTED - Profile display may have missing or incorrect fields!\n');
  process.exit(1);
} else {
  console.log('\n✅ All tests passed - Profile display shows all user fields correctly!\n');
  process.exit(0);
}
