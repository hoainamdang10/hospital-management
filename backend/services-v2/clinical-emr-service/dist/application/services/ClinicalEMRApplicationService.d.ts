/**
 * ClinicalEMRApplicationService - Application Layer
 * Main application service orchestrating all Clinical EMR operations
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, CQRS, HIPAA, Vietnamese Healthcare Standards
 */
import { CreateMedicalRecordUseCase } from '../use-cases/CreateMedicalRecordUseCase';
import { UpdateMedicalRecordUseCase } from '../use-cases/UpdateMedicalRecordUseCase';
import { GetMedicalRecordUseCase } from '../use-cases/GetMedicalRecordUseCase';
import { GetPatientMedicalRecordsUseCase } from '../use-cases/GetPatientMedicalRecordsUseCase';
import { GenerateMedicalReportUseCase } from '../use-cases/GenerateMedicalReportUseCase';
import { SearchMedicalRecordsUseCase } from '../use-cases/SearchMedicalRecordsUseCase';
import { AddDiagnosisCommandHandler } from '../handlers/commands/AddDiagnosisCommandHandler';
import { AddMedicationCommandHandler } from '../handlers/commands/AddMedicationCommandHandler';
import { GetMedicalRecordDetailsQueryHandler } from '../handlers/queries/GetMedicalRecordDetailsQueryHandler';
import { CreateMedicalRecordRequest, CreateMedicalRecordResponse } from '../dto/CreateMedicalRecordRequest';
import { UpdateMedicalRecordRequest, UpdateMedicalRecordResponse } from '../dto/UpdateMedicalRecordRequest';
import { GetMedicalRecordRequest } from '../dto/GetMedicalRecordRequest';
import { GetPatientMedicalRecordsRequest } from '../dto/GetPatientMedicalRecordsRequest';
import { GenerateMedicalReportRequest, GenerateMedicalReportResponse } from '../use-cases/GenerateMedicalReportUseCase';
import { SearchMedicalRecordsRequest, SearchMedicalRecordsResponse } from '../use-cases/SearchMedicalRecordsUseCase';
import { AddDiagnosisCommand, AddDiagnosisResponse } from '../handlers/commands/AddDiagnosisCommandHandler';
import { AddMedicationCommand, AddMedicationResponse } from '../handlers/commands/AddMedicationCommandHandler';
import { GetMedicalRecordDetailsQuery, MedicalRecordDetailsResponse } from '../handlers/queries/GetMedicalRecordDetailsQueryHandler';
/**
 * Clinical EMR Application Service
 * Orchestrates all medical record operations with proper error handling and logging
 */
export declare class ClinicalEMRApplicationService {
    private readonly createMedicalRecordUseCase;
    private readonly updateMedicalRecordUseCase;
    private readonly getMedicalRecordUseCase;
    private readonly getPatientMedicalRecordsUseCase;
    private readonly generateMedicalReportUseCase;
    private readonly searchMedicalRecordsUseCase;
    private readonly addDiagnosisCommandHandler;
    private readonly addMedicationCommandHandler;
    private readonly getMedicalRecordDetailsQueryHandler;
    constructor(createMedicalRecordUseCase: CreateMedicalRecordUseCase, updateMedicalRecordUseCase: UpdateMedicalRecordUseCase, getMedicalRecordUseCase: GetMedicalRecordUseCase, getPatientMedicalRecordsUseCase: GetPatientMedicalRecordsUseCase, generateMedicalReportUseCase: GenerateMedicalReportUseCase, searchMedicalRecordsUseCase: SearchMedicalRecordsUseCase, addDiagnosisCommandHandler: AddDiagnosisCommandHandler, addMedicationCommandHandler: AddMedicationCommandHandler, getMedicalRecordDetailsQueryHandler: GetMedicalRecordDetailsQueryHandler);
    /**
     * Create new medical record
     */
    createMedicalRecord(request: CreateMedicalRecordRequest, userId: string): Promise<CreateMedicalRecordResponse>;
    /**
     * Update existing medical record
     */
    updateMedicalRecord(request: UpdateMedicalRecordRequest, userId: string): Promise<UpdateMedicalRecordResponse>;
    /**
     * Get medical record by ID
     */
    getMedicalRecord(request: GetMedicalRecordRequest, userId: string): Promise<any>;
    /**
     * Get patient medical records
     */
    getPatientMedicalRecords(request: GetPatientMedicalRecordsRequest, userId: string): Promise<any>;
    /**
     * Generate medical report
     */
    generateMedicalReport(request: GenerateMedicalReportRequest, userId: string): Promise<GenerateMedicalReportResponse>;
    /**
     * Search medical records
     */
    searchMedicalRecords(request: SearchMedicalRecordsRequest, userId: string): Promise<SearchMedicalRecordsResponse>;
    /**
     * Add diagnosis to medical record
     */
    addDiagnosis(command: AddDiagnosisCommand, userId: string): Promise<AddDiagnosisResponse>;
    /**
     * Add medication to medical record
     */
    addMedication(command: AddMedicationCommand, userId: string): Promise<AddMedicationResponse>;
    /**
     * Get detailed medical record information
     */
    getMedicalRecordDetails(query: GetMedicalRecordDetailsQuery, userId: string): Promise<MedicalRecordDetailsResponse>;
    /**
     * Health check for the service
     */
    healthCheck(): Promise<{
        status: string;
        timestamp: string;
        services: any;
    }>;
    /**
     * Get service metrics
     */
    getMetrics(): Promise<any>;
}
//# sourceMappingURL=ClinicalEMRApplicationService.d.ts.map