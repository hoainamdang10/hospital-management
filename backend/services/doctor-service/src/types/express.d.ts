import { Request } from 'express';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        userId: string;
        email: string;
        role: string;
        full_name?: string;
        phone_number?: string;
        is_active?: boolean;
        doctor_id?: string;
        patient_id?: string;
      };
    }
  }
}
