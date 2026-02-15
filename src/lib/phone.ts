/**
 * Normalize phone to E.164 format.
 * Accepts values like +14085551234, 14085551234, (408) 555-1234, 408-555-1234.
 * Returns null for invalid/short values.
 */
export function normalizePhoneE164(raw: string | null | undefined): string | null {
  if (!raw) return null

  const stripped = raw.replace(/[^\d+]/g, '')
  let digits = stripped.replace(/\+/g, '')

  if (digits.length < 10) return null

  // Assume US country code when only 10 digits are provided.
  if (digits.length === 10) {
    digits = `1${digits}`
  }

  if (digits.length < 11 || digits.length > 15) return null

  return `+${digits}`
}

export function getPhoneLast4(phone: string | null | undefined): string {
  if (!phone) return ''
  const normalized = normalizePhoneE164(phone)
  const digits = (normalized || phone).replace(/\D/g, '')
  return digits.length >= 4 ? digits.slice(-4) : ''
}

/**
 * Mask a normalized phone for admin table display.
 * Example: +14085551234 -> +1******1234
 */
export function maskPhone(phone: string | null | undefined): string {
  if (!phone) return ''

  const normalized = normalizePhoneE164(phone)
  if (!normalized) return phone

  const digits = normalized.slice(1) // strip leading +
  const countryCodeLength = Math.max(1, digits.length - 10)
  const countryCode = digits.slice(0, countryCodeLength)
  const last4 = digits.slice(-4)
  const hiddenLength = Math.max(4, digits.length - countryCodeLength - 4)

  return `+${countryCode}${'*'.repeat(hiddenLength)}${last4}`
}
