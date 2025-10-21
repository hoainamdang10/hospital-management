"use strict";
/**
 * GetMedicalRecordDetailsQueryHandler - Application Layer
 * Query handler for retrieving detailed medical record information
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, CQRS, HIPAA, Vietnamese Healthcare Standards
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetMedicalRecordDetailsQueryHandler = void 0;
const use_case_interface_1 = require("../../../../shared/application/use-cases/base/use-case.interface");
const RecordId_1 = require("../../../domain/value-objects/RecordId");
/**
 * Get Medical Record Details Query Handler
 */
class GetMedicalRecordDetailsQueryHandler extends use_case_interface_1.BaseHealthcareUseCase {
    constructor(medicalRecordRepository) {
        super();
        this.medicalRecordRepository = medicalRecordRepository;
    }
    /**
     * Execute the query
     */
    async executeInternal(query) {
        try {
            // Create RecordId value object
            const recordId = RecordId_1.RecordId.create(query.recordId);
            // Find medical record
            const medicalRecord = await this.medicalRecordRepository.findById(recordId);
            if (!medicalRecord) {
                return {
                    success: false,
                    message: `Không tìm thấy hồ sơ bệnh án với ID: ${query.recordId}`,
                    errors: [{
                            field: 'recordId',
                            message: `Hồ sơ bệnh án với ID ${query.recordId} không tồn tại`,
                            code: 'MEDICAL_RECORD_NOT_FOUND'
                        }]
                };
            }
            // Check if record is accessible
            if (medicalRecord.isDeleted()) {
                return {
                    success: false,
                    message: 'Hồ sơ bệnh án đã bị xóa',
                    errors: [{
                            field: 'recordId',
                            message: 'Hồ sơ bệnh án này đã bị xóa',
                            code: 'MEDICAL_RECORD_DELETED'
                        }]
                };
            }
            // Log access for HIPAA compliance
            if (query.auditAccess !== false) {
                medicalRecord.recordReadAccess(query.requestedBy, 'Xem chi tiết hồ sơ bệnh án');
                // Save access log
                await this.medicalRecordRepository.update(medicalRecord);
            }
            // Build response based on format
            const responseData = await this.buildResponse(medicalRecord, query);
            return {
                success: true,
                message: 'Lấy thông tin hồ sơ bệnh án thành công',
                data: responseData
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
            throw new Error(`Lỗi khi lấy thông tin hồ sơ bệnh án: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    /**
     * Build response data based on query options
     */
    async buildResponse(medicalRecord, query) {
        const baseData = {
            recordId: medicalRecord.recordId.value,
            patientId: medicalRecord.patientId,
            doctorId: medicalRecord.doctorId,
            appointmentId: medicalRecord.appointmentId,
            visitDate: medicalRecord.visitDate.toISOString(),
            status: medicalRecord.status,
            summary: medicalRecord.getSummary(),
            symptoms: medicalRecord.symptoms,
            examinationNotes: medicalRecord.examinationNotes,
            notes: medicalRecord.notes,
            createdAt: medicalRecord.createdAt.toISOString(),
            updatedAt: medicalRecord.updatedAt.toISOString(),
            createdBy: medicalRecord.createdBy,
            updatedBy: medicalRecord.updatedBy,
            fhirResourceId: medicalRecord.fhirResourceId,
            fhirCompliant: medicalRecord.isFHIRCompliant(),
            specialtyCode: medicalRecord.specialtyCode,
            vietnameseMedicalCode: medicalRecord.recordId.value,
            lastAccessedAt: medicalRecord.getLastAccessInfo()?.date.toISOString(),
            lastAccessedBy: medicalRecord.getLastAccessInfo()?.by
        };
        // Add diagnoses if requested
        if (query.includeDiagnoses !== false) {
            baseData.diagnoses = medicalRecord.diagnoses.map(diagnosis => ({
                code: diagnosis.code,
                display: diagnosis.display,
                category: diagnosis.category,
                severity: diagnosis.severity,
                status: diagnosis.status,
                recordedDate: diagnosis.recordedDate.toISOString(),
                recordedBy: diagnosis.recordedBy,
                vietnameseSummary: diagnosis.getVietnameseSummary(),
                isPrimary: diagnosis.isPrimary(),
                isConfirmed: diagnosis.isConfirmed(),
                isCritical: diagnosis.isCritical(),
                confidence: diagnosis.confidence,
                fhirData: query.includeFHIRData ? diagnosis.toFHIR() : undefined
            }));
        }
        // Add medications if requested
        if (query.includeMedications !== false) {
            baseData.medications = medicalRecord.medications.map(medication => ({
                code: medication.code,
                name: medication.name,
                genericName: medication.genericName,
                strength: medication.strength,
                dosageForm: medication.dosageForm,
                route: medication.route,
                dosage: medication.dosage,
                frequency: medication.frequency,
                instructions: medication.instructions,
                prescribedDate: medication.prescribedDate.toISOString(),
                prescribedBy: medication.prescribedBy,
                vietnameseSummary: medication.getVietnameseSummary(),
                isActive: medication.isActive(),
                isHighPriority: medication.isHighPriority(),
                isExpired: medication.isExpired(),
                fhirData: query.includeFHIRData ? medication.toFHIR() : undefined
            }));
        }
        // Add vital signs if requested
        if (query.includeVitalSigns !== false && medicalRecord.vitalSigns) {
            const vitalSigns = medicalRecord.vitalSigns;
            baseData.vitalSigns = {
                temperature: vitalSigns.temperature,
                bloodPressure: vitalSigns.bloodPressure,
                heartRate: vitalSigns.heartRate,
                weight: vitalSigns.weight,
                height: vitalSigns.height,
                summary: vitalSigns.getSummary(),
                recordedAt: medicalRecord.updatedAt.toISOString(),
                isComplete: vitalSigns.isComplete()
            };
        }
        // Add FHIR validation if requested
        if (query.includeFHIRData) {
            baseData.fhirValidation = medicalRecord.validateFHIRCompliance();
            baseData.fhirData = medicalRecord.toFHIR();
        }
        // Add access log if requested
        if (query.includeAccessLog && medicalRecord.accessLog) {
            baseData.accessLog = medicalRecord.accessLog.map(access => ({
                accessedAt: access.accessedAt.toISOString(),
                accessedBy: access.accessedBy,
                accessType: access.accessType,
                purpose: access.purpose
            }));
        }
        // Add metadata if requested
        if (query.includeMetadata !== false) {
            baseData.metadata = {
                diagnosesCount: medicalRecord.diagnoses.length,
                medicationsCount: medicalRecord.medications.length,
                activeMedicationsCount: medicalRecord.medications.filter(m => m.isActive()).length,
                criticalDiagnosesCount: medicalRecord.getCriticalDiagnoses().length,
                hasVitalSigns: medicalRecord.hasVitalSigns(),
                hasBeenAccessed: medicalRecord.hasBeenAccessed(),
                accessCount: medicalRecord.accessLog?.length || 0
            };
        }
        // Format response based on requested format
        switch (query.format) {
            case 'summary':
                return this.formatSummaryResponse(baseData);
            case 'fhir':
                return medicalRecord.toFHIR();
            case 'detailed':
            default:
                return baseData;
        }
    }
    /**
     * Format summary response
     */
    formatSummaryResponse(data) {
        return {
            recordId: data.recordId,
            patientId: data.patientId,
            doctorId: data.doctorId,
            visitDate: data.visitDate,
            status: data.status,
            summary: data.summary,
            diagnosesCount: data.metadata?.diagnosesCount || 0,
            medicationsCount: data.metadata?.activeMedicationsCount || 0,
            hasVitalSigns: data.metadata?.hasVitalSigns || false,
            fhirCompliant: data.fhirCompliant,
            lastAccessedAt: data.lastAccessedAt
        };
    }
    /**
     * Validate query
     */
    async validate(query) {
        const errors = [];
        // Required fields validation
        if (!query.recordId || query.recordId.trim() === '') {
            errors.push({
                field: 'recordId',
                message: 'RecordId là bắt buộc',
                code: 'REQUIRED_FIELD'
            });
        }
        if (!query.requestedBy || query.requestedBy.trim() === '') {
            errors.push({
                field: 'requestedBy',
                message: 'Người yêu cầu là bắt buộc',
                code: 'REQUIRED_FIELD'
            });
        }
        // Format validation
        if (query.format && !['summary', 'detailed', 'fhir'].includes(query.format)) {
            errors.push({
                field: 'format',
                message: 'Định dạng không hợp lệ',
                code: 'INVALID_FORMAT'
            });
        }
        // Language validation
        if (query.language && !['vi', 'en'].includes(query.language)) {
            errors.push({
                field: 'language',
                message: 'Ngôn ngữ không hợp lệ',
                code: 'INVALID_LANGUAGE'
            });
        }
        return {
            isValid: errors.length === 0,
            errors
        };
    }
    /**
     * Check authorization
     */
    async authorize(query, userId) {
        try {
            // Get the medical record to check ownership
            const recordId = RecordId_1.RecordId.create(query.recordId);
            const medicalRecord = await this.medicalRecordRepository.findById(recordId);
            if (!medicalRecord) {
                return false;
            }
            // Authorization rules:
            // 1. The requestedBy field should match the userId
            // 2. Users can only access records they created or are assigned to
            // 3. Doctors can access records for their patients
            if (query.requestedBy !== userId) {
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
    involvesPHI(query) {
        return true; // Medical record details always involve PHI
    }
    /**
     * Get patient ID
     */
    getPatientId(query) {
        return null; // Will be extracted from medical record
    }
    /**
     * Get use case description
     */
    getDescription() {
        return 'Xem chi tiết hồ sơ bệnh án';
    }
    /**
     * Get required permissions
     */
    getRequiredPermissions() {
        return ['medical_record:read', 'medical_record:details'];
    }
}
exports.GetMedicalRecordDetailsQueryHandler = GetMedicalRecordDetailsQueryHandler;
//# sourceMappingURL=GetMedicalRecordDetailsQueryHandler.js.map