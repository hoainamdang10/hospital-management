"use strict";
/**
 * CreateMedicalRecordRequest DTO - Application Layer
 * Data Transfer Object for creating medical records
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DTO Pattern, Vietnamese Healthcare Standards
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateMedicalRecordValidationRules = void 0;
exports.validateCreateMedicalRecordRequest = validateCreateMedicalRecordRequest;
/**
 * Validation rules for CreateMedicalRecordRequest
 */
exports.CreateMedicalRecordValidationRules = {
    patientId: {
        required: true,
        pattern: /^PAT-\d{6}-\d{3}$/,
        message: 'PatientId phải có định dạng PAT-YYYYMM-XXX'
    },
    doctorId: {
        required: true,
        pattern: /^[A-Z]{2,4}-DOC-\d{6}-\d{3}$/,
        message: 'DoctorId phải có định dạng DEPT-DOC-YYYYMM-XXX'
    },
    visitDate: {
        required: true,
        type: 'date',
        message: 'Ngày khám là bắt buộc và phải có định dạng hợp lệ'
    },
    appointmentId: {
        required: false,
        pattern: /^[a-f\d]{8}-[a-f\d]{4}-[a-f\d]{4}-[a-f\d]{4}-[a-f\d]{12}$/i,
        message: 'AppointmentId phải là UUID hợp lệ'
    },
    symptoms: {
        required: false,
        maxLength: 2000,
        message: 'Triệu chứng không được vượt quá 2000 ký tự'
    },
    examinationNotes: {
        required: false,
        maxLength: 5000,
        message: 'Ghi chú khám bệnh không được vượt quá 5000 ký tự'
    },
    diagnosis: {
        required: false,
        maxLength: 1000,
        message: 'Chẩn đoán không được vượt quá 1000 ký tự'
    },
    treatment: {
        required: false,
        maxLength: 2000,
        message: 'Điều trị không được vượt quá 2000 ký tự'
    },
    medications: {
        required: false,
        maxLength: 2000,
        message: 'Thuốc không được vượt quá 2000 ký tự'
    },
    notes: {
        required: false,
        maxLength: 3000,
        message: 'Ghi chú không được vượt quá 3000 ký tự'
    },
    createdBy: {
        required: true,
        pattern: /^[a-f\d]{8}-[a-f\d]{4}-[a-f\d]{4}-[a-f\d]{4}-[a-f\d]{12}$/i,
        message: 'CreatedBy phải là UUID hợp lệ'
    },
    vitalSigns: {
        required: false,
        properties: {
            temperature: {
                type: 'number',
                min: 35.0,
                max: 42.0,
                message: 'Nhiệt độ phải từ 35.0°C đến 42.0°C'
            },
            bloodPressure: {
                pattern: /^\d{2,3}\/\d{2,3}$/,
                message: 'Huyết áp phải có định dạng "120/80"'
            },
            heartRate: {
                type: 'number',
                min: 40,
                max: 200,
                message: 'Nhịp tim phải từ 40 đến 200 BPM'
            },
            weight: {
                type: 'number',
                min: 1.0,
                max: 300.0,
                message: 'Cân nặng phải từ 1.0 đến 300.0 kg'
            },
            height: {
                type: 'number',
                min: 30.0,
                max: 250.0,
                message: 'Chiều cao phải từ 30.0 đến 250.0 cm'
            }
        }
    }
};
/**
 * Helper function to validate CreateMedicalRecordRequest
 */
