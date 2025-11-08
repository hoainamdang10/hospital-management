import { Request, Response, NextFunction } from 'express';
import { UserContext, UserRole } from '../../../shared/types/user';

const allowedRoles: UserRole[] = ['doctor', 'nurse', 'admin', 'patient'];

export function authenticationMiddleware(req: Request, res: Response, next: NextFunction): void {
  const userId = req.headers['x-user-id'] as string | undefined;
  const roleHeader = (req.headers['x-user-role'] as string | undefined)?.toLowerCase();
  const role = allowedRoles.find((r) => r === roleHeader) ?? undefined;

  if (!userId || !role) {
    res.status(401).json({ success: false, message: 'Unauthorized' });
    return;
  }

  const patientId = req.headers['x-patient-id'] as string | undefined;
  if (role === 'patient' && !patientId) {
    res.status(401).json({ success: false, message: 'Missing patient context' });
    return;
  }

  req.user = {
    id: userId,
    role,
    patientId,
  } as UserContext;

  next();
}

export function requireRoles(...roles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user || !roles.includes(req.user.role)) {
      res.status(403).json({ success: false, message: 'Forbidden' });
      return;
    }
    next();
  };
}

type Location = 'params' | 'query' | 'body';

export function requirePatientScope(options: { location: Location; key: string }) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user || req.user.role !== 'patient') {
      next();
      return;
    }

    let value: unknown;
    if (options.location === 'params') {
      value = req.params?.[options.key];
    } else if (options.location === 'query') {
      const q = req.query?.[options.key];
      value = Array.isArray(q) ? q[0] : q;
    } else {
      value = (req.body ?? {})[options.key];
    }

    if (!value || value !== req.user.patientId) {
      res.status(403).json({ success: false, message: 'Patient scope required' });
      return;
    }

    next();
  };
}
