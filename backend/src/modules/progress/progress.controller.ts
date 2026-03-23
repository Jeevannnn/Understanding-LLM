import type { Request, Response } from 'express';
import { ProgressError, getSubjectProgress, getVideoProgress, upsertVideoProgress } from './progress.service';

const parseEntityId = (value: string | string[] | undefined, fieldName: string) => {
  const rawValue = Array.isArray(value) ? value[0] : value;
  if (!rawValue) {
    throw new ProgressError(`Invalid ${fieldName}`, 400);
  }

  const parsed = Number.parseInt(rawValue, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new ProgressError(`Invalid ${fieldName}`, 400);
  }

  return parsed;
};

const parseLastPositionSeconds = (value: unknown) => {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new ProgressError('last_position_seconds must be a number', 400);
  }

  return Math.max(0, Math.floor(value));
};

const parseIsCompleted = (value: unknown): boolean | undefined => {
  if (value === undefined) {
    return undefined;
  }

  if (typeof value !== 'boolean') {
    throw new ProgressError('is_completed must be a boolean', 400);
  }

  return value;
};

const handleError = (error: unknown, res: Response) => {
  if (error instanceof ProgressError) {
    return res.status(error.statusCode).json({ message: error.message });
  }

  return res.status(500).json({ message: 'Internal server error' });
};

const getSubjectProgressController = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const subjectId = parseEntityId(req.params.subjectId, 'subjectId');
    const progress = await getSubjectProgress(subjectId, req.user.id);

    return res.status(200).json(progress);
  } catch (error) {
    return handleError(error, res);
  }
};

const getVideoProgressController = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const videoId = parseEntityId(req.params.videoId, 'videoId');
    const progress = await getVideoProgress(videoId, req.user.id);

    return res.status(200).json(progress);
  } catch (error) {
    return handleError(error, res);
  }
};

const upsertVideoProgressController = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const videoId = parseEntityId(req.params.videoId, 'videoId');
    const lastPositionSeconds = parseLastPositionSeconds(req.body?.last_position_seconds);
    const isCompleted = parseIsCompleted(req.body?.is_completed);

    const updated = await upsertVideoProgress({
      userId: req.user.id,
      videoId,
      lastPositionSeconds,
      isCompleted,
    });

    return res.status(200).json(updated);
  } catch (error) {
    return handleError(error, res);
  }
};

export { getSubjectProgressController, getVideoProgressController, upsertVideoProgressController };
