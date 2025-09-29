import express from 'express';
import { AdminDepartmentController } from '../controllers/department.controller';
import {
  validateDepartmentId,
  validateCreateDepartment,
  validateUpdateDepartment,
  validateDepartmentSearch
} from '../validators/admin.validators';

const router = express.Router();
const departmentController = new AdminDepartmentController();

// GET /api/admin/departments - Get all departments with optional filters and pagination
router.get(
  '/',
  validateDepartmentSearch,
  departmentController.getAllDepartments.bind(departmentController)
);

// GET /api/admin/departments/stats - Get department statistics
router.get(
  '/stats',
  departmentController.getDepartmentStats.bind(departmentController)
);

// GET /api/admin/departments/tree - Get department hierarchy tree
router.get('/tree',
  departmentController.getDepartmentTree.bind(departmentController)
);

// GET /api/admin/departments/:departmentId - Get department by ID
router.get(
  '/:departmentId',
  validateDepartmentId,
  departmentController.getDepartmentById.bind(departmentController)
);

// GET /api/admin/departments/:departmentId/children - Get sub-departments
router.get(
  '/:departmentId/children',
  validateDepartmentId,
  departmentController.getSubDepartments.bind(departmentController)
);

// GET /api/admin/departments/:departmentId/doctors - Get doctors in department
router.get(
  '/:departmentId/doctors',
  validateDepartmentId,
  departmentController.getDepartmentDoctors.bind(departmentController)
);

// GET /api/admin/departments/:departmentId/rooms - Get rooms in department
router.get(
  '/:departmentId/rooms',
  validateDepartmentId,
  departmentController.getDepartmentRooms.bind(departmentController)
);

// POST /api/admin/departments - Create new department
router.post(
  '/',
  validateCreateDepartment,
  departmentController.createDepartment.bind(departmentController)
);

// PUT /api/admin/departments/:departmentId - Update department
router.put(
  '/:departmentId',
  validateDepartmentId,
  validateUpdateDepartment,
  departmentController.updateDepartment.bind(departmentController)
);

// DELETE /api/admin/departments/:departmentId - Delete department (soft delete)
router.delete(
  '/:departmentId',
  validateDepartmentId,
  departmentController.deleteDepartment.bind(departmentController)
);

export default router;
