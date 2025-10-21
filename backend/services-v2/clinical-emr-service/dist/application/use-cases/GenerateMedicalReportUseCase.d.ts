/**
 * GenerateMedicalReportUseCase - Application Layer
 * Use case for generating comprehensive medical reports
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, CQRS, HIPAA, Vietnamese Healthcare Standards
 */
import { BaseHealthcareUseCase, ValidationResult } from '../../../shared/application/use-cases/base/use-case.interface';
import { IMedicalRecordRepository } from '../../domain/repositories/IMedicalRecordRepository';
/**
 * Report Type Enumeration
 */
export declare enum ReportType {
    SUMMARY = "summary",// Báo cáo tóm tắt
    DETAILED = "detailed",// Báo cáo chi tiết
    FHIR_EXPORT = "fhir-export",// Xuất FHIR
    DISCHARGE_SUMMARY = "discharge-summary",// Tóm tắt xuất viện
    PRESCRIPTION = "prescription",// Đơn thuốc
    DIAGNOSIS_REPORT = "diagnosis-report",// Báo cáo chẩn đoán
    TREATMENT_PLAN = "treatment-plan"
}
/**
 * Report Format Enumeration
 */
export declare enum ReportFormat {
    JSON = "json",
    PDF = "pdf",
    HTML = "html",
    FHIR_JSON = "fhir-json",
    XML = "xml"
}
/**
 * Generate Medical Report Request
 */
export interface GenerateMedicalReportRequest {
    recordId: string;
    reportType: ReportType;
    format: ReportFormat;
    requestedBy: string;
    includeDiagnoses?: boolean;
    includeMedications?: boolean;
    includeVitalSigns?: boolean;
    includeNotes?: boolean;
    includeAccessLog?: boolean;
    fromDate?: string;
    toDate?: string;
    includeVietnameseTranslation?: boolean;
    includeHospitalHeader?: boolean;
    hospitalCode?: string;
    fhirProfile?: string;
    includeReferences?: boolean;
    watermark?: string;
    confidentialityLevel?: 'normal' | 'restricted' | 'confidential';
}
/**
 * Generate Medical Report Response
 */
export interface GenerateMedicalReportResponse {
    success: boolean;
    message: string;
    data?: {
        reportId: string;
        recordId: string;
        reportType: ReportType;
        format: ReportFormat;
        generatedAt: string;
        generatedBy: string;
        content: any;
        metadata: {
            patientId: string;
            doctorId: string;
            visitDate: string;
            diagnosesCount: number;
            medicationsCount: number;
            fhirCompliant: boolean;
            confidentialityLevel: string;
            watermark?: string;
        };
        downloadUrl?: string;
        expiresAt?: string;
    };
    errors?: Array<{
        field: string;
        message: string;
        code: string;
    }>;
}
/**
 * Medical Report Generator Use Case
 */
export declare class GenerateMedicalReportUseCase extends BaseHealthcareUseCase<GenerateMedicalReportRequest, GenerateMedicalReportResponse> {
    private readonly medicalRecordRepository;
    constructor(medicalRecordRepository: IMedicalRecordRepository);
    /**
     * Execute the use case
     */
    protected executeInternal(request: GenerateMedicalReportRequest): Promise<GenerateMedicalReportResponse>;
    /**
     * Generate report content based on type and format
     */
    private generateReportContent;
    /**
     * Generate summary report
     */
    private generateSummaryReport;
    /**
     * Generate detailed report
     */
    private generateDetailedReport;
    /**
     * Generate FHIR report
     */
    private generateFHIRReport;
    /**
     * Generate discharge summary
     */
    private generateDischargeSummary;
    /**
     * Generate prescription report
     */
    private generatePrescriptionReport;
    /**
     * Generate diagnosis report
     */
    private generateDiagnosisReport;
    /**
     * Generate treatment plan
     */
    private generateTreatmentPlan;
    /**
     * Format report based on requested format
     */
    private formatReport;
    /**
     * Convert content to HTML format
     */
    private convertToHTML;
    /**
     * Convert content to XML format
     */
    private convertToXML;
    /**
     * Generate unique report ID
     */
    private generateReportId;
    /**
     * Generate download URL for report
     */
    private generateDownloadUrl;
    /**
     * Calculate report expiration date
     */
    private calculateExpirationDate;
    /**
     * Get Vietnamese report type name
     */
    private getReportTypeVietnamese;
    /**
     * Validate request
     */
    validate(request: GenerateMedicalReportRequest): Promise<ValidationResult>;
    /**
     * Check authorization
     */
    authorize(request: GenerateMedicalReportRequest, userId: string): Promise<boolean>;
    /**
     * Check if involves PHI
     */
    involvesPHI(request: GenerateMedicalReportRequest): boolean;
    /**
     * Get patient ID
     */
    getPatientId(request: GenerateMedicalReportRequest): string | null;
    /**
     * Get use case description
     */
    getDescription(): string;
    /**
     * Get required permissions
     */
    getRequiredPermissions(): string[];
}
//# sourceMappingURL=GenerateMedicalReportUseCase.d.ts.map