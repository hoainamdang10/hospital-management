"use strict";
/**
 * AuditAccessHistoryUseCase - Application Layer
 * Use case for auditing access history of medical record
 *
 * @author Hospital Management Team
 * @version 2.0.0
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditAccessHistoryUseCase = void 0;
const use_case_interface_1 = require("@shared/application/use-cases/base/use-case.interface");
const RecordId_1 = require("../../domain/value-objects/RecordId");
class AuditAccessHistoryUseCase extends use_case_interface_1.BaseHealthcareUseCase {
    constructor(medicalRecordRepository) {
        super();
        this.medicalRecordRepository = medicalRecordRepository;
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
        return await this.executeInternal(request);
    }
    async executeInternal(request) {
        try {
            const recordId = RecordId_1.RecordId.create(request.recordId);
            const medicalRecord = await this.medicalRecordRepository.findById(recordId);
            if (!medicalRecord) {
                return {
                    success: false,
                    message: 'Không tìm thấy hồ sơ bệnh án',
                    errors: [{ field: 'recordId', message: 'Hồ sơ không tồn tại', code: 'NOT_FOUND' }]
                };
            }
            let accessLog = medicalRecord.accessLog || [];
            // Filter by date range
            if (request.dateFrom) {
                const fromDate = new Date(request.dateFrom);
                accessLog = accessLog.filter(log => new Date(log.accessedAt) >= fromDate);
            }
            if (request.dateTo) {
                const toDate = new Date(request.dateTo);
                accessLog = accessLog.filter(log => new Date(log.accessedAt) <= toDate);
            }
            // Filter by access type
            if (request.accessType) {
                accessLog = accessLog.filter(log => log.accessType === request.accessType);
            }
            // Filter by user
            if (request.accessedBy) {
                accessLog = accessLog.filter(log => log.accessedBy === request.accessedBy);
            }
            // Calculate summary
            const uniqueUsers = new Set(accessLog.map(log => log.accessedBy)).size;
            const readAccesses = accessLog.filter(log => log.accessType === 'read').length;
            const writeAccesses = accessLog.filter(log => log.accessType === 'write').length;
            const printAccesses = accessLog.filter(log => log.accessType === 'print').length;
            const exportAccesses = accessLog.filter(log => log.accessType === 'export').length;
            const sortedLogs = [...accessLog].sort((a, b) => new Date(a.accessedAt).getTime() - new Date(b.accessedAt).getTime());
            return {
                success: true,
                message: `Tìm thấy ${accessLog.length} lượt truy cập`,
                data: {
                    recordId: request.recordId,
                    accessLog: accessLog.map(log => ({
                        accessedAt: log.accessedAt.toISOString ? log.accessedAt.toISOString() : log.accessedAt.toString(),
                        accessedBy: log.accessedBy,
                        accessType: log.accessType,
                        ipAddress: log.ipAddress,
                        userAgent: log.userAgent,
                        purpose: log.purpose
                    })),
                    summary: {
                        totalAccesses: accessLog.length,
                        uniqueUsers,
                        readAccesses,
                        writeAccesses,
                        printAccesses,
                        exportAccesses,
                        firstAccessAt: sortedLogs[0]?.accessedAt.toISOString ? sortedLogs[0].accessedAt.toISOString() : sortedLogs[0]?.accessedAt.toString(),
                        lastAccessAt: sortedLogs[sortedLogs.length - 1]?.accessedAt.toISOString ? sortedLogs[sortedLogs.length - 1].accessedAt.toISOString() : sortedLogs[sortedLogs.length - 1]?.accessedAt.toString()
                    }
                }
            };
        }
        catch (error) {
            throw new Error(`Lỗi khi kiểm tra lịch sử truy cập: ${error instanceof Error ? error.message : 'Unknown'}`);
        }
    }
    async validate(request) {
        const errors = [];
        if (!request.recordId)
            errors.push({ field: 'recordId', message: 'RecordId là bắt buộc', code: 'REQUIRED' });
        if (!request.requestedBy)
            errors.push({ field: 'requestedBy', message: 'RequestedBy là bắt buộc', code: 'REQUIRED' });
        return { isValid: errors.length === 0, errors };
    }
    async authorize(request, userId) {
        return request.requestedBy === userId;
    }
    involvesPHI(request) {
        return true;
    }
    getPatientId(request) {
        return null;
    }
    getDescription() {
        return 'Kiểm tra lịch sử truy cập hồ sơ bệnh án';
    }
    getRequiredPermissions() {
        return ['medical_record:audit', 'admin'];
    }
}
exports.AuditAccessHistoryUseCase = AuditAccessHistoryUseCase;
//# sourceMappingURL=AuditAccessHistoryUseCase.js.map