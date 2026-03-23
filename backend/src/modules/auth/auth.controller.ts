import type { CookieOptions, Request, Response } from 'express';
import { security } from '../../config/security';
import { loginSchema, registerSchema } from './auth.validator';
import { AuthError, login, logout, refresh, register } from './auth.service';

const REFRESH_COOKIE_NAME = 'refreshToken';
const REFRESH_COOKIE_MAX_AGE = 30 * 24 * 60 * 60 * 1000;

const refreshCookieOptions: CookieOptions = {
  httpOnly: true,
  sameSite: 'strict',
  secure: security.cookie.secure,
  domain: security.cookie.domain,
  path: '/',
  maxAge: REFRESH_COOKIE_MAX_AGE,
};

const handleError = (error: unknown, res: Response) => {
  if (error instanceof AuthError) {
    return res.status(error.statusCode).json({ message: error.message });
  }

  return res.status(500).json({ message: 'Internal server error' });
};

const registerController = async (req: Request, res: Response) => {
  try {
    const data = registerSchema.parse(req.body);
    const { accessToken, refreshToken } = await register(data);

    res.cookie(REFRESH_COOKIE_NAME, refreshToken, refreshCookieOptions);
    return res.status(201).json({ accessToken });
  } catch (error) {
    return handleError(error, res);
  }
};

const loginController = async (req: Request, res: Response) => {
  try {
    const data = loginSchema.parse(req.body);
    const { accessToken, refreshToken } = await login(data);

    res.cookie(REFRESH_COOKIE_NAME, refreshToken, refreshCookieOptions);
    return res.status(200).json({ accessToken });
  } catch (error) {
    return handleError(error, res);
  }
};

const refreshController = async (req: Request, res: Response) => {
  try {
    const token = req.cookies[REFRESH_COOKIE_NAME] || req.body?.refreshToken;
    if (!token || typeof token !== 'string') {
      return res.status(400).json({ message: 'Refresh token is required' });
    }

    const { accessToken, refreshToken } = await refresh(token);
    res.cookie(REFRESH_COOKIE_NAME, refreshToken, refreshCookieOptions);

    return res.status(200).json({ accessToken });
  } catch (error) {
    return handleError(error, res);
  }
};

const logoutController = async (req: Request, res: Response) => {
  try {
    const token = req.cookies[REFRESH_COOKIE_NAME] || req.body?.refreshToken;
    if (token && typeof token === 'string') {
      await logout(token);
    }

    res.clearCookie(REFRESH_COOKIE_NAME, {
      ...refreshCookieOptions,
      maxAge: 0,
    });

    return res.status(204).send();
  } catch (error) {
    return handleError(error, res);
  }
};

export { loginController, logoutController, refreshController, registerController };
