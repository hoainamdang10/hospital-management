"use strict";
/**
 * GetPatientMedicalRecordsRequest DTO - Application Layer
 * Data Transfer Object for retrieving patient's medical records
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DTO Pattern, Vietnamese Healthcare Standards
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetPatientMedicalRecordsValidationRules = void 0;
exports.validateGetPatientMedicalRecordsRequest = validateGetPatientMedicalRecordsRequest;
exports.setDefaultValues = setDefaultValues;
exports.toRepositoryOptions = toRepositoryOptions;
const clinical_aggregate_1 = require("../../domain/aggregates/clinical.aggregate");
/**
 * Validation rules for GetPatientMedicalRecordsRequest
 */
exports.GetPatientMedicalRecordsValidationRules = {
    patientId: {
        required: true,
        pattern: /^PAT-\d{6}-\d{3}$/,
        message: 'PatientId phải có định dạng PAT-YYYYMM-XXX'
    },
    requestedBy: {
        required: true,
        pattern: /^[a-f\d]{8}-[a-f\d]{4}-[a-f\d]{4}-[a-f\d]{4}-[a-f\d]{12}$/i,
        message: 'RequestedBy phải là UUID hợp lệ'
    },
    doctorId: {
        required: false,
        pattern: /^[A-Z]{2,4}-DOC-\d{6}-\d{3}$/,
        message: 'DoctorId phải có định dạng DEPT-DOC-YYYYMM-XXX'
    },
    page: {
        min: 1,
        message: 'Số trang phải lớn hơn 0'
    },
    pageSize: {
        min: 1,
        max: 100,
        message: 'Kích thước trang phải từ 1 đến 100'
    },
    limit: {
        min: 1,
        max: 1000,
        message: 'Giới hạn phải từ 1 đến 1000'
    },
    offset: {
        min: 0,
        message: 'Offset phải lớn hơn hoặc bằng 0'
    }
};
/**
 * Helper function to validate GetPatientMedicalRecordsRequest
 */
