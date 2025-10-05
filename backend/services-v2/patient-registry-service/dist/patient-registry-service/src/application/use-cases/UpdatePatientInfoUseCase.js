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
const PatientId_1 = require("../../domain/value-objects/PatientId");
const PersonalInfo_1 = require("../../domain/value-objects/PersonalInfo");
const ContactInfo_1 = require("../../domain/value-objects/ContactInfo");
const BasicMedicalInfo_1 = require("../../domain/value-objects/BasicMedicalInfo");
const InsuranceInfo_1 = require("../../domain/entities/InsuranceInfo");
class UpdatePatientInfoUseCase {
    constructor(patientRepository) {
        this.patientRepository = patientRepository;
    }
    async execute(request) {
        try {
            // 1. Find patient
            const patientId = PatientId_1.PatientId.create(request.patientId);
            const patient = await this.patientRepository.findById(patientId);
            if (!patient) {
                return {
                    success: false,
                    message: 'Không tìm thấy bệnh nhân',
                    errors: ['PATIENT_NOT_FOUND']
                };
            }
            // 2. Check if patient is active
            if (!patient.isActive()) {
                return {
                    success: false,
                    message: 'Không thể cập nhật bệnh nhân không hoạt động',
                    errors: ['PATIENT_NOT_ACTIVE']
                };
            }
            // 3. Update personal info (if provided)
            if (request.personalInfo) {
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
                patient.updatePersonalInfo(personalInfo, request.updatedBy);
            }
            // 4. Update contact info (if provided)
            if (request.contactInfo) {
                const contactInfo = ContactInfo_1.ContactInfo.create({
                    primaryPhone: request.contactInfo.primaryPhone,
                    secondaryPhone: request.contactInfo.secondaryPhone,
                    email: request.contactInfo.email,
                    preferredContactMethod: request.contactInfo.preferredContactMethod,
                    address: request.contactInfo.address
                });
                patient.updateContactInfo(contactInfo, request.updatedBy);
            }
            // 5. Update basic medical info (if provided)
            if (request.basicMedicalInfo) {
                const basicMedicalInfo = BasicMedicalInfo_1.BasicMedicalInfo.create({
                    bloodType: request.basicMedicalInfo.bloodType,
                    knownAllergies: request.basicMedicalInfo.knownAllergies || [],
                    emergencyMedicalInfo: request.basicMedicalInfo.emergencyMedicalInfo
                });
                patient.updateBasicMedicalInfo(basicMedicalInfo, request.updatedBy);
            }
            // 6. Update insurance info (if provided)
            if (request.insuranceInfo) {
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
                    isActive: true
                });
                patient.updateInsuranceInfo(insuranceInfo, request.updatedBy);
            }
            // 7. Save updated patient
            await this.patientRepository.save(patient);
            // 8. Return success response
            return {
                success: true,
                message: 'Cập nhật thông tin bệnh nhân thành công'
            };
        }
        catch (error) {
            // Handle validation errors
            if (error instanceof Error) {
                return {
                    success: false,
                    message: 'Cập nhật thông tin bệnh nhân thất bại',
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
exports.UpdatePatientInfoUseCase = UpdatePatientInfoUseCase;
//# sourceMappingURL=UpdatePatientInfoUseCase.js.map