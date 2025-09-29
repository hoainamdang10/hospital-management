/**
 * GetMedicalRecordDetailsQueryHandler - Application Layer
 * Query handler for retrieving detailed medical record information
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, CQRS, HIPAA, Vietnamese Healthcare Standards
 */

import { BaseHealthcareUseCase, ValidationResult } from '../../../../shared/application/use-cases/base/use-case.interface';
import { IMedicalRecordRepository } from '../../../domain/repositories/IMedicalRecordRepository';
import { RecordId } from '../../../domain/value-objects/RecordId';
import { MedicalRecordAggregate } from '../../../domain/aggregates/clinical.aggregate';

/**
 * Get Medical Record Details Query
 */
export interface GetMedicalRecordDetailsQuery {
  recordId: string;
  requestedBy: string;
  
  // Include options
  includeDiagnoses?: boolean;
  includeMedications?: boolean;
  includeVitalSigns?: boolean;
  includeAccessLog?: boolean;
  includeFHIRData?: boolean;
  
  // Format options
  format?: 'summary' | 'detailed' | 'fhir';
  language?: 'vi' | 'en';
  
  // Security options
  auditAccess?: boolean;
  includeMetadata?: boolean;
}

/**
 * Medical Record Details Response
 */
export interface MedicalRecordDetailsResponse {
  success: boolean;
  message: string;
  data?: {
    recordId: string;
    patientId: string;
    doctorId: string;
    appointmentId?: string;
    
    // Basic information
    visitDate: string;
    status: string;
    summary: string;
    
    // Clinical information
    symptoms?: string;
    examinationNotes?: string;
    notes?: string;
    
    // Enhanced information
    diagnoses?: Array<{
      code: string;
      display: string;
      category: string;
      severity: string;
      status: string;
      recordedDate: string;
      recordedBy: string;
      vietnameseSummary: string;
      isPrimary: boolean;
      isConfirmed: boolean;
      isCritical: boolean;
      confidence?: number;
      fhirData?: any;
    }>;
    
    medications?: Array<{
      code: string;
      name: string;
      genericName?: string;
      strength: string;
      dosageForm: string;
      route: string;
      dosage: string;
      frequency: string;
      instructions: string;
      prescribedDate: string;
      prescribedBy: string;
      vietnameseSummary: string;
      isActive: boolean;
      isHighPriority: boolean;
      isExpired: boolean;
      fhirData?: any;
    }>;
    
    vitalSigns?: {
      temperature?: number;
      bloodPressure?: string;
      heartRate?: number;
      weight?: number;
      height?: number;
      summary: string;
      recordedAt: string;
      isComplete: boolean;
    };
    
    // Administrative information
    createdAt: string;
    updatedAt: string;
    createdBy: string;
    updatedBy?: string;
    
    // FHIR information
    fhirResourceId?: string;
    fhirCompliant: boolean;
    fhirValidation?: {
      isValid: boolean;
      errors: string[];
    };
    
    // Vietnamese medical information
    specialtyCode?: string;
    hospitalCode?: string;
    vietnameseMedicalCode?: string;
    
    // Access information
    lastAccessedAt?: string;
    lastAccessedBy?: string;
    accessLog?: Array<{
      accessedAt: string;
      accessedBy: string;
      accessType: string;
      purpose?: string;
    }>;
    
    // Metadata
    metadata?: {
      diagnosesCount: number;
      medicationsCount: number;
      activeMedicationsCount: number;
      criticalDiagnosesCount: number;
      hasVitalSigns: boolean;
      hasBeenAccessed: boolean;
      accessCount: number;
    };
    
    // FHIR export
    fhirData?: any;
  };
  errors?: Array<{
    field: string;
    message: string;
    code: string;
  }>;
}

/**
 * Get Medical Record Details Query Handler
 */
export class GetMedicalRecordDetailsQueryHandler extends BaseHealthcareUseCase<GetMedicalRecordDetailsQuery, MedicalRecordDetailsResponse> {
  
  constructor(
    private readonly medicalRecordRepository: IMedicalRecordRepository
  ) {
    super();
  }

  /**
   * Execute the query
   */
  protected async executeInternal(query: GetMedicalRecordDetailsQuery): Promise<MedicalRecordDetailsResponse> {
    try {
      // Create RecordId value object
      const recordId = RecordId.create(query.recordId);

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
        medicalRecord.recordReadAccess(
          query.requestedBy,
          'Xem chi tiết hồ sơ bệnh án'
        );
        
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

    } catch (error) {
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
  private async buildResponse(
    medicalRecord: MedicalRecordAggregate,
    query: GetMedicalRecordDetailsQuery
  ): Promise<any> {
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
  private formatSummaryResponse(data: any): any {
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
  async validate(query: GetMedicalRecordDetailsQuery): Promise<ValidationResult> {
    const errors: Array<{ field: string; message: string; code: string }> = [];

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
  async authorize(query: GetMedicalRecordDetailsQuery, userId: string): Promise<boolean> {
    try {
      // Get the medical record to check ownership
      const recordId = RecordId.create(query.recordId);
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

    } catch (error) {
      return false;
    }
  }

  /**
   * Check if involves PHI
   */
  involvesPHI(query: GetMedicalRecordDetailsQuery): boolean {
    return true; // Medical record details always involve PHI
  }

  /**
   * Get patient ID
   */
  getPatientId(query: GetMedicalRecordDetailsQuery): string | null {
    return null; // Will be extracted from medical record
  }

  /**
   * Get use case description
   */
  getDescription(): string {
    return 'Xem chi tiết hồ sơ bệnh án';
  }

  /**
   * Get required permissions
   */
  getRequiredPermissions(): string[] {
    return ['medical_record:read', 'medical_record:details'];
  }
}
