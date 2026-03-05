const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const POSTS = [
  {
    title: "I Made My Daughter's Profile. She Doesn't Know Yet.",
    slug: "i-made-my-daughters-profile-she-doesnt-know-yet",
    body: `I am not that kind of mother. I always said I would never do this.

And then I did it at 11pm on a Wednesday when she was not answering my calls.

She is 29. She has a good job. She has her whole life sorted out. Except this one thing. And she will tell me she is not ready. She has been saying that for two years.

Here is what I will never tell her. I did not make her profile because my relatives are asking. I did not do it because of some checklist. I did it because last Diwali she was the only one who came alone. And she smiled the whole night. And I watched her and I just thought. She is so good at being alone. I hope that is a choice and not a habit.

I have not told her yet. Maybe I will show her this post first.

If there are other parents here doing the same quiet worrying — you are not alone.`,
    showRealName: false,
    isAnonymous: false,
    isPinned: true,
    daysAgo: 1,
  },
  {
    title: "Okay but why am I actually on here",
    slug: "okay-but-why-am-i-actually-on-here",
    body: `I have a masters degree. I negotiated my salary. I filed my own taxes. I know what I want from life. Mostly.

But deciding whether to make a profile on a matrimonial site? Total disaster.

My mom didn't pressure me. My dad didn't hint. I literally opened this, made a profile, and then just stared at it for a good 20 minutes wondering what I just did.

Here's the thing nobody at work would understand. Hinge felt wrong. Not because anything bad happened. Just because every conversation felt like it was going nowhere near where I actually wanted to end up. I want someone who gets why I still call my nani every Sunday. Who doesn't think meeting the parents is some six month milestone. Who understands that my culture isn't a personality trait I perform. It's just me.

So here I am. On a matrimonial site. At 28. Feeling equal parts ready and ridiculous.

Is this the right way? Honestly no idea. But it feels more honest than pretending I want something casual when I don't.

If you're also here wondering the same thing — hi.`,
    showRealName: false,
    isAnonymous: false,
    isPinned: true,
    daysAgo: 4,
  },
];

// Fictitious author ID for seeded posts (embeds a realistic VR ID for display)
const SEEDED_AUTHOR_ID = "vr-seeded-VR20251111012";

// Old slugs to clean up when replacing posts
const OLD_SLUGS = [
  "my-first-vivaahready-date-a-dosa-a-parking-sign-and-3-hours-i-didnt-plan-for",
];

async function main() {
  // Find a real user for VR ID posts
  const user = await prisma.user.findFirst({
    where: { profile: { isNot: null } },
    select: { id: true, email: true },
    orderBy: { createdAt: "asc" },
  });

  if (!user) {
    console.error("No user with a profile found. Create a profile first.");
    process.exit(1);
  }

  console.log("Using seeded author ID:", SEEDED_AUTHOR_ID);

  // Clean up old posts
  for (const slug of OLD_SLUGS) {
    const old = await prisma.communityPost.findUnique({ where: { slug } });
    if (old) {
      await prisma.postLike.deleteMany({ where: { postId: old.id } });
      await prisma.postComment.deleteMany({ where: { postId: old.id } });
      await prisma.communityPost.delete({ where: { id: old.id } });
      console.log("Removed old post:", slug);
    }
  }

  for (const postData of POSTS) {
    const authorId = SEEDED_AUTHOR_ID;

    const existing = await prisma.communityPost.findUnique({
      where: { slug: postData.slug },
    });

    if (existing) {
      console.log("Updating existing post:", postData.slug);
      const updatedAt = postData.daysAgo
        ? new Date(Date.now() - postData.daysAgo * 24 * 60 * 60 * 1000)
        : undefined;
      await prisma.communityPost.update({
        where: { id: existing.id },
        data: {
          authorId,
          title: postData.title,
          body: postData.body,
          isPinned: postData.isPinned,
          isPublished: true,
          showRealName: postData.showRealName,
          isAnonymous: postData.isAnonymous,
          ...(updatedAt ? { createdAt: updatedAt } : {}),
        },
      });
      console.log("  Updated:", existing.id, "| author:", authorId);
      continue;
    }

    const createdAt = postData.daysAgo
      ? new Date(Date.now() - postData.daysAgo * 24 * 60 * 60 * 1000)
      : new Date();

    const post = await prisma.communityPost.create({
      data: {
        authorId,
        title: postData.title,
        slug: postData.slug,
        body: postData.body,
        isPublished: true,
        isPinned: postData.isPinned,
        showRealName: postData.showRealName,
        isAnonymous: postData.isAnonymous,
        createdAt,
      },
    });

    console.log("Created post:");
    console.log("  ID:", post.id);
    console.log("  Title:", post.title);
    console.log("  Pinned:", post.isPinned);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
