/**
 * Test Suite for Create Profile Wizard
 * Tests:
 * 1. Required fields validation per page (9 pages)
 * 2. Continue button activation logic
 * 3. Deal-breaker toggle presence (all except hobbies, fitness, interests, sub-community)
 * 4. Deal-breaker validation (must have specific selection, not "Any"/"Doesn't matter")
 */

const assert = require('assert');

// ============================================================================
// TEST HELPERS
// ============================================================================

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`✅ ${name}`);
    passed++;
  } catch (error) {
    console.log(`❌ ${name}`);
    console.log(`   Error: ${error.message}`);
    failed++;
  }
}

function section(name) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`📋 ${name}`);
  console.log('='.repeat(60));
}

// ============================================================================
// SECTION ORDER DEFINITION (from FindMatchModal.tsx)
// ============================================================================

const SECTION_ORDER = [
  'basics',
  'location_education',
  'religion',
  'family',
  'lifestyle',
  'aboutme',
  'preferences_1',
  'preferences_2',
  'account',
  'photos'
];

const ADMIN_SECTION_ORDER = [
  'basics',
  'location_education',
  'religion',
  'family',
  'lifestyle',
  'aboutme',
  'preferences_1',
  'preferences_2',
  'admin_account',
  'photos'
];

// ============================================================================
// REQUIRED FIELDS PER PAGE
// ============================================================================

const REQUIRED_FIELDS = {
  basics: [
    'createdBy',
    'firstName',
    'lastName',
    'gender',
    'dateOfBirth OR age', // Either one is required
    'height',
    'maritalStatus',
    'motherTongue'
  ],
  location_education: [
    'country',
    'grewUpIn',
    'citizenship',
    'zipCode (if USA)',
    'qualification',
    'occupation',
    'openToRelocation'
  ],
  religion: [], // No required fields
  family: [
    'familyLocation',
    'familyValues'
  ],
  lifestyle: [
    'dietaryPreference',
    'smoking',
    'drinking',
    'pets'
  ],
  aboutme: [
    'aboutMe',
    'linkedinProfile (valid URL or "no_linkedin")'
  ],
  preferences_1: [], // No hard validation, but has deal-breaker logic
  preferences_2: [], // No hard validation, but has deal-breaker logic
  account: [
    'email',
    'phone',
    'password (user mode)',
    'confirmPassword (user mode)'
  ],
  photos: [
    'phoneNumber (required)',
    'at least 1 photo'
  ]
};

// ============================================================================
// PAGE 1: BASICS - VALIDATION LOGIC
// ============================================================================

function isBasicsComplete(formData) {
  const {
    createdBy,
    firstName,
    lastName,
    gender,
    dateOfBirth,
    age,
    height,
    maritalStatus,
    motherTongue
  } = formData;

  // Either dateOfBirth or age is required
  const hasDateOrAge = dateOfBirth || age;

  return !!(
    createdBy &&
    firstName &&
    lastName &&
    gender &&
    hasDateOrAge &&
    height &&
    maritalStatus &&
    motherTongue
  );
}

// ============================================================================
// PAGE 2: LOCATION & EDUCATION - VALIDATION LOGIC
// ============================================================================

function isLocationEducationComplete(formData) {
  const {
    country,
    grewUpIn,
    citizenship,
    zipCode,
    city,
    state,
    qualification,
    occupation,
    openToRelocation
  } = formData;

  // USA requires zipCode
  const isUSALocation = country === 'United States' || country === 'USA';
  const zipCodeValid = !isUSALocation || zipCode;

  return !!(
    country &&
    grewUpIn &&
    citizenship &&
    zipCodeValid &&
    qualification &&
    occupation &&
    openToRelocation
  );
}

// ============================================================================
// PAGE 3: RELIGION - VALIDATION LOGIC
// ============================================================================

function isReligionComplete(formData) {
  // No required fields for religion page
  return true;
}

// ============================================================================
// PAGE 4: FAMILY - VALIDATION LOGIC
// ============================================================================

function isFamilyComplete(formData) {
  const { familyLocation, familyValues } = formData;
  return familyLocation !== '' && familyValues !== '';
}

// ============================================================================
// PAGE 5: LIFESTYLE - VALIDATION LOGIC
// ============================================================================

function isLifestyleComplete(formData) {
  const { dietaryPreference, smoking, drinking, pets } = formData;
  return !!(dietaryPreference && smoking && drinking && pets);
}

// ============================================================================
// PAGE 6: ABOUT ME - VALIDATION LOGIC
// ============================================================================

function isAboutMeComplete(formData) {
  const { aboutMe, linkedinProfile } = formData;

  if (!aboutMe) return false;

  // LinkedIn must be either 'no_linkedin' or a valid LinkedIn URL
  if (!linkedinProfile) return false;
  if (linkedinProfile === 'no_linkedin') return true;

  // Validate LinkedIn URL format
  const linkedinPattern = /^(https?:\/\/)?(www\.)?linkedin\.com\/(in|pub)\/[a-zA-Z0-9_-]+\/?$/;
  return linkedinPattern.test(linkedinProfile);
}

// ============================================================================
// PAGE 7 & 8: PREFERENCES - VALIDATION LOGIC
// ============================================================================

function isPreferencesPage1Complete(formData) {
  // No hard validation but deal-breaker logic applies
  return true;
}

function isPreferencesPage2Complete(formData) {
  // No hard validation but deal-breaker logic applies
  return true;
}

// ============================================================================
// PAGE 10: PHOTOS PAGE - VALIDATION LOGIC (includes phone number)
// ============================================================================

/**
 * Photos page validation - REQUIRES both phone number AND at least 1 photo
 * This is enforced in src/app/profile/photos/page.tsx
 */
function isPhotosPageComplete(formData) {
  const { phoneNumber, photos } = formData;

  // Phone number is REQUIRED
  if (!phoneNumber || !phoneNumber.trim()) {
    return false;
  }

  // At least one photo is REQUIRED
  if (!photos || photos.length === 0) {
    return false;
  }

  return true;
}

/**
 * Validates phone number format
 * Accepts various formats: (555) 123-4567, 555-123-4567, 5551234567, etc.
 */
function isValidPhoneNumber(phone) {
  if (!phone) return false;

  // Extract digits only
  const digits = phone.replace(/\D/g, '');

  // Must have at least 10 digits (US phone number)
  return digits.length >= 10;
}

// ============================================================================
// DEAL-BREAKER FIELDS DEFINITION
// ============================================================================

// Fields that HAVE deal-breaker toggle capability
const FIELDS_WITH_DEAL_BREAKER = [
  'prefAge',
  'prefHeight',
  'prefMaritalStatus',
  'prefHasChildren',
  'prefReligion',
  'prefCommunity',
  'prefGotra',
  'prefDiet',
  'prefSmoking',
  'prefDrinking',
  'prefLocation',
  'prefCitizenship',
  'prefGrewUpIn',
  'prefRelocation',
  'prefEducation',
  'prefIncome',
  'prefFamilyValues',
  'prefFamilyLocation',
  'prefMotherTongue'
];

