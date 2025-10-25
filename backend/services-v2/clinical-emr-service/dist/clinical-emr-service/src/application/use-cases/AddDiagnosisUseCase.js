"use strict";
/**
 * AddDiagnosisUseCase - Application Layer
 * Use case for adding diagnosis to medical record
 *
 * @author Hospital Management Team
 * @version 2.0.0
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddDiagnosisUseCase = void 0;
const use_case_interface_1 = require("@shared/application/use-cases/base/use-case.interface");
const RecordId_1 = require("../../domain/value-objects/RecordId");
const Diagnosis_1 = require("../../domain/value-objects/Diagnosis");
class AddDiagnosisUseCase extends use_case_interface_1.BaseHealthcareUseCase {
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
            const diagnosis = Diagnosis_1.Diagnosis.create(request.code, request.display, request.category, request.severity, request.status, request.recordedBy);
            medicalRecord.addDiagnosis(diagnosis, request.recordedBy);
            await this.medicalRecordRepository.update(medicalRecord);
            const events = medicalRecord.getUncommittedEvents();
            if (events.length > 0) {
                await this.eventPublisher.publishBatch(events);
                medicalRecord.markEventsAsCommitted();
            }
            return {
                success: true,
                message: 'Chẩn đoán đã được thêm thành công',
                data: {
                    recordId: request.recordId,
                    diagnosisCode: request.code,
                    addedAt: new Date().toISOString()
                }
            };
        }
        catch (error) {
            throw new Error(`Lỗi khi thêm chẩn đoán: ${error instanceof Error ? error.message : 'Unknown'}`);
        }
    }
    async validate(request) {
        const errors = [];
        if (!request.recordId)
            errors.push({ field: 'recordId', message: 'RecordId là bắt buộc', code: 'REQUIRED' });
        if (!request.code)
            errors.push({ field: 'code', message: 'Diagnosis code là bắt buộc', code: 'REQUIRED' });
        if (!request.display)
            errors.push({ field: 'display', message: 'Diagnosis display là bắt buộc', code: 'REQUIRED' });
        if (!request.recordedBy)
            errors.push({ field: 'recordedBy', message: 'RecordedBy là bắt buộc', code: 'REQUIRED' });
        return { isValid: errors.length === 0, errors };
    }
    async authorize(request, userId) {
        return request.recordedBy === userId;
    }
    involvesPHI(request) {
        return true;
    }
    getPatientId(request) {
        return null;
    }
    getDescription() {
        return 'Thêm chẩn đoán vào hồ sơ bệnh án';
    }
    getRequiredPermissions() {
        return ['medical_record:update', 'diagnosis:add'];
    }
}
exports.AddDiagnosisUseCase = AddDiagnosisUseCase;
//# sourceMappingURL=AddDiagnosisUseCase.js.map