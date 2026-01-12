import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Creating test data for interest flow testing...')

  // Get lakshmi's user ID
  const lakshmi = await prisma.user.findFirst({
    where: { email: 'laksanil@gmail.com' },
    include: { profile: true }
  })

  if (!lakshmi) {
    console.log('Could not find lakshmi user')
    return
  }

  console.log(`Found lakshmi: ${lakshmi.name} (${lakshmi.id})`)

  // Get approved male profiles
  const maleProfiles = await prisma.profile.findMany({
    where: {
      gender: 'male',
      approvalStatus: 'approved',
      userId: { not: lakshmi.id }
    },
    include: { user: true }
  })

  console.log(`Found ${maleProfiles.length} approved male profiles`)

  // Create interests FROM males TO lakshmi (so she can test receiving interests)
  for (let i = 0; i < Math.min(3, maleProfiles.length); i++) {
    const male = maleProfiles[i]

    const existing = await prisma.match.findUnique({
      where: {
        senderId_receiverId: {
          senderId: male.userId,
          receiverId: lakshmi.id
        }
      }
    })

    if (!existing) {
      await prisma.match.create({
        data: {
          senderId: male.userId,
          receiverId: lakshmi.id,
          status: 'pending'
        }
      })
      console.log(`Created pending interest: ${male.user.name} -> ${lakshmi.name}`)
    } else {
      console.log(`Interest already exists: ${male.user.name} -> ${lakshmi.name}`)
    }
  }

  // Create a mutual match - lakshmi already sent interest to Shashank, let's have Shashank send back
  const shashank = await prisma.user.findFirst({
    where: { name: { contains: 'Shashank' } }
  })

  if (shashank) {
    // Check if lakshmi sent to shashank
    const lakshmiToShashank = await prisma.match.findUnique({
      where: {
        senderId_receiverId: {
          senderId: lakshmi.id,
          receiverId: shashank.id
        }
      }
    })

    // Check if shashank sent to lakshmi
    const shashankToLakshmi = await prisma.match.findUnique({
      where: {
        senderId_receiverId: {
          senderId: shashank.id,
          receiverId: lakshmi.id
        }
      }
    })

    if (lakshmiToShashank && !shashankToLakshmi) {
      // Create mutual interest
      await prisma.match.create({
        data: {
          senderId: shashank.id,
          receiverId: lakshmi.id,
          status: 'pending'
        }
      })
      console.log(`Created mutual interest: ${shashank.name} -> ${lakshmi.name}`)
    }
  }

  // List all matches involving lakshmi
  const lakshmiMatches = await prisma.match.findMany({
    where: {
      OR: [
        { senderId: lakshmi.id },
        { receiverId: lakshmi.id }
      ]
    },
    include: {
      sender: { select: { name: true } },
      receiver: { select: { name: true } }
    }
  })

  console.log('\n--- Lakshmi\'s Interests ---')
  lakshmiMatches.forEach(m => {
    const direction = m.senderId === lakshmi.id ? 'SENT' : 'RECEIVED'
    console.log(`${direction}: ${m.sender.name} -> ${m.receiver.name}: ${m.status}`)
  })

  // Check for mutual matches
  console.log('\n--- Checking for Mutual Matches ---')
  const sentByLakshmi = lakshmiMatches.filter(m => m.senderId === lakshmi.id)
  const receivedByLakshmi = lakshmiMatches.filter(m => m.receiverId === lakshmi.id)

  for (const sent of sentByLakshmi) {
    const mutual = receivedByLakshmi.find(r => r.senderId === sent.receiverId)
    if (mutual) {
      console.log(`MUTUAL MATCH: ${lakshmi.name} <-> ${sent.receiver.name}`)
    }
  }

  console.log('\nDone!')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
