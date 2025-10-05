"use strict";
/**
 * MatchPatientsUseCase - Application Use Case
 *
 * Implements Patient Master Index (PMI) $match operation
 * Finds potential duplicate patients based on demographic data
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, HL7 FHIR, PMI Best Practices
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.MatchPatientsUseCase = void 0;
class MatchPatientsUseCase {
    constructor(patientRepository) {
        this.patientRepository = patientRepository;
    }
    async execute(request) {
        try {
            // 1. Validate criteria
            if (!request.criteria.fullName && !request.criteria.nationalId && !request.criteria.primaryPhone) {
                return {
                    success: false,
                    message: 'Vui lòng cung cấp ít nhất một trong các tiêu chí: fullName, nationalId, primaryPhone',
                    errors: ['INSUFFICIENT_CRITERIA']
                };
            }
            // 2. Set defaults
            const onlyCertainMatches = request.onlyCertainMatches || false;
            const limit = request.limit || 10;
            // 3. Match patients using repository
            const matches = await this.patientRepository.matchPatients({
                fullName: request.criteria.fullName,
                dateOfBirth: request.criteria.dateOfBirth ? new Date(request.criteria.dateOfBirth) : undefined,
                nationalId: request.criteria.nationalId,
                primaryPhone: request.criteria.primaryPhone,
                email: request.criteria.email
            }, onlyCertainMatches, limit);
            // 4. Map matches to response DTO
            const matchesDTO = matches.map(match => {
                const patient = match.patient;
                const personalInfo = patient.getPersonalInfo();
                const contactInfo = patient.getContactInfo();
                // Determine which fields matched
                const matchedFields = [];
                const criteriaFullName = request.criteria.fullName?.toLowerCase();
                const patientFullName = personalInfo.fullName.toLowerCase();
                if (criteriaFullName && patientFullName === criteriaFullName) {
                    matchedFields.push('fullName');
                }
                if (request.criteria.dateOfBirth && personalInfo.dateOfBirth.toISOString().split('T')[0] === request.criteria.dateOfBirth) {
                    matchedFields.push('dateOfBirth');
                }
                if (request.criteria.nationalId && personalInfo.nationalId === request.criteria.nationalId) {
                    matchedFields.push('nationalId');
                }
                if (request.criteria.primaryPhone && contactInfo.primaryPhone === request.criteria.primaryPhone) {
                    matchedFields.push('primaryPhone');
                }
                if (request.criteria.email && contactInfo.email === request.criteria.email) {
                    matchedFields.push('email');
                }
                return {
                    patient: {
                        patientId: patient.getPatientId() || '',
                        userId: patient.getUserId(),
                        fullName: personalInfo.fullName,
                        dateOfBirth: personalInfo.dateOfBirth.toISOString(),
                        gender: personalInfo.gender,
                        nationalId: personalInfo.nationalId,
                        primaryPhone: contactInfo.primaryPhone,
                        email: contactInfo.email,
                        city: contactInfo.address.city,
                        status: patient.getStatus()
                    },
                    matchGrade: match.matchGrade,
                    score: match.score,
                    matchedFields
                };
            });
            // 5. Return response
            return {
                success: true,
                message: `Tìm thấy ${matchesDTO.length} bệnh nhân trùng khớp`,
                data: {
                    matches: matchesDTO,
                    totalMatches: matchesDTO.length
                }
            };
        }
        catch (error) {
            // Handle validation errors
            if (error instanceof Error) {
                return {
                    success: false,
                    message: 'Tìm kiếm bệnh nhân trùng khớp thất bại',
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
exports.MatchPatientsUseCase = MatchPatientsUseCase;
//# sourceMappingURL=MatchPatientsUseCase.js.map