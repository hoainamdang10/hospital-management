/**
 * Express.js type extensions for Hospital Management System
 */

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        role: string;
        email: string;
        department_id?: string;
      };
      shouldMaskData?: boolean;
    }
  }
}

export {};
