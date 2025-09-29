import { Request, Response } from 'express';

export const getPatientProfile = (req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'This is the patient profile.',
    userId: req.headers['x-user-id'],
    role: req.headers['x-user-role'],
    email: req.headers['x-user-email']
  });
};