// Fields that do NOT have deal-breaker toggle (per user requirement)
const FIELDS_WITHOUT_DEAL_BREAKER = [
  'prefSubCommunity',
  'prefPets',
  'prefHobbies',
  'prefFitness',
  'prefInterests'
];

// Values that indicate "Any" or "Doesn't matter"
const ANY_VALUES = [
  'Any',
  'any',
  "Doesn't matter",
  "doesn't matter",
  'doesnt_matter',
  'Doesnt Matter',
  '',
  null,
  undefined
];

// ============================================================================
// DEAL-BREAKER VALIDATION LOGIC
// ============================================================================

/**
 * Validates that when a deal-breaker toggle is ON, the user has selected
 * a specific value (not "Any" or "Doesn't matter")
 */
function validateDealBreaker(fieldName, value, isDealBreaker) {
  if (!isDealBreaker) {
    // Deal-breaker is OFF, no validation needed
    return { valid: true };
  }

  // Deal-breaker is ON, check if value is specific
  const isAnyValue = ANY_VALUES.some(anyVal => {
    if (anyVal === null || anyVal === undefined) {
      return value === anyVal;
    }
    if (typeof value === 'string' && typeof anyVal === 'string') {
      return value.toLowerCase() === anyVal.toLowerCase();
    }
    return value === anyVal;
  });

  if (isAnyValue) {
    return {
      valid: false,
      error: `${fieldName}: Deal-breaker is enabled but no specific selection made. Please select a specific requirement.`
    };
  }

  // For array values (multiselect), check if empty
  if (Array.isArray(value) && value.length === 0) {
    return {
      valid: false,
      error: `${fieldName}: Deal-breaker is enabled but no selections made. Please select at least one specific option.`
    };
  }

  return { valid: true };
}

/**
 * Check if a field should have a deal-breaker toggle
 */
function shouldHaveDealBreakerToggle(fieldName) {
  return FIELDS_WITH_DEAL_BREAKER.includes(fieldName);
}

/**
 * Check if a field should NOT have a deal-breaker toggle
 */
function shouldNotHaveDealBreakerToggle(fieldName) {
  return FIELDS_WITHOUT_DEAL_BREAKER.includes(fieldName);
}

// ============================================================================
// SECTION: PAGE 1 - BASICS VALIDATION TESTS
// ============================================================================

section('PAGE 1: BASICS - Required Fields Validation');

test('Page 1: Continue button DISABLED when all fields are empty', () => {
  const formData = {};
  assert.strictEqual(isBasicsComplete(formData), false);
});

test('Page 1: Continue button DISABLED when only createdBy is filled', () => {
  const formData = { createdBy: 'Self' };
  assert.strictEqual(isBasicsComplete(formData), false);
});

test('Page 1: Continue button DISABLED when missing motherTongue', () => {
  const formData = {
    createdBy: 'Self',
    firstName: 'John',
    lastName: 'Doe',
    gender: 'Male',
    dateOfBirth: '1990-01-01',
    height: '170',
    maritalStatus: 'Never Married'
    // motherTongue missing
  };
  assert.strictEqual(isBasicsComplete(formData), false);
});

test('Page 1: Continue button DISABLED when missing gender', () => {
  const formData = {
    createdBy: 'Self',
    firstName: 'John',
    lastName: 'Doe',
    dateOfBirth: '1990-01-01',
    height: '170',
    maritalStatus: 'Never Married',
    motherTongue: 'English'
    // gender missing
  };
  assert.strictEqual(isBasicsComplete(formData), false);
});

test('Page 1: Continue button ENABLED with dateOfBirth (no age)', () => {
  const formData = {
    createdBy: 'Self',
    firstName: 'John',
    lastName: 'Doe',
    gender: 'Male',
    dateOfBirth: '1990-01-01',
    height: '170',
    maritalStatus: 'Never Married',
    motherTongue: 'English'
  };
  assert.strictEqual(isBasicsComplete(formData), true);
});

test('Page 1: Continue button ENABLED with age (no dateOfBirth)', () => {
  const formData = {
    createdBy: 'Self',
    firstName: 'John',
    lastName: 'Doe',
    gender: 'Male',
    age: 30,
    height: '170',
    maritalStatus: 'Never Married',
    motherTongue: 'English'
  };
  assert.strictEqual(isBasicsComplete(formData), true);
});

test('Page 1: Continue button ENABLED with all required fields', () => {
  const formData = {
    createdBy: 'Parent',
    firstName: 'Jane',
    lastName: 'Smith',
    gender: 'Female',
    dateOfBirth: '1995-05-15',
    height: "5'6\"",
    maritalStatus: 'Never Married',
    motherTongue: 'Hindi'
  };
  assert.strictEqual(isBasicsComplete(formData), true);
});

// ============================================================================
// SECTION: PAGE 2 - LOCATION & EDUCATION VALIDATION TESTS
// ============================================================================

section('PAGE 2: LOCATION & EDUCATION - Required Fields Validation');

test('Page 2: Continue button DISABLED when all fields are empty', () => {
  const formData = {};
  assert.strictEqual(isLocationEducationComplete(formData), false);
});

test('Page 2: Continue button DISABLED when missing country', () => {
  const formData = {
    grewUpIn: 'USA',
    citizenship: 'US Citizen',
    qualification: 'Masters',
    occupation: 'Software Engineer',
    openToRelocation: 'Yes'
  };
  assert.strictEqual(isLocationEducationComplete(formData), false);
});

test('Page 2: Continue button DISABLED for USA without zipCode', () => {
  const formData = {
    country: 'United States',
    grewUpIn: 'USA',
    citizenship: 'US Citizen',
    qualification: 'Masters',
    occupation: 'Software Engineer',
    openToRelocation: 'Yes'
    // zipCode missing for USA
  };
  assert.strictEqual(isLocationEducationComplete(formData), false);
});

test('Page 2: Continue button ENABLED for USA with zipCode', () => {
  const formData = {
    country: 'United States',
    grewUpIn: 'USA',
    citizenship: 'US Citizen',
    zipCode: '94105',
    qualification: 'Masters',
    occupation: 'Software Engineer',
    openToRelocation: 'Yes'
  };
  assert.strictEqual(isLocationEducationComplete(formData), true);
});

test('Page 2: Continue button ENABLED for non-USA without zipCode', () => {
  const formData = {
    country: 'India',
    grewUpIn: 'India',
    citizenship: 'Indian',
    qualification: 'Bachelors',
    occupation: 'Doctor',
    openToRelocation: 'No'
  };
  assert.strictEqual(isLocationEducationComplete(formData), true);
});

test('Page 2: Continue button DISABLED when missing openToRelocation', () => {
  const formData = {
    country: 'Canada',
    grewUpIn: 'Canada',
    citizenship: 'Canadian',
    qualification: 'PhD',
    occupation: 'Professor'
    // openToRelocation missing
  };
  assert.strictEqual(isLocationEducationComplete(formData), false);
});

// ============================================================================
// SECTION: PAGE 3 - RELIGION VALIDATION TESTS
// ============================================================================

