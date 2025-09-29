import express from 'express';
import { DepartmentController } from '../controllers/department.controller';
import {
  validateDepartmentId,
  validateCreateDepartment,
  validateUpdateDepartment,
  validateDepartmentSearch
} from '../validators/department.validators';

const router = express.Router();
const departmentController = new DepartmentController();

// GET /api/departments - Get all departments with optional filters and pagination
router.get(
  '/',
  validateDepartmentSearch,
  departmentController.getAllDepartments.bind(departmentController)
);

// GET /api/departments/stats - Get department statistics
router.get(
  '/stats',
  departmentController.getDepartmentStats.bind(departmentController)
);

// GET /api/departments/tree - Get department hierarchy tree
router.get('/tree',
  departmentController.getDepartmentTree.bind(departmentController)
);

// GET /api/departments/:departmentId - Get department by ID
router.get(
  '/:departmentId',
  validateDepartmentId,
  departmentController.getDepartmentById.bind(departmentController)
);

// GET /api/departments/:departmentId/children - Get sub-departments
router.get(
  '/:departmentId/children',
  validateDepartmentId,
  departmentController.getSubDepartments.bind(departmentController)
);

// GET /api/departments/:departmentId/doctors - Get doctors in department
router.get(
  '/:departmentId/doctors',
  validateDepartmentId,
  departmentController.getDepartmentDoctors.bind(departmentController)
);

// GET /api/departments/:departmentId/rooms - Get rooms in department
router.get(
  '/:departmentId/rooms',
  validateDepartmentId,
  departmentController.getDepartmentRooms.bind(departmentController)
);

// GET /api/departments/:departmentId/children - Get child departments
router.get('/:departmentId/children',
  validateDepartmentId,
  departmentController.getChildDepartments.bind(departmentController)
);

// GET /api/departments/:departmentId/path - Get department path (breadcrumb)
router.get('/:departmentId/path',
  validateDepartmentId,
  departmentController.getDepartmentPath.bind(departmentController)
);

// POST /api/departments - Create new department
router.post(
  '/',
  validateCreateDepartment,
  departmentController.createDepartment.bind(departmentController)
);

// PUT /api/departments/:departmentId - Update department
router.put(
  '/:departmentId',
  validateDepartmentId,
  validateUpdateDepartment,
  departmentController.updateDepartment.bind(departmentController)
);

// DELETE /api/departments/:departmentId - Soft delete department
router.delete(
  '/:departmentId',
  validateDepartmentId,
  departmentController.deleteDepartment.bind(departmentController)
);

export default router;
