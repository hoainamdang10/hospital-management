"use strict";
/**
 * ArchiveMedicalRecordUseCase - Application Layer
 * Use case for archiving medical records
 *
 * @author Hospital Management Team
 * @version 2.0.0
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ArchiveMedicalRecordUseCase = void 0;
const use_case_interface_1 = require("@shared/application/use-cases/base/use-case.interface");
const RecordId_1 = require("../../domain/value-objects/RecordId");
class ArchiveMedicalRecordUseCase extends use_case_interface_1.BaseHealthcareUseCase {
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
            medicalRecord.archive(request.archivedBy, request.reason);
            await this.medicalRecordRepository.update(medicalRecord);
            const events = medicalRecord.getUncommittedEvents();
            if (events.length > 0) {
                await this.eventPublisher.publishBatch(events);
                medicalRecord.markEventsAsCommitted();
            }
            return {
                success: true,
                message: 'Hồ sơ bệnh án đã được lưu trữ thành công',
                data: {
                    recordId: request.recordId,
                    archivedAt: medicalRecord.updatedAt.toISOString(),
                    archivedBy: request.archivedBy,
                    reason: request.reason
                }
            };
        }
        catch (error) {
            throw new Error(`Lỗi khi lưu trữ hồ sơ bệnh án: ${error instanceof Error ? error.message : 'Unknown'}`);
        }
    }
    async validate(request) {
        const errors = [];
        if (!request.recordId || request.recordId.trim() === '') {
            errors.push({ field: 'recordId', message: 'RecordId là bắt buộc', code: 'REQUIRED_FIELD' });
        }
        if (!request.archivedBy || request.archivedBy.trim() === '') {
            errors.push({ field: 'archivedBy', message: 'ArchivedBy là bắt buộc', code: 'REQUIRED_FIELD' });
        }
        return { isValid: errors.length === 0, errors };
    }
    async authorize(request, userId) {
        return request.archivedBy === userId;
    }
    involvesPHI(request) {
        return true;
    }
    getPatientId(request) {
        return null;
    }
    getDescription() {
        return 'Lưu trữ hồ sơ bệnh án';
    }
    getRequiredPermissions() {
        return ['medical_record:archive'];
    }
}
exports.ArchiveMedicalRecordUseCase = ArchiveMedicalRecordUseCase;
//# sourceMappingURL=ArchiveMedicalRecordUseCase.js.map