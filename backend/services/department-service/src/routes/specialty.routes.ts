import express from 'express';
import { SpecialtyController } from '../controllers/specialty.controller';
import {
  validateSpecialtyId,
  validateCreateSpecialty,
  validateUpdateSpecialty,
  validateSpecialtySearch
} from '../validators/specialty.validators';

const router = express.Router();
const specialtyController = new SpecialtyController();

// GET /api/specialties - Get all specialties with optional filters
router.get(
  '/',
  validateSpecialtySearch,
  specialtyController.getAllSpecialties.bind(specialtyController)
);

// GET /api/specialties/stats - Get specialty statistics
router.get(
  '/stats',
  specialtyController.getSpecialtyStats.bind(specialtyController)
);

// GET /api/specialties/:specialtyId - Get specialty by ID
router.get(
  '/:specialtyId',
  validateSpecialtyId,
  specialtyController.getSpecialtyById.bind(specialtyController)
);

// GET /api/specialties/:specialtyId/doctors - Get doctors with this specialty
router.get(
  '/:specialtyId/doctors',
  validateSpecialtyId,
  specialtyController.getSpecialtyDoctors.bind(specialtyController)
);

// POST /api/specialties - Create new specialty
router.post(
  '/',
  validateCreateSpecialty,
  specialtyController.createSpecialty.bind(specialtyController)
);

// PUT /api/specialties/:specialtyId - Update specialty
router.put(
  '/:specialtyId',
  validateSpecialtyId,
  validateUpdateSpecialty,
  specialtyController.updateSpecialty.bind(specialtyController)
);

// DELETE /api/specialties/:specialtyId - Soft delete specialty
router.delete(
  '/:specialtyId',
  validateSpecialtyId,
  specialtyController.deleteSpecialty.bind(specialtyController)
);

export default router;
