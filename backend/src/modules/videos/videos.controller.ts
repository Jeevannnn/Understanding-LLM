import type { Request, Response } from 'express';
import { VideoError, getVideoDetail } from './videos.service';

const parseVideoId = (videoIdParam: string | string[] | undefined) => {
  const rawValue = Array.isArray(videoIdParam) ? videoIdParam[0] : videoIdParam;
  if (!rawValue) {
    throw new VideoError('Invalid videoId', 400);
  }

  const videoId = Number.parseInt(rawValue, 10);
  if (!Number.isFinite(videoId) || videoId <= 0) {
    throw new VideoError('Invalid videoId', 400);
  }

  return videoId;
};

const handleError = (error: unknown, res: Response) => {
  if (error instanceof VideoError) {
    return res.status(error.statusCode).json({ message: error.message });
  }

  return res.status(500).json({ message: 'Internal server error' });
};

const getVideoController = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const videoId = parseVideoId(req.params.videoId);
    const video = await getVideoDetail(videoId, req.user.id);

    return res.status(200).json(video);
  } catch (error) {
    return handleError(error, res);
  }
};

export { getVideoController };
