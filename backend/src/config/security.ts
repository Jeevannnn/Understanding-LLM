import { env } from './env';

export const security = {
  jwtSecret: env.jwtSecret,
  refreshSecret: env.refreshSecret,
  cookie: {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
    domain: env.cookieDomain,
  },
};
