export interface SeoLocation {
  slug: string
  city: string
  state: string
  stateAbbr: string
  metro?: string
  lat: number
  lng: number
  population: string
  highlights: string[]
  nearbyPages: string[]
}

export const SEO_LOCATIONS: SeoLocation[] = [
  {
    slug: 'new-york',
    city: 'New York',
    state: 'New York',
    stateAbbr: 'NY',
    metro: 'New York Metropolitan Area',
    lat: 40.7128,
    lng: -74.006,
    population: 'over 800,000 Indian Americans',
    highlights: [
      'Largest Indian community on the East Coast',
      'Vibrant cultural organizations and temples',
      'Active South Asian professional networks',
    ],
    nearbyPages: ['new-jersey', 'philadelphia', 'boston'],
  },
  {
    slug: 'bay-area',
    city: 'Bay Area',
    state: 'California',
    stateAbbr: 'CA',
    metro: 'San Francisco Bay Area',
    lat: 37.3861,
    lng: -122.0839,
    population: 'over 600,000 Indian Americans',
    highlights: [
      'Hub of Indian tech professionals in Silicon Valley',
      'Strong Telugu and Tamil communities',
      'Thriving South Asian cultural scene',
    ],
    nearbyPages: ['los-angeles', 'seattle'],
  },
  {
    slug: 'chicago',
    city: 'Chicago',
    state: 'Illinois',
    stateAbbr: 'IL',
    metro: 'Chicago Metropolitan Area',
    lat: 41.8781,
    lng: -87.6298,
    population: 'over 200,000 Indian Americans',
    highlights: [
      'Growing Indian professional community in the Midwest',
      'Devon Avenue — one of America\'s most vibrant Indian neighborhoods',
      'Strong Gujarati and Punjabi communities',
    ],
    nearbyPages: ['detroit', 'dallas'],
  },
  {
    slug: 'houston',
    city: 'Houston',
    state: 'Texas',
    stateAbbr: 'TX',
    metro: 'Houston Metropolitan Area',
    lat: 29.7604,
    lng: -95.3698,
    population: 'over 200,000 Indian Americans',
    highlights: [
      'Rapidly growing Indian diaspora in Texas',
      'Strong presence in energy, healthcare, and tech sectors',
      'Vibrant Hillcroft and Mahatma Gandhi District communities',
    ],
    nearbyPages: ['dallas', 'austin'],
  },
  {
    slug: 'dallas',
    city: 'Dallas',
    state: 'Texas',
    stateAbbr: 'TX',
    metro: 'Dallas-Fort Worth Metroplex',
    lat: 32.7767,
    lng: -96.797,
    population: 'over 150,000 Indian Americans',
    highlights: [
      'Booming tech corridor attracting Indian professionals',
      'Plano and Irving have large South Asian populations',
      'Active Telugu and Tamil community organizations',
    ],
    nearbyPages: ['houston', 'austin'],
  },
  {
    slug: 'atlanta',
    city: 'Atlanta',
    state: 'Georgia',
    stateAbbr: 'GA',
    metro: 'Atlanta Metropolitan Area',
    lat: 33.749,
    lng: -84.388,
    population: 'over 100,000 Indian Americans',
    highlights: [
      'Fast-growing Indian community in the Southeast',
      'Strong Telugu community in Alpharetta and Johns Creek',
      'Growing hub for Indian IT professionals',
    ],
    nearbyPages: ['houston', 'washington-dc'],
  },
  {
    slug: 'los-angeles',
    city: 'Los Angeles',
    state: 'California',
    stateAbbr: 'CA',
    metro: 'Los Angeles Metropolitan Area',
    lat: 34.0522,
    lng: -118.2437,
    population: 'over 200,000 Indian Americans',
    highlights: [
      'Diverse Indian community spanning entertainment, tech, and healthcare',
      'Artesia\'s Little India — a cultural landmark',
      'Active Punjabi and Gujarati communities',
    ],
    nearbyPages: ['bay-area', 'phoenix'],
  },
  {
    slug: 'seattle',
    city: 'Seattle',
    state: 'Washington',
    stateAbbr: 'WA',
    metro: 'Seattle Metropolitan Area',
    lat: 47.6062,
    lng: -122.3321,
    population: 'over 150,000 Indian Americans',
    highlights: [
      'Major tech hub with Amazon, Microsoft, and Google presence',
      'Strong Indian professional community in Bellevue and Redmond',
      'Active cultural organizations and tech meetups',
    ],
    nearbyPages: ['bay-area'],
  },
  {
    slug: 'boston',
    city: 'Boston',
    state: 'Massachusetts',
    stateAbbr: 'MA',
    metro: 'Greater Boston Area',
    lat: 42.3601,
    lng: -71.0589,
    population: 'over 100,000 Indian Americans',
    highlights: [
      'Academic hub with MIT, Harvard, and leading research institutions',
      'Growing biotech and healthcare Indian professional community',
      'Strong student and young professional South Asian networks',
    ],
    nearbyPages: ['new-york', 'new-jersey'],
  },
  {
    slug: 'washington-dc',
    city: 'Washington DC',
    state: 'District of Columbia',
    stateAbbr: 'DC',
    metro: 'Washington DC Metropolitan Area',
    lat: 38.9072,
    lng: -77.0369,
    population: 'over 150,000 Indian Americans',
    highlights: [
      'Indian professionals in government, policy, and consulting',
      'Strong South Asian community in Northern Virginia and Maryland',
      'Active cultural and professional organizations',
    ],
    nearbyPages: ['philadelphia', 'new-jersey', 'new-york'],
  },
  {
    slug: 'new-jersey',
    city: 'New Jersey',
    state: 'New Jersey',
    stateAbbr: 'NJ',
    metro: 'New Jersey / New York Metro',
    lat: 40.0583,
    lng: -74.4057,
    population: 'over 400,000 Indian Americans',
    highlights: [
      'Highest concentration of Indian Americans per capita in the US',
      'Edison and Jersey City are cultural hubs',
      'Strong Gujarati, Telugu, and Tamil communities',
    ],
    nearbyPages: ['new-york', 'philadelphia'],
  },
  {
    slug: 'philadelphia',
    city: 'Philadelphia',
    state: 'Pennsylvania',
    stateAbbr: 'PA',
    metro: 'Greater Philadelphia Area',
    lat: 39.9526,
    lng: -75.1652,
    population: 'over 100,000 Indian Americans',
    highlights: [
      'Growing Indian community in healthcare, pharma, and academia',
      'King of Prussia and Cherry Hill suburbs have strong South Asian presence',
      'Proximity to both New York and Washington DC',
    ],
    nearbyPages: ['new-jersey', 'new-york', 'washington-dc'],
  },
  {
    slug: 'phoenix',
    city: 'Phoenix',
    state: 'Arizona',
    stateAbbr: 'AZ',
    metro: 'Phoenix Metropolitan Area',
    lat: 33.4484,
    lng: -112.074,
    population: 'over 50,000 Indian Americans',
    highlights: [
      'Emerging Indian tech community in the Southwest',
      'Affordable living attracting young Indian professionals',
      'Growing Chandler and Tempe South Asian communities',
    ],
    nearbyPages: ['los-angeles', 'dallas'],
  },
  {
    slug: 'detroit',
    city: 'Detroit',
    state: 'Michigan',
    stateAbbr: 'MI',
    metro: 'Detroit Metropolitan Area',
    lat: 42.3314,
    lng: -83.0458,
    population: 'over 80,000 Indian Americans',
    highlights: [
      'Strong Indian community in Troy, Novi, and Canton',
      'Automotive and tech sectors employ many Indian professionals',
      'Active community organizations and cultural events',
    ],
    nearbyPages: ['chicago'],
  },
  {
    slug: 'austin',
    city: 'Austin',
    state: 'Texas',
    stateAbbr: 'TX',
    metro: 'Austin Metropolitan Area',
    lat: 30.2672,
    lng: -97.7431,
    population: 'over 60,000 Indian Americans',
    highlights: [
      'Booming tech scene attracting Indian professionals',
      'Young and growing South Asian community',
      'Active startup and professional networking scene',
    ],
    nearbyPages: ['dallas', 'houston'],
  },
]

export function getLocationBySlug(slug: string): SeoLocation | undefined {
  return SEO_LOCATIONS.find((l) => l.slug === slug)
}

export function getAllLocationSlugs(): string[] {
  return SEO_LOCATIONS.map((l) => l.slug)
}
