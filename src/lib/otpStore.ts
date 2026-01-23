// In-memory OTP store
// In production, use Redis or database for persistence across serverless functions

interface OtpEntry {
  otp: string
  expiresAt: Date
}

// Global store that persists across API calls (in development)
// Note: This won't work in serverless/edge environments - use Redis or database instead
const globalStore = global as typeof globalThis & {
  otpStore?: Map<string, OtpEntry>
}

if (!globalStore.otpStore) {
  globalStore.otpStore = new Map<string, OtpEntry>()
}

export const otpStore = globalStore.otpStore

export function generateOtp(digits: number = 4): string {
  if (digits === 4) {
    return Math.floor(1000 + Math.random() * 9000).toString()
  }
  // 6 digits for backward compatibility
  return Math.floor(100000 + Math.random() * 900000).toString()
}

export function setOtp(type: 'email' | 'phone', userId: string, otp: string, expiresInMinutes: number = 10) {
  const expiresAt = new Date(Date.now() + expiresInMinutes * 60 * 1000)
  otpStore.set(`${type}:${userId}`, { otp, expiresAt })
}

export function verifyOtp(type: 'email' | 'phone', userId: string, otp: string): { valid: boolean; error?: string } {
  const key = `${type}:${userId}`
  const stored = otpStore.get(key)

  if (!stored) {
    return { valid: false, error: 'No verification code found. Please request a new one.' }
  }

  if (new Date() > stored.expiresAt) {
    otpStore.delete(key)
    return { valid: false, error: 'Verification code expired. Please request a new one.' }
  }

  if (stored.otp !== otp) {
    return { valid: false, error: 'Invalid verification code' }
  }

  // Clear the OTP after successful verification
  otpStore.delete(key)
  return { valid: true }
}
