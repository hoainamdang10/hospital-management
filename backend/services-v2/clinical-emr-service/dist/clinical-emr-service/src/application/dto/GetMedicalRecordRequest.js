"use strict";
/**
 * GetMedicalRecordRequest DTO - Application Layer
 * Data Transfer Object for retrieving medical records
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DTO Pattern, Vietnamese Healthcare Standards
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetMedicalRecordValidationRules = void 0;
exports.validateGetMedicalRecordRequest = validateGetMedicalRecordRequest;
exports.mapMedicalRecordToDto = mapMedicalRecordToDto;
/**
 * Validation rules for GetMedicalRecordRequest
 */
exports.GetMedicalRecordValidationRules = {
    recordId: {
        required: true,
        pattern: /^MED-\d{6}-\d{3}$/,
        message: 'RecordId phải có định dạng MED-YYYYMM-XXX'
    },
    requestedBy: {
        required: true,
        pattern: /^[a-f\d]{8}-[a-f\d]{4}-[a-f\d]{4}-[a-f\d]{4}-[a-f\d]{12}$/i,
        message: 'RequestedBy phải là UUID hợp lệ'
    }
};
/**
 * Helper function to validate GetMedicalRecordRequest
 */
function validateGetMedicalRecordRequest(request) {
    const errors = [];
    // Validate recordId
    if (!request.recordId) {
        errors.push({
            field: 'recordId',
            message: 'RecordId là bắt buộc',
            code: 'REQUIRED_FIELD_MISSING',
            value: request.recordId
        });
    }
    else if (!exports.GetMedicalRecordValidationRules.recordId.pattern.test(request.recordId)) {
        errors.push({
            field: 'recordId',
            message: exports.GetMedicalRecordValidationRules.recordId.message,
            code: 'INVALID_FORMAT',
            value: request.recordId
        });
    }
    // Validate requestedBy
    if (!request.requestedBy) {
        errors.push({
            field: 'requestedBy',
            message: 'RequestedBy là bắt buộc',
            code: 'REQUIRED_FIELD_MISSING',
            value: request.requestedBy
        });
    }
    else if (!exports.GetMedicalRecordValidationRules.requestedBy.pattern.test(request.requestedBy)) {
        errors.push({
            field: 'requestedBy',
            message: exports.GetMedicalRecordValidationRules.requestedBy.message,
            code: 'INVALID_FORMAT',
            value: request.requestedBy
        });
    }
    return errors;
}
/**
 * Helper function to map MedicalRecordAggregate to DTO
 */
function mapMedicalRecordToDto(medicalRecord) {
    const vitalSigns = medicalRecord.vitalSigns;
    return {
        recordId: medicalRecord.recordId.value,
        patientId: medicalRecord.patientId,
        doctorId: medicalRecord.doctorId,
        appointmentId: medicalRecord.appointmentId,
        visitDate: medicalRecord.visitDate.toISOString(),
        symptoms: medicalRecord.symptoms,
        examinationNotes: medicalRecord.examinationNotes,
        diagnosis: medicalRecord.diagnosis,
        treatment: medicalRecord.treatment,
        medications: medicalRecord.medications,
        notes: medicalRecord.notes,
        vitalSigns: vitalSigns ? {
            temperature: vitalSigns.temperature,
            bloodPressure: vitalSigns.bloodPressure,
            heartRate: vitalSigns.heartRate,
            weight: vitalSigns.weight,
            height: vitalSigns.height,
            bmi: vitalSigns.calculateBMI(),
            bmiCategory: vitalSigns.getBMICategory(),
            summary: vitalSigns.getSummary()
        } : undefined,
        status: medicalRecord.status,
        createdAt: medicalRecord.createdAt.toISOString(),
        updatedAt: medicalRecord.updatedAt.toISOString(),
        createdBy: medicalRecord.createdBy,
        updatedBy: medicalRecord.updatedBy,
        isActive: medicalRecord.isActive(),
        isArchived: medicalRecord.isArchived(),
        hasVitalSigns: medicalRecord.hasVitalSigns(),
        hasCompleteVitalSigns: medicalRecord.hasCompleteVitalSigns(),
        hasDiagnosis: medicalRecord.hasDiagnosis(),
        hasTreatment: medicalRecord.hasTreatment(),
        hasMedications: medicalRecord.hasMedications(),
        isFromCurrentMonth: medicalRecord.isFromCurrentMonth(),
        isFromCurrentYear: medicalRecord.isFromCurrentYear(),
        summary: medicalRecord.getSummary()
    };
}
//# sourceMappingURL=GetMedicalRecordRequest.js.map