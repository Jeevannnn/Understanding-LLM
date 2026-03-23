import { prisma } from '../../config/db';

class SubjectError extends Error {
  statusCode: number;

  constructor(message: string, statusCode = 400) {
    super(message);
    this.name = 'SubjectError';
    this.statusCode = statusCode;
  }
}

type ListSubjectsInput = {
  page: number;
  pageSize: number;
  q?: string;
};

const listPublishedSubjects = async ({ page, pageSize, q }: ListSubjectsInput) => {
  const where = {
    is_published: true,
    ...(q
      ? {
          OR: [
            { title: { contains: q } },
            { description: { contains: q } },
          ],
        }
      : {}),
  };

  const [total, subjects] = await prisma.$transaction([
    prisma.subject.count({ where }),
    prisma.subject.findMany({
      where,
      orderBy: { created_at: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        title: true,
        slug: true,
        description: true,
        is_published: true,
        created_at: true,
        updated_at: true,
      },
    }),
  ]);

  return {
    data: subjects,
    page,
    pageSize,
    total,
  };
};

const getSubjectMetadata = async (subjectId: number) => {
  const subject = await prisma.subject.findUnique({
    where: { id: subjectId },
    select: {
      id: true,
      title: true,
      slug: true,
      description: true,
      is_published: true,
      created_at: true,
      updated_at: true,
    },
  });

  if (!subject) {
    throw new SubjectError('Subject not found', 404);
  }

  return subject;
};

const getSubjectTree = async (subjectId: number, userId: bigint) => {
  const subject = await prisma.subject.findUnique({
    where: { id: subjectId },
    select: {
      id: true,
      title: true,
      sections: {
        orderBy: { order_index: 'asc' },
        select: {
          id: true,
          title: true,
          order_index: true,
          videos: {
            orderBy: { order_index: 'asc' },
            select: {
              id: true,
              title: true,
              order_index: true,
            },
          },
        },
      },
    },
  });

  if (!subject) {
    throw new SubjectError('Subject not found', 404);
  }

  const flatVideos = subject.sections.flatMap((section) =>
    section.videos.map((video) => ({
      sectionId: section.id,
      videoId: video.id,
      title: video.title,
      order_index: video.order_index,
    })),
  );

  const progressRows = await prisma.videoProgress.findMany({
    where: {
      user_id: userId,
      video_id: { in: flatVideos.map((video) => video.videoId) },
      is_completed: true,
    },
    select: {
      video_id: true,
    },
  });

  const completedVideoIds = new Set(progressRows.map((row) => row.video_id));

  const prerequisiteByVideoId = new Map<number, number | null>();
  for (let index = 0; index < flatVideos.length; index += 1) {
    const currentVideo = flatVideos[index];
    const previousVideo = flatVideos[index - 1];
    prerequisiteByVideoId.set(currentVideo.videoId, previousVideo ? previousVideo.videoId : null);
  }

  const sections = subject.sections.map((section) => ({
    id: section.id,
    title: section.title,
    order_index: section.order_index,
    videos: section.videos.map((video) => {
      const prerequisiteVideoId = prerequisiteByVideoId.get(video.id) ?? null;
      const locked = prerequisiteVideoId !== null && !completedVideoIds.has(prerequisiteVideoId);

      return {
        id: video.id,
        title: video.title,
        order_index: video.order_index,
        is_completed: completedVideoIds.has(video.id),
        locked,
      };
    }),
  }));

  return {
    id: subject.id,
    title: subject.title,
    sections,
  };
};

const getFirstUnlockedVideo = async (subjectId: number, userId: bigint) => {
  const tree = await getSubjectTree(subjectId, userId);
  const flatVideos = tree.sections.flatMap((section) => section.videos);
  const firstUnlocked = flatVideos.find((video) => !video.locked);

  if (!firstUnlocked) {
    throw new SubjectError('No unlocked videos found', 404);
  }

  return {
    video_id: firstUnlocked.id,
  };
};

export { SubjectError, getFirstUnlockedVideo, getSubjectMetadata, getSubjectTree, listPublishedSubjects };
