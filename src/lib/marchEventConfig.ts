// Centralized configuration for March 2025 event
export const MARCH_EVENT_CONFIG = {
  slug: 'march-2025-vegetarian',
  priceDollars: 25,
  title: 'Singles Zoom Mixer',
  subtitle: 'Vegetarian Edition',
}

// Returns the event date
export function getMarchEventDate(): Date {
  return new Date('2025-03-15T18:00:00-08:00')
}
