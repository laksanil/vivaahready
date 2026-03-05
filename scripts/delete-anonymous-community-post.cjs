const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const POST_SLUG = "my-first-vivaahready-date-a-dosa-a-parking-sign-and-3-hours-i-didnt-plan-for";

async function main() {
  const post = await prisma.communityPost.findUnique({
    where: { slug: POST_SLUG },
    select: { id: true, title: true, authorId: true },
  });

  if (!post) {
    console.log("No post found with slug:", POST_SLUG);
    return;
  }

  console.log("Found post:", post.id, "-", post.title);

  // Delete likes and comments first, then the post
  const [deletedLikes, deletedComments] = await Promise.all([
    prisma.postLike.deleteMany({ where: { postId: post.id } }),
    prisma.postComment.deleteMany({ where: { postId: post.id } }),
  ]);

  console.log("Deleted", deletedLikes.count, "likes and", deletedComments.count, "comments");

  await prisma.communityPost.delete({ where: { id: post.id } });
  console.log("Deleted community post:", post.id);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
