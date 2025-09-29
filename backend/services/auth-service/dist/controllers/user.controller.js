"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserController = void 0;
const express_validator_1 = require("express-validator");
const user_service_1 = require("../services/user.service");
const logger_1 = __importDefault(require("@hospital/shared/dist/utils/logger"));
class UserController {
    constructor() {
        this.getProfile = async (req, res) => {
            try {
                const userId = req.user?.id;
                if (!userId) {
                    res.status(401).json({
                        success: false,
                        error: 'User not authenticated'
                    });
                    return;
                }
                const result = await this.userService.getUserProfile(userId);
                if (result.error) {
                    res.status(404).json({
                        success: false,
                        error: result.error,
                        message: 'Profile not found'
                    });
                    return;
                }
                res.status(200).json({
                    success: true,
                    message: 'Profile retrieved successfully',
                    user: result.user
                });
            }
            catch (error) {
                logger_1.default.error('Get profile error:', error);
                res.status(500).json({
                    success: false,
                    error: 'Internal server error',
                    message: 'Failed to retrieve profile'
                });
            }
        };
        this.updateProfile = async (req, res) => {
            try {
                const errors = (0, express_validator_1.validationResult)(req);
                if (!errors.isEmpty()) {
                    res.status(400).json({
                        success: false,
                        error: 'Validation failed',
                        details: errors.array()
                    });
                    return;
                }
                const userId = req.user?.id;
                const updateData = req.body;
                if (!userId) {
                    res.status(401).json({
                        success: false,
                        error: 'User not authenticated'
                    });
                    return;
                }
                const result = await this.userService.updateUserProfile(userId, updateData);
                if (result.error) {
                    res.status(400).json({
                        success: false,
                        error: result.error,
                        message: 'Failed to update profile'
                    });
                    return;
                }
                logger_1.default.info('Profile updated successfully', {
                    userId,
                    updatedFields: Object.keys(updateData)
                });
                res.status(200).json({
                    success: true,
                    message: 'Profile updated successfully',
                    user: result.user
                });
            }
            catch (error) {
                logger_1.default.error('Update profile error:', error);
                res.status(500).json({
                    success: false,
                    error: 'Internal server error',
                    message: 'Failed to update profile'
                });
            }
        };
        this.getAllUsers = async (req, res) => {
            try {
                const page = parseInt(req.query.page) || 1;
                const limit = parseInt(req.query.limit) || 10;
                const role = req.query.role;
                const search = req.query.search;
                const result = await this.userService.getAllUsers({
                    page,
                    limit,
                    role,
                    search
                });
                if (result.error) {
                    res.status(400).json({
                        success: false,
                        error: result.error,
                        message: 'Failed to retrieve users'
                    });
                    return;
                }
                res.status(200).json({
                    success: true,
                    message: 'Users retrieved successfully',
                    users: result.users,
                    pagination: result.pagination
                });
            }
            catch (error) {
                logger_1.default.error('Get all users error:', error);
                res.status(500).json({
                    success: false,
                    error: 'Internal server error',
                    message: 'Failed to retrieve users'
                });
            }
        };
        this.getUserById = async (req, res) => {
            try {
                const { userId } = req.params;
                const result = await this.userService.getUserProfile(userId);
                if (result.error) {
                    res.status(404).json({
                        success: false,
                        error: result.error,
                        message: 'User not found'
                    });
                    return;
                }
                res.status(200).json({
                    success: true,
                    message: 'User retrieved successfully',
                    user: result.user
                });
            }
            catch (error) {
                logger_1.default.error('Get user by ID error:', error);
                res.status(500).json({
                    success: false,
                    error: 'Internal server error',
                    message: 'Failed to retrieve user'
                });
            }
        };
        this.activateUser = async (req, res) => {
            try {
                const { userId } = req.params;
                const adminId = req.user?.id;
                const result = await this.userService.updateUserStatus(userId, true);
                if (result.error) {
                    res.status(400).json({
                        success: false,
                        error: result.error,
                        message: 'Failed to activate user'
                    });
                    return;
                }
                logger_1.default.info('User activated', {
                    userId,
                    activatedBy: adminId
                });
                res.status(200).json({
                    success: true,
                    message: 'User activated successfully',
                    user: result.user
                });
            }
            catch (error) {
                logger_1.default.error('Activate user error:', error);
                res.status(500).json({
                    success: false,
                    error: 'Internal server error',
                    message: 'Failed to activate user'
                });
            }
        };
        this.deactivateUser = async (req, res) => {
            try {
                const { userId } = req.params;
                const adminId = req.user?.id;
                if (userId === adminId) {
                    res.status(400).json({
                        success: false,
                        error: 'Cannot deactivate your own account'
                    });
                    return;
                }
                const result = await this.userService.updateUserStatus(userId, false);
                if (result.error) {
                    res.status(400).json({
                        success: false,
                        error: result.error,
                        message: 'Failed to deactivate user'
                    });
                    return;
                }
                logger_1.default.info('User deactivated', {
                    userId,
                    deactivatedBy: adminId
                });
                res.status(200).json({
                    success: true,
                    message: 'User deactivated successfully',
                    user: result.user
                });
            }
            catch (error) {
                logger_1.default.error('Deactivate user error:', error);
                res.status(500).json({
                    success: false,
                    error: 'Internal server error',
                    message: 'Failed to deactivate user'
                });
            }
        };
        this.updateUserRole = async (req, res) => {
            try {
                const errors = (0, express_validator_1.validationResult)(req);
                if (!errors.isEmpty()) {
                    res.status(400).json({
                        success: false,
                        error: 'Validation failed',
                        details: errors.array()
                    });
                    return;
                }
                const { userId } = req.params;
                const { role } = req.body;
                const adminId = req.user?.id;
                if (userId === adminId) {
                    res.status(400).json({
                        success: false,
                        error: 'Cannot change your own role'
                    });
                    return;
                }
                const result = await this.userService.updateUserRole(userId, role);
                if (result.error) {
                    res.status(400).json({
                        success: false,
                        error: result.error,
                        message: 'Failed to update user role'
                    });
                    return;
                }
                logger_1.default.info('User role updated', {
                    userId,
                    newRole: role,
                    updatedBy: adminId
                });
                res.status(200).json({
                    success: true,
                    message: 'User role updated successfully',
                    user: result.user
                });
            }
            catch (error) {
                logger_1.default.error('Update user role error:', error);
                res.status(500).json({
                    success: false,
                    error: 'Internal server error',
                    message: 'Failed to update user role'
                });
            }
        };
        this.deleteUser = async (req, res) => {
            try {
                const { userId } = req.params;
                const adminId = req.user?.id;
                if (userId === adminId) {
                    res.status(400).json({
                        success: false,
                        error: 'Cannot delete your own account'
                    });
                    return;
                }
                const result = await this.userService.deleteUser(userId);
                if (result.error) {
                    res.status(400).json({
                        success: false,
                        error: result.error,
                        message: 'Failed to delete user'
                    });
                    return;
                }
                logger_1.default.info('User deleted', {
                    userId,
                    deletedBy: adminId
                });
                res.status(200).json({
                    success: true,
                    message: 'User deleted successfully'
                });
            }
            catch (error) {
                logger_1.default.error('Delete user error:', error);
                res.status(500).json({
                    success: false,
                    error: 'Internal server error',
                    message: 'Failed to delete user'
                });
            }
        };
        this.userService = new user_service_1.UserService();
    }
}
exports.UserController = UserController;
//# sourceMappingURL=user.controller.js.map