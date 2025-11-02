/**
 * Express Type Extensions
 * Extend Express Request to include authenticated user
 */

import { Request } from 'express';

declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        email: string;
        role: string;
        tenantId: string;
        permissions?: string[];
      };
    }
  }
}

export {};
