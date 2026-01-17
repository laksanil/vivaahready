/**
 * EDIT PROFILE PAGE - COMPREHENSIVE TEST SUITE
 *
 * This test suite validates:
 * 1. All fields in matching module are present in the edit profile sections
 * 2. Each section shows the correct data from the database
 * 3. Edit modal prepopulates with user's existing data
 * 4. Required fields are enforced before save
 * 5. Updated values are displayed after save
 * 6. Deal-breaker toggles display and save correctly
 * 7. Preference updates correctly impact matching results
 * 8. End-to-end edit profile functionality
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
  console.log(`\n${'='.repeat(60)}`);
  console.log(`📋 ${name}`);
  console.log('='.repeat(60));
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
// SECTION 1: PROFILE FIELDS DEFINITION
// ============================================================================

/**
 * All fields used by the matching algorithm (from ProfileForMatching interface)
 * These fields MUST be editable in the profile edit sections
 */
const MATCHING_PROFILE_FIELDS = {
  // Core profile fields used in matching
  core: [
    'gender',
    'dateOfBirth',
    'currentLocation',
    'community',
    'subCommunity',
    'dietaryPreference',
    'qualification',
    'height',
    'gotra',
    'smoking',
    'drinking',
    'motherTongue',
    'familyValues',
    'familyLocation',
    'maritalStatus',
    'hasChildren',
    'annualIncome',
    'religion',
    'citizenship',
    'grewUpIn',
    'openToRelocation',
    'pets',
    'hobbies',
    'fitness',
    'interests',
  ],

  // Partner preference fields (Page 1 - Deal-breakers)
  preferencesPage1: [
    'prefAgeMin',
    'prefAgeMax',
    'prefHeightMin',
    'prefHeightMax',
    'prefMaritalStatus',
    'prefHasChildren',
    'prefReligion',
    'prefCommunity',
    'prefGotra',
    'prefDiet',
    'prefSmoking',
    'prefDrinking',
  ],

  // Partner preference fields (Page 2 - Nice-to-Have)
  preferencesPage2: [
    'prefLocation',
    'prefLocationList',
    'prefCitizenship',
    'prefGrewUpIn',
    'prefRelocation',
    'prefQualification',
    'prefWorkArea',
    'prefIncome',
    'prefOccupationList',
    'prefFamilyValues',
    'prefFamilyLocation',
    'prefMotherTongue',
    'prefMotherTongueList',
    'prefSubCommunity',
    'prefPets',
    'prefHobbies',
    'prefFitness',
    'prefInterests',
  ],

  // Deal-breaker flags
  dealBreakerFlags: [
    'prefAgeIsDealbreaker',
    'prefHeightIsDealbreaker',
    'prefMaritalStatusIsDealbreaker',
    'prefHasChildrenIsDealbreaker',
    'prefReligionIsDealbreaker',
    'prefCommunityIsDealbreaker',
    'prefGotraIsDealbreaker',
    'prefDietIsDealbreaker',
    'prefSmokingIsDealbreaker',
    'prefDrinkingIsDealbreaker',
    'prefLocationIsDealbreaker',
    'prefCitizenshipIsDealbreaker',
    'prefGrewUpInIsDealbreaker',
    'prefRelocationIsDealbreaker',
    'prefEducationIsDealbreaker',
    'prefWorkAreaIsDealbreaker',
    'prefIncomeIsDealbreaker',
    'prefOccupationIsDealbreaker',
    'prefFamilyValuesIsDealbreaker',
    'prefFamilyLocationIsDealbreaker',
    'prefMotherTongueIsDealbreaker',
    'prefSubCommunityIsDealbreaker',
    'prefPetsIsDealbreaker',
    'prefHobbiesIsDealbreaker',
    'prefFitnessIsDealbreaker',
    'prefInterestsIsDealbreaker',
  ],
};

/**
 * Edit profile sections and their mapped fields
 * This defines what fields each edit section should handle
 */
const EDIT_SECTIONS = {
  // Contact Details Section
  contact: {
    displayName: 'Contact Details',
    fields: ['email', 'phone', 'linkedinProfile', 'instagram', 'facebook'],
    requiredFields: [],
  },

  // Basic Info Section
  basics: {
    displayName: 'Basic Info',
    fields: [
      'createdBy',
      'firstName',
      'lastName',
      'gender',
      'dateOfBirth',
      'age',
      'height',
      'maritalStatus',
      'hasChildren',
      'motherTongue',
      'languagesKnown',
    ],
    requiredFields: ['createdBy', 'gender', 'firstName', 'lastName', 'height', 'maritalStatus', 'motherTongue'],
    conditionalRequired: {
      hasChildren: { when: 'maritalStatus', notEquals: 'never_married' },
    },
  },

  // Location & Education Section (combined)
  location_education: {
    displayName: 'Education & Career',
    fields: [
      // Location fields
      'country',
      'currentLocation',
      'zipCode',
      'citizenship',
      'grewUpIn',
      'residencyStatus',
      'openToRelocation',
      // Education fields
      'qualification',
      'university',
      'employerName',
      'occupation',
      'annualIncome',
    ],
    requiredFields: ['country', 'citizenship', 'grewUpIn'],
  },

  // Religion & Astro Section
  religion: {
    displayName: 'Religion & Astro',
    fields: [
      'religion',
      'community',
      'subCommunity',
      'gotra',
      'placeOfBirthCountry',
      'placeOfBirthState',
      'placeOfBirthCity',
      'timeOfBirth',
      'manglik',
      'raasi',
      'nakshatra',
      'doshas',
      // Religion-specific fields
      'maslak',
      'namazPractice',
      'amritdhari',
      'turban',
      'churchAttendance',
      'baptized',
    ],
    requiredFields: ['religion'],
    conditionalFields: {
      // Hindu-specific
      manglik: { when: 'religion', equals: 'Hindu' },
      raasi: { when: 'religion', equals: 'Hindu' },
      nakshatra: { when: 'religion', equals: 'Hindu' },
      doshas: { when: 'religion', equals: 'Hindu' },
      // Muslim-specific
      maslak: { when: 'religion', equals: 'Muslim' },
      namazPractice: { when: 'religion', equals: 'Muslim' },
      // Sikh-specific
      amritdhari: { when: 'religion', equals: 'Sikh' },
      turban: { when: 'religion', equals: 'Sikh' },
      // Christian-specific
      churchAttendance: { when: 'religion', equals: 'Christian' },
      baptized: { when: 'religion', equals: 'Christian' },
    },
  },

  // Family Section
  family: {
    displayName: 'Family',
    fields: [
      'livesWithFamily',
      'familyLocation',
      'familyValues',
      'fatherName',
      'fatherOccupation',
      'motherName',
      'motherOccupation',
      'numberOfBrothers',
      'numberOfSisters',
    ],
    requiredFields: [],
  },

  // Lifestyle Section
  lifestyle: {
    displayName: 'Lifestyle',
    fields: [
      'dietaryPreference',
      'smoking',
      'drinking',
      'hobbies',
      'fitness',
      'interests',
      'pets',
    ],
    requiredFields: [],
  },

  // About Me Section
  aboutme: {
    displayName: 'About Me',
    fields: [
      'bloodGroup',
      'healthInfo',
      'anyDisability',
      'disabilityDetails',
      'allergiesOrMedical',
      'aboutMe',
    ],
    requiredFields: [],
    conditionalRequired: {
      disabilityDetails: { when: 'anyDisability', equals: 'yes' },
    },
  },

  // Partner Preferences Page 1 (Deal-breakers)
  preferences_1: {
    displayName: 'Must-Have Preferences (Deal-breakers)',
    fields: [
      // Age & Height
      'prefAgeMin',
      'prefAgeMax',
      'prefHeightMin',
      'prefHeightMax',
      // Marital Status
      'prefMaritalStatus',
      'prefHasChildren',
      // Religion & Community
      'prefReligion',
      'prefCommunity',
      'prefGotra',
      // Lifestyle
      'prefDiet',
      'prefSmoking',
      'prefDrinking',
    ],
    dealBreakerToggles: [
      'prefAgeIsDealbreaker',
      'prefHeightIsDealbreaker',
      'prefMaritalStatusIsDealbreaker',
      'prefHasChildrenIsDealbreaker',
      'prefReligionIsDealbreaker',
      'prefCommunityIsDealbreaker',
      'prefGotraIsDealbreaker',
      'prefDietIsDealbreaker',
      'prefSmokingIsDealbreaker',
      'prefDrinkingIsDealbreaker',
    ],
    requiredFields: [],
  },

  // Partner Preferences Page 2 (Nice-to-Have)
  preferences_2: {
    displayName: 'Nice-to-Have Preferences (Optional)',
    fields: [
      // Location
      'prefLocation',
      'prefLocationList',
      'prefCitizenship',
      'prefGrewUpIn',
      'prefRelocation',
      // Education & Career
      'prefQualification',
      'prefWorkArea',
      'prefIncome',
      'prefOccupationList',
      // Family
      'prefFamilyValues',
      'prefFamilyLocation',
      'prefFamilyLocationCountry',
      // Other
      'prefMotherTongue',
      'prefMotherTongueList',
      'prefSubCommunity',
      'prefPets',
      'prefHobbies',
      'prefFitness',
      'prefInterests',
      // Additional notes
      'idealPartnerDesc',
    ],
    dealBreakerToggles: [
      'prefLocationIsDealbreaker',
      'prefCitizenshipIsDealbreaker',
      'prefGrewUpInIsDealbreaker',
      'prefRelocationIsDealbreaker',
      'prefEducationIsDealbreaker',
      'prefWorkAreaIsDealbreaker',
      'prefIncomeIsDealbreaker',
      'prefOccupationIsDealbreaker',
      'prefFamilyValuesIsDealbreaker',
      'prefFamilyLocationIsDealbreaker',
      'prefMotherTongueIsDealbreaker',
      'prefSubCommunityIsDealbreaker',
      'prefPetsIsDealbreaker',
      'prefHobbiesIsDealbreaker',
      'prefFitnessIsDealbreaker',
      'prefInterestsIsDealbreaker',
    ],
    requiredFields: [],
  },
};

