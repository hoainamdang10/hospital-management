/**
 * PatientController - Presentation Layer
 * Handles HTTP requests for Patient Registry operations
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, RESTful API, HIPAA
 */

import { Request, Response } from 'express';
import { randomUUID } from 'crypto';
import { ILogger } from '@shared/application/services/logger.interface';
import { RegisterPatientUseCase } from '../../application/use-cases/RegisterPatientUseCase';
import { UpdatePatientInfoUseCase } from '../../application/use-cases/UpdatePatientInfoUseCase';
import { PatientQueryHandlers } from '../../application/handlers/PatientQueryHandlers';
import { MatchPatientsUseCase } from '../../application/use-cases/MatchPatientsUseCase';
import { MergePatientsUseCase } from '../../application/use-cases/MergePatientsUseCase';
import { LinkPatientsUseCase } from '../../application/use-cases/LinkPatientsUseCase';
import { DeactivatePatientUseCase } from '../../application/use-cases/DeactivatePatientUseCase';
import { ValidateInsuranceUseCase } from '../../application/use-cases/ValidateInsuranceUseCase';
import { AddEmergencyContactUseCase } from '../../application/use-cases/AddEmergencyContactUseCase';
import { GetEmergencyContactsUseCase } from '../../application/use-cases/GetEmergencyContactsUseCase';
import { UpdateEmergencyContactUseCase } from '../../application/use-cases/UpdateEmergencyContactUseCase';
import { RemoveEmergencyContactUseCase } from '../../application/use-cases/RemoveEmergencyContactUseCase';
import { SetPrimaryEmergencyContactUseCase } from '../../application/use-cases/SetPrimaryEmergencyContactUseCase';
import { GrantConsentUseCase } from '../../application/use-cases/GrantConsentUseCase';
import { GetConsentsUseCase } from '../../application/use-cases/GetConsentsUseCase';
import { GetConsentDetailsUseCase } from '../../application/use-cases/GetConsentDetailsUseCase';
import { RevokeConsentUseCase } from '../../application/use-cases/RevokeConsentUseCase';
import { GetActiveConsentsUseCase } from '../../application/use-cases/GetActiveConsentsUseCase';
import { GetInsuranceInfoUseCase } from '../../application/use-cases/GetInsuranceInfoUseCase';
import { UpdateInsuranceInfoUseCase } from '../../application/use-cases/UpdateInsuranceInfoUseCase';
import { VerifyInsuranceUseCase } from '../../application/use-cases/VerifyInsuranceUseCase';
import { MarkAsDeceasedUseCase } from '../../application/use-cases/MarkAsDeceasedUseCase';
import { ReactivatePatientUseCase } from '../../application/use-cases/ReactivatePatientUseCase';
import { GetPatientStatisticsUseCase } from '../../application/use-cases/GetPatientStatisticsUseCase';
import { UploadPatientPhotoUseCase } from '../../application/use-cases/UploadPatientPhotoUseCase';
import { GetPatientPhotoUseCase } from '../../application/use-cases/GetPatientPhotoUseCase';
import { DeletePatientPhotoUseCase } from '../../application/use-cases/DeletePatientPhotoUseCase';
import { UpdateCommunicationPreferencesUseCase } from '../../application/use-cases/UpdateCommunicationPreferencesUseCase';
import { GetCommunicationPreferencesUseCase } from '../../application/use-cases/GetCommunicationPreferencesUseCase';
import {
  RegisterPatientRequest,
  UpdatePatientRequest,
  AddEmergencyContactRequest,
  UpdateEmergencyContactRequest,
  GrantConsentRequest,
  ReactivatePatientRequest
} from '../dtos/PatientDTOs';
import { ResponseHelper, NotFoundError, DomainError } from '../middleware/ErrorHandlingMiddleware';

/**
 * Authenticated Request interface
 */
interface AuthenticatedRequest extends Request {
  user?: {
    userId?: string;
    role?: string;
  };
}

/**
 * Helper to get user ID from request
 */