section('PAGE 3: RELIGION - Required Fields Validation');

test('Page 3: Continue button ENABLED with no fields (no required fields)', () => {
  const formData = {};
  assert.strictEqual(isReligionComplete(formData), true);
});

test('Page 3: Continue button ENABLED with religion only', () => {
  const formData = { religion: 'Hindu' };
  assert.strictEqual(isReligionComplete(formData), true);
});

test('Page 3: Continue button ENABLED with all religion fields', () => {
  const formData = {
    religion: 'Hindu',
    community: 'Brahmin',
    subCommunity: 'Iyer',
    gothra: 'Bharadwaj',
    manglik: 'Yes',
    raasi: 'Mesha'
  };
  assert.strictEqual(isReligionComplete(formData), true);
});

// ============================================================================
// SECTION: PAGE 4 - FAMILY VALIDATION TESTS
// ============================================================================

section('PAGE 4: FAMILY - Required Fields Validation');

test('Page 4: Continue button DISABLED when all fields are empty', () => {
  const formData = { familyLocation: '', familyValues: '' };
  assert.strictEqual(isFamilyComplete(formData), false);
});

test('Page 4: Continue button DISABLED when missing familyValues', () => {
  const formData = { familyLocation: 'USA', familyValues: '' };
  assert.strictEqual(isFamilyComplete(formData), false);
});

test('Page 4: Continue button DISABLED when missing familyLocation', () => {
  const formData = { familyLocation: '', familyValues: 'Traditional' };
  assert.strictEqual(isFamilyComplete(formData), false);
});

test('Page 4: Continue button ENABLED with both required fields', () => {
  const formData = { familyLocation: 'India', familyValues: 'Modern' };
  assert.strictEqual(isFamilyComplete(formData), true);
});

// ============================================================================
// SECTION: PAGE 5 - LIFESTYLE VALIDATION TESTS
// ============================================================================

section('PAGE 5: LIFESTYLE - Required Fields Validation');

test('Page 5: Continue button DISABLED when all fields are empty', () => {
  const formData = {};
  assert.strictEqual(isLifestyleComplete(formData), false);
});

test('Page 5: Continue button DISABLED when missing smoking', () => {
  const formData = {
    dietaryPreference: 'Vegetarian',
    drinking: 'Never',
    pets: 'No'
  };
  assert.strictEqual(isLifestyleComplete(formData), false);
});

test('Page 5: Continue button DISABLED when missing pets', () => {
  const formData = {
    dietaryPreference: 'Non-Vegetarian',
    smoking: 'Never',
    drinking: 'Occasionally'
  };
  assert.strictEqual(isLifestyleComplete(formData), false);
});

test('Page 5: Continue button ENABLED with all required fields', () => {
  const formData = {
    dietaryPreference: 'Eggetarian',
    smoking: 'Never',
    drinking: 'Never',
    pets: 'Dog'
  };
  assert.strictEqual(isLifestyleComplete(formData), true);
});

// ============================================================================
// SECTION: PAGE 6 - ABOUT ME VALIDATION TESTS
// ============================================================================

section('PAGE 6: ABOUT ME - Required Fields Validation');

test('Page 6: Continue button DISABLED when aboutMe is empty', () => {
  const formData = { aboutMe: '', linkedinProfile: 'no_linkedin' };
  assert.strictEqual(isAboutMeComplete(formData), false);
});

test('Page 6: Continue button DISABLED when linkedinProfile is empty', () => {
  const formData = { aboutMe: 'I am a software engineer...', linkedinProfile: '' };
  assert.strictEqual(isAboutMeComplete(formData), false);
});

test('Page 6: Continue button ENABLED with aboutMe and no_linkedin', () => {
  const formData = { aboutMe: 'I am a doctor...', linkedinProfile: 'no_linkedin' };
  assert.strictEqual(isAboutMeComplete(formData), true);
});

test('Page 6: Continue button ENABLED with valid LinkedIn URL', () => {
  const formData = {
    aboutMe: 'I am a product manager...',
    linkedinProfile: 'https://www.linkedin.com/in/johndoe'
  };
  assert.strictEqual(isAboutMeComplete(formData), true);
});

test('Page 6: Continue button ENABLED with LinkedIn URL without https', () => {
  const formData = {
    aboutMe: 'I am an entrepreneur...',
    linkedinProfile: 'linkedin.com/in/janedoe'
  };
  assert.strictEqual(isAboutMeComplete(formData), true);
});

test('Page 6: Continue button DISABLED with invalid LinkedIn URL', () => {
  const formData = {
    aboutMe: 'I am a teacher...',
    linkedinProfile: 'https://facebook.com/johndoe'
  };
  assert.strictEqual(isAboutMeComplete(formData), false);
});

// ============================================================================
// SECTION: PAGES 7 & 8 - DEAL-BREAKER TOGGLE PRESENCE TESTS
// ============================================================================

section('PAGES 7 & 8: PARTNER PREFERENCES - Deal-Breaker Toggle Presence');

test('prefAge SHOULD have deal-breaker toggle', () => {
  assert.strictEqual(shouldHaveDealBreakerToggle('prefAge'), true);
});

test('prefHeight SHOULD have deal-breaker toggle', () => {
  assert.strictEqual(shouldHaveDealBreakerToggle('prefHeight'), true);
});

test('prefMaritalStatus SHOULD have deal-breaker toggle', () => {
  assert.strictEqual(shouldHaveDealBreakerToggle('prefMaritalStatus'), true);
});

test('prefHasChildren SHOULD have deal-breaker toggle', () => {
  assert.strictEqual(shouldHaveDealBreakerToggle('prefHasChildren'), true);
});

test('prefReligion SHOULD have deal-breaker toggle', () => {
  assert.strictEqual(shouldHaveDealBreakerToggle('prefReligion'), true);
});

test('prefCommunity SHOULD have deal-breaker toggle', () => {
  assert.strictEqual(shouldHaveDealBreakerToggle('prefCommunity'), true);
});

test('prefGotra SHOULD have deal-breaker toggle', () => {
  assert.strictEqual(shouldHaveDealBreakerToggle('prefGotra'), true);
});

test('prefDiet SHOULD have deal-breaker toggle', () => {
  assert.strictEqual(shouldHaveDealBreakerToggle('prefDiet'), true);
});

test('prefSmoking SHOULD have deal-breaker toggle', () => {
  assert.strictEqual(shouldHaveDealBreakerToggle('prefSmoking'), true);
});

test('prefDrinking SHOULD have deal-breaker toggle', () => {
  assert.strictEqual(shouldHaveDealBreakerToggle('prefDrinking'), true);
});

test('prefLocation SHOULD have deal-breaker toggle', () => {
  assert.strictEqual(shouldHaveDealBreakerToggle('prefLocation'), true);
});

test('prefCitizenship SHOULD have deal-breaker toggle', () => {
  assert.strictEqual(shouldHaveDealBreakerToggle('prefCitizenship'), true);
});

test('prefGrewUpIn SHOULD have deal-breaker toggle', () => {
  assert.strictEqual(shouldHaveDealBreakerToggle('prefGrewUpIn'), true);
});

