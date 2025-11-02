"use strict";
/**
 * Prescription DTOs - Request/Response Models (Concise Version)
 * @compliance Clean Architecture, DDD, Vietnamese Healthcare Standards
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateCreatePrescriptionRequest = validateCreatePrescriptionRequest;
exports.validateGetPrescriptionRequest = validateGetPrescriptionRequest;
exports.validateDispensePrescriptionRequest = validateDispensePrescriptionRequest;
exports.validateListPrescriptionsRequest = validateListPrescriptionsRequest;
function validateCreatePrescriptionRequest(req) {
    const errors = [];
    if (!req.medicalRecordId?.trim())
        errors.push('MedicalRecordId là bắt buộc');
    if (!req.patientId?.trim())
        errors.push('PatientId là bắt buộc');
    if (!req.prescribedBy?.trim())
        errors.push('PrescribedBy là bắt buộc');
    if (!req.medications || req.medications.length === 0)
        errors.push('Phải có ít nhất một loại thuốc');
    if (!req.prescribedDate?.trim())
        errors.push('PrescribedDate là bắt buộc');
    if (!req.createdBy?.trim())
        errors.push('CreatedBy là bắt buộc');
    if (req.patientId && !/^PAT-\d{6}-\d{3}$/.test(req.patientId))
        errors.push('PatientId không hợp lệ');
    if (req.prescribedBy && !/^[A-Z]{2,4}-DOC-\d{6}-\d{3}$/.test(req.prescribedBy))
        errors.push('PrescribedBy không hợp lệ');
    req.medications?.forEach((med, idx) => {
        if (!med.medicationName?.trim())
            errors.push(`Tên thuốc #${idx + 1} là bắt buộc`);
        if (!med.dosage?.trim())
            errors.push(`Liều lượng thuốc #${idx + 1} là bắt buộc`);
        if (!med.frequency?.trim())
            errors.push(`Tần suất thuốc #${idx + 1} là bắt buộc`);
        if (!med.duration?.trim())
            errors.push(`Thời gian thuốc #${idx + 1} là bắt buộc`);
        if (med.quantity <= 0)
            errors.push(`Số lượng thuốc #${idx + 1} phải > 0`);
    });
    return { valid: errors.length === 0, errors };
}
function validateGetPrescriptionRequest(req) {
    const errors = [];
    if (!req.prescriptionId?.trim())
        errors.push('PrescriptionId là bắt buộc');
    if (!req.accessedBy?.trim())
        errors.push('AccessedBy là bắt buộc');
    if (req.prescriptionId && !/^PRESC-\d{6}-\d{3}$/.test(req.prescriptionId))
        errors.push('PrescriptionId không hợp lệ');
    return { valid: errors.length === 0, errors };
}
function validateDispensePrescriptionRequest(req) {
    const errors = [];
    if (!req.prescriptionId?.trim())
        errors.push('PrescriptionId là bắt buộc');
    if (!req.dispensedBy?.trim())
        errors.push('DispensedBy là bắt buộc');
    if (!req.pharmacyId?.trim())
        errors.push('PharmacyId là bắt buộc');
    return { valid: errors.length === 0, errors };
}
function validateListPrescriptionsRequest(req) {
    const errors = [];
    if (req.limit !== undefined && req.limit <= 0)
        errors.push('Limit phải > 0');
    if (req.offset !== undefined && req.offset < 0)
        errors.push('Offset phải >= 0');
    return { valid: errors.length === 0, errors };
}
//# sourceMappingURL=PrescriptionRequest.js.map