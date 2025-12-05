"use strict";
/**
 * PatientController - Presentation Layer
 * Handles HTTP requests for Patient Registry operations
 *
 * @author Hospital Management Team
 * @version 2.0.0 (MVP Scope - Graduation Project)
 * @compliance Clean Architecture, RESTful API, HIPAA
 * @scope-reduction 2025-01-15: Removed 20 post-MVP use cases for graduation project
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.PatientController = void 0;
const crypto_1 = require("crypto");
const ErrorHandlingMiddleware_1 = require("../middleware/ErrorHandlingMiddleware");
const PatientDataHelper_1 = require("../../shared/helpers/PatientDataHelper");
const PatientConstants_1 = require("../../shared/constants/PatientConstants");
function getUserContext(req) {
    return req.user;
}
/**
 * Helper to get user ID from request
 */
function getUserId(req) {
    return getUserContext(req)?.userId || "system";
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
    return primaryRole ? primaryRole.toLowerCase() : "system";
}
function userHasAnyRole(req, allowedRoles) {
    const normalizedAllowed = allowedRoles.map((role) => role.toUpperCase());
    const roles = getUserRoles(req).map((role) => role.toUpperCase());
    return roles.some((role) => normalizedAllowed.includes(role));
}
/**
 * Patient Controller
 * @version 2.0.0 (MVP Scope - Graduation Project)
 * @scope-reduction 2025-01-15: Constructor reduced from 32 to 12 dependencies
 */
