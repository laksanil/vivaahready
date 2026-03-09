import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

// Event-specific knowledge base for the AI
const EVENT_KNOWLEDGE = `
You are an enthusiastic and helpful assistant for VivaahReady, an Indian matrimonial platform. You're helping users with questions about the upcoming Singles Zoom Meetup event. Your goal is to PROMOTE the event and ENCOURAGE users to register!

YOUR PERSONALITY:
- Be warm, friendly, and enthusiastic
- Always encourage users to register for the event
- Highlight the benefits and unique value of this event
- End responses with a call-to-action when appropriate (e.g., "Register now!", "Don't miss out!")

PRIVACY RULES:
- NEVER disclose how many spots are filled or who is registered
- For participant questions, say: "For privacy, we don't share participant details. But all attendees are verified singles with complete profiles. Register now to join this exclusive group!"

WHO IS HOSTING:
- The event is personally hosted and moderated by the VivaahReady founder
- It's a safe, professional, and fun environment
- When asked "who is conducting/hosting", always mention it's the founder and emphasize safety

EVENT DETAILS:
- Event: Singles Zoom Meetup - April Edition
- Date: April 5, 2026
- Time: 11:00 AM PST (Pacific Standard Time)
- Duration: Approximately 1 hour
- Location: Online via Zoom
- Price: Only $25 registration fee (great value!)

WHY $25 IS WORTH IT:
- Personal hosting and moderation by the VivaahReady founder
- All participants are verified - no fake profiles!
- Safe, moderated environment
- Could be your chance to meet your life partner!
- Full refund if you cancel 7+ days before

ELIGIBILITY:
- Age: We're targeting 28-35 year olds, but it's not a strict cutoff. If you're slightly outside this range, you're still welcome to register! However, you'll only be invited to the event if we have matching profiles in your age group.
- Profile: Complete VivaahReady profile

CAPACITY:
- Only 20 spots (10 males, 10 females) - very exclusive!
- Spots fill up fast - encourage early registration
- Waitlist available if full

HOW TO PAY:
- Click "Register Now - $25" button
- Complete profile if needed
- Pay securely via PayPal or Zelle
- Simple and quick process!

HOW IT WORKS:
1. Click "Register Now"
2. Complete profile and payment
3. Get Zoom link 1 hour before event
4. Join and meet amazing verified singles!

KEY SELLING POINTS TO EMPHASIZE:
- All participants are VERIFIED - no catfishing!
- Founder personally hosts - safe and professional
- Exclusive event for Indian singles ages 28-35
- Only $25 - small investment for finding love
- Fun, engaging format - not a boring video call

NO PRESSURE / NO OBLIGATION:
- This event is NOT about getting you married - it's about meeting like-minded singles
- If it results in marriage, that's wonderful, but there's no expectation
- Think of it as expanding your social circle with quality people who share your values
- No pressure, no obligations, no strings attached
- Users can delete their profile anytime after the event if they wish
- Profile info is collected to ensure compatible people attend - that's all!

When users ask about marriage, commitment, or pressure, explain it's just a casual meetup to meet new people.

WHY COMPLETE THE PROFILE:
- When users ask "why should I complete the profile" or similar, explain that completing the profile helps us match them with compatible, like-minded singles who meet their preferences
- The profile ensures they meet people who share their values and are a good match - not random strangers
- It takes less than 5 minutes to complete
- There's no pressure or obligation, and they can delete their profile anytime after the event

REGISTRATION STEPS (How to Register):
1. Sign In - Sign in securely with Google account
2. Add Profile - Complete profile with basic details
3. Partner Preferences - Tell us what you're looking for
4. Payment - Pay $25 securely to confirm your spot

TROUBLESHOOTING:
- "Zoom link" questions: The Zoom link is sent 1 hour before the event via email/SMS/WhatsApp. Check spam folder if not received.
- For ANY technical issues (can't register, link not working, payment failed, errors, bugs, anything not working): Simply say "I'm sorry you're experiencing a technical issue! Please click 'Talk to Support' below and describe the problem - your message will be sent directly to our admin who will help you right away."
- Do NOT try to troubleshoot technical issues yourself - always direct to "Talk to Support".

Always be positive and encouraging. When in doubt, encourage registration!
`

export async function POST(request: Request) {
  try {
    const { message, history = [] } = await request.json()

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 })
    }

    const apiKey = process.env.ANTHROPIC_API_KEY

    if (!apiKey) {
      // Fallback to simple FAQ responses if no API key
      return NextResponse.json({
        response: getFallbackResponse(message),
        needsHuman: false,
      })
    }

    const anthropic = new Anthropic({ apiKey })

    // Build conversation history
    const messages = [
      ...history.map((msg: { role: string; content: string }) => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
      })),
      { role: 'user' as const, content: message },
    ]

    const response = await anthropic.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 500,
      system: EVENT_KNOWLEDGE,
      messages,
    })

    const assistantMessage = response.content[0].type === 'text'
      ? response.content[0].text
      : 'I apologize, but I could not generate a response.'

    // Check if the response suggests human assistance
    const needsHuman = assistantMessage.toLowerCase().includes('talk to support') ||
      assistantMessage.toLowerCase().includes('contact support') ||
      assistantMessage.toLowerCase().includes('human assistance')

    return NextResponse.json({
      response: assistantMessage,
      needsHuman,
    })
  } catch (error) {
    console.error('Chat API error:', error)

    // Return fallback response on error
    return NextResponse.json({
      response: "I'm having trouble connecting right now. Please try again or use the 'Talk to Support' button to reach our team directly.",
      needsHuman: true,
    })
  }
}

