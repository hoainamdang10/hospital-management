"use strict";
/**
 * AddMedicationUseCase - Application Layer
 * Use case for adding medication to medical record
 *
 * @author Hospital Management Team
 * @version 2.0.0
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddMedicationUseCase = void 0;
const use_case_interface_1 = require("@shared/application/use-cases/base/use-case.interface");
const RecordId_1 = require("../../domain/value-objects/RecordId");
const Medication_1 = require("../../domain/value-objects/Medication");
class AddMedicationUseCase extends use_case_interface_1.BaseHealthcareUseCase {
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
            const medication = Medication_1.Medication.create(request.code, request.name, request.strength || '', request.dosageForm || Medication_1.DosageForm.TABLET, request.route || Medication_1.RouteOfAdministration.ORAL, request.dosage || '', request.frequency?.toString() || '', request.frequencyUnit || Medication_1.FrequencyUnit.TIMES_PER_DAY, request.instructions || '', request.prescribedBy);
            medicalRecord.addMedication(medication, request.prescribedBy);
            await this.medicalRecordRepository.update(medicalRecord);
            const events = medicalRecord.getUncommittedEvents();
            if (events.length > 0) {
                await this.eventPublisher.publishBatch(events);
                medicalRecord.markEventsAsCommitted();
            }
            return {
                success: true,
                message: 'Thuốc đã được thêm thành công',
                data: {
                    recordId: request.recordId,
                    medicationCode: request.code,
                    addedAt: new Date().toISOString()
                }
            };
        }
        catch (error) {
            throw new Error(`Lỗi khi thêm thuốc: ${error instanceof Error ? error.message : 'Unknown'}`);
        }
    }
    async validate(request) {
        const errors = [];
        if (!request.recordId)
            errors.push({ field: 'recordId', message: 'RecordId là bắt buộc', code: 'REQUIRED' });
        if (!request.code)
            errors.push({ field: 'code', message: 'Medication code là bắt buộc', code: 'REQUIRED' });
        if (!request.name)
            errors.push({ field: 'name', message: 'Medication name là bắt buộc', code: 'REQUIRED' });
        if (!request.prescribedBy)
            errors.push({ field: 'prescribedBy', message: 'PrescribedBy là bắt buộc', code: 'REQUIRED' });
        return { isValid: errors.length === 0, errors };
    }
    async authorize(request, userId) {
        return request.prescribedBy === userId;
    }
    involvesPHI(request) {
        return true;
    }
    getPatientId(request) {
        return null;
    }
    getDescription() {
        return 'Thêm thuốc vào hồ sơ bệnh án';
    }
    getRequiredPermissions() {
        return ['medical_record:update', 'medication:prescribe'];
    }
}
exports.AddMedicationUseCase = AddMedicationUseCase;
//# sourceMappingURL=AddMedicationUseCase.js.map