class PatientController {
    constructor(
    // ============================================================================
    // ✅ ESSENTIAL DEPENDENCIES - MVP SCOPE (12 dependencies)
    // ============================================================================
    logger, 
    // Core CRUD (3)
    registerPatientUseCase, updatePatientInfoUseCase, patientQueryHandlers, 
    // Insurance Management (4) - Required for Demo Flow 4
    validateInsuranceUseCase, getInsuranceInfoUseCase, addInsuranceInfoUseCase, updateInsuranceInfoUseCase, verifyInsuranceUseCase, 
    // Emergency Contacts (3) - Required for Demo Flow 1
    addEmergencyContactUseCase, getEmergencyContactsUseCase, updateEmergencyContactUseCase, 
    // Analytics (1) - Dashboard gender/age stats
    getPatientStatisticsUseCase) {
        this.logger = logger;
        this.registerPatientUseCase = registerPatientUseCase;
        this.updatePatientInfoUseCase = updatePatientInfoUseCase;
        this.patientQueryHandlers = patientQueryHandlers;
        this.validateInsuranceUseCase = validateInsuranceUseCase;
        this.getInsuranceInfoUseCase = getInsuranceInfoUseCase;
        this.addInsuranceInfoUseCase = addInsuranceInfoUseCase;
        this.updateInsuranceInfoUseCase = updateInsuranceInfoUseCase;
        this.verifyInsuranceUseCase = verifyInsuranceUseCase;
        this.addEmergencyContactUseCase = addEmergencyContactUseCase;
        this.getEmergencyContactsUseCase = getEmergencyContactsUseCase;
        this.updateEmergencyContactUseCase = updateEmergencyContactUseCase;
        this.getPatientStatisticsUseCase = getPatientStatisticsUseCase;
    }
    /**
     * Register new patient
     * POST /api/v1/patients
     */
    async registerPatient(req, res) {
        try {
            const request = req.body;
            // Do NOT log PHI/PII - only log operation type
            this.logger.info("Registering new patient", {
                userId: request.userId,
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
                    maritalStatus: request.maritalStatus,
                },
                contactInfo: {
                    primaryPhone: request.primaryPhone,
                    secondaryPhone: request.secondaryPhone,
                    email: request.email,
                    address: request.address
                        ? {
                            ...request.address,
                            country: request.address.country || "Vietnam",
                        }
                        : undefined,
                    preferredContactMethod: request.preferredContactMethod,
                },
                basicMedicalInfo: {
                    bloodType: request.bloodType,
                    knownAllergies: request.knownAllergies || [],
                    emergencyMedicalInfo: request.emergencyMedicalInfo,
                },
                insuranceInfo: request.insurance
                    ? {
                        provider: request.insurance.provider,
                        policyNumber: request.insurance.policyNumber,
                        groupNumber: request.insurance.groupNumber,
                        validFrom: request.insurance.validFrom,
                        validTo: request.insurance.validTo,
                        coverageType: request.insurance.coverageType,
                        isVietnameseInsurance: request.insurance.coverageType === "BHYT" ||
                            request.insurance.coverageType === "BHTN",
                        bhytNumber: request.insurance.bhytNumber,
                        isPrimary: true,
                    }
                    : undefined,
                emergencyContacts: (request.emergencyContacts || []).map((contact) => ({
                    ...contact,
                    isPrimary: contact.isPrimary ?? false,
                })),
                requestedBy: getUserId(req),
            });
            if (!result.success) {
                throw new ErrorHandlingMiddleware_1.DomainError(result.errors?.[0] || "Failed to register patient");
            }
            ErrorHandlingMiddleware_1.ResponseHelper.created(res, { patientId: result.patientId }, "Đăng ký bệnh nhân thành công");
        }
        catch (error) {
            this.logger.error("Error registering patient", {
                error: error instanceof Error ? error.message : "Unknown error",
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
            this.logger.info("Getting patient by ID", {
                patientId: patientId.replace(/PAT-\d{6}-\d{3}/g, "PAT-***-***"),
            });
            const query = {
                queryId: (0, crypto_1.randomUUID)(),
                queryType: "GetPatientProfile",
                timestamp: new Date(),
                requestedBy,
                data: {
                    patientId,
                    requestedBy,
                },
            };
            const result = await this.patientQueryHandlers.handleGetPatientProfile(query);
            if (!result.success || !result.data) {
                throw new ErrorHandlingMiddleware_1.NotFoundError("Bệnh nhân", patientId);
            }
            ErrorHandlingMiddleware_1.ResponseHelper.success(res, result.data);
        }
        catch (error) {
            this.logger.error("Error getting patient", {
                patientId: req.params.patientId,
                error: error instanceof Error ? error.message : "Unknown error",
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
            this.logger.info("Getting patient by user ID");
            const query = {
                queryId: (0, crypto_1.randomUUID)(),
                queryType: "GetPatientProfile",
                timestamp: new Date(),
                requestedBy,
                data: {
                    userId,
                    requestedBy,
                },
            };
            const result = await this.patientQueryHandlers.handleGetPatientProfile(query);
            if (!result.success || !result.data) {
                throw new ErrorHandlingMiddleware_1.NotFoundError("Bệnh nhân với User ID", userId);
            }
            ErrorHandlingMiddleware_1.ResponseHelper.success(res, result.data);
        }
        catch (error) {
            this.logger.error("Error getting patient by user ID", {
                userId: req.params.userId,
                error: error instanceof Error ? error.message : "Unknown error",
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
            this.logger.info("Getting patient by national ID");
            const query = {
                queryId: (0, crypto_1.randomUUID)(),
                queryType: "GetPatientProfile",
                timestamp: new Date(),
                requestedBy,
                data: {
                    nationalId,
                    requestedBy,
                },
            };
            const result = await this.patientQueryHandlers.handleGetPatientProfile(query);
            if (!result.success || !result.data) {
                throw new ErrorHandlingMiddleware_1.NotFoundError("Bệnh nhân với CMND/CCCD", nationalId);
            }
            ErrorHandlingMiddleware_1.ResponseHelper.success(res, result.data);
        }
        catch (error) {
            this.logger.error("Error getting patient by national ID", {
                nationalId: req.params.nationalId,
                error: error instanceof Error ? error.message : "Unknown error",
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
            this.logger.info("Getting patient by BHYT number");
            const query = {
                queryId: (0, crypto_1.randomUUID)(),
                queryType: "GetPatientProfile",
                timestamp: new Date(),
                requestedBy,
                data: {
                    bhytNumber,
                    requestedBy,
                },
            };
            const result = await this.patientQueryHandlers.handleGetPatientProfile(query);
            if (!result.success || !result.data) {
                throw new ErrorHandlingMiddleware_1.NotFoundError("Bệnh nhân với số BHYT", bhytNumber);
            }
            ErrorHandlingMiddleware_1.ResponseHelper.success(res, result.data);
        }
        catch (error) {
            this.logger.error("Error getting patient by BHYT number", {
                bhytNumber: req.params.bhytNumber,
                error: error instanceof Error ? error.message : "Unknown error",
            });
            throw error;
        }
    }
    /**
     * Update patient information
     * PUT /api/v1/patients/:patientId
     *
     * Uses smart defaults "Chưa cập nhật" and proper merge logic
     * - undefined = no change (preserve existing value)
     * - explicit value (including "Chưa cập nhật") = user intended change
     */
    async updatePatient(req, res) {
        try {
            const { patientId } = req.params;
            const updateRequest = req.body;
            // Get existing patient
            const existingPatient = await this.patientQueryHandlers.handleGetPatientProfile({
                queryId: `query-${Date.now()}`,
                queryType: "GetPatientProfile",
                timestamp: new Date(),
                requestedBy: getUserId(req),
                data: { patientId, requestedBy: getUserId(req) },
            });
            if (!existingPatient.success) {
                throw new ErrorHandlingMiddleware_1.NotFoundError(`Patient with ID ${patientId} not found`);
            }
            // Extract existing data as CreatePersonalInfo and CreateContactInfo
            const existingPersonalInfo = {
                fullName: existingPatient.data?.personalInfo?.fullName || PatientConstants_1.UNUPDATED,
                dateOfBirth: existingPatient.data?.personalInfo?.dateOfBirth || PatientConstants_1.UNUPDATED,
                gender: existingPatient.data?.personalInfo?.gender || "other",
                nationalId: existingPatient.data?.personalInfo?.nationalId || PatientConstants_1.UNUPDATED,
                nationality: existingPatient.data?.personalInfo?.nationality || PatientConstants_1.UNUPDATED,
                ethnicity: existingPatient.data?.personalInfo?.ethnicity || PatientConstants_1.UNUPDATED,
                occupation: existingPatient.data?.personalInfo?.occupation || PatientConstants_1.UNUPDATED,
                maritalStatus: existingPatient.data?.personalInfo?.maritalStatus || PatientConstants_1.UNUPDATED,
            };
            const existingContactInfo = {
                primaryPhone: existingPatient.data?.contactInfo?.primaryPhone || PatientConstants_1.UNUPDATED,
                secondaryPhone: existingPatient.data?.contactInfo?.secondaryPhone,
                email: existingPatient.data?.contactInfo?.email || PatientConstants_1.UNUPDATED,
                preferredContactMethod: existingPatient.data?.contactInfo?.preferredContactMethod || "phone",
                address: {
                    street: existingPatient.data?.contactInfo?.address?.street || PatientConstants_1.UNUPDATED,
                    ward: existingPatient.data?.contactInfo?.address?.ward || PatientConstants_1.UNUPDATED,
                    district: existingPatient.data?.contactInfo?.address?.district || PatientConstants_1.UNUPDATED,
                    city: existingPatient.data?.contactInfo?.address?.city || PatientConstants_1.UNUPDATED,
                    province: existingPatient.data?.contactInfo?.address?.province ||
                        PatientConstants_1.UNUPDATED,
                    postalCode: existingPatient.data?.contactInfo?.address
                        ?.postalCode,
                    country: existingPatient.data?.contactInfo?.address?.country || "Vietnam",
                },
            };
            // Merge with new data using proper update logic
            const updatedPersonalInfo = (0, PatientDataHelper_1.mergePersonalInfoForUpdate)(existingPersonalInfo, updateRequest);
            const updatedContactInfo = (0, PatientDataHelper_1.mergeContactInfoForUpdate)(existingContactInfo, updateRequest);
            // Check if anything actually changed
            const personalInfoChanged = (0, PatientDataHelper_1.hasPersonalInfoChanged)(existingPersonalInfo, updatedPersonalInfo);
            const contactInfoChanged = (0, PatientDataHelper_1.hasContactInfoChanged)(existingContactInfo, updatedContactInfo);
            if (!personalInfoChanged &&
                !contactInfoChanged &&
                !updateRequest.basicMedicalInfo &&
                !updateRequest.insuranceInfo) {
                // No actual changes - return existing patient
                ErrorHandlingMiddleware_1.ResponseHelper.success(res, existingPatient.data, "Không có thay đổi nào được thực hiện");
                return;
            }
            // Build normalized request for use case
            const normalizedRequest = {};
            if (personalInfoChanged) {
                normalizedRequest.personalInfo = updatedPersonalInfo;
            }
            if (contactInfoChanged) {
                normalizedRequest.contactInfo = updatedContactInfo;
            }
            // Handle basic medical info
            if (updateRequest.basicMedicalInfo) {
                normalizedRequest.basicMedicalInfo = updateRequest.basicMedicalInfo;
            }
            else {
                const basicFields = [
                    "bloodType",
                    "knownAllergies",
                    "emergencyMedicalInfo",
                ];
                const hasBasicField = basicFields.some((field) => updateRequest[field] !== undefined);
                if (hasBasicField) {
                    normalizedRequest.basicMedicalInfo = {
                        bloodType: updateRequest.bloodType,
                        knownAllergies: updateRequest.knownAllergies,
                        emergencyMedicalInfo: updateRequest.emergencyMedicalInfo,
                    };
                }
            }
            // Handle insurance info
            if (updateRequest.insuranceInfo) {
                normalizedRequest.insuranceInfo = updateRequest.insuranceInfo;
            }
            // Log the update (HIPAA compliant)
            this.logger.info("Updating patient with smart defaults", {
                patientId: patientId.replace(/PAT-\d{6}-\d{3}/g, "PAT-***-***"),
                fieldsUpdated: Object.keys(normalizedRequest),
                hasPersonalInfoChanges: personalInfoChanged,
                hasContactInfoChanges: contactInfoChanged,
            });
            // Execute update
            const payload = {
                patientId,
                updatedBy: getUserId(req),
                ...normalizedRequest,
            };
            const result = await this.updatePatientInfoUseCase.execute(payload);
            if (!result.success) {
                throw new ErrorHandlingMiddleware_1.DomainError(result.errors?.[0] || "Failed to update patient");
            }
            // Get updated patient for response
            const updatedPatientResult = await this.patientQueryHandlers.handleGetPatientProfile({
                queryId: `query-${Date.now()}`,
                queryType: "GetPatientProfile",
                timestamp: new Date(),
                requestedBy: getUserId(req),
                data: { patientId, requestedBy: getUserId(req) },
            });
            ErrorHandlingMiddleware_1.ResponseHelper.success(res, {
                patient: updatedPatientResult.data,
                fieldsUpdated: Object.keys(normalizedRequest),
                completionPercentage: updatedPersonalInfo
                    ? Math.round((Object.values(updatedPersonalInfo).filter((v) => v !== PatientConstants_1.UNUPDATED).length /
                        Object.keys(updatedPersonalInfo).length) *
                        100)
                    : 0,
            }, "Cập nhật thông tin bệnh nhân thành công");
        }
        catch (error) {
            this.logger.error("Error updating patient", {
                patientId: req.params.patientId,
                error: error instanceof Error ? error.message : "Unknown error",
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
            const { page = "1", limit = "20", isActive, hasInsurance, city, province, sortField = "created_at", sortDirection = "desc", } = req.query;
            const requestedBy = getUserId(req);
            const requestedByRole = getUserRole(req);
            this.logger.info("Getting patient list", { page, limit });
            const parsedPage = Number(page);
            const parsedLimit = Number(limit);
            const parsedIsActive = typeof isActive === "string"
                ? isActive === "true"
                    ? true
                    : isActive === "false"
                        ? false
                        : undefined
                : undefined;
            const parsedHasInsurance = typeof hasInsurance === "string"
                ? hasInsurance === "true"
                    ? true
                    : hasInsurance === "false"
                        ? false
                        : undefined
                : undefined;
            const query = {
                queryId: (0, crypto_1.randomUUID)(),
                queryType: "GetPatientList",
                timestamp: new Date(),
                requestedBy,
                data: {
                    filters: {
                        isActive: parsedIsActive,
                        hasInsurance: parsedHasInsurance,
                        city: city,
                        province: province,
                    },
                    pagination: {
                        page: Number.isNaN(parsedPage) ? 1 : parsedPage,
                        limit: Number.isNaN(parsedLimit) ? 20 : parsedLimit,
                    },
                    sorting: {
                        field: sortField,
                        direction: sortDirection,
                    },
                    requestedBy,
                    requestedByRole,
                },
            };
            const result = await this.patientQueryHandlers.handleGetPatientList(query);
            if (!result.success) {
                throw new ErrorHandlingMiddleware_1.DomainError(result.message);
            }
            ErrorHandlingMiddleware_1.ResponseHelper.paginated(res, result.data.patients, result.data.pagination.page, result.data.pagination.limit, result.data.pagination.total);
        }
        catch (error) {
            this.logger.error("Error getting patient list", {
                error: error instanceof Error ? error.message : "Unknown error",
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
            const { searchTerm, isActive, hasInsurance, page = "1", limit = "20", } = req.query;
            const requestedBy = getUserId(req);
            const requestedByRole = getUserRole(req);
            this.logger.info("Searching patients", { searchTerm, page, limit });
            const parsedPage = Number(page);
            const parsedLimit = Number(limit);
            const parsedIsActive = typeof isActive === "string"
                ? isActive === "true"
                    ? true
                    : isActive === "false"
                        ? false
                        : undefined
                : undefined;
            const parsedHasInsurance = typeof hasInsurance === "string"
                ? hasInsurance === "true"
                    ? true
                    : hasInsurance === "false"
                        ? false
                        : undefined
                : undefined;
            const query = {
                queryId: (0, crypto_1.randomUUID)(),
                queryType: "SearchPatients",
                timestamp: new Date(),
                requestedBy,
                data: {
                    searchTerm: searchTerm || "",
                    filters: {
                        isActive: parsedIsActive,
                        hasInsurance: parsedHasInsurance,
                    },
                    pagination: {
                        page: Number.isNaN(parsedPage) ? 1 : parsedPage,
                        limit: Number.isNaN(parsedLimit) ? 20 : parsedLimit,
                    },
                    requestedBy,
                    requestedByRole,
                },
            };
            const result = await this.patientQueryHandlers.handleSearchPatients(query);
            if (!result.success) {
                throw new ErrorHandlingMiddleware_1.DomainError(result.message);
            }
            ErrorHandlingMiddleware_1.ResponseHelper.paginated(res, result.data.patients, result.data.pagination.page, result.data.pagination.limit, result.data.pagination.total);
        }
        catch (error) {
            this.logger.error("Error searching patients", {
                error: error instanceof Error ? error.message : "Unknown error",
            });
            throw error;
        }
    }
    // ============================================================================
    // ❌ POST-MVP METHODS - ARCHIVED FOR GRADUATION PROJECT
    // ============================================================================
    // The following methods have been commented out as part of scope reduction.
    // Use cases moved to: src/application/use-cases/_archived_post_mvp/
    // Routes to be commented out in: patientRoutes.ts
    // To restore: Uncomment these methods, restore use cases, update DI container
    /* POST-MVP: PMI Features (Patient Master Index) - Not required for graduation project
    **
     * Match patients (PMI)
     * POST /api/v1/patients/match
     *
    async matchPatients(req: Request, res: Response): Promise<void> {
      try {
        const {
          fullName,
          dateOfBirth,
          nationalId,
          primaryPhone,
          email,
          onlyCertainMatches,
          limit,
        } = req.body;
  
        // Do NOT log PHI/PII (fullName, nationalId)
        this.logger.info('Matching patients');
  
        const result = await this.matchPatientsUseCase.execute({
          criteria: {
            fullName,
            dateOfBirth,
            nationalId,
            primaryPhone,
            email,
          },
          onlyCertainMatches: onlyCertainMatches || false,
          limit: limit || 10,
          requestedBy: getUserId(req),
        });
  
        if (!result.success) {
          throw new DomainError(result.errors?.[0] || 'Failed to match patients');
        }
  
        const matches = result.data?.matches ?? [];
  
        ResponseHelper.success(
          res,
          matches,
          `Tìm thấy ${matches.length} kết quả khớp`,
        );
      } catch (error) {
        this.logger.error('Error matching patients', {
          error: error instanceof Error ? error.message : 'Unknown error',
        });
        throw error;
      }
    }
  
    **
     * Merge patients
     * POST /api/v1/patients/merge
     *
    async mergePatients(req: Request, res: Response): Promise<void> {
      try {
        const { duplicatePatientId, masterPatientId, reason } = req.body;
  
        // Redact patient IDs for HIPAA compliance
        this.logger.info('Merging patients', {
          duplicatePatientId: duplicatePatientId.replace(
            /PAT-\d{6}-\d{3}/g,
            'PAT-***-***',
          ),
          masterPatientId: masterPatientId.replace(
            /PAT-\d{6}-\d{3}/g,
            'PAT-***-***',
          ),
        });
  
        const result = await this.mergePatientsUseCase.execute({
          duplicatePatientId,
          masterPatientId,
          reason,
          performedBy: getUserId(req),
        });
  
        if (!result.success) {
          throw new DomainError(result.errors?.[0] || 'Failed to merge patients');
        }
  
        ResponseHelper.success(
          res,
          {
            masterPatientId,
            duplicatePatientId,
            mergedAt: new Date().toISOString(),
          },
          'Gộp bệnh nhân thành công',
        );
      } catch (error) {
        this.logger.error('Error merging patients', {
          error: error instanceof Error ? error.message : 'Unknown error',
        });
        throw error;
      }
    }
    END POST-MVP: PMI Features */
    /* POST-MVP: FHIR Advanced - Patient Linking
    **
     * Link patients
     * POST /api/v1/patients/:patientId/link
     *
    async linkPatients(req: Request, res: Response): Promise<void> {
      try {
        const { patientId } = req.params;
        const { otherPatientId, linkType } = req.body;
  
        // Redact patient IDs for HIPAA compliance
        this.logger.info('Linking patients', {
          patientId: patientId.replace(/PAT-\d{6}-\d{3}/g, 'PAT-***-***'),
          otherPatientId: otherPatientId.replace(
            /PAT-\d{6}-\d{3}/g,
            'PAT-***-***',
          ),
          linkType,
        });
  
        const result = await this.linkPatientsUseCase.execute({
          patientId,
          otherPatientId,
          linkType,
          performedBy: getUserId(req),
        });
  
        if (!result.success) {
          throw new DomainError(result.errors?.[0] || 'Failed to link patients');
        }
  
        ResponseHelper.success(
          res,
          {
            patientId,
            otherPatientId,
            linkType,
            linkedAt: new Date().toISOString(),
          },
          'Liên kết bệnh nhân thành công',
        );
      } catch (error) {
        this.logger.error('Error linking patients', {
          error: error instanceof Error ? error.message : 'Unknown error',
        });
        throw error;
      }
    }
    END POST-MVP: FHIR Advanced - Patient Linking */
    /* POST-MVP: Patient Lifecycle - Deactivation
    **
     * Deactivate patient
     * POST /api/v1/patients/:patientId/deactivate
     *
    async deactivatePatient(req: Request, res: Response): Promise<void> {
      try {
        const { patientId } = req.params;
        const { reason } = req.body;
  
        // Redact patient ID for HIPAA compliance
        this.logger.info('Deactivating patient', {
          patientId: patientId.replace(/PAT-\d{6}-\d{3}/g, 'PAT-***-***'),
        });
  
        if (!userHasAnyRole(req, ['ADMIN', 'SUPER_ADMIN', 'RECEPTIONIST'])) {
          this.logger.warn('Unauthorized patient deactivation attempt', {
            patientId,
            requestedBy: getUserId(req),
            roles: getUserRoles(req),
          });
  
          res.status(403).json({
            success: false,
            error: 'FORBIDDEN',
            message: 'Bạn không có quyền vô hiệu hóa bệnh nhân',
          });
          return;
        }
  
        const result = await this.deactivatePatientUseCase.execute({
          patientId,
          reason,
          performedBy: getUserId(req),
        });
  
        if (!result.success) {
          throw new DomainError(
            result.errors?.[0] || 'Failed to deactivate patient',
          );
        }
  
        ResponseHelper.success(
          res,
          {
            patientId,
            deactivatedAt: new Date().toISOString(),
          },
          'Vô hiệu hóa bệnh nhân thành công',
        );
      } catch (error) {
        this.logger.error('Error deactivating patient', {
          error: error instanceof Error ? error.message : 'Unknown error',
        });
        throw error;
      }
    }
    END POST-MVP: Patient Lifecycle - Deactivation */
    /**
     * Validate insurance
     * POST /api/v1/patients/validate-insurance
     */
    async validateInsurance(req, res) {
        try {
            const { patientId } = req.body;
            this.logger.info("Validating insurance", { patientId });
            const result = await this.validateInsuranceUseCase.execute({
                patientId,
                requestedBy: getUserId(req),
            });
            ErrorHandlingMiddleware_1.ResponseHelper.success(res, result, "Kiểm tra bảo hiểm thành công");
        }
        catch (error) {
            this.logger.error("Error validating insurance", {
                error: error instanceof Error ? error.message : "Unknown error",
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
        this.logger.info("Adding emergency contact", { patientId });
        const result = await this.addEmergencyContactUseCase.execute({
            patientId,
            ...request,
            performedBy,
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
        this.logger.info("Getting emergency contacts", { patientId });
        const result = await this.getEmergencyContactsUseCase.execute({
            patientId,
            requestedBy,
        });
        if (!result.success) {
            res.status(400).json({
                success: false,
                message: result.message,
                errors: result.errors,
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
        this.logger.info("Updating emergency contact", { patientId, contactId });
        const result = await this.updateEmergencyContactUseCase.execute({
            patientId,
            contactId,
            ...request,
            performedBy,
        });
        if (!result.success) {
            res.status(400).json({
                success: false,
                message: result.message,
                errors: result.errors,
            });
            return;
        }
        ErrorHandlingMiddleware_1.ResponseHelper.success(res, { contactId: result.contactId }, result.message);
    }
    /* POST-MVP: Advanced Emergency Contact Management
    **
     * Remove emergency contact
     * DELETE /api/v1/patients/:patientId/emergency-contacts/:contactId
     *
    async removeEmergencyContact(req: Request, res: Response): Promise<void> {
      const { patientId, contactId } = req.params;
      const performedBy = getUserId(req);
  
      this.logger.info('Removing emergency contact', { patientId, contactId });
  
      const result = await this.removeEmergencyContactUseCase.execute({
        patientId,
        contactId,
        performedBy,
      });
  
      if (!result.success) {
        res.status(400).json({
          success: false,
          message: result.message,
          errors: result.errors,
        });
        return;
      }
  
      ResponseHelper.success(res, null, result.message);
    }
  
    **
     * Set primary emergency contact
     * PUT /api/v1/patients/:patientId/emergency-contacts/:contactId/set-primary
     *
    async setPrimaryEmergencyContact(req: Request, res: Response): Promise<void> {
      const { patientId, contactId } = req.params;
      const performedBy = getUserId(req);
  
      this.logger.info('Setting primary emergency contact', {
        patientId,
        contactId,
      });
  
      const result = await this.setPrimaryEmergencyContactUseCase.execute({
        patientId,
        contactId,
        performedBy,
      });
  
      if (!result.success) {
        res.status(400).json({
          success: false,
          message: result.message,
          errors: result.errors,
        });
        return;
      }
  
      ResponseHelper.success(res, null, result.message);
    }
    END POST-MVP: Advanced Emergency Contact Management */
    /* POST-MVP: HIPAA Consent Management
    **
     * Grant consent
     *
    async grantConsent(req: Request, res: Response): Promise<void> {
      const { patientId } = req.params;
      const request: GrantConsentRequest = req.body;
      const userId = getUserId(req);
  
      this.logger.info('Granting consent for patient', {
        patientId,
        consentType: request.consentType,
      });
  
      const result = await this.grantConsentUseCase.execute({
        patientId,
        consentType: request.consentType,
        grantedBy: userId,
        expiresAt: request.expiresAt ? new Date(request.expiresAt) : undefined,
        performedBy: userId,
      });
  
      ResponseHelper.success(res, result, result.message);
    }
    END POST-MVP: HIPAA Consent Management */
    /* POST-MVP: Patient Lifecycle - Deceased/Reactivation
    **
     * Mark patient as deceased
     *
    async markAsDeceased(req: Request, res: Response): Promise<void> {
      const { patientId } = req.params;
      const performedBy = getUserId(req);
  
      this.logger.info('Marking patient as deceased', { patientId });
  
      const result = await this.markAsDeceasedUseCase.execute({
        patientId,
        performedBy,
      });
  
      ResponseHelper.success(res, result, result.message);
    }
  
    **
     * Reactivate patient
     *
    async reactivatePatient(req: Request, res: Response): Promise<void> {
      const { patientId } = req.params;
      const request: ReactivatePatientRequest = req.body;
      const performedBy = getUserId(req);
  
      this.logger.info('Reactivating patient', { patientId });
  
      const result = await this.reactivatePatientUseCase.execute({
        patientId,
        reason: request.reason,
        performedBy,
        allowDeceasedReactivate: request.allowDeceasedReactivate,
      });
  
      ResponseHelper.success(res, result, result.message);
    }
    END POST-MVP: Patient Lifecycle - Deceased/Reactivation */
    /**
     * Add insurance info after registration
     */
    async addInsuranceInfo(req, res) {
        const { patientId } = req.params;
        const performedBy = getUserId(req);
        const request = req.body;
        const result = await this.addInsuranceInfoUseCase.execute({
            patientId,
            performedBy,
            payload: {
                provider: request.provider,
                policyNumber: request.policyNumber,
                groupNumber: request.groupNumber,
                validFrom: request.validFrom,
                validTo: request.validTo,
                coverageType: request.coverageType,
                isVietnameseInsurance: request.isVietnameseInsurance,
                bhytNumber: request.bhytNumber,
                isPrimary: request.isPrimary,
                isActive: request.isActive,
            },
        });
        if (!result.success) {
            res.status(400).json({
                success: false,
                message: result.message,
                errors: result.errors,
            });
            return;
        }
        ErrorHandlingMiddleware_1.ResponseHelper.success(res, { success: true }, result.message);
    }
    /* POST-MVP: HIPAA Consent Management - Retrieval Methods
    **
     * Get all consents for a patient
     * GET /api/v1/patients/:patientId/consents
     *
    async getConsents(req: Request, res: Response): Promise<void> {
      const { patientId } = req.params;
      const requestedBy = getUserId(req);
  
      const result = await this.getConsentsUseCase.execute({
        patientId,
        requestedBy,
      });
  
      if (!result.success) {
        res.status(400).json({
          success: false,
          message: result.message,
          errors: result.errors,
        });
        return;
      }
  
      ResponseHelper.success(res, result.data, result.message);
    }
  
    **
     * Get consent details
     * GET /api/v1/patients/:patientId/consents/:consentId
     *
    async getConsentDetails(req: Request, res: Response): Promise<void> {
      const { patientId, consentId } = req.params;
      const requestedBy = getUserId(req);
  
      const result = await this.getConsentDetailsUseCase.execute({
        patientId,
        consentId,
        requestedBy,
      });
  
      if (!result.success) {
        res.status(400).json({
          success: false,
          message: result.message,
          errors: result.errors,
        });
        return;
      }
  
      ResponseHelper.success(res, result.data, result.message);
    }
  
    **
     * Revoke consent
     * POST /api/v1/patients/:patientId/consents/:consentId/revoke
     *
    async revokeConsent(req: Request, res: Response): Promise<void> {
      const { patientId, consentId } = req.params;
      const performedBy = getUserId(req);
  
      const result = await this.revokeConsentUseCase.execute({
        patientId,
        consentId,
        performedBy,
      });
  
      if (!result.success) {
        res.status(400).json({
          success: false,
          message: result.message,
          errors: result.errors,
        });
        return;
      }
  
      ResponseHelper.success(res, { success: true }, result.message);
    }
  
    **
     * Get active consents only
     * GET /api/v1/patients/:patientId/consents/active
     *
    async getActiveConsents(req: Request, res: Response): Promise<void> {
      const { patientId } = req.params;
      const requestedBy = getUserId(req);
  
      const result = await this.getActiveConsentsUseCase.execute({
        patientId,
        requestedBy,
      });
  
      if (!result.success) {
        res.status(400).json({
          success: false,
          message: result.message,
          errors: result.errors,
        });
        return;
      }
  
      ResponseHelper.success(res, result.data, result.message);
    }
    END POST-MVP: HIPAA Consent Management - Retrieval Methods */
    /**
     * Get insurance info
     * GET /api/v1/patients/:patientId/insurance
     */
    async getInsuranceInfo(req, res) {
        const { patientId } = req.params;
        const requestedBy = getUserId(req);
        const result = await this.getInsuranceInfoUseCase.execute({
            patientId,
            requestedBy,
        });
        if (!result.success) {
            res.status(400).json({
                success: false,
                message: result.message,
                errors: result.errors,
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
            performedBy,
        });
        if (!result.success) {
            res.status(400).json({
                success: false,
                message: result.message,
                errors: result.errors,
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
            requestedBy,
        });
        if (!result.success) {
            res.status(400).json({
                success: false,
                message: result.message,
                errors: result.errors,
            });
            return;
        }
        ErrorHandlingMiddleware_1.ResponseHelper.success(res, result.data, result.message);
    }
    /**
     * Get patient statistics for admin dashboards
     * GET /api/v1/patients/statistics
     */
    async getStatistics(req, res) {
        try {
            const allowedRoles = ["SUPER_ADMIN", "ADMIN", "DOCTOR", "NURSE"];
            if (!userHasAnyRole(req, allowedRoles)) {
                res.status(403).json({
                    success: false,
                    message: "Bạn không có quyền xem thống kê bệnh nhân",
                });
                return;
            }
            this.logger.info("Getting patient statistics");
            const statistics = await this.getPatientStatisticsUseCase.execute();
            ErrorHandlingMiddleware_1.ResponseHelper.success(res, statistics, "Thống kê bệnh nhân thành công");
        }
        catch (error) {
            this.logger.error("Failed to get patient statistics", {
                error: error instanceof Error ? error.message : "Unknown error",
            });
            res.status(500).json({
                success: false,
                message: "Lỗi khi lấy thống kê bệnh nhân",
                error: error instanceof Error ? error.message : "Unknown error",
            });
        }
    }
}
exports.PatientController = PatientController;
//# sourceMappingURL=PatientController.js.map