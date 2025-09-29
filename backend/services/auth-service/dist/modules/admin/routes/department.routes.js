"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const department_controller_1 = require("../controllers/department.controller");
const admin_validators_1 = require("../validators/admin.validators");
const router = express_1.default.Router();
const departmentController = new department_controller_1.AdminDepartmentController();
router.get('/', admin_validators_1.validateDepartmentSearch, departmentController.getAllDepartments.bind(departmentController));
router.get('/stats', departmentController.getDepartmentStats.bind(departmentController));
router.get('/tree', departmentController.getDepartmentTree.bind(departmentController));
router.get('/:departmentId', admin_validators_1.validateDepartmentId, departmentController.getDepartmentById.bind(departmentController));
router.get('/:departmentId/children', admin_validators_1.validateDepartmentId, departmentController.getSubDepartments.bind(departmentController));
router.get('/:departmentId/doctors', admin_validators_1.validateDepartmentId, departmentController.getDepartmentDoctors.bind(departmentController));
router.get('/:departmentId/rooms', admin_validators_1.validateDepartmentId, departmentController.getDepartmentRooms.bind(departmentController));
router.post('/', admin_validators_1.validateCreateDepartment, departmentController.createDepartment.bind(departmentController));
router.put('/:departmentId', admin_validators_1.validateDepartmentId, admin_validators_1.validateUpdateDepartment, departmentController.updateDepartment.bind(departmentController));
router.delete('/:departmentId', admin_validators_1.validateDepartmentId, departmentController.deleteDepartment.bind(departmentController));
exports.default = router;
//# sourceMappingURL=department.routes.js.map