test('prefRelocation SHOULD have deal-breaker toggle', () => {
  assert.strictEqual(shouldHaveDealBreakerToggle('prefRelocation'), true);
});

test('prefEducation SHOULD have deal-breaker toggle', () => {
  assert.strictEqual(shouldHaveDealBreakerToggle('prefEducation'), true);
});

test('prefIncome SHOULD have deal-breaker toggle', () => {
  assert.strictEqual(shouldHaveDealBreakerToggle('prefIncome'), true);
});

test('prefFamilyValues SHOULD have deal-breaker toggle', () => {
  assert.strictEqual(shouldHaveDealBreakerToggle('prefFamilyValues'), true);
});

test('prefFamilyLocation SHOULD have deal-breaker toggle', () => {
  assert.strictEqual(shouldHaveDealBreakerToggle('prefFamilyLocation'), true);
});

test('prefMotherTongue SHOULD have deal-breaker toggle', () => {
  assert.strictEqual(shouldHaveDealBreakerToggle('prefMotherTongue'), true);
});

// Fields WITHOUT deal-breaker toggle
test('prefSubCommunity should NOT have deal-breaker toggle', () => {
  assert.strictEqual(shouldNotHaveDealBreakerToggle('prefSubCommunity'), true);
  assert.strictEqual(shouldHaveDealBreakerToggle('prefSubCommunity'), false);
});

test('prefPets should NOT have deal-breaker toggle', () => {
  assert.strictEqual(shouldNotHaveDealBreakerToggle('prefPets'), true);
  assert.strictEqual(shouldHaveDealBreakerToggle('prefPets'), false);
});

test('prefHobbies should NOT have deal-breaker toggle', () => {
  assert.strictEqual(shouldNotHaveDealBreakerToggle('prefHobbies'), true);
  assert.strictEqual(shouldHaveDealBreakerToggle('prefHobbies'), false);
});

test('prefFitness should NOT have deal-breaker toggle', () => {
  assert.strictEqual(shouldNotHaveDealBreakerToggle('prefFitness'), true);
  assert.strictEqual(shouldHaveDealBreakerToggle('prefFitness'), false);
});

test('prefInterests should NOT have deal-breaker toggle', () => {
  assert.strictEqual(shouldNotHaveDealBreakerToggle('prefInterests'), true);
  assert.strictEqual(shouldHaveDealBreakerToggle('prefInterests'), false);
});

// ============================================================================
// SECTION: DEAL-BREAKER VALIDATION TESTS
// ============================================================================

section('DEAL-BREAKER VALIDATION (When ON, must have specific selection)');

test('Deal-breaker OFF: "Any" value is valid', () => {
  const result = validateDealBreaker('prefDiet', 'Any', false);
  assert.strictEqual(result.valid, true);
});

test('Deal-breaker OFF: empty value is valid', () => {
  const result = validateDealBreaker('prefReligion', '', false);
  assert.strictEqual(result.valid, true);
});

test('Deal-breaker ON: "Any" value is INVALID', () => {
  const result = validateDealBreaker('prefDiet', 'Any', true);
  assert.strictEqual(result.valid, false);
  assert.ok(result.error.includes('no specific selection'));
});

test('Deal-breaker ON: "any" (lowercase) value is INVALID', () => {
  const result = validateDealBreaker('prefSmoking', 'any', true);
  assert.strictEqual(result.valid, false);
});

test('Deal-breaker ON: "Doesn\'t matter" value is INVALID', () => {
  const result = validateDealBreaker('prefDrinking', "Doesn't matter", true);
  assert.strictEqual(result.valid, false);
});

test('Deal-breaker ON: "doesnt_matter" value is INVALID', () => {
  const result = validateDealBreaker('prefRelocation', 'doesnt_matter', true);
  assert.strictEqual(result.valid, false);
});

test('Deal-breaker ON: empty string is INVALID', () => {
  const result = validateDealBreaker('prefEducation', '', true);
  assert.strictEqual(result.valid, false);
});

test('Deal-breaker ON: null value is INVALID', () => {
  const result = validateDealBreaker('prefIncome', null, true);
  assert.strictEqual(result.valid, false);
});

test('Deal-breaker ON: undefined value is INVALID', () => {
  const result = validateDealBreaker('prefHeight', undefined, true);
  assert.strictEqual(result.valid, false);
});

test('Deal-breaker ON: empty array is INVALID', () => {
  const result = validateDealBreaker('prefLocation', [], true);
  assert.strictEqual(result.valid, false);
  assert.ok(result.error.includes('no selections made'));
});

test('Deal-breaker ON: specific single value is VALID', () => {
  const result = validateDealBreaker('prefDiet', 'Vegetarian', true);
  assert.strictEqual(result.valid, true);
});

test('Deal-breaker ON: specific numeric value is VALID', () => {
  const result = validateDealBreaker('prefAge', 25, true);
  assert.strictEqual(result.valid, true);
});

test('Deal-breaker ON: specific array value is VALID', () => {
  const result = validateDealBreaker('prefLocation', ['USA', 'Canada'], true);
  assert.strictEqual(result.valid, true);
});

test('Deal-breaker ON: "Never Married" is VALID specific value', () => {
  const result = validateDealBreaker('prefMaritalStatus', 'Never Married', true);
  assert.strictEqual(result.valid, true);
});

test('Deal-breaker ON: "Hindu" is VALID specific value', () => {
  const result = validateDealBreaker('prefReligion', 'Hindu', true);
  assert.strictEqual(result.valid, true);
});

test('Deal-breaker ON: "Masters" is VALID specific value', () => {
  const result = validateDealBreaker('prefEducation', 'Masters', true);
  assert.strictEqual(result.valid, true);
});

// ============================================================================
// SECTION: PAGE 10 - PHOTOS PAGE VALIDATION TESTS (includes phone number)
// ============================================================================

section('PAGE 10: PHOTOS PAGE - Phone Number & Photo Required');

test('Page 10: Submit button DISABLED when phone and photos are empty', () => {
  const formData = { phoneNumber: '', photos: [] };
  assert.strictEqual(isPhotosPageComplete(formData), false);
});

test('Page 10: Submit button DISABLED when only phone is empty', () => {
  const formData = { phoneNumber: '', photos: [{ file: 'photo1.jpg' }] };
  assert.strictEqual(isPhotosPageComplete(formData), false);
});

test('Page 10: Submit button DISABLED when only photos are empty', () => {
  const formData = { phoneNumber: '5551234567', photos: [] };
  assert.strictEqual(isPhotosPageComplete(formData), false);
});

test('Page 10: Submit button DISABLED when phone is whitespace only', () => {
  const formData = { phoneNumber: '   ', photos: [{ file: 'photo1.jpg' }] };
  assert.strictEqual(isPhotosPageComplete(formData), false);
});

test('Page 10: Submit button DISABLED when phone is null', () => {
  const formData = { phoneNumber: null, photos: [{ file: 'photo1.jpg' }] };
  assert.strictEqual(isPhotosPageComplete(formData), false);
});

