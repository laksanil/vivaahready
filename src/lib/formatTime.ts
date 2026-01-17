/**
 * Format a date string for display in messaging UI
 * @param dateString - ISO date string
 * @param includeTime - Whether to include time for older dates (default: false)
 * @returns Formatted string like "2:30 PM", "Yesterday", "Mon", or "Jan 15"
 */
export function formatTime(dateString: string, includeTime = false): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  const timeStr = date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  })

  // Today: show time only
  if (diffDays === 0) {
    return timeStr
  }

  // Yesterday
  if (diffDays === 1) {
    return includeTime ? `Yesterday ${timeStr}` : 'Yesterday'
  }

  // Within last week: show day name
  if (diffDays < 7) {
    const day = date.toLocaleDateString('en-US', { weekday: 'short' })
    return includeTime ? `${day} ${timeStr}` : day
  }

  // Older: show date
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

/**
 * Format a date for message timestamps within a conversation
 * Always includes time for context
 */
export function formatMessageTime(dateString: string): string {
  return formatTime(dateString, true)
}
