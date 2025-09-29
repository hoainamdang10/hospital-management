"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SpecialtyController = void 0;
const express_validator_1 = require("express-validator");
const specialty_repository_1 = require("../repositories/specialty.repository");
class SpecialtyController {
    constructor() {
        this.specialtyRepository = new specialty_repository_1.SpecialtyRepository();
    }
    async getAllSpecialties(req, res) {
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
            const { search, department_id, is_active, min_consultation_time, max_consultation_time, page = 1, limit = 20 } = req.query;
            const filters = {
                search: search,
                department_id: department_id,
                is_active: is_active ? is_active === 'true' : undefined,
                min_consultation_time: min_consultation_time ? parseInt(min_consultation_time) : undefined,
                max_consultation_time: max_consultation_time ? parseInt(max_consultation_time) : undefined
            };
            const result = await this.specialtyRepository.findAll(filters, parseInt(page), parseInt(limit));
            res.json({
                success: true,
                data: result.specialties,
                message: 'Specialties retrieved successfully',
                timestamp: new Date().toISOString(),
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total: result.total,
                    totalPages: result.totalPages
                }
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
    async getSpecialtyById(req, res) {
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
            const { specialtyId } = req.params;
            const specialty = await this.specialtyRepository.findById(specialtyId);
            if (!specialty) {
                res.status(404).json({
                    success: false,
                    error: 'Specialty not found',
                    timestamp: new Date().toISOString()
                });
                return;
            }
            res.json({
                success: true,
                data: specialty,
                message: 'Specialty retrieved successfully',
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
    async getSpecialtyDoctors(req, res) {
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
            res.json({
                success: true,
                data: [],
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
    async createSpecialty(req, res) {
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
            const specialtyData = req.body;
            const newSpecialty = await this.specialtyRepository.create(specialtyData);
            res.status(201).json({
                success: true,
                data: newSpecialty,
                message: 'Specialty created successfully',
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
    async updateSpecialty(req, res) {
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
            const { specialtyId } = req.params;
            const updateData = req.body;
            const updatedSpecialty = await this.specialtyRepository.update(specialtyId, updateData);
            if (!updatedSpecialty) {
                res.status(404).json({
                    success: false,
                    error: 'Specialty not found',
                    timestamp: new Date().toISOString()
                });
                return;
            }
            res.json({
                success: true,
                data: updatedSpecialty,
                message: 'Specialty updated successfully',
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
    async deleteSpecialty(req, res) {
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
            const { specialtyId } = req.params;
            const deleted = await this.specialtyRepository.delete(specialtyId);
            if (!deleted) {
                res.status(404).json({
                    success: false,
                    error: 'Specialty not found',
                    timestamp: new Date().toISOString()
                });
                return;
            }
            res.json({
                success: true,
                message: 'Specialty deleted successfully',
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
    async getSpecialtyStats(req, res) {
        try {
            const stats = await this.specialtyRepository.getStats();
            res.json({
                success: true,
                data: stats,
                message: 'Specialty statistics retrieved successfully',
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
exports.SpecialtyController = SpecialtyController;
//# sourceMappingURL=specialty.controller.js.map