function getUserId(req: Request): string {
  return (req as AuthenticatedRequest).user?.userId || 'system';
}

function getUserRole(req: Request): string {
  return (req as AuthenticatedRequest).user?.role || 'system';
}

/**
 * Patient Controller
 */
export class PatientController {
  constructor(
    private logger: ILogger,
    private registerPatientUseCase: RegisterPatientUseCase,
    private updatePatientInfoUseCase: UpdatePatientInfoUseCase,
    private matchPatientsUseCase: MatchPatientsUseCase,
    private mergePatientsUseCase: MergePatientsUseCase,
    private linkPatientsUseCase: LinkPatientsUseCase,
    private deactivatePatientUseCase: DeactivatePatientUseCase,
    private validateInsuranceUseCase: ValidateInsuranceUseCase,
    private addEmergencyContactUseCase: AddEmergencyContactUseCase,
    private getEmergencyContactsUseCase: GetEmergencyContactsUseCase,
    private updateEmergencyContactUseCase: UpdateEmergencyContactUseCase,
    private removeEmergencyContactUseCase: RemoveEmergencyContactUseCase,
    private setPrimaryEmergencyContactUseCase: SetPrimaryEmergencyContactUseCase,
    private grantConsentUseCase: GrantConsentUseCase,
    private getConsentsUseCase: GetConsentsUseCase,
    private getConsentDetailsUseCase: GetConsentDetailsUseCase,
    private revokeConsentUseCase: RevokeConsentUseCase,
    private getActiveConsentsUseCase: GetActiveConsentsUseCase,
    private getInsuranceInfoUseCase: GetInsuranceInfoUseCase,
    private updateInsuranceInfoUseCase: UpdateInsuranceInfoUseCase,
    private verifyInsuranceUseCase: VerifyInsuranceUseCase,
    private markAsDeceasedUseCase: MarkAsDeceasedUseCase,
    private reactivatePatientUseCase: ReactivatePatientUseCase,
    private getPatientStatisticsUseCase: GetPatientStatisticsUseCase,
    private uploadPatientPhotoUseCase: UploadPatientPhotoUseCase,
    private getPatientPhotoUseCase: GetPatientPhotoUseCase,
    private deletePatientPhotoUseCase: DeletePatientPhotoUseCase,
    private updateCommunicationPreferencesUseCase: UpdateCommunicationPreferencesUseCase,
    private getCommunicationPreferencesUseCase: GetCommunicationPreferencesUseCase,
    private patientQueryHandlers: PatientQueryHandlers
  ) {}

