import type { Request, Response } from 'express';
import {
  SubjectError,
  getFirstUnlockedVideo,
  getSubjectMetadata,
  getSubjectTree,
  listPublishedSubjects,
} from './subjects.service';

const parsePositiveInt = (value: string | undefined, fallback: number) => {
  if (!value) {
    return fallback;
  }

  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }

  return parsed;
};

const parseSubjectId = (subjectIdParam: string | string[] | undefined) => {
  const rawValue = Array.isArray(subjectIdParam) ? subjectIdParam[0] : subjectIdParam;
  if (!rawValue) {
    throw new SubjectError('Invalid subjectId', 400);
  }

  const subjectId = Number.parseInt(rawValue, 10);
  if (!Number.isFinite(subjectId) || subjectId <= 0) {
    throw new SubjectError('Invalid subjectId', 400);
  }

  return subjectId;
};

const handleError = (error: unknown, res: Response) => {
  if (error instanceof SubjectError) {
    return res.status(error.statusCode).json({ message: error.message });
  }

  return res.status(500).json({ message: 'Internal server error' });
};

const listSubjectsController = async (req: Request, res: Response) => {
  try {
    const page = parsePositiveInt(req.query.page as string | undefined, 1);
    const pageSize = parsePositiveInt(req.query.pageSize as string | undefined, 10);
    const q = (req.query.q as string | undefined)?.trim() || undefined;

    const result = await listPublishedSubjects({ page, pageSize, q });
    return res.status(200).json(result);
  } catch (error) {
    return handleError(error, res);
  }
};

const getSubjectController = async (req: Request, res: Response) => {
  try {
    const subjectId = parseSubjectId(req.params.subjectId);
    const subject = await getSubjectMetadata(subjectId);

    return res.status(200).json(subject);
  } catch (error) {
    return handleError(error, res);
  }
};

const getSubjectTreeController = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const subjectId = parseSubjectId(req.params.subjectId);
    const tree = await getSubjectTree(subjectId, userId);

    return res.status(200).json(tree);
  } catch (error) {
    return handleError(error, res);
  }
};

const getFirstVideoController = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const subjectId = parseSubjectId(req.params.subjectId);
    const firstVideo = await getFirstUnlockedVideo(subjectId, userId);

    return res.status(200).json(firstVideo);
  } catch (error) {
    return handleError(error, res);
  }
};

export { getFirstVideoController, getSubjectController, getSubjectTreeController, listSubjectsController };
