// Centralized configuration for April 2026 event
export const MARCH_EVENT_CONFIG = {
  slug: 'april-2026-vegetarian',
  priceDollars: 25,
  title: 'Singles Zoom Mixer',
  subtitle: 'April Edition',
}

// Returns the event date
export function getMarchEventDate(): Date {
  return new Date('2026-04-05T11:00:00-07:00')
}
