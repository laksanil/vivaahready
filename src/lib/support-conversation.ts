export interface ConversationMessage {
  role: 'user' | 'admin' | 'bot'
  content: string
  timestamp: string
  deliveryMethods?: string[]
}

export interface ConversationData {
  _chatbotHistory?: Array<{ role: string; content: string }>
  thread: ConversationMessage[]
}

/**
 * Parse the chatHistory JSON field into structured conversation data.
 * Handles three formats:
 * 1. null/empty → empty thread
 * 2. JSON array (legacy chatbot history) → preserved in _chatbotHistory, empty thread
 * 3. Object with 'thread' key → the conversation thread format
 */
export function parseConversationData(chatHistory: string | null): ConversationData {
  if (!chatHistory) {
    return { thread: [] }
  }

  try {
    const parsed = JSON.parse(chatHistory)

    // New format: object with thread array
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed) && 'thread' in parsed) {
      return {
        _chatbotHistory: Array.isArray(parsed._chatbotHistory) ? parsed._chatbotHistory : undefined,
        thread: Array.isArray(parsed.thread) ? parsed.thread : [],
      }
    }

    // Legacy format: array of chatbot messages
    if (Array.isArray(parsed)) {
      return {
        _chatbotHistory: parsed,
        thread: [],
      }
    }

    return { thread: [] }
  } catch {
    return { thread: [] }
  }
}

/**
 * Build the full conversation thread for display, with backward compatibility
 * for messages that only have adminResponse but no thread yet.
 */
export function buildFullThread(
  adminResponse: string | null,
  respondedAt: string | null,
  chatHistory: string | null,
): ConversationMessage[] {
  const parsed = parseConversationData(chatHistory)

  // If there's a populated thread, use it
  if (parsed.thread.length > 0) {
    return parsed.thread
  }

  // Backward compat: if there's a legacy adminResponse but no thread, show it
  if (adminResponse && respondedAt) {
    return [{
      role: 'admin',
      content: adminResponse,
      timestamp: respondedAt,
    }]
  }

  return []
}
