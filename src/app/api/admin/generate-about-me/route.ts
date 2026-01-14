import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isAdminAuthenticated } from '@/lib/admin'

function formatValue(value: string | null | undefined): string {
  if (!value) return ''
  return value.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
}

function generateAboutMeSummary(profile: any, userName: string): string {
  const createdBy = profile.createdBy?.toLowerCase() || 'self'
  const isMale = profile.gender === 'male'

  // Relationship terms based on who's filling
  const subjectPronoun = isMale ? 'he' : 'she'
  const objectPronoun = isMale ? 'him' : 'her'
  const possessivePronoun = isMale ? 'his' : 'her'
  const relation = isMale ? 'son' : 'daughter'

  let intro = ''
  let details: string[] = []
  let closing = ''

  if (createdBy === 'self') {
    intro = "It is a pleasure introducing myself. "

    // Add qualification/career
    if (profile.qualification || profile.occupation) {
      if (profile.qualification && profile.occupation) {
        details.push(`I have completed my ${formatValue(profile.qualification)} and currently working as ${formatValue(profile.occupation)}${profile.employerName ? ` at ${profile.employerName}` : ''}.`)
      } else if (profile.occupation) {
        details.push(`I am currently working as ${formatValue(profile.occupation)}${profile.employerName ? ` at ${profile.employerName}` : ''}.`)
      } else if (profile.qualification) {
        details.push(`I have completed my ${formatValue(profile.qualification)}.`)
      }
    }

    // Add location
    if (profile.currentLocation) {
      details.push(`I am based in ${profile.currentLocation}.`)
    }

    // Add family background
    if (profile.familyType || profile.familyValues) {
      const familyDesc = profile.familyType ? `${profile.familyType} family` : 'family'
      const valuesDesc = profile.familyValues ? ` with ${profile.familyValues} values` : ''
      details.push(`I come from a ${familyDesc}${valuesDesc}.`)
    }

    // Add lifestyle
    if (profile.hobbies) {
      details.push(`My hobbies include ${profile.hobbies.toLowerCase()}.`)
    }

    closing = "Although I have a progressive mindset, I have immense respect for our values and traditions. I want my better half to be my best friend for life and rest everything else would fall in place. If you wish to take things forward, feel free to initiate contact."

  } else if (createdBy === 'parent' || createdBy === 'parents') {
    intro = `Hello, here is a quick introduction about our ${relation}. `

    // Add qualification/career
    if (profile.qualification || profile.occupation) {
      if (profile.qualification && profile.occupation) {
        details.push(`${subjectPronoun.charAt(0).toUpperCase() + subjectPronoun.slice(1)} has completed ${possessivePronoun} ${formatValue(profile.qualification)} and is currently working as ${formatValue(profile.occupation)}${profile.employerName ? ` at ${profile.employerName}` : ''}.`)
      } else if (profile.occupation) {
        details.push(`${subjectPronoun.charAt(0).toUpperCase() + subjectPronoun.slice(1)} is currently working as ${formatValue(profile.occupation)}${profile.employerName ? ` at ${profile.employerName}` : ''}.`)
      } else if (profile.qualification) {
        details.push(`${subjectPronoun.charAt(0).toUpperCase() + subjectPronoun.slice(1)} has completed ${possessivePronoun} ${formatValue(profile.qualification)}.`)
      }
    }

    // Add location
    if (profile.currentLocation) {
      details.push(`${subjectPronoun.charAt(0).toUpperCase() + subjectPronoun.slice(1)} is based in ${profile.currentLocation}.`)
    }

    closing = `As parents, we have taught our ${relation} to respect others and live life with a positive & progressive outlook. We hope to find an understanding partner for ${objectPronoun} with whom ${subjectPronoun} would have a happy life.`

  } else if (createdBy === 'sibling') {
    intro = `Hello, I am introducing my ${isMale ? 'brother' : 'sister'}. `

    if (profile.occupation) {
      details.push(`${subjectPronoun.charAt(0).toUpperCase() + subjectPronoun.slice(1)} is working as ${formatValue(profile.occupation)}${profile.employerName ? ` at ${profile.employerName}` : ''}.`)
    }
    if (profile.qualification) {
      details.push(`${subjectPronoun.charAt(0).toUpperCase() + subjectPronoun.slice(1)} has completed ${possessivePronoun} ${formatValue(profile.qualification)}.`)
    }

    if (profile.currentLocation) {
      details.push(`Currently based in ${profile.currentLocation}.`)
    }

    closing = `We are looking for a compatible partner who shares similar values and interests.`

  } else if (createdBy === 'relative') {
    intro = `Hello, I am introducing my ${isMale ? 'nephew/cousin' : 'niece/cousin'}. `

    if (profile.occupation) {
      details.push(`${subjectPronoun.charAt(0).toUpperCase() + subjectPronoun.slice(1)} is working as ${formatValue(profile.occupation)}.`)
    }

    if (profile.currentLocation) {
      details.push(`Based in ${profile.currentLocation}.`)
    }

    closing = `The family is looking for a suitable match with good values and understanding.`

  } else if (createdBy === 'friend') {
    intro = `Hello, I am introducing my friend. `

    if (profile.occupation) {
      details.push(`${subjectPronoun.charAt(0).toUpperCase() + subjectPronoun.slice(1)} is working as ${formatValue(profile.occupation)}.`)
    }

    if (profile.currentLocation) {
      details.push(`Based in ${profile.currentLocation}.`)
    }

    closing = `${subjectPronoun.charAt(0).toUpperCase() + subjectPronoun.slice(1)} is a wonderful person looking for a compatible life partner.`
  } else {
    // Default to self
    intro = "It is a pleasure introducing myself. "
    if (profile.occupation) {
      details.push(`I am working as ${formatValue(profile.occupation)}.`)
    }
    if (profile.currentLocation) {
      details.push(`Based in ${profile.currentLocation}.`)
    }
    closing = "Looking forward to finding a compatible life partner."
  }

  return intro + details.filter(d => d).join(' ') + ' ' + closing
}