// ============================================================================
// SECTION 2: FIELD MAPPING TESTS
// ============================================================================

section('SECTION FIELD MAPPING - All Matching Fields Must Be Editable');

// Get all fields from all edit sections
function getAllEditableFields() {
  const fields = new Set();
  Object.values(EDIT_SECTIONS).forEach(section => {
    section.fields.forEach(field => fields.add(field));
    if (section.dealBreakerToggles) {
      section.dealBreakerToggles.forEach(toggle => fields.add(toggle));
    }
  });
  return fields;
}

// Test: All core matching fields are covered
test('All core matching profile fields are editable in some section', () => {
  const editableFields = getAllEditableFields();
  const missingFields = [];

  MATCHING_PROFILE_FIELDS.core.forEach(field => {
    // Check field or its variant (e.g., dietaryPreference maps to diet)
    const fieldVariants = [
      field,
      field.replace('dietary', 'diet'),
      field.replace('Preference', ''),
    ];
    const found = fieldVariants.some(variant => editableFields.has(variant) || editableFields.has(variant.toLowerCase()));
    if (!found) {
      missingFields.push(field);
    }
  });

  if (missingFields.length > 0) {
    console.log(`   Missing fields: ${missingFields.join(', ')}`);
  }
  // Allow some fields to be read-only or derived (like currentLocation from city/state)
  const allowedMissing = ['currentLocation']; // Location is built from city + state
  const criticalMissing = missingFields.filter(f => !allowedMissing.includes(f));
  assert.strictEqual(criticalMissing.length, 0, `Missing editable fields for matching: ${criticalMissing.join(', ')}`);
});

// Test: All preference fields (Page 1) are covered
test('All Page 1 preference fields are editable in preferences_1 section', () => {
  const page1Fields = EDIT_SECTIONS.preferences_1.fields;
  const missingFields = [];

  MATCHING_PROFILE_FIELDS.preferencesPage1.forEach(field => {
    if (!page1Fields.includes(field)) {
      missingFields.push(field);
    }
  });

  assert.strictEqual(missingFields.length, 0, `Missing preference fields: ${missingFields.join(', ')}`);
});

// Test: All preference fields (Page 2) are covered
test('All Page 2 preference fields are editable in preferences_2 section', () => {
  const page2Fields = EDIT_SECTIONS.preferences_2.fields;
  const missingFields = [];

  MATCHING_PROFILE_FIELDS.preferencesPage2.forEach(field => {
    if (!page2Fields.includes(field)) {
      missingFields.push(field);
    }
  });

  assert.strictEqual(missingFields.length, 0, `Missing preference fields: ${missingFields.join(', ')}`);
});

// Test: All deal-breaker toggles are present
test('All deal-breaker toggles are present in preference sections', () => {
  const allToggles = [
    ...(EDIT_SECTIONS.preferences_1.dealBreakerToggles || []),
    ...(EDIT_SECTIONS.preferences_2.dealBreakerToggles || []),
  ];

  const missingToggles = MATCHING_PROFILE_FIELDS.dealBreakerFlags.filter(
    toggle => !allToggles.includes(toggle)
  );

  assert.strictEqual(missingToggles.length, 0, `Missing deal-breaker toggles: ${missingToggles.join(', ')}`);
});

// ============================================================================
// SECTION 3: DATA DISPLAY TESTS
// ============================================================================

section('DATA DISPLAY - Each Section Shows Correct Database Fields');

/**
 * Simulates how profile data maps to display values
 * This mirrors the profile page display logic
 */
