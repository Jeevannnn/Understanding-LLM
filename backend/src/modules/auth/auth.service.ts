import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { prisma } from '../../config/db';
import { security } from '../../config/security';
import type { LoginInput, RegisterInput } from './auth.validator';

const ACCESS_TOKEN_EXPIRES_IN = '15m';
const REFRESH_TOKEN_EXPIRES_IN = '30d';
const REFRESH_TOKEN_EXPIRY_MS = 30 * 24 * 60 * 60 * 1000;

class AuthError extends Error {
  statusCode: number;

  constructor(message: string, statusCode = 400) {
    super(message);
    this.name = 'AuthError';
    this.statusCode = statusCode;
  }
}

const hashRefreshToken = (token: string): string => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

const issueTokens = (userId: bigint) => {
  const accessToken = jwt.sign({ sub: userId.toString() }, security.jwtSecret, {
    expiresIn: ACCESS_TOKEN_EXPIRES_IN,
  });

  const refreshToken = jwt.sign({ sub: userId.toString(), type: 'refresh' }, security.refreshSecret, {
    expiresIn: REFRESH_TOKEN_EXPIRES_IN,
  });

  return {
    accessToken,
    refreshToken,
    refreshExpiresAt: new Date(Date.now() + REFRESH_TOKEN_EXPIRY_MS),
  };
};

const register = async (data: RegisterInput) => {
  const existingUser = await prisma.user.findUnique({ where: { email: data.email } });
  if (existingUser) {
    throw new AuthError('Email is already registered', 409);
  }

  const password_hash = await bcrypt.hash(data.password, 10);
  const user = await prisma.user.create({
    data: {
      name: data.name,
      email: data.email,
      password_hash,
    },
  });

  const { accessToken, refreshToken, refreshExpiresAt } = issueTokens(user.id);

  await prisma.refreshToken.create({
    data: {
      user_id: user.id,
      token_hash: hashRefreshToken(refreshToken),
      expires_at: refreshExpiresAt,
    },
  });

  return { accessToken, refreshToken };
};

const login = async (data: LoginInput) => {
  const user = await prisma.user.findUnique({ where: { email: data.email } });
  if (!user) {
    throw new AuthError('Invalid email or password', 401);
  }

  const passwordValid = await bcrypt.compare(data.password, user.password_hash);
  if (!passwordValid) {
    throw new AuthError('Invalid email or password', 401);
  }

  const { accessToken, refreshToken, refreshExpiresAt } = issueTokens(user.id);

  await prisma.refreshToken.create({
    data: {
      user_id: user.id,
      token_hash: hashRefreshToken(refreshToken),
      expires_at: refreshExpiresAt,
    },
  });

  return { accessToken, refreshToken };
};

const refresh = async (token: string) => {
  const tokenHash = hashRefreshToken(token);
  const existingToken = await prisma.refreshToken.findUnique({
    where: {
      token_hash: tokenHash,
    },
  });

  if (!existingToken || existingToken.revoked || existingToken.expires_at <= new Date()) {
    throw new AuthError('Invalid or expired refresh token', 401);
  }

  const { accessToken, refreshToken, refreshExpiresAt } = issueTokens(existingToken.user_id);

  await prisma.$transaction([
    prisma.refreshToken.update({
      where: { id: existingToken.id },
      data: { revoked: true },
    }),
    prisma.refreshToken.create({
      data: {
        user_id: existingToken.user_id,
        token_hash: hashRefreshToken(refreshToken),
        expires_at: refreshExpiresAt,
      },
    }),
  ]);

  return { accessToken, refreshToken };
};

const logout = async (token: string) => {
  const tokenHash = hashRefreshToken(token);
  await prisma.refreshToken.updateMany({
    where: {
      token_hash: tokenHash,
      revoked: false,
    },
    data: {
      revoked: true,
    },
  });
};

export { AuthError, login, logout, refresh, register };
