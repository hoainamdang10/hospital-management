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
const crypto_1 = require("crypto");
const ErrorHandlingMiddleware_1 = require("../middleware/ErrorHandlingMiddleware");
function getUserContext(req) {
    return req.user;
}
/**
 * Helper to get user ID from request
 */
function getUserId(req) {
    return getUserContext(req)?.userId || 'system';
}
function getUserRoles(req) {
    const user = getUserContext(req);
    if (!user) {
        return [];
    }
    const roles = [...(user.roles ?? [])];
    if (user.role && !roles.includes(user.role)) {
        roles.push(user.role);
    }
    return roles;
}
function getUserRole(req) {
    const [primaryRole] = getUserRoles(req);
    return primaryRole ? primaryRole.toLowerCase() : 'system';
}
function userHasAnyRole(req, allowedRoles) {
    const roles = getUserRoles(req);
    return roles.some(role => allowedRoles.includes(role));
}
/**
 * Patient Controller
 */
class PatientController {
    constructor(logger, registerPatientUseCase, updatePatientInfoUseCase, matchPatientsUseCase, mergePatientsUseCase, linkPatientsUseCase, deactivatePatientUseCase, validateInsuranceUseCase, addEmergencyContactUseCase, getEmergencyContactsUseCase, updateEmergencyContactUseCase, removeEmergencyContactUseCase, setPrimaryEmergencyContactUseCase, grantConsentUseCase, getConsentsUseCase, getConsentDetailsUseCase, revokeConsentUseCase, getActiveConsentsUseCase, getInsuranceInfoUseCase, updateInsuranceInfoUseCase, verifyInsuranceUseCase, markAsDeceasedUseCase, reactivatePatientUseCase, getPatientStatisticsUseCase, uploadPatientPhotoUseCase, getPatientPhotoUseCase, deletePatientPhotoUseCase, updateCommunicationPreferencesUseCase, getCommunicationPreferencesUseCase, getPatientHistoryUseCase, patientQueryHandlers) {
        this.logger = logger;
        this.registerPatientUseCase = registerPatientUseCase;
        this.updatePatientInfoUseCase = updatePatientInfoUseCase;
        this.matchPatientsUseCase = matchPatientsUseCase;
        this.mergePatientsUseCase = mergePatientsUseCase;
        this.linkPatientsUseCase = linkPatientsUseCase;
        this.deactivatePatientUseCase = deactivatePatientUseCase;
        this.validateInsuranceUseCase = validateInsuranceUseCase;
        this.addEmergencyContactUseCase = addEmergencyContactUseCase;
        this.getEmergencyContactsUseCase = getEmergencyContactsUseCase;
        this.updateEmergencyContactUseCase = updateEmergencyContactUseCase;
        this.removeEmergencyContactUseCase = removeEmergencyContactUseCase;
        this.setPrimaryEmergencyContactUseCase = setPrimaryEmergencyContactUseCase;
        this.grantConsentUseCase = grantConsentUseCase;
        this.getConsentsUseCase = getConsentsUseCase;
        this.getConsentDetailsUseCase = getConsentDetailsUseCase;
        this.revokeConsentUseCase = revokeConsentUseCase;
        this.getActiveConsentsUseCase = getActiveConsentsUseCase;
        this.getInsuranceInfoUseCase = getInsuranceInfoUseCase;
        this.updateInsuranceInfoUseCase = updateInsuranceInfoUseCase;
        this.verifyInsuranceUseCase = verifyInsuranceUseCase;
        this.markAsDeceasedUseCase = markAsDeceasedUseCase;
        this.reactivatePatientUseCase = reactivatePatientUseCase;
        this.getPatientStatisticsUseCase = getPatientStatisticsUseCase;
        this.uploadPatientPhotoUseCase = uploadPatientPhotoUseCase;
        this.getPatientPhotoUseCase = getPatientPhotoUseCase;
        this.deletePatientPhotoUseCase = deletePatientPhotoUseCase;
        this.updateCommunicationPreferencesUseCase = updateCommunicationPreferencesUseCase;
        this.getCommunicationPreferencesUseCase = getCommunicationPreferencesUseCase;
        this.getPatientHistoryUseCase = getPatientHistoryUseCase;
        this.patientQueryHandlers = patientQueryHandlers;
    }
    /**
     * Register new patient
     * POST /api/v1/patients
     */
    async registerPatient(req, res) {
        try {
            const request = req.body;
            // Do NOT log PHI/PII - only log operation type
            this.logger.info('Registering new patient', {
                userId: request.userId
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
            const requestedBy = getUserId(req);
            // Redact patient ID for HIPAA compliance
            this.logger.info('Getting patient by ID', {
                patientId: patientId.replace(/PAT-\d{6}-\d{3}/g, 'PAT-***-***')
            });
            const query = {
                queryId: (0, crypto_1.randomUUID)(),
                queryType: 'GetPatientProfile',
                timestamp: new Date(),
                requestedBy,
                data: {
                    patientId,
                    requestedBy
                }
            };
            const result = await this.patientQueryHandlers.handleGetPatientProfile(query);
            if (!result.success || !result.data) {
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
            const requestedBy = getUserId(req);
            // Do NOT log userId - it's PII
            this.logger.info('Getting patient by user ID');
            const query = {
                queryId: (0, crypto_1.randomUUID)(),
                queryType: 'GetPatientProfile',
                timestamp: new Date(),
                requestedBy,
                data: {
                    userId,
                    requestedBy
                }
            };
            const result = await this.patientQueryHandlers.handleGetPatientProfile(query);
            if (!result.success || !result.data) {
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
            const requestedBy = getUserId(req);
            // Do NOT log nationalId - it's PHI/PII
            this.logger.info('Getting patient by national ID');
            const query = {
                queryId: (0, crypto_1.randomUUID)(),
                queryType: 'GetPatientProfile',
                timestamp: new Date(),
                requestedBy,
                data: {
                    nationalId,
                    requestedBy
                }
            };
            const result = await this.patientQueryHandlers.handleGetPatientProfile(query);
            if (!result.success || !result.data) {
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
            const requestedBy = getUserId(req);
            // Do NOT log bhytNumber - it's PHI/PII
            this.logger.info('Getting patient by BHYT number');
            const query = {
                queryId: (0, crypto_1.randomUUID)(),
                queryType: 'GetPatientProfile',
                timestamp: new Date(),
                requestedBy,
                data: {
                    bhytNumber,
                    requestedBy
                }
            };
            const result = await this.patientQueryHandlers.handleGetPatientProfile(query);
            if (!result.success || !result.data) {
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
            // Redact patient ID for HIPAA compliance
            this.logger.info('Updating patient', {
                patientId: patientId.replace(/PAT-\d{6}-\d{3}/g, 'PAT-***-***')
            });
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
     * Get patient list with pagination
     * GET /api/v1/patients
     */
    async getPatientList(req, res) {
        try {
            const { page = '1', limit = '20', isActive, hasInsurance, city, province, sortField = 'created_at', sortDirection = 'desc' } = req.query;
            const requestedBy = getUserId(req);
            const requestedByRole = getUserRole(req);
            this.logger.info('Getting patient list', { page, limit });
            const parsedPage = Number(page);
            const parsedLimit = Number(limit);
            const parsedIsActive = typeof isActive === 'string'
                ? isActive === 'true'
                    ? true
                    : isActive === 'false'
                        ? false
                        : undefined
                : undefined;
            const parsedHasInsurance = typeof hasInsurance === 'string'
                ? hasInsurance === 'true'
                    ? true
                    : hasInsurance === 'false'
                        ? false
                        : undefined
                : undefined;
            const query = {
                queryId: (0, crypto_1.randomUUID)(),
                queryType: 'GetPatientList',
                timestamp: new Date(),
                requestedBy,
                data: {
                    filters: {
                        isActive: parsedIsActive,
                        hasInsurance: parsedHasInsurance,
                        city: city,
                        province: province
                    },
                    pagination: {
                        page: Number.isNaN(parsedPage) ? 1 : parsedPage,
                        limit: Number.isNaN(parsedLimit) ? 20 : parsedLimit
                    },
                    sorting: {
                        field: sortField,
                        direction: sortDirection
                    },
                    requestedBy,
                    requestedByRole
                }
            };
            const result = await this.patientQueryHandlers.handleGetPatientList(query);
            if (!result.success) {
                throw new ErrorHandlingMiddleware_1.DomainError(result.message);
            }
            ErrorHandlingMiddleware_1.ResponseHelper.paginated(res, result.data.patients, result.data.pagination.page, result.data.pagination.limit, result.data.pagination.total);
        }
        catch (error) {
            this.logger.error('Error getting patient list', {
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
            const { searchTerm, isActive, hasInsurance, page = '1', limit = '20' } = req.query;
            const requestedBy = getUserId(req);
            const requestedByRole = getUserRole(req);
            this.logger.info('Searching patients', { searchTerm, page, limit });
            const parsedPage = Number(page);
            const parsedLimit = Number(limit);
            const parsedIsActive = typeof isActive === 'string'
                ? isActive === 'true'
                    ? true
                    : isActive === 'false'
                        ? false
                        : undefined
                : undefined;
            const parsedHasInsurance = typeof hasInsurance === 'string'
                ? hasInsurance === 'true'
                    ? true
                    : hasInsurance === 'false'
                        ? false
                        : undefined
                : undefined;
            const query = {
                queryId: (0, crypto_1.randomUUID)(),
                queryType: 'SearchPatients',
                timestamp: new Date(),
                requestedBy,
                data: {
                    searchTerm: searchTerm || '',
                    filters: {
                        isActive: parsedIsActive,
                        hasInsurance: parsedHasInsurance
                    },
                    pagination: {
                        page: Number.isNaN(parsedPage) ? 1 : parsedPage,
                        limit: Number.isNaN(parsedLimit) ? 20 : parsedLimit
                    },
                    requestedBy,
                    requestedByRole
                }
            };
            const result = await this.patientQueryHandlers.handleSearchPatients(query);
            if (!result.success) {
                throw new ErrorHandlingMiddleware_1.DomainError(result.message);
            }
            ErrorHandlingMiddleware_1.ResponseHelper.paginated(res, result.data.patients, result.data.pagination.page, result.data.pagination.limit, result.data.pagination.total);
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
            // Do NOT log PHI/PII (fullName, nationalId)
            this.logger.info('Matching patients');
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
            // Redact patient IDs for HIPAA compliance
            this.logger.info('Merging patients', {
                duplicatePatientId: duplicatePatientId.replace(/PAT-\d{6}-\d{3}/g, 'PAT-***-***'),
                masterPatientId: masterPatientId.replace(/PAT-\d{6}-\d{3}/g, 'PAT-***-***')
            });
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
            // Redact patient IDs for HIPAA compliance
            this.logger.info('Linking patients', {
                patientId: patientId.replace(/PAT-\d{6}-\d{3}/g, 'PAT-***-***'),
                otherPatientId: otherPatientId.replace(/PAT-\d{6}-\d{3}/g, 'PAT-***-***'),
                linkType
            });
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
            // Redact patient ID for HIPAA compliance
            this.logger.info('Deactivating patient', {
                patientId: patientId.replace(/PAT-\d{6}-\d{3}/g, 'PAT-***-***')
            });
            if (!userHasAnyRole(req, ['ADMIN', 'SUPER_ADMIN', 'RECEPTIONIST'])) {
                this.logger.warn('Unauthorized patient deactivation attempt', {
                    patientId,
                    requestedBy: getUserId(req),
                    roles: getUserRoles(req)
                });
                res.status(403).json({
                    success: false,
                    error: 'FORBIDDEN',
                    message: 'Bạn không có quyền vô hiệu hóa bệnh nhân'
                });
                return;
            }
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
     * POST /api/v1/patients/:patientId/emergency-contacts
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
     * Get emergency contacts
     * GET /api/v1/patients/:patientId/emergency-contacts
     */
    async getEmergencyContacts(req, res) {
        const { patientId } = req.params;
        const requestedBy = getUserId(req);
        this.logger.info('Getting emergency contacts', { patientId });
        const result = await this.getEmergencyContactsUseCase.execute({
            patientId,
            requestedBy
        });
        if (!result.success) {
            res.status(400).json({
                success: false,
                message: result.message,
                errors: result.errors
            });
            return;
        }
        ErrorHandlingMiddleware_1.ResponseHelper.success(res, result.data, result.message);
    }
    /**
     * Update emergency contact
     * PUT /api/v1/patients/:patientId/emergency-contacts/:contactId
     */
    async updateEmergencyContact(req, res) {
        const { patientId, contactId } = req.params;
        const request = req.body;
        const performedBy = getUserId(req);
        this.logger.info('Updating emergency contact', { patientId, contactId });
        const result = await this.updateEmergencyContactUseCase.execute({
            patientId,
            contactId,
            ...request,
            performedBy
        });
        if (!result.success) {
            res.status(400).json({
                success: false,
                message: result.message,
                errors: result.errors
            });
            return;
        }
        ErrorHandlingMiddleware_1.ResponseHelper.success(res, { contactId: result.contactId }, result.message);
    }
    /**
     * Remove emergency contact
     * DELETE /api/v1/patients/:patientId/emergency-contacts/:contactId
     */
    async removeEmergencyContact(req, res) {
        const { patientId, contactId } = req.params;
        const performedBy = getUserId(req);
        this.logger.info('Removing emergency contact', { patientId, contactId });
        const result = await this.removeEmergencyContactUseCase.execute({
            patientId,
            contactId,
            performedBy
        });
        if (!result.success) {
            res.status(400).json({
                success: false,
                message: result.message,
                errors: result.errors
            });
            return;
        }
        ErrorHandlingMiddleware_1.ResponseHelper.success(res, null, result.message);
    }
    /**
     * Set primary emergency contact
     * PUT /api/v1/patients/:patientId/emergency-contacts/:contactId/set-primary
     */
    async setPrimaryEmergencyContact(req, res) {
        const { patientId, contactId } = req.params;
        const performedBy = getUserId(req);
        this.logger.info('Setting primary emergency contact', { patientId, contactId });
        const result = await this.setPrimaryEmergencyContactUseCase.execute({
            patientId,
            contactId,
            performedBy
        });
        if (!result.success) {
            res.status(400).json({
                success: false,
                message: result.message,
                errors: result.errors
            });
            return;
        }
        ErrorHandlingMiddleware_1.ResponseHelper.success(res, null, result.message);
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
    /**
     * Get all consents for a patient
     * GET /api/v1/patients/:patientId/consents
     */
    async getConsents(req, res) {
        const { patientId } = req.params;
        const requestedBy = getUserId(req);
        const result = await this.getConsentsUseCase.execute({
            patientId,
            requestedBy
        });
        if (!result.success) {
            res.status(400).json({
                success: false,
                message: result.message,
                errors: result.errors
            });
            return;
        }
        ErrorHandlingMiddleware_1.ResponseHelper.success(res, result.data, result.message);
    }
    /**
     * Get consent details
     * GET /api/v1/patients/:patientId/consents/:consentId
     */
    async getConsentDetails(req, res) {
        const { patientId, consentId } = req.params;
        const requestedBy = getUserId(req);
        const result = await this.getConsentDetailsUseCase.execute({
            patientId,
            consentId,
            requestedBy
        });
        if (!result.success) {
            res.status(400).json({
                success: false,
                message: result.message,
                errors: result.errors
            });
            return;
        }
        ErrorHandlingMiddleware_1.ResponseHelper.success(res, result.data, result.message);
    }
    /**
     * Revoke consent
     * POST /api/v1/patients/:patientId/consents/:consentId/revoke
     */
    async revokeConsent(req, res) {
        const { patientId, consentId } = req.params;
        const performedBy = getUserId(req);
        const result = await this.revokeConsentUseCase.execute({
            patientId,
            consentId,
            performedBy
        });
        if (!result.success) {
            res.status(400).json({
                success: false,
                message: result.message,
                errors: result.errors
            });
            return;
        }
        ErrorHandlingMiddleware_1.ResponseHelper.success(res, { success: true }, result.message);
    }
    /**
     * Get active consents only
     * GET /api/v1/patients/:patientId/consents/active
     */
    async getActiveConsents(req, res) {
        const { patientId } = req.params;
        const requestedBy = getUserId(req);
        const result = await this.getActiveConsentsUseCase.execute({
            patientId,
            requestedBy
        });
        if (!result.success) {
            res.status(400).json({
                success: false,
                message: result.message,
                errors: result.errors
            });
            return;
        }
        ErrorHandlingMiddleware_1.ResponseHelper.success(res, result.data, result.message);
    }
    /**
     * Get insurance info
     * GET /api/v1/patients/:patientId/insurance
     */
    async getInsuranceInfo(req, res) {
        const { patientId } = req.params;
        const requestedBy = getUserId(req);
        const result = await this.getInsuranceInfoUseCase.execute({
            patientId,
            requestedBy
        });
        if (!result.success) {
            res.status(400).json({
                success: false,
                message: result.message,
                errors: result.errors
            });
            return;
        }
        ErrorHandlingMiddleware_1.ResponseHelper.success(res, result.data, result.message);
    }
    /**
     * Update insurance info
     * PUT /api/v1/patients/:patientId/insurance
     */
    async updateInsuranceInfo(req, res) {
        const { patientId } = req.params;
        const performedBy = getUserId(req);
        const result = await this.updateInsuranceInfoUseCase.execute({
            patientId,
            ...req.body,
            performedBy
        });
        if (!result.success) {
            res.status(400).json({
                success: false,
                message: result.message,
                errors: result.errors
            });
            return;
        }
        ErrorHandlingMiddleware_1.ResponseHelper.success(res, { success: true }, result.message);
    }
    /**
     * Verify insurance
     * POST /api/v1/patients/:patientId/insurance/verify
     */
    async verifyInsurance(req, res) {
        const { patientId } = req.params;
        const requestedBy = getUserId(req);
        const result = await this.verifyInsuranceUseCase.execute({
            patientId,
            requestedBy
        });
        if (!result.success) {
            res.status(400).json({
                success: false,
                message: result.message,
                errors: result.errors
            });
            return;
        }
        ErrorHandlingMiddleware_1.ResponseHelper.success(res, result.data, result.message);
    }
    /**
     * Get patient statistics
     * GET /api/v1/patients/statistics
     */
    async getStatistics(req, res) {
        try {
            this.logger.info('Getting patient statistics');
            const statistics = await this.getPatientStatisticsUseCase.execute();
            ErrorHandlingMiddleware_1.ResponseHelper.success(res, statistics, 'Thống kê bệnh nhân thành công');
        }
        catch (error) {
            this.logger.error('Failed to get patient statistics', {
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            res.status(500).json({
                success: false,
                message: 'Lỗi khi lấy thống kê bệnh nhân',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }
    /**
     * Upload patient photo
     * POST /api/v1/patients/:patientId/photo
     */
    async uploadPhoto(req, res) {
        try {
            const { patientId } = req.params;
            const userId = getUserId(req);
            if (!req.file) {
                res.status(400).json({
                    success: false,
                    message: 'Không có file ảnh được tải lên'
                });
                return;
            }
            this.logger.info('Uploading patient photo', { patientId, userId });
            const result = await this.uploadPatientPhotoUseCase.execute({
                patientId,
                fileBuffer: req.file.buffer,
                fileName: req.file.originalname,
                contentType: req.file.mimetype,
                uploadedBy: userId
            });
            ErrorHandlingMiddleware_1.ResponseHelper.success(res, result, result.message);
        }
        catch (error) {
            this.logger.error('Failed to upload patient photo', {
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            res.status(500).json({
                success: false,
                message: error instanceof Error ? error.message : 'Lỗi khi tải ảnh lên'
            });
        }
    }
    /**
     * Get patient photo
     * GET /api/v1/patients/:patientId/photo
     */
    async getPhoto(req, res) {
        try {
            const { patientId } = req.params;
            this.logger.info('Getting patient photo', { patientId });
            const result = await this.getPatientPhotoUseCase.execute({ patientId });
            ErrorHandlingMiddleware_1.ResponseHelper.success(res, result, 'Lấy ảnh bệnh nhân thành công');
        }
        catch (error) {
            this.logger.error('Failed to get patient photo', {
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            res.status(500).json({
                success: false,
                message: error instanceof Error ? error.message : 'Lỗi khi lấy ảnh bệnh nhân'
            });
        }
    }
    /**
     * Delete patient photo
     * DELETE /api/v1/patients/:patientId/photo
     */
    async deletePhoto(req, res) {
        try {
            const { patientId } = req.params;
            const userId = getUserId(req);
            this.logger.info('Deleting patient photo', { patientId, userId });
            const result = await this.deletePatientPhotoUseCase.execute({
                patientId,
                deletedBy: userId
            });
            ErrorHandlingMiddleware_1.ResponseHelper.success(res, result, result.message);
        }
        catch (error) {
            this.logger.error('Failed to delete patient photo', {
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            res.status(500).json({
                success: false,
                message: error instanceof Error ? error.message : 'Lỗi khi xóa ảnh bệnh nhân'
            });
        }
    }
    /**
     * Update communication preferences
     * PUT /api/v1/patients/:patientId/communication
     */
    async updateCommunicationPreferences(req, res) {
        try {
            const { patientId } = req.params;
            const { language, preferred, contactMethod, timezone } = req.body;
            const userId = getUserId(req);
            this.logger.info('Updating communication preferences', { patientId, userId });
            const result = await this.updateCommunicationPreferencesUseCase.execute({
                patientId,
                language,
                preferred,
                contactMethod,
                timezone,
                updatedBy: userId
            });
            ErrorHandlingMiddleware_1.ResponseHelper.success(res, result, result.message);
        }
        catch (error) {
            this.logger.error('Failed to update communication preferences', {
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            res.status(500).json({
                success: false,
                message: error instanceof Error ? error.message : 'Lỗi khi cập nhật tùy chọn liên hệ'
            });
        }
    }
    /**
     * Get communication preferences
     * GET /api/v1/patients/:patientId/communication
     */
    async getCommunicationPreferences(req, res) {
        try {
            const { patientId } = req.params;
            this.logger.info('Getting communication preferences', { patientId });
            const result = await this.getCommunicationPreferencesUseCase.execute({ patientId });
            ErrorHandlingMiddleware_1.ResponseHelper.success(res, result, 'Lấy tùy chọn liên hệ thành công');
        }
        catch (error) {
            this.logger.error('Failed to get communication preferences', {
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            res.status(500).json({
                success: false,
                message: error instanceof Error ? error.message : 'Lỗi khi lấy tùy chọn liên hệ'
            });
        }
    }
    /**
     * Get patient history (audit logs and access logs)
     * GET /api/v1/patients/:patientId/history
     */
    async getPatientHistory(req, res) {
        try {
            const { patientId } = req.params;
            const { limit, offset, dateFrom, dateTo, eventTypes } = req.query;
            const requestedBy = getUserId(req);
            this.logger.info('Getting patient history', {
                patientId,
                limit,
                offset,
                requestedBy
            });
            const result = await this.getPatientHistoryUseCase.execute({
                patientId,
                limit: limit ? parseInt(limit) : undefined,
                offset: offset ? parseInt(offset) : undefined,
                dateFrom: dateFrom,
                dateTo: dateTo,
                eventTypes: eventTypes ? (Array.isArray(eventTypes) ? eventTypes : [eventTypes]) : undefined,
                requestedBy
            });
            if (!result.success) {
                throw new ErrorHandlingMiddleware_1.NotFoundError('Lịch sử bệnh nhân', patientId);
            }
            ErrorHandlingMiddleware_1.ResponseHelper.success(res, result.data, result.message);
        }
        catch (error) {
            this.logger.error('Failed to get patient history', {
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            throw error;
        }
    }
}
exports.PatientController = PatientController;
//# sourceMappingURL=PatientController.js.map