/**
 * PatientController - Presentation Layer
 * Handles HTTP requests for Patient Registry operations
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, RESTful API, HIPAA
 */
import { Request, Response } from 'express';
import { ILogger } from '@shared/application/services/logger.interface';
import { RegisterPatientUseCase } from '../../application/use-cases/RegisterPatientUseCase';
import { UpdatePatientInfoUseCase } from '../../application/use-cases/UpdatePatientInfoUseCase';
import { GetPatientProfileUseCase } from '../../application/use-cases/GetPatientProfileUseCase';
import { SearchPatientsUseCase } from '../../application/use-cases/SearchPatientsUseCase';
import { MatchPatientsUseCase } from '../../application/use-cases/MatchPatientsUseCase';
import { MergePatientsUseCase } from '../../application/use-cases/MergePatientsUseCase';
import { LinkPatientsUseCase } from '../../application/use-cases/LinkPatientsUseCase';
import { DeactivatePatientUseCase } from '../../application/use-cases/DeactivatePatientUseCase';
import { ValidateInsuranceUseCase } from '../../application/use-cases/ValidateInsuranceUseCase';
import { AddEmergencyContactUseCase } from '../../application/use-cases/AddEmergencyContactUseCase';
import { GrantConsentUseCase } from '../../application/use-cases/GrantConsentUseCase';
import { MarkAsDeceasedUseCase } from '../../application/use-cases/MarkAsDeceasedUseCase';
import { ReactivatePatientUseCase } from '../../application/use-cases/ReactivatePatientUseCase';
/**
 * Patient Controller
 */
export declare class PatientController {
    private logger;
    private registerPatientUseCase;
    private updatePatientInfoUseCase;
    private getPatientProfileUseCase;
    private searchPatientsUseCase;
    private matchPatientsUseCase;
    private mergePatientsUseCase;
    private linkPatientsUseCase;
    private deactivatePatientUseCase;
    private validateInsuranceUseCase;
    private addEmergencyContactUseCase;
    private grantConsentUseCase;
    private markAsDeceasedUseCase;
    private reactivatePatientUseCase;
    constructor(logger: ILogger, registerPatientUseCase: RegisterPatientUseCase, updatePatientInfoUseCase: UpdatePatientInfoUseCase, getPatientProfileUseCase: GetPatientProfileUseCase, searchPatientsUseCase: SearchPatientsUseCase, matchPatientsUseCase: MatchPatientsUseCase, mergePatientsUseCase: MergePatientsUseCase, linkPatientsUseCase: LinkPatientsUseCase, deactivatePatientUseCase: DeactivatePatientUseCase, validateInsuranceUseCase: ValidateInsuranceUseCase, addEmergencyContactUseCase: AddEmergencyContactUseCase, grantConsentUseCase: GrantConsentUseCase, markAsDeceasedUseCase: MarkAsDeceasedUseCase, reactivatePatientUseCase: ReactivatePatientUseCase);
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
     */
    updatePatient(req: Request, res: Response): Promise<void>;
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
     */
    addEmergencyContact(req: Request, res: Response): Promise<void>;
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
}
//# sourceMappingURL=PatientController.d.ts.map