function validateCreateMedicalRecordRequest(request) {
    const errors = [];
    // Validate required fields
    if (!request.patientId) {
        errors.push({
            field: 'patientId',
            message: 'PatientId là bắt buộc',
            code: 'REQUIRED_FIELD_MISSING',
            value: request.patientId
        });
    }
    else if (!exports.CreateMedicalRecordValidationRules.patientId.pattern.test(request.patientId)) {
        errors.push({
            field: 'patientId',
            message: exports.CreateMedicalRecordValidationRules.patientId.message,
            code: 'INVALID_FORMAT',
            value: request.patientId
        });
    }
    if (!request.doctorId) {
        errors.push({
            field: 'doctorId',
            message: 'DoctorId là bắt buộc',
            code: 'REQUIRED_FIELD_MISSING',
            value: request.doctorId
        });
    }
    else if (!exports.CreateMedicalRecordValidationRules.doctorId.pattern.test(request.doctorId)) {
        errors.push({
            field: 'doctorId',
            message: exports.CreateMedicalRecordValidationRules.doctorId.message,
            code: 'INVALID_FORMAT',
            value: request.doctorId
        });
    }
    if (!request.visitDate) {
        errors.push({
            field: 'visitDate',
            message: 'Ngày khám là bắt buộc',
            code: 'REQUIRED_FIELD_MISSING',
            value: request.visitDate
        });
    }
    else {
        const visitDate = new Date(request.visitDate);
        if (isNaN(visitDate.getTime())) {
            errors.push({
                field: 'visitDate',
                message: 'Ngày khám phải có định dạng hợp lệ',
                code: 'INVALID_DATE_FORMAT',
                value: request.visitDate
            });
        }
        else {
            // Check date range
            const now = new Date();
            const maxFutureDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
            const minPastDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
            if (visitDate > maxFutureDate) {
                errors.push({
                    field: 'visitDate',
                    message: 'Ngày khám không được quá 7 ngày trong tương lai',
                    code: 'DATE_TOO_FUTURE',
                    value: request.visitDate
                });
            }
            if (visitDate < minPastDate) {
                errors.push({
                    field: 'visitDate',
                    message: 'Ngày khám không được quá 1 năm trong quá khứ',
                    code: 'DATE_TOO_PAST',
                    value: request.visitDate
                });
            }
        }
    }
    if (!request.createdBy) {
        errors.push({
            field: 'createdBy',
            message: 'CreatedBy là bắt buộc',
            code: 'REQUIRED_FIELD_MISSING',
            value: request.createdBy
        });
    }
    else if (!exports.CreateMedicalRecordValidationRules.createdBy.pattern.test(request.createdBy)) {
        errors.push({
            field: 'createdBy',
            message: exports.CreateMedicalRecordValidationRules.createdBy.message,
            code: 'INVALID_FORMAT',
            value: request.createdBy
        });
    }
    // Validate optional fields
    if (request.appointmentId && !exports.CreateMedicalRecordValidationRules.appointmentId.pattern.test(request.appointmentId)) {
        errors.push({
            field: 'appointmentId',
            message: exports.CreateMedicalRecordValidationRules.appointmentId.message,
            code: 'INVALID_FORMAT',
            value: request.appointmentId
        });
    }
    // Validate text field lengths
    const textFields = ['symptoms', 'examinationNotes', 'diagnosis', 'treatment', 'medications', 'notes'];
    textFields.forEach(field => {
        const value = request[field];
        if (value) {
            const rule = exports.CreateMedicalRecordValidationRules[field];
            if (rule.maxLength && value.length > rule.maxLength) {
                errors.push({
                    field,
                    message: rule.message,
                    code: 'TEXT_TOO_LONG',
                    value: value.length
                });
            }
        }
    });
    // Validate vital signs
    if (request.vitalSigns) {
        const vitalSigns = request.vitalSigns;
        if (vitalSigns.temperature !== undefined) {
            if (typeof vitalSigns.temperature !== 'number' ||
                vitalSigns.temperature < 35.0 ||
                vitalSigns.temperature > 42.0) {
                errors.push({
                    field: 'vitalSigns.temperature',
                    message: 'Nhiệt độ phải từ 35.0°C đến 42.0°C',
                    code: 'INVALID_VITAL_SIGNS',
                    value: vitalSigns.temperature
                });
            }
        }
        if (vitalSigns.bloodPressure !== undefined) {
            if (!exports.CreateMedicalRecordValidationRules.vitalSigns.properties.bloodPressure.pattern.test(vitalSigns.bloodPressure)) {
                errors.push({
                    field: 'vitalSigns.bloodPressure',
                    message: 'Huyết áp phải có định dạng "120/80"',
                    code: 'INVALID_VITAL_SIGNS',
                    value: vitalSigns.bloodPressure
                });
            }
        }
        if (vitalSigns.heartRate !== undefined) {
            if (typeof vitalSigns.heartRate !== 'number' ||
                vitalSigns.heartRate < 40 ||
                vitalSigns.heartRate > 200) {
                errors.push({
                    field: 'vitalSigns.heartRate',
                    message: 'Nhịp tim phải từ 40 đến 200 BPM',
                    code: 'INVALID_VITAL_SIGNS',
                    value: vitalSigns.heartRate
                });
            }
        }
        if (vitalSigns.weight !== undefined) {
            if (typeof vitalSigns.weight !== 'number' ||
                vitalSigns.weight < 1.0 ||
                vitalSigns.weight > 300.0) {
                errors.push({
                    field: 'vitalSigns.weight',
                    message: 'Cân nặng phải từ 1.0 đến 300.0 kg',
                    code: 'INVALID_VITAL_SIGNS',
                    value: vitalSigns.weight
                });
            }
        }
        if (vitalSigns.height !== undefined) {
            if (typeof vitalSigns.height !== 'number' ||
                vitalSigns.height < 30.0 ||
                vitalSigns.height > 250.0) {
                errors.push({
                    field: 'vitalSigns.height',
                    message: 'Chiều cao phải từ 30.0 đến 250.0 cm',
                    code: 'INVALID_VITAL_SIGNS',
                    value: vitalSigns.height
                });
            }
        }
    }
    return errors;
}
//# sourceMappingURL=CreateMedicalRecordRequest.js.map