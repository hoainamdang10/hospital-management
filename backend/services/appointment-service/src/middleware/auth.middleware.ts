import { Request, Response, NextFunction } from 'express';
import logger from '@hospital/shared/dist/utils/logger';

// Kiểu vai trò hệ thống cho guard đơn giản
export type UserRole = 'admin' | 'receptionist' | 'doctor' | 'patient';

// Middleware xác thực đơn giản (placeholder)
// Lưu ý: Ở production, cần xác thực JWT qua API Gateway/Auth Service
export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  try {
    // Dev fallback: nếu không có user, set user hệ thống để tránh build-break
    if (!req.user) {
      (req as any).user = {
        id: 'system',
        role: (process.env.DEFAULT_ROLE as UserRole) || 'admin',
        email: 'system@hospital.local',
      };
    }
    next();
  } catch (err) {
    logger.error('Lỗi xác thực', err);
    res.status(401).json({ success: false, error: { message: 'Không thể xác thực người dùng' } });
  }
}

export function requireReceptionistOrAdmin(req: Request, res: Response, next: NextFunction) {
  const role = req.user?.role as UserRole | undefined;
  if (role === 'admin' || role === 'receptionist') return next();
  return res.status(403).json({ success: false, error: { message: 'Bạn không có quyền truy cập tài nguyên này' } });
}

export function requireDoctor(req: Request, res: Response, next: NextFunction) {
  const role = req.user?.role as UserRole | undefined;
  if (role === 'doctor' || role === 'admin') return next();
  return res.status(403).json({ success: false, error: { message: 'Chỉ bác sĩ mới có quyền truy cập' } });
}

export function requirePatient(req: Request, res: Response, next: NextFunction) {
  const role = req.user?.role as UserRole | undefined;
  if (role === 'patient' || role === 'admin') return next();
  return res.status(403).json({ success: false, error: { message: 'Chỉ bệnh nhân mới có quyền truy cập' } });
}