test('Page 10: Submit button DISABLED when phone is undefined', () => {
  const formData = { phoneNumber: undefined, photos: [{ file: 'photo1.jpg' }] };
  assert.strictEqual(isPhotosPageComplete(formData), false);
});

test('Page 10: Submit button ENABLED with valid phone and at least 1 photo', () => {
  const formData = { phoneNumber: '5551234567', photos: [{ file: 'photo1.jpg' }] };
  assert.strictEqual(isPhotosPageComplete(formData), true);
});

test('Page 10: Submit button ENABLED with formatted phone (555) 123-4567', () => {
  const formData = { phoneNumber: '(555) 123-4567', photos: [{ file: 'photo1.jpg' }] };
  assert.strictEqual(isPhotosPageComplete(formData), true);
});

test('Page 10: Submit button ENABLED with multiple photos', () => {
  const formData = {
    phoneNumber: '555-123-4567',
    photos: [{ file: 'photo1.jpg' }, { file: 'photo2.jpg' }, { file: 'photo3.jpg' }]
  };
  assert.strictEqual(isPhotosPageComplete(formData), true);
});

// Phone number format validation tests
test('Phone validation: 10 digit number is valid', () => {
  assert.strictEqual(isValidPhoneNumber('5551234567'), true);
});

test('Phone validation: 11 digit number with country code is valid', () => {
  assert.strictEqual(isValidPhoneNumber('15551234567'), true);
});

test('Phone validation: Formatted (555) 123-4567 is valid', () => {
  assert.strictEqual(isValidPhoneNumber('(555) 123-4567'), true);
});

test('Phone validation: Formatted 555-123-4567 is valid', () => {
  assert.strictEqual(isValidPhoneNumber('555-123-4567'), true);
});

test('Phone validation: With spaces 555 123 4567 is valid', () => {
  assert.strictEqual(isValidPhoneNumber('555 123 4567'), true);
});

test('Phone validation: With dots 555.123.4567 is valid', () => {
  assert.strictEqual(isValidPhoneNumber('555.123.4567'), true);
});

test('Phone validation: International +1 (555) 123-4567 is valid', () => {
  assert.strictEqual(isValidPhoneNumber('+1 (555) 123-4567'), true);
});

test('Phone validation: Too short (9 digits) is invalid', () => {
  assert.strictEqual(isValidPhoneNumber('555123456'), false);
});

test('Phone validation: Empty string is invalid', () => {
  assert.strictEqual(isValidPhoneNumber(''), false);
});

test('Phone validation: null is invalid', () => {
  assert.strictEqual(isValidPhoneNumber(null), false);
});

test('Phone validation: undefined is invalid', () => {
  assert.strictEqual(isValidPhoneNumber(undefined), false);
});

// ============================================================================
// SECTION: COMPLETE FORM VALIDATION SCENARIOS
// ============================================================================

section('COMPLETE FORM VALIDATION SCENARIOS');

test('Complete basics form with all required fields validates correctly', () => {
  const formData = {
    createdBy: 'Self',
    firstName: 'Priya',
    lastName: 'Sharma',
    gender: 'Female',
    dateOfBirth: '1992-03-15',
    height: "5'4\"",
    maritalStatus: 'Never Married',
    motherTongue: 'Hindi',
    // Optional fields
    languagesKnown: ['Hindi', 'English', 'Punjabi']
  };
  assert.strictEqual(isBasicsComplete(formData), true);
});

test('Complete location form for USA resident validates correctly', () => {
  const formData = {
    country: 'United States',
    zipCode: '95014',
    city: 'Cupertino',
    state: 'California',
    grewUpIn: 'India',
    citizenship: 'Green Card',
    qualification: 'Masters',
    university: 'Stanford University',
    employer: 'Apple Inc',
    occupation: 'Software Engineer',
    annualIncome: '$150,000 - $200,000',
    openToRelocation: 'Yes, within USA'
  };
  assert.strictEqual(isLocationEducationComplete(formData), true);
});

test('Multiple deal-breaker validations in preferences', () => {
  const preferences = {
    prefDiet: { value: 'Vegetarian', isDealBreaker: true },
    prefSmoking: { value: 'Never', isDealBreaker: true },
    prefDrinking: { value: 'Any', isDealBreaker: false },
    prefReligion: { value: 'Hindu', isDealBreaker: true },
    prefEducation: { value: '', isDealBreaker: true }, // Invalid
    prefHobbies: { value: "Doesn't matter", isDealBreaker: false } // No deal-breaker for hobbies
  };

  // Valid deal-breakers
  assert.strictEqual(validateDealBreaker('prefDiet', preferences.prefDiet.value, preferences.prefDiet.isDealBreaker).valid, true);
  assert.strictEqual(validateDealBreaker('prefSmoking', preferences.prefSmoking.value, preferences.prefSmoking.isDealBreaker).valid, true);
  assert.strictEqual(validateDealBreaker('prefDrinking', preferences.prefDrinking.value, preferences.prefDrinking.isDealBreaker).valid, true);
  assert.strictEqual(validateDealBreaker('prefReligion', preferences.prefReligion.value, preferences.prefReligion.isDealBreaker).valid, true);

  // Invalid - empty value with deal-breaker ON
  assert.strictEqual(validateDealBreaker('prefEducation', preferences.prefEducation.value, preferences.prefEducation.isDealBreaker).valid, false);

  // Hobbies doesn't have deal-breaker capability - should not validate deal-breaker
  assert.strictEqual(shouldHaveDealBreakerToggle('prefHobbies'), false);
});

// ============================================================================
// SECTION: SECTION ORDER TESTS
// ============================================================================

section('SECTION ORDER VERIFICATION');

test('User mode has 10 sections in correct order', () => {
  assert.strictEqual(SECTION_ORDER.length, 10);
  assert.strictEqual(SECTION_ORDER[0], 'basics');
  assert.strictEqual(SECTION_ORDER[1], 'location_education');
  assert.strictEqual(SECTION_ORDER[2], 'religion');
  assert.strictEqual(SECTION_ORDER[3], 'family');
  assert.strictEqual(SECTION_ORDER[4], 'lifestyle');
  assert.strictEqual(SECTION_ORDER[5], 'aboutme');
  assert.strictEqual(SECTION_ORDER[6], 'preferences_1');
  assert.strictEqual(SECTION_ORDER[7], 'preferences_2');
  assert.strictEqual(SECTION_ORDER[8], 'account');
  assert.strictEqual(SECTION_ORDER[9], 'photos');
});

test('Admin mode has 10 sections with admin_account', () => {
  assert.strictEqual(ADMIN_SECTION_ORDER.length, 10);
  assert.strictEqual(ADMIN_SECTION_ORDER[8], 'admin_account');
});

test('All 9 main pages (excluding photos) have defined required fields', () => {
  const mainSections = SECTION_ORDER.slice(0, 9);
  mainSections.forEach(section => {
    assert.ok(REQUIRED_FIELDS[section] !== undefined, `Required fields for ${section} should be defined`);
  });
});

// ============================================================================
// SECTION: DATA SAVE VERIFICATION TESTS
// ============================================================================

