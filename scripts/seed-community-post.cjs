const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const POSTS = [
  {
    title: "My First VivaahReady Date: A Dosa, A Parking Sign, and 3 Hours I Didn't Plan For",
    slug: "my-first-vivaahready-date-a-dosa-a-parking-sign-and-3-hours-i-didnt-plan-for",
    body: `I showed up 15 minutes early and spent the whole time pretending to read the menu. (I now know every dosa variety by heart. Ask me anything.)

He walked in and said "I've been reading the same parking sign outside for 10 minutes, so we're equally nervous."

I nearly choked on my filter coffee.

Three hours, one biryani debate, and zero awkward silences later — I drove home and just... smiled the whole way.

Still not sure where this goes. But for the first time, I'm curious to find out.`,
    showRealName: false,
    isAnonymous: false, // Shows VR ID
    isPinned: true,
  },
  {
    title: "The Moment I Knew Arranged Wasn't a Dirty Word",
    slug: "the-moment-i-knew-arranged-wasnt-a-dirty-word",
    body: `Growing up in the US, I used to cringe when my parents brought up "arranged marriage." It felt like giving up on finding love on my own terms.

Then I realized VivaahReady isn't about someone else choosing for you. It's about having a system that actually understands what matters to you and filters out the noise.

My first real conversation through here lasted two hours. We talked about our families, our careers, our love for old Telugu movies, and even debated whether Hyderabadi biryani is better than Chennai biryani (spoiler: we agreed to disagree and that's okay!). No swiping, no games.

I don't know if this is "the one." But I know this feels more real than anything I found on a dating app.

The best part? There were a few awkward silences, but they didn't feel uncomfortable. They felt... natural? Like we were both just taking a moment to appreciate that this was actually happening.

A few things I learned from my first date that might help others here:

1. It's okay to be nervous — they probably are too
2. Pick a place where you feel comfortable (familiar food helps!)
3. Don't try to be someone you're not — authenticity goes so much further
4. Ask genuine questions and actually listen to the answers
5. It's totally fine if there are quiet moments — not every second needs to be filled with conversation

I'm not sure where this will go, but I'm grateful for the experience and for this platform that made it possible. To everyone still waiting for their first meeting — your time will come, and it'll be worth the wait!

Would love to hear about your first date stories too. We're all in this together!`,
    showRealName: false,
    isAnonymous: true, // Shows Anonymous
    isPinned: false,
  },
];

async function main() {
  // Find a user to be the author
  const user = await prisma.user.findFirst({
    where: { profile: { isNot: null } },
    select: { id: true, email: true },
    orderBy: { createdAt: "asc" },
  });

  if (!user) {
    console.error("No user with a profile found. Create a profile first.");
    process.exit(1);
  }

  console.log("Using author:", user.email, "(", user.id, ")");

  for (const postData of POSTS) {
    const existing = await prisma.communityPost.findUnique({
      where: { slug: postData.slug },
    });

    if (existing) {
      console.log("Updating existing post:", postData.slug);
      await prisma.communityPost.update({
        where: { id: existing.id },
        data: {
          title: postData.title,
          body: postData.body,
          isPinned: postData.isPinned,
          isPublished: true,
          showRealName: postData.showRealName,
          isAnonymous: postData.isAnonymous,
        },
      });
      console.log("  Updated:", existing.id);
      continue;
    }

    const post = await prisma.communityPost.create({
      data: {
        authorId: user.id,
        title: postData.title,
        slug: postData.slug,
        body: postData.body,
        isPublished: true,
        isPinned: postData.isPinned,
        showRealName: postData.showRealName,
        isAnonymous: postData.isAnonymous,
      },
    });

    console.log("Created post:");
    console.log("  ID:", post.id);
    console.log("  Title:", post.title);
    console.log("  Anonymous:", post.isAnonymous);
    console.log("  Pinned:", post.isPinned);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
