"use strict";
/**
 * DiagnosticReport Request/Response DTOs
 * Data Transfer Objects for diagnostic report operations
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, CQRS
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateCreateDiagnosticReportRequest = validateCreateDiagnosticReportRequest;
exports.validateUpdateDiagnosticReportRequest = validateUpdateDiagnosticReportRequest;
exports.validateFinalizeDiagnosticReportRequest = validateFinalizeDiagnosticReportRequest;
exports.validateListDiagnosticReportsRequest = validateListDiagnosticReportsRequest;
const DiagnosticReport_aggregate_1 = require("../../domain/aggregates/DiagnosticReport.aggregate");
/**
 * Validate CreateDiagnosticReportRequest
 */
function validateCreateDiagnosticReportRequest(request) {
    const errors = [];
    // Required fields
    if (!request.medicalRecordId || request.medicalRecordId.trim() === '') {
        errors.push({ field: 'medicalRecordId', message: 'Medical Record ID là bắt buộc' });
    }
    if (!request.patientId || request.patientId.trim() === '') {
        errors.push({ field: 'patientId', message: 'Patient ID là bắt buộc' });
    }
    else {
        const patientIdRegex = /^PAT-\d{6}-\d{3}$/;
        if (!patientIdRegex.test(request.patientId)) {
            errors.push({ field: 'patientId', message: 'Patient ID phải có định dạng PAT-YYYYMM-XXX' });
        }
    }
    if (!request.orderedBy || request.orderedBy.trim() === '') {
        errors.push({ field: 'orderedBy', message: 'Ordered By (Doctor ID) là bắt buộc' });
    }
    else {
        const doctorIdRegex = /^[A-Z]{2,4}-DOC-\d{6}-\d{3}$/;
        if (!doctorIdRegex.test(request.orderedBy)) {
            errors.push({ field: 'orderedBy', message: 'Ordered By phải có định dạng DEPT-DOC-YYYYMM-XXX' });
        }
    }
    if (!request.reportType) {
        errors.push({ field: 'reportType', message: 'Loại báo cáo là bắt buộc' });
    }
    else if (!Object.values(DiagnosticReport_aggregate_1.DiagnosticReportType).includes(request.reportType)) {
        errors.push({ field: 'reportType', message: 'Loại báo cáo không hợp lệ' });
    }
    if (!request.reportTitle || request.reportTitle.trim() === '') {
        errors.push({ field: 'reportTitle', message: 'Tiêu đề báo cáo là bắt buộc' });
    }
    else if (request.reportTitle.length > 200) {
        errors.push({ field: 'reportTitle', message: 'Tiêu đề báo cáo không được vượt quá 200 ký tự' });
    }
    if (!request.testName || request.testName.trim() === '') {
        errors.push({ field: 'testName', message: 'Tên xét nghiệm là bắt buộc' });
    }
    if (!request.createdBy || request.createdBy.trim() === '') {
        errors.push({ field: 'createdBy', message: 'Created By là bắt buộc' });
    }
    // Status validation
    if (request.status && !Object.values(DiagnosticReport_aggregate_1.DiagnosticReportStatus).includes(request.status)) {
        errors.push({ field: 'status', message: 'Trạng thái báo cáo không hợp lệ' });
    }
    return errors;
}
/**
 * Validate UpdateDiagnosticReportRequest
 */
function validateUpdateDiagnosticReportRequest(request) {
    const errors = [];
    // Required fields
    if (!request.reportId || request.reportId.trim() === '') {
        errors.push({ field: 'reportId', message: 'Report ID là bắt buộc' });
    }
    else {
        const reportIdRegex = /^DIAG-\d{6}-\d{3}$/;
        if (!reportIdRegex.test(request.reportId)) {
            errors.push({ field: 'reportId', message: 'Report ID phải có định dạng DIAG-YYYYMM-XXX' });
        }
    }
    if (!request.updatedBy || request.updatedBy.trim() === '') {
        errors.push({ field: 'updatedBy', message: 'Updated By là bắt buộc' });
    }
    // At least one field to update
    const hasUpdate = request.results ||
        request.interpretation ||
        request.conclusion ||
        request.recommendations ||
        request.reportedBy ||
        request.testPerformedAt;
    if (!hasUpdate) {
        errors.push({
            field: 'updates',
            message: 'Phải có ít nhất một trường để cập nhật',
        });
    }
    // Results length validation
    if (request.results && request.results.length > 10000) {
        errors.push({ field: 'results', message: 'Kết quả không được vượt quá 10,000 ký tự' });
    }
    if (request.interpretation && request.interpretation.length > 5000) {
        errors.push({ field: 'interpretation', message: 'Diễn giải không được vượt quá 5,000 ký tự' });
    }
    if (request.conclusion && request.conclusion.length > 2000) {
        errors.push({ field: 'conclusion', message: 'Kết luận không được vượt quá 2,000 ký tự' });
    }
    if (request.recommendations && request.recommendations.length > 2000) {
        errors.push({ field: 'recommendations', message: 'Khuyến nghị không được vượt quá 2,000 ký tự' });
    }
    return errors;
}
/**
 * Validate FinalizeDiagnosticReportRequest
 */
