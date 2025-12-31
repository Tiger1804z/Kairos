declare global {
  namespace Express {
    interface Request {
      user?: { user_id: number; role: string; email: string };
    }
  }
}
export {};
