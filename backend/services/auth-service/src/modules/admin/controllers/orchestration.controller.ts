import { Request, Response } from 'express';
import { Logger } from 'winston';
import { AdminOrchestrator, AdminOperation, OrchestrationResult } from '../orchestrator/AdminOrchestrator';
import logger from '@hospital/shared/dist/utils/logger';

export class AdminOrchestrationController {
  private orchestrator: AdminOrchestrator;
  private logger: Logger;

  constructor() {
    this.logger = logger;
    this.orchestrator = new AdminOrchestrator(this.logger);
  }

  /**
   * Initialize orchestrator (called once during service startup)
   */
  async initialize(): Promise<void> {
    await this.orchestrator.initialize();
  }

  /**
   * Create doctor with full orchestration
   * POST /api/admin/orchestrate/doctor-creation
   */
  createDoctor = async (req: Request, res: Response): Promise<void> => {
    try {
      // Authorization check
      if (!req.user || !['admin', 'superadmin'].includes(req.user.role)) {
        res.status(403).json({
          success: false,
          error: { message: 'Chỉ admin mới có thể tạo bác sĩ' }
        });
        return;
      }

      const { doctorData, departmentId, licenseInfo } = req.body;

      // Validate required fields
      if (!doctorData || !departmentId) {
        res.status(400).json({
          success: false,
          error: { message: 'Thiếu thông tin bác sĩ hoặc khoa' }
        });
        return;
      }

      // Create operation
      const operation: AdminOperation = {
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

      // Execute orchestration
      const result: OrchestrationResult = await this.orchestrator.executeOperation(operation);

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
      } else {
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

    } catch (error: any) {
      this.logger.error('Doctor creation orchestration failed:', error);
      res.status(500).json({
        success: false,
        error: { message: 'Lỗi hệ thống khi tạo bác sĩ' }
      });
    }
  };

  /**
   * Bulk user import with orchestration
   * POST /api/admin/orchestrate/bulk-import
   */
  bulkUserImport = async (req: Request, res: Response): Promise<void> => {
    try {
      // Authorization check
      if (!req.user || !['admin', 'superadmin'].includes(req.user.role)) {
        res.status(403).json({
          success: false,
          error: { message: 'Chỉ admin mới có thể import người dùng hàng loạt' }
        });
        return;
      }

      const { users, importOptions } = req.body;

      // Validate required fields
      if (!users || !Array.isArray(users) || users.length === 0) {
        res.status(400).json({
          success: false,
          error: { message: 'Danh sách người dùng không hợp lệ' }
        });
        return;
      }

      // Validate user limit
      if (users.length > 1000) {
        res.status(400).json({
          success: false,
          error: { message: 'Không thể import quá 1000 người dùng cùng lúc' }
        });
        return;
      }

      // Create operation
      const operation: AdminOperation = {
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

      // Execute orchestration
      const result: OrchestrationResult = await this.orchestrator.executeOperation(operation);

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
      } else {
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

    } catch (error: any) {
      this.logger.error('Bulk import orchestration failed:', error);
      res.status(500).json({
        success: false,
        error: { message: 'Lỗi hệ thống khi import người dùng hàng loạt' }
      });
    }
  };

  /**
   * System maintenance with orchestration
   * POST /api/admin/orchestrate/system-maintenance
   */
  systemMaintenance = async (req: Request, res: Response): Promise<void> => {
    try {
      // Authorization check
      if (!req.user || req.user.role !== 'superadmin') {
        res.status(403).json({
          success: false,
          error: { message: 'Chỉ superadmin mới có thể thực hiện bảo trì hệ thống' }
        });
        return;
      }

      const { maintenanceType, options, scheduledTime } = req.body;

      // Validate required fields
      if (!maintenanceType) {
        res.status(400).json({
          success: false,
          error: { message: 'Thiếu loại bảo trì' }
        });
        return;
      }

      // Validate maintenance type
      const validTypes = ['database_cleanup', 'cache_refresh', 'log_rotation', 'backup_creation', 'security_scan'];
      if (!validTypes.includes(maintenanceType)) {
        res.status(400).json({
          success: false,
          error: { message: 'Loại bảo trì không hợp lệ' }
        });
        return;
      }

      // Create operation
      const operation: AdminOperation = {
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

      // Execute orchestration
      const result: OrchestrationResult = await this.orchestrator.executeOperation(operation);

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
      } else {
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

    } catch (error: any) {
      this.logger.error('System maintenance orchestration failed:', error);
      res.status(500).json({
        success: false,
        error: { message: 'Lỗi hệ thống khi bảo trì' }
      });
    }
  };

  /**
   * Cross-service sync with orchestration
   * POST /api/admin/orchestrate/cross-service-sync
   */
  crossServiceSync = async (req: Request, res: Response): Promise<void> => {
    try {
      // Authorization check
      if (!req.user || !['admin', 'superadmin'].includes(req.user.role)) {
        res.status(403).json({
          success: false,
          error: { message: 'Chỉ admin mới có thể đồng bộ dữ liệu giữa các service' }
        });
        return;
      }

      const { syncType, services, options } = req.body;

      // Validate required fields
      if (!syncType) {
        res.status(400).json({
          success: false,
          error: { message: 'Thiếu loại đồng bộ' }
        });
        return;
      }

      // Create operation
      const operation: AdminOperation = {
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

      // Execute orchestration
      const result: OrchestrationResult = await this.orchestrator.executeOperation(operation);

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
      } else {
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

    } catch (error: any) {
      this.logger.error('Cross-service sync orchestration failed:', error);
      res.status(500).json({
        success: false,
        error: { message: 'Lỗi hệ thống khi đồng bộ dữ liệu' }
      });
    }
  };

  /**
   * Get operation status
   * GET /api/admin/orchestrate/operations/:operationId
   */
  getOperationStatus = async (req: Request, res: Response): Promise<void> => {
    try {
      // Authorization check
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

    } catch (error: any) {
      this.logger.error('Get operation status failed:', error);
      res.status(500).json({
        success: false,
        error: { message: 'Lỗi khi lấy trạng thái operation' }
      });
    }
  };

  /**
   * Cancel operation
   * PUT /api/admin/orchestrate/operations/:operationId/cancel
   */
  cancelOperation = async (req: Request, res: Response): Promise<void> => {
    try {
      // Authorization check
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
      } else {
        res.status(500).json({
          success: false,
          error: { message: 'Không thể hủy operation' }
        });
      }

    } catch (error: any) {
      this.logger.error('Cancel operation failed:', error);
      res.status(500).json({
        success: false,
        error: { message: 'Lỗi khi hủy operation' }
      });
    }
  };

  /**
   * Get orchestrator health status
   * GET /api/admin/orchestrate/health
   */
  getHealthStatus = async (req: Request, res: Response): Promise<void> => {
    try {
      const health = await this.orchestrator.getHealthStatus();

      res.json({
        success: true,
        data: health
      });

    } catch (error: any) {
      this.logger.error('Get orchestrator health failed:', error);
      res.status(500).json({
        success: false,
        error: { message: 'Lỗi khi lấy trạng thái sức khỏe orchestrator' }
      });
    }
  };

  /**
   * Get orchestrator statistics
   * GET /api/admin/orchestrate/statistics
   */
  getStatistics = async (req: Request, res: Response): Promise<void> => {
    try {
      // Authorization check
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

    } catch (error: any) {
      this.logger.error('Get orchestrator statistics failed:', error);
      res.status(500).json({
        success: false,
        error: { message: 'Lỗi khi lấy thống kê orchestrator' }
      });
    }
  };
}
