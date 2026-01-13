// Height options for dropdown (4'6" to 7'0")
export const HEIGHT_OPTIONS = [
  { value: "4'6\"", label: "4'6\" (137 cm)" },
  { value: "4'7\"", label: "4'7\" (140 cm)" },
  { value: "4'8\"", label: "4'8\" (142 cm)" },
  { value: "4'9\"", label: "4'9\" (145 cm)" },
  { value: "4'10\"", label: "4'10\" (147 cm)" },
  { value: "4'11\"", label: "4'11\" (150 cm)" },
  { value: "5'0\"", label: "5'0\" (152 cm)" },
  { value: "5'1\"", label: "5'1\" (155 cm)" },
  { value: "5'2\"", label: "5'2\" (157 cm)" },
  { value: "5'3\"", label: "5'3\" (160 cm)" },
  { value: "5'4\"", label: "5'4\" (163 cm)" },
  { value: "5'5\"", label: "5'5\" (165 cm)" },
  { value: "5'6\"", label: "5'6\" (168 cm)" },
  { value: "5'7\"", label: "5'7\" (170 cm)" },
  { value: "5'8\"", label: "5'8\" (173 cm)" },
  { value: "5'9\"", label: "5'9\" (175 cm)" },
  { value: "5'10\"", label: "5'10\" (178 cm)" },
  { value: "5'11\"", label: "5'11\" (180 cm)" },
  { value: "6'0\"", label: "6'0\" (183 cm)" },
  { value: "6'1\"", label: "6'1\" (185 cm)" },
  { value: "6'2\"", label: "6'2\" (188 cm)" },
  { value: "6'3\"", label: "6'3\" (191 cm)" },
  { value: "6'4\"", label: "6'4\" (193 cm)" },
  { value: "6'5\"", label: "6'5\" (196 cm)" },
  { value: "6'6\"", label: "6'6\" (198 cm)" },
  { value: "6'7\"", label: "6'7\" (201 cm)" },
  { value: "6'8\"", label: "6'8\" (203 cm)" },
  { value: "6'9\"", label: "6'9\" (206 cm)" },
  { value: "6'10\"", label: "6'10\" (208 cm)" },
  { value: "6'11\"", label: "6'11\" (211 cm)" },
  { value: "7'0\"", label: "7'0\" (213 cm)" },
]

// Preferred Age Range options
export const PREF_AGE_OPTIONS = [
  { value: "doesnt_matter", label: "Doesn't matter" },
  { value: "same_age", label: "Same age (±1 year)" },
  { value: "1-3_younger", label: "1-3 years younger" },
  { value: "1-3_older", label: "1-3 years older" },
  { value: "3-5_younger", label: "3-5 years younger" },
  { value: "3-5_older", label: "3-5 years older" },
  { value: "5+_younger", label: "5+ years younger" },
  { value: "5+_older", label: "5+ years older" },
]

// Preferred Income options (minimum)
export const PREF_INCOME_OPTIONS = [
  { value: "doesnt_matter", label: "Doesn't matter" },
  { value: "50k+", label: "$50k+" },
  { value: "75k+", label: "$75k+" },
  { value: "100k+", label: "$100k+" },
  { value: "150k+", label: "$150k+" },
  { value: "200k+", label: "$200k+" },
]

// Preferred Location options
export const PREF_LOCATION_OPTIONS = [
  { value: "doesnt_matter", label: "Doesn't matter" },
  { value: "usa", label: "Anywhere in USA" },
  // Specific regions
  { value: "bay_area", label: "Bay Area, California" },
  { value: "southern_california", label: "Southern California (LA, San Diego)" },
  // States
  { value: "california", label: "California" },
  { value: "texas", label: "Texas" },
  { value: "new_york", label: "New York" },
  { value: "new_jersey", label: "New Jersey" },
  { value: "washington", label: "Washington" },
  { value: "illinois", label: "Illinois" },
  { value: "massachusetts", label: "Massachusetts" },
  { value: "georgia", label: "Georgia" },
  { value: "virginia", label: "Virginia" },
  { value: "north_carolina", label: "North Carolina" },
  { value: "pennsylvania", label: "Pennsylvania" },
  { value: "florida", label: "Florida" },
  { value: "colorado", label: "Colorado" },
  { value: "arizona", label: "Arizona" },
  { value: "maryland", label: "Maryland" },
  { value: "ohio", label: "Ohio" },
  { value: "michigan", label: "Michigan" },
  { value: "minnesota", label: "Minnesota" },
  { value: "indiana", label: "Indiana" },
  { value: "missouri", label: "Missouri" },
  { value: "other_state", label: "Other US State" },
  { value: "open_to_relocation", label: "Open to relocation" },
]

