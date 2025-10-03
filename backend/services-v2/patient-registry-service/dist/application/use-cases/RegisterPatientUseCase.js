"use strict";
/**
 * RegisterPatientUseCase - Application Use Case
 * V2 Clean Architecture + DDD Implementation
 * Handles patient registration with Vietnamese healthcare compliance
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, Vietnamese Healthcare Standards, HIPAA
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.RegisterPatientUseCase = void 0;
const base_healthcare_use_case_1 = require("../../../../shared/application/base/base-healthcare-use-case");
const Patient_1 = require("../../domain/aggregates/Patient");
const PersonalInfo_1 = require("../../domain/value-objects/PersonalInfo");
const ContactInfo_1 = require("../../domain/value-objects/ContactInfo");
const MedicalInfo_1 = require("../../domain/value-objects/MedicalInfo");
const InsuranceInfo_1 = require("../../domain/entities/InsuranceInfo");
/**
 * Register Patient Use Case
 * Handles complete patient registration process with Vietnamese healthcare compliance
 */
class RegisterPatientUseCase extends base_healthcare_use_case_1.BaseHealthcareUseCase {
    constructor(patientRepository, eventBus, logger) {
        super();
        this.patientRepository = patientRepository;
        this.eventBus = eventBus;
        this.logger = logger;
    }
    /**
     * Execute patient registration
     */
    async executeImpl(request) {
        try {
            this.logger.info('Starting patient registration', {
                userId: request.userId,
                requestedBy: request.requestedBy
            });
            // 1. Validate request
            const validationResult = await this.validateRequest(request);
            if (!validationResult.isValid) {
                return {
                    success: false,
                    message: 'Dữ liệu đăng ký không hợp lệ',
                    errors: validationResult.errors
                };
            }
            // 2. Check if patient already exists for this user
            const existingPatient = await this.patientRepository.findByUserId(request.userId);
            if (existingPatient) {
                return {
                    success: false,
                    message: 'Bệnh nhân đã được đăng ký cho tài khoản này'
                };
            }
            // 3. Check for duplicate national ID
            const duplicatePatient = await this.patientRepository.findByNationalId(request.personalInfo.nationalId);
            if (duplicatePatient) {
                return {
                    success: false,
                    message: 'CMND/CCCD đã được sử dụng cho bệnh nhân khác'
                };
            }
            // 4. Create value objects
            const personalInfo = PersonalInfo_1.PersonalInfo.create({
                fullName: request.personalInfo.fullName,
                dateOfBirth: new Date(request.personalInfo.dateOfBirth),
                gender: request.personalInfo.gender,
                nationalId: request.personalInfo.nationalId,
                nationality: request.personalInfo.nationality,
                ethnicity: request.personalInfo.ethnicity,
                occupation: request.personalInfo.occupation,
                maritalStatus: request.personalInfo.maritalStatus
            });
            const contactInfo = ContactInfo_1.ContactInfo.create({
                primaryPhone: request.contactInfo.primaryPhone,
                secondaryPhone: request.contactInfo.secondaryPhone,
                email: request.contactInfo.email,
                preferredContactMethod: request.contactInfo.preferredContactMethod || 'phone',
                address: request.contactInfo.address
            });
            const medicalInfo = MedicalInfo_1.MedicalInfo.create({
                bloodType: request.medicalInfo.bloodType,
                allergies: request.medicalInfo.allergies || [],
                chronicConditions: request.medicalInfo.chronicConditions || [],
                currentMedications: (request.medicalInfo.currentMedications || []).map(med => ({
                    ...med,
                    startDate: new Date(med.startDate),
                    endDate: med.endDate ? new Date(med.endDate) : undefined
                })),
                emergencyMedicalInfo: request.medicalInfo.emergencyMedicalInfo,
                height: request.medicalInfo.height,
                weight: request.medicalInfo.weight,
                smokingStatus: request.medicalInfo.smokingStatus || 'never',
                alcoholConsumption: request.medicalInfo.alcoholConsumption || 'none',
                exerciseFrequency: request.medicalInfo.exerciseFrequency || 'none',
                dietaryRestrictions: request.medicalInfo.dietaryRestrictions || [],
                familyMedicalHistory: request.medicalInfo.familyMedicalHistory || []
            });
            // 5. Create insurance info if provided
            let insuranceInfo;
            if (request.insuranceInfo) {
                insuranceInfo = InsuranceInfo_1.InsuranceInfo.create({
                    provider: request.insuranceInfo.provider,
                    policyNumber: request.insuranceInfo.policyNumber,
                    groupNumber: request.insuranceInfo.groupNumber,
                    validFrom: new Date(request.insuranceInfo.validFrom),
                    validTo: new Date(request.insuranceInfo.validTo),
                    coverageType: request.insuranceInfo.coverageType,
                    isVietnameseInsurance: request.insuranceInfo.isVietnameseInsurance,
                    bhytNumber: request.insuranceInfo.bhytNumber
                });
            }
            // 6. Create patient aggregate
            const patient = Patient_1.Patient.create(request.userId, personalInfo, contactInfo, medicalInfo, insuranceInfo);
            // 7. Add emergency contacts
            for (const contact of request.emergencyContacts) {
                patient.addEmergencyContact(contact.name, contact.relationship, contact.phoneNumber, contact.email, contact.address);
            }
            // 8. Vietnamese healthcare compliance validation
            if (!patient.isVietnameseHealthcareCompliant()) {
                return {
                    success: false,
                    message: 'Thông tin bệnh nhân không đáp ứng tiêu chuẩn y tế Việt Nam'
                };
            }
            // 9. HIPAA compliance validation
            if (!patient.isHIPAACompliant()) {
                this.logger.warn('Patient registration lacks HIPAA compliance', {
                    patientId: patient.id.value,
                    userId: request.userId
                });
            }
            // 10. Save patient
            await this.patientRepository.save(patient);
            // 11. Publish domain events
            await this.publishDomainEvents(patient);
            // 12. HIPAA audit logging
            await this.auditPatientRegistration(patient, request);
            this.logger.info('Patient registration completed successfully', {
                patientId: patient.id.value,
                userId: request.userId,
                requestedBy: request.requestedBy
            });
            return {
                success: true,
                patientId: patient.id.value,
                message: 'Đăng ký bệnh nhân thành công',
                data: {
                    patient: {
                        id: patient.id.value,
                        userId: patient.userId,
                        fullName: patient.personalInfo.fullName,
                        registrationDate: patient.registrationDate.toISOString(),
                        isActive: patient.isActive
                    }
                }
            };
        }
        catch (error) {
            this.logger.error('Error during patient registration', {
                userId: request.userId,
                requestedBy: request.requestedBy,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            return {
                success: false,
                message: 'Lỗi hệ thống khi đăng ký bệnh nhân'
            };
        }
    }
    /**
     * Validate registration request
     */
    async validateRequest(request) {
        const errors = [];
        // User ID validation
        if (!request.userId || request.userId.trim().length === 0) {
            errors.push('ID người dùng không được để trống');
        }
        // Personal info validation
        if (!request.personalInfo.fullName || request.personalInfo.fullName.trim().length === 0) {
            errors.push('Họ tên không được để trống');
        }
        if (!request.personalInfo.dateOfBirth) {
            errors.push('Ngày sinh không được để trống');
        }
        else {
            const birthDate = new Date(request.personalInfo.dateOfBirth);
            const today = new Date();
            if (birthDate >= today) {
                errors.push('Ngày sinh phải trước ngày hiện tại');
            }
            if (today.getFullYear() - birthDate.getFullYear() > 150) {
                errors.push('Tuổi không hợp lệ');
            }
        }
        if (!request.personalInfo.nationalId || request.personalInfo.nationalId.trim().length === 0) {
            errors.push('CMND/CCCD không được để trống');
        }
        // Contact info validation
        if (!request.contactInfo.primaryPhone || request.contactInfo.primaryPhone.trim().length === 0) {
            errors.push('Số điện thoại không được để trống');
        }
        if (!request.contactInfo.address.street || request.contactInfo.address.street.trim().length === 0) {
            errors.push('Địa chỉ không được để trống');
        }
        // Emergency contacts validation
        if (!request.emergencyContacts || request.emergencyContacts.length === 0) {
            errors.push('Phải có ít nhất một liên hệ khẩn cấp');
        }
        // Requested by validation
        if (!request.requestedBy || request.requestedBy.trim().length === 0) {
            errors.push('Thông tin người yêu cầu không được để trống');
        }
        return {
            isValid: errors.length === 0,
            errors
        };
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
     * HIPAA audit logging for patient registration
     */
    async auditPatientRegistration(patient, request) {
        // This would integrate with audit service
        this.logger.info('HIPAA Audit: Patient registration', {
            action: 'PATIENT_REGISTRATION',
            patientId: patient.id.value,
            userId: request.userId,
            requestedBy: request.requestedBy,
            timestamp: new Date().toISOString(),
            ipAddress: request.requestMetadata?.ipAddress,
            userAgent: request.requestMetadata?.userAgent,
            sessionId: request.requestMetadata?.sessionId,
            dataAccessed: 'patient_personal_info,patient_contact_info,patient_medical_info',
            complianceLevel: 'hipaa'
        });
    }
}
exports.RegisterPatientUseCase = RegisterPatientUseCase;
//# sourceMappingURL=RegisterPatientUseCase.js.map