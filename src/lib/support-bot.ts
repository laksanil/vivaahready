interface ChatMessage {
  role: string
  content: string
  timestamp: string
}

/**
 * Generate a bot response to a user's support message.
 * This is a simple auto-reply. Can be enhanced with AI integration later.
 */
export async function generateBotResponse(
  userMessage: string,
  _thread: ChatMessage[]
): Promise<string> {
  const lower = userMessage.toLowerCase()

  if (lower.includes('match') || lower.includes('profile')) {
    return 'Thank you for reaching out about your matches/profile. Our team will review your message and get back to you shortly. In the meantime, make sure your profile is complete for the best matching experience.'
  }

  if (lower.includes('payment') || lower.includes('verif')) {
    return 'Thank you for your inquiry about payments/verification. Our team will assist you shortly. If you have any payment issues, please have your transaction details ready.'
  }

  if (lower.includes('delete') || lower.includes('remove') || lower.includes('cancel')) {
    return 'We\'ve received your request. Our support team will follow up with you soon. If this is about account deletion, you can also submit a request through Settings > Delete Account.'
  }

  return 'Thank you for your message. Our support team has been notified and will respond as soon as possible. You\'ll receive a notification when we reply.'
}
