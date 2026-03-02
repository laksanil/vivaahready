/**
 * HTML-encode a string to prevent injection when interpolating into HTML.
 */
export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

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
 * Recursively sanitize all string values in an object (including arrays).
 * Returns a new object with sanitized strings.
 */
export function sanitizeObject<T extends Record<string, unknown>>(obj: T): T {
  const sanitized: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      sanitized[key] = sanitizeString(value)
    } else if (Array.isArray(value)) {
      sanitized[key] = value.map(item =>
        typeof item === 'string' ? sanitizeString(item) : item
      )
    } else if (value !== null && typeof value === 'object') {
      sanitized[key] = sanitizeObject(value as Record<string, unknown>)
    } else {
      sanitized[key] = value
    }
  }
  return sanitized as T
}