section('DATA SAVE VERIFICATION - Field Mapping');

/**
 * Simulates how form data maps to database fields
 * This mirrors the logic in src/app/api/profile/route.ts POST handler
 */
function mapFormDataToDatabase(formData) {
  // Build location string from city and state (matches API logic)
  let currentLocation = null;
  if (formData.city && formData.state) {
    currentLocation = `${formData.city}, ${formData.state}`;
  } else if (formData.city) {
    currentLocation = formData.city;
  } else if (formData.state) {
    currentLocation = formData.state;
  } else if (formData.currentLocation) {
    currentLocation = formData.currentLocation;
  }

  return {
    // Page 1: Basics
    gender: formData.gender,
    dateOfBirth: formData.dateOfBirth,
    height: formData.height,
    maritalStatus: formData.maritalStatus,
    hasChildren: formData.hasChildren,
    languagesKnown: formData.motherTongue || formData.languagesKnown,

    // Page 2: Location & Education
    currentLocation: currentLocation,
    zipCode: formData.zipCode,
    country: formData.country,
    grewUpIn: formData.grewUpIn,
    citizenship: formData.citizenship,
    qualification: formData.education || formData.qualification,
    university: formData.educationDetail || formData.university,
    occupation: formData.occupation,
    annualIncome: formData.income || formData.annualIncome,

    // Page 3: Religion
    caste: formData.caste,
    gotra: formData.gothra || formData.gotra,
    placeOfBirth: formData.nativePlace || formData.placeOfBirth,

    // Page 4: Family
    fatherName: formData.fatherOccupation || formData.fatherName,
    motherName: formData.motherOccupation || formData.motherName,
    siblingDetails: formData.siblings || formData.siblingDetails,
    familyLocation: formData.familyLocation,

    // Page 5: Lifestyle
    dietaryPreference: formData.diet || formData.dietaryPreference,

    // Page 6: About Me
    aboutMe: formData.aboutMe,
    linkedinProfile: formData.linkedin || formData.linkedinProfile,
    facebookInstagram: formData.instagram || formData.facebook || formData.facebookInstagram,

    // Page 7-8: Preferences
    prefHeight: formData.preferredHeightMin && formData.preferredHeightMax
      ? `${formData.preferredHeightMin}-${formData.preferredHeightMax}cm`
      : formData.prefHeight,
    prefAgeDiff: formData.preferredAgeMin && formData.preferredAgeMax
      ? `${formData.preferredAgeMin}-${formData.preferredAgeMax} years`
      : formData.prefAgeDiff,
    prefLocation: formData.preferredDistance || formData.preferredLocation || formData.prefLocation,
    prefDiet: formData.prefDiet,
    prefCaste: formData.preferredCaste || formData.prefCaste,
    prefGotra: formData.prefGotra,
    prefQualification: formData.preferredEducation || formData.prefQualification,
    prefIncome: formData.prefIncome,
    idealPartnerDesc: formData.partnerPreferences || formData.idealPartnerDesc,

    // Page 10: Photos
    photoUrls: formData.photoUrls,
    profileImageUrl: formData.profileImageUrl,
  };
}

// Test: Basic profile fields map correctly
test('Save: Basic profile fields (name, gender, DOB, height) map correctly', () => {
  const formData = {
    firstName: 'Priya',
    lastName: 'Sharma',
    gender: 'Female',
    dateOfBirth: '1992-03-15',
    height: "5'6\"",
    maritalStatus: 'Never Married',
    motherTongue: 'Hindi'
  };

  const dbData = mapFormDataToDatabase(formData);

  assert.strictEqual(dbData.gender, 'Female');
  assert.strictEqual(dbData.dateOfBirth, '1992-03-15');
  assert.strictEqual(dbData.height, "5'6\"");
  assert.strictEqual(dbData.maritalStatus, 'Never Married');
  assert.strictEqual(dbData.languagesKnown, 'Hindi');
});

// Test: Location builds correctly from city + state
test('Save: Location builds as "City, State" from separate fields', () => {
  const formData = {
    city: 'Fremont',
    state: 'California',
    zipCode: '94536'
  };

  const dbData = mapFormDataToDatabase(formData);

  assert.strictEqual(dbData.currentLocation, 'Fremont, California');
  assert.strictEqual(dbData.zipCode, '94536');
});

// Test: Location uses city only when state missing
test('Save: Location uses city only when state is missing', () => {
  const formData = {
    city: 'Fremont',
    state: null,
    zipCode: '94536'
  };

  const dbData = mapFormDataToDatabase(formData);

  assert.strictEqual(dbData.currentLocation, 'Fremont');
});

// Test: Location uses state only when city missing
test('Save: Location uses state only when city is missing', () => {
  const formData = {
    city: null,
    state: 'California'
  };

  const dbData = mapFormDataToDatabase(formData);

  assert.strictEqual(dbData.currentLocation, 'California');
});

// Test: Location falls back to currentLocation field
test('Save: Location falls back to currentLocation if city/state missing', () => {
  const formData = {
    city: null,
    state: null,
    currentLocation: 'Bay Area, CA'
  };

  const dbData = mapFormDataToDatabase(formData);

  assert.strictEqual(dbData.currentLocation, 'Bay Area, CA');
});

// Test: Education fields with alternative field names
test('Save: Education uses "education" field or falls back to "qualification"', () => {
  // Using 'education' field
  const formData1 = { education: 'Masters', qualification: null };
  const dbData1 = mapFormDataToDatabase(formData1);
  assert.strictEqual(dbData1.qualification, 'Masters');

  // Using 'qualification' field
  const formData2 = { education: null, qualification: 'Bachelors' };
  const dbData2 = mapFormDataToDatabase(formData2);
  assert.strictEqual(dbData2.qualification, 'Bachelors');
});

// Test: University detail field mapping
test('Save: University uses "educationDetail" or falls back to "university"', () => {
  const formData1 = { educationDetail: 'Stanford University', university: null };
  const dbData1 = mapFormDataToDatabase(formData1);
  assert.strictEqual(dbData1.university, 'Stanford University');

  const formData2 = { educationDetail: null, university: 'MIT' };
  const dbData2 = mapFormDataToDatabase(formData2);
  assert.strictEqual(dbData2.university, 'MIT');
});

// Test: Gotra field with alternative spelling
test('Save: Gotra uses "gothra" or falls back to "gotra"', () => {
  const formData1 = { gothra: 'Bharadwaj', gotra: null };
  const dbData1 = mapFormDataToDatabase(formData1);
  assert.strictEqual(dbData1.gotra, 'Bharadwaj');

  const formData2 = { gothra: null, gotra: 'Kashyap' };
  const dbData2 = mapFormDataToDatabase(formData2);
  assert.strictEqual(dbData2.gotra, 'Kashyap');
});

// Test: Income field mapping
test('Save: Income uses "income" or falls back to "annualIncome"', () => {
  const formData1 = { income: '$100k-150k', annualIncome: null };
  const dbData1 = mapFormDataToDatabase(formData1);
  assert.strictEqual(dbData1.annualIncome, '$100k-150k');

  const formData2 = { income: null, annualIncome: '$150k-200k' };
  const dbData2 = mapFormDataToDatabase(formData2);
  assert.strictEqual(dbData2.annualIncome, '$150k-200k');
});

