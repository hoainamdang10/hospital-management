"use strict";
/**
 * RevokeAccessUseCase - Application Layer
 * Use case for revoking access to medical record
 *
 * @author Hospital Management Team
 * @version 2.0.0
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.RevokeAccessUseCase = void 0;
const use_case_interface_1 = require("@shared/application/use-cases/base/use-case.interface");
const RecordId_1 = require("../../domain/value-objects/RecordId");
class RevokeAccessUseCase extends use_case_interface_1.BaseHealthcareUseCase {
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
            // Log access revocation in access log
            medicalRecord.recordReadAccess(request.revokedBy, `Thu hồi quyền truy cập của ${request.revokedFrom}. Lý do: ${request.reason || 'Không có'}`);
            await this.medicalRecordRepository.update(medicalRecord);
            return {
                success: true,
                message: 'Quyền truy cập đã được thu hồi thành công',
                data: {
                    recordId: request.recordId,
                    revokedFrom: request.revokedFrom,
                    revokedAt: new Date().toISOString()
                }
            };
        }
        catch (error) {
            throw new Error(`Lỗi khi thu hồi quyền truy cập: ${error instanceof Error ? error.message : 'Unknown'}`);
        }
    }
    async validate(request) {
        const errors = [];
        if (!request.recordId)
            errors.push({ field: 'recordId', message: 'RecordId là bắt buộc', code: 'REQUIRED' });
        if (!request.revokedFrom)
            errors.push({ field: 'revokedFrom', message: 'RevokedFrom là bắt buộc', code: 'REQUIRED' });
        if (!request.revokedBy)
            errors.push({ field: 'revokedBy', message: 'RevokedBy là bắt buộc', code: 'REQUIRED' });
        return { isValid: errors.length === 0, errors };
    }
    async authorize(request, userId) {
        return request.revokedBy === userId;
    }
    involvesPHI(request) {
        return true;
    }
    getPatientId(request) {
        return null;
    }
    getDescription() {
        return 'Thu hồi quyền truy cập hồ sơ bệnh án';
    }
    getRequiredPermissions() {
        return ['medical_record:share', 'access:revoke'];
    }
}
exports.RevokeAccessUseCase = RevokeAccessUseCase;
//# sourceMappingURL=RevokeAccessUseCase.js.map