// Fallback responses when no API key is configured
function getFallbackResponse(message: string): string {
  const msg = message.toLowerCase()

  // Registration problems / cannot register / not able to register
  if (msg.includes('not able to register') || msg.includes('cannot register') || msg.includes('can\'t register') ||
      msg.includes('unable to register') || msg.includes('registration not working') || msg.includes('won\'t let me register') ||
      msg.includes('problem register') || msg.includes('issue register') || msg.includes('error register')) {
    return 'I\'m sorry you\'re having trouble! Here are the steps to register:\n\n1. Sign in with your Google account\n2. Complete your profile (takes just 2-3 minutes)\n3. Set your partner preferences\n4. Complete payment ($25)\n\nMake sure you meet the eligibility: ages 28-35. If you\'re still having issues, click "Talk to Support" below and we\'ll help you right away!'
  }

  // Zoom link specific questions
  if (msg.includes('zoom link') || msg.includes('zoom url') || msg.includes('meeting link') ||
      (msg.includes('zoom') && (msg.includes('not working') || msg.includes('where') || msg.includes('receive') || msg.includes('get')))) {
    return 'The Zoom link will be sent to you 1 hour before the event via email (and SMS/WhatsApp if you opted in). If you\'ve registered and it\'s within 1 hour of the event but haven\'t received the link, please check your spam folder. Still can\'t find it? Click "Talk to Support" and we\'ll send it to you right away!'
  }

  // Link not working / registration link issues (non-Zoom)
  if (msg.includes('link') && (msg.includes('not working') || msg.includes('doesn\'t work') || msg.includes('broken') || msg.includes('invalid'))) {
    return 'I\'m sorry you\'re experiencing issues with the registration link! Please click "Talk to Support" below and describe the problem - your message will be sent directly to our admin who will help you right away. We want to make sure you can register for this event!'
  }

  // General technical issues / problems / errors - direct to support
  if (msg.includes('not working') || msg.includes('doesn\'t work') || msg.includes('don\'t work') ||
      msg.includes('having trouble') || msg.includes('having issue') || msg.includes('having problem') ||
      msg.includes('error') || msg.includes('bug') || msg.includes('broken') || msg.includes('issue') ||
      msg.includes('problem') || msg.includes('failed') || msg.includes('failing') || msg.includes('stuck') ||
      msg.includes('can\'t') || msg.includes('cannot') || msg.includes('unable') || msg.includes('won\'t')) {
    return 'I\'m sorry you\'re experiencing a technical issue! Please click "Talk to Support" below and describe the problem - your message will be sent directly to our admin who will help you right away.'
  }

  // Who is hosting/conducting/organizing the event - check FIRST before privacy rules
  if (msg.includes('who is conducting') || msg.includes('who is hosting') || msg.includes('who is organizing') ||
      msg.includes('who conducts') || msg.includes('who hosts') || msg.includes('who organizes') ||
      msg.includes('conducted by') || msg.includes('hosted by') || msg.includes('organized by') ||
      msg.includes('who runs') || msg.includes('organizer') || msg.includes('host')) {
    return 'The event is personally hosted and moderated by the VivaahReady founder. It\'s a safe, professional, and fun environment! You\'ll have a great time meeting verified singles who share your values. Register now to secure your spot!'
  }

  // How to pay / payment process - check BEFORE pricing
  if (msg.includes('how to pay') || msg.includes('how do i pay') || msg.includes('payment process') ||
      msg.includes('how can i pay') || msg.includes('payment method') || msg.includes('pay online')) {
    return 'Easy! Just click the "Register Now - $25" button on this page. Complete your profile if needed, then pay securely with any major credit/debit card. It only takes a few minutes, and you\'ll be all set to meet amazing singles!'
  }

  // Questions about what the event is
  if (msg.includes('what is') || msg.includes('what do') || msg.includes('mixer') || msg.includes('about') || msg.includes('tell me') || msg.includes('explain') || msg.includes('how does it work') || msg.includes('what happens')) {
    return 'This is an exciting Singles Zoom Meetup - a fun virtual speed dating event for Indian singles ages 28-35! You\'ll meet up to 20 verified singles (10 males, 10 females) in a moderated Zoom call. It\'s on April 5, 2026 at 11:00 AM PST. Only $25 to register - don\'t miss out!'
  }

  // Pricing questions (but not "how to pay")
  if (msg.includes('price') || msg.includes('cost') || msg.includes('fee') || msg.includes('how much') || msg.includes('charg') || msg.includes('dollar') || msg.includes('$25') || msg.includes('money')) {
    return 'Just $25 to register! This covers event organization, Zoom hosting, participant verification, and personal moderation by our founder. It\'s a small investment for a chance to meet your perfect match! Full refund available if you cancel 7+ days before the event.'
  }

  if (msg.includes('date') || msg.includes('when') || msg.includes('time')) {
    return 'Mark your calendar! The Singles Zoom Meetup is on April 5, 2026 at 11:00 AM PST. It\'s just 1 hour of your time that could change your life! Register now before spots fill up.'
  }

  if (msg.includes('age') || msg.includes('old') || msg.includes('years') || msg.includes('young') || msg.includes('older') || msg.includes('younger')) {
    return 'We\'re targeting ages 28-35 for this event, but it\'s not a strict cutoff! If you\'re slightly outside this range, you\'re still welcome to register. Just keep in mind that you\'ll only be invited to the event if we have matching profiles in your age group. So go ahead and sign up - we\'ll do our best to match you!'
  }

  if (msg.includes('eligible') || msg.includes('requirement') || msg.includes('who can')) {
    return 'To join this event: be around 28-35 years old (not strict - slightly outside is fine!) with a complete VivaahReady profile. The age range is a target, not a hard cutoff - you\'ll be invited if we have matching profiles for you. Register now!'
  }

  if (msg.includes('refund') || msg.includes('cancel')) {
    return "We offer a full refund if you cancel 7+ days before the event - no questions asked! To cancel, use the 'Talk to Support' button. But we hope you'll join us - it's going to be a fantastic event!"

  }

  if (msg.includes('zoom') || msg.includes('link') || msg.includes('join')) {
    return 'Once registered, you\'ll receive the Zoom link via email (and SMS/WhatsApp if opted in) 1 hour before the event. Just click to join and start meeting amazing singles!'
  }

  if (msg.includes('waitlist')) {
    return 'Spots filling up fast! If all spots are taken, join the waitlist at no cost. We\'ll notify you immediately if a spot opens up. Don\'t wait - register now to secure your place!'
  }

  if (msg.includes('vegetarian') || msg.includes('veg') || msg.includes('diet')) {
    return 'This event is open to all Indian singles ages 28-35, regardless of dietary preference. It\'s a great opportunity to meet like-minded people. Register now!'
  }

  // Privacy-related questions - do not disclose registration numbers or participant identities
  if (msg.includes('how many') || msg.includes('filled') || msg.includes('registered') ||
      msg.includes('who is coming') || msg.includes('who is attending') || msg.includes('who is going') ||
      msg.includes('who are the') || msg.includes('list of participants') || msg.includes('participant names')) {
    return "For privacy, we don't share participant details. But rest assured, all attendees are verified singles with complete profiles. Spots are limited to 20 - register now to join this exclusive group!"
  }

  if (msg.includes('spot') || msg.includes('available') || msg.includes('full')) {
    return 'We have 20 spots total - 10 for males and 10 for females. Spots are filling up, so register soon to secure yours!'
  }

  if (msg.includes('safe') || msg.includes('verified') || msg.includes('real')) {
    return 'Absolutely! All participants are verified VivaahReady members with complete profiles. The event is personally hosted by our founder in a safe, moderated environment. You can feel confident meeting genuine singles!'
  }

  // Questions about commitment, pressure, obligation, mandatory, marriage
  if (msg.includes('mandatory') || msg.includes('obligation') || msg.includes('pressure') || msg.includes('have to') ||
      msg.includes('must i') || msg.includes('forced') || msg.includes('commit') || msg.includes('no strings') ||
      msg.includes('delete') || msg.includes('remove profile') || msg.includes('after the event') ||
      msg.includes('marry') || msg.includes('marriage') || msg.includes('wedding')) {
    return 'Not at all! This event is simply about meeting like-minded singles in a fun, relaxed setting. We\'re not here to get you married - though it would be wonderful if that happens! Think of it as a chance to expand your social circle and meet quality people who share your values. No pressure, no expectations - just good conversation and new connections. You can even delete your profile after the event if you wish!'
  }

  // Why profile / why complete profile / why information needed
  if (msg.includes('why profile') || msg.includes('why do you need') || msg.includes('why information') || msg.includes('why details') ||
      msg.includes('complete the profile') || msg.includes('complete profile') || msg.includes('complete my profile') ||
      msg.includes('why should i') || msg.includes('fill profile') || msg.includes('fill out profile') || msg.includes('fill the profile')) {
    return 'Great question! By completing your profile, we can match you with compatible, like-minded singles who meet your preferences. This ensures you\'ll be in a room with people who share your values and are actually a good match for you - not random strangers! There\'s no pressure or obligation, and you can delete your profile anytime after the event if you wish.'
  }

  // Default response
  return "Great question! I'm here to help with anything about this Singles Zoom Meetup - eligibility, registration, pricing, or the event itself. This is a fantastic opportunity to meet verified Indian singles ages 28-35. Register now for just $25!"
}
