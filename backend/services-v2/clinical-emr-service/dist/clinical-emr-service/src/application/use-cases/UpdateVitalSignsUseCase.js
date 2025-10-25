"use strict";
/**
 * UpdateVitalSignsUseCase - Application Layer
 * Use case for updating vital signs in medical record
 *
 * @author Hospital Management Team
 * @version 2.0.0
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateVitalSignsUseCase = void 0;
const use_case_interface_1 = require("@shared/application/use-cases/base/use-case.interface");
const RecordId_1 = require("../../domain/value-objects/RecordId");
const BasicVitalSigns_1 = require("../../domain/value-objects/BasicVitalSigns");
class UpdateVitalSignsUseCase extends use_case_interface_1.BaseHealthcareUseCase {
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
            const vitalSigns = BasicVitalSigns_1.BasicVitalSigns.create(request.vitalSigns);
            medicalRecord.updateVitalSigns(vitalSigns, request.updatedBy);
            await this.medicalRecordRepository.update(medicalRecord);
            const events = medicalRecord.getUncommittedEvents();
            if (events.length > 0) {
                await this.eventPublisher.publishBatch(events);
                medicalRecord.markEventsAsCommitted();
            }
            return {
                success: true,
                message: 'Sinh hiệu đã được cập nhật thành công',
                data: {
                    recordId: request.recordId,
                    vitalSigns: vitalSigns.toJSON(),
                    updatedAt: medicalRecord.updatedAt.toISOString()
                }
            };
        }
        catch (error) {
            throw new Error(`Lỗi khi cập nhật sinh hiệu: ${error instanceof Error ? error.message : 'Unknown'}`);
        }
    }
    async validate(request) {
        const errors = [];
        if (!request.recordId)
            errors.push({ field: 'recordId', message: 'RecordId là bắt buộc', code: 'REQUIRED' });
        if (!request.updatedBy)
            errors.push({ field: 'updatedBy', message: 'UpdatedBy là bắt buộc', code: 'REQUIRED' });
        if (!request.vitalSigns || Object.keys(request.vitalSigns).length === 0) {
            errors.push({ field: 'vitalSigns', message: 'Ít nhất một sinh hiệu phải được cung cấp', code: 'REQUIRED' });
        }
        return { isValid: errors.length === 0, errors };
    }
    async authorize(request, userId) {
        return request.updatedBy === userId;
    }
    involvesPHI(request) {
        return true;
    }
    getPatientId(request) {
        return null;
    }
    getDescription() {
        return 'Cập nhật sinh hiệu trong hồ sơ bệnh án';
    }
    getRequiredPermissions() {
        return ['medical_record:update', 'vital_signs:update'];
    }
}
exports.UpdateVitalSignsUseCase = UpdateVitalSignsUseCase;
//# sourceMappingURL=UpdateVitalSignsUseCase.js.map