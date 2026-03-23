import type { NextFunction, Request, Response } from 'express';

type ErrorWithStatus = Error & {
  statusCode?: number;
};

const errorHandler = (err: ErrorWithStatus, _req: Request, res: Response, _next: NextFunction) => {
  const statusCode = err.statusCode && Number.isInteger(err.statusCode) ? err.statusCode : 500;
  const message = err.message || 'Internal server error';

  return res.status(statusCode).json({
    message,
    statusCode,
  });
};

export { errorHandler };
