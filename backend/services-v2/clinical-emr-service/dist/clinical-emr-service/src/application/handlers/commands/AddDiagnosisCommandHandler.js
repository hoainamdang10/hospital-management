"use strict";
/**
 * AddDiagnosisCommandHandler - Application Layer
 * Command handler for adding diagnosis to medical records
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, CQRS, HIPAA, Vietnamese Healthcare Standards
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddDiagnosisCommandHandler = void 0;
const use_case_interface_1 = require("@shared/application/use-cases/base/use-case.interface");
const RecordId_1 = require("../../../domain/value-objects/RecordId");
const Diagnosis_1 = require("../../../domain/value-objects/Diagnosis");
/**
 * Add Diagnosis Command Handler
 */
class AddDiagnosisCommandHandler extends use_case_interface_1.BaseHealthcareUseCase {
    constructor(medicalRecordRepository, eventPublisher) {
        super();
        this.medicalRecordRepository = medicalRecordRepository;
        this.eventPublisher = eventPublisher;
    }
    /**
     * Execute the command
     */
    async executeInternal(command) {
        try {
            // Create RecordId value object
            const recordId = RecordId_1.RecordId.create(command.recordId);
            // Find existing medical record
            const medicalRecord = await this.medicalRecordRepository.findById(recordId);
            if (!medicalRecord) {
                return {
                    success: false,
                    message: `Không tìm thấy hồ sơ bệnh án với ID: ${command.recordId}`,
                    errors: [{
                            field: 'recordId',
                            message: `Hồ sơ bệnh án với ID ${command.recordId} không tồn tại`,
                            code: 'MEDICAL_RECORD_NOT_FOUND'
                        }]
                };
            }
            // Check if record can be updated
            if (medicalRecord.isDeleted()) {
                return {
                    success: false,
                    message: 'Không thể thêm chẩn đoán cho hồ sơ bệnh án đã bị xóa',
                    errors: [{
                            field: 'recordId',
                            message: 'Hồ sơ bệnh án này đã bị xóa',
                            code: 'MEDICAL_RECORD_DELETED'
                        }]
                };
            }
            if (medicalRecord.isArchived()) {
                return {
                    success: false,
                    message: 'Không thể thêm chẩn đoán cho hồ sơ bệnh án đã được lưu trữ',
                    errors: [{
                            field: 'recordId',
                            message: 'Hồ sơ bệnh án này đã được lưu trữ',
                            code: 'MEDICAL_RECORD_ARCHIVED'
                        }]
                };
            }
            // Create diagnosis value object
            const diagnosis = this.createDiagnosis(command);
            // Add diagnosis to medical record
            medicalRecord.addDiagnosis(diagnosis, command.addedBy);
            // Save updated record
            await this.medicalRecordRepository.update(medicalRecord);
            // Publish domain events
            const events = medicalRecord.getUncommittedEvents();
            if (events.length > 0) {
                await this.eventPublisher.publishBatch(events);
                medicalRecord.markEventsAsCommitted();
            }
            return {
                success: true,
                message: 'Chẩn đoán đã được thêm thành công',
                data: {
                    recordId: command.recordId,
                    diagnosisCode: diagnosis.code,
                    diagnosisDisplay: diagnosis.display,
                    category: diagnosis.category,
                    severity: diagnosis.severity,
                    status: diagnosis.status,
                    addedAt: new Date().toISOString(),
                    addedBy: command.addedBy,
                    fhirCompliant: this.validateFHIRCompliance(diagnosis)
                }
            };
        }
        catch (error) {
            // Handle domain validation errors
            if (error instanceof Error) {
                if (error.message.includes('đã tồn tại')) {
                    return {
                        success: false,
                        message: 'Chẩn đoán đã tồn tại',
                        errors: [{
                                field: 'diagnosisCode',
                                message: error.message,
                                code: 'DIAGNOSIS_ALREADY_EXISTS'
                            }]
                    };
                }
                if (error.message.includes('là bắt buộc') || error.message.includes('không hợp lệ')) {
                    return {
                        success: false,
                        message: 'Lỗi validation dữ liệu',
                        errors: [{
                                field: 'diagnosis',
                                message: error.message,
                                code: 'DIAGNOSIS_VALIDATION_ERROR'
                            }]
                    };
                }
            }
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
            throw new Error(`Lỗi khi thêm chẩn đoán: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    /**
     * Create diagnosis value object from command
     */
    createDiagnosis(command) {
        const options = {
            description: command.description,
            onsetDate: command.onsetDate ? new Date(command.onsetDate) : undefined,
            vietnameseClassification: command.vietnameseClassification,
            specialtyCode: command.specialtyCode,
            notes: command.notes,
            confidence: command.confidence
        };
        // Determine if this is Vietnamese or ICD-10 diagnosis
        if (command.vietnameseClassification === 'BYT-VN-2024' || command.specialtyCode) {
            return Diagnosis_1.Diagnosis.createVietnamese(command.diagnosisCode, command.diagnosisDisplay, command.category, command.severity, command.specialtyCode || 'GENE', // Default to general if not specified
            command.addedBy, {
                status: command.status,
                description: command.description,
                onsetDate: options.onsetDate,
                notes: command.notes,
                confidence: command.confidence
            });
        }
        else {
            return Diagnosis_1.Diagnosis.fromICD10(command.diagnosisCode, command.diagnosisDisplay, command.category, command.severity, command.addedBy, {
                status: command.status,
                description: command.description,
                onsetDate: options.onsetDate,
                notes: command.notes,
                confidence: command.confidence
            });
        }
    }
    /**
     * Validate FHIR compliance
     */
    validateFHIRCompliance(diagnosis) {
        try {
            diagnosis.toFHIR();
            return true;
        }
        catch (error) {
            return false;
        }
    }
    /**
     * Validate command
     */
    async validate(command) {
        const errors = [];
        // Required fields validation
        if (!command.recordId || command.recordId.trim() === '') {
            errors.push({
                field: 'recordId',
                message: 'RecordId là bắt buộc',
                code: 'REQUIRED_FIELD'
            });
        }
        if (!command.diagnosisCode || command.diagnosisCode.trim() === '') {
            errors.push({
                field: 'diagnosisCode',
                message: 'Mã chẩn đoán là bắt buộc',
                code: 'REQUIRED_FIELD'
            });
        }
        if (!command.diagnosisDisplay || command.diagnosisDisplay.trim() === '') {
            errors.push({
                field: 'diagnosisDisplay',
                message: 'Tên chẩn đoán là bắt buộc',
                code: 'REQUIRED_FIELD'
            });
        }
        if (!command.addedBy || command.addedBy.trim() === '') {
            errors.push({
                field: 'addedBy',
                message: 'Người thêm chẩn đoán là bắt buộc',
                code: 'REQUIRED_FIELD'
            });
        }
        // Enum validation
        if (!Object.values(Diagnosis_1.DiagnosisCategory).includes(command.category)) {
            errors.push({
                field: 'category',
                message: 'Loại chẩn đoán không hợp lệ',
                code: 'INVALID_ENUM_VALUE'
            });
        }
        if (!Object.values(Diagnosis_1.DiagnosisSeverity).includes(command.severity)) {
            errors.push({
                field: 'severity',
                message: 'Mức độ nghiêm trọng không hợp lệ',
                code: 'INVALID_ENUM_VALUE'
            });
        }
        if (!Object.values(Diagnosis_1.DiagnosisStatus).includes(command.status)) {
            errors.push({
                field: 'status',
                message: 'Trạng thái chẩn đoán không hợp lệ',
                code: 'INVALID_ENUM_VALUE'
            });
        }
        // Date validation
        if (command.onsetDate) {
            const onsetDate = new Date(command.onsetDate);
            const now = new Date();
            if (onsetDate > now) {
                errors.push({
                    field: 'onsetDate',
                    message: 'Ngày khởi phát không thể trong tương lai',
                    code: 'INVALID_DATE'
                });
            }
        }
        // Confidence validation
        if (command.confidence !== undefined && (command.confidence < 0 || command.confidence > 100)) {
            errors.push({
                field: 'confidence',
                message: 'Độ tin cậy phải từ 0-100',
                code: 'INVALID_RANGE'
            });
        }
        // Business rule validation
        if (command.category === Diagnosis_1.DiagnosisCategory.PRIMARY) {
            // Additional validation for primary diagnosis
            if (command.status === Diagnosis_1.DiagnosisStatus.REFUTED) {
                errors.push({
                    field: 'status',
                    message: 'Chẩn đoán chính không thể có trạng thái bác bỏ',
                    code: 'BUSINESS_RULE_VIOLATION'
                });
            }
        }
        if (command.severity === Diagnosis_1.DiagnosisSeverity.CRITICAL) {
            // Critical diagnoses should have high confidence
            if (command.confidence !== undefined && command.confidence < 80) {
                errors.push({
                    field: 'confidence',
                    message: 'Chẩn đoán nguy kịch cần có độ tin cậy ít nhất 80%',
                    code: 'BUSINESS_RULE_VIOLATION'
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
    async authorize(command, userId) {
        try {
            // Get the medical record to check ownership
            const recordId = RecordId_1.RecordId.create(command.recordId);
            const medicalRecord = await this.medicalRecordRepository.findById(recordId);
            if (!medicalRecord) {
                return false;
            }
            // Authorization rules:
            // 1. Only doctors can add diagnoses
            // 2. The addedBy field should match the userId
            // 3. Doctors can only add diagnoses to records they created or are assigned to
            if (command.addedBy !== userId) {
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
    involvesPHI(command) {
        return true; // Adding diagnosis always involves PHI
    }
    /**
     * Get patient ID
     */
    getPatientId(command) {
        return null; // Will be extracted from medical record
    }
    /**
     * Get use case description
     */
    getDescription() {
        return 'Thêm chẩn đoán vào hồ sơ bệnh án';
    }
    /**
     * Get required permissions
     */
    getRequiredPermissions() {
        return ['medical_record:update', 'diagnosis:add'];
    }
}
exports.AddDiagnosisCommandHandler = AddDiagnosisCommandHandler;
//# sourceMappingURL=AddDiagnosisCommandHandler.js.map