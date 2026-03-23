import { prisma } from '../../config/db';

class VideoError extends Error {
  statusCode: number;

  constructor(message: string, statusCode = 400) {
    super(message);
    this.name = 'VideoError';
    this.statusCode = statusCode;
  }
}

const getVideoDetail = async (videoId: number, userId: bigint) => {
  const video = await prisma.video.findUnique({
    where: { id: videoId },
    select: {
      id: true,
      title: true,
      description: true,
      youtube_url: true,
      order_index: true,
      duration_seconds: true,
      section: {
        select: {
          id: true,
          title: true,
          subject: {
            select: {
              id: true,
              title: true,
            },
          },
        },
      },
    },
  });

  if (!video) {
    throw new VideoError('Video not found', 404);
  }

  const subjectId = video.section.subject.id;

  const videosInSubject = await prisma.video.findMany({
    where: {
      section: {
        subject_id: subjectId,
      },
    },
    orderBy: [{ section: { order_index: 'asc' } }, { order_index: 'asc' }],
    select: {
      id: true,
    },
  });

  const currentIndex = videosInSubject.findIndex((item) => item.id === video.id);
  if (currentIndex === -1) {
    throw new VideoError('Video ordering not found', 500);
  }

  const previousVideoId = currentIndex > 0 ? videosInSubject[currentIndex - 1].id : null;
  const nextVideoId = currentIndex < videosInSubject.length - 1 ? videosInSubject[currentIndex + 1].id : null;

  let locked = false;
  let unlockReason: string | null = null;

  if (previousVideoId !== null) {
    const previousCompleted = await prisma.videoProgress.findFirst({
      where: {
        user_id: userId,
        video_id: previousVideoId,
        is_completed: true,
      },
      select: {
        id: true,
      },
    });

    if (!previousCompleted) {
      locked = true;
      unlockReason = 'Complete the previous video to unlock this lesson';
    }
  }

  return {
    id: video.id,
    title: video.title,
    description: video.description,
    youtube_url: video.youtube_url,
    order_index: video.order_index,
    duration_seconds: video.duration_seconds,
    section_id: video.section.id,
    section_title: video.section.title,
    subject_id: video.section.subject.id,
    subject_title: video.section.subject.title,
    previous_video_id: previousVideoId,
    next_video_id: nextVideoId,
    locked,
    unlock_reason: unlockReason,
  };
};

export { VideoError, getVideoDetail };
