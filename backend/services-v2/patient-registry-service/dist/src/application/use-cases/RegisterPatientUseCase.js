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
const Patient_1 = require("../../domain/aggregates/Patient");
const PersonalInfo_1 = require("../../domain/value-objects/PersonalInfo");
const ContactInfo_1 = require("../../domain/value-objects/ContactInfo");
const BasicMedicalInfo_1 = require("../../domain/value-objects/BasicMedicalInfo");
const InsuranceInfo_1 = require("../../domain/entities/InsuranceInfo");
const EmergencyContact_1 = require("../../domain/entities/EmergencyContact");
class RegisterPatientUseCase {
    constructor(patientRepository) {
        this.patientRepository = patientRepository;
    }
    async execute(request) {
        try {
            // 1. Validate user exists (should be done by caller or Identity Service)
            // 2. Check if patient already exists
            const existingPatient = await this.patientRepository.findByUserId(request.userId);
            if (existingPatient) {
                return {
                    success: false,
                    message: 'Người dùng đã có hồ sơ bệnh nhân',
                    errors: ['USER_ALREADY_HAS_PATIENT_PROFILE']
                };
            }
            // 3. Check if national ID already exists
            const existingByNationalId = await this.patientRepository.findByNationalId(request.personalInfo.nationalId);
            if (existingByNationalId) {
                return {
                    success: false,
                    message: 'CMND/CCCD đã tồn tại trong hệ thống',
                    errors: ['NATIONAL_ID_ALREADY_EXISTS']
                };
            }
            // 4. Check if BHYT number already exists (if provided)
            if (request.insuranceInfo?.bhytNumber) {
                const existingByBHYT = await this.patientRepository.findByBHYTNumber(request.insuranceInfo.bhytNumber);
                if (existingByBHYT) {
                    return {
                        success: false,
                        message: 'Số BHYT đã tồn tại trong hệ thống',
                        errors: ['BHYT_NUMBER_ALREADY_EXISTS']
                    };
                }
            }
            // 5. Create value objects
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
                preferredContactMethod: request.contactInfo.preferredContactMethod,
                address: request.contactInfo.address
            });
            const basicMedicalInfo = request.basicMedicalInfo
                ? BasicMedicalInfo_1.BasicMedicalInfo.create({
                    bloodType: request.basicMedicalInfo.bloodType,
                    knownAllergies: request.basicMedicalInfo.knownAllergies || [],
                    emergencyMedicalInfo: request.basicMedicalInfo.emergencyMedicalInfo
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
                    isActive: true
                });
            }
            // 7. Create emergency contact entities
            const emergencyContacts = request.emergencyContacts.map(contact => EmergencyContact_1.EmergencyContact.create(contact.name, contact.relationship, contact.primaryPhone, contact.secondaryPhone, contact.email, contact.address, contact.isPrimary));
            // 8. Register patient (create aggregate)
            const patient = Patient_1.Patient.register(request.userId, personalInfo, contactInfo, basicMedicalInfo, insuranceInfo, emergencyContacts, request.requestedBy);
            // 9. Save to repository
            await this.patientRepository.save(patient);
            // 10. Return success response
            return {
                success: true,
                patientId: patient.getPatientId().getValue(),
                message: 'Đăng ký bệnh nhân thành công'
            };
        }
        catch (error) {
            // Handle validation errors
            if (error instanceof Error) {
                return {
                    success: false,
                    message: 'Đăng ký bệnh nhân thất bại',
                    errors: [error.message]
                };
            }
            // Handle unexpected errors
            return {
                success: false,
                message: 'Đã xảy ra lỗi không mong muốn',
                errors: ['UNEXPECTED_ERROR']
            };
        }
    }
}
exports.RegisterPatientUseCase = RegisterPatientUseCase;
//# sourceMappingURL=RegisterPatientUseCase.js.map