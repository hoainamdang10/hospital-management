"use strict";
/**
 * ValidateFHIRComplianceUseCase - Application Layer
 * Use case for validating FHIR compliance of medical record
 *
 * @author Hospital Management Team
 * @version 2.0.0
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ValidateFHIRComplianceUseCase = void 0;
const use_case_interface_1 = require("@shared/application/use-cases/base/use-case.interface");
const RecordId_1 = require("../../domain/value-objects/RecordId");
class ValidateFHIRComplianceUseCase extends use_case_interface_1.BaseHealthcareUseCase {
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
            const complianceResult = medicalRecord.validateFHIRCompliance();
            return {
                success: true,
                message: complianceResult.isValid ? 'Hồ sơ tuân thủ FHIR' : 'Hồ sơ chưa tuân thủ FHIR đầy đủ',
                data: {
                    recordId: request.recordId,
                    isCompliant: complianceResult.isValid,
                    validationErrors: complianceResult.errors,
                    fhirVersion: '4.0.1',
                    validatedAt: new Date().toISOString()
                }
            };
        }
        catch (error) {
            throw new Error(`Lỗi khi kiểm tra FHIR compliance: ${error instanceof Error ? error.message : 'Unknown'}`);
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
        return 'Kiểm tra tuân thủ FHIR của hồ sơ bệnh án';
    }
    getRequiredPermissions() {
        return ['medical_record:read', 'fhir:validate'];
    }
}
exports.ValidateFHIRComplianceUseCase = ValidateFHIRComplianceUseCase;
//# sourceMappingURL=ValidateFHIRComplianceUseCase.js.map