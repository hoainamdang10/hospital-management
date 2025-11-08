"use strict";
/**
 * GetAuditLogsUseCase - Application Layer
 * HIPAA Compliance: System-wide PHI access audit logs
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance HIPAA, Vietnamese Healthcare Standards
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetAuditLogsUseCase = void 0;
const use_case_interface_1 = require("@shared/application/use-cases/base/use-case.interface");
class GetAuditLogsUseCase extends use_case_interface_1.BaseHealthcareUseCase {
    constructor(auditLogService) {
        super();
        this.auditLogService = auditLogService;
    }
    async execute(request) {
        const validation = await this.validate(request);
        if (!validation.isValid) {
            return {
                success: false,
                message: 'Validation failed',
                errors: validation.errors
            };
        }
        // Authorization check
        if (!this.isAuthorized(request.requestedByRole)) {
            return {
                success: false,
                message: 'Không có quyền truy cập audit logs',
                errors: [{ field: 'authorization', message: 'Unauthorized', code: 'FORBIDDEN' }]
            };
        }
        return await this.executeInternal(request);
    }
    async executeInternal(request) {
        try {
            const page = request.page || 1;
            const limit = Math.min(request.limit || 50, 100); // Max 100 per page
            const offset = (page - 1) * limit;
            // Build filter criteria
            const filters = {};
            if (request.patientId)
                filters.patientId = request.patientId;
            if (request.userId)
                filters.userId = request.userId;
            if (request.action)
                filters.action = request.action;
            if (request.startDate)
                filters.startDate = new Date(request.startDate);
            if (request.endDate)
                filters.endDate = new Date(request.endDate);
            // Get audit logs from service
            const result = await this.auditLogService.getAuditLogs(filters, limit, offset);
            // Calculate summary statistics
            const uniqueUsers = new Set(result.logs.map(log => log.userId)).size;
            const uniquePatients = new Set(result.logs.filter(log => log.patientId).map(log => log.patientId)).size;
            const byAction = {};
            result.logs.forEach(log => {
                byAction[log.action] = (byAction[log.action] || 0) + 1;
            });
            const successCount = result.logs.filter(log => log.outcome === 'success').length;
            const failureCount = result.logs.filter(log => log.outcome === 'failure').length;
            return {
                success: true,
                message: `Tìm thấy ${result.total} audit log entries`,
                data: {
                    logs: result.logs,
                    pagination: {
                        page,
                        limit,
                        total: result.total,
                        totalPages: Math.ceil(result.total / limit)
                    },
                    summary: {
                        totalAccesses: result.total,
                        uniqueUsers,
                        uniquePatients,
                        byAction,
                        byOutcome: {
                            success: successCount,
                            failure: failureCount
                        }
                    }
                }
            };
        }
        catch (error) {
            throw new Error(`Lỗi khi lấy audit logs: ${error instanceof Error ? error.message : 'Unknown'}`);
        }
    }
    async validate(request) {
        const errors = [];
        if (!request.requestedBy) {
            errors.push({ field: 'requestedBy', message: 'RequestedBy là bắt buộc', code: 'REQUIRED' });
        }
        if (!request.requestedByRole) {
            errors.push({ field: 'requestedByRole', message: 'RequestedByRole là bắt buộc', code: 'REQUIRED' });
        }
        // Validate date range
        if (request.startDate && request.endDate) {
            const start = new Date(request.startDate);
            const end = new Date(request.endDate);
            if (start > end) {
                errors.push({ field: 'dateRange', message: 'Start date phải trước end date', code: 'INVALID_RANGE' });
            }
        }
        return { isValid: errors.length === 0, errors };
    }
    isAuthorized(role) {
        const authorizedRoles = ['super_admin', 'admin', 'compliance_officer'];
        return authorizedRoles.includes(role.toLowerCase());
    }
    async authorize(request, userId) {
        return this.isAuthorized(request.requestedByRole);
    }
    involvesPHI(request) {
        return true;
    }
    getPatientId(request) {
        return request.patientId || null;
    }
    getDescription() {
        return 'Lấy system-wide PHI access audit logs (HIPAA compliance)';
    }
    getRequiredPermissions() {
        return ['audit:read', 'compliance:view'];
    }
}
exports.GetAuditLogsUseCase = GetAuditLogsUseCase;
//# sourceMappingURL=GetAuditLogsUseCase.js.map