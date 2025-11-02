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
import { DeleteMedicalRecordUseCase } from '../../application/use-cases/DeleteMedicalRecordUseCase';
import { ArchiveMedicalRecordUseCase } from '../../application/use-cases/ArchiveMedicalRecordUseCase';
import { RestoreMedicalRecordUseCase } from '../../application/use-cases/RestoreMedicalRecordUseCase';
import { AddDiagnosisUseCase } from '../../application/use-cases/AddDiagnosisUseCase';
import { RemoveDiagnosisUseCase } from '../../application/use-cases/RemoveDiagnosisUseCase';
import { AddMedicationUseCase } from '../../application/use-cases/AddMedicationUseCase';
import { RemoveMedicationUseCase } from '../../application/use-cases/RemoveMedicationUseCase';
import { UpdateVitalSignsUseCase } from '../../application/use-cases/UpdateVitalSignsUseCase';
import { ExportToFHIRUseCase } from '../../application/use-cases/ExportToFHIRUseCase';
import { ValidateFHIRComplianceUseCase } from '../../application/use-cases/ValidateFHIRComplianceUseCase';
import { GetDoctorMedicalRecordsUseCase } from '../../application/use-cases/GetDoctorMedicalRecordsUseCase';
import { GetMedicalRecordStatisticsUseCase } from '../../application/use-cases/GetMedicalRecordStatisticsUseCase';
import { GrantAccessUseCase } from '../../application/use-cases/GrantAccessUseCase';
import { RevokeAccessUseCase } from '../../application/use-cases/RevokeAccessUseCase';
import { AuditAccessHistoryUseCase } from '../../application/use-cases/AuditAccessHistoryUseCase';
import { BaseController } from './BaseController';
export declare class MedicalRecordController extends BaseController {
    private readonly createMedicalRecordUseCase;
    private readonly getMedicalRecordUseCase;
    private readonly getPatientMedicalRecordsUseCase;
    private readonly updateMedicalRecordUseCase;
    private readonly deleteMedicalRecordUseCase;
    private readonly archiveMedicalRecordUseCase;
    private readonly restoreMedicalRecordUseCase;
    private readonly addDiagnosisUseCase;
    private readonly removeDiagnosisUseCase;
    private readonly addMedicationUseCase;
    private readonly removeMedicationUseCase;
    private readonly updateVitalSignsUseCase;
    private readonly exportToFHIRUseCase;
    private readonly validateFHIRComplianceUseCase;
    private readonly getDoctorMedicalRecordsUseCase;
    private readonly getMedicalRecordStatisticsUseCase;
    private readonly grantAccessUseCase;
    private readonly revokeAccessUseCase;
    private readonly auditAccessHistoryUseCase;
    constructor(createMedicalRecordUseCase: CreateMedicalRecordUseCase, getMedicalRecordUseCase: GetMedicalRecordUseCase, getPatientMedicalRecordsUseCase: GetPatientMedicalRecordsUseCase, updateMedicalRecordUseCase: UpdateMedicalRecordUseCase, deleteMedicalRecordUseCase: DeleteMedicalRecordUseCase, archiveMedicalRecordUseCase: ArchiveMedicalRecordUseCase, restoreMedicalRecordUseCase: RestoreMedicalRecordUseCase, addDiagnosisUseCase: AddDiagnosisUseCase, removeDiagnosisUseCase: RemoveDiagnosisUseCase, addMedicationUseCase: AddMedicationUseCase, removeMedicationUseCase: RemoveMedicationUseCase, updateVitalSignsUseCase: UpdateVitalSignsUseCase, exportToFHIRUseCase: ExportToFHIRUseCase, validateFHIRComplianceUseCase: ValidateFHIRComplianceUseCase, getDoctorMedicalRecordsUseCase: GetDoctorMedicalRecordsUseCase, getMedicalRecordStatisticsUseCase: GetMedicalRecordStatisticsUseCase, grantAccessUseCase: GrantAccessUseCase, revokeAccessUseCase: RevokeAccessUseCase, auditAccessHistoryUseCase: AuditAccessHistoryUseCase);
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
     * Get medical record statistics
     * GET /api/v2/clinical-emr/statistics
     */
    getMedicalRecordStatistics(req: Request, res: Response): Promise<void>;
    /**
     * Archive medical record
     * POST /api/v2/clinical-emr/medical-records/:recordId/archive
     */
    archiveMedicalRecord(req: Request, res: Response): Promise<void>;
    /**
     * Restore medical record
     * POST /api/v2/clinical-emr/medical-records/:recordId/restore
     */
    restoreMedicalRecord(req: Request, res: Response): Promise<void>;
    /**
     * Delete medical record
     * DELETE /api/v2/clinical-emr/medical-records/:recordId
     */
    deleteMedicalRecord(req: Request, res: Response): Promise<void>;
    /**
     * Add diagnosis to medical record
     * POST /api/v2/clinical-emr/medical-records/:recordId/diagnoses
     */
    addDiagnosis(req: Request, res: Response): Promise<void>;
    /**
     * Remove diagnosis from medical record
     * DELETE /api/v2/clinical-emr/medical-records/:recordId/diagnoses/:diagnosisCode
     */
    removeDiagnosis(req: Request, res: Response): Promise<void>;
    /**
     * Add medication to medical record
     * POST /api/v2/clinical-emr/medical-records/:recordId/medications
     */
    addMedication(req: Request, res: Response): Promise<void>;
    /**
     * Remove medication from medical record
     * DELETE /api/v2/clinical-emr/medical-records/:recordId/medications/:medicationCode
     */
    removeMedication(req: Request, res: Response): Promise<void>;
    /**
     * Update vital signs
     * PUT /api/v2/clinical-emr/medical-records/:recordId/vital-signs
     */
    updateVitalSigns(req: Request, res: Response): Promise<void>;
    /**
     * Export to FHIR
     * GET /api/v2/clinical-emr/medical-records/:recordId/fhir
     */
    exportToFHIR(req: Request, res: Response): Promise<void>;
    /**
     * Validate FHIR compliance
     * GET /api/v2/clinical-emr/medical-records/:recordId/fhir/validate
     */
    validateFHIRCompliance(req: Request, res: Response): Promise<void>;
    /**
     * Get statistics (already exists but update to use new use case)
     * GET /api/v2/clinical-emr/statistics
     */
    getStatistics(req: Request, res: Response): Promise<void>;
    /**
     * Grant access to medical record
     * POST /api/v2/clinical-emr/medical-records/:recordId/access/grant
     */
    grantAccess(req: Request, res: Response): Promise<void>;
    /**
     * Revoke access to medical record
     * POST /api/v2/clinical-emr/medical-records/:recordId/access/revoke
     */
    revokeAccess(req: Request, res: Response): Promise<void>;
    /**
     * Audit access history
     * GET /api/v2/clinical-emr/medical-records/:recordId/access/audit
     */
    auditAccessHistory(req: Request, res: Response): Promise<void>;
    /**
     * Health check endpoint
     * GET /api/v2/clinical-emr/health
     */
    healthCheck(req: Request, res: Response): Promise<void>;
}
//# sourceMappingURL=MedicalRecordController.d.ts.map