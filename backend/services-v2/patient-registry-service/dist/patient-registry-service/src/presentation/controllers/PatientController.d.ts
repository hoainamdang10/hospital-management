/**
 * PatientController - Presentation Layer
 * Handles HTTP requests for Patient Registry operations
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, RESTful API, HIPAA
 */
import { Request, Response } from 'express';
import { ILogger } from '../../../../shared/application/services/logger.interface';
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
import { AddInsuranceInfoUseCase } from '../../application/use-cases/AddInsuranceInfoUseCase';
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
import { GetPatientHistoryUseCase } from '../../application/use-cases/GetPatientHistoryUseCase';
/**
 * Patient Controller
 */
export declare class PatientController {
    private logger;
    private registerPatientUseCase;
    private updatePatientInfoUseCase;
    private matchPatientsUseCase;
    private mergePatientsUseCase;
    private linkPatientsUseCase;
    private deactivatePatientUseCase;
    private validateInsuranceUseCase;
    private addEmergencyContactUseCase;
    private getEmergencyContactsUseCase;
    private updateEmergencyContactUseCase;
    private removeEmergencyContactUseCase;
    private setPrimaryEmergencyContactUseCase;
    private grantConsentUseCase;
    private getConsentsUseCase;
    private getConsentDetailsUseCase;
    private revokeConsentUseCase;
    private getActiveConsentsUseCase;
    private getInsuranceInfoUseCase;
    private addInsuranceInfoUseCase;
    private updateInsuranceInfoUseCase;
    private verifyInsuranceUseCase;
    private markAsDeceasedUseCase;
    private reactivatePatientUseCase;
    private getPatientStatisticsUseCase;
    private uploadPatientPhotoUseCase;
    private getPatientPhotoUseCase;
    private deletePatientPhotoUseCase;
    private updateCommunicationPreferencesUseCase;
    private getCommunicationPreferencesUseCase;
    private getPatientHistoryUseCase;
    private patientQueryHandlers;
    constructor(logger: ILogger, registerPatientUseCase: RegisterPatientUseCase, updatePatientInfoUseCase: UpdatePatientInfoUseCase, matchPatientsUseCase: MatchPatientsUseCase, mergePatientsUseCase: MergePatientsUseCase, linkPatientsUseCase: LinkPatientsUseCase, deactivatePatientUseCase: DeactivatePatientUseCase, validateInsuranceUseCase: ValidateInsuranceUseCase, addEmergencyContactUseCase: AddEmergencyContactUseCase, getEmergencyContactsUseCase: GetEmergencyContactsUseCase, updateEmergencyContactUseCase: UpdateEmergencyContactUseCase, removeEmergencyContactUseCase: RemoveEmergencyContactUseCase, setPrimaryEmergencyContactUseCase: SetPrimaryEmergencyContactUseCase, grantConsentUseCase: GrantConsentUseCase, getConsentsUseCase: GetConsentsUseCase, getConsentDetailsUseCase: GetConsentDetailsUseCase, revokeConsentUseCase: RevokeConsentUseCase, getActiveConsentsUseCase: GetActiveConsentsUseCase, getInsuranceInfoUseCase: GetInsuranceInfoUseCase, addInsuranceInfoUseCase: AddInsuranceInfoUseCase, updateInsuranceInfoUseCase: UpdateInsuranceInfoUseCase, verifyInsuranceUseCase: VerifyInsuranceUseCase, markAsDeceasedUseCase: MarkAsDeceasedUseCase, reactivatePatientUseCase: ReactivatePatientUseCase, getPatientStatisticsUseCase: GetPatientStatisticsUseCase, uploadPatientPhotoUseCase: UploadPatientPhotoUseCase, getPatientPhotoUseCase: GetPatientPhotoUseCase, deletePatientPhotoUseCase: DeletePatientPhotoUseCase, updateCommunicationPreferencesUseCase: UpdateCommunicationPreferencesUseCase, getCommunicationPreferencesUseCase: GetCommunicationPreferencesUseCase, getPatientHistoryUseCase: GetPatientHistoryUseCase, patientQueryHandlers: PatientQueryHandlers);
    /**
     * Register new patient
     * POST /api/v1/patients
     */
    registerPatient(req: Request, res: Response): Promise<void>;
    /**
     * Get patient by ID
     * GET /api/v1/patients/:patientId
     */
    getPatientById(req: Request, res: Response): Promise<void>;
    /**
     * Get patient by user ID
     * GET /api/v1/patients/user/:userId
     */
    getPatientByUserId(req: Request, res: Response): Promise<void>;
    /**
     * Get patient by national ID
     * GET /api/v1/patients/national-id/:nationalId
     */
    getPatientByNationalId(req: Request, res: Response): Promise<void>;
    /**
     * Get patient by BHYT number
     * GET /api/v1/patients/bhyt/:bhytNumber
     */
    getPatientByBHYTNumber(req: Request, res: Response): Promise<void>;
    /**
     * Update patient information
     * PUT /api/v1/patients/:patientId
     *
     * Uses smart defaults "Chưa cập nhật" and proper merge logic
     * - undefined = no change (preserve existing value)
     * - explicit value (including "Chưa cập nhật") = user intended change
     */
    updatePatient(req: Request, res: Response): Promise<void>;
    /**
     * Get patient list with pagination
     * GET /api/v1/patients
     */
    getPatientList(req: Request, res: Response): Promise<void>;
    /**
     * Search patients
     * GET /api/v1/patients/search?searchTerm=...
     */
    searchPatients(req: Request, res: Response): Promise<void>;
    /**
     * Match patients (PMI)
     * POST /api/v1/patients/match
     */
    matchPatients(req: Request, res: Response): Promise<void>;
    /**
     * Merge patients
     * POST /api/v1/patients/merge
     */
    mergePatients(req: Request, res: Response): Promise<void>;
    /**
     * Link patients
     * POST /api/v1/patients/:patientId/link
     */
    linkPatients(req: Request, res: Response): Promise<void>;
    /**
     * Deactivate patient
     * POST /api/v1/patients/:patientId/deactivate
     */
    deactivatePatient(req: Request, res: Response): Promise<void>;
    /**
     * Validate insurance
     * POST /api/v1/patients/validate-insurance
     */
    validateInsurance(req: Request, res: Response): Promise<void>;
    /**
     * Add emergency contact
     * POST /api/v1/patients/:patientId/emergency-contacts
     */
    addEmergencyContact(req: Request, res: Response): Promise<void>;
    /**
     * Get emergency contacts
     * GET /api/v1/patients/:patientId/emergency-contacts
     */
    getEmergencyContacts(req: Request, res: Response): Promise<void>;
    /**
     * Update emergency contact
     * PUT /api/v1/patients/:patientId/emergency-contacts/:contactId
     */
    updateEmergencyContact(req: Request, res: Response): Promise<void>;
    /**
     * Remove emergency contact
     * DELETE /api/v1/patients/:patientId/emergency-contacts/:contactId
     */
    removeEmergencyContact(req: Request, res: Response): Promise<void>;
    /**
     * Set primary emergency contact
     * PUT /api/v1/patients/:patientId/emergency-contacts/:contactId/set-primary
     */
    setPrimaryEmergencyContact(req: Request, res: Response): Promise<void>;
    /**
     * Grant consent
     */
    grantConsent(req: Request, res: Response): Promise<void>;
    /**
     * Mark patient as deceased
     */
    markAsDeceased(req: Request, res: Response): Promise<void>;
    /**
     * Reactivate patient
     */
    reactivatePatient(req: Request, res: Response): Promise<void>;
    /**
     * Add insurance info after registration
     */
    addInsuranceInfo(req: Request, res: Response): Promise<void>;
    /**
     * Get all consents for a patient
     * GET /api/v1/patients/:patientId/consents
     */
    getConsents(req: Request, res: Response): Promise<void>;
    /**
     * Get consent details
     * GET /api/v1/patients/:patientId/consents/:consentId
     */
    getConsentDetails(req: Request, res: Response): Promise<void>;
    /**
     * Revoke consent
     * POST /api/v1/patients/:patientId/consents/:consentId/revoke
     */
    revokeConsent(req: Request, res: Response): Promise<void>;
    /**
     * Get active consents only
     * GET /api/v1/patients/:patientId/consents/active
     */
    getActiveConsents(req: Request, res: Response): Promise<void>;
    /**
     * Get insurance info
     * GET /api/v1/patients/:patientId/insurance
     */
    getInsuranceInfo(req: Request, res: Response): Promise<void>;
    /**
     * Update insurance info
     * PUT /api/v1/patients/:patientId/insurance
     */
    updateInsuranceInfo(req: Request, res: Response): Promise<void>;
    /**
     * Verify insurance
     * POST /api/v1/patients/:patientId/insurance/verify
     */
    verifyInsurance(req: Request, res: Response): Promise<void>;
    /**
     * Get patient statistics
     * GET /api/v1/patients/statistics
     */
    getStatistics(req: Request, res: Response): Promise<void>;
    /**
     * Upload patient photo
     * POST /api/v1/patients/:patientId/photo
     */
    uploadPhoto(req: Request, res: Response): Promise<void>;
    /**
     * Get patient photo
     * GET /api/v1/patients/:patientId/photo
     */
    getPhoto(req: Request, res: Response): Promise<void>;
    /**
     * Delete patient photo
     * DELETE /api/v1/patients/:patientId/photo
     */
    deletePhoto(req: Request, res: Response): Promise<void>;
    /**
     * Update communication preferences
     * PUT /api/v1/patients/:patientId/communication
     */
    updateCommunicationPreferences(req: Request, res: Response): Promise<void>;
    /**
     * Get communication preferences
     * GET /api/v1/patients/:patientId/communication
     */
    getCommunicationPreferences(req: Request, res: Response): Promise<void>;
    /**
     * Get patient history (audit logs and access logs)
     * GET /api/v1/patients/:patientId/history
     */
    getPatientHistory(req: Request, res: Response): Promise<void>;
}
//# sourceMappingURL=PatientController.d.ts.map