import { Router } from 'express';
import { authMiddleware } from '../../middleware/authMiddleware';
import {
  getFirstVideoController,
  getSubjectController,
  getSubjectTreeController,
  listSubjectsController,
} from './subjects.controller';

const subjectsRouter = Router();

subjectsRouter.get('/', listSubjectsController);
subjectsRouter.get('/:subjectId', getSubjectController);
subjectsRouter.get('/:subjectId/tree', authMiddleware, getSubjectTreeController);
subjectsRouter.get('/:subjectId/first-video', authMiddleware, getFirstVideoController);

export { subjectsRouter };
