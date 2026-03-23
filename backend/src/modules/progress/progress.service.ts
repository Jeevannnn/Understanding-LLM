import { prisma } from '../../config/db';

class ProgressError extends Error {
  statusCode: number;

  constructor(message: string, statusCode = 400) {
    super(message);
    this.name = 'ProgressError';
    this.statusCode = statusCode;
  }
}

type UpsertVideoProgressInput = {
  userId: bigint;
  videoId: number;
  lastPositionSeconds: number;
  isCompleted?: boolean;
};

const getSubjectProgress = async (subjectId: number, userId: bigint) => {
  const subject = await prisma.subject.findUnique({
    where: { id: subjectId },
    select: { id: true },
  });

  if (!subject) {
    throw new ProgressError('Subject not found', 404);
  }

  const [totalVideos, completedVideos, lastProgress] = await prisma.$transaction([
    prisma.video.count({
      where: {
        section: {
          subject_id: subjectId,
        },
      },
    }),
    prisma.videoProgress.count({
      where: {
        user_id: userId,
        is_completed: true,
        video: {
          section: {
            subject_id: subjectId,
          },
        },
      },
    }),
    prisma.videoProgress.findFirst({
      where: {
        user_id: userId,
        video: {
          section: {
            subject_id: subjectId,
          },
        },
      },
      orderBy: {
        updated_at: 'desc',
      },
      select: {
        video_id: true,
      },
    }),
  ]);

  const percentComplete = totalVideos === 0 ? 0 : Number(((completedVideos / totalVideos) * 100).toFixed(2));

  return {
    total_videos: totalVideos,
    completed_videos: completedVideos,
    percent_complete: percentComplete,
    ...(lastProgress ? { last_video_id: lastProgress.video_id } : {}),
  };
};

const getVideoProgress = async (videoId: number, userId: bigint) => {
  const video = await prisma.video.findUnique({
    where: { id: videoId },
    select: {
      id: true,
      duration_seconds: true,
    },
  });

  if (!video) {
    throw new ProgressError('Video not found', 404);
  }

  const progress = await prisma.videoProgress.findUnique({
    where: {
      user_id_video_id: {
        user_id: userId,
        video_id: videoId,
      },
    },
    select: {
      last_position_seconds: true,
      is_completed: true,
    },
  });

  if (!progress) {
    return {
      last_position_seconds: 0,
      is_completed: false,
    };
  }

  return progress;
};

const upsertVideoProgress = async ({
  userId,
  videoId,
  lastPositionSeconds,
  isCompleted,
}: UpsertVideoProgressInput) => {
  const video = await prisma.video.findUnique({
    where: { id: videoId },
    select: {
      id: true,
      duration_seconds: true,
    },
  });

  if (!video) {
    throw new ProgressError('Video not found', 404);
  }

  const nonNegativePosition = Math.max(0, lastPositionSeconds);
  const cappedLastPositionSeconds =
    video.duration_seconds !== null
      ? Math.min(nonNegativePosition, video.duration_seconds)
      : nonNegativePosition;

  const existing = await prisma.videoProgress.findUnique({
    where: {
      user_id_video_id: {
        user_id: userId,
        video_id: videoId,
      },
    },
  });

  const nextIsCompleted = isCompleted ?? existing?.is_completed ?? false;

  let nextCompletedAt: Date | null | undefined = existing?.completed_at;
  if (isCompleted === true && !existing?.is_completed) {
    nextCompletedAt = new Date();
  } else if (isCompleted === false) {
    nextCompletedAt = null;
  }

  const updated = await prisma.videoProgress.upsert({
    where: {
      user_id_video_id: {
        user_id: userId,
        video_id: videoId,
      },
    },
    create: {
      user_id: userId,
      video_id: videoId,
      last_position_seconds: cappedLastPositionSeconds,
      is_completed: nextIsCompleted,
      completed_at: nextIsCompleted ? nextCompletedAt ?? new Date() : null,
    },
    update: {
      last_position_seconds: cappedLastPositionSeconds,
      is_completed: nextIsCompleted,
      completed_at: nextCompletedAt,
    },
  });

  return updated;
};

export { ProgressError, getSubjectProgress, getVideoProgress, upsertVideoProgress };
