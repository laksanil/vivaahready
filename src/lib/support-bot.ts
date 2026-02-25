import type { ConversationMessage } from './support-conversation'

const FALLBACK_RESPONSE =
  "Thank you for your message! Our support team has been notified and will respond soon. In the meantime, feel free to add any additional details."

const SYSTEM_PROMPT = `You are VivaahReady's friendly support assistant for an Indian matrimonial matchmaking platform serving the US diaspora. You help users with questions about their matchmaking experience, profiles, connections, verification, payments, and general inquiries.

Guidelines:
- Be warm, encouraging, and professional
- Keep responses brief (2-3 sentences max)
- If you can answer a common question (how to update profile, how matching works, verification process), do so helpfully
- For account-specific issues (payment problems, bugs, profile changes), let them know the support team will review and respond
- Never make up information about specific users, matches, or account details
- Always be positive and supportive about their journey to find a meaningful connection`

/**
 * Generate an AI auto-response for a support message using Groq's free tier.
 * Falls back to a canned message if the API is unavailable.
 */
export async function generateBotResponse(
  userMessage: string,
  conversationContext: ConversationMessage[] = [],
): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) {
    return FALLBACK_RESPONSE
  }

  try {
    // Build message history for context
    const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
      { role: 'system', content: SYSTEM_PROMPT },
    ]

    // Add recent conversation context (last 6 messages max)
    const recentContext = conversationContext.slice(-6)
    for (const msg of recentContext) {
      if (msg.role === 'user') {
        messages.push({ role: 'user', content: msg.content })
      } else {
        messages.push({ role: 'assistant', content: msg.content })
      }
    }

    // Add the current user message
    messages.push({ role: 'user', content: userMessage })

    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages,
        max_tokens: 200,
        temperature: 0.7,
      }),
    })

    if (!res.ok) {
      console.error('Groq API error:', res.status, await res.text())
      return FALLBACK_RESPONSE
    }

    const data = await res.json() as {
      choices?: Array<{ message?: { content?: string } }>
    }
    const reply = data.choices?.[0]?.message?.content?.trim()

    return reply || FALLBACK_RESPONSE
  } catch (error) {
    console.error('Support bot error:', error)
    return FALLBACK_RESPONSE
  }
}
