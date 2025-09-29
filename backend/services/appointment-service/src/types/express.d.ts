import { UserRole } from '../middleware/auth.middleware';

declare global {
  namespace Express {
    interface User {
      id: string;
      role: UserRole;
      email?: string;
    }
    interface Request {
      user: User;
    }
  }
}

export {};

