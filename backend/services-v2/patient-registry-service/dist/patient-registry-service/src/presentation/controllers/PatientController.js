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
 * Helper to get user ID from request
 */
function getUserId(req) {
    return req.user?.userId || 'system';
}
/**
 * Patient Controller
 */
class PatientController {
    constructor(logger, registerPatientUseCase, updatePatientInfoUseCase, getPatientProfileUseCase, searchPatientsUseCase, matchPatientsUseCase, mergePatientsUseCase, linkPatientsUseCase, deactivatePatientUseCase, validateInsuranceUseCase, addEmergencyContactUseCase, grantConsentUseCase, markAsDeceasedUseCase, reactivatePatientUseCase) {
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
        this.addEmergencyContactUseCase = addEmergencyContactUseCase;
        this.grantConsentUseCase = grantConsentUseCase;
        this.markAsDeceasedUseCase = markAsDeceasedUseCase;
        this.reactivatePatientUseCase = reactivatePatientUseCase;
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
                    dateOfBirth: request.dateOfBirth,
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
                    address: {
                        ...request.address,
                        country: request.address.country || 'Vietnam'
                    },
                    preferredContactMethod: request.preferredContactMethod
                },
                basicMedicalInfo: {
                    bloodType: request.bloodType,
                    knownAllergies: request.knownAllergies || [],
                    emergencyMedicalInfo: request.emergencyMedicalInfo
                },
                insuranceInfo: request.insurance ? {
                    provider: request.insurance.provider,
                    policyNumber: request.insurance.policyNumber,
                    groupNumber: request.insurance.groupNumber,
                    validFrom: request.insurance.validFrom,
                    validTo: request.insurance.validTo,
                    coverageType: request.insurance.coverageType,
                    isVietnameseInsurance: request.insurance.coverageType === 'BHYT' || request.insurance.coverageType === 'BHTN',
                    bhytNumber: request.insurance.bhytNumber,
                    isPrimary: true
                } : undefined,
                emergencyContacts: (request.emergencyContacts || []).map(contact => ({
                    ...contact,
                    isPrimary: contact.isPrimary ?? false
                })),
                requestedBy: getUserId(req)
            });
            if (!result.success) {
                throw new ErrorHandlingMiddleware_1.DomainError(result.errors?.[0] || 'Failed to register patient');
            }
            ErrorHandlingMiddleware_1.ResponseHelper.created(res, { patientId: result.patientId }, 'Đăng ký bệnh nhân thành công');
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
                requestedBy: getUserId(req)
            });
            if (!result.success) {
                throw new ErrorHandlingMiddleware_1.NotFoundError('Bệnh nhân', patientId);
            }
            ErrorHandlingMiddleware_1.ResponseHelper.success(res, result.data);
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
                requestedBy: getUserId(req)
            });
            if (!result.success) {
                throw new ErrorHandlingMiddleware_1.NotFoundError('Bệnh nhân với User ID', userId);
            }
            ErrorHandlingMiddleware_1.ResponseHelper.success(res, result.data);
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
                requestedBy: getUserId(req)
            });
            if (!result.success) {
                throw new ErrorHandlingMiddleware_1.NotFoundError('Bệnh nhân với CMND/CCCD', nationalId);
            }
            ErrorHandlingMiddleware_1.ResponseHelper.success(res, result.data);
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
                patientId: bhytNumber,
                requestedBy: getUserId(req)
            });
            if (!result.success) {
                throw new ErrorHandlingMiddleware_1.NotFoundError('Bệnh nhân với số BHYT', bhytNumber);
            }
            ErrorHandlingMiddleware_1.ResponseHelper.success(res, result.data);
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
                ...updateRequest,
                updatedBy: getUserId(req)
            });
            if (!result.success) {
                throw new ErrorHandlingMiddleware_1.DomainError(result.errors?.[0] || 'Failed to update patient');
            }
            ErrorHandlingMiddleware_1.ResponseHelper.success(res, { success: true }, 'Cập nhật thông tin bệnh nhân thành công');
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
                },
                requestedBy: getUserId(req)
            });
            if (!result.success) {
                throw new ErrorHandlingMiddleware_1.DomainError(result.errors?.[0] || 'Failed to search patients');
            }
            ErrorHandlingMiddleware_1.ResponseHelper.paginated(res, result.data.patients, parseInt(page), parseInt(limit), result.data.pagination.total);
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
                    dateOfBirth,
                    nationalId,
                    primaryPhone,
                    email
                },
                onlyCertainMatches: onlyCertainMatches || false,
                limit: limit || 10,
                requestedBy: getUserId(req)
            });
            if (!result.success) {
                throw new ErrorHandlingMiddleware_1.DomainError(result.errors?.[0] || 'Failed to match patients');
            }
            const matches = result.data?.matches ?? [];
            ErrorHandlingMiddleware_1.ResponseHelper.success(res, matches, `Tìm thấy ${matches.length} kết quả khớp`);
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
                performedBy: getUserId(req)
            });
            if (!result.success) {
                throw new ErrorHandlingMiddleware_1.DomainError(result.errors?.[0] || 'Failed to merge patients');
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
                performedBy: getUserId(req)
            });
            if (!result.success) {
                throw new ErrorHandlingMiddleware_1.DomainError(result.errors?.[0] || 'Failed to link patients');
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
                performedBy: getUserId(req)
            });
            if (!result.success) {
                throw new ErrorHandlingMiddleware_1.DomainError(result.errors?.[0] || 'Failed to deactivate patient');
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
            const { patientId } = req.body;
            this.logger.info('Validating insurance', { patientId });
            const result = await this.validateInsuranceUseCase.execute({
                patientId,
                requestedBy: getUserId(req)
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
    /**
     * Add emergency contact
     */
    async addEmergencyContact(req, res) {
        const { patientId } = req.params;
        const request = req.body;
        const performedBy = getUserId(req);
        this.logger.info('Adding emergency contact', { patientId });
        const result = await this.addEmergencyContactUseCase.execute({
            patientId,
            ...request,
            performedBy
        });
        ErrorHandlingMiddleware_1.ResponseHelper.success(res, result, result.message);
    }
    /**
     * Grant consent
     */
    async grantConsent(req, res) {
        const { patientId } = req.params;
        const request = req.body;
        const userId = getUserId(req);
        this.logger.info('Granting consent for patient', { patientId, consentType: request.consentType });
        const result = await this.grantConsentUseCase.execute({
            patientId,
            consentType: request.consentType,
            grantedBy: userId,
            expiresAt: request.expiresAt ? new Date(request.expiresAt) : undefined,
            performedBy: userId
        });
        ErrorHandlingMiddleware_1.ResponseHelper.success(res, result, result.message);
    }
    /**
     * Mark patient as deceased
     */
    async markAsDeceased(req, res) {
        const { patientId } = req.params;
        const performedBy = getUserId(req);
        this.logger.info('Marking patient as deceased', { patientId });
        const result = await this.markAsDeceasedUseCase.execute({
            patientId,
            performedBy
        });
        ErrorHandlingMiddleware_1.ResponseHelper.success(res, result, result.message);
    }
    /**
     * Reactivate patient
     */
    async reactivatePatient(req, res) {
        const { patientId } = req.params;
        const request = req.body;
        const performedBy = getUserId(req);
        this.logger.info('Reactivating patient', { patientId });
        const result = await this.reactivatePatientUseCase.execute({
            patientId,
            reason: request.reason,
            performedBy
        });
        ErrorHandlingMiddleware_1.ResponseHelper.success(res, result, result.message);
    }
}
exports.PatientController = PatientController;
//# sourceMappingURL=PatientController.js.map