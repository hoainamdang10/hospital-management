"use strict";
/**
 * GenerateMedicalReportUseCase - Application Layer
 * Use case for generating comprehensive medical reports
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, CQRS, HIPAA, Vietnamese Healthcare Standards
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.GenerateMedicalReportUseCase = exports.ReportFormat = exports.ReportType = void 0;
const use_case_interface_1 = require("../../../shared/application/use-cases/base/use-case.interface");
const RecordId_1 = require("../../domain/value-objects/RecordId");
/**
 * Report Type Enumeration
 */
var ReportType;
(function (ReportType) {
    ReportType["SUMMARY"] = "summary";
    ReportType["DETAILED"] = "detailed";
    ReportType["FHIR_EXPORT"] = "fhir-export";
    ReportType["DISCHARGE_SUMMARY"] = "discharge-summary";
    ReportType["PRESCRIPTION"] = "prescription";
    ReportType["DIAGNOSIS_REPORT"] = "diagnosis-report";
    ReportType["TREATMENT_PLAN"] = "treatment-plan"; // Kế hoạch điều trị
})(ReportType || (exports.ReportType = ReportType = {}));
/**
 * Report Format Enumeration
 */
var ReportFormat;
(function (ReportFormat) {
    ReportFormat["JSON"] = "json";
    ReportFormat["PDF"] = "pdf";
    ReportFormat["HTML"] = "html";
    ReportFormat["FHIR_JSON"] = "fhir-json";
    ReportFormat["XML"] = "xml";
})(ReportFormat || (exports.ReportFormat = ReportFormat = {}));
/**
 * Medical Report Generator Use Case
 */