function validateFinalizeDiagnosticReportRequest(request) {
    const errors = [];
    // Required fields
    if (!request.reportId || request.reportId.trim() === '') {
        errors.push({ field: 'reportId', message: 'Report ID là bắt buộc' });
    }
    else {
        const reportIdRegex = /^DIAG-\d{6}-\d{3}$/;
        if (!reportIdRegex.test(request.reportId)) {
            errors.push({ field: 'reportId', message: 'Report ID phải có định dạng DIAG-YYYYMM-XXX' });
        }
    }
    if (!request.verifiedBy || request.verifiedBy.trim() === '') {
        errors.push({ field: 'verifiedBy', message: 'Verified By (Doctor ID) là bắt buộc' });
    }
    else {
        const doctorIdRegex = /^[A-Z]{2,4}-DOC-\d{6}-\d{3}$/;
        if (!doctorIdRegex.test(request.verifiedBy)) {
            errors.push({ field: 'verifiedBy', message: 'Verified By phải có định dạng DEPT-DOC-YYYYMM-XXX' });
        }
    }
    // Verification comment length
    if (request.verificationComment && request.verificationComment.length > 1000) {
        errors.push({ field: 'verificationComment', message: 'Nhận xét không được vượt quá 1,000 ký tự' });
    }
    return errors;
}
/**
 * Validate ListDiagnosticReportsRequest
 */
function validateListDiagnosticReportsRequest(request) {
    const errors = [];
    // Patient ID format
    if (request.patientId) {
        const patientIdRegex = /^PAT-\d{6}-\d{3}$/;
        if (!patientIdRegex.test(request.patientId)) {
            errors.push({ field: 'patientId', message: 'Patient ID phải có định dạng PAT-YYYYMM-XXX' });
        }
    }
    // Report type validation
    if (request.reportType && !Object.values(DiagnosticReport_aggregate_1.DiagnosticReportType).includes(request.reportType)) {
        errors.push({ field: 'reportType', message: 'Loại báo cáo không hợp lệ' });
    }
    // Status validation
    if (request.status && !Object.values(DiagnosticReport_aggregate_1.DiagnosticReportStatus).includes(request.status)) {
        errors.push({ field: 'status', message: 'Trạng thái báo cáo không hợp lệ' });
    }
    // Date range validation
    if (request.fromDate && request.toDate) {
        if (request.fromDate > request.toDate) {
            errors.push({ field: 'dateRange', message: 'Ngày bắt đầu phải trước ngày kết thúc' });
        }
        const daysDiff = (request.toDate.getTime() - request.fromDate.getTime()) / (1000 * 60 * 60 * 24);
        if (daysDiff > 365) {
            errors.push({ field: 'dateRange', message: 'Khoảng thời gian không được vượt quá 365 ngày' });
        }
    }
    // Pagination validation
    if (request.limit !== undefined) {
        if (request.limit < 1) {
            errors.push({ field: 'limit', message: 'Limit phải lớn hơn 0' });
        }
        if (request.limit > 100) {
            errors.push({ field: 'limit', message: 'Limit không được vượt quá 100' });
        }
    }
    if (request.offset !== undefined && request.offset < 0) {
        errors.push({ field: 'offset', message: 'Offset phải lớn hơn hoặc bằng 0' });
    }
    return errors;
}
//# sourceMappingURL=DiagnosticReportRequest.js.map