  /**
   * Register new patient
   * POST /api/v1/patients
   */
  async registerPatient(req: Request, res: Response): Promise<void> {
    try {
      const request: RegisterPatientRequest = req.body;

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
        throw new DomainError(result.errors?.[0] || 'Failed to register patient');
      }

      ResponseHelper.created(res, { patientId: result.patientId }, 'Đăng ký bệnh nhân thành công');

    } catch (error) {
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
  async getPatientById(req: Request, res: Response): Promise<void> {
    try {
      const { patientId } = req.params;
      const requestedBy = getUserId(req);

      this.logger.info('Getting patient by ID', { patientId });

      const query = {
        queryId: randomUUID(),
        queryType: 'GetPatientProfile' as const,
        timestamp: new Date(),
        requestedBy,
        data: {
          patientId,
          requestedBy
        }
      };

      const result = await this.patientQueryHandlers.handleGetPatientProfile(query);

      if (!result.success || !result.data) {
        throw new NotFoundError('Bệnh nhân', patientId);
      }

      ResponseHelper.success(res, result.data);

    } catch (error) {
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
  async getPatientByUserId(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      const requestedBy = getUserId(req);

      this.logger.info('Getting patient by user ID', { userId });

      const query = {
        queryId: randomUUID(),
        queryType: 'GetPatientProfile' as const,
        timestamp: new Date(),
        requestedBy,
        data: {
          userId,
          requestedBy
        }
      };

      const result = await this.patientQueryHandlers.handleGetPatientProfile(query);

      if (!result.success || !result.data) {
        throw new NotFoundError('Bệnh nhân với User ID', userId);
      }

      ResponseHelper.success(res, result.data);

    } catch (error) {
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
  async getPatientByNationalId(req: Request, res: Response): Promise<void> {
    try {
      const { nationalId } = req.params;
      const requestedBy = getUserId(req);

      this.logger.info('Getting patient by national ID', { nationalId });

      const query = {
        queryId: randomUUID(),
        queryType: 'GetPatientProfile' as const,
        timestamp: new Date(),
        requestedBy,
        data: {
          nationalId,
          requestedBy
        }
      };

      const result = await this.patientQueryHandlers.handleGetPatientProfile(query);

      if (!result.success || !result.data) {
        throw new NotFoundError('Bệnh nhân với CMND/CCCD', nationalId);
      }

      ResponseHelper.success(res, result.data);

    } catch (error) {
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
  async getPatientByBHYTNumber(req: Request, res: Response): Promise<void> {
    try {
      const { bhytNumber } = req.params;
      const requestedBy = getUserId(req);

      this.logger.info('Getting patient by BHYT number', { bhytNumber });

      const query = {
        queryId: randomUUID(),
        queryType: 'GetPatientProfile' as const,
        timestamp: new Date(),
        requestedBy,
        data: {
          bhytNumber,
          requestedBy
        }
      };

      const result = await this.patientQueryHandlers.handleGetPatientProfile(query);

      if (!result.success || !result.data) {
        throw new NotFoundError('Bệnh nhân với số BHYT', bhytNumber);
      }

      ResponseHelper.success(res, result.data);

    } catch (error) {
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
  async updatePatient(req: Request, res: Response): Promise<void> {
    try {
      const { patientId } = req.params;
      const updateRequest: UpdatePatientRequest = req.body;

      this.logger.info('Updating patient', { patientId });

      const result = await this.updatePatientInfoUseCase.execute({
        patientId,
        ...updateRequest,
        updatedBy: getUserId(req)
      });

      if (!result.success) {
        throw new DomainError(result.errors?.[0] || 'Failed to update patient');
      }

      ResponseHelper.success(res, { success: true }, 'Cập nhật thông tin bệnh nhân thành công');

    } catch (error) {
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
  async searchPatients(req: Request, res: Response): Promise<void> {
    try {
      const { searchTerm, isActive, hasInsurance, page = '1', limit = '20' } = req.query;
      const requestedBy = getUserId(req);
      const requestedByRole = getUserRole(req);

      this.logger.info('Searching patients', { searchTerm, page, limit });

      const parsedPage = Number(page);
      const parsedLimit = Number(limit);
      const parsedIsActive =
        typeof isActive === 'string'
          ? isActive === 'true'
            ? true
            : isActive === 'false'
              ? false
              : undefined
          : undefined;
      const parsedHasInsurance =
        typeof hasInsurance === 'string'
          ? hasInsurance === 'true'
            ? true
            : hasInsurance === 'false'
              ? false
              : undefined
          : undefined;

      const query = {
        queryId: randomUUID(),
        queryType: 'SearchPatients' as const,
        timestamp: new Date(),
        requestedBy,
        data: {
          searchTerm: (searchTerm as string) || '',
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
        throw new DomainError(result.message);
      }

      ResponseHelper.paginated(
        res,
        result.data.patients,
        result.data.pagination.page,
        result.data.pagination.limit,
        result.data.pagination.total
      );

    } catch (error) {
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
  async matchPatients(req: Request, res: Response): Promise<void> {
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
        throw new DomainError(result.errors?.[0] || 'Failed to match patients');
      }

      const matches = result.data?.matches ?? [];

      ResponseHelper.success(
        res,
        matches,
        `Tìm thấy ${matches.length} kết quả khớp`
      );

    } catch (error) {
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
  async mergePatients(req: Request, res: Response): Promise<void> {
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
        throw new DomainError(result.errors?.[0] || 'Failed to merge patients');
      }

      ResponseHelper.success(res, {
        masterPatientId,
        duplicatePatientId,
        mergedAt: new Date().toISOString()
      }, 'Gộp bệnh nhân thành công');

    } catch (error) {
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
  async linkPatients(req: Request, res: Response): Promise<void> {
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
        throw new DomainError(result.errors?.[0] || 'Failed to link patients');
      }

      ResponseHelper.success(res, {
        patientId,
        otherPatientId,
        linkType,
        linkedAt: new Date().toISOString()
      }, 'Liên kết bệnh nhân thành công');

    } catch (error) {
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
  async deactivatePatient(req: Request, res: Response): Promise<void> {
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
        throw new DomainError(result.errors?.[0] || 'Failed to deactivate patient');
      }

      ResponseHelper.success(res, {
        patientId,
        deactivatedAt: new Date().toISOString()
      }, 'Vô hiệu hóa bệnh nhân thành công');

    } catch (error) {
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
  async validateInsurance(req: Request, res: Response): Promise<void> {
    try {
      const { patientId } = req.body;

      this.logger.info('Validating insurance', { patientId });

      const result = await this.validateInsuranceUseCase.execute({
        patientId,
        requestedBy: getUserId(req)
      });

      ResponseHelper.success(res, result, 'Kiểm tra bảo hiểm thành công');

    } catch (error) {
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
  async addEmergencyContact(req: Request, res: Response): Promise<void> {
    const { patientId } = req.params;
    const request: AddEmergencyContactRequest = req.body;
    const performedBy = getUserId(req);

    this.logger.info('Adding emergency contact', { patientId });

    const result = await this.addEmergencyContactUseCase.execute({
      patientId,
      ...request,
      performedBy
    });

    ResponseHelper.success(res, result, result.message);
  }

  /**
   * Get emergency contacts
   * GET /api/v1/patients/:patientId/emergency-contacts
   */
  async getEmergencyContacts(req: Request, res: Response): Promise<void> {
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

    ResponseHelper.success(res, result.data, result.message);
  }

  /**
   * Update emergency contact
   * PUT /api/v1/patients/:patientId/emergency-contacts/:contactId
   */
  async updateEmergencyContact(req: Request, res: Response): Promise<void> {
    const { patientId, contactId } = req.params;
    const request: UpdateEmergencyContactRequest = req.body;
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

    ResponseHelper.success(res, { contactId: result.contactId }, result.message);
  }

  /**
   * Remove emergency contact
   * DELETE /api/v1/patients/:patientId/emergency-contacts/:contactId
   */
  async removeEmergencyContact(req: Request, res: Response): Promise<void> {
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

    ResponseHelper.success(res, null, result.message);
  }

  /**
   * Set primary emergency contact
   * PUT /api/v1/patients/:patientId/emergency-contacts/:contactId/set-primary
   */
  async setPrimaryEmergencyContact(req: Request, res: Response): Promise<void> {
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

    ResponseHelper.success(res, null, result.message);
  }

  /**
   * Grant consent
   */
  async grantConsent(req: Request, res: Response): Promise<void> {
    const { patientId } = req.params;
    const request: GrantConsentRequest = req.body;
    const userId = getUserId(req);

    this.logger.info('Granting consent for patient', { patientId, consentType: request.consentType });

    const result = await this.grantConsentUseCase.execute({
      patientId,
      consentType: request.consentType,
      grantedBy: userId,
      expiresAt: request.expiresAt ? new Date(request.expiresAt) : undefined,
      performedBy: userId
    });

    ResponseHelper.success(res, result, result.message);
  }

  /**
   * Mark patient as deceased
   */
  async markAsDeceased(req: Request, res: Response): Promise<void> {
    const { patientId } = req.params;
    const performedBy = getUserId(req);

    this.logger.info('Marking patient as deceased', { patientId });

    const result = await this.markAsDeceasedUseCase.execute({
      patientId,
      performedBy
    });

    ResponseHelper.success(res, result, result.message);
  }

  /**
   * Reactivate patient
   */
  async reactivatePatient(req: Request, res: Response): Promise<void> {
    const { patientId } = req.params;
    const request: ReactivatePatientRequest = req.body;
    const performedBy = getUserId(req);

    this.logger.info('Reactivating patient', { patientId });

    const result = await this.reactivatePatientUseCase.execute({
      patientId,
      reason: request.reason,
      performedBy
    });

    ResponseHelper.success(res, result, result.message);
  }

  /**
   * Get all consents for a patient
   * GET /api/v1/patients/:patientId/consents
   */
  async getConsents(req: Request, res: Response): Promise<void> {
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

    ResponseHelper.success(res, result.data, result.message);
  }

  /**
   * Get consent details
   * GET /api/v1/patients/:patientId/consents/:consentId
   */
  async getConsentDetails(req: Request, res: Response): Promise<void> {
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

    ResponseHelper.success(res, result.data, result.message);
  }

  /**
   * Revoke consent
   * POST /api/v1/patients/:patientId/consents/:consentId/revoke
   */
  async revokeConsent(req: Request, res: Response): Promise<void> {
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

    ResponseHelper.success(res, { success: true }, result.message);
  }

  /**
   * Get active consents only
   * GET /api/v1/patients/:patientId/consents/active
   */
  async getActiveConsents(req: Request, res: Response): Promise<void> {
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

    ResponseHelper.success(res, result.data, result.message);
  }

  /**
   * Get insurance info
   * GET /api/v1/patients/:patientId/insurance
   */
  async getInsuranceInfo(req: Request, res: Response): Promise<void> {
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

    ResponseHelper.success(res, result.data, result.message);
  }

  /**
   * Update insurance info
   * PUT /api/v1/patients/:patientId/insurance
   */
  async updateInsuranceInfo(req: Request, res: Response): Promise<void> {
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

    ResponseHelper.success(res, { success: true }, result.message);
  }

  /**
   * Verify insurance
   * POST /api/v1/patients/:patientId/insurance/verify
   */
  async verifyInsurance(req: Request, res: Response): Promise<void> {
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

    ResponseHelper.success(res, result.data, result.message);
  }

  /**
   * Get patient statistics
   * GET /api/v1/patients/statistics
   */
  async getStatistics(req: Request, res: Response): Promise<void> {
    try {
      this.logger.info('Getting patient statistics');

      const statistics = await this.getPatientStatisticsUseCase.execute();

      ResponseHelper.success(res, statistics, 'Thống kê bệnh nhân thành công');
    } catch (error) {
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
  async uploadPhoto(req: Request, res: Response): Promise<void> {
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

      ResponseHelper.success(res, result, result.message);
    } catch (error) {
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
  async getPhoto(req: Request, res: Response): Promise<void> {
    try {
      const { patientId } = req.params;

      this.logger.info('Getting patient photo', { patientId });

      const result = await this.getPatientPhotoUseCase.execute({ patientId });

      ResponseHelper.success(res, result, 'Lấy ảnh bệnh nhân thành công');
    } catch (error) {
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
  async deletePhoto(req: Request, res: Response): Promise<void> {
    try {
      const { patientId } = req.params;
      const userId = getUserId(req);

      this.logger.info('Deleting patient photo', { patientId, userId });

      const result = await this.deletePatientPhotoUseCase.execute({
        patientId,
        deletedBy: userId
      });

      ResponseHelper.success(res, result, result.message);
    } catch (error) {
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
  async updateCommunicationPreferences(req: Request, res: Response): Promise<void> {
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

      ResponseHelper.success(res, result, result.message);
    } catch (error) {
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
  async getCommunicationPreferences(req: Request, res: Response): Promise<void> {
    try {
      const { patientId } = req.params;

      this.logger.info('Getting communication preferences', { patientId });

      const result = await this.getCommunicationPreferencesUseCase.execute({ patientId });

      ResponseHelper.success(res, result, 'Lấy tùy chọn liên hệ thành công');
    } catch (error) {
      this.logger.error('Failed to get communication preferences', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Lỗi khi lấy tùy chọn liên hệ'
      });
    }
  }
}