class GenerateMedicalReportUseCase extends use_case_interface_1.BaseHealthcareUseCase {
    constructor(medicalRecordRepository) {
        super();
        this.medicalRecordRepository = medicalRecordRepository;
    }
    /**
     * Execute the use case
     */
    async executeInternal(request) {
        try {
            // Create RecordId value object
            const recordId = RecordId_1.RecordId.create(request.recordId);
            // Find medical record
            const medicalRecord = await this.medicalRecordRepository.findById(recordId);
            if (!medicalRecord) {
                return {
                    success: false,
                    message: `Không tìm thấy hồ sơ bệnh án với ID: ${request.recordId}`,
                    errors: [{
                            field: 'recordId',
                            message: `Hồ sơ bệnh án với ID ${request.recordId} không tồn tại`,
                            code: 'MEDICAL_RECORD_NOT_FOUND'
                        }]
                };
            }
            // Check if record is accessible
            if (medicalRecord.isDeleted()) {
                return {
                    success: false,
                    message: 'Không thể tạo báo cáo cho hồ sơ bệnh án đã bị xóa',
                    errors: [{
                            field: 'recordId',
                            message: 'Hồ sơ bệnh án này đã bị xóa',
                            code: 'MEDICAL_RECORD_DELETED'
                        }]
                };
            }
            // Log access for HIPAA compliance
            medicalRecord.recordReadAccess(request.requestedBy, `Tạo báo cáo ${request.reportType} định dạng ${request.format}`);
            // Generate report content based on type
            const reportContent = await this.generateReportContent(medicalRecord, request);
            // Generate report ID
            const reportId = this.generateReportId(request.reportType, request.recordId);
            // Create metadata
            const metadata = {
                patientId: medicalRecord.patientId,
                doctorId: medicalRecord.doctorId,
                visitDate: medicalRecord.visitDate.toISOString(),
                diagnosesCount: medicalRecord.diagnoses.length,
                medicationsCount: medicalRecord.medications.length,
                fhirCompliant: medicalRecord.isFHIRCompliant(),
                confidentialityLevel: request.confidentialityLevel || 'normal',
                watermark: request.watermark
            };
            // Update medical record with access log
            await this.medicalRecordRepository.update(medicalRecord);
            return {
                success: true,
                message: `Báo cáo ${this.getReportTypeVietnamese(request.reportType)} đã được tạo thành công`,
                data: {
                    reportId,
                    recordId: request.recordId,
                    reportType: request.reportType,
                    format: request.format,
                    generatedAt: new Date().toISOString(),
                    generatedBy: request.requestedBy,
                    content: reportContent,
                    metadata,
                    downloadUrl: this.generateDownloadUrl(reportId, request.format),
                    expiresAt: this.calculateExpirationDate().toISOString()
                }
            };
        }
        catch (error) {
            // Handle RecordId validation errors
            if (error instanceof Error && error.message.includes('định dạng')) {
                return {
                    success: false,
                    message: 'Định dạng RecordId không hợp lệ',
                    errors: [{
                            field: 'recordId',
                            message: error.message,
                            code: 'INVALID_RECORD_ID_FORMAT'
                        }]
                };
            }
            // Handle other errors
            throw new Error(`Lỗi khi tạo báo cáo y tế: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    /**
     * Generate report content based on type and format
     */
    async generateReportContent(medicalRecord, request) {
        switch (request.reportType) {
            case ReportType.SUMMARY:
                return this.generateSummaryReport(medicalRecord, request);
            case ReportType.DETAILED:
                return this.generateDetailedReport(medicalRecord, request);
            case ReportType.FHIR_EXPORT:
                return this.generateFHIRReport(medicalRecord, request);
            case ReportType.DISCHARGE_SUMMARY:
                return this.generateDischargeSummary(medicalRecord, request);
            case ReportType.PRESCRIPTION:
                return this.generatePrescriptionReport(medicalRecord, request);
            case ReportType.DIAGNOSIS_REPORT:
                return this.generateDiagnosisReport(medicalRecord, request);
            case ReportType.TREATMENT_PLAN:
                return this.generateTreatmentPlan(medicalRecord, request);
            default:
                throw new Error(`Loại báo cáo không được hỗ trợ: ${request.reportType}`);
        }
    }
    /**
     * Generate summary report
     */
    generateSummaryReport(medicalRecord, request) {
        const report = {
            title: 'Báo cáo tóm tắt hồ sơ bệnh án',
            recordId: medicalRecord.recordId.value,
            patientId: medicalRecord.patientId,
            doctorId: medicalRecord.doctorId,
            visitDate: medicalRecord.visitDate.toISOString(),
            summary: medicalRecord.getSummary(),
            basicInfo: {
                symptoms: medicalRecord.symptoms,
                examinationNotes: medicalRecord.examinationNotes,
                notes: medicalRecord.notes
            },
            diagnoses: request.includeDiagnoses !== false ?
                medicalRecord.diagnoses.map(d => ({
                    code: d.code,
                    display: d.display,
                    category: d.category,
                    severity: d.severity,
                    status: d.status,
                    vietnameseSummary: d.getVietnameseSummary()
                })) : [],
            medications: request.includeMedications !== false ?
                medicalRecord.medications.filter(m => m.isActive()).map(m => ({
                    code: m.code,
                    name: m.name,
                    dosage: m.dosage,
                    frequency: m.frequency,
                    vietnameseSummary: m.getVietnameseSummary()
                })) : [],
            vitalSigns: request.includeVitalSigns !== false && medicalRecord.vitalSigns ?
                medicalRecord.vitalSigns.toJSON() : null,
            status: medicalRecord.status,
            createdAt: medicalRecord.createdAt.toISOString(),
            updatedAt: medicalRecord.updatedAt.toISOString()
        };
        return this.formatReport(report, request.format);
    }
    /**
     * Generate detailed report
     */
    generateDetailedReport(medicalRecord, request) {
        const report = {
            title: 'Báo cáo chi tiết hồ sơ bệnh án',
            recordId: medicalRecord.recordId.value,
            patientInformation: {
                patientId: medicalRecord.patientId,
                visitDate: medicalRecord.visitDate.toISOString()
            },
            providerInformation: {
                doctorId: medicalRecord.doctorId,
                specialtyCode: medicalRecord.specialtyCode,
                createdBy: medicalRecord.createdBy,
                updatedBy: medicalRecord.updatedBy
            },
            clinicalInformation: {
                symptoms: medicalRecord.symptoms,
                examinationNotes: medicalRecord.examinationNotes,
                notes: medicalRecord.notes,
                diagnoses: medicalRecord.diagnoses.map(d => ({
                    ...d.toJSON(),
                    vietnameseSummary: d.getVietnameseSummary(),
                    isPrimary: d.isPrimary(),
                    isConfirmed: d.isConfirmed(),
                    isCritical: d.isCritical()
                })),
                medications: medicalRecord.medications.map(m => ({
                    ...m.toJSON(),
                    vietnameseSummary: m.getVietnameseSummary(),
                    isActive: m.isActive(),
                    isHighPriority: m.isHighPriority(),
                    isExpired: m.isExpired()
                })),
                vitalSigns: medicalRecord.vitalSigns?.toJSON()
            },
            administrativeInformation: {
                status: medicalRecord.status,
                fhirResourceId: medicalRecord.fhirResourceId,
                createdAt: medicalRecord.createdAt.toISOString(),
                updatedAt: medicalRecord.updatedAt.toISOString(),
                lastAccessInfo: medicalRecord.getLastAccessInfo()
            },
            complianceInformation: {
                fhirCompliant: medicalRecord.isFHIRCompliant(),
                fhirValidation: medicalRecord.validateFHIRCompliance(),
                hasBeenAccessed: medicalRecord.hasBeenAccessed(),
                accessLogCount: medicalRecord.accessLog?.length || 0
            }
        };
        // Include access log if requested and authorized
        if (request.includeAccessLog === true) {
            report.administrativeInformation.accessLog = medicalRecord.accessLog;
        }
        return this.formatReport(report, request.format);
    }
    /**
     * Generate FHIR report
     */
    generateFHIRReport(medicalRecord, request) {
        const fhirResource = medicalRecord.toFHIR();
        if (request.fhirProfile) {
            fhirResource.meta.profile = [request.fhirProfile];
        }
        // Add Vietnamese extensions
        if (request.includeVietnameseTranslation) {
            fhirResource.extension = fhirResource.extension || [];
            fhirResource.extension.push({
                url: 'http://moh.gov.vn/fhir/StructureDefinition/vietnamese-translation',
                valueString: medicalRecord.getSummary()
            });
        }
        return request.format === ReportFormat.FHIR_JSON ? fhirResource : this.formatReport(fhirResource, request.format);
    }
    /**
     * Generate discharge summary
     */
    generateDischargeSummary(medicalRecord, request) {
        const primaryDiagnosis = medicalRecord.diagnoses.find(d => d.isPrimary());
        const activeMedications = medicalRecord.medications.filter(m => m.isActive());
        const report = {
            title: 'Tóm tắt xuất viện',
            recordId: medicalRecord.recordId.value,
            patientId: medicalRecord.patientId,
            doctorId: medicalRecord.doctorId,
            visitDate: medicalRecord.visitDate.toISOString(),
            admissionSummary: {
                symptoms: medicalRecord.symptoms,
                examinationFindings: medicalRecord.examinationNotes
            },
            primaryDiagnosis: primaryDiagnosis ? {
                code: primaryDiagnosis.code,
                display: primaryDiagnosis.display,
                severity: primaryDiagnosis.severity,
                vietnameseSummary: primaryDiagnosis.getVietnameseSummary()
            } : null,
            secondaryDiagnoses: medicalRecord.diagnoses
                .filter(d => !d.isPrimary())
                .map(d => ({
                code: d.code,
                display: d.display,
                category: d.category,
                vietnameseSummary: d.getVietnameseSummary()
            })),
            dischargeMedications: activeMedications.map(m => ({
                name: m.name,
                dosage: m.dosage,
                frequency: m.frequency,
                instructions: m.instructions,
                vietnameseSummary: m.getVietnameseSummary()
            })),
            followUpInstructions: medicalRecord.notes,
            dischargeDate: new Date().toISOString(),
            dischargedBy: request.requestedBy
        };
        return this.formatReport(report, request.format);
    }
    /**
     * Generate prescription report
     */
    generatePrescriptionReport(medicalRecord, request) {
        const activeMedications = medicalRecord.medications.filter(m => m.isActive());
        const report = {
            title: 'Đơn thuốc',
            recordId: medicalRecord.recordId.value,
            patientId: medicalRecord.patientId,
            doctorId: medicalRecord.doctorId,
            prescriptionDate: new Date().toISOString(),
            medications: activeMedications.map((m, index) => ({
                stt: index + 1,
                name: m.name,
                genericName: m.genericName,
                strength: m.strength,
                dosageForm: m.dosageForm,
                dosage: m.dosage,
                frequency: m.frequency,
                duration: m.duration,
                instructions: m.instructions,
                specialInstructions: m.specialInstructions,
                vietnameseSummary: m.getVietnameseSummary()
            })),
            totalMedications: activeMedications.length,
            prescribedBy: medicalRecord.doctorId,
            notes: 'Uống thuốc theo đúng chỉ dẫn của bác sĩ'
        };
        return this.formatReport(report, request.format);
    }
    /**
     * Generate diagnosis report
     */
    generateDiagnosisReport(medicalRecord, request) {
        const report = {
            title: 'Báo cáo chẩn đoán',
            recordId: medicalRecord.recordId.value,
            patientId: medicalRecord.patientId,
            doctorId: medicalRecord.doctorId,
            visitDate: medicalRecord.visitDate.toISOString(),
            clinicalPresentation: {
                symptoms: medicalRecord.symptoms,
                examinationFindings: medicalRecord.examinationNotes,
                vitalSigns: medicalRecord.vitalSigns?.getSummary()
            },
            diagnoses: medicalRecord.diagnoses.map(d => ({
                ...d.toJSON(),
                vietnameseSummary: d.getVietnameseSummary(),
                isPrimary: d.isPrimary(),
                isConfirmed: d.isConfirmed(),
                isCritical: d.isCritical(),
                hasOnsetDate: d.hasOnsetDate(),
                isHighConfidence: d.isHighConfidence()
            })),
            diagnosticSummary: {
                totalDiagnoses: medicalRecord.diagnoses.length,
                primaryDiagnoses: medicalRecord.diagnoses.filter(d => d.isPrimary()).length,
                confirmedDiagnoses: medicalRecord.diagnoses.filter(d => d.isConfirmed()).length,
                criticalDiagnoses: medicalRecord.getCriticalDiagnoses().length
            },
            recommendations: medicalRecord.treatment || medicalRecord.notes
        };
        return this.formatReport(report, request.format);
    }
    /**
     * Generate treatment plan
     */
    generateTreatmentPlan(medicalRecord, request) {
        const primaryDiagnosis = medicalRecord.diagnoses.find(d => d.isPrimary());
        const activeMedications = medicalRecord.medications.filter(m => m.isActive());
        const report = {
            title: 'Kế hoạch điều trị',
            recordId: medicalRecord.recordId.value,
            patientId: medicalRecord.patientId,
            doctorId: medicalRecord.doctorId,
            planDate: new Date().toISOString(),
            primaryDiagnosis: primaryDiagnosis ? {
                code: primaryDiagnosis.code,
                display: primaryDiagnosis.display,
                severity: primaryDiagnosis.severity
            } : null,
            treatmentGoals: [
                'Cải thiện triệu chứng',
                'Kiểm soát bệnh lý',
                'Ngăn ngừa biến chứng',
                'Nâng cao chất lượng cuộc sống'
            ],
            medicationPlan: activeMedications.map(m => ({
                medication: m.name,
                dosage: m.dosage,
                frequency: m.frequency,
                duration: m.duration,
                purpose: 'Điều trị theo chỉ định',
                monitoring: 'Theo dõi tác dụng phụ'
            })),
            followUpPlan: {
                nextVisit: 'Tái khám sau 1-2 tuần',
                monitoring: 'Theo dõi triệu chứng và tác dụng thuốc',
                emergencyInstructions: 'Đến bệnh viện ngay nếu có triệu chứng nặng'
            },
            patientEducation: [
                'Tuân thủ đúng liều lượng thuốc',
                'Theo dõi triệu chứng',
                'Chế độ ăn uống phù hợp',
                'Nghỉ ngơi đầy đủ'
            ]
        };
        return this.formatReport(report, request.format);
    }
    /**
     * Format report based on requested format
     */
    formatReport(content, format) {
        switch (format) {
            case ReportFormat.JSON:
            case ReportFormat.FHIR_JSON:
                return content;
            case ReportFormat.HTML:
                return this.convertToHTML(content);
            case ReportFormat.XML:
                return this.convertToXML(content);
            case ReportFormat.PDF:
                // In a real implementation, this would generate PDF
                return {
                    type: 'pdf',
                    content: 'PDF generation would be implemented here',
                    data: content
                };
            default:
                return content;
        }
    }
    /**
     * Convert content to HTML format
     */
    convertToHTML(content) {
        // Simple HTML conversion - in production, use a proper template engine
        return `
      <html>
        <head>
          <title>${content.title || 'Báo cáo y tế'}</title>
          <meta charset="utf-8">
        </head>
        <body>
          <h1>${content.title || 'Báo cáo y tế'}</h1>
          <pre>${JSON.stringify(content, null, 2)}</pre>
        </body>
      </html>
    `;
    }
    /**
     * Convert content to XML format
     */
    convertToXML(content) {
        // Simple XML conversion - in production, use a proper XML library
        return `<?xml version="1.0" encoding="UTF-8"?>
<medicalReport>
  <title>${content.title || 'Báo cáo y tế'}</title>
  <content><![CDATA[${JSON.stringify(content, null, 2)}]]></content>
</medicalReport>`;
    }
    /**
     * Generate unique report ID
     */
    generateReportId(reportType, recordId) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '');
        return `RPT-${reportType.toUpperCase()}-${recordId}-${timestamp}`;
    }
    /**
     * Generate download URL for report
     */
    generateDownloadUrl(reportId, format) {
        return `/api/v1/clinical-emr/reports/${reportId}/download?format=${format}`;
    }
    /**
     * Calculate report expiration date
     */
    calculateExpirationDate() {
        // Reports expire after 24 hours
        return new Date(Date.now() + 24 * 60 * 60 * 1000);
    }
    /**
     * Get Vietnamese report type name
     */
    getReportTypeVietnamese(reportType) {
        const typeMap = {
            [ReportType.SUMMARY]: 'tóm tắt',
            [ReportType.DETAILED]: 'chi tiết',
            [ReportType.FHIR_EXPORT]: 'xuất FHIR',
            [ReportType.DISCHARGE_SUMMARY]: 'tóm tắt xuất viện',
            [ReportType.PRESCRIPTION]: 'đơn thuốc',
            [ReportType.DIAGNOSIS_REPORT]: 'báo cáo chẩn đoán',
            [ReportType.TREATMENT_PLAN]: 'kế hoạch điều trị'
        };
        return typeMap[reportType] || reportType;
    }
    /**
     * Validate request
     */
    async validate(request) {
        const errors = [];
        // Required fields validation
        if (!request.recordId || request.recordId.trim() === '') {
            errors.push({
                field: 'recordId',
                message: 'RecordId là bắt buộc',
                code: 'REQUIRED_FIELD'
            });
        }
        if (!request.reportType) {
            errors.push({
                field: 'reportType',
                message: 'Loại báo cáo là bắt buộc',
                code: 'REQUIRED_FIELD'
            });
        }
        if (!request.format) {
            errors.push({
                field: 'format',
                message: 'Định dạng báo cáo là bắt buộc',
                code: 'REQUIRED_FIELD'
            });
        }
        if (!request.requestedBy || request.requestedBy.trim() === '') {
            errors.push({
                field: 'requestedBy',
                message: 'Người yêu cầu là bắt buộc',
                code: 'REQUIRED_FIELD'
            });
        }
        // Enum validation
        if (request.reportType && !Object.values(ReportType).includes(request.reportType)) {
            errors.push({
                field: 'reportType',
                message: 'Loại báo cáo không hợp lệ',
                code: 'INVALID_ENUM_VALUE'
            });
        }
        if (request.format && !Object.values(ReportFormat).includes(request.format)) {
            errors.push({
                field: 'format',
                message: 'Định dạng báo cáo không hợp lệ',
                code: 'INVALID_ENUM_VALUE'
            });
        }
        // Date range validation
        if (request.fromDate && request.toDate) {
            const fromDate = new Date(request.fromDate);
            const toDate = new Date(request.toDate);
            if (fromDate > toDate) {
                errors.push({
                    field: 'dateRange',
                    message: 'Ngày bắt đầu phải trước ngày kết thúc',
                    code: 'INVALID_DATE_RANGE'
                });
            }
        }
        return {
            isValid: errors.length === 0,
            errors
        };
    }
    /**
     * Check authorization
     */
    async authorize(request, userId) {
        try {
            // Get the medical record to check ownership
            const recordId = RecordId_1.RecordId.create(request.recordId);
            const medicalRecord = await this.medicalRecordRepository.findById(recordId);
            if (!medicalRecord) {
                return false;
            }
            // Authorization rules:
            // 1. Doctors can generate reports for records they created
            // 2. The requestedBy field should match the userId
            // 3. Admins can generate all reports
            if (request.requestedBy !== userId) {
                return false;
            }
            // Check if user is the doctor who created the record
            if (medicalRecord.doctorId === userId) {
                return true;
            }
            // Check if user is the original creator
            if (medicalRecord.createdBy === userId) {
                return true;
            }
            return false;
        }
        catch (error) {
            return false;
        }
    }
    /**
     * Check if involves PHI
     */
    involvesPHI(request) {
        return true; // Medical reports always involve PHI
    }
    /**
     * Get patient ID
     */
    getPatientId(request) {
        return null; // Will be extracted from medical record
    }
    /**
     * Get use case description
     */
    getDescription() {
        return 'Tạo báo cáo y tế từ hồ sơ bệnh án';
    }
    /**
     * Get required permissions
     */
    getRequiredPermissions() {
        return ['medical_record:read', 'medical_report:generate'];
    }
}
exports.GenerateMedicalReportUseCase = GenerateMedicalReportUseCase;
//# sourceMappingURL=GenerateMedicalReportUseCase.js.map