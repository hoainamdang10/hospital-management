"use strict";
/**
 * RemoveMedicationUseCase - Application Layer
 * Use case for removing medication from medical record
 *
 * @author Hospital Management Team
 * @version 2.0.0
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.RemoveMedicationUseCase = void 0;
const use_case_interface_1 = require("@shared/application/use-cases/base/use-case.interface");
const RecordId_1 = require("../../domain/value-objects/RecordId");
class RemoveMedicationUseCase extends use_case_interface_1.BaseHealthcareUseCase {
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
                    message: 'Không tìm thấy hồ sơ bệnh án',
                    errors: [{ field: 'recordId', message: 'Hồ sơ không tồn tại', code: 'NOT_FOUND' }]
                };
            }
            medicalRecord.removeMedication(request.medicationCode, request.removedBy, request.reason);
            await this.medicalRecordRepository.update(medicalRecord);
            const events = medicalRecord.getUncommittedEvents();
            if (events.length > 0) {
                await this.eventPublisher.publishBatch(events);
                medicalRecord.markEventsAsCommitted();
            }
            return {
                success: true,
                message: 'Thuốc đã được xóa thành công',
                data: {
                    recordId: request.recordId,
                    medicationCode: request.medicationCode,
                    removedAt: new Date().toISOString()
                }
            };
        }
        catch (error) {
            throw new Error(`Lỗi khi xóa thuốc: ${error instanceof Error ? error.message : 'Unknown'}`);
        }
    }
    async validate(request) {
        const errors = [];
        if (!request.recordId)
            errors.push({ field: 'recordId', message: 'RecordId là bắt buộc', code: 'REQUIRED' });
        if (!request.medicationCode)
            errors.push({ field: 'medicationCode', message: 'Medication code là bắt buộc', code: 'REQUIRED' });
        if (!request.removedBy)
            errors.push({ field: 'removedBy', message: 'RemovedBy là bắt buộc', code: 'REQUIRED' });
        return { isValid: errors.length === 0, errors };
    }
    async authorize(request, userId) {
        return request.removedBy === userId;
    }
    involvesPHI(request) {
        return true;
    }
    getPatientId(request) {
        return null;
    }
    getDescription() {
        return 'Xóa thuốc khỏi hồ sơ bệnh án';
    }
    getRequiredPermissions() {
        return ['medical_record:update', 'medication:remove'];
    }
}
exports.RemoveMedicationUseCase = RemoveMedicationUseCase;
//# sourceMappingURL=RemoveMedicationUseCase.js.map