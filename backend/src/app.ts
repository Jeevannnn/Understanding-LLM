import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import { env } from './config/env';
import { errorHandler } from './middleware/errorHandler';
import { authRouter } from './modules/auth/auth.routes';
import { progressRouter } from './modules/progress/progress.routes';
import { subjectsRouter } from './modules/subjects/subjects.routes';
import { videosRouter } from './modules/videos/videos.routes';

const app = express();

app.use(
  cors({
    origin: env.corsOrigin,
    credentials: true,
  }),
);
app.use(cookieParser());
app.use(express.json());
app.use('/auth', authRouter);
app.use('/api/progress', progressRouter);
app.use('/api/subjects', subjectsRouter);
app.use('/api/videos', videosRouter);

app.get('/api/health', (_req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use(errorHandler);

export { app };
