"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminDepartmentController = void 0;
const express_validator_1 = require("express-validator");
const department_repository_1 = require("../repositories/department.repository");
const response_helpers_1 = require("@hospital/shared/dist/utils/response-helpers");
const logger_1 = __importDefault(require("@hospital/shared/dist/utils/logger"));
class AdminDepartmentController {
    constructor() {
        this.departmentRepository = new department_repository_1.DepartmentRepository();
    }
    async getAllDepartments(req, res) {
        try {
            const errors = (0, express_validator_1.validationResult)(req);
            if (!errors.isEmpty()) {
                res.status(400).json(response_helpers_1.ResponseHelper.error('Dữ liệu không hợp lệ', 400, errors.array()));
                return;
            }
            const { search, parent_department_id, is_active, head_doctor_id, page = 1, limit = 20, sort_by = 'department_name', sort_order = 'asc' } = req.query;
            const filters = {
                search: search,
                parent_department_id: parent_department_id,
                is_active: is_active ? is_active === 'true' : undefined,
                head_doctor_id: head_doctor_id
            };
            const pagination = {
                page: parseInt(page),
                limit: parseInt(limit),
                sort_by: sort_by,
                sort_order: sort_order
            };
            const result = await this.departmentRepository.findAll(filters, pagination);
            res.json(response_helpers_1.ResponseHelper.success('Lấy danh sách khoa thành công', {
                departments: result.departments,
                pagination: {
                    current_page: pagination.page,
                    total_pages: result.totalPages,
                    total_items: result.total,
                    items_per_page: pagination.limit
                }
            }));
        }
        catch (error) {
            logger_1.default.error('Error fetching departments:', error);
            res.status(500).json(response_helpers_1.ResponseHelper.error('Lỗi khi lấy danh sách khoa', 500, error.message));
        }
    }
    async getDepartmentStats(req, res) {
        try {
            const stats = await this.departmentRepository.getStats();
            res.json(response_helpers_1.ResponseHelper.success('Lấy thống kê khoa thành công', stats));
        }
        catch (error) {
            logger_1.default.error('Error fetching department stats:', error);
            res.status(500).json(response_helpers_1.ResponseHelper.error('Lỗi khi lấy thống kê khoa', 500, error.message));
        }
    }
    async getDepartmentById(req, res) {
        try {
            const errors = (0, express_validator_1.validationResult)(req);
            if (!errors.isEmpty()) {
                res.status(400).json(response_helpers_1.ResponseHelper.error('ID khoa không hợp lệ', 400, errors.array()));
                return;
            }
            const { departmentId } = req.params;
            const department = await this.departmentRepository.findById(departmentId);
            if (!department) {
                res.status(404).json(response_helpers_1.ResponseHelper.error('Không tìm thấy khoa', 404));
                return;
            }
            res.json(response_helpers_1.ResponseHelper.success('Lấy thông tin khoa thành công', department));
        }
        catch (error) {
            logger_1.default.error('Error fetching department by ID:', error);
            res.status(500).json(response_helpers_1.ResponseHelper.error('Lỗi khi lấy thông tin khoa', 500, error.message));
        }
    }
    async getDepartmentTree(req, res) {
        try {
            const tree = await this.departmentRepository.getDepartmentTree();
            res.json(response_helpers_1.ResponseHelper.success('Lấy cây phân cấp khoa thành công', tree));
        }
        catch (error) {
            logger_1.default.error('Error fetching department tree:', error);
            res.status(500).json(response_helpers_1.ResponseHelper.error('Lỗi khi lấy cây phân cấp khoa', 500, error.message));
        }
    }
    async getSubDepartments(req, res) {
        try {
            const errors = (0, express_validator_1.validationResult)(req);
            if (!errors.isEmpty()) {
                res.status(400).json(response_helpers_1.ResponseHelper.error('ID khoa không hợp lệ', 400, errors.array()));
                return;
            }
            const { departmentId } = req.params;
            const subDepartments = await this.departmentRepository.getChildDepartments(departmentId);
            res.json(response_helpers_1.ResponseHelper.success('Lấy danh sách khoa con thành công', subDepartments));
        }
        catch (error) {
            logger_1.default.error('Error fetching sub-departments:', error);
            res.status(500).json(response_helpers_1.ResponseHelper.error('Lỗi khi lấy danh sách khoa con', 500, error.message));
        }
    }
    async getDepartmentDoctors(req, res) {
        try {
            const errors = (0, express_validator_1.validationResult)(req);
            if (!errors.isEmpty()) {
                res.status(400).json(response_helpers_1.ResponseHelper.error('ID khoa không hợp lệ', 400, errors.array()));
                return;
            }
            const { departmentId } = req.params;
            const doctors = await this.departmentRepository.getDepartmentDoctors(departmentId);
            res.json(response_helpers_1.ResponseHelper.success('Lấy danh sách bác sĩ trong khoa thành công', doctors));
        }
        catch (error) {
            logger_1.default.error('Error fetching department doctors:', error);
            res.status(500).json(response_helpers_1.ResponseHelper.error('Lỗi khi lấy danh sách bác sĩ trong khoa', 500, error.message));
        }
    }
    async getDepartmentRooms(req, res) {
        try {
            const errors = (0, express_validator_1.validationResult)(req);
            if (!errors.isEmpty()) {
                res.status(400).json(response_helpers_1.ResponseHelper.error('ID khoa không hợp lệ', 400, errors.array()));
                return;
            }
            const { departmentId } = req.params;
            const rooms = await this.departmentRepository.getDepartmentRooms(departmentId);
            res.json(response_helpers_1.ResponseHelper.success('Lấy danh sách phòng trong khoa thành công', rooms));
        }
        catch (error) {
            logger_1.default.error('Error fetching department rooms:', error);
            res.status(500).json(response_helpers_1.ResponseHelper.error('Lỗi khi lấy danh sách phòng trong khoa', 500, error.message));
        }
    }
    async createDepartment(req, res) {
        try {
            const errors = (0, express_validator_1.validationResult)(req);
            if (!errors.isEmpty()) {
                res.status(400).json(response_helpers_1.ResponseHelper.error('Dữ liệu tạo khoa không hợp lệ', 400, errors.array()));
                return;
            }
            const departmentData = req.body;
            const newDepartment = await this.departmentRepository.create(departmentData);
            res.status(201).json(response_helpers_1.ResponseHelper.success('Tạo khoa mới thành công', newDepartment));
        }
        catch (error) {
            logger_1.default.error('Error creating department:', error);
            res.status(500).json(response_helpers_1.ResponseHelper.error('Lỗi khi tạo khoa mới', 500, error.message));
        }
    }
    async updateDepartment(req, res) {
        try {
            const errors = (0, express_validator_1.validationResult)(req);
            if (!errors.isEmpty()) {
                res.status(400).json(response_helpers_1.ResponseHelper.error('Dữ liệu cập nhật khoa không hợp lệ', 400, errors.array()));
                return;
            }
            const { departmentId } = req.params;
            const updateData = req.body;
            const updatedDepartment = await this.departmentRepository.update(departmentId, updateData);
            if (!updatedDepartment) {
                res.status(404).json(response_helpers_1.ResponseHelper.error('Không tìm thấy khoa để cập nhật', 404));
                return;
            }
            res.json(response_helpers_1.ResponseHelper.success('Cập nhật khoa thành công', updatedDepartment));
        }
        catch (error) {
            logger_1.default.error('Error updating department:', error);
            res.status(500).json(response_helpers_1.ResponseHelper.error('Lỗi khi cập nhật khoa', 500, error.message));
        }
    }
    async deleteDepartment(req, res) {
        try {
            const errors = (0, express_validator_1.validationResult)(req);
            if (!errors.isEmpty()) {
                res.status(400).json(response_helpers_1.ResponseHelper.error('ID khoa không hợp lệ', 400, errors.array()));
                return;
            }
            const { departmentId } = req.params;
            const deleted = await this.departmentRepository.delete(departmentId);
            if (!deleted) {
                res.status(404).json(response_helpers_1.ResponseHelper.error('Không tìm thấy khoa để xóa', 404));
                return;
            }
            res.json(response_helpers_1.ResponseHelper.success('Xóa khoa thành công', { deleted: true }));
        }
        catch (error) {
            logger_1.default.error('Error deleting department:', error);
            res.status(500).json(response_helpers_1.ResponseHelper.error('Lỗi khi xóa khoa', 500, error.message));
        }
    }
}
exports.AdminDepartmentController = AdminDepartmentController;
//# sourceMappingURL=department.controller.js.map