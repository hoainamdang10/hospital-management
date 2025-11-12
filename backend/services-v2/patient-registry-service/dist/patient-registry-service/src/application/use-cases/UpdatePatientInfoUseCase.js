"use strict";
/**
 * UpdatePatientInfoUseCase - Application Use Case
 *
 * Handles patient information updates
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, Vietnamese Healthcare Standards, HIPAA
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdatePatientInfoUseCase = void 0;
const crypto_1 = require("crypto");
const PatientId_1 = require("../../domain/value-objects/PatientId");
const PersonalInfo_1 = require("../../domain/value-objects/PersonalInfo");
const ContactInfo_1 = require("../../domain/value-objects/ContactInfo");
const BasicMedicalInfo_1 = require("../../domain/value-objects/BasicMedicalInfo");
const InsuranceInfo_1 = require("../../domain/entities/InsuranceInfo");
class UpdatePatientInfoUseCase {
    constructor(patientRepository, eventBus, logger, auditService) {
        this.patientRepository = patientRepository;
        this.eventBus = eventBus;
        this.logger = logger;
        this.auditService = auditService;
    }
    async execute(request) {
        try {
            this.logger.info('Starting patient info update', {
                patientId: request.patientId,
                updatedBy: request.updatedBy,
            });
            // 1. Find patient
            const patientId = PatientId_1.PatientId.create(request.patientId);
            const patient = await this.patientRepository.findById(patientId);
            if (!patient) {
                this.logger.warn('Patient update failed: patient not found', {
                    patientId: request.patientId,
                });
                return {
                    success: false,
                    message: 'Không tìm thấy bệnh nhân',
                    errors: ['PATIENT_NOT_FOUND'],
                };
            }
            // 2. Check if patient is active
            if (!patient.isActive()) {
                this.logger.warn('Patient update failed: patient not active', {
                    patientId: request.patientId,
                });
                return {
                    success: false,
                    message: 'Không thể cập nhật bệnh nhân không hoạt động',
                    errors: ['PATIENT_NOT_ACTIVE'],
                };
            }
            // Track updated fields for audit
            const updatedFields = [];
            // 3. Update personal info (if provided)
            if (request.personalInfo) {
                updatedFields.push('personal_info');
                const personalInfo = PersonalInfo_1.PersonalInfo.create({
                    fullName: request.personalInfo.fullName,
                    dateOfBirth: new Date(request.personalInfo.dateOfBirth),
                    gender: request.personalInfo.gender,
                    nationalId: request.personalInfo.nationalId,
                    nationality: request.personalInfo.nationality,
                    ethnicity: request.personalInfo.ethnicity,
                    occupation: request.personalInfo.occupation,
                    maritalStatus: request.personalInfo.maritalStatus,
                });
                patient.updatePersonalInfo(personalInfo, request.updatedBy);
            }
            // 4. Update contact info (if provided)
            if (request.contactInfo) {
                updatedFields.push('contact_info');
                const contactInfo = ContactInfo_1.ContactInfo.create({
                    primaryPhone: request.contactInfo.primaryPhone,
                    secondaryPhone: request.contactInfo.secondaryPhone,
                    email: request.contactInfo.email,
                    preferredContactMethod: request.contactInfo.preferredContactMethod,
                    address: request.contactInfo.address,
                });
                patient.updateContactInfo(contactInfo, request.updatedBy);
            }
            // 5. Update basic medical info (if provided)
            if (request.basicMedicalInfo) {
                updatedFields.push('basic_medical_info');
                const basicMedicalInfo = BasicMedicalInfo_1.BasicMedicalInfo.create({
                    bloodType: request.basicMedicalInfo.bloodType,
                    knownAllergies: request.basicMedicalInfo.knownAllergies || [],
                    emergencyMedicalInfo: request.basicMedicalInfo.emergencyMedicalInfo,
                });
                patient.updateBasicMedicalInfo(basicMedicalInfo, request.updatedBy);
            }
            // 6. Update insurance info (if provided)
            if (request.insuranceInfo) {
                updatedFields.push('insurance_info');
                const insuranceInfo = InsuranceInfo_1.InsuranceInfo.create({
                    provider: request.insuranceInfo.provider,
                    policyNumber: request.insuranceInfo.policyNumber,
                    groupNumber: request.insuranceInfo.groupNumber,
                    validFrom: new Date(request.insuranceInfo.validFrom),
                    validTo: new Date(request.insuranceInfo.validTo),
                    coverageType: request.insuranceInfo.coverageType,
                    isVietnameseInsurance: request.insuranceInfo.isVietnameseInsurance,
                    bhytNumber: request.insuranceInfo.bhytNumber,
                    isPrimary: request.insuranceInfo.isPrimary,
                    isActive: true,
                });
                patient.updateInsuranceInfo(insuranceInfo, request.updatedBy);
            }
            // 7. Save updated patient
            await this.patientRepository.save(patient);
            // 8. Publish domain events
            await this.publishDomainEvents(patient);
            // 9. HIPAA audit logging
            await this.auditPatientUpdate(patient, request, updatedFields);
            this.logger.info('Patient info update completed successfully', {
                patientId: request.patientId,
                updatedBy: request.updatedBy,
                updatedFields: updatedFields.join(','),
            });
            // 10. Return success response
            return {
                success: true,
                message: 'Cập nhật thông tin bệnh nhân thành công',
            };
        }
        catch (error) {
            // Handle validation errors
            if (error instanceof Error) {
                this.logger.error('Patient info update failed', {
                    patientId: request.patientId,
                    error: error.message,
                    stack: error.stack,
                });
                return {
                    success: false,
                    message: 'Cập nhật thông tin bệnh nhân thất bại',
                    errors: ['UPDATE_FAILED', error.message],
                };
            }
            // Handle unexpected errors
            this.logger.error('Unexpected error during patient info update', {
                patientId: request.patientId,
                error: 'UNEXPECTED_ERROR',
            });
            return {
                success: false,
                message: 'Đã xảy ra lỗi không mong muốn',
                errors: ['UNEXPECTED_ERROR'],
            };
        }
    }
    /**
     * Publish domain events
     */
    async publishDomainEvents(patient) {
        try {
            const events = patient.getUncommittedEvents();
            for (const event of events) {
                await this.eventBus.publish(event);
            }
            patient.markEventsAsCommitted();
        }
        catch (error) {
            this.logger.warn('Event publishing failed, but patient was updated', {
                patientId: patient.getPatientId(),
                error: error instanceof Error ? error.message : 'Unknown error',
            });
        }
    }
    /**
     * HIPAA audit logging for patient update
     * Logs to audit_logs table via AuditService
     */
    async auditPatientUpdate(patient, request, updatedFields) {
        try {
            // Log to audit_logs table (HIPAA compliance)
            await this.auditService.logAudit({
                eventId: (0, crypto_1.randomUUID)(),
                eventType: 'patient.updated',
                aggregateType: 'Patient',
                aggregateId: patient.getPatientId() || 'unknown',
                action: 'PATIENT_INFO_UPDATE',
                userId: request.updatedBy ?? undefined,
                patientId: patient.getPatientId() ?? undefined,
                containsPHI: true,
                changedFields: {
                    dataAccessed: updatedFields.join(','),
                    requestedBy: request.updatedBy || 'system',
                    updatedFields: updatedFields,
                },
                complianceLevel: 'hipaa',
            });
            this.logger.info('Patient update audited successfully', {
                patientId: patient.getPatientId(),
            });
        }
        catch (error) {
            this.logger.error('Failed to audit patient update', {
                patientId: patient.getPatientId(),
                error: error instanceof Error ? error.message : 'Unknown error',
            });
        }
    }
}
exports.UpdatePatientInfoUseCase = UpdatePatientInfoUseCase;
//# sourceMappingURL=UpdatePatientInfoUseCase.js.map