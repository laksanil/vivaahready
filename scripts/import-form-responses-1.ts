import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Helper to normalize height to standard format (5'4")
function normalizeHeight(height: string): string | null {
  if (!height) return null;
  const h = height.trim().toLowerCase();

  // Handle formats like "5.7", "5.4", "5.2"
  if (/^\d\.\d+$/.test(h)) {
    const parts = h.split('.');
    return `${parts[0]}'${parts[1]}"`;
  }

  // Handle formats like "5' 2"", "5'4", "5ft 4 inch"
  const match = h.match(/(\d+)[\s'ft]*(\d+)?/);
  if (match) {
    const feet = match[1];
    const inches = match[2] || '0';
    return `${feet}'${inches}"`;
  }

  return height;
}

// Helper to calculate age from DOB string
function calculateAge(dob: string): number {
  // Handle formats: MM/DD/YYYY, MM/YYYY, DD/MM/YYYY, MM.DD.YYYY
  const parts = dob.replace(/\./g, '/').split('/');
  let year: number;

  if (parts.length === 2) {
    // MM/YYYY format
    year = parseInt(parts[1]);
  } else if (parts.length === 3) {
    // Check if year is first or last
    if (parts[2].length === 4) {
      year = parseInt(parts[2]);
    } else if (parts[0].length === 4) {
      year = parseInt(parts[0]);
    } else {
      year = parseInt(parts[2]) < 100 ? 2000 + parseInt(parts[2]) : parseInt(parts[2]);
    }
  } else {
    return 28; // default
  }

  const currentYear = new Date().getFullYear();
  return currentYear - year;
}

// Parse height preference range
function parseHeightPreference(pref: string): { min: string | null, max: string | null } {
  if (!pref) return { min: null, max: null };

  const p = pref.toLowerCase().trim();

  // Handle "5.5 to 5.11", "5.5 to 6'1"
  const rangeMatch = p.match(/(\d+\.?\d*)['"]*\s*(?:to|-)\s*(\d+\.?\d*)/i);
  if (rangeMatch) {
    const min = normalizeHeight(rangeMatch[1]);
    const max = normalizeHeight(rangeMatch[2]);
    return { min, max };
  }

  // Handle "5'9 and above", "Above 5'6""
  const aboveMatch = p.match(/(?:above\s*)?(\d+[.']\d+|\d+\s*'\s*\d+)['"]*\s*(?:and above|or above|\+)?/i);
  if (aboveMatch || p.includes('above')) {
    const heightMatch = p.match(/(\d+[.']\d+|\d+\s*'\s*\d+)/);
    if (heightMatch) {
      return { min: normalizeHeight(heightMatch[1]), max: null };
    }
  }

  // Handle "5ft 9inch", "5'10 or above"
  const singleMatch = p.match(/(\d+)\s*(?:ft|')\s*(\d+)/);
  if (singleMatch) {
    return { min: `${singleMatch[1]}'${singleMatch[2]}"`, max: null };
  }

  return { min: null, max: null };
}

// Parse age preference range
function parseAgePreference(pref: string, ownAge: number): { min: number, max: number } {
  if (!pref) return { min: ownAge, max: ownAge + 5 };

  const p = pref.toLowerCase().trim();

  // Handle "27-30", "28-31", "26-28"
  const rangeMatch = p.match(/(\d+)\s*[-to]\s*(\d+)/);
  if (rangeMatch) {
    return { min: parseInt(rangeMatch[1]), max: parseInt(rangeMatch[2]) };
  }

  // Handle "Upto35yrs"
  const uptoMatch = p.match(/upto\s*(\d+)/i);
  if (uptoMatch) {
    return { min: ownAge, max: parseInt(uptoMatch[1]) };
  }

  // Handle "0 to 5 years difference"
  const diffMatch = p.match(/(\d+)\s*to\s*(\d+)\s*years?\s*diff/i);
  if (diffMatch) {
    const maxDiff = parseInt(diffMatch[2]);
    return { min: ownAge, max: ownAge + maxDiff };
  }

  return { min: ownAge, max: ownAge + 5 };
}

// Map diet string
function mapDiet(diet: string): string {
  const d = (diet || '').toLowerCase();
  if (d.includes('non')) return 'Non Vegetarian';
  if (d.includes('egg')) return 'Eggetarian';
  if (d.includes('veg')) return 'Vegetarian';
  return 'No Preference';
}

// Profiles from Form Responses 1 tab (8 missing profiles)
const profiles = [
  {
    email: 'sastryng@gmail.com',
    fullName: 'Sruthi Nudurupati',
    maritalStatus: 'Single',
    dob: '03/21/1997',
    placeOfBirth: 'Hyderabad, IN',
    height: "5' 2\"",
    diet: 'Vegetarian',
    languages: '',
    phone: '9258648897',
    fatherName: 'Sastry Nudurupati',
    motherName: 'Lakshmi Kala',
    siblings: '1 younger brother',
    familyLocation: 'Folsom, CA',
    qualification: 'Masters in Healthcare Administration, CSU',
    university: 'CSU',
    occupation: 'Intern at Kaiser, looking for full time.',
    income: '',
    currentLocation: 'Fremont, CA',
    caste: 'Brahmin Vaidiki Velanadu',
    gotra: 'Koundinya',
    about: 'Travelling and Visiting New places and explore. Want to pursue studies in Healthcare domain. Spend time with Family/Friends.',
    prefHeight: '5.5 to 5.11',
    prefAge: '27-30',
    prefLocation: 'Prefer CA, open to other states within US',
    prefDiet: 'Veg/Eggterian',
    prefCaste: 'Brahmin',
    prefGotra: '',
    prefQualification: 'Undergrad/Grad',
    prefIncome: 'Later'
  },
  {
    email: 'annuk642@gmail.com',
    fullName: 'Mythili Kk',
    maritalStatus: 'Single',
    dob: '05/24/1998',
    placeOfBirth: 'Somerville, NJ',
    height: '5ft 4 inch',
    diet: 'Vegetarian',
    languages: '',
    phone: '7329567176',
    fatherName: 'Om Kk',
    motherName: 'Anu Kk',
    siblings: 'Elder brother',
    familyLocation: 'Bridgewater, NJ',
    qualification: 'Undergraduate, Rutgers University',
    university: 'Rutgers University',
    occupation: 'Admin Mgmt',
    income: '',
    currentLocation: 'New York',
    caste: 'Brahmin',
    gotra: '',
    about: 'Book reader, traveling',
    prefHeight: '5ft 9inch',
    prefAge: '26-30',
    prefLocation: 'USA citizen or Green card holder',
    prefDiet: '',
    prefCaste: '',
    prefGotra: '',
    prefQualification: '',
    prefIncome: ''
  },
  {
    email: 'rpoomi@gmail.com',
    fullName: 'Prathima Poomi',
    maritalStatus: 'Single',
    dob: '11/1994',
    placeOfBirth: 'USA',
    height: '5',
    diet: 'Eggetarian',
    languages: 'NA',
    phone: '9253377641',
    fatherName: 'Poomi',
    motherName: 'Meena',
    siblings: 'One',
    familyLocation: 'Bay area, California',
    qualification: 'BA English and Teacher Credentials',
    university: '',
    occupation: 'Public School Teacher',
    income: '',
    currentLocation: 'Bay area, California',
    caste: '',
    gotra: '',
    about: 'Singing, Hiking, Spiritual',
    prefHeight: '5.5 to 6\'1',
    prefAge: '28 to 33',
    prefLocation: 'Within bay area would be preferrable.',
    prefDiet: 'Vegetarian or eggetarian would be nice.',
    prefCaste: '',
    prefGotra: '',
    prefQualification: "At least bachelor's degree in any field completed.",
    prefIncome: ''
  },
  {
    email: 'janhavi7@gmail.com',
    fullName: 'Amulya Praana Srivatsa',
    maritalStatus: 'Single',
    dob: '07/1999',
    placeOfBirth: 'Irving, TX',
    height: "5'4",
    diet: 'Vegetarian, Eggetarian',
    languages: 'Kannada',
    phone: '469-451-9696',
    fatherName: 'Sudeendra Prahaladhan',
    motherName: 'Janhavi Sakkarepatna',
    siblings: 'Younger Brother',
    familyLocation: 'Dallas, TX',
    qualification: 'Undergrad- BS Biomedical Engineering, UT Dallas, MD , MS- 3rd year, EnMed, Texas A&M University Houston',
    university: 'UT Dallas, Texas A&M University Houston',
    occupation: 'Medical Student 3rd year',
    income: '',
    currentLocation: 'Houston',
    caste: 'Brahmin, Madhwa',
    gotra: 'Srivatsa',
    about: 'Avid Reader, Bhartnatyam ( pursued till 10th grade) , loves traveling, cooking and baking',
    prefHeight: "5'9 and above",
    prefAge: '26-28',
    prefLocation: 'Prefer Texas',
    prefDiet: 'Vegetarian, Eggetarian',
    prefCaste: 'Brahmin/ Madhwa/ Smartha',
    prefGotra: '',
    prefQualification: 'MD or pursuing Residency',
    prefIncome: ''
  },
  {
    email: 'bkashwinimaiya@gmail.com',
    fullName: 'Diwa AV',
    maritalStatus: 'Single',
    dob: '05/02/2002',
    placeOfBirth: 'Udupi',
    height: '5\'6"',
    diet: 'Vegetarian',
    languages: 'Kannadiga',
    phone: '6508232148',
    fatherName: 'Vittala P',
    motherName: 'Ashwini',
    siblings: 'one younger sister',
    familyLocation: 'Pleasanton',
    qualification: 'B.S. Technology and Information Management at UCSC',
    university: 'UCSC',
    occupation: 'Engineer',
    income: '',
    currentLocation: 'Pleasanton, CA',
    caste: 'Havyaka Brahmin',
    gotra: 'Vishwamitra',
    about: 'Art, Hiking',
    prefHeight: "5'10 or above",
    prefAge: '0 to 5 years difference',
    prefLocation: '',
    prefDiet: 'Vegetarian',
    prefCaste: 'Brahmin',
    prefGotra: '',
    prefQualification: '',
    prefIncome: ''
  },
  {
    email: 'padhmajaaenumulla@gmail.com',
    fullName: 'Meghana krishna',
    maritalStatus: 'Single',
    dob: '12.13.1995',
    placeOfBirth: 'Guntur, india',
    height: '5.7',
    diet: 'Non vegetarian',
    languages: 'Telugu',
    phone: '+447722185007',
    fatherName: 'Sridhar rao.enumula',
    motherName: 'Padmaja',
    siblings: 'Harshitha one sister.',
    familyLocation: 'London',
    qualification: 'Resident doctor in reading,PA',
    university: '',
    occupation: 'Doctor',
    income: '',
    currentLocation: 'Reading,pennsylvania',
    caste: 'Kapu',
    gotra: 'Koundinyasa',
    about: 'Cooking,trekking, photography',
    prefHeight: 'Above 5.7',
    prefAge: 'Upto35yrs',
    prefLocation: 'Usa',
    prefDiet: 'Any',
    prefCaste: 'Any',
    prefGotra: '',
    prefQualification: 'Doctor',
    prefIncome: 'Any'
  },
  {
    email: 'jayashreedublin@gmail.com',
    fullName: 'Monishaa s',
    maritalStatus: 'Single',
    dob: '06/1997',
    placeOfBirth: '',
    height: '5.7',
    diet: 'Vegetarian + eggs',
    languages: '',
    phone: '+1 925-818-4912',
    fatherName: 'Suresh',
    motherName: 'Jayashree',
    siblings: 'No',
    familyLocation: 'Dublin, CA',
    qualification: 'JD, George Washington',
    university: 'George Washington',
    occupation: 'Attorney',
    income: '',
    currentLocation: 'Washington DC',
    caste: 'Vadama, Tamil Brahmin',
    gotra: 'Kausika',
    about: 'Music, painting, hiking, travelling',
    prefHeight: '5.9 and above',
    prefAge: '28-32',
    prefLocation: '',
    prefDiet: 'Vegetarian or Ovo-vegetarian',
    prefCaste: 'Brahmin',
    prefGotra: '',
    prefQualification: '',
    prefIncome: ''
  },
  {
    email: 'ramabaskar@gmail.com',
    fullName: 'Akhshaya Baskar',
    maritalStatus: 'Single',
    dob: '08/1995',
    placeOfBirth: 'Fremont, California',
    height: '5.4',
    diet: 'Vegetarian',
    languages: '',
    phone: '4083096706',
    fatherName: 'Sam baskar',
    motherName: 'Rama Baskar',
    siblings: 'None',
    familyLocation: 'Fremont, California',
    qualification: 'BS, CS',
    university: '',
    occupation: 'Computer mgmt',
    income: '',
    currentLocation: 'Bay Area, California',
    caste: 'Vysya chettiar',
    gotra: 'Upamannu gula gotra',
    about: 'Reading, solving puzzles, gardening, dance, choreography',
    prefHeight: '5.9 - 6',
    prefAge: '30-35',
    prefLocation: 'Bay area',
    prefDiet: 'Vegetarian',
    prefCaste: '',
    prefGotra: '',
    prefQualification: '',
    prefIncome: ''
  }
];

// Citizenship inference based on place of birth
function inferCitizenship(placeOfBirth: string): string {
  const pob = (placeOfBirth || '').toLowerCase();

  const usPlaces = ['california', 'ca', 'texas', 'tx', 'new jersey', 'nj', 'mountain view', 'fremont',
                    'michigan', 'ohio', 'virginia', 'va', 'alabama', 'maryland', 'boston', 'massachusetts',
                    'ma', 'new york', 'ny', 'seattle', 'wa', 'colorado', 'pittsburgh', 'pa', 'princeton',
                    'reno', 'nevada', 'detroit', 'san jose', 'santa clara', 'newark', 'usa', 'u.s.a', 'torrance',
                    'huntsville', 'irving', 'somerville', 'bridgewater', 'houston', 'dallas'];

  const indianPlaces = ['bangalore', 'bengaluru', 'india', 'trichy', 'hyderabad', 'chennai', 'mumbai',
                        'delhi', 'kolkata', 'pune', 'karnataka', 'udupi', 'guntur'];

  if (usPlaces.some(place => pob.includes(place))) {
    return 'USA';
  } else if (indianPlaces.some(place => pob.includes(place))) {
    return 'India';
  }

  return 'India'; // default
}

async function importProfiles() {
  console.log('Starting import of 8 profiles from Form Responses 1...\n');

  for (const p of profiles) {
    console.log(`Processing: ${p.fullName} (${p.email})`);

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: p.email }
    });

    if (existingUser) {
      console.log(`  -> User already exists, skipping\n`);
      continue;
    }

    // Parse name
    const nameParts = p.fullName.trim().split(/\s+/);
    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(' ') || nameParts[0];

    // Calculate age
    const age = calculateAge(p.dob);

    // Parse height
    const height = normalizeHeight(p.height);

    // Parse diet
    const diet = mapDiet(p.diet);

    // Parse preferences
    const heightPref = parseHeightPreference(p.prefHeight);
    const agePref = parseAgePreference(p.prefAge, age);

    // Infer citizenship
    const citizenship = inferCitizenship(p.placeOfBirth);

    // Parse location
    const locationParts = (p.currentLocation || '').split(',').map(s => s.trim());
    const city = locationParts[0] || '';
    const state = locationParts[1] || '';

    // Create user
    const user = await prisma.user.create({
      data: {
        email: p.email,
        name: p.fullName
      }
    });

    // Create profile
    const profile = await prisma.profile.create({
      data: {
        userId: user.id,
        firstName,
        lastName,
        gender: 'female',
        dateOfBirth: p.dob,
        age: String(age),
        height,
        maritalStatus: 'Single',
        dietaryPreference: diet,
        citizenship,
        placeOfBirth: p.placeOfBirth,
        currentLocation: p.currentLocation,

        // Family
        fatherName: p.fatherName,
        motherName: p.motherName,
        siblingDetails: p.siblings,
        familyLocation: p.familyLocation,

        // Education & Career
        qualification: p.qualification,
        university: p.university,
        occupation: p.occupation,
        annualIncome: p.income || null,

        // Cultural
        religion: 'Hindu',
        community: p.caste,
        gotra: p.gotra,
        motherTongue: p.languages || 'Telugu',
        languagesKnown: p.languages || '',

        // About
        aboutMe: p.about,
        hobbies: p.about || '',

        // Partner Preferences - Age (females want same or older)
        prefAgeMin: String(age),
        prefAgeMax: String(agePref.max),
        prefAgeIsDealbreaker: true,

        // Partner Preferences - Height (females: min only, max can be null)
        prefHeightMin: heightPref.min,
        prefHeightMax: heightPref.max,
        prefHeightIsDealbreaker: heightPref.min !== null,

        // Partner Preferences - Diet
        prefDiet: p.prefDiet ? mapDiet(p.prefDiet) : null,
        prefDietIsDealbreaker: false,

        // Partner Preferences - Location
        prefLocation: p.prefLocation || null,
        prefLocationIsDealbreaker: false,

        // Partner Preferences - Community
        prefCommunity: p.prefCaste || null,
        prefCommunityIsDealbreaker: p.prefCaste?.toLowerCase().includes('brahmin') || false,

        // Partner Preferences - Gotra (different gotra only)
        prefGotra: p.gotra ? `Not ${p.gotra}` : null,
        prefGotraIsDealbreaker: !!p.gotra,

        // Partner Preferences - Qualification
        prefQualification: p.prefQualification || 'Bachelors or higher',

        // Partner Preferences - Citizenship (NOT a deal breaker)
        prefCitizenship: 'USA',
        prefCitizenshipIsDealbreaker: false,

        // Status
        approvalStatus: 'approved',
        isVerified: true,
        isActive: true,
        isImported: true,
      }
    });

    // Create subscription
    await prisma.subscription.create({
      data: {
        userId: user.id,
        plan: 'free',
        status: 'active',
      }
    });

    console.log(`  -> Created: ${firstName} ${lastName}, Age: ${age}, Height: ${height}, Citizenship: ${citizenship}`);
    console.log(`     Pref Age: ${age}-${agePref.max}, Pref Height: ${heightPref.min || 'any'} - ${heightPref.max || 'any'}\n`);
  }

  console.log('Import complete!');

  // Summary
  const totalProfiles = await prisma.profile.count({ where: { isImported: true } });
  const femaleCount = await prisma.profile.count({ where: { isImported: true, gender: 'female' } });
  const maleCount = await prisma.profile.count({ where: { isImported: true, gender: 'male' } });

  console.log(`\nTotal imported profiles: ${totalProfiles}`);
  console.log(`  Female: ${femaleCount}`);
  console.log(`  Male: ${maleCount}`);
}

importProfiles()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
