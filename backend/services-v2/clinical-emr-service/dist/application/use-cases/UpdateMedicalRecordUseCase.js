"use strict";
/**
 * UpdateMedicalRecordUseCase - Application Layer
 * Use case for updating existing medical records
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, CQRS, HIPAA, Vietnamese Healthcare Standards
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateMedicalRecordUseCase = void 0;
const use_case_interface_1 = require("../../../shared/application/use-cases/base/use-case.interface");
const IMedicalRecordRepository_1 = require("../../domain/repositories/IMedicalRecordRepository");
const RecordId_1 = require("../../domain/value-objects/RecordId");
const BasicVitalSigns_1 = require("../../domain/value-objects/BasicVitalSigns");
const UpdateMedicalRecordRequest_1 = require("../dto/UpdateMedicalRecordRequest");
class UpdateMedicalRecordUseCase extends use_case_interface_1.BaseHealthcareUseCase {
    constructor(medicalRecordRepository, eventPublisher) {
        super();
        this.medicalRecordRepository = medicalRecordRepository;
        this.eventPublisher = eventPublisher;
    }
    /**
     * Execute the use case
     */
    async executeInternal(request) {
        try {
            // Create RecordId value object
            const recordId = RecordId_1.RecordId.create(request.recordId);
            // Find existing medical record
            const medicalRecord = await this.medicalRecordRepository.findById(recordId);
            if (!medicalRecord) {
                return {
                    success: false,
                    message: `Không tìm thấy hồ sơ bệnh án với ID: ${request.recordId}`,
                    errors: [{
                            field: 'recordId',
                            message: `Hồ sơ bệnh án với ID ${request.recordId} không tồn tại`,
                            code: 'MEDICAL_RECORD_NOT_FOUND'
                        }]
                };
            }
            // Check if record can be updated
            if (medicalRecord.isDeleted()) {
                return {
                    success: false,
                    message: 'Không thể cập nhật hồ sơ bệnh án đã bị xóa',
                    errors: [{
                            field: 'recordId',
                            message: 'Hồ sơ bệnh án này đã bị xóa và không thể cập nhật',
                            code: 'MEDICAL_RECORD_DELETED'
                        }]
                };
            }
            // Track updated fields
            const updatedFields = [];
            // Update medical information
            const medicalUpdates = (0, UpdateMedicalRecordRequest_1.extractUpdateFields)(request);
            if (Object.keys(medicalUpdates).length > 0) {
                medicalRecord.updateMedicalInformation(medicalUpdates, request.updatedBy, request.updateReason);
                updatedFields.push(...Object.keys(medicalUpdates));
            }
            // Update vital signs if provided
            if ((0, UpdateMedicalRecordRequest_1.hasVitalSignsUpdate)(request)) {
                const currentVitalSigns = medicalRecord.vitalSigns;
                // Merge with existing vital signs
                const newVitalSignsData = {
                    temperature: request.vitalSigns.temperature ?? currentVitalSigns?.temperature,
                    bloodPressure: request.vitalSigns.bloodPressure ?? currentVitalSigns?.bloodPressure,
                    heartRate: request.vitalSigns.heartRate ?? currentVitalSigns?.heartRate,
                    weight: request.vitalSigns.weight ?? currentVitalSigns?.weight,
                    height: request.vitalSigns.height ?? currentVitalSigns?.height
                };
                const newVitalSigns = BasicVitalSigns_1.BasicVitalSigns.create(newVitalSignsData);
                medicalRecord.updateVitalSigns(newVitalSigns, request.updatedBy);
                updatedFields.push('vitalSigns');
            }
            // Save updated record
            await this.medicalRecordRepository.update(medicalRecord);
            // Publish domain events
            const events = medicalRecord.getUncommittedEvents();
            if (events.length > 0) {
                await this.eventPublisher.publishBatch(events);
                medicalRecord.markEventsAsCommitted();
            }
            return {
                success: true,
                message: 'Hồ sơ bệnh án đã được cập nhật thành công',
                data: {
                    recordId: request.recordId,
                    updatedFields,
                    updatedAt: medicalRecord.updatedAt.toISOString(),
                    updatedBy: request.updatedBy,
                    updateReason: request.updateReason
                }
            };
        }
        catch (error) {
            if (error instanceof IMedicalRecordRepository_1.MedicalRecordNotFoundError) {
                return {
                    success: false,
                    message: error.message,
                    errors: [{
                            field: 'recordId',
                            message: error.message,
                            code: 'MEDICAL_RECORD_NOT_FOUND'
                        }]
                };
            }
            // Handle domain validation errors
            if (error instanceof Error && error.message.includes('là bắt buộc')) {
                return {
                    success: false,
                    message: 'Lỗi validation dữ liệu',
                    errors: [{
                            field: 'general',
                            message: error.message,
                            code: 'DOMAIN_VALIDATION_ERROR'
                        }]
                };
            }
            // Handle RecordId validation errors
            if (error instanceof Error && error.message.includes('định dạng')) {
                return {
                    success: false,
                    message: 'Định dạng RecordId không hợp lệ',
                    errors: [{
                            field: 'recordId',
                            message: error.message,
                            code: 'INVALID_RECORD_ID_FORMAT'
                        }]
                };
            }
            // Handle other errors
            throw new Error(`Lỗi khi cập nhật hồ sơ bệnh án: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    /**
     * Validate request
     */
    async validate(request) {
        const errors = (0, UpdateMedicalRecordRequest_1.validateUpdateMedicalRecordRequest)(request);
        // Additional business validation
        if (errors.length === 0) {
            // Validate business rules
            const businessRuleViolations = await this.validateBusinessRules(request);
            if (businessRuleViolations.length > 0) {
                errors.push(...businessRuleViolations.map(violation => ({
                    field: 'businessRule',
                    message: violation,
                    code: 'BUSINESS_RULE_VIOLATION'
                })));
            }
        }
        return {
            isValid: errors.length === 0,
            errors
        };
    }
    /**
     * Check authorization
     */
    async authorize(request, userId) {
        try {
            // Get the medical record to check ownership
            const recordId = RecordId_1.RecordId.create(request.recordId);
            const medicalRecord = await this.medicalRecordRepository.findById(recordId);
            if (!medicalRecord) {
                // If record doesn't exist, deny access
                return false;
            }
            // Authorization rules:
            // 1. Only doctors can update medical records
            // 2. Doctors can only update records they created
            // 3. The updatedBy field should match the userId
            // 4. Admins can update all records (would need role check)
            if (request.updatedBy !== userId) {
                return false;
            }
            // Check if user is the doctor who created the record
            if (medicalRecord.doctorId === userId) {
                return true;
            }
            // Check if user is the original creator
            if (medicalRecord.createdBy === userId) {
                return true;
            }
            // For now, deny access if none of the above conditions are met
            return false;
        }
        catch (error) {
            // If there's an error during authorization, deny access
            return false;
        }
    }
    /**
     * Check if involves PHI
     */
    involvesPHI(request) {
        return true; // Medical record updates always involve PHI
    }
    /**
     * Get patient ID
     */
    getPatientId(request) {
        // We need to get the medical record to extract patient ID
        // This is a limitation of the interface - we might need to modify it
        // For now, return null and handle patient ID extraction in the audit logging
        return null;
    }
    /**
     * Get patient ID from medical record (helper method)
     */
    async getPatientIdFromRecord(recordId) {
        try {
            const recordIdVO = RecordId_1.RecordId.create(recordId);
            const medicalRecord = await this.medicalRecordRepository.findById(recordIdVO);
            return medicalRecord ? medicalRecord.patientId : null;
        }
        catch (error) {
            return null;
        }
    }
    /**
     * Validate business rules
     */
    async validateBusinessRules(request) {
        const violations = [];
        try {
            // Get the existing medical record for business rule validation
            const recordId = RecordId_1.RecordId.create(request.recordId);
            const existingRecord = await this.medicalRecordRepository.findById(recordId);
            if (!existingRecord) {
                violations.push('Hồ sơ bệnh án không tồn tại');
                return violations;
            }
            // Rule: Cannot update archived records (unless restoring)
            if (existingRecord.isArchived()) {
                violations.push('Không thể cập nhật hồ sơ bệnh án đã được lưu trữ');
            }
            // Rule: If diagnosis is being updated, symptoms or examination notes should exist
            if (request.diagnosis && !request.symptoms && !request.examinationNotes &&
                !existingRecord.symptoms && !existingRecord.examinationNotes) {
                violations.push('Nếu cập nhật chẩn đoán, cần có triệu chứng hoặc ghi chú khám bệnh');
            }
            // Rule: If treatment is being updated, diagnosis should exist
            if (request.treatment && !request.diagnosis && !existingRecord.diagnosis) {
                violations.push('Nếu cập nhật điều trị, cần có chẩn đoán');
            }
            // Rule: If vital signs are being updated, at least one measurement should be provided
            if ((0, UpdateMedicalRecordRequest_1.hasVitalSignsUpdate)(request)) {
                const vitalSigns = request.vitalSigns;
                const hasAnyVitalSign = vitalSigns.temperature !== undefined ||
                    vitalSigns.bloodPressure !== undefined ||
                    vitalSigns.heartRate !== undefined ||
                    vitalSigns.weight !== undefined ||
                    vitalSigns.height !== undefined;
                if (!hasAnyVitalSign) {
                    violations.push('Nếu cập nhật sinh hiệu, ít nhất một chỉ số phải được cung cấp');
                }
            }
        }
        catch (error) {
            violations.push('Lỗi khi kiểm tra quy tắc nghiệp vụ');
        }
        return violations;
    }
    /**
     * Get use case description for audit
     */
    getDescription() {
        return 'Cập nhật thông tin hồ sơ bệnh án';
    }
    /**
     * Get required permissions
     */
    getRequiredPermissions() {
        return ['medical_record:update', 'medical_record:read'];
    }
    /**
     * Enhanced authorization with role-based access control
     */
    async authorizeWithRoles(request, userId, userRoles) {
        // Admin can update all records
        if (userRoles.includes('admin') || userRoles.includes('system_admin')) {
            return true;
        }
        // Use the basic authorization for other roles
        return await this.authorize(request, userId);
    }
    /**
     * Get audit information for this use case execution
     */
    async getAuditInfoAsync(request) {
        const baseAuditInfo = super.getAuditInfo(request);
        const patientId = await this.getPatientIdFromRecord(request.recordId);
        return {
            ...baseAuditInfo,
            action: 'UPDATE_MEDICAL_RECORD',
            resourceType: 'MedicalRecord',
            resourceId: request.recordId,
            patientId,
            details: {
                recordId: request.recordId,
                updatedFields: Object.keys((0, UpdateMedicalRecordRequest_1.extractUpdateFields)(request)),
                hasVitalSignsUpdate: (0, UpdateMedicalRecordRequest_1.hasVitalSignsUpdate)(request),
                updatedBy: request.updatedBy,
                updateReason: request.updateReason
            },
            complianceLevel: 'HIPAA',
            vietnameseDescription: 'Cập nhật thông tin hồ sơ bệnh án'
        };
    }
    /**
     * Enhanced execute with role-based access control
     */
    async executeWithRoles(request, userId, userRoles) {
        // Check authorization with roles
        const authorized = await this.authorizeWithRoles(request, userId, userRoles);
        if (!authorized) {
            return {
                success: false,
                message: 'Bạn không có quyền cập nhật hồ sơ bệnh án này',
                errors: [{
                        field: 'authorization',
                        message: 'Không có quyền cập nhật',
                        code: 'UNAUTHORIZED_UPDATE'
                    }]
            };
        }
        // Execute the use case
        return await this.executeInternal(request);
    }
}
exports.UpdateMedicalRecordUseCase = UpdateMedicalRecordUseCase;
//# sourceMappingURL=UpdateMedicalRecordUseCase.js.map