export async function POST(request: Request) {
  try {
    const isAdmin = await isAdminAuthenticated()
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get all profiles without aboutMe
    const profiles = await prisma.profile.findMany({
      where: {
        OR: [
          { aboutMe: null },
          { aboutMe: '' }
        ]
      },
      include: {
        user: {
          select: {
            name: true
          }
        }
      }
    })

    let updatedCount = 0
    const updates = []

    for (const profile of profiles) {
      const aboutMe = generateAboutMeSummary(profile, profile.user.name)

      updates.push(
        prisma.profile.update({
          where: { id: profile.id },
          data: { aboutMe }
        })
      )
      updatedCount++
    }

    // Execute all updates
    await prisma.$transaction(updates)

    return NextResponse.json({
      success: true,
      message: `Updated ${updatedCount} profiles with auto-generated About Me`,
      updatedCount
    })

  } catch (error) {
    console.error('Error generating about me:', error)
    return NextResponse.json(
      { error: 'Failed to generate about me for profiles' },
      { status: 500 }
    )
  }
}

// GET endpoint to preview what would be generated
export async function GET(request: Request) {
  try {
    const isAdmin = await isAdminAuthenticated()
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get all profiles without aboutMe
    const profiles = await prisma.profile.findMany({
      where: {
        OR: [
          { aboutMe: null },
          { aboutMe: '' }
        ]
      },
      include: {
        user: {
          select: {
            name: true
          }
        }
      }
    })

    const previews = profiles.map(profile => ({
      id: profile.id,
      name: profile.user.name,
      createdBy: profile.createdBy || 'self',
      generatedAboutMe: generateAboutMeSummary(profile, profile.user.name)
    }))

    return NextResponse.json({
      totalProfiles: previews.length,
      previews
    })

  } catch (error) {
    console.error('Error previewing about me:', error)
    return NextResponse.json(
      { error: 'Failed to preview about me' },
      { status: 500 }
    )
  }
}
