"use strict";
/**
 * PatientController - Presentation Layer
 * Handles HTTP requests for Patient Registry operations
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, RESTful API, HIPAA
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.PatientController = void 0;
const ErrorHandlingMiddleware_1 = require("../middleware/ErrorHandlingMiddleware");
/**
 * Patient Controller
 */
class PatientController {
    constructor(logger, registerPatientUseCase, updatePatientInfoUseCase, getPatientProfileUseCase, searchPatientsUseCase, matchPatientsUseCase, mergePatientsUseCase, linkPatientsUseCase, deactivatePatientUseCase, validateInsuranceUseCase) {
        this.logger = logger;
        this.registerPatientUseCase = registerPatientUseCase;
        this.updatePatientInfoUseCase = updatePatientInfoUseCase;
        this.getPatientProfileUseCase = getPatientProfileUseCase;
        this.searchPatientsUseCase = searchPatientsUseCase;
        this.matchPatientsUseCase = matchPatientsUseCase;
        this.mergePatientsUseCase = mergePatientsUseCase;
        this.linkPatientsUseCase = linkPatientsUseCase;
        this.deactivatePatientUseCase = deactivatePatientUseCase;
        this.validateInsuranceUseCase = validateInsuranceUseCase;
    }
    /**
     * Register new patient
     * POST /api/v1/patients
     */
    async registerPatient(req, res) {
        try {
            const request = req.body;
            this.logger.info('Registering new patient', {
                userId: request.userId,
                fullName: request.fullName
            });
            const result = await this.registerPatientUseCase.execute({
                userId: request.userId,
                personalInfo: {
                    fullName: request.fullName,
                    dateOfBirth: new Date(request.dateOfBirth),
                    gender: request.gender,
                    nationalId: request.nationalId,
                    nationality: request.nationality,
                    ethnicity: request.ethnicity,
                    occupation: request.occupation,
                    maritalStatus: request.maritalStatus
                },
                contactInfo: {
                    primaryPhone: request.primaryPhone,
                    secondaryPhone: request.secondaryPhone,
                    email: request.email,
                    address: request.address,
                    preferredContactMethod: request.preferredContactMethod
                },
                basicMedicalInfo: {
                    bloodType: request.bloodType,
                    knownAllergies: request.knownAllergies || [],
                    emergencyMedicalInfo: request.emergencyMedicalInfo
                },
                insurance: request.insurance ? {
                    provider: request.insurance.provider,
                    policyNumber: request.insurance.policyNumber,
                    groupNumber: request.insurance.groupNumber,
                    validFrom: new Date(request.insurance.validFrom),
                    validTo: new Date(request.insurance.validTo),
                    coverageType: request.insurance.coverageType,
                    bhytNumber: request.insurance.bhytNumber
                } : undefined,
                emergencyContacts: request.emergencyContacts || []
            });
            if (!result.success) {
                throw new ErrorHandlingMiddleware_1.DomainError(result.error || 'Failed to register patient');
            }
            const patientResponse = this.mapPatientToResponse(result.patient);
            ErrorHandlingMiddleware_1.ResponseHelper.created(res, patientResponse, 'Đăng ký bệnh nhân thành công');
        }
        catch (error) {
            this.logger.error('Error registering patient', {
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            throw error;
        }
    }
    /**
     * Get patient by ID
     * GET /api/v1/patients/:patientId
     */
    async getPatientById(req, res) {
        try {
            const { patientId } = req.params;
            this.logger.info('Getting patient by ID', { patientId });
            const result = await this.getPatientProfileUseCase.execute({
                patientId,
                requesterId: req.user?.userId
            });
            if (!result.success) {
                throw new ErrorHandlingMiddleware_1.NotFoundError('Bệnh nhân', patientId);
            }
            const patientResponse = this.mapPatientToResponse(result.patient);
            ErrorHandlingMiddleware_1.ResponseHelper.success(res, patientResponse);
        }
        catch (error) {
            this.logger.error('Error getting patient', {
                patientId: req.params.patientId,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            throw error;
        }
    }
    /**
     * Get patient by user ID
     * GET /api/v1/patients/user/:userId
     */
    async getPatientByUserId(req, res) {
        try {
            const { userId } = req.params;
            this.logger.info('Getting patient by user ID', { userId });
            const result = await this.getPatientProfileUseCase.execute({
                userId,
                requesterId: req.user?.userId
            });
            if (!result.success) {
                throw new ErrorHandlingMiddleware_1.NotFoundError('Bệnh nhân với User ID', userId);
            }
            const patientResponse = this.mapPatientToResponse(result.patient);
            ErrorHandlingMiddleware_1.ResponseHelper.success(res, patientResponse);
        }
        catch (error) {
            this.logger.error('Error getting patient by user ID', {
                userId: req.params.userId,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            throw error;
        }
    }
    /**
     * Get patient by national ID
     * GET /api/v1/patients/national-id/:nationalId
     */
    async getPatientByNationalId(req, res) {
        try {
            const { nationalId } = req.params;
            this.logger.info('Getting patient by national ID', { nationalId });
            const result = await this.getPatientProfileUseCase.execute({
                nationalId,
                requesterId: req.user?.userId
            });
            if (!result.success) {
                throw new ErrorHandlingMiddleware_1.NotFoundError('Bệnh nhân với CMND/CCCD', nationalId);
            }
            const patientResponse = this.mapPatientToResponse(result.patient);
            ErrorHandlingMiddleware_1.ResponseHelper.success(res, patientResponse);
        }
        catch (error) {
            this.logger.error('Error getting patient by national ID', {
                nationalId: req.params.nationalId,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            throw error;
        }
    }
    /**
     * Get patient by BHYT number
     * GET /api/v1/patients/bhyt/:bhytNumber
     */
    async getPatientByBHYTNumber(req, res) {
        try {
            const { bhytNumber } = req.params;
            this.logger.info('Getting patient by BHYT number', { bhytNumber });
            const result = await this.getPatientProfileUseCase.execute({
                bhytNumber,
                requesterId: req.user?.userId
            });
            if (!result.success) {
                throw new ErrorHandlingMiddleware_1.NotFoundError('Bệnh nhân với số BHYT', bhytNumber);
            }
            const patientResponse = this.mapPatientToResponse(result.patient);
            ErrorHandlingMiddleware_1.ResponseHelper.success(res, patientResponse);
        }
        catch (error) {
            this.logger.error('Error getting patient by BHYT number', {
                bhytNumber: req.params.bhytNumber,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            throw error;
        }
    }
    /**
     * Update patient information
     * PUT /api/v1/patients/:patientId
     */
    async updatePatient(req, res) {
        try {
            const { patientId } = req.params;
            const updateRequest = req.body;
            this.logger.info('Updating patient', { patientId });
            const result = await this.updatePatientInfoUseCase.execute({
                patientId,
                updates: updateRequest,
                updatedBy: req.user?.userId || 'system'
            });
            if (!result.success) {
                throw new ErrorHandlingMiddleware_1.DomainError(result.error || 'Failed to update patient');
            }
            const patientResponse = this.mapPatientToResponse(result.patient);
            ErrorHandlingMiddleware_1.ResponseHelper.success(res, patientResponse, 'Cập nhật thông tin bệnh nhân thành công');
        }
        catch (error) {
            this.logger.error('Error updating patient', {
                patientId: req.params.patientId,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            throw error;
        }
    }
    /**
     * Search patients
     * GET /api/v1/patients/search?searchTerm=...
     */
    async searchPatients(req, res) {
        try {
            const { searchTerm, isActive, page = 1, limit = 20 } = req.query;
            this.logger.info('Searching patients', { searchTerm, page, limit });
            const result = await this.searchPatientsUseCase.execute({
                searchTerm: searchTerm,
                filters: {
                    isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined
                },
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit)
                }
            });
            if (!result.success) {
                throw new ErrorHandlingMiddleware_1.DomainError(result.error || 'Failed to search patients');
            }
            const patientsResponse = result.patients.map(p => this.mapPatientToResponse(p));
            ErrorHandlingMiddleware_1.ResponseHelper.paginated(res, patientsResponse, parseInt(page), parseInt(limit), result.total);
        }
        catch (error) {
            this.logger.error('Error searching patients', {
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            throw error;
        }
    }
    /**
     * Match patients (PMI)
     * POST /api/v1/patients/match
     */
    async matchPatients(req, res) {
        try {
            const { fullName, dateOfBirth, nationalId, primaryPhone, email, onlyCertainMatches, limit } = req.body;
            this.logger.info('Matching patients', { fullName, nationalId });
            const result = await this.matchPatientsUseCase.execute({
                criteria: {
                    fullName,
                    dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
                    nationalId,
                    primaryPhone,
                    email
                },
                onlyCertainMatches: onlyCertainMatches || false,
                limit: limit || 10
            });
            if (!result.success) {
                throw new ErrorHandlingMiddleware_1.DomainError(result.error || 'Failed to match patients');
            }
            const matchesResponse = result.matches.map(match => ({
                patient: this.mapPatientToResponse(match.patient),
                matchGrade: match.matchGrade,
                score: match.score,
                matchDetails: match.matchDetails
            }));
            ErrorHandlingMiddleware_1.ResponseHelper.success(res, matchesResponse, `Tìm thấy ${matchesResponse.length} kết quả khớp`);
        }
        catch (error) {
            this.logger.error('Error matching patients', {
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            throw error;
        }
    }
    /**
     * Merge patients
     * POST /api/v1/patients/merge
     */
    async mergePatients(req, res) {
        try {
            const { duplicatePatientId, masterPatientId, reason } = req.body;
            this.logger.info('Merging patients', { duplicatePatientId, masterPatientId });
            const result = await this.mergePatientsUseCase.execute({
                duplicatePatientId,
                masterPatientId,
                reason,
                performedBy: req.user?.userId || 'system'
            });
            if (!result.success) {
                throw new ErrorHandlingMiddleware_1.DomainError(result.error || 'Failed to merge patients');
            }
            ErrorHandlingMiddleware_1.ResponseHelper.success(res, {
                masterPatientId,
                duplicatePatientId,
                mergedAt: new Date().toISOString()
            }, 'Gộp bệnh nhân thành công');
        }
        catch (error) {
            this.logger.error('Error merging patients', {
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            throw error;
        }
    }
    /**
     * Link patients
     * POST /api/v1/patients/:patientId/link
     */
    async linkPatients(req, res) {
        try {
            const { patientId } = req.params;
            const { otherPatientId, linkType } = req.body;
            this.logger.info('Linking patients', { patientId, otherPatientId, linkType });
            const result = await this.linkPatientsUseCase.execute({
                patientId,
                otherPatientId,
                linkType,
                performedBy: req.user?.userId || 'system'
            });
            if (!result.success) {
                throw new ErrorHandlingMiddleware_1.DomainError(result.error || 'Failed to link patients');
            }
            ErrorHandlingMiddleware_1.ResponseHelper.success(res, {
                patientId,
                otherPatientId,
                linkType,
                linkedAt: new Date().toISOString()
            }, 'Liên kết bệnh nhân thành công');
        }
        catch (error) {
            this.logger.error('Error linking patients', {
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            throw error;
        }
    }
    /**
     * Deactivate patient
     * POST /api/v1/patients/:patientId/deactivate
     */
    async deactivatePatient(req, res) {
        try {
            const { patientId } = req.params;
            const { reason } = req.body;
            this.logger.info('Deactivating patient', { patientId, reason });
            const result = await this.deactivatePatientUseCase.execute({
                patientId,
                reason,
                performedBy: req.user?.userId || 'system'
            });
            if (!result.success) {
                throw new ErrorHandlingMiddleware_1.DomainError(result.error || 'Failed to deactivate patient');
            }
            ErrorHandlingMiddleware_1.ResponseHelper.success(res, {
                patientId,
                deactivatedAt: new Date().toISOString()
            }, 'Vô hiệu hóa bệnh nhân thành công');
        }
        catch (error) {
            this.logger.error('Error deactivating patient', {
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            throw error;
        }
    }
    /**
     * Validate insurance
     * POST /api/v1/patients/validate-insurance
     */
    async validateInsurance(req, res) {
        try {
            const { insuranceNumber, insuranceType } = req.body;
            this.logger.info('Validating insurance', { insuranceType });
            const result = await this.validateInsuranceUseCase.execute({
                insuranceNumber,
                insuranceType
            });
            ErrorHandlingMiddleware_1.ResponseHelper.success(res, result, 'Kiểm tra bảo hiểm thành công');
        }
        catch (error) {
            this.logger.error('Error validating insurance', {
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            throw error;
        }
    }
    // Helper method to map Patient aggregate to PatientResponse DTO
    mapPatientToResponse(patient) {
        const props = patient.getProps();
        return {
            patientId: props.id.getValue(),
            userId: props.userId,
            personalInfo: {
                fullName: props.personalInfo.fullName,
                dateOfBirth: props.personalInfo.dateOfBirth.toISOString().split('T')[0],
                gender: props.personalInfo.gender,
                nationalId: props.personalInfo.nationalId,
                nationality: props.personalInfo.nationality,
                ethnicity: props.personalInfo.ethnicity,
                occupation: props.personalInfo.occupation,
                maritalStatus: props.personalInfo.maritalStatus
            },
            contactInfo: {
                primaryPhone: props.contactInfo.primaryPhone,
                secondaryPhone: props.contactInfo.secondaryPhone,
                email: props.contactInfo.email,
                address: props.contactInfo.address,
                preferredContactMethod: props.contactInfo.preferredContactMethod
            },
            basicMedicalInfo: {
                bloodType: props.basicMedicalInfo.bloodType,
                knownAllergies: props.basicMedicalInfo.knownAllergies,
                emergencyMedicalInfo: props.basicMedicalInfo.emergencyMedicalInfo
            },
            insuranceInfo: props.insuranceInfo ? {
                id: props.insuranceInfo.id,
                provider: props.insuranceInfo.provider,
                policyNumber: props.insuranceInfo.policyNumber,
                groupNumber: props.insuranceInfo.groupNumber,
                validFrom: props.insuranceInfo.validFrom.toISOString().split('T')[0],
                validTo: props.insuranceInfo.validTo.toISOString().split('T')[0],
                coverageType: props.insuranceInfo.coverageType,
                bhytNumber: props.insuranceInfo.bhytNumber,
                isActive: props.insuranceInfo.isActive,
                isPrimary: props.insuranceInfo.isPrimary
            } : undefined,
            emergencyContacts: props.emergencyContacts.map(contact => ({
                id: contact.id,
                name: contact.name,
                relationship: contact.relationship,
                primaryPhone: contact.primaryPhone,
                secondaryPhone: contact.secondaryPhone,
                email: contact.email,
                address: contact.address,
                isPrimary: contact.isPrimary
            })),
            consents: props.consents.map(consent => ({
                id: consent.id,
                consentType: consent.consentType,
                isGranted: consent.isGranted,
                grantedAt: consent.grantedAt?.toISOString(),
                revokedAt: consent.revokedAt?.toISOString(),
                expiresAt: consent.expiresAt?.toISOString()
            })),
            status: props.status.getValue(),
            mergedInto: props.mergedInto?.getValue(),
            links: props.links.map(link => ({
                otherPatientId: link.otherPatientId.getValue(),
                linkType: link.linkType,
                createdAt: link.createdAt.toISOString(),
                createdBy: link.createdBy
            })),
            createdAt: props.createdAt.toISOString(),
            updatedAt: props.updatedAt.toISOString(),
            createdBy: props.createdBy,
            updatedBy: props.updatedBy
        };
    }
}
exports.PatientController = PatientController;
//# sourceMappingURL=PatientController.js.map