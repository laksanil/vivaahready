export interface SeoLanguage {
  slug: string
  language: string
  demonym: string
  region: string
  usPopulation: string
  culturalNotes: string[]
  nearbyPages: string[]
}

export const SEO_LANGUAGES: SeoLanguage[] = [
  {
    slug: 'telugu',
    language: 'Telugu',
    demonym: 'Telugu-speaking',
    region: 'Andhra Pradesh and Telangana',
    usPopulation: 'over 400,000 Telugu speakers in the US',
    culturalNotes: [
      'Strong presence in the tech industry, especially in the Bay Area and Texas',
      'Rich tradition of family-involved matchmaking',
      'Cultural values around education and professional achievement',
    ],
    nearbyPages: ['tamil', 'kannada', 'hindi'],
  },
  {
    slug: 'tamil',
    language: 'Tamil',
    demonym: 'Tamil-speaking',
    region: 'Tamil Nadu and Sri Lanka',
    usPopulation: 'over 300,000 Tamil speakers in the US',
    culturalNotes: [
      'Deep-rooted traditions in literature, music, and classical arts',
      'Strong communities in New Jersey, Bay Area, and Chicago',
      'Emphasis on education, cultural preservation, and family values',
    ],
    nearbyPages: ['telugu', 'kannada', 'malayalam'],
  },
  {
    slug: 'hindi',
    language: 'Hindi',
    demonym: 'Hindi-speaking',
    region: 'Uttar Pradesh, Madhya Pradesh, Rajasthan, and other Hindi-belt states',
    usPopulation: 'over 800,000 Hindi speakers in the US',
    culturalNotes: [
      'Largest Indian language community in America',
      'Widespread across all major US metro areas',
      'Diverse sub-communities including Marwari, Kayastha, and Brahmin families',
    ],
    nearbyPages: ['punjabi', 'gujarati', 'marathi'],
  },
  {
    slug: 'punjabi',
    language: 'Punjabi',
    demonym: 'Punjabi-speaking',
    region: 'Punjab (India and Pakistan)',
    usPopulation: 'over 250,000 Punjabi speakers in the US',
    culturalNotes: [
      'One of the earliest Indian immigrant communities in America',
      'Strong presence in California, New York, and New Jersey',
      'Vibrant Sikh and Hindu Punjabi community organizations',
    ],
    nearbyPages: ['hindi', 'gujarati'],
  },
  {
    slug: 'gujarati',
    language: 'Gujarati',
    demonym: 'Gujarati-speaking',
    region: 'Gujarat',
    usPopulation: 'over 300,000 Gujarati speakers in the US',
    culturalNotes: [
      'Strong entrepreneurial tradition in the US, especially in hospitality and business',
      'Active Gujarati Samaj organizations across major cities',
      'Family-oriented matchmaking traditions with emphasis on community compatibility',
    ],
    nearbyPages: ['hindi', 'marathi', 'punjabi'],
  },
  {
    slug: 'bengali',
    language: 'Bengali',
    demonym: 'Bengali-speaking',
    region: 'West Bengal and Bangladesh',
    usPopulation: 'over 150,000 Bengali speakers in the US',
    culturalNotes: [
      'Rich literary and artistic heritage influencing matchmaking preferences',
      'Strong communities in New Jersey, New York, and the Bay Area',
      'Emphasis on intellectual compatibility and cultural sophistication',
    ],
    nearbyPages: ['hindi', 'tamil'],
  },
  {
    slug: 'marathi',
    language: 'Marathi',
    demonym: 'Marathi-speaking',
    region: 'Maharashtra',
    usPopulation: 'over 200,000 Marathi speakers in the US',
    culturalNotes: [
      'Growing tech professional community in the Bay Area and Seattle',
      'Active Maharashtra Mandal organizations across major US cities',
      'Strong cultural emphasis on education and progressive values',
    ],
    nearbyPages: ['hindi', 'gujarati', 'kannada'],
  },
  {
    slug: 'kannada',
    language: 'Kannada',
    demonym: 'Kannada-speaking',
    region: 'Karnataka',
    usPopulation: 'over 150,000 Kannada speakers in the US',
    culturalNotes: [
      'Strong tech community, many from Bengaluru\'s IT sector',
      'Active Kannada Koota organizations in major US metros',
      'Growing young professional community in Seattle, Bay Area, and Dallas',
    ],
    nearbyPages: ['telugu', 'tamil', 'marathi'],
  },
]

export function getLanguageBySlug(slug: string): SeoLanguage | undefined {
  return SEO_LANGUAGES.find((l) => l.slug === slug)
}

export function getAllLanguageSlugs(): string[] {
  return SEO_LANGUAGES.map((l) => l.slug)
}
