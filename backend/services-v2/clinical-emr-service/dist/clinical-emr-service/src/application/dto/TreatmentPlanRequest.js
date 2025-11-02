"use strict";
/**
 * Treatment Plan DTOs - Request/Response Models
 * Data Transfer Objects for treatment plan operations
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, Vietnamese Healthcare Standards
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateCreateTreatmentPlanRequest = validateCreateTreatmentPlanRequest;
exports.validateGetTreatmentPlanRequest = validateGetTreatmentPlanRequest;
exports.validateUpdateTreatmentPlanRequest = validateUpdateTreatmentPlanRequest;
exports.validateCompleteTreatmentPlanRequest = validateCompleteTreatmentPlanRequest;
exports.validateListTreatmentPlansRequest = validateListTreatmentPlansRequest;
const TreatmentPlan_aggregate_1 = require("../../domain/aggregates/TreatmentPlan.aggregate");
/**
 * Validate Create Treatment Plan Request
 */
function validateCreateTreatmentPlanRequest(request) {
    const errors = [];
    // Required fields
    if (!request.medicalRecordId || request.medicalRecordId.trim() === '') {
        errors.push('MedicalRecordId là bắt buộc');
    }
    if (!request.patientId || request.patientId.trim() === '') {
        errors.push('PatientId là bắt buộc');
    }
    if (!request.primaryDoctorId || request.primaryDoctorId.trim() === '') {
        errors.push('PrimaryDoctorId là bắt buộc');
    }
    if (!request.diagnosis || request.diagnosis.trim() === '') {
        errors.push('Chẩn đoán là bắt buộc');
    }
    if (!request.treatmentGoals || request.treatmentGoals.trim() === '') {
        errors.push('Mục tiêu điều trị là bắt buộc');
    }
    if (!request.startDate || request.startDate.trim() === '') {
        errors.push('Ngày bắt đầu là bắt buộc');
    }
    if (!request.createdBy || request.createdBy.trim() === '') {
        errors.push('CreatedBy là bắt buộc');
    }
    // Field length validations
    if (request.diagnosis && request.diagnosis.length > 500) {
        errors.push('Chẩn đoán không được vượt quá 500 ký tự');
    }
    if (request.treatmentGoals && request.treatmentGoals.length > 1000) {
        errors.push('Mục tiêu điều trị không được vượt quá 1,000 ký tự');
    }
    if (request.planDescription && request.planDescription.length > 5000) {
        errors.push('Mô tả kế hoạch không được vượt quá 5,000 ký tự');
    }
    // Patient ID format validation
    const patientIdRegex = /^PAT-\d{6}-\d{3}$/;
    if (request.patientId && !patientIdRegex.test(request.patientId)) {
        errors.push('PatientId phải có định dạng PAT-YYYYMM-XXX');
    }
    // Doctor ID format validation
    const doctorIdRegex = /^[A-Z]{2,4}-DOC-\d{6}-\d{3}$/;
    if (request.primaryDoctorId && !doctorIdRegex.test(request.primaryDoctorId)) {
        errors.push('PrimaryDoctorId phải có định dạng DEPT-DOC-YYYYMM-XXX');
    }
    // Date validations
    if (request.startDate) {
        const startDate = new Date(request.startDate);
        if (isNaN(startDate.getTime())) {
            errors.push('StartDate phải là ngày hợp lệ (ISO 8601)');
        }
    }
    if (request.expectedEndDate && request.startDate) {
        const startDate = new Date(request.startDate);
        const expectedEndDate = new Date(request.expectedEndDate);
        if (!isNaN(startDate.getTime()) && !isNaN(expectedEndDate.getTime())) {
            if (expectedEndDate <= startDate) {
                errors.push('ExpectedEndDate phải sau StartDate');
            }
        }
    }
    // Consent validation
    if (request.patientConsent && !request.consentBy) {
        errors.push('ConsentBy là bắt buộc khi patientConsent = true');
    }
    return {
        valid: errors.length === 0,
        errors,
    };
}
/**
 * Validate Get Treatment Plan Request
 */
function validateGetTreatmentPlanRequest(request) {
    const errors = [];
    if (!request.planId || request.planId.trim() === '') {
        errors.push('PlanId là bắt buộc');
    }
    if (!request.accessedBy || request.accessedBy.trim() === '') {
        errors.push('AccessedBy là bắt buộc');
    }
    // Plan ID format validation
    const planIdRegex = /^PLAN-\d{6}-\d{3}$/;
    if (request.planId && !planIdRegex.test(request.planId)) {
        errors.push('PlanId phải có định dạng PLAN-YYYYMM-XXX');
    }
    return {
        valid: errors.length === 0,
        errors,
    };
}
/**
 * Validate Update Treatment Plan Request
 */
