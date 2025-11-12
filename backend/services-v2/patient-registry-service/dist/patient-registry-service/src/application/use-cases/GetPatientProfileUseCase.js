"use strict";
/**
 * GetPatientProfileUseCase - Application Use Case
 *
 * Retrieves patient profile information
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, Vietnamese Healthcare Standards, HIPAA
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetPatientProfileUseCase = void 0;
const PatientId_1 = require("../../domain/value-objects/PatientId");
class GetPatientProfileUseCase {
    constructor(patientRepository, logger, auditService) {
        this.patientRepository = patientRepository;
        this.logger = logger;
        this.auditService = auditService;
    }
    async execute(request) {
        try {
            this.logger.info('Retrieving patient profile', {
                patientId: request.patientId,
                userId: request.userId,
                requestedBy: request.requestedBy
            });
            // 1. Find patient by one of the identifiers
            let patient = null;
            if (request.patientId) {
                const patientId = PatientId_1.PatientId.create(request.patientId);
                patient = await this.patientRepository.findById(patientId);
            }
            else if (request.userId) {
                patient = await this.patientRepository.findByUserId(request.userId);
            }
            else if (request.nationalId) {
                patient = await this.patientRepository.findByNationalId(request.nationalId);
            }
            else if (request.bhytNumber) {
                patient = await this.patientRepository.findByBHYTNumber(request.bhytNumber);
            }
            else {
                return {
                    success: false,
                    message: 'Vui lòng cung cấp patientId, userId, nationalId hoặc bhytNumber',
                    errors: ['MISSING_IDENTIFIER']
                };
            }
            if (!patient) {
                this.logger.warn('Patient profile retrieval failed: patient not found', {
                    patientId: request.patientId,
                    userId: request.userId
                });
                return {
                    success: false,
                    message: 'Không tìm thấy bệnh nhân',
                    errors: ['PATIENT_NOT_FOUND']
                };
            }
            // 2. HIPAA audit logging
            this.auditPatientProfileAccess(patient, request);
            // 3. Map patient aggregate to response DTO
            const personalInfo = patient.getPersonalInfo();
            const contactInfo = patient.getContactInfo();
            const basicMedicalInfo = patient.getBasicMedicalInfo();
            const insuranceInfo = patient.getInsuranceInfo();
            const emergencyContacts = patient.getEmergencyContacts();
            const consents = patient.getConsents();
            const links = patient.getLinks();
            this.logger.info('Patient profile retrieved successfully', {
                patientId: patient.getPatientId(),
                requestedBy: request.requestedBy
            });
            return {
                success: true,
                message: 'Lấy thông tin bệnh nhân thành công',
                data: {
                    patientId: patient.getPatientId() || '',
                    userId: patient.getUserId(),
                    personalInfo: {
                        fullName: personalInfo.fullName,
                        dateOfBirth: personalInfo.dateOfBirth.toISOString(),
                        gender: personalInfo.gender,
                        nationalId: personalInfo.nationalId,
                        nationality: personalInfo.nationality,
                        ethnicity: personalInfo.ethnicity,
                        occupation: personalInfo.occupation,
                        maritalStatus: personalInfo.maritalStatus
                    },
                    contactInfo: {
                        primaryPhone: contactInfo.primaryPhone,
                        secondaryPhone: contactInfo.secondaryPhone,
                        email: contactInfo.email,
                        preferredContactMethod: contactInfo.preferredContactMethod,
                        address: {
                            street: contactInfo.address.street,
                            ward: contactInfo.address.ward,
                            district: contactInfo.address.district,
                            city: contactInfo.address.city,
                            postalCode: contactInfo.address.postalCode,
                            country: contactInfo.address.country
                        }
                    },
                    basicMedicalInfo: {
                        bloodType: basicMedicalInfo.bloodType,
                        knownAllergies: basicMedicalInfo.knownAllergies,
                        emergencyMedicalInfo: basicMedicalInfo.emergencyMedicalInfo
                    },
                    insuranceInfo: insuranceInfo ? {
                        provider: insuranceInfo.provider,
                        policyNumber: insuranceInfo.policyNumber,
                        groupNumber: insuranceInfo.groupNumber,
                        validFrom: insuranceInfo.validFrom.toISOString(),
                        validTo: insuranceInfo.validTo.toISOString(),
                        coverageType: insuranceInfo.coverageType,
                        isVietnameseInsurance: insuranceInfo.isVietnameseInsurance,
                        bhytNumber: insuranceInfo.bhytNumber,
                        isPrimary: insuranceInfo.isPrimary,
                        isActive: insuranceInfo.isActive
                    } : undefined,
                    emergencyContacts: emergencyContacts.map(contact => ({
                        id: contact.getId(),
                        name: contact.name,
                        relationship: contact.relationship,
                        primaryPhone: contact.primaryPhone,
                        secondaryPhone: contact.secondaryPhone,
                        email: contact.email,
                        address: contact.address,
                        isPrimary: contact.isPrimary
                    })),
                    consents: consents.map(consent => ({
                        id: consent.getId(),
                        consentType: consent.consentType,
                        isGranted: consent.isGranted(),
                        grantedAt: consent.grantedAt.toISOString(),
                        revokedAt: consent.revokedAt()?.toISOString(),
                        expiresAt: consent.expiresAt?.toISOString()
                    })),
                    status: patient.getStatus().valueOf(),
                    mergedInto: patient.getMergedInto()?.value,
                    links: links.map(link => ({
                        otherPatientId: link.otherPatientId.value,
                        linkType: link.linkType,
                        createdAt: link.createdAt.toISOString(),
                        createdBy: link.createdBy
                    })),
                    createdAt: patient.getProps().createdAt.toISOString(),
                    updatedAt: patient.getProps().updatedAt.toISOString()
                }
            };
        }
        catch (error) {
            // Handle validation errors
            if (error instanceof Error) {
                this.logger.error('Patient profile retrieval failed', {
                    patientId: request.patientId,
                    userId: request.userId,
                    error: error.message,
                    stack: error.stack
                });
                return {
                    success: false,
                    message: 'Lấy thông tin bệnh nhân thất bại',
                    errors: [error.message]
                };
            }
            // Handle unexpected errors
            this.logger.error('Unexpected error during patient profile retrieval', {
                patientId: request.patientId,
                userId: request.userId,
                error: 'UNEXPECTED_ERROR'
            });
            return {
                success: false,
                message: 'Đã xảy ra lỗi không mong muốn',
                errors: ['UNEXPECTED_ERROR']
            };
        }
    }
    /**
     * HIPAA audit logging for patient profile access
     * Logs PHI access to phi_access_logs table via AuditService
     */
    async auditPatientProfileAccess(patient, request) {
        try {
            // Log PHI access to phi_access_logs table (HIPAA compliance)
            await this.auditService.logPHIAccess({
                patientId: patient.getPatientId() || 'unknown',
                userId: request.requestedBy || 'system',
                accessType: 'READ',
                accessedFields: ['patient_full_profile'],
                reason: 'Patient profile retrieval',
            });
            this.logger.info('Patient profile access audited successfully', {
                patientId: patient.getPatientId(),
            });
        }
        catch (error) {
            this.logger.error('Failed to audit patient profile access', {
                patientId: patient.getPatientId(),
                error: error instanceof Error ? error.message : 'Unknown error',
            });
        }
    }
}
exports.GetPatientProfileUseCase = GetPatientProfileUseCase;
//# sourceMappingURL=GetPatientProfileUseCase.js.map