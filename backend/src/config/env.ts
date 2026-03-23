import dotenv from 'dotenv';

dotenv.config();

const requiredKeys = ['DATABASE_URL', 'JWT_SECRET', 'REFRESH_SECRET', 'CORS_ORIGIN'] as const;

for (const key of requiredKeys) {
  if (!process.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
}

export const env = {
  port: Number(process.env.PORT ?? 4000),
  databaseUrl: process.env.DATABASE_URL as string,
  jwtSecret: process.env.JWT_SECRET as string,
  refreshSecret: process.env.REFRESH_SECRET as string,
  corsOrigin: process.env.CORS_ORIGIN as string,
  cookieDomain: process.env.COOKIE_DOMAIN,
};