function validateUpdateTreatmentPlanRequest(request) {
    const errors = [];
    if (!request.planId || request.planId.trim() === '') {
        errors.push('PlanId là bắt buộc');
    }
    if (!request.updatedBy || request.updatedBy.trim() === '') {
        errors.push('UpdatedBy là bắt buộc');
    }
    // Plan ID format validation
    const planIdRegex = /^PLAN-\d{6}-\d{3}$/;
    if (request.planId && !planIdRegex.test(request.planId)) {
        errors.push('PlanId phải có định dạng PLAN-YYYYMM-XXX');
    }
    // At least one field to update
    const hasUpdate = request.planDescription ||
        request.treatmentGoals ||
        request.progressNotes ||
        request.expectedEndDate ||
        request.consultingDoctors ||
        request.addTreatmentItem ||
        request.updateItemStatus ||
        request.grantConsent;
    if (!hasUpdate) {
        errors.push('Cần ít nhất một trường để cập nhật');
    }
    // Field length validations
    if (request.planDescription && request.planDescription.length > 5000) {
        errors.push('Mô tả kế hoạch không được vượt quá 5,000 ký tự');
    }
    if (request.treatmentGoals && request.treatmentGoals.length > 1000) {
        errors.push('Mục tiêu điều trị không được vượt quá 1,000 ký tự');
    }
    if (request.progressNotes && request.progressNotes.length > 10000) {
        errors.push('Ghi chú tiến độ không được vượt quá 10,000 ký tự');
    }
    // Update item status validation
    if (request.updateItemStatus) {
        if (!request.updateItemStatus.itemId || request.updateItemStatus.itemId.trim() === '') {
            errors.push('ItemId là bắt buộc khi cập nhật trạng thái');
        }
        if (!request.updateItemStatus.newStatus) {
            errors.push('NewStatus là bắt buộc khi cập nhật trạng thái');
        }
        const validStatuses = Object.values(TreatmentPlan_aggregate_1.TreatmentItemStatus);
        if (request.updateItemStatus.newStatus && !validStatuses.includes(request.updateItemStatus.newStatus)) {
            errors.push('NewStatus không hợp lệ');
        }
    }
    // Grant consent validation
    if (request.grantConsent) {
        if (!request.grantConsent.consentBy || request.grantConsent.consentBy.trim() === '') {
            errors.push('ConsentBy là bắt buộc khi ghi nhận đồng ý');
        }
    }
    return {
        valid: errors.length === 0,
        errors,
    };
}
/**
 * Validate Complete Treatment Plan Request
 */
function validateCompleteTreatmentPlanRequest(request) {
    const errors = [];
    if (!request.planId || request.planId.trim() === '') {
        errors.push('PlanId là bắt buộc');
    }
    if (!request.completedBy || request.completedBy.trim() === '') {
        errors.push('CompletedBy là bắt buộc');
    }
    // Plan ID format validation
    const planIdRegex = /^PLAN-\d{6}-\d{3}$/;
    if (request.planId && !planIdRegex.test(request.planId)) {
        errors.push('PlanId phải có định dạng PLAN-YYYYMM-XXX');
    }
    // Completion notes length validation
    if (request.completionNotes && request.completionNotes.length > 2000) {
        errors.push('Ghi chú hoàn thành không được vượt quá 2,000 ký tự');
    }
    return {
        valid: errors.length === 0,
        errors,
    };
}
/**
 * Validate List Treatment Plans Request
 */
function validateListTreatmentPlansRequest(request) {
    const errors = [];
    // Patient ID format validation
    if (request.patientId) {
        const patientIdRegex = /^PAT-\d{6}-\d{3}$/;
        if (!patientIdRegex.test(request.patientId)) {
            errors.push('PatientId phải có định dạng PAT-YYYYMM-XXX');
        }
    }
    // Doctor ID format validation
    if (request.primaryDoctorId) {
        const doctorIdRegex = /^[A-Z]{2,4}-DOC-\d{6}-\d{3}$/;
        if (!doctorIdRegex.test(request.primaryDoctorId)) {
            errors.push('PrimaryDoctorId phải có định dạng DEPT-DOC-YYYYMM-XXX');
        }
    }
    if (request.consultingDoctorId) {
        const doctorIdRegex = /^[A-Z]{2,4}-DOC-\d{6}-\d{3}$/;
        if (!doctorIdRegex.test(request.consultingDoctorId)) {
            errors.push('ConsultingDoctorId phải có định dạng DEPT-DOC-YYYYMM-XXX');
        }
    }
    // Status validation
    if (request.status && !Object.values(TreatmentPlan_aggregate_1.TreatmentPlanStatus).includes(request.status)) {
        errors.push('Status không hợp lệ');
    }
    // Date validations
    if (request.fromDate) {
        const fromDate = new Date(request.fromDate);
        if (isNaN(fromDate.getTime())) {
            errors.push('FromDate phải là ngày hợp lệ (ISO 8601)');
        }
    }
    if (request.toDate) {
        const toDate = new Date(request.toDate);
        if (isNaN(toDate.getTime())) {
            errors.push('ToDate phải là ngày hợp lệ (ISO 8601)');
        }
    }
    if (request.fromDate && request.toDate) {
        const fromDate = new Date(request.fromDate);
        const toDate = new Date(request.toDate);
        if (!isNaN(fromDate.getTime()) && !isNaN(toDate.getTime())) {
            if (toDate < fromDate) {
                errors.push('ToDate phải sau FromDate');
            }
        }
    }
    // Progress validations
    if (request.minProgress !== undefined) {
        if (request.minProgress < 0 || request.minProgress > 100) {
            errors.push('MinProgress phải nằm trong khoảng 0-100');
        }
    }
    if (request.maxProgress !== undefined) {
        if (request.maxProgress < 0 || request.maxProgress > 100) {
            errors.push('MaxProgress phải nằm trong khoảng 0-100');
        }
    }
    if (request.minProgress !== undefined &&
        request.maxProgress !== undefined &&
        request.maxProgress < request.minProgress) {
        errors.push('MaxProgress phải lớn hơn hoặc bằng MinProgress');
    }
    // Pagination validations
    if (request.limit !== undefined && request.limit <= 0) {
        errors.push('Limit phải lớn hơn 0');
    }
    if (request.offset !== undefined && request.offset < 0) {
        errors.push('Offset phải lớn hơn hoặc bằng 0');
    }
    return {
        valid: errors.length === 0,
        errors,
    };
}
//# sourceMappingURL=TreatmentPlanRequest.js.map