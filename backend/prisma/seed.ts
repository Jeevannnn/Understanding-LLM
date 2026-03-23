import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const SUBJECTS = [
  {
    title: 'Backend Fundamentals',
    slug: 'backend-fundamentals',
    description: 'Learn backend development fundamentals with Node.js and databases.',
  },
  {
    title: 'Frontend Mastery',
    slug: 'frontend-mastery',
    description: 'Build modern frontend apps using component-driven architecture.',
  },
];

const createVideos = (subjectSlug: string, sectionNumber: number) => {
  return Array.from({ length: 4 }, (_, idx) => {
    const videoNumber = idx + 1;
    return {
      title: `Video ${videoNumber}: ${subjectSlug.replace('-', ' ')} Section ${sectionNumber}`,
      description: `Lesson ${videoNumber} for section ${sectionNumber}.`,
      youtube_url: `https://www.youtube.com/watch?v=${subjectSlug.slice(0, 6)}${sectionNumber}${videoNumber}`,
      order_index: videoNumber,
      duration_seconds: 300 + videoNumber * 60,
    };
  });
};

async function main() {
  const passwordHash = await bcrypt.hash('TestUser@123', 10);

  await prisma.user.upsert({
    where: { email: 'test@example.com' },
    update: {
      name: 'Test User',
      password_hash: passwordHash,
    },
    create: {
      name: 'Test User',
      email: 'test@example.com',
      password_hash: passwordHash,
    },
  });

  for (const subjectSeed of SUBJECTS) {
    const subject = await prisma.subject.upsert({
      where: { slug: subjectSeed.slug },
      update: {
        title: subjectSeed.title,
        description: subjectSeed.description,
        is_published: true,
      },
      create: {
        title: subjectSeed.title,
        slug: subjectSeed.slug,
        description: subjectSeed.description,
        is_published: true,
      },
    });

    await prisma.section.deleteMany({
      where: { subject_id: subject.id },
    });

    for (let sectionIndex = 1; sectionIndex <= 3; sectionIndex += 1) {
      await prisma.section.create({
        data: {
          subject_id: subject.id,
          title: `Section ${sectionIndex}: ${subject.title}`,
          order_index: sectionIndex,
          videos: {
            create: createVideos(subject.slug, sectionIndex),
          },
        },
      });
    }
  }

  console.log('Seed complete: 1 user, 2 subjects, 6 sections, 24 videos');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
