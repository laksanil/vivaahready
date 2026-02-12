/**
 * Strip HTML tags and dangerous patterns from a string to prevent XSS.
 * Preserves plain text content.
 */
export function sanitizeString(value: string): string {
  return value
    .replace(/<[^>]*>/g, '') // Strip HTML tags
    .replace(/javascript:/gi, '') // Strip javascript: protocol
    .replace(/on\w+\s*=/gi, '') // Strip inline event handlers (onclick=, onerror=, etc.)
    .trim()
}

/**
 * Recursively sanitize all string values in an object.
 * Returns a new object with sanitized strings.
 */
export function sanitizeObject<T extends Record<string, unknown>>(obj: T): T {
  const sanitized: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      sanitized[key] = sanitizeString(value)
    } else if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      sanitized[key] = sanitizeObject(value as Record<string, unknown>)
    } else {
      sanitized[key] = value
    }
  }
  return sanitized as T
}
