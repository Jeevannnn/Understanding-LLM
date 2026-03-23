import { Router } from 'express';
import { authMiddleware } from '../../middleware/authMiddleware';
import {
  getSubjectProgressController,
  getVideoProgressController,
  upsertVideoProgressController,
} from './progress.controller';

const progressRouter = Router();

progressRouter.get('/subjects/:subjectId', authMiddleware, getSubjectProgressController);
progressRouter.get('/videos/:videoId', authMiddleware, getVideoProgressController);
progressRouter.post('/videos/:videoId', authMiddleware, upsertVideoProgressController);

export { progressRouter };
