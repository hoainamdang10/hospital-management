"use strict";
/**
 * UpdatePatientInfoUseCase - Application Use Case
 * V2 Clean Architecture + DDD Implementation
 * Updates patient information with authorization and audit logging
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, Vietnamese Healthcare Standards, HIPAA
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdatePatientInfoUseCase = void 0;
const base_healthcare_use_case_1 = require("../../../../shared/application/base/base-healthcare-use-case");
const PatientId_1 = require("../../domain/value-objects/PatientId");
/**
 * Update Patient Info Use Case
 * Handles patient information updates with proper authorization and validation
 */
class UpdatePatientInfoUseCase extends base_healthcare_use_case_1.BaseHealthcareUseCase {
    constructor(patientRepository, eventBus, logger) {
        super();
        this.patientRepository = patientRepository;
        this.eventBus = eventBus;
        this.logger = logger;
    }
    /**
     * Execute patient info update
     */
    async executeImpl(request) {
        try {
            this.logger.info('Starting patient info update', {
                patientId: request.patientId,
                requestedBy: request.requestedBy,
                requestedByRole: request.requestedByRole
            });
            // 1. Validate request
            const validationResult = this.validateRequest(request);
            if (!validationResult.isValid) {
                return {
                    success: false,
                    message: 'Dữ liệu cập nhật không hợp lệ',
                    errors: validationResult.errors
                };
            }
            // 2. Find patient
            const patientId = PatientId_1.PatientId.fromString(request.patientId);
            const patient = await this.patientRepository.findById(patientId);
            if (!patient) {
                return {
                    success: false,
                    message: 'Không tìm thấy thông tin bệnh nhân'
                };
            }
            // 3. Check authorization
            const authResult = this.checkUpdateAuthorization(patient, request);
            if (!authResult.authorized) {
                this.logger.warn('Unauthorized patient update attempt', {
                    patientId: patient.id.value,
                    requestedBy: request.requestedBy,
                    requestedByRole: request.requestedByRole,
                    reason: authResult.reason
                });
                return {
                    success: false,
                    message: 'Không có quyền cập nhật thông tin bệnh nhân này'
                };
            }
            // 4. Store original data for audit
            const originalData = this.captureOriginalData(patient);
            // 5. Apply updates
            const updatedFields = await this.applyUpdates(patient, request.updates);
            // 6. Validate business rules after updates
            try {
                patient.validateBusinessInvariants();
            }
            catch (error) {
                return {
                    success: false,
                    message: 'Dữ liệu cập nhật vi phạm quy tắc nghiệp vụ: ' + (error instanceof Error ? error.message : 'Unknown error')
                };
            }
            // 7. Vietnamese healthcare compliance check
            if (!patient.isVietnameseHealthcareCompliant()) {
                return {
                    success: false,
                    message: 'Thông tin cập nhật không đáp ứng tiêu chuẩn y tế Việt Nam'
                };
            }
            // 8. Save updated patient
            await this.patientRepository.save(patient);
            // 9. Publish domain events
            await this.publishDomainEvents(patient);
            // 10. HIPAA audit logging
            await this.auditPatientUpdate(patient, request, originalData, updatedFields);
            this.logger.info('Patient info update completed successfully', {
                patientId: patient.id.value,
                requestedBy: request.requestedBy,
                updatedFields
            });
            return {
                success: true,
                message: 'Cập nhật thông tin bệnh nhân thành công',
                data: {
                    patient: {
                        id: patient.id.value,
                        updatedAt: new Date().toISOString(),
                        updatedFields
                    }
                }
            };
        }
        catch (error) {
            this.logger.error('Error updating patient info', {
                patientId: request.patientId,
                requestedBy: request.requestedBy,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            return {
                success: false,
                message: 'Lỗi hệ thống khi cập nhật thông tin bệnh nhân'
            };
        }
    }
    /**
     * Validate update request
     */
    validateRequest(request) {
        const errors = [];
        // Patient ID validation
        if (!request.patientId || request.patientId.trim().length === 0) {
            errors.push('ID bệnh nhân không được để trống');
        }
        // Must have at least one update
        if (!request.updates || Object.keys(request.updates).length === 0) {
            errors.push('Phải có ít nhất một trường cần cập nhật');
        }
        // Requested by validation
        if (!request.requestedBy || request.requestedBy.trim().length === 0) {
            errors.push('Thông tin người yêu cầu không được để trống');
        }
        // Role validation
        if (!request.requestedByRole || request.requestedByRole.trim().length === 0) {
            errors.push('Vai trò người yêu cầu không được để trống');
        }
        // Validate specific field updates
        if (request.updates.personalInfo?.fullName !== undefined && request.updates.personalInfo.fullName.trim().length === 0) {
            errors.push('Họ tên không được để trống');
        }
        if (request.updates.contactInfo?.phoneNumber !== undefined && request.updates.contactInfo.phoneNumber.trim().length === 0) {
            errors.push('Số điện thoại không được để trống');
        }
        if (request.updates.contactInfo?.email !== undefined && request.updates.contactInfo.email.trim().length > 0) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(request.updates.contactInfo.email)) {
                errors.push('Định dạng email không hợp lệ');
            }
        }
        return {
            isValid: errors.length === 0,
            errors
        };
    }
    /**
     * Check authorization for patient update
     */
    checkUpdateAuthorization(patient, request) {
        const { requestedBy, requestedByRole } = request;
        // Patient can update their own basic info
        if (patient.userId === requestedBy) {
            // Patients can't update medical info directly
            if (request.updates.medicalInfo) {
                return {
                    authorized: false,
                    reason: 'Patients cannot update medical information directly'
                };
            }
            return { authorized: true };
        }
        // Admin has full update access
        if (requestedByRole === 'admin') {
            return { authorized: true };
        }
        // Doctor has full update access to their patients
        if (requestedByRole === 'doctor') {
            // In a real implementation, check if doctor is assigned to this patient
            return { authorized: true };
        }
        // Nurse has limited update access
        if (requestedByRole === 'nurse') {
            // Nurses can update contact info and some medical info
            if (request.updates.personalInfo || request.updates.insuranceInfo) {
                return {
                    authorized: false,
                    reason: 'Nurses cannot update personal or insurance information'
                };
            }
            return { authorized: true };
        }
        // Receptionist can only update contact info
        if (requestedByRole === 'receptionist') {
            if (request.updates.personalInfo || request.updates.medicalInfo || request.updates.insuranceInfo) {
                return {
                    authorized: false,
                    reason: 'Receptionists can only update contact information'
                };
            }
            return { authorized: true };
        }
        // Default: no access
        return {
            authorized: false,
            reason: `Role ${requestedByRole} not authorized for patient updates`
        };
    }
    /**
     * Capture original data for audit trail
     */
    captureOriginalData(patient) {
        return {
            personalInfo: patient.personalInfo.toPersistence(),
            contactInfo: patient.contactInfo.toPersistence(),
            medicalInfo: patient.medicalInfo.toPersistence(),
            insuranceInfo: patient.insuranceInfo?.toPersistence(),
            updatedAt: patient.updatedAt
        };
    }
    /**
     * Apply updates to patient
     */
    async applyUpdates(patient, updates) {
        const updatedFields = [];
        // Update personal info
        if (updates.personalInfo) {
            if (updates.personalInfo.fullName !== undefined) {
                patient.updatePersonalInfo({ fullName: updates.personalInfo.fullName });
                updatedFields.push('fullName');
            }
            if (updates.personalInfo.nationality !== undefined) {
                patient.updatePersonalInfo({ nationality: updates.personalInfo.nationality });
                updatedFields.push('nationality');
            }
            if (updates.personalInfo.ethnicity !== undefined) {
                patient.updatePersonalInfo({ ethnicity: updates.personalInfo.ethnicity });
                updatedFields.push('ethnicity');
            }
            if (updates.personalInfo.occupation !== undefined) {
                patient.updatePersonalInfo({ occupation: updates.personalInfo.occupation });
                updatedFields.push('occupation');
            }
            if (updates.personalInfo.maritalStatus !== undefined) {
                patient.updatePersonalInfo({ maritalStatus: updates.personalInfo.maritalStatus });
                updatedFields.push('maritalStatus');
            }
        }
        // Update contact info
        if (updates.contactInfo) {
            if (updates.contactInfo.phoneNumber !== undefined) {
                patient.updateContactInfo({ phoneNumber: updates.contactInfo.phoneNumber });
                updatedFields.push('phoneNumber');
            }
            if (updates.contactInfo.email !== undefined) {
                patient.updateContactInfo({ email: updates.contactInfo.email });
                updatedFields.push('email');
            }
            if (updates.contactInfo.address) {
                patient.updateContactInfo({ address: updates.contactInfo.address });
                updatedFields.push('address');
            }
        }
        // Update medical info
        if (updates.medicalInfo) {
            patient.updateMedicalInfo(updates.medicalInfo);
            updatedFields.push('medicalInfo');
        }
        // Update insurance info
        if (updates.insuranceInfo) {
            patient.updateInsuranceInfo(updates.insuranceInfo);
            updatedFields.push('insuranceInfo');
        }
        return updatedFields;
    }
    /**
     * Publish domain events
     */
    async publishDomainEvents(patient) {
        const events = patient.getUncommittedEvents();
        for (const event of events) {
            await this.eventBus.publish(event);
        }
        patient.markEventsAsCommitted();
    }
    /**
     * HIPAA audit logging for patient update
     */
    async auditPatientUpdate(patient, request, originalData, updatedFields) {
        this.logger.info('HIPAA Audit: Patient information update', {
            action: 'PATIENT_INFO_UPDATE',
            patientId: patient.id.value,
            requestedBy: request.requestedBy,
            requestedByRole: request.requestedByRole,
            updatedFields,
            updateReason: request.updateReason,
            timestamp: new Date().toISOString(),
            ipAddress: request.requestMetadata?.ipAddress,
            userAgent: request.requestMetadata?.userAgent,
            sessionId: request.requestMetadata?.sessionId,
            dataModified: updatedFields.join(','),
            complianceLevel: 'hipaa',
            changeDetails: {
                fieldsChanged: updatedFields.length,
                hasPersonalInfoChanges: updatedFields.some(f => ['fullName', 'nationality', 'ethnicity', 'occupation', 'maritalStatus'].includes(f)),
                hasContactInfoChanges: updatedFields.some(f => ['phoneNumber', 'email', 'address'].includes(f)),
                hasMedicalInfoChanges: updatedFields.includes('medicalInfo'),
                hasInsuranceInfoChanges: updatedFields.includes('insuranceInfo')
            }
        });
    }
}
exports.UpdatePatientInfoUseCase = UpdatePatientInfoUseCase;
//# sourceMappingURL=UpdatePatientInfoUseCase.js.map