import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';

type JwtUserPayload = {
  id: string | number;
  email: string;
};

const unauthorized = (res: Response) => {
  return res.status(401).json({ message: 'Unauthorized' });
};

const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.header('authorization');

  if (!authHeader?.startsWith('Bearer ')) {
    return unauthorized(res);
  }

  const token = authHeader.slice('Bearer '.length).trim();
  if (!token) {
    return unauthorized(res);
  }

  try {
    const decoded = jwt.verify(token, env.jwtSecret);

    if (typeof decoded === 'string') {
      return unauthorized(res);
    }

    const payload = decoded as jwt.JwtPayload & Partial<JwtUserPayload>;
    const idValue = payload.id ?? payload.sub;
    const email = payload.email;

    if ((typeof idValue !== 'string' && typeof idValue !== 'number') || typeof email !== 'string') {
      return unauthorized(res);
    }

    req.user = {
      id: BigInt(idValue),
      email,
    };

    return next();
  } catch {
    return unauthorized(res);
  }
};

export { authMiddleware };
