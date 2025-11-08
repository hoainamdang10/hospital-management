"use strict";
/**
 * RegisterPatientUseCase - Application Use Case
 *
 * Handles patient registration with Vietnamese healthcare compliance
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, Vietnamese Healthcare Standards, HIPAA
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.RegisterPatientUseCase = void 0;
const crypto_1 = require("crypto");
const Patient_1 = require("../../domain/aggregates/Patient");
const PatientId_1 = require("../../domain/value-objects/PatientId");
const PersonalInfo_1 = require("../../domain/value-objects/PersonalInfo");
const ContactInfo_1 = require("../../domain/value-objects/ContactInfo");
const BasicMedicalInfo_1 = require("../../domain/value-objects/BasicMedicalInfo");
const InsuranceInfo_1 = require("../../domain/entities/InsuranceInfo");
const EmergencyContact_1 = require("../../domain/entities/EmergencyContact");
class RegisterPatientUseCase {
    constructor(patientRepository, eventBus, logger, auditService, supabaseClient) {
        this.patientRepository = patientRepository;
        this.eventBus = eventBus;
        this.logger = logger;
        this.auditService = auditService;
        this.supabaseClient = supabaseClient;
    }
    async execute(request) {
        try {
            this.logger.info("Starting patient registration", {
                userId: request.userId,
                requestedBy: request.requestedBy,
            });
            // 1. Validate user exists (should be done by caller or Identity Service)
            // 2. Check if patient already exists
            const existingPatient = await this.patientRepository.findByUserId(request.userId);
            if (existingPatient) {
                this.logger.warn("Patient registration failed: user already has profile", {
                    userId: request.userId,
                });
                return {
                    success: false,
                    message: "Người dùng đã có hồ sơ bệnh nhân",
                    errors: ["USER_ALREADY_HAS_PATIENT_PROFILE"],
                };
            }
            // 3. Check if national ID already exists
            const existingByNationalId = await this.patientRepository.findByNationalId(request.personalInfo.nationalId);
            if (existingByNationalId) {
                return {
                    success: false,
                    message: "CMND/CCCD đã tồn tại trong hệ thống",
                    errors: ["NATIONAL_ID_ALREADY_EXISTS"],
                };
            }
            // 4. Check if BHYT number already exists (if provided)
            if (request.insuranceInfo?.bhytNumber) {
                const existingByBHYT = await this.patientRepository.findByBHYTNumber(request.insuranceInfo.bhytNumber);
                if (existingByBHYT) {
                    return {
                        success: false,
                        message: "Số BHYT đã tồn tại trong hệ thống",
                        errors: ["BHYT_NUMBER_ALREADY_EXISTS"],
                    };
                }
            }
            // 5. Create value objects
            const personalInfo = PersonalInfo_1.PersonalInfo.create({
                fullName: request.personalInfo.fullName,
                dateOfBirth: new Date(request.personalInfo.dateOfBirth),
                gender: request.personalInfo.gender,
                nationalId: request.personalInfo.nationalId,
                nationality: request.personalInfo.nationality?.trim() ||
                    DEFAULT_PATIENT_NATIONALITY,
                ethnicity: request.personalInfo.ethnicity,
                occupation: request.personalInfo.occupation,
                maritalStatus: request.personalInfo.maritalStatus,
            });
            const preferredContactMethod = request.contactInfo.preferredContactMethod ?? "phone";
            const contactInfo = ContactInfo_1.ContactInfo.create({
                primaryPhone: normalizeVietnamesePhoneNumber(request.contactInfo.primaryPhone) ||
                    request.contactInfo.primaryPhone,
                secondaryPhone: normalizeVietnamesePhoneNumber(request.contactInfo.secondaryPhone),
                email: request.contactInfo.email,
                preferredContactMethod,
                address: buildSafePatientAddress(request.contactInfo.address),
            });
            const basicMedicalInfo = request.basicMedicalInfo
                ? BasicMedicalInfo_1.BasicMedicalInfo.create({
                    bloodType: request.basicMedicalInfo.bloodType,
                    knownAllergies: request.basicMedicalInfo.knownAllergies || [],
                    emergencyMedicalInfo: request.basicMedicalInfo.emergencyMedicalInfo,
                })
                : BasicMedicalInfo_1.BasicMedicalInfo.createEmpty();
            // 6. Create insurance info entity (if provided)
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
                    bhytNumber: request.insuranceInfo.bhytNumber,
                    isPrimary: request.insuranceInfo.isPrimary,
                    isActive: true,
                });
            }
            // 7. Create emergency contact entities
            const emergencyContacts = (request.emergencyContacts ?? []).map((contact) => EmergencyContact_1.EmergencyContact.create(contact.name, contact.relationship, contact.primaryPhone, contact.secondaryPhone, contact.email, contact.address, contact.isPrimary));
            // 8. Generate PatientId from database sequence (thread-safe)
            const patientId = await PatientId_1.PatientId.generateFromDB(this.supabaseClient);
            // 9. Register patient (create aggregate with pre-generated ID)
            const patient = Patient_1.Patient.registerWithId(patientId, request.userId, personalInfo, contactInfo, basicMedicalInfo, insuranceInfo, emergencyContacts, request.requestedBy);
            // 10. Save to repository
            await this.patientRepository.save(patient);
            // 11. Publish domain events
            await this.publishDomainEvents(patient);
            // 12. HIPAA audit logging
            await this.auditPatientRegistration(patient, request);
            this.logger.info("Patient registration completed successfully", {
                patientId: patient.getPatientId(),
                userId: request.userId,
                requestedBy: request.requestedBy,
            });
            // 13. Return success response
            return {
                success: true,
                patientId: patient.getPatientId() || "",
                message: "Đăng ký bệnh nhân thành công",
            };
        }
        catch (error) {
            // Handle validation errors
            if (error instanceof Error) {
                this.logger.error("Patient registration failed", {
                    userId: request.userId,
                    error: error.message,
                    stack: error.stack,
                });
                return {
                    success: false,
                    message: "Đăng ký bệnh nhân thất bại",
                    errors: ["REGISTRATION_FAILED", error.message],
                };
            }
            // Handle unexpected errors
            this.logger.error("Unexpected error during patient registration", {
                userId: request.userId,
                error: "UNEXPECTED_ERROR",
            });
            return {
                success: false,
                message: "Đã xảy ra lỗi không mong muốn",
                errors: ["UNEXPECTED_ERROR"],
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
            this.logger.warn("Event publishing failed, but patient was saved", {
                patientId: patient.getPatientId(),
                error: error instanceof Error ? error.message : "Unknown error",
            });
        }
    }
    /**
     * HIPAA audit logging for patient registration
     * Logs to audit_logs table via AuditService
     */
    async auditPatientRegistration(patient, request) {
        try {
            // Log to audit_logs table (HIPAA compliance)
            await this.auditService.logAudit({
                eventId: (0, crypto_1.randomUUID)(),
                eventType: "patient.registered",
                aggregateType: "Patient",
                aggregateId: patient.getPatientId() || "unknown",
                action: "PATIENT_REGISTRATION",
                userId: request.userId ?? undefined,
                patientId: patient.getPatientId() ?? undefined,
                containsPHI: true,
                changedFields: {
                    dataAccessed: "patient_personal_info,patient_contact_info,patient_medical_info,insurance_info",
                    requestedBy: request.requestedBy || "system",
                },
                complianceLevel: "hipaa",
            });
            this.logger.info("Patient registration audited successfully", {
                patientId: patient.getPatientId(),
            });
        }
        catch (error) {
            // Log error but don't fail the registration
            this.logger.error("Failed to audit patient registration", {
                patientId: patient.getPatientId(),
                error: error instanceof Error ? error.message : "Unknown error",
            });
        }
    }
}
exports.RegisterPatientUseCase = RegisterPatientUseCase;
const DEFAULT_PATIENT_NATIONALITY = "Vietnamese";
const DEFAULT_PATIENT_ADDRESS_TEXT = "Chưa cập nhật";
const DEFAULT_PATIENT_CITY = "TP. Hồ Chí Minh";
const DEFAULT_PATIENT_COUNTRY = "Việt Nam";
function buildSafePatientAddress(address) {
    const fallbackCity = address?.city?.trim() || DEFAULT_PATIENT_CITY;
    return {
        street: address?.street?.trim() || DEFAULT_PATIENT_ADDRESS_TEXT,
        ward: address?.ward?.trim() || DEFAULT_PATIENT_ADDRESS_TEXT,
        district: address?.district?.trim() || DEFAULT_PATIENT_ADDRESS_TEXT,
        city: fallbackCity,
        province: address?.province?.trim() || fallbackCity,
        postalCode: address?.postalCode?.trim(),
        country: address?.country?.trim() || DEFAULT_PATIENT_COUNTRY,
    };
}
function normalizeVietnamesePhoneNumber(phone) {
    if (!phone) {
        return undefined;
    }
    const sanitized = phone.replace(/[\s-]/g, "");
    if (sanitized.startsWith("+84")) {
        const rest = sanitized.slice(3);
        if (!rest) {
            return undefined;
        }
        return `0${rest}`;
    }
    if (sanitized.startsWith("84") && sanitized.length >= 11) {
        return `0${sanitized.slice(2)}`;
    }
    return sanitized;
}
//# sourceMappingURL=RegisterPatientUseCase.js.map