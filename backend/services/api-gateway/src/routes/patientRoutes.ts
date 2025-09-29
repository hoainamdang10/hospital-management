import express from 'express';
import { authMiddleware } from '../middleware/auth.middleware';

import { checkRoleMiddleware } from '../middleware/checkRoleMiddleware';
import { getPatientProfile } from '../controller/patientController';

const router = express.Router();

router.get('/profile', authMiddleware, checkRoleMiddleware('patient'), getPatientProfile);

export default router;
