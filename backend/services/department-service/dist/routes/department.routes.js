"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const department_controller_1 = require("../controllers/department.controller");
const department_validators_1 = require("../validators/department.validators");
const router = express_1.default.Router();
const departmentController = new department_controller_1.DepartmentController();
router.get('/', department_validators_1.validateDepartmentSearch, departmentController.getAllDepartments.bind(departmentController));
router.get('/stats', departmentController.getDepartmentStats.bind(departmentController));
router.get('/tree', departmentController.getDepartmentTree.bind(departmentController));
router.get('/:departmentId', department_validators_1.validateDepartmentId, departmentController.getDepartmentById.bind(departmentController));
router.get('/:departmentId/children', department_validators_1.validateDepartmentId, departmentController.getSubDepartments.bind(departmentController));
router.get('/:departmentId/doctors', department_validators_1.validateDepartmentId, departmentController.getDepartmentDoctors.bind(departmentController));
router.get('/:departmentId/rooms', department_validators_1.validateDepartmentId, departmentController.getDepartmentRooms.bind(departmentController));
router.get('/:departmentId/children', department_validators_1.validateDepartmentId, departmentController.getChildDepartments.bind(departmentController));
router.get('/:departmentId/path', department_validators_1.validateDepartmentId, departmentController.getDepartmentPath.bind(departmentController));
router.post('/', department_validators_1.validateCreateDepartment, departmentController.createDepartment.bind(departmentController));
router.put('/:departmentId', department_validators_1.validateDepartmentId, department_validators_1.validateUpdateDepartment, departmentController.updateDepartment.bind(departmentController));
router.delete('/:departmentId', department_validators_1.validateDepartmentId, departmentController.deleteDepartment.bind(departmentController));
exports.default = router;
//# sourceMappingURL=department.routes.js.map