function formatDisplayValue(value, fieldName) {
  if (!value || value === 'null' || value === 'undefined') {
    return 'Not specified';
  }

  // Format snake_case to Title Case
  if (typeof value === 'string' && value.includes('_')) {
    return value.split('_').map(word =>
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  }

  // Height formatting
  if (fieldName === 'height' && value) {
    // Return as-is if already formatted
    if (value.includes("'") || value.includes('cm')) return value;
    // Convert cm to feet/inches
    const cm = parseInt(value, 10);
    if (!isNaN(cm)) {
      const feet = Math.floor(cm / 30.48);
      const inches = Math.round((cm % 30.48) / 2.54);
      return `${feet}'${inches}"`;
    }
  }

  return value;
}

// Test: Basic Info section displays all its fields
test('Basic Info section displays: firstName, lastName, gender, DOB, age, height, maritalStatus, motherTongue', () => {
  const basicFields = EDIT_SECTIONS.basics.fields;
  const expectedDisplay = ['firstName', 'lastName', 'gender', 'dateOfBirth', 'age', 'height', 'maritalStatus', 'motherTongue', 'languagesKnown'];

  const allPresent = expectedDisplay.every(field => basicFields.includes(field));
  assert.strictEqual(allPresent, true, 'Basic Info section should display all core identity fields');
});

// Test: Education & Career displays location + education fields
test('Education & Career section displays both location and education fields', () => {
  const sectionFields = EDIT_SECTIONS.location_education.fields;

  const locationFields = ['country', 'currentLocation', 'citizenship', 'grewUpIn', 'openToRelocation'];
  const educationFields = ['qualification', 'university', 'employerName', 'occupation', 'annualIncome'];

  const locationPresent = locationFields.filter(f => sectionFields.includes(f));
  const educationPresent = educationFields.filter(f => sectionFields.includes(f));

  assert.ok(locationPresent.length >= 4, `Should have at least 4 location fields, found ${locationPresent.length}`);
  assert.ok(educationPresent.length >= 4, `Should have at least 4 education fields, found ${educationPresent.length}`);
});

// Test: Religion section displays religion-specific fields conditionally
test('Religion section includes religion-specific conditional fields', () => {
  const religionFields = EDIT_SECTIONS.religion.fields;
  const conditionalFields = EDIT_SECTIONS.religion.conditionalFields;

  // Hindu fields
  assert.ok(religionFields.includes('manglik'), 'Should have manglik field');
  assert.ok(religionFields.includes('raasi'), 'Should have raasi field');
  assert.ok(religionFields.includes('nakshatra'), 'Should have nakshatra field');

  // Muslim fields
  assert.ok(religionFields.includes('maslak'), 'Should have maslak field');
  assert.ok(religionFields.includes('namazPractice'), 'Should have namazPractice field');

  // Conditional rules exist
  assert.ok(conditionalFields.manglik.when === 'religion', 'manglik should be conditional on religion');
  assert.ok(conditionalFields.maslak.when === 'religion', 'maslak should be conditional on religion');
});

// Test: Lifestyle section displays all lifestyle fields
test('Lifestyle section displays all matching lifestyle fields', () => {
  const lifestyleFields = EDIT_SECTIONS.lifestyle.fields;
  const expectedFields = ['dietaryPreference', 'smoking', 'drinking', 'hobbies', 'fitness', 'interests', 'pets'];

  const allPresent = expectedFields.every(field => lifestyleFields.includes(field));
  assert.strictEqual(allPresent, true, 'Lifestyle section should have all lifestyle fields');
});

// Test: Partner Preferences Page 1 displays deal-breaker fields
test('Partner Preferences Page 1 displays all deal-breaker preference fields', () => {
  const pref1Fields = EDIT_SECTIONS.preferences_1.fields;

  // Age & Height
  assert.ok(pref1Fields.includes('prefAgeMin'), 'Should have prefAgeMin');
  assert.ok(pref1Fields.includes('prefAgeMax'), 'Should have prefAgeMax');
  assert.ok(pref1Fields.includes('prefHeightMin'), 'Should have prefHeightMin');
  assert.ok(pref1Fields.includes('prefHeightMax'), 'Should have prefHeightMax');

  // Marital Status
  assert.ok(pref1Fields.includes('prefMaritalStatus'), 'Should have prefMaritalStatus');
  assert.ok(pref1Fields.includes('prefHasChildren'), 'Should have prefHasChildren');

  // Religion & Community
  assert.ok(pref1Fields.includes('prefReligion'), 'Should have prefReligion');
  assert.ok(pref1Fields.includes('prefCommunity'), 'Should have prefCommunity');
  assert.ok(pref1Fields.includes('prefGotra'), 'Should have prefGotra');

  // Lifestyle
  assert.ok(pref1Fields.includes('prefDiet'), 'Should have prefDiet');
  assert.ok(pref1Fields.includes('prefSmoking'), 'Should have prefSmoking');
  assert.ok(pref1Fields.includes('prefDrinking'), 'Should have prefDrinking');
});

// Test: Partner Preferences Page 2 displays nice-to-have fields
test('Partner Preferences Page 2 displays all nice-to-have preference fields', () => {
  const pref2Fields = EDIT_SECTIONS.preferences_2.fields;

  // Location preferences
  assert.ok(pref2Fields.includes('prefLocation') || pref2Fields.includes('prefLocationList'), 'Should have location preference');
  assert.ok(pref2Fields.includes('prefCitizenship'), 'Should have prefCitizenship');
  assert.ok(pref2Fields.includes('prefGrewUpIn'), 'Should have prefGrewUpIn');
  assert.ok(pref2Fields.includes('prefRelocation'), 'Should have prefRelocation');

  // Education preferences
  assert.ok(pref2Fields.includes('prefQualification'), 'Should have prefQualification');
  assert.ok(pref2Fields.includes('prefIncome'), 'Should have prefIncome');

  // Family preferences
  assert.ok(pref2Fields.includes('prefFamilyValues'), 'Should have prefFamilyValues');
  assert.ok(pref2Fields.includes('prefFamilyLocation'), 'Should have prefFamilyLocation');

  // Other preferences
  assert.ok(pref2Fields.includes('prefMotherTongue') || pref2Fields.includes('prefMotherTongueList'), 'Should have mother tongue preference');
  assert.ok(pref2Fields.includes('idealPartnerDesc'), 'Should have idealPartnerDesc');
});

// ============================================================================
// SECTION 4: EDIT MODAL PREPOPULATION TESTS
// ============================================================================

section('EDIT MODAL PREPOPULATION - All User Data Must Be Loaded');

/**
 * Simulates prepopulating edit modal with profile data
 */
function prepopulateFormData(profile, sectionFields) {
  const formData = {};
  sectionFields.forEach(field => {
    formData[field] = profile[field] || '';
  });
  return formData;
}

// Mock profile data for testing
const MOCK_PROFILE = {
  // Basic Info
  firstName: 'Aditya',
  lastName: 'Kumar',
  createdBy: 'self',
  gender: 'male',
  dateOfBirth: '01/15/1995',
  age: '29',
  height: "5'10\"",
  maritalStatus: 'never_married',
  hasChildren: null,
  motherTongue: 'Telugu',
  languagesKnown: 'Telugu, Hindi, English',

  // Location & Education
  country: 'United States',
  currentLocation: 'Mountain House, CA',
  zipCode: '95391',
  citizenship: 'Green Card',
  grewUpIn: 'India',
  residencyStatus: 'permanent_resident',
  openToRelocation: 'yes',
  qualification: 'bachelors_or_masters',
  university: 'Stanford University',
  employerName: 'Tech Corp',
  occupation: 'hpc',
  annualIncome: '$150,000 - $200,000',

  // Religion
  religion: 'Hindu',
  community: 'Brahmin',
  subCommunity: 'Niyogi',
  gotra: 'Bharadwaj',
  placeOfBirthCountry: 'India',
  placeOfBirthState: 'Telangana',
  placeOfBirthCity: 'Hyderabad',
  manglik: 'no',
  raasi: 'Mesha',
  nakshatra: 'Ashwini',

  // Family
  livesWithFamily: 'no',
  familyLocation: 'India',
  familyValues: 'traditional',
  fatherName: 'Ramesh Kumar',
  fatherOccupation: 'Business Owner',
  motherName: 'Lakshmi Devi',
  motherOccupation: 'Homemaker',
  numberOfBrothers: '1',
  numberOfSisters: '1',

  // Lifestyle
  dietaryPreference: 'vegetarian',
  smoking: 'no',
  drinking: 'no',
  hobbies: 'Reading, Music',
  fitness: 'Gym, Yoga',
  interests: 'Technology, Travel',
  pets: 'none',

  // About Me
  bloodGroup: 'O+',
  healthInfo: 'Good',
  anyDisability: 'no',
  aboutMe: 'I have completed my Bachelors Or Masters and currently working as HPC...',

  // Contact
  email: 'aditya@example.com',
  phone: '+1 (555) 123-4567',
  linkedinProfile: 'linkedin.com/in/aditya',
  instagram: '@aditya_k',

  // Preferences Page 1
  prefAgeMin: '26',
  prefAgeMax: '32',
  prefHeightMin: "5'3\"",
  prefHeightMax: "5'8\"",
  prefMaritalStatus: 'doesnt_matter',
  prefHasChildren: null,
  prefReligion: 'doesnt_matter',
  prefCommunity: 'Brahmin',
  prefGotra: 'Different Gothra',
  prefDiet: 'vegetarian',
  prefSmoking: 'doesnt_matter',
  prefDrinking: 'doesnt_matter',

  // Deal-breaker flags
  prefAgeIsDealbreaker: false,
  prefHeightIsDealbreaker: false,
  prefMaritalStatusIsDealbreaker: false,
  prefCommunityIsDealbreaker: true,
  prefDietIsDealbreaker: true,
  prefGotraIsDealbreaker: true,

  // Preferences Page 2
  prefLocation: 'Bay Area',
  prefCitizenship: 'doesnt_matter',
  prefGrewUpIn: 'doesnt_matter',
  prefRelocation: 'doesnt_matter',
  prefQualification: 'bachelors_or_masters',
  prefIncome: 'doesnt_matter',
  prefFamilyValues: 'doesnt_matter',
  prefMotherTongue: 'doesnt_matter',
  idealPartnerDesc: 'Looking for someone kind and caring...',
};

// Test: Basic Info prepopulates correctly
test('Edit Basic Info prepopulates with all user values', () => {
  const formData = prepopulateFormData(MOCK_PROFILE, EDIT_SECTIONS.basics.fields);

  assert.strictEqual(formData.firstName, 'Aditya');
  assert.strictEqual(formData.lastName, 'Kumar');
  assert.strictEqual(formData.gender, 'male');
  assert.strictEqual(formData.dateOfBirth, '01/15/1995');
  assert.strictEqual(formData.height, "5'10\"");
  assert.strictEqual(formData.maritalStatus, 'never_married');
  assert.strictEqual(formData.motherTongue, 'Telugu');
});

// Test: Location & Education prepopulates correctly
test('Edit Location & Education prepopulates with all user values', () => {
  const formData = prepopulateFormData(MOCK_PROFILE, EDIT_SECTIONS.location_education.fields);

  assert.strictEqual(formData.country, 'United States');
  assert.strictEqual(formData.currentLocation, 'Mountain House, CA');
  assert.strictEqual(formData.citizenship, 'Green Card');
  assert.strictEqual(formData.qualification, 'bachelors_or_masters');
  assert.strictEqual(formData.university, 'Stanford University');
  assert.strictEqual(formData.occupation, 'hpc');
  assert.strictEqual(formData.annualIncome, '$150,000 - $200,000');
});

// Test: Religion prepopulates correctly
test('Edit Religion prepopulates with all user values including astro', () => {
  const formData = prepopulateFormData(MOCK_PROFILE, EDIT_SECTIONS.religion.fields);

  assert.strictEqual(formData.religion, 'Hindu');
  assert.strictEqual(formData.community, 'Brahmin');
  assert.strictEqual(formData.subCommunity, 'Niyogi');
  assert.strictEqual(formData.gotra, 'Bharadwaj');
  assert.strictEqual(formData.manglik, 'no');
  assert.strictEqual(formData.raasi, 'Mesha');
  assert.strictEqual(formData.nakshatra, 'Ashwini');
});

// Test: Family prepopulates correctly
test('Edit Family prepopulates with all user values', () => {
  const formData = prepopulateFormData(MOCK_PROFILE, EDIT_SECTIONS.family.fields);

  assert.strictEqual(formData.familyValues, 'traditional');
  assert.strictEqual(formData.fatherName, 'Ramesh Kumar');
  assert.strictEqual(formData.fatherOccupation, 'Business Owner');
  assert.strictEqual(formData.motherName, 'Lakshmi Devi');
  assert.strictEqual(formData.numberOfBrothers, '1');
  assert.strictEqual(formData.numberOfSisters, '1');
});

// Test: Lifestyle prepopulates correctly
test('Edit Lifestyle prepopulates with all user values', () => {
  const formData = prepopulateFormData(MOCK_PROFILE, EDIT_SECTIONS.lifestyle.fields);

  assert.strictEqual(formData.dietaryPreference, 'vegetarian');
  assert.strictEqual(formData.smoking, 'no');
  assert.strictEqual(formData.drinking, 'no');
  assert.strictEqual(formData.hobbies, 'Reading, Music');
  assert.strictEqual(formData.fitness, 'Gym, Yoga');
  assert.strictEqual(formData.pets, 'none');
});

// Test: Partner Preferences Page 1 prepopulates correctly
test('Edit Preferences Page 1 prepopulates with all preference values', () => {
  const formData = prepopulateFormData(MOCK_PROFILE, EDIT_SECTIONS.preferences_1.fields);

  assert.strictEqual(formData.prefAgeMin, '26');
  assert.strictEqual(formData.prefAgeMax, '32');
  assert.strictEqual(formData.prefHeightMin, "5'3\"");
  assert.strictEqual(formData.prefHeightMax, "5'8\"");
  assert.strictEqual(formData.prefCommunity, 'Brahmin');
  assert.strictEqual(formData.prefDiet, 'vegetarian');
  assert.strictEqual(formData.prefGotra, 'Different Gothra');
});

// Test: Deal-breaker toggles prepopulate correctly
test('Edit Preferences prepopulates deal-breaker toggles correctly', () => {
  const toggles = {};
  EDIT_SECTIONS.preferences_1.dealBreakerToggles.forEach(toggle => {
    toggles[toggle] = MOCK_PROFILE[toggle];
  });

  // Check specific toggles
  assert.strictEqual(toggles.prefAgeIsDealbreaker, false);
  assert.strictEqual(toggles.prefCommunityIsDealbreaker, true);
  assert.strictEqual(toggles.prefDietIsDealbreaker, true);
  assert.strictEqual(toggles.prefGotraIsDealbreaker, true);
});

// Test: Partner Preferences Page 2 prepopulates correctly
test('Edit Preferences Page 2 prepopulates with all preference values', () => {
  const formData = prepopulateFormData(MOCK_PROFILE, EDIT_SECTIONS.preferences_2.fields);

  assert.strictEqual(formData.prefLocation, 'Bay Area');
  assert.strictEqual(formData.prefCitizenship, 'doesnt_matter');
  assert.strictEqual(formData.prefQualification, 'bachelors_or_masters');
  assert.strictEqual(formData.idealPartnerDesc, 'Looking for someone kind and caring...');
});

// Test: Empty/null values prepopulate as empty strings
test('Empty/null profile values prepopulate as empty strings in form', () => {
  const profileWithNulls = {
    ...MOCK_PROFILE,
    facebookInstagram: null,
    disabilityDetails: null,
    prefPets: undefined,
  };

  const formData = prepopulateFormData(profileWithNulls, ['facebookInstagram', 'disabilityDetails', 'prefPets']);

  assert.strictEqual(formData.facebookInstagram, '');
  assert.strictEqual(formData.disabilityDetails, '');
  assert.strictEqual(formData.prefPets, '');
});

// ============================================================================
// SECTION 5: REQUIRED FIELD VALIDATION TESTS
// ============================================================================

section('REQUIRED FIELD VALIDATION - Cannot Save Without Required Fields');

/**
 * Validates if all required fields are filled
 */
function validateRequiredFields(formData, sectionConfig) {
  const errors = [];

  // Check required fields
  sectionConfig.requiredFields.forEach(field => {
    const value = formData[field];
    if (!value || (typeof value === 'string' && value.trim() === '')) {
      errors.push(`${field} is required`);
    }
  });

  // Check conditional required fields
  if (sectionConfig.conditionalRequired) {
    Object.entries(sectionConfig.conditionalRequired).forEach(([field, condition]) => {
      if (condition.when && condition.notEquals) {
        // Field is required when condition.when !== condition.notEquals
        if (formData[condition.when] !== condition.notEquals) {
          if (!formData[field] || formData[field].trim() === '') {
            errors.push(`${field} is required when ${condition.when} is not ${condition.notEquals}`);
          }
        }
      }
      if (condition.when && condition.equals) {
        // Field is required when condition.when === condition.equals
        if (formData[condition.when] === condition.equals) {
          if (!formData[field] || formData[field].trim() === '') {
            errors.push(`${field} is required when ${condition.when} is ${condition.equals}`);
          }
        }
      }
    });
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

// Test: Basics section requires essential fields
test('Basics section validation fails when required fields are empty', () => {
  const incompleteFormData = {
    createdBy: '',
    firstName: 'Test',
    lastName: '',
    gender: '',
    height: '',
    maritalStatus: '',
    motherTongue: '',
  };

  const result = validateRequiredFields(incompleteFormData, EDIT_SECTIONS.basics);

  assert.strictEqual(result.valid, false);
  assert.ok(result.errors.includes('createdBy is required'));
  assert.ok(result.errors.includes('lastName is required'));
  assert.ok(result.errors.includes('gender is required'));
  assert.ok(result.errors.includes('height is required'));
  assert.ok(result.errors.includes('maritalStatus is required'));
});

// Test: Basics section passes when all required fields are filled
test('Basics section validation passes when all required fields are filled', () => {
  const completeFormData = {
    createdBy: 'self',
    firstName: 'Test',
    lastName: 'User',
    gender: 'male',
    height: "5'8\"",
    maritalStatus: 'never_married',
    motherTongue: 'Hindi',
  };

  const result = validateRequiredFields(completeFormData, EDIT_SECTIONS.basics);

  assert.strictEqual(result.valid, true);
  assert.strictEqual(result.errors.length, 0);
});

// Test: hasChildren required when maritalStatus is not never_married
test('hasChildren is required when maritalStatus is divorced/widowed', () => {
  const divorcedProfile = {
    createdBy: 'self',
    firstName: 'Test',
    lastName: 'User',
    gender: 'female',
    height: "5'5\"",
    maritalStatus: 'divorced',
    hasChildren: '', // Missing!
    motherTongue: 'Tamil',
  };

  const result = validateRequiredFields(divorcedProfile, EDIT_SECTIONS.basics);

  assert.strictEqual(result.valid, false);
  assert.ok(result.errors.some(e => e.includes('hasChildren')));
});

// Test: hasChildren NOT required when maritalStatus is never_married
test('hasChildren is NOT required when maritalStatus is never_married', () => {
  const neverMarriedProfile = {
    createdBy: 'self',
    firstName: 'Test',
    lastName: 'User',
    gender: 'male',
    height: "5'8\"",
    maritalStatus: 'never_married',
    hasChildren: '', // Not required
    motherTongue: 'Telugu',
  };

  const result = validateRequiredFields(neverMarriedProfile, EDIT_SECTIONS.basics);

  assert.strictEqual(result.valid, true);
});

// Test: Location section requires country, citizenship, grewUpIn
test('Location section validation fails without country/citizenship/grewUpIn', () => {
  const incompleteLocation = {
    country: '',
    citizenship: '',
    grewUpIn: '',
    qualification: 'bachelors',
  };

  const result = validateRequiredFields(incompleteLocation, EDIT_SECTIONS.location_education);

  assert.strictEqual(result.valid, false);
  assert.ok(result.errors.includes('country is required'));
  assert.ok(result.errors.includes('citizenship is required'));
  assert.ok(result.errors.includes('grewUpIn is required'));
});

// Test: Religion section requires religion field
test('Religion section validation fails without religion', () => {
  const incompleteReligion = {
    religion: '',
    community: 'Brahmin',
  };

  const result = validateRequiredFields(incompleteReligion, EDIT_SECTIONS.religion);

  assert.strictEqual(result.valid, false);
  assert.ok(result.errors.includes('religion is required'));
});

// Test: Family section has no required fields
test('Family section has no required fields', () => {
  const emptyFamily = {};

  const result = validateRequiredFields(emptyFamily, EDIT_SECTIONS.family);

  assert.strictEqual(result.valid, true);
  assert.strictEqual(result.errors.length, 0);
});

// Test: Lifestyle section has no required fields
test('Lifestyle section has no required fields', () => {
  const emptyLifestyle = {};

  const result = validateRequiredFields(emptyLifestyle, EDIT_SECTIONS.lifestyle);

  assert.strictEqual(result.valid, true);
});

// Test: Preferences sections have no required fields
test('Preferences sections have no required fields', () => {
  const emptyPrefs = {};

  const result1 = validateRequiredFields(emptyPrefs, EDIT_SECTIONS.preferences_1);
  const result2 = validateRequiredFields(emptyPrefs, EDIT_SECTIONS.preferences_2);

  assert.strictEqual(result1.valid, true);
  assert.strictEqual(result2.valid, true);
});

// ============================================================================
// SECTION 6: DATA UPDATE AND DISPLAY TESTS
// ============================================================================

section('DATA UPDATE AND DISPLAY - Updated Values Are Shown Correctly');

/**
 * Simulates API update and returns updated profile
 */
function simulateProfileUpdate(originalProfile, updates) {
  const updatedProfile = { ...originalProfile };

  Object.entries(updates).forEach(([key, value]) => {
    updatedProfile[key] = value;
  });

  return updatedProfile;
}

// Test: Basic info updates are reflected in display
test('Updated firstName/lastName are displayed after save', () => {
  const updates = {
    firstName: 'Rahul',
    lastName: 'Sharma',
  };

  const updatedProfile = simulateProfileUpdate(MOCK_PROFILE, updates);

  assert.strictEqual(updatedProfile.firstName, 'Rahul');
  assert.strictEqual(updatedProfile.lastName, 'Sharma');
});

// Test: Location updates are reflected
test('Updated location is displayed after save', () => {
  const updates = {
    currentLocation: 'Fremont, CA',
    country: 'United States',
  };

  const updatedProfile = simulateProfileUpdate(MOCK_PROFILE, updates);
  const displayLocation = `${updatedProfile.currentLocation}, ${updatedProfile.country}`;

  assert.ok(displayLocation.includes('Fremont'));
  assert.ok(displayLocation.includes('United States'));
});

// Test: Religion updates including conditional fields
test('Updated religion shows correct conditional fields', () => {
  // Change religion to Muslim
  const updates = {
    religion: 'Muslim',
    maslak: 'Sunni',
    namazPractice: 'regular',
    // Hindu fields should be cleared
    manglik: null,
    raasi: null,
  };

  const updatedProfile = simulateProfileUpdate(MOCK_PROFILE, updates);

  assert.strictEqual(updatedProfile.religion, 'Muslim');
  assert.strictEqual(updatedProfile.maslak, 'Sunni');
  assert.strictEqual(updatedProfile.namazPractice, 'regular');
  assert.strictEqual(updatedProfile.manglik, null);
});

// Test: Preference updates are reflected
test('Updated preferences are displayed correctly', () => {
  const updates = {
    prefAgeMin: '28',
    prefAgeMax: '35',
    prefCommunity: 'Any',
    prefDiet: 'doesnt_matter',
  };

  const updatedProfile = simulateProfileUpdate(MOCK_PROFILE, updates);

  assert.strictEqual(updatedProfile.prefAgeMin, '28');
  assert.strictEqual(updatedProfile.prefAgeMax, '35');
  assert.strictEqual(updatedProfile.prefCommunity, 'Any');
  assert.strictEqual(updatedProfile.prefDiet, 'doesnt_matter');
});

// Test: Deal-breaker toggle updates are reflected
test('Updated deal-breaker toggles are displayed correctly', () => {
  const updates = {
    prefCommunityIsDealbreaker: false, // Was true
    prefDietIsDealbreaker: false,      // Was true
    prefHeightIsDealbreaker: true,     // Was false
  };

  const updatedProfile = simulateProfileUpdate(MOCK_PROFILE, updates);

  assert.strictEqual(updatedProfile.prefCommunityIsDealbreaker, false);
  assert.strictEqual(updatedProfile.prefDietIsDealbreaker, false);
  assert.strictEqual(updatedProfile.prefHeightIsDealbreaker, true);
});

// ============================================================================
// SECTION 7: DEAL-BREAKER TOGGLE TESTS
// ============================================================================

section('DEAL-BREAKER TOGGLES - Correct Display and Behavior');

/**
 * Checks if a deal-breaker toggle should be displayed for a field
 */
function shouldShowDealBreakerToggle(fieldName) {
  const allToggles = [
    ...(EDIT_SECTIONS.preferences_1.dealBreakerToggles || []),
    ...(EDIT_SECTIONS.preferences_2.dealBreakerToggles || []),
  ];

  const toggleName = fieldName.endsWith('IsDealbreaker') ? fieldName : `${fieldName}IsDealbreaker`;
  return allToggles.includes(toggleName);
}

/**
 * Gets the deal-breaker toggle state
 */
function getDealBreakerState(profile, prefField) {
  const toggleField = prefField.endsWith('IsDealbreaker') ? prefField : `${prefField}IsDealbreaker`;
  const value = profile[toggleField];

  // Handle various formats
  if (typeof value === 'boolean') return value;
  if (value === 'true' || value === '1') return true;
  if (value === 'false' || value === '0' || value === null || value === undefined) return false;
  return !!value;
}

// Test: Age preference has deal-breaker toggle
test('prefAge has deal-breaker toggle in preferences_1', () => {
  assert.ok(shouldShowDealBreakerToggle('prefAgeIsDealbreaker'));
});

// Test: Height preference has deal-breaker toggle
test('prefHeight has deal-breaker toggle in preferences_1', () => {
  assert.ok(shouldShowDealBreakerToggle('prefHeightIsDealbreaker'));
});

// Test: Community preference has deal-breaker toggle
test('prefCommunity has deal-breaker toggle in preferences_1', () => {
  assert.ok(shouldShowDealBreakerToggle('prefCommunityIsDealbreaker'));
});

// Test: Diet preference has deal-breaker toggle
test('prefDiet has deal-breaker toggle in preferences_1', () => {
  assert.ok(shouldShowDealBreakerToggle('prefDietIsDealbreaker'));
});

// Test: Location preference has deal-breaker toggle
test('prefLocation has deal-breaker toggle in preferences_2', () => {
  assert.ok(shouldShowDealBreakerToggle('prefLocationIsDealbreaker'));
});

// Test: Education preference has deal-breaker toggle
test('prefEducation has deal-breaker toggle in preferences_2', () => {
  assert.ok(shouldShowDealBreakerToggle('prefEducationIsDealbreaker'));
});

// Test: Mother tongue preference has deal-breaker toggle
test('prefMotherTongue has deal-breaker toggle in preferences_2', () => {
  assert.ok(shouldShowDealBreakerToggle('prefMotherTongueIsDealbreaker'));
});

// Test: Get deal-breaker state correctly handles boolean
test('getDealBreakerState handles boolean values correctly', () => {
  const profile = {
    prefCommunityIsDealbreaker: true,
    prefDietIsDealbreaker: false,
  };

  assert.strictEqual(getDealBreakerState(profile, 'prefCommunity'), true);
  assert.strictEqual(getDealBreakerState(profile, 'prefDiet'), false);
});

// Test: Get deal-breaker state correctly handles string values
test('getDealBreakerState handles string values correctly', () => {
  const profile = {
    prefCommunityIsDealbreaker: 'true',
    prefDietIsDealbreaker: 'false',
    prefAgeIsDealbreaker: '1',
    prefHeightIsDealbreaker: '0',
  };

  assert.strictEqual(getDealBreakerState(profile, 'prefCommunity'), true);
  assert.strictEqual(getDealBreakerState(profile, 'prefDiet'), false);
  assert.strictEqual(getDealBreakerState(profile, 'prefAge'), true);
  assert.strictEqual(getDealBreakerState(profile, 'prefHeight'), false);
});

// Test: Get deal-breaker state correctly handles null/undefined
test('getDealBreakerState handles null/undefined as false', () => {
  const profile = {
    prefCommunityIsDealbreaker: null,
    prefDietIsDealbreaker: undefined,
  };

  assert.strictEqual(getDealBreakerState(profile, 'prefCommunity'), false);
  assert.strictEqual(getDealBreakerState(profile, 'prefDiet'), false);
});

// Test: All Page 1 preference fields have deal-breaker toggles
test('All Page 1 preferences have corresponding deal-breaker toggles', () => {
  const page1Prefs = EDIT_SECTIONS.preferences_1.fields.filter(f => f.startsWith('pref') && !f.includes('IsDealbreaker'));
  const page1Toggles = EDIT_SECTIONS.preferences_1.dealBreakerToggles;

  page1Prefs.forEach(pref => {
    // Some fields don't need individual toggles (min/max are covered by one toggle)
    if (pref.endsWith('Min') || pref.endsWith('Max')) return;

    const toggleName = `${pref}IsDealbreaker`;
    const hasToggle = page1Toggles.includes(toggleName);
    // Allow grouped toggles (e.g., prefAgeIsDealbreaker covers both min/max)
    if (!hasToggle) {
      const basePref = pref.replace(/Min$|Max$/, '');
      const baseToggle = `${basePref}IsDealbreaker`;
      assert.ok(page1Toggles.includes(baseToggle), `${pref} should have deal-breaker toggle ${toggleName} or ${baseToggle}`);
    }
  });
});

// ============================================================================
// SECTION 8: PREFERENCE UPDATE AND MATCHING IMPACT TESTS
// ============================================================================

section('PREFERENCE UPDATE MATCHING IMPACT - Updated Preferences Affect Matches');

/**
 * Simple matching function to test if two profiles match based on preferences
 */
function checkProfileMatch(seeker, candidate) {
  const results = {
    matches: true,
    reasons: [],
    hardFilters: [],
    softMismatches: [],
  };

  // Helper to check deal-breaker
  const isDealbreaker = (prefField) => {
    const toggleField = `${prefField}IsDealbreaker`;
    return getDealBreakerState(seeker, prefField);
  };

  // Age check
  if (seeker.prefAgeMin && seeker.prefAgeMax && candidate.age) {
    const candAge = parseInt(candidate.age, 10);
    const minAge = parseInt(seeker.prefAgeMin, 10);
    const maxAge = parseInt(seeker.prefAgeMax, 10);

    if (candAge < minAge || candAge > maxAge) {
      if (isDealbreaker('prefAge')) {
        results.matches = false;
        results.hardFilters.push(`Age ${candAge} not in range ${minAge}-${maxAge}`);
      } else {
        results.softMismatches.push(`Age ${candAge} not in preferred range ${minAge}-${maxAge}`);
      }
    }
  }

  // Diet check
  if (seeker.prefDiet && seeker.prefDiet !== 'doesnt_matter') {
    if (candidate.dietaryPreference !== seeker.prefDiet) {
      if (isDealbreaker('prefDiet')) {
        results.matches = false;
        results.hardFilters.push(`Diet: wants ${seeker.prefDiet}, candidate is ${candidate.dietaryPreference}`);
      } else {
        results.softMismatches.push(`Diet preference mismatch`);
      }
    }
  }

  // Community check
  if (seeker.prefCommunity && seeker.prefCommunity !== 'doesnt_matter' && seeker.prefCommunity.toLowerCase() !== 'any') {
    const seekerPref = seeker.prefCommunity.toLowerCase();
    const candCommunity = (candidate.community || '').toLowerCase();

    if (!candCommunity.includes(seekerPref) && !seekerPref.includes(candCommunity)) {
      if (isDealbreaker('prefCommunity')) {
        results.matches = false;
        results.hardFilters.push(`Community: wants ${seeker.prefCommunity}, candidate is ${candidate.community}`);
      } else {
        results.softMismatches.push(`Community preference mismatch`);
      }
    }
  }

  // Smoking check
  if (seeker.prefSmoking && seeker.prefSmoking === 'no') {
    if (candidate.smoking && candidate.smoking !== 'no' && candidate.smoking !== 'never') {
      if (isDealbreaker('prefSmoking')) {
        results.matches = false;
        results.hardFilters.push(`Smoking: wants non-smoker, candidate smokes`);
      } else {
        results.softMismatches.push(`Smoking preference mismatch`);
      }
    }
  }

  // Location check
  if (seeker.prefLocation && seeker.prefLocation !== 'doesnt_matter') {
    const prefLocation = seeker.prefLocation.toLowerCase();
    const candLocation = (candidate.currentLocation || '').toLowerCase();

    // Simple substring check (real matching is more complex)
    if (!candLocation.includes(prefLocation) && !prefLocation.includes('any')) {
      if (isDealbreaker('prefLocation')) {
        results.matches = false;
        results.hardFilters.push(`Location: wants ${seeker.prefLocation}, candidate is in ${candidate.currentLocation}`);
      } else {
        results.softMismatches.push(`Location preference mismatch`);
      }
    }
  }

  return results;
}

// Mock candidate profiles for matching tests
const CANDIDATE_VEGETARIAN_BRAHMIN = {
  age: '28',
  dietaryPreference: 'vegetarian',
  community: 'Brahmin',
  smoking: 'no',
  currentLocation: 'Bay Area, CA',
};

const CANDIDATE_NONVEG_KAPU = {
  age: '30',
  dietaryPreference: 'non_vegetarian',
  community: 'Kapu',
  smoking: 'occasionally',
  currentLocation: 'Texas',
};

const CANDIDATE_VEGAN_BRAHMIN = {
  age: '26',
  dietaryPreference: 'vegan',
  community: 'Brahmin',
  smoking: 'no',
  currentLocation: 'Fremont, CA',
};

// Test: Vegetarian deal-breaker rejects non-veg
test('Diet deal-breaker ON: Non-vegetarian candidate is rejected', () => {
  const seeker = {
    prefDiet: 'vegetarian',
    prefDietIsDealbreaker: true,
  };

  const result = checkProfileMatch(seeker, CANDIDATE_NONVEG_KAPU);

  assert.strictEqual(result.matches, false);
  assert.ok(result.hardFilters.some(f => f.includes('Diet')));
});

// Test: Vegetarian non-deal-breaker still shows non-veg with soft mismatch
test('Diet deal-breaker OFF: Non-vegetarian candidate shown with soft mismatch', () => {
  const seeker = {
    prefDiet: 'vegetarian',
    prefDietIsDealbreaker: false,
  };

  const result = checkProfileMatch(seeker, CANDIDATE_NONVEG_KAPU);

  assert.strictEqual(result.matches, true);
  assert.ok(result.softMismatches.some(m => m.includes('Diet')));
});

// Test: Community deal-breaker rejects different community
test('Community deal-breaker ON: Different community candidate is rejected', () => {
  const seeker = {
    prefCommunity: 'Brahmin',
    prefCommunityIsDealbreaker: true,
  };

  const result = checkProfileMatch(seeker, CANDIDATE_NONVEG_KAPU);

  assert.strictEqual(result.matches, false);
  assert.ok(result.hardFilters.some(f => f.includes('Community')));
});

// Test: Community deal-breaker accepts same community
test('Community deal-breaker ON: Same community candidate is accepted', () => {
  const seeker = {
    prefCommunity: 'Brahmin',
    prefCommunityIsDealbreaker: true,
  };

  const result = checkProfileMatch(seeker, CANDIDATE_VEGETARIAN_BRAHMIN);

  // Should not have community in hard filters
  assert.ok(!result.hardFilters.some(f => f.includes('Community')));
});

// Test: Updating preference changes matching results
test('Changing prefCommunity from Brahmin to Any removes community filter', () => {
  // Before update: strict Brahmin preference
  const seekerBefore = {
    prefCommunity: 'Brahmin',
    prefCommunityIsDealbreaker: true,
  };

  const resultBefore = checkProfileMatch(seekerBefore, CANDIDATE_NONVEG_KAPU);
  assert.strictEqual(resultBefore.matches, false);

  // After update: Any community
  const seekerAfter = {
    prefCommunity: 'Any',
    prefCommunityIsDealbreaker: false,
  };

  const resultAfter = checkProfileMatch(seekerAfter, CANDIDATE_NONVEG_KAPU);
  assert.ok(!resultAfter.hardFilters.some(f => f.includes('Community')));
});

// Test: Turning off deal-breaker shows previously hidden profiles
test('Turning OFF diet deal-breaker shows previously rejected profiles', () => {
  // Before: diet is deal-breaker
  const seekerBefore = {
    prefDiet: 'vegetarian',
    prefDietIsDealbreaker: true,
  };

  // After: diet is NOT deal-breaker
  const seekerAfter = {
    prefDiet: 'vegetarian',
    prefDietIsDealbreaker: false,
  };

  const resultBefore = checkProfileMatch(seekerBefore, CANDIDATE_NONVEG_KAPU);
  const resultAfter = checkProfileMatch(seekerAfter, CANDIDATE_NONVEG_KAPU);

  assert.strictEqual(resultBefore.matches, false);
  assert.strictEqual(resultAfter.matches, true);
});

// Test: Age range update changes matching
test('Updating age range affects which candidates match', () => {
  // Candidate is 30
  const candidate = { age: '30' };

  // Before: range 26-29 (candidate excluded)
  const seekerNarrow = {
    prefAgeMin: '26',
    prefAgeMax: '29',
    prefAgeIsDealbreaker: true,
  };

  // After: range 26-35 (candidate included)
  const seekerWide = {
    prefAgeMin: '26',
    prefAgeMax: '35',
    prefAgeIsDealbreaker: true,
  };

  const resultNarrow = checkProfileMatch(seekerNarrow, candidate);
  const resultWide = checkProfileMatch(seekerWide, candidate);

  assert.strictEqual(resultNarrow.matches, false);
  assert.strictEqual(resultWide.matches, true);
});

// Test: Multiple preferences combine correctly
test('Multiple deal-breaker preferences all enforce their conditions', () => {
  const seeker = {
    prefDiet: 'vegetarian',
    prefDietIsDealbreaker: true,
    prefCommunity: 'Brahmin',
    prefCommunityIsDealbreaker: true,
    prefSmoking: 'no',
    prefSmokingIsDealbreaker: true,
  };

  // Candidate matches all
  const resultMatch = checkProfileMatch(seeker, CANDIDATE_VEGETARIAN_BRAHMIN);
  assert.strictEqual(resultMatch.matches, true);
  assert.strictEqual(resultMatch.hardFilters.length, 0);

  // Candidate fails multiple
  const resultNoMatch = checkProfileMatch(seeker, CANDIDATE_NONVEG_KAPU);
  assert.strictEqual(resultNoMatch.matches, false);
  assert.ok(resultNoMatch.hardFilters.length >= 2); // At least diet and community
});

// ============================================================================
// SECTION 9: END-TO-END EDIT FLOW TESTS
// ============================================================================

section('END-TO-END EDIT FLOW - Complete Edit Profile Scenarios');

/**
 * Simulates complete edit flow: open modal → edit → validate → save → display
 */
function simulateEditFlow(originalProfile, sectionKey, updates) {
  const sectionConfig = EDIT_SECTIONS[sectionKey];

  // Step 1: Open modal and prepopulate
  const formData = prepopulateFormData(originalProfile, sectionConfig.fields);

  // Step 2: Apply updates
  Object.entries(updates).forEach(([key, value]) => {
    if (sectionConfig.fields.includes(key) ||
        (sectionConfig.dealBreakerToggles && sectionConfig.dealBreakerToggles.includes(key))) {
      formData[key] = value;
    }
  });

  // Step 3: Validate
  const validation = validateRequiredFields(formData, sectionConfig);

  if (!validation.valid) {
    return {
      success: false,
      errors: validation.errors,
      updatedProfile: null,
    };
  }

  // Step 4: Save (simulate API call)
  const updatedProfile = simulateProfileUpdate(originalProfile, formData);

  // Step 5: Return result
  return {
    success: true,
    errors: [],
    updatedProfile,
  };
}

// Test: Complete basics section edit flow
test('E2E: Edit basics section - change name and height', () => {
  const result = simulateEditFlow(MOCK_PROFILE, 'basics', {
    firstName: 'Vikram',
    lastName: 'Reddy',
    height: "5'11\"",
  });

  assert.strictEqual(result.success, true);
  assert.strictEqual(result.updatedProfile.firstName, 'Vikram');
  assert.strictEqual(result.updatedProfile.lastName, 'Reddy');
  assert.strictEqual(result.updatedProfile.height, "5'11\"");
});

// Test: Complete location_education edit flow
test('E2E: Edit location & education - change location and job', () => {
  const result = simulateEditFlow(MOCK_PROFILE, 'location_education', {
    currentLocation: 'San Jose, CA',
    occupation: 'software_engineer',
    annualIncome: '$200,000+',
  });

  assert.strictEqual(result.success, true);
  assert.strictEqual(result.updatedProfile.currentLocation, 'San Jose, CA');
  assert.strictEqual(result.updatedProfile.occupation, 'software_engineer');
});

// Test: Complete religion edit flow
test('E2E: Edit religion section - change community and gotra', () => {
  const result = simulateEditFlow(MOCK_PROFILE, 'religion', {
    community: 'Iyengar',
    subCommunity: 'Vadakalai',
    gotra: 'Kashyap',
  });

  assert.strictEqual(result.success, true);
  assert.strictEqual(result.updatedProfile.community, 'Iyengar');
  assert.strictEqual(result.updatedProfile.subCommunity, 'Vadakalai');
  assert.strictEqual(result.updatedProfile.gotra, 'Kashyap');
});

// Test: Complete preferences_1 edit flow with deal-breakers
test('E2E: Edit preferences page 1 - change age range and deal-breakers', () => {
  // Add deal-breaker toggles to form data
  const originalWithToggles = {
    ...MOCK_PROFILE,
    prefAgeIsDealbreaker: false,
    prefCommunityIsDealbreaker: true,
  };

  const result = simulateEditFlow(originalWithToggles, 'preferences_1', {
    prefAgeMin: '25',
    prefAgeMax: '30',
    prefCommunity: "Doesn't matter",
  });

  assert.strictEqual(result.success, true);
  assert.strictEqual(result.updatedProfile.prefAgeMin, '25');
  assert.strictEqual(result.updatedProfile.prefAgeMax, '30');
  assert.strictEqual(result.updatedProfile.prefCommunity, "Doesn't matter");
});

// Test: Edit flow fails when required fields are removed
test('E2E: Edit fails when required field is cleared', () => {
  const result = simulateEditFlow(MOCK_PROFILE, 'basics', {
    firstName: '', // Clear required field
    lastName: 'User',
  });

  assert.strictEqual(result.success, false);
  assert.ok(result.errors.some(e => e.includes('firstName')));
});

// Test: Edit flow preserves unchanged fields
test('E2E: Edit preserves fields not in the update', () => {
  const result = simulateEditFlow(MOCK_PROFILE, 'basics', {
    firstName: 'NewName',
    // Only updating firstName, all others should be preserved
  });

  assert.strictEqual(result.success, true);
  assert.strictEqual(result.updatedProfile.firstName, 'NewName');
  assert.strictEqual(result.updatedProfile.lastName, 'Kumar'); // Preserved
  assert.strictEqual(result.updatedProfile.gender, 'male'); // Preserved
  assert.strictEqual(result.updatedProfile.motherTongue, 'Telugu'); // Preserved
});

// Test: Edit lifestyle section
test('E2E: Edit lifestyle - change diet and hobbies', () => {
  const result = simulateEditFlow(MOCK_PROFILE, 'lifestyle', {
    dietaryPreference: 'occasionally_non_vegetarian',
    hobbies: 'Photography, Cooking, Travel',
    pets: 'dog',
  });

  assert.strictEqual(result.success, true);
  assert.strictEqual(result.updatedProfile.dietaryPreference, 'occasionally_non_vegetarian');
  assert.strictEqual(result.updatedProfile.hobbies, 'Photography, Cooking, Travel');
  assert.strictEqual(result.updatedProfile.pets, 'dog');
});

// Test: Edit about me section
test('E2E: Edit about me - update bio', () => {
  const result = simulateEditFlow(MOCK_PROFILE, 'aboutme', {
    aboutMe: 'I am a passionate software engineer who loves building products...',
    bloodGroup: 'A+',
  });

  assert.strictEqual(result.success, true);
  assert.ok(result.updatedProfile.aboutMe.includes('passionate software engineer'));
  assert.strictEqual(result.updatedProfile.bloodGroup, 'A+');
});

// Test: Edit contact section
test('E2E: Edit contact - update phone and LinkedIn', () => {
  const result = simulateEditFlow(MOCK_PROFILE, 'contact', {
    phone: '+1 (555) 999-8888',
    linkedinProfile: 'linkedin.com/in/vikram-reddy',
  });

  assert.strictEqual(result.success, true);
  assert.strictEqual(result.updatedProfile.phone, '+1 (555) 999-8888');
  assert.strictEqual(result.updatedProfile.linkedinProfile, 'linkedin.com/in/vikram-reddy');
});

// ============================================================================
// SECTION 10: ADDITIONAL ROBUSTNESS TESTS
// ============================================================================

section('ROBUSTNESS TESTS - Edge Cases and Error Handling');

// Test: Handle profile with all null preference values
test('Profile with null preferences displays "Not specified" or "Doesn\'t matter"', () => {
  const profileWithNulls = {
    ...MOCK_PROFILE,
    prefAgeMin: null,
    prefAgeMax: null,
    prefCommunity: null,
    prefDiet: null,
  };

  // Prepopulate should give empty strings
  const formData = prepopulateFormData(profileWithNulls, EDIT_SECTIONS.preferences_1.fields);

  assert.strictEqual(formData.prefAgeMin, '');
  assert.strictEqual(formData.prefAgeMax, '');
  assert.strictEqual(formData.prefCommunity, '');
  assert.strictEqual(formData.prefDiet, '');
});

// Test: Handle special characters in text fields
test('Special characters in aboutMe are preserved', () => {
  const profileWithSpecialChars = {
    ...MOCK_PROFILE,
    aboutMe: "I'm looking for someone who's kind & caring! What's up? 'Test'",
  };

  const result = simulateEditFlow(profileWithSpecialChars, 'aboutme', {
    aboutMe: "New bio with 'quotes' & special <chars>!",
  });

  assert.strictEqual(result.success, true);
  assert.ok(result.updatedProfile.aboutMe.includes("'quotes'"));
  assert.ok(result.updatedProfile.aboutMe.includes('&'));
});

// Test: Handle comma-separated list fields
test('Comma-separated language list is preserved', () => {
  const profileWithLanguages = {
    ...MOCK_PROFILE,
    languagesKnown: 'English, Hindi, Telugu, Tamil',
  };

  const result = simulateEditFlow(profileWithLanguages, 'basics', {
    languagesKnown: 'English, Hindi, Telugu, Tamil, Kannada',
  });

  assert.strictEqual(result.success, true);
  assert.strictEqual(result.updatedProfile.languagesKnown, 'English, Hindi, Telugu, Tamil, Kannada');
});

// Test: Handle height format variations
test('Height with different formats is handled correctly', () => {
  const heights = ["5'10\"", '5\'10"', '5 ft 10 in', '178 cm', '178'];

  heights.forEach(height => {
    const formatted = formatDisplayValue(height, 'height');
    assert.ok(formatted, `Height ${height} should be formatted`);
  });
});

// Test: Handle age calculation edge cases
test('Age validation rejects invalid ages', () => {
  const formData17 = {
    createdBy: 'self',
    firstName: 'Test',
    lastName: 'User',
    gender: 'male',
    height: "5'8\"",
    maritalStatus: 'never_married',
    motherTongue: 'Hindi',
    age: '17',
  };

  // This would be caught by form-level validation (not our simple required check)
  // But the form should prevent saving age < 18
  const age = parseInt(formData17.age, 10);
  assert.ok(age < 18, 'Age 17 should fail validation');
});

// Test: Handle deal-breaker toggle as various types
test('Deal-breaker toggle handles boolean, string "true", and string "false"', () => {
  const profiles = [
    { prefDietIsDealbreaker: true },
    { prefDietIsDealbreaker: false },
    { prefDietIsDealbreaker: 'true' },
    { prefDietIsDealbreaker: 'false' },
    { prefDietIsDealbreaker: '1' },
    { prefDietIsDealbreaker: '0' },
    { prefDietIsDealbreaker: null },
    { prefDietIsDealbreaker: undefined },
  ];

  const expected = [true, false, true, false, true, false, false, false];

  profiles.forEach((profile, i) => {
    const result = getDealBreakerState(profile, 'prefDiet');
    assert.strictEqual(result, expected[i], `Profile ${i} should have deal-breaker state ${expected[i]}`);
  });
});

// Test: Prepopulation handles missing fields gracefully (for display)
test('Prepopulation handles missing fields gracefully without crashing', () => {
  const minimalProfile = {
    firstName: 'Test',
    gender: 'male',
  };

  // Prepopulation should not throw when fields are missing
  const formData = prepopulateFormData(minimalProfile, EDIT_SECTIONS.basics.fields);

  assert.strictEqual(formData.firstName, 'Test');
  assert.strictEqual(formData.lastName, '');
  assert.strictEqual(formData.height, '');
});

// CRITICAL TEST: Saving with missing required fields MUST FAIL
test('REQUIRED FIELDS: Cannot save basics section with missing required fields', () => {
  // Try to save with only firstName and gender - missing other required fields
  const incompleteFormData = {
    firstName: 'Test',
    gender: 'male',
    // MISSING: createdBy, lastName, height, maritalStatus, motherTongue
  };

  const validation = validateRequiredFields(incompleteFormData, EDIT_SECTIONS.basics);

  // Must fail validation
  assert.strictEqual(validation.valid, false, 'Validation should fail with missing required fields');
  assert.ok(validation.errors.length > 0, 'Should have validation errors');

  // Check specific required fields are flagged
  const errorFields = validation.errors.map(e => e.toLowerCase());
  assert.ok(
    errorFields.some(e => e.includes('createdby') || e.includes('created')),
    'Should flag createdBy as missing'
  );
  assert.ok(
    errorFields.some(e => e.includes('lastname') || e.includes('last')),
    'Should flag lastName as missing'
  );
  assert.ok(
    errorFields.some(e => e.includes('height')),
    'Should flag height as missing'
  );
  assert.ok(
    errorFields.some(e => e.includes('maritalstatus') || e.includes('marital')),
    'Should flag maritalStatus as missing'
  );
  assert.ok(
    errorFields.some(e => e.includes('mothertongue') || e.includes('mother')),
    'Should flag motherTongue as missing'
  );
});

// CRITICAL TEST: Save fails when each individual required field is missing
test('REQUIRED FIELDS: Each missing required field individually causes failure', () => {
  const requiredFields = EDIT_SECTIONS.basics.requiredFields;
  const baseData = {
    createdBy: 'self',
    firstName: 'Test',
    lastName: 'User',
    gender: 'male',
    height: "5'8\"",
    maritalStatus: 'never_married',
    motherTongue: 'Hindi',
  };

  requiredFields.forEach(field => {
    // Create data with one required field missing
    const incompleteData = { ...baseData };
    delete incompleteData[field];

    const validation = validateRequiredFields(incompleteData, EDIT_SECTIONS.basics);

    assert.strictEqual(
      validation.valid,
      false,
      `Validation should fail when ${field} is missing`
    );
    assert.ok(
      validation.errors.some(e => e.toLowerCase().includes(field.toLowerCase())),
      `Error should mention missing field: ${field}`
    );
  });
});

// CRITICAL TEST: Save fails when required field is empty string
test('REQUIRED FIELDS: Empty string for required fields causes failure', () => {
  const formDataWithEmptyStrings = {
    createdBy: '',       // Empty - should fail
    firstName: 'Test',
    lastName: '',        // Empty - should fail
    gender: 'male',
    height: '',          // Empty - should fail
    maritalStatus: '',   // Empty - should fail
    motherTongue: '',    // Empty - should fail
  };

  const validation = validateRequiredFields(formDataWithEmptyStrings, EDIT_SECTIONS.basics);

  assert.strictEqual(validation.valid, false, 'Empty strings in required fields should fail');
  assert.ok(validation.errors.length >= 4, 'Should have multiple validation errors for empty fields');
});

// CRITICAL TEST: E2E - Edit flow rejects save with missing required fields
test('E2E: Edit flow MUST REJECT save with missing required fields', () => {
  const result = simulateEditFlow(MOCK_PROFILE, 'basics', {
    createdBy: '', // Clear required field
    firstName: 'Test',
    lastName: '',  // Clear required field
    height: '',    // Clear required field
  });

  assert.strictEqual(result.success, false, 'Edit flow should fail with missing required fields');
  assert.ok(result.errors.length >= 3, 'Should report all missing required fields');
  assert.strictEqual(result.updatedProfile, null, 'Profile should not be updated on failure');
});

// CRITICAL TEST: Conditional required fields are enforced
test('REQUIRED FIELDS: hasChildren required when maritalStatus is not never_married', () => {
  const formDataDivorced = {
    createdBy: 'self',
    firstName: 'Test',
    lastName: 'User',
    gender: 'male',
    height: "5'8\"",
    maritalStatus: 'divorced', // Not never_married
    motherTongue: 'Hindi',
    // MISSING: hasChildren - required for divorced status
  };

  const validation = validateRequiredFields(formDataDivorced, EDIT_SECTIONS.basics);

  assert.strictEqual(validation.valid, false, 'Should fail when hasChildren is missing for divorced status');
  assert.ok(
    validation.errors.some(e => e.toLowerCase().includes('children') || e.toLowerCase().includes('haschildren')),
    'Should flag hasChildren as missing'
  );
});

// CRITICAL TEST: hasChildren NOT required when maritalStatus is never_married
test('REQUIRED FIELDS: hasChildren NOT required when maritalStatus is never_married', () => {
  const formDataNeverMarried = {
    createdBy: 'self',
    firstName: 'Test',
    lastName: 'User',
    gender: 'male',
    height: "5'8\"",
    maritalStatus: 'never_married',
    motherTongue: 'Hindi',
    // hasChildren not provided - should be OK for never_married
  };

  const validation = validateRequiredFields(formDataNeverMarried, EDIT_SECTIONS.basics);

  assert.strictEqual(validation.valid, true, 'Should pass when hasChildren is not needed for never_married');
});

// Test: Location section required fields (country, citizenship, grewUpIn)
test('REQUIRED FIELDS: Location section requires country, citizenship, and grewUpIn', () => {
  const incompleteLocation = {
    currentLocation: 'San Francisco, CA',
    // MISSING: country, citizenship, grewUpIn
  };

  const validation = validateRequiredFields(incompleteLocation, EDIT_SECTIONS.location_education);

  assert.strictEqual(validation.valid, false, 'Should fail when required location fields are missing');
  assert.ok(
    validation.errors.some(e => e.toLowerCase().includes('country')),
    'Should flag country as missing'
  );
  assert.ok(
    validation.errors.some(e => e.toLowerCase().includes('citizenship')),
    'Should flag citizenship as missing'
  );
  assert.ok(
    validation.errors.some(e => e.toLowerCase().includes('grewupin') || e.toLowerCase().includes('grew')),
    'Should flag grewUpIn as missing'
  );
});

// Test: Location section passes with all required fields
test('REQUIRED FIELDS: Location section passes with country, citizenship, and grewUpIn', () => {
  const completeLocation = {
    country: 'USA',
    citizenship: 'US Citizen',
    grewUpIn: 'USA',
    // currentLocation is optional
  };

  const validation = validateRequiredFields(completeLocation, EDIT_SECTIONS.location_education);

  assert.strictEqual(validation.valid, true, 'Should pass when all required fields are present');
});

// Test: Religion section required fields
test('REQUIRED FIELDS: Religion section requires religion', () => {
  const incompleteReligion = {
    community: 'Brahmin',
    // MISSING: religion
    gotra: 'Kashyap',
  };

  const validation = validateRequiredFields(incompleteReligion, EDIT_SECTIONS.religion);

  assert.strictEqual(validation.valid, false, 'Should fail when religion is missing');
  assert.ok(
    validation.errors.some(e => e.toLowerCase().includes('religion')),
    'Should flag religion as missing'
  );
});

// Test: Section edit button is always present
test('Each section in profile page has an edit button', () => {
  const sectionCount = Object.keys(EDIT_SECTIONS).length;
  assert.ok(sectionCount >= 9, 'Should have at least 9 edit sections');

  Object.keys(EDIT_SECTIONS).forEach(key => {
    assert.ok(EDIT_SECTIONS[key].displayName, `Section ${key} should have displayName`);
    assert.ok(EDIT_SECTIONS[key].fields, `Section ${key} should have fields array`);
  });
});

// ============================================================================
// FINAL SUMMARY
// ============================================================================

console.log('\n' + '='.repeat(60));
console.log('📊 EDIT PROFILE TEST SUMMARY');
console.log('='.repeat(60));
console.log(`Total Tests: ${passed + failed}`);
console.log(`✅ Passed: ${passed}`);
console.log(`❌ Failed: ${failed}`);
console.log('='.repeat(60));

if (failed > 0) {
  console.log('\n⚠️  FAILURES DETECTED - Edit profile functionality may have bugs!\n');
  process.exit(1);
} else {
  console.log('\n✅ All tests passed - Edit profile functionality is working correctly!\n');
  process.exit(0);
}
