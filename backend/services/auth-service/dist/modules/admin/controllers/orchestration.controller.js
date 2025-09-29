"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminOrchestrationController = void 0;
const AdminOrchestrator_1 = require("../orchestrator/AdminOrchestrator");
const logger_1 = __importDefault(require("@hospital/shared/dist/utils/logger"));
class AdminOrchestrationController {
    constructor() {
        this.createDoctor = async (req, res) => {
            try {
                if (!req.user || !['admin', 'superadmin'].includes(req.user.role)) {
                    res.status(403).json({
                        success: false,
                        error: { message: 'Chỉ admin mới có thể tạo bác sĩ' }
                    });
                    return;
                }
                const { doctorData, departmentId, licenseInfo } = req.body;
                if (!doctorData || !departmentId) {
                    res.status(400).json({
                        success: false,
                        error: { message: 'Thiếu thông tin bác sĩ hoặc khoa' }
                    });
                    return;
                }
                const operation = {
                    id: `op_create_doctor_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                    type: 'create_doctor',
                    payload: {
                        doctorData,
                        departmentId,
                        licenseInfo,
                        createdBy: req.user.id
                    },
                    userId: req.user.id,
                    timestamp: new Date(),
                    status: 'pending',
                    progress: 0
                };
                const result = await this.orchestrator.executeOperation(operation);
                if (result.success) {
                    res.status(201).json({
                        success: true,
                        message: 'Tạo bác sĩ thành công',
                        data: {
                            operationId: result.operationId,
                            result: result.result,
                            executionTime: result.executionTime,
                            affectedServices: result.affectedServices
                        }
                    });
                }
                else {
                    res.status(500).json({
                        success: false,
                        error: {
                            message: 'Lỗi khi tạo bác sĩ',
                            details: result.error
                        },
                        data: {
                            operationId: result.operationId,
                            executionTime: result.executionTime
                        }
                    });
                }
            }
            catch (error) {
                this.logger.error('Doctor creation orchestration failed:', error);
                res.status(500).json({
                    success: false,
                    error: { message: 'Lỗi hệ thống khi tạo bác sĩ' }
                });
            }
        };
        this.bulkUserImport = async (req, res) => {
            try {
                if (!req.user || !['admin', 'superadmin'].includes(req.user.role)) {
                    res.status(403).json({
                        success: false,
                        error: { message: 'Chỉ admin mới có thể import người dùng hàng loạt' }
                    });
                    return;
                }
                const { users, importOptions } = req.body;
                if (!users || !Array.isArray(users) || users.length === 0) {
                    res.status(400).json({
                        success: false,
                        error: { message: 'Danh sách người dùng không hợp lệ' }
                    });
                    return;
                }
                if (users.length > 1000) {
                    res.status(400).json({
                        success: false,
                        error: { message: 'Không thể import quá 1000 người dùng cùng lúc' }
                    });
                    return;
                }
                const operation = {
                    id: `op_bulk_import_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                    type: 'bulk_user_import',
                    payload: {
                        users,
                        importOptions: {
                            skipDuplicates: true,
                            sendWelcomeEmails: false,
                            ...importOptions
                        },
                        createdBy: req.user.id
                    },
                    userId: req.user.id,
                    timestamp: new Date(),
                    status: 'pending',
                    progress: 0
                };
                const result = await this.orchestrator.executeOperation(operation);
                if (result.success) {
                    res.status(201).json({
                        success: true,
                        message: 'Import người dùng hàng loạt thành công',
                        data: {
                            operationId: result.operationId,
                            result: result.result,
                            executionTime: result.executionTime,
                            affectedServices: result.affectedServices
                        }
                    });
                }
                else {
                    res.status(500).json({
                        success: false,
                        error: {
                            message: 'Lỗi khi import người dùng hàng loạt',
                            details: result.error
                        },
                        data: {
                            operationId: result.operationId,
                            executionTime: result.executionTime
                        }
                    });
                }
            }
            catch (error) {
                this.logger.error('Bulk import orchestration failed:', error);
                res.status(500).json({
                    success: false,
                    error: { message: 'Lỗi hệ thống khi import người dùng hàng loạt' }
                });
            }
        };
        this.systemMaintenance = async (req, res) => {
            try {
                if (!req.user || req.user.role !== 'superadmin') {
                    res.status(403).json({
                        success: false,
                        error: { message: 'Chỉ superadmin mới có thể thực hiện bảo trì hệ thống' }
                    });
                    return;
                }
                const { maintenanceType, options, scheduledTime } = req.body;
                if (!maintenanceType) {
                    res.status(400).json({
                        success: false,
                        error: { message: 'Thiếu loại bảo trì' }
                    });
                    return;
                }
                const validTypes = ['database_cleanup', 'cache_refresh', 'log_rotation', 'backup_creation', 'security_scan'];
                if (!validTypes.includes(maintenanceType)) {
                    res.status(400).json({
                        success: false,
                        error: { message: 'Loại bảo trì không hợp lệ' }
                    });
                    return;
                }
                const operation = {
                    id: `op_maintenance_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                    type: 'system_maintenance',
                    payload: {
                        type: maintenanceType,
                        options: {
                            notifyUsers: true,
                            createBackup: true,
                            ...options
                        },
                        scheduledTime,
                        createdBy: req.user.id
                    },
                    userId: req.user.id,
                    timestamp: new Date(),
                    status: 'pending',
                    progress: 0
                };
                const result = await this.orchestrator.executeOperation(operation);
                if (result.success) {
                    res.status(201).json({
                        success: true,
                        message: 'Bảo trì hệ thống thành công',
                        data: {
                            operationId: result.operationId,
                            result: result.result,
                            executionTime: result.executionTime,
                            affectedServices: result.affectedServices
                        }
                    });
                }
                else {
                    res.status(500).json({
                        success: false,
                        error: {
                            message: 'Lỗi khi bảo trì hệ thống',
                            details: result.error
                        },
                        data: {
                            operationId: result.operationId,
                            executionTime: result.executionTime
                        }
                    });
                }
            }
            catch (error) {
                this.logger.error('System maintenance orchestration failed:', error);
                res.status(500).json({
                    success: false,
                    error: { message: 'Lỗi hệ thống khi bảo trì' }
                });
            }
        };
        this.crossServiceSync = async (req, res) => {
            try {
                if (!req.user || !['admin', 'superadmin'].includes(req.user.role)) {
                    res.status(403).json({
                        success: false,
                        error: { message: 'Chỉ admin mới có thể đồng bộ dữ liệu giữa các service' }
                    });
                    return;
                }
                const { syncType, services, options } = req.body;
                if (!syncType) {
                    res.status(400).json({
                        success: false,
                        error: { message: 'Thiếu loại đồng bộ' }
                    });
                    return;
                }
                const operation = {
                    id: `op_sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                    type: 'cross_service_sync',
                    payload: {
                        syncType,
                        services: services || ['all'],
                        options: {
                            validateConsistency: true,
                            createBackup: true,
                            ...options
                        },
                        createdBy: req.user.id
                    },
                    userId: req.user.id,
                    timestamp: new Date(),
                    status: 'pending',
                    progress: 0
                };
                const result = await this.orchestrator.executeOperation(operation);
                if (result.success) {
                    res.status(201).json({
                        success: true,
                        message: 'Đồng bộ dữ liệu giữa các service thành công',
                        data: {
                            operationId: result.operationId,
                            result: result.result,
                            executionTime: result.executionTime,
                            affectedServices: result.affectedServices
                        }
                    });
                }
                else {
                    res.status(500).json({
                        success: false,
                        error: {
                            message: 'Lỗi khi đồng bộ dữ liệu giữa các service',
                            details: result.error
                        },
                        data: {
                            operationId: result.operationId,
                            executionTime: result.executionTime
                        }
                    });
                }
            }
            catch (error) {
                this.logger.error('Cross-service sync orchestration failed:', error);
                res.status(500).json({
                    success: false,
                    error: { message: 'Lỗi hệ thống khi đồng bộ dữ liệu' }
                });
            }
        };
        this.getOperationStatus = async (req, res) => {
            try {
                if (!req.user || !['admin', 'superadmin'].includes(req.user.role)) {
                    res.status(403).json({
                        success: false,
                        error: { message: 'Không có quyền xem trạng thái operation' }
                    });
                    return;
                }
                const { operationId } = req.params;
                const status = await this.orchestrator.getOperationStatus(operationId);
                if (!status) {
                    res.status(404).json({
                        success: false,
                        error: { message: 'Không tìm thấy operation' }
                    });
                    return;
                }
                res.json({
                    success: true,
                    data: status
                });
            }
            catch (error) {
                this.logger.error('Get operation status failed:', error);
                res.status(500).json({
                    success: false,
                    error: { message: 'Lỗi khi lấy trạng thái operation' }
                });
            }
        };
        this.cancelOperation = async (req, res) => {
            try {
                if (!req.user || !['admin', 'superadmin'].includes(req.user.role)) {
                    res.status(403).json({
                        success: false,
                        error: { message: 'Không có quyền hủy operation' }
                    });
                    return;
                }
                const { operationId } = req.params;
                const cancelled = await this.orchestrator.cancelOperation(operationId);
                if (cancelled) {
                    res.json({
                        success: true,
                        message: 'Hủy operation thành công',
                        data: { operationId, status: 'cancelled' }
                    });
                }
                else {
                    res.status(500).json({
                        success: false,
                        error: { message: 'Không thể hủy operation' }
                    });
                }
            }
            catch (error) {
                this.logger.error('Cancel operation failed:', error);
                res.status(500).json({
                    success: false,
                    error: { message: 'Lỗi khi hủy operation' }
                });
            }
        };
        this.getHealthStatus = async (req, res) => {
            try {
                const health = await this.orchestrator.getHealthStatus();
                res.json({
                    success: true,
                    data: health
                });
            }
            catch (error) {
                this.logger.error('Get orchestrator health failed:', error);
                res.status(500).json({
                    success: false,
                    error: { message: 'Lỗi khi lấy trạng thái sức khỏe orchestrator' }
                });
            }
        };
        this.getStatistics = async (req, res) => {
            try {
                if (!req.user || !['admin', 'superadmin'].includes(req.user.role)) {
                    res.status(403).json({
                        success: false,
                        error: { message: 'Không có quyền xem thống kê orchestrator' }
                    });
                    return;
                }
                const statistics = await this.orchestrator.getStatistics();
                res.json({
                    success: true,
                    data: statistics
                });
            }
            catch (error) {
                this.logger.error('Get orchestrator statistics failed:', error);
                res.status(500).json({
                    success: false,
                    error: { message: 'Lỗi khi lấy thống kê orchestrator' }
                });
            }
        };
        this.logger = logger_1.default;
        this.orchestrator = new AdminOrchestrator_1.AdminOrchestrator(this.logger);
    }
    async initialize() {
        await this.orchestrator.initialize();
    }
}
exports.AdminOrchestrationController = AdminOrchestrationController;
//# sourceMappingURL=orchestration.controller.js.map