declare global {
  namespace Express {
    interface Request {
      user?: {
        id: bigint;
        email: string;
      };
    }
  }
}

export {};