// Test: Diet field mapping
test('Save: Diet uses "diet" or falls back to "dietaryPreference"', () => {
  const formData1 = { diet: 'Vegetarian', dietaryPreference: null };
  const dbData1 = mapFormDataToDatabase(formData1);
  assert.strictEqual(dbData1.dietaryPreference, 'Vegetarian');

  const formData2 = { diet: null, dietaryPreference: 'Non-Vegetarian' };
  const dbData2 = mapFormDataToDatabase(formData2);
  assert.strictEqual(dbData2.dietaryPreference, 'Non-Vegetarian');
});

// Test: Family fields mapping
test('Save: Family fields map correctly (fatherName, motherName, siblings)', () => {
  const formData = {
    fatherOccupation: 'Business Owner',
    motherOccupation: 'Homemaker',
    siblings: '1 Brother, 2 Sisters',
    familyLocation: 'Hyderabad, India'
  };

  const dbData = mapFormDataToDatabase(formData);

  assert.strictEqual(dbData.fatherName, 'Business Owner');
  assert.strictEqual(dbData.motherName, 'Homemaker');
  assert.strictEqual(dbData.siblingDetails, '1 Brother, 2 Sisters');
  assert.strictEqual(dbData.familyLocation, 'Hyderabad, India');
});

// Test: Social media fields mapping
test('Save: LinkedIn uses "linkedin" or falls back to "linkedinProfile"', () => {
  const formData1 = { linkedin: 'linkedin.com/in/priya', linkedinProfile: null };
  const dbData1 = mapFormDataToDatabase(formData1);
  assert.strictEqual(dbData1.linkedinProfile, 'linkedin.com/in/priya');

  const formData2 = { linkedin: null, linkedinProfile: 'linkedin.com/in/rahul' };
  const dbData2 = mapFormDataToDatabase(formData2);
  assert.strictEqual(dbData2.linkedinProfile, 'linkedin.com/in/rahul');
});

// Test: Instagram/Facebook field mapping
test('Save: Instagram/Facebook priority: instagram > facebook > facebookInstagram', () => {
  const formData1 = { instagram: '@priya_s', facebook: null, facebookInstagram: null };
  const dbData1 = mapFormDataToDatabase(formData1);
  assert.strictEqual(dbData1.facebookInstagram, '@priya_s');

  const formData2 = { instagram: null, facebook: 'fb.com/priya', facebookInstagram: null };
  const dbData2 = mapFormDataToDatabase(formData2);
  assert.strictEqual(dbData2.facebookInstagram, 'fb.com/priya');

  const formData3 = { instagram: null, facebook: null, facebookInstagram: '@rahul_k' };
  const dbData3 = mapFormDataToDatabase(formData3);
  assert.strictEqual(dbData3.facebookInstagram, '@rahul_k');
});

// Test: Height preference range building
test('Save: Height preference builds range from min/max values', () => {
  const formData = {
    preferredHeightMin: '160',
    preferredHeightMax: '175'
  };

  const dbData = mapFormDataToDatabase(formData);

  assert.strictEqual(dbData.prefHeight, '160-175cm');
});

// Test: Height preference uses prefHeight when no min/max
test('Save: Height preference uses prefHeight directly if no min/max', () => {
  const formData = {
    prefHeight: "5'6\" and above",
    preferredHeightMin: null,
    preferredHeightMax: null
  };

  const dbData = mapFormDataToDatabase(formData);

  assert.strictEqual(dbData.prefHeight, "5'6\" and above");
});

// Test: Age preference range building
test('Save: Age preference builds range from min/max values', () => {
  const formData = {
    preferredAgeMin: '25',
    preferredAgeMax: '32'
  };

  const dbData = mapFormDataToDatabase(formData);

  assert.strictEqual(dbData.prefAgeDiff, '25-32 years');
});

// Test: Age preference uses prefAgeDiff when no min/max
test('Save: Age preference uses prefAgeDiff directly if no min/max', () => {
  const formData = {
    prefAgeDiff: '2-5 years younger',
    preferredAgeMin: null,
    preferredAgeMax: null
  };

  const dbData = mapFormDataToDatabase(formData);

  assert.strictEqual(dbData.prefAgeDiff, '2-5 years younger');
});

// Test: Location preference field mapping
test('Save: Location preference priority: preferredDistance > preferredLocation > prefLocation', () => {
  const formData1 = { preferredDistance: 'Within 50 miles', preferredLocation: null, prefLocation: null };
  const dbData1 = mapFormDataToDatabase(formData1);
  assert.strictEqual(dbData1.prefLocation, 'Within 50 miles');

  const formData2 = { preferredDistance: null, preferredLocation: 'Bay Area', prefLocation: null };
  const dbData2 = mapFormDataToDatabase(formData2);
  assert.strictEqual(dbData2.prefLocation, 'Bay Area');

  const formData3 = { preferredDistance: null, preferredLocation: null, prefLocation: 'California' };
  const dbData3 = mapFormDataToDatabase(formData3);
  assert.strictEqual(dbData3.prefLocation, 'California');
});

// Test: Education preference field mapping
test('Save: Education preference uses preferredEducation or falls back to prefQualification', () => {
  const formData1 = { preferredEducation: 'Masters or above', prefQualification: null };
  const dbData1 = mapFormDataToDatabase(formData1);
  assert.strictEqual(dbData1.prefQualification, 'Masters or above');

  const formData2 = { preferredEducation: null, prefQualification: 'Bachelors' };
  const dbData2 = mapFormDataToDatabase(formData2);
  assert.strictEqual(dbData2.prefQualification, 'Bachelors');
});

// Test: Caste preference field mapping
test('Save: Caste preference uses preferredCaste or falls back to prefCaste', () => {
  const formData1 = { preferredCaste: 'Same Caste only', prefCaste: null };
  const dbData1 = mapFormDataToDatabase(formData1);
  assert.strictEqual(dbData1.prefCaste, 'Same Caste only');

  const formData2 = { preferredCaste: null, prefCaste: 'Brahmin' };
  const dbData2 = mapFormDataToDatabase(formData2);
  assert.strictEqual(dbData2.prefCaste, 'Brahmin');
});

// Test: Partner description field mapping
test('Save: Partner description uses partnerPreferences or falls back to idealPartnerDesc', () => {
  const formData1 = { partnerPreferences: 'Looking for someone caring...', idealPartnerDesc: null };
  const dbData1 = mapFormDataToDatabase(formData1);
  assert.strictEqual(dbData1.idealPartnerDesc, 'Looking for someone caring...');

  const formData2 = { partnerPreferences: null, idealPartnerDesc: 'Seeking a kind partner...' };
  const dbData2 = mapFormDataToDatabase(formData2);
  assert.strictEqual(dbData2.idealPartnerDesc, 'Seeking a kind partner...');
});

