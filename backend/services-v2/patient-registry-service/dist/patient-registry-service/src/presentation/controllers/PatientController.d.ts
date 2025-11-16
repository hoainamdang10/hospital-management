/**
 * PatientController - Presentation Layer
 * Handles HTTP requests for Patient Registry operations
 *
 * @author Hospital Management Team
 * @version 2.0.0 (MVP Scope - Graduation Project)
 * @compliance Clean Architecture, RESTful API, HIPAA
 * @scope-reduction 2025-01-15: Removed 20 post-MVP use cases for graduation project
 */
import { Request, Response } from 'express';
import { ILogger } from '../../../../shared/application/services/logger.interface';
import { RegisterPatientUseCase } from '../../application/use-cases/RegisterPatientUseCase';
import { UpdatePatientInfoUseCase } from '../../application/use-cases/UpdatePatientInfoUseCase';
import { PatientQueryHandlers } from '../../application/handlers/PatientQueryHandlers';
import { ValidateInsuranceUseCase } from '../../application/use-cases/ValidateInsuranceUseCase';
import { AddEmergencyContactUseCase } from '../../application/use-cases/AddEmergencyContactUseCase';
import { GetEmergencyContactsUseCase } from '../../application/use-cases/GetEmergencyContactsUseCase';
import { UpdateEmergencyContactUseCase } from '../../application/use-cases/UpdateEmergencyContactUseCase';
import { GetInsuranceInfoUseCase } from '../../application/use-cases/GetInsuranceInfoUseCase';
import { AddInsuranceInfoUseCase } from '../../application/use-cases/AddInsuranceInfoUseCase';
import { UpdateInsuranceInfoUseCase } from '../../application/use-cases/UpdateInsuranceInfoUseCase';
import { VerifyInsuranceUseCase } from '../../application/use-cases/VerifyInsuranceUseCase';
/**
 * Patient Controller
 * @version 2.0.0 (MVP Scope - Graduation Project)
 * @scope-reduction 2025-01-15: Constructor reduced from 32 to 12 dependencies
 */
export declare class PatientController {
    private logger;
    private registerPatientUseCase;
    private updatePatientInfoUseCase;
    private patientQueryHandlers;
    private validateInsuranceUseCase;
    private getInsuranceInfoUseCase;
    private addInsuranceInfoUseCase;
    private updateInsuranceInfoUseCase;
    private verifyInsuranceUseCase;
    private addEmergencyContactUseCase;
    private getEmergencyContactsUseCase;
    private updateEmergencyContactUseCase;
    constructor(logger: ILogger, registerPatientUseCase: RegisterPatientUseCase, updatePatientInfoUseCase: UpdatePatientInfoUseCase, patientQueryHandlers: PatientQueryHandlers, validateInsuranceUseCase: ValidateInsuranceUseCase, getInsuranceInfoUseCase: GetInsuranceInfoUseCase, addInsuranceInfoUseCase: AddInsuranceInfoUseCase, updateInsuranceInfoUseCase: UpdateInsuranceInfoUseCase, verifyInsuranceUseCase: VerifyInsuranceUseCase, addEmergencyContactUseCase: AddEmergencyContactUseCase, getEmergencyContactsUseCase: GetEmergencyContactsUseCase, updateEmergencyContactUseCase: UpdateEmergencyContactUseCase);
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
     * Add insurance info after registration
     */
    addInsuranceInfo(req: Request, res: Response): Promise<void>;
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
}
//# sourceMappingURL=PatientController.d.ts.map