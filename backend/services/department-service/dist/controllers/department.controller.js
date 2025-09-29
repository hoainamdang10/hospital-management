"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DepartmentController = void 0;
const express_validator_1 = require("express-validator");
const department_repository_1 = require("../repositories/department.repository");
class DepartmentController {
    constructor() {
        this.departmentRepository = new department_repository_1.DepartmentRepository();
    }
    async getAllDepartments(req, res) {
        try {
            const errors = (0, express_validator_1.validationResult)(req);
            if (!errors.isEmpty()) {
                res.status(400).json({
                    success: false,
                    error: 'Validation failed',
                    details: errors.array(),
                    timestamp: new Date().toISOString()
                });
                return;
            }
            const { search, parent_department_id, is_active, head_doctor_id, page = 1, limit = 20, sort_by = 'department_name', sort_order = 'asc' } = req.query;
            const filters = {
                search: search,
                parent_department_id: parent_department_id,
                is_active: is_active ? is_active === 'true' : undefined,
                head_doctor_id: head_doctor_id
            };
            const result = await this.departmentRepository.findAll(filters, parseInt(page), parseInt(limit));
            const response = {
                success: true,
                data: result.departments,
                message: 'Departments retrieved successfully',
                timestamp: new Date().toISOString(),
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total: result.total,
                    totalPages: result.totalPages
                }
            };
            res.json(response);
        }
        catch (error) {
            res.status(500).json({
                success: false,
                error: 'Internal server error',
                message: error instanceof Error ? error.message : 'Unknown error',
                timestamp: new Date().toISOString()
            });
        }
    }
    async getDepartmentStats(req, res) {
        try {
            const stats = await this.departmentRepository.getStats();
            res.json({
                success: true,
                data: stats,
                message: 'Department statistics retrieved successfully',
                timestamp: new Date().toISOString()
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                error: 'Internal server error',
                message: error instanceof Error ? error.message : 'Unknown error',
                timestamp: new Date().toISOString()
            });
        }
    }
    async getDepartmentById(req, res) {
        try {
            const errors = (0, express_validator_1.validationResult)(req);
            if (!errors.isEmpty()) {
                res.status(400).json({
                    success: false,
                    error: 'Validation failed',
                    details: errors.array(),
                    timestamp: new Date().toISOString()
                });
                return;
            }
            const { departmentId } = req.params;
            const department = await this.departmentRepository.findById(departmentId);
            if (!department) {
                res.status(404).json({
                    success: false,
                    error: 'Department not found',
                    timestamp: new Date().toISOString()
                });
                return;
            }
            res.json({
                success: true,
                data: department,
                message: 'Department retrieved successfully',
                timestamp: new Date().toISOString()
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                error: 'Internal server error',
                message: error instanceof Error ? error.message : 'Unknown error',
                timestamp: new Date().toISOString()
            });
        }
    }
    async getSubDepartments(req, res) {
        try {
            const errors = (0, express_validator_1.validationResult)(req);
            if (!errors.isEmpty()) {
                res.status(400).json({
                    success: false,
                    error: 'Validation failed',
                    details: errors.array(),
                    timestamp: new Date().toISOString()
                });
                return;
            }
            const { departmentId } = req.params;
            const subDepartments = await this.departmentRepository.getSubDepartments(departmentId);
            res.json({
                success: true,
                data: subDepartments,
                message: 'Sub-departments retrieved successfully',
                timestamp: new Date().toISOString()
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                error: 'Internal server error',
                message: error instanceof Error ? error.message : 'Unknown error',
                timestamp: new Date().toISOString()
            });
        }
    }
    async getDepartmentDoctors(req, res) {
        try {
            const errors = (0, express_validator_1.validationResult)(req);
            if (!errors.isEmpty()) {
                res.status(400).json({
                    success: false,
                    error: 'Validation failed',
                    details: errors.array(),
                    timestamp: new Date().toISOString()
                });
                return;
            }
            const { departmentId } = req.params;
            const doctors = await this.departmentRepository.getDepartmentDoctors(departmentId);
            res.json({
                success: true,
                data: doctors,
                message: 'Department doctors retrieved successfully',
                timestamp: new Date().toISOString()
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                error: 'Internal server error',
                message: error instanceof Error ? error.message : 'Unknown error',
                timestamp: new Date().toISOString()
            });
        }
    }
    async getDepartmentRooms(req, res) {
        try {
            const errors = (0, express_validator_1.validationResult)(req);
            if (!errors.isEmpty()) {
                res.status(400).json({
                    success: false,
                    error: 'Validation failed',
                    details: errors.array(),
                    timestamp: new Date().toISOString()
                });
                return;
            }
            const { departmentId } = req.params;
            const rooms = await this.departmentRepository.getDepartmentRooms(departmentId);
            res.json({
                success: true,
                data: rooms,
                message: 'Department rooms retrieved successfully',
                timestamp: new Date().toISOString()
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                error: 'Internal server error',
                message: error instanceof Error ? error.message : 'Unknown error',
                timestamp: new Date().toISOString()
            });
        }
    }
    async getDepartmentTree(req, res) {
        try {
            const tree = await this.departmentRepository.getDepartmentTree();
            res.json({
                success: true,
                data: tree,
                message: 'Department tree retrieved successfully',
                timestamp: new Date().toISOString()
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                error: 'Internal server error',
                message: error instanceof Error ? error.message : 'Unknown error',
                timestamp: new Date().toISOString()
            });
        }
    }
    async getChildDepartments(req, res) {
        try {
            const errors = (0, express_validator_1.validationResult)(req);
            if (!errors.isEmpty()) {
                res.status(400).json({
                    success: false,
                    error: 'Validation failed',
                    details: errors.array(),
                    timestamp: new Date().toISOString()
                });
                return;
            }
            const { departmentId } = req.params;
            const children = await this.departmentRepository.getChildDepartments(departmentId);
            res.json({
                success: true,
                data: children,
                message: 'Child departments retrieved successfully',
                timestamp: new Date().toISOString()
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                error: 'Internal server error',
                message: error instanceof Error ? error.message : 'Unknown error',
                timestamp: new Date().toISOString()
            });
        }
    }
    async getDepartmentPath(req, res) {
        try {
            const errors = (0, express_validator_1.validationResult)(req);
            if (!errors.isEmpty()) {
                res.status(400).json({
                    success: false,
                    error: 'Validation failed',
                    details: errors.array(),
                    timestamp: new Date().toISOString()
                });
                return;
            }
            const { departmentId } = req.params;
            const path = await this.departmentRepository.getDepartmentPath(departmentId);
            res.json({
                success: true,
                data: path,
                message: 'Department path retrieved successfully',
                timestamp: new Date().toISOString()
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                error: 'Internal server error',
                message: error instanceof Error ? error.message : 'Unknown error',
                timestamp: new Date().toISOString()
            });
        }
    }
    async createDepartment(req, res) {
        try {
            const errors = (0, express_validator_1.validationResult)(req);
            if (!errors.isEmpty()) {
                res.status(400).json({
                    success: false,
                    error: 'Validation failed',
                    details: errors.array(),
                    timestamp: new Date().toISOString()
                });
                return;
            }
            const departmentData = req.body;
            const newDepartment = await this.departmentRepository.create(departmentData);
            res.status(201).json({
                success: true,
                data: newDepartment,
                message: 'Department created successfully',
                timestamp: new Date().toISOString()
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                error: 'Internal server error',
                message: error instanceof Error ? error.message : 'Unknown error',
                timestamp: new Date().toISOString()
            });
        }
    }
    async updateDepartment(req, res) {
        try {
            const errors = (0, express_validator_1.validationResult)(req);
            if (!errors.isEmpty()) {
                res.status(400).json({
                    success: false,
                    error: 'Validation failed',
                    details: errors.array(),
                    timestamp: new Date().toISOString()
                });
                return;
            }
            const { departmentId } = req.params;
            const updateData = req.body;
            const updatedDepartment = await this.departmentRepository.update(departmentId, updateData);
            if (!updatedDepartment) {
                res.status(404).json({
                    success: false,
                    error: 'Department not found',
                    timestamp: new Date().toISOString()
                });
                return;
            }
            res.json({
                success: true,
                data: updatedDepartment,
                message: 'Department updated successfully',
                timestamp: new Date().toISOString()
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                error: 'Internal server error',
                message: error instanceof Error ? error.message : 'Unknown error',
                timestamp: new Date().toISOString()
            });
        }
    }
    async deleteDepartment(req, res) {
        try {
            const errors = (0, express_validator_1.validationResult)(req);
            if (!errors.isEmpty()) {
                res.status(400).json({
                    success: false,
                    error: 'Validation failed',
                    details: errors.array(),
                    timestamp: new Date().toISOString()
                });
                return;
            }
            const { departmentId } = req.params;
            const deleted = await this.departmentRepository.delete(departmentId);
            if (!deleted) {
                res.status(404).json({
                    success: false,
                    error: 'Department not found',
                    timestamp: new Date().toISOString()
                });
                return;
            }
            res.json({
                success: true,
                message: 'Department deleted successfully',
                timestamp: new Date().toISOString()
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                error: 'Internal server error',
                message: error instanceof Error ? error.message : 'Unknown error',
                timestamp: new Date().toISOString()
            });
        }
    }
}
exports.DepartmentController = DepartmentController;
//# sourceMappingURL=department.controller.js.map