// Education/Qualification options for profile
// Level: 1=High School, 2=Undergrad, 3=Masters, 4=Doctorate
// Medical: MBBS=Undergrad, MD/MS=Masters, DM/MCh=Doctorate
export const QUALIFICATION_OPTIONS = [
  { value: "high_school", label: "High School / 12th", level: 1 },
  { value: "diploma", label: "Diploma / Associate's", level: 1 },
  // Undergrad (Bachelor's)
  { value: "undergrad", label: "Undergrad (BA, BSc, BCom, BBA)", level: 2 },
  { value: "undergrad_eng", label: "Engineering - Undergrad (BE, BTech)", level: 2 },
  { value: "undergrad_cs", label: "Computer Science - Undergrad (BSc CS, BCA, BTech CS)", level: 2 },
  { value: "mbbs", label: "Medical - MBBS", level: 2 },
  { value: "bds", label: "Dental - BDS", level: 2 },
  { value: "llb", label: "Law - LLB / JD", level: 2 },
  // Masters
  { value: "masters", label: "Masters (MA, MSc, MCom)", level: 3 },
  { value: "masters_eng", label: "Engineering - Masters (ME, MTech)", level: 3 },
  { value: "masters_cs", label: "Computer Science - Masters (MSc CS, MCA, MTech CS)", level: 3 },
  { value: "mba", label: "MBA", level: 3 },
  { value: "md", label: "Medical - MD / MS", level: 3 },
  { value: "ca_cpa", label: "CA / CPA (Chartered Accountant)", level: 3 },
  { value: "cs", label: "CS (Company Secretary)", level: 3 },
  { value: "llm", label: "Law - LLM", level: 3 },
  // Doctorate
  { value: "phd", label: "PhD / Doctorate", level: 4 },
  { value: "dm_mch", label: "Medical - DM / MCh (Super Specialty)", level: 4 },
  { value: "other", label: "Other", level: 2 },
]

// Preferred Education options for partner preferences
// type: 'level' = matches this level or higher, 'category' = specific category only
export const PREF_EDUCATION_OPTIONS = [
  { value: "doesnt_matter", label: "Doesn't matter", type: "any" },
  { value: "undergrad", label: "Undergrad or higher", type: "level", minLevel: 2 },
  { value: "masters", label: "Masters or higher", type: "level", minLevel: 3 },
  // Engineering
  { value: "eng_undergrad", label: "Engineering - Undergrad (BE/BTech)", type: "category", categories: ["undergrad_eng", "bachelors_eng"] },
  { value: "eng_masters", label: "Engineering - Masters (ME/MTech)", type: "category", categories: ["masters_eng"] },
  // Computer Science
  { value: "cs_undergrad", label: "Computer Science - Undergrad", type: "category", categories: ["undergrad_cs", "bachelors_cs"] },
  { value: "cs_masters", label: "Computer Science - Masters", type: "category", categories: ["masters_cs"] },
  // Medical
  { value: "medical_undergrad", label: "Medical - MBBS/BDS", type: "category", categories: ["mbbs", "bds"] },
  { value: "medical_masters", label: "Medical - MD/MS", type: "category", categories: ["md", "ms_medical"] },
  // Other Professional
  { value: "mba", label: "MBA", type: "category", categories: ["mba"] },
  { value: "ca_professional", label: "CA / CPA / CS", type: "category", categories: ["ca_cpa", "cs"] },
  { value: "law", label: "Law (LLB/LLM)", type: "category", categories: ["llb", "llm"] },
  { value: "doctorate", label: "Doctorate (PhD/DM/MCh)", type: "category", categories: ["phd", "dm_mch"] },
]

// Hobbies options (Shaadi.com style)
export const HOBBIES_OPTIONS = [
  'Art & Crafts',
  'Blogging',
  'Board Games',
  'Cooking',
  'Dancing',
  'DIY Projects',
  'Gardening',
  'Gaming',
  'Listening to Music',
  'Movies & TV Shows',
  'Musical Instruments',
  'Painting',
  'Photography',
  'Playing Cards',
  'Podcasts',
  'Poetry',
  'Reading',
  'Singing',
  'Social Media',
  'Travelling',
  'Video Making',
  'Volunteering',
  'Writing',
]

// Fitness & Sports options
export const FITNESS_OPTIONS = [
  'Badminton',
  'Basketball',
  'Biking / Cycling',
  'Cricket',
  'Football / Soccer',
  'Golf',
  'Gym / Weight Training',
  'Hiking / Trekking',
  'Martial Arts',
  'Meditation',
  'Pilates',
  'Running / Jogging',
  'Swimming',
  'Table Tennis',
  'Tennis',
  'Walking',
  'Yoga',
  'Zumba / Aerobics',
]

// Interests options
export const INTERESTS_OPTIONS = [
  'Astronomy',
  'Automobiles',
  'Business & Investing',
  'Cars & Bikes',
  'Current Affairs',
  'Environment & Sustainability',
  'Fashion & Style',
  'Finance & Stocks',
  'Food & Cuisine',
  'Health & Wellness',
  'History',
  'Home Decor',
  'Languages',
  'Nature & Wildlife',
  'News & Politics',
  'Personal Development',
  'Pets & Animals',
  'Psychology',
  'Science & Technology',
  'Spirituality',
  'Sports',
  'Startups',
  'Travel & Adventure',
]

// Occupation options for profile
export const OCCUPATION_OPTIONS = [
  { value: "software_engineer", label: "Software Engineer / Developer" },
  { value: "data_scientist", label: "Data Scientist / ML Engineer" },
  { value: "product_manager", label: "Product Manager" },
  { value: "business_analyst", label: "Business Analyst" },
  { value: "doctor", label: "Doctor / Physician" },
  { value: "dentist", label: "Dentist" },
  { value: "nurse", label: "Nurse / Healthcare" },
  { value: "pharmacist", label: "Pharmacist" },
  { value: "lawyer", label: "Lawyer / Attorney" },
  { value: "ca_accountant", label: "CA / CPA / Accountant" },
  { value: "consultant", label: "Consultant" },
  { value: "banker", label: "Banker / Finance" },
  { value: "teacher_professor", label: "Teacher / Professor" },
  { value: "researcher", label: "Researcher / Scientist" },
  { value: "government", label: "Government Employee" },
  { value: "business_owner", label: "Business Owner / Entrepreneur" },
  { value: "student", label: "Student" },
  { value: "homemaker", label: "Homemaker" },
  { value: "other", label: "Other" },
]
