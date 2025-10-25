"use strict";
/**
 * DeleteMedicalRecordUseCase - Application Layer
 * Use case for soft-deleting medical records
 *
 * @author Hospital Management Team
 * @version 2.0.0
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeleteMedicalRecordUseCase = void 0;
const use_case_interface_1 = require("@shared/application/use-cases/base/use-case.interface");
const RecordId_1 = require("../../domain/value-objects/RecordId");
class DeleteMedicalRecordUseCase extends use_case_interface_1.BaseHealthcareUseCase {
    constructor(medicalRecordRepository, eventPublisher) {
        super();
        this.medicalRecordRepository = medicalRecordRepository;
        this.eventPublisher = eventPublisher;
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
                    message: `Không tìm thấy hồ sơ bệnh án với ID: ${request.recordId}`,
                    errors: [{
                            field: 'recordId',
                            message: 'Hồ sơ bệnh án không tồn tại',
                            code: 'MEDICAL_RECORD_NOT_FOUND'
                        }]
                };
            }
            // Soft delete
            await this.medicalRecordRepository.delete(recordId);
            return {
                success: true,
                message: 'Hồ sơ bệnh án đã được xóa thành công',
                data: {
                    recordId: request.recordId,
                    deletedAt: new Date().toISOString(),
                    deletedBy: request.deletedBy,
                    reason: request.reason
                }
            };
        }
        catch (error) {
            throw new Error(`Lỗi khi xóa hồ sơ bệnh án: ${error instanceof Error ? error.message : 'Unknown'}`);
        }
    }
    async validate(request) {
        const errors = [];
        if (!request.recordId || request.recordId.trim() === '') {
            errors.push({ field: 'recordId', message: 'RecordId là bắt buộc', code: 'REQUIRED_FIELD' });
        }
        if (!request.deletedBy || request.deletedBy.trim() === '') {
            errors.push({ field: 'deletedBy', message: 'DeletedBy là bắt buộc', code: 'REQUIRED_FIELD' });
        }
        if (!request.reason || request.reason.trim() === '') {
            errors.push({ field: 'reason', message: 'Reason là bắt buộc khi xóa hồ sơ', code: 'REQUIRED_FIELD' });
        }
        return { isValid: errors.length === 0, errors };
    }
    async authorize(request, userId) {
        return request.deletedBy === userId;
    }
    involvesPHI(request) {
        return true;
    }
    getPatientId(request) {
        return null;
    }
    getDescription() {
        return 'Xóa hồ sơ bệnh án';
    }
    getRequiredPermissions() {
        return ['medical_record:delete', 'admin'];
    }
}
exports.DeleteMedicalRecordUseCase = DeleteMedicalRecordUseCase;
//# sourceMappingURL=DeleteMedicalRecordUseCase.js.map