function validateGetPatientMedicalRecordsRequest(request) {
    const errors = [];
    // Validate patientId
    if (!request.patientId) {
        errors.push({
            field: 'patientId',
            message: 'PatientId là bắt buộc',
            code: 'REQUIRED_FIELD_MISSING',
            value: request.patientId
        });
    }
    else if (!exports.GetPatientMedicalRecordsValidationRules.patientId.pattern.test(request.patientId)) {
        errors.push({
            field: 'patientId',
            message: exports.GetPatientMedicalRecordsValidationRules.patientId.message,
            code: 'INVALID_FORMAT',
            value: request.patientId
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
    else if (!exports.GetPatientMedicalRecordsValidationRules.requestedBy.pattern.test(request.requestedBy)) {
        errors.push({
            field: 'requestedBy',
            message: exports.GetPatientMedicalRecordsValidationRules.requestedBy.message,
            code: 'INVALID_FORMAT',
            value: request.requestedBy
        });
    }
    // Validate doctorId if provided
    if (request.doctorId && !exports.GetPatientMedicalRecordsValidationRules.doctorId.pattern.test(request.doctorId)) {
        errors.push({
            field: 'doctorId',
            message: exports.GetPatientMedicalRecordsValidationRules.doctorId.message,
            code: 'INVALID_FORMAT',
            value: request.doctorId
        });
    }
    // Validate status if provided
    if (request.status && !Object.values(clinical_aggregate_1.MedicalRecordStatus).includes(request.status)) {
        errors.push({
            field: 'status',
            message: 'Trạng thái không hợp lệ',
            code: 'INVALID_STATUS',
            value: request.status
        });
    }
    // Validate date range
    if (request.visitDateFrom) {
        const fromDate = new Date(request.visitDateFrom);
        if (isNaN(fromDate.getTime())) {
            errors.push({
                field: 'visitDateFrom',
                message: 'Ngày bắt đầu phải có định dạng hợp lệ',
                code: 'INVALID_DATE_FORMAT',
                value: request.visitDateFrom
            });
        }
    }
    if (request.visitDateTo) {
        const toDate = new Date(request.visitDateTo);
        if (isNaN(toDate.getTime())) {
            errors.push({
                field: 'visitDateTo',
                message: 'Ngày kết thúc phải có định dạng hợp lệ',
                code: 'INVALID_DATE_FORMAT',
                value: request.visitDateTo
            });
        }
    }
    // Validate date range logic
    if (request.visitDateFrom && request.visitDateTo) {
        const fromDate = new Date(request.visitDateFrom);
        const toDate = new Date(request.visitDateTo);
        if (fromDate > toDate) {
            errors.push({
                field: 'visitDateRange',
                message: 'Ngày bắt đầu phải nhỏ hơn ngày kết thúc',
                code: 'INVALID_DATE_RANGE',
                value: { from: request.visitDateFrom, to: request.visitDateTo }
            });
        }
    }
    // Validate pagination
    if (request.page !== undefined) {
        if (request.page < 1) {
            errors.push({
                field: 'page',
                message: exports.GetPatientMedicalRecordsValidationRules.page.message,
                code: 'INVALID_PAGE_NUMBER',
                value: request.page
            });
        }
    }
    if (request.pageSize !== undefined) {
        if (request.pageSize < 1 || request.pageSize > 100) {
            errors.push({
                field: 'pageSize',
                message: exports.GetPatientMedicalRecordsValidationRules.pageSize.message,
                code: 'INVALID_PAGE_SIZE',
                value: request.pageSize
            });
        }
    }
    if (request.limit !== undefined) {
        if (request.limit < 1 || request.limit > 1000) {
            errors.push({
                field: 'limit',
                message: exports.GetPatientMedicalRecordsValidationRules.limit.message,
                code: 'INVALID_LIMIT',
                value: request.limit
            });
        }
    }
    if (request.offset !== undefined) {
        if (request.offset < 0) {
            errors.push({
                field: 'offset',
                message: exports.GetPatientMedicalRecordsValidationRules.offset.message,
                code: 'INVALID_OFFSET',
                value: request.offset
            });
        }
    }
    // Validate sortBy
    if (request.sortBy && !['visitDate', 'createdAt', 'updatedAt', 'recordId'].includes(request.sortBy)) {
        errors.push({
            field: 'sortBy',
            message: 'Trường sắp xếp không hợp lệ',
            code: 'INVALID_SORT_FIELD',
            value: request.sortBy
        });
    }
    // Validate sortOrder
    if (request.sortOrder && !['asc', 'desc'].includes(request.sortOrder)) {
        errors.push({
            field: 'sortOrder',
            message: 'Thứ tự sắp xếp không hợp lệ',
            code: 'INVALID_SORT_ORDER',
            value: request.sortOrder
        });
    }
    return errors;
}
/**
 * Helper function to set default values for request
 */
function setDefaultValues(request) {
    return {
        ...request,
        page: request.page || 1,
        pageSize: request.pageSize || 20,
        sortBy: request.sortBy || 'visitDate',
        sortOrder: request.sortOrder || 'desc',
        includeArchived: request.includeArchived || false,
        includeVitalSigns: request.includeVitalSigns || true
    };
}
/**
 * Helper function to convert request to repository options
 */
function toRepositoryOptions(request) {
    const page = request.page || 1;
    const pageSize = request.pageSize || 20;
    // Map sortBy to repository-accepted values
    let sortBy = 'visitDate';
    if (request.sortBy === 'createdAt' || request.sortBy === 'updatedAt') {
        sortBy = request.sortBy;
    }
    return {
        status: request.status,
        limit: request.limit || pageSize,
        offset: request.offset || ((page - 1) * pageSize),
        sortBy,
        sortOrder: request.sortOrder || 'desc'
    };
}
//# sourceMappingURL=GetPatientMedicalRecordsRequest.js.map