import { Router } from 'express';
import { authMiddleware } from '../../middleware/authMiddleware';
import { getVideoController } from './videos.controller';

const videosRouter = Router();

videosRouter.get('/:videoId', authMiddleware, getVideoController);

export { videosRouter };