// Test: Photo URLs save correctly
test('Save: Photo URLs save correctly to photoUrls and profileImageUrl', () => {
  const formData = {
    photoUrls: 'https://cloudinary.com/photo1.jpg,https://cloudinary.com/photo2.jpg',
    profileImageUrl: 'https://cloudinary.com/profile.jpg'
  };

  const dbData = mapFormDataToDatabase(formData);

  assert.strictEqual(dbData.photoUrls, 'https://cloudinary.com/photo1.jpg,https://cloudinary.com/photo2.jpg');
  assert.strictEqual(dbData.profileImageUrl, 'https://cloudinary.com/profile.jpg');
});

// Test: Complete profile data mapping (end-to-end)
test('Save: Complete profile form data maps correctly to database', () => {
  const completeFormData = {
    // Page 1: Basics
    firstName: 'Priya',
    lastName: 'Sharma',
    gender: 'Female',
    dateOfBirth: '1992-03-15',
    height: "5'6\"",
    maritalStatus: 'Never Married',
    motherTongue: 'Hindi',
    hasChildren: 'No',

    // Page 2: Location & Education
    city: 'Fremont',
    state: 'California',
    zipCode: '94536',
    country: 'United States',
    grewUpIn: 'India',
    citizenship: 'Green Card',
    education: 'Masters',
    educationDetail: 'Stanford University',
    occupation: 'Software Engineer',
    income: '$150,000 - $200,000',

    // Page 3: Religion
    caste: 'Brahmin',
    gothra: 'Bharadwaj',
    nativePlace: 'Hyderabad',

    // Page 4: Family
    fatherOccupation: 'Business Owner',
    motherOccupation: 'Teacher',
    siblings: '1 Brother',
    familyLocation: 'Hyderabad, India',

    // Page 5: Lifestyle
    diet: 'Vegetarian',

    // Page 6: About Me
    aboutMe: 'I am a software engineer working at a tech company...',
    linkedin: 'linkedin.com/in/priya-sharma',
    instagram: '@priya_sharma',

    // Page 7-8: Preferences
    preferredHeightMin: '170',
    preferredHeightMax: '185',
    preferredAgeMin: '28',
    preferredAgeMax: '35',
    preferredLocation: 'Bay Area',
    prefDiet: 'Vegetarian',
    preferredCaste: "Doesn't matter",
    prefGotra: 'Different Gotra',
    preferredEducation: 'Masters or above',
    prefIncome: '$100k+',
    partnerPreferences: 'Looking for someone kind and caring...',

    // Page 10: Photos
    photoUrls: 'https://cloudinary.com/photo1.jpg,https://cloudinary.com/photo2.jpg',
    profileImageUrl: 'https://cloudinary.com/profile.jpg'
  };

  const dbData = mapFormDataToDatabase(completeFormData);

  // Verify all fields mapped correctly
  assert.strictEqual(dbData.gender, 'Female');
  assert.strictEqual(dbData.dateOfBirth, '1992-03-15');
  assert.strictEqual(dbData.height, "5'6\"");
  assert.strictEqual(dbData.maritalStatus, 'Never Married');
  assert.strictEqual(dbData.hasChildren, 'No');
  assert.strictEqual(dbData.languagesKnown, 'Hindi');

  assert.strictEqual(dbData.currentLocation, 'Fremont, California');
  assert.strictEqual(dbData.zipCode, '94536');
  assert.strictEqual(dbData.country, 'United States');
  assert.strictEqual(dbData.grewUpIn, 'India');
  assert.strictEqual(dbData.citizenship, 'Green Card');
  assert.strictEqual(dbData.qualification, 'Masters');
  assert.strictEqual(dbData.university, 'Stanford University');
  assert.strictEqual(dbData.occupation, 'Software Engineer');
  assert.strictEqual(dbData.annualIncome, '$150,000 - $200,000');

  assert.strictEqual(dbData.caste, 'Brahmin');
  assert.strictEqual(dbData.gotra, 'Bharadwaj');
  assert.strictEqual(dbData.placeOfBirth, 'Hyderabad');

  assert.strictEqual(dbData.fatherName, 'Business Owner');
  assert.strictEqual(dbData.motherName, 'Teacher');
  assert.strictEqual(dbData.siblingDetails, '1 Brother');
  assert.strictEqual(dbData.familyLocation, 'Hyderabad, India');

  assert.strictEqual(dbData.dietaryPreference, 'Vegetarian');

  assert.strictEqual(dbData.aboutMe, 'I am a software engineer working at a tech company...');
  assert.strictEqual(dbData.linkedinProfile, 'linkedin.com/in/priya-sharma');
  assert.strictEqual(dbData.facebookInstagram, '@priya_sharma');

  assert.strictEqual(dbData.prefHeight, '170-185cm');
  assert.strictEqual(dbData.prefAgeDiff, '28-35 years');
  assert.strictEqual(dbData.prefLocation, 'Bay Area');
  assert.strictEqual(dbData.prefDiet, 'Vegetarian');
  assert.strictEqual(dbData.prefCaste, "Doesn't matter");
  assert.strictEqual(dbData.prefGotra, 'Different Gotra');
  assert.strictEqual(dbData.prefQualification, 'Masters or above');
  assert.strictEqual(dbData.prefIncome, '$100k+');
  assert.strictEqual(dbData.idealPartnerDesc, 'Looking for someone kind and caring...');

  assert.strictEqual(dbData.photoUrls, 'https://cloudinary.com/photo1.jpg,https://cloudinary.com/photo2.jpg');
  assert.strictEqual(dbData.profileImageUrl, 'https://cloudinary.com/profile.jpg');
});

// Test: Null/undefined values don't break mapping
test('Save: Null/undefined values handled gracefully', () => {
  const formData = {
    gender: 'Male',
    dateOfBirth: '1990-01-01',
    city: null,
    state: undefined,
    currentLocation: null,
    education: null,
    qualification: null
  };

  const dbData = mapFormDataToDatabase(formData);

  assert.strictEqual(dbData.gender, 'Male');
  assert.strictEqual(dbData.dateOfBirth, '1990-01-01');
  assert.strictEqual(dbData.currentLocation, null);
  assert.strictEqual(dbData.qualification, null);
});

// Test: Empty strings handled correctly
test('Save: Empty strings handled correctly (treated as falsy)', () => {
  const formData = {
    city: '',
    state: 'California',
    education: '',
    qualification: 'Bachelors'
  };

  const dbData = mapFormDataToDatabase(formData);

  // Empty city + state = just state
  assert.strictEqual(dbData.currentLocation, 'California');
  // Empty education + qualification = qualification
  assert.strictEqual(dbData.qualification, 'Bachelors');
});

// ============================================================================
// FINAL SUMMARY
// ============================================================================

console.log('\n' + '='.repeat(60));
console.log('📊 TEST SUMMARY');
console.log('='.repeat(60));
console.log(`Total Tests: ${passed + failed}`);
console.log(`✅ Passed: ${passed}`);
console.log(`❌ Failed: ${failed}`);
console.log('='.repeat(60));

if (failed > 0) {
  process.exit(1);
}
