/**
 * MedicalRecordController - Presentation Layer
 * REST API controller for medical records management
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, REST API, HIPAA, Vietnamese Healthcare Standards
 */
import { Request, Response } from 'express';
import { CreateMedicalRecordUseCase } from '../../application/use-cases/CreateMedicalRecordUseCase';
import { GetMedicalRecordUseCase } from '../../application/use-cases/GetMedicalRecordUseCase';
import { GetPatientMedicalRecordsUseCase } from '../../application/use-cases/GetPatientMedicalRecordsUseCase';
import { UpdateMedicalRecordUseCase } from '../../application/use-cases/UpdateMedicalRecordUseCase';
import { BaseHealthcareController } from '../../../shared/presentation/controllers/BaseHealthcareController';
export declare class MedicalRecordController extends BaseHealthcareController {
    private readonly createMedicalRecordUseCase;
    private readonly getMedicalRecordUseCase;
    private readonly getPatientMedicalRecordsUseCase;
    private readonly updateMedicalRecordUseCase;
    constructor(createMedicalRecordUseCase: CreateMedicalRecordUseCase, getMedicalRecordUseCase: GetMedicalRecordUseCase, getPatientMedicalRecordsUseCase: GetPatientMedicalRecordsUseCase, updateMedicalRecordUseCase: UpdateMedicalRecordUseCase);
    /**
     * Create new medical record
     * POST /api/v2/clinical-emr/medical-records
     */
    createMedicalRecord(req: Request, res: Response): Promise<void>;
    /**
     * Get medical record by ID
     * GET /api/v2/clinical-emr/medical-records/:recordId
     */
    getMedicalRecord(req: Request, res: Response): Promise<void>;
    /**
     * Get all medical records for a patient
     * GET /api/v2/clinical-emr/patients/:patientId/medical-records
     */
    getPatientMedicalRecords(req: Request, res: Response): Promise<void>;
    /**
     * Update medical record
     * PUT /api/v2/clinical-emr/medical-records/:recordId
     */
    updateMedicalRecord(req: Request, res: Response): Promise<void>;
    /**
     * Get medical records by doctor
     * GET /api/v2/clinical-emr/doctors/:doctorId/medical-records
     */
    getDoctorMedicalRecords(req: Request, res: Response): Promise<void>;
    /**
     * Archive medical record
     * POST /api/v2/clinical-emr/medical-records/:recordId/archive
     */
    archiveMedicalRecord(req: Request, res: Response): Promise<void>;
    /**
     * Restore archived medical record
     * POST /api/v2/clinical-emr/medical-records/:recordId/restore
     */
    restoreMedicalRecord(req: Request, res: Response): Promise<void>;
    /**
     * Get medical record statistics
     * GET /api/v2/clinical-emr/statistics
     */
    getMedicalRecordStatistics(req: Request, res: Response): Promise<void>;
    /**
     * Health check endpoint
     * GET /api/v2/clinical-emr/health
     */
    healthCheck(req: Request, res: Response): Promise<void>;
}
//# sourceMappingURL=MedicalRecordController.d.ts.map