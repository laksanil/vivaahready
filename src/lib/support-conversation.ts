export interface ConversationThread {
  thread: Array<{
    role: string
    content: string
    timestamp: string
  }>
}

/**
 * Parse conversation data from a chatHistory JSON string.
 * Returns a normalized ConversationThread object.
 */
export function parseConversationData(chatHistory: string | null | undefined): ConversationThread {
  if (!chatHistory) {
    return { thread: [] }
  }

  try {
    const parsed = JSON.parse(chatHistory)
    if (parsed && Array.isArray(parsed.thread)) {
      return parsed as ConversationThread
    }
    // Legacy format: plain array of messages
    if (Array.isArray(parsed)) {
      return { thread: parsed }
    }
    return { thread: [] }
  } catch {
    return { thread: [] }
  }
}
