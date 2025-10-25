/**
 * Diagnosis Value Object - Clinical EMR Service
 * V2 Clean Architecture + DDD Implementation
 * Represents medical diagnosis with FHIR compliance and Vietnamese medical standards
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, FHIR, Vietnamese Medical Standards
 */

import { ValueObject } from '@shared/domain/base/value-object';

/**
 * Diagnosis Severity Levels (Vietnamese Medical Standards)
 */
export enum DiagnosisSeverity {
  MILD = 'mild',           // Nhẹ
  MODERATE = 'moderate',   // Trung bình
  SEVERE = 'severe',       // Nặng
  CRITICAL = 'critical'    // Nguy kịch
}

/**
 * Diagnosis Status (FHIR Compliant)
 */
export enum DiagnosisStatus {
  PROVISIONAL = 'provisional',     // Chẩn đoán sơ bộ
  DIFFERENTIAL = 'differential',   // Chẩn đoán phân biệt
  CONFIRMED = 'confirmed',         // Chẩn đoán xác định
  REFUTED = 'refuted',            // Chẩn đoán bị bác bỏ
  ENTERED_IN_ERROR = 'entered-in-error' // Nhập nhầm
}

/**
 * Diagnosis Category (Vietnamese Medical Classification)
 */
export enum DiagnosisCategory {
  PRIMARY = 'primary',           // Chẩn đoán chính
  SECONDARY = 'secondary',       // Chẩn đoán phụ
  COMPLICATION = 'complication', // Biến chứng
  COMORBIDITY = 'comorbidity'    // Bệnh đi kèm
}

/**
 * Diagnosis Properties
 */
export interface DiagnosisProps {
  // Core diagnosis information
  code: string;                    // ICD-10 code or Vietnamese medical code
  display: string;                 // Vietnamese diagnosis name
  description?: string;            // Detailed description in Vietnamese
  
  // Classification
  category: DiagnosisCategory;
  severity: DiagnosisSeverity;
  status: DiagnosisStatus;
  
  // Clinical context
  onsetDate?: Date;               // Ngày khởi phát
  recordedDate: Date;             // Ngày ghi nhận
  recordedBy: string;             // Người ghi nhận
  
  // Vietnamese medical context
  vietnameseClassification?: string; // Phân loại theo tiêu chuẩn Việt Nam
  specialtyCode?: string;           // Mã chuyên khoa
  
  // FHIR compliance
  fhirCodeSystem?: string;         // FHIR code system URI
  fhirVersion?: string;            // FHIR version
  
  // Additional metadata
  notes?: string;                  // Ghi chú bổ sung
  confidence?: number;             // Độ tin cậy (0-100)
}

/**
 * Diagnosis Value Object
 * Represents a medical diagnosis with full FHIR compliance and Vietnamese standards
 */
export class Diagnosis extends ValueObject<DiagnosisProps> {
  
  private constructor(props: DiagnosisProps) {
    super(props);
  }

  protected validateFormat(): void {
    this.validate();
  }

  /**
   * Create new diagnosis
   */
  public static create(
    code: string,
    display: string,
    category: DiagnosisCategory,
    severity: DiagnosisSeverity,
    status: DiagnosisStatus,
    recordedBy: string,
    options: {
      description?: string;
      onsetDate?: Date;
      recordedDate?: Date;
      vietnameseClassification?: string;
      specialtyCode?: string;
      fhirCodeSystem?: string;
      fhirVersion?: string;
      notes?: string;
      confidence?: number;
    } = {}
  ): Diagnosis {
    const props: DiagnosisProps = {
      code: code.trim().toUpperCase(),
      display: display.trim(),
      description: options.description?.trim(),
      category,
      severity,
      status,
      onsetDate: options.onsetDate,
      recordedDate: options.recordedDate || new Date(),
      recordedBy: recordedBy.trim(),
      vietnameseClassification: options.vietnameseClassification?.trim(),
      specialtyCode: options.specialtyCode?.trim().toUpperCase(),
      fhirCodeSystem: options.fhirCodeSystem?.trim(),
      fhirVersion: options.fhirVersion?.trim() || '4.0.1',
      notes: options.notes?.trim(),
      confidence: options.confidence
    };

    return new Diagnosis(props);
  }

  /**
   * Create from ICD-10 code
   */
  public static fromICD10(
    icd10Code: string,
    display: string,
    category: DiagnosisCategory,
    severity: DiagnosisSeverity,
    recordedBy: string,
    options: {
      status?: DiagnosisStatus;
      description?: string;
      onsetDate?: Date;
      notes?: string;
      confidence?: number;
    } = {}
  ): Diagnosis {
    return this.create(
      icd10Code,
      display,
      category,
      severity,
      options.status || DiagnosisStatus.PROVISIONAL,
      recordedBy,
      {
        ...options,
        fhirCodeSystem: 'http://hl7.org/fhir/sid/icd-10',
        vietnameseClassification: 'ICD-10-VN'
      }
    );
  }

  /**
   * Create Vietnamese medical diagnosis
   */
  public static createVietnamese(
    vietnameseCode: string,
    display: string,
    category: DiagnosisCategory,
    severity: DiagnosisSeverity,
    specialtyCode: string,
    recordedBy: string,
    options: {
      status?: DiagnosisStatus;
      description?: string;
      onsetDate?: Date;
      notes?: string;
      confidence?: number;
    } = {}
  ): Diagnosis {
    return this.create(
      vietnameseCode,
      display,
      category,
      severity,
      options.status || DiagnosisStatus.PROVISIONAL,
      recordedBy,
      {
        ...options,
        specialtyCode,
        vietnameseClassification: 'BYT-VN-2024',
        fhirCodeSystem: 'http://moh.gov.vn/fhir/CodeSystem/diagnosis'
      }
    );
  }

  /**
   * Validate diagnosis properties
   */
  private validate(): void {
    const { code, display, category, severity, status, recordedBy, recordedDate, confidence } = this.props;

    // Required fields validation
    if (!code || code.trim() === '') {
      throw new Error('Mã chẩn đoán là bắt buộc');
    }

    if (!display || display.trim() === '') {
      throw new Error('Tên chẩn đoán là bắt buộc');
    }

    if (!recordedBy || recordedBy.trim() === '') {
      throw new Error('Người ghi nhận chẩn đoán là bắt buộc');
    }

    // Enum validation
    if (!Object.values(DiagnosisCategory).includes(category)) {
      throw new Error('Loại chẩn đoán không hợp lệ');
    }

    if (!Object.values(DiagnosisSeverity).includes(severity)) {
      throw new Error('Mức độ nghiêm trọng không hợp lệ');
    }

    if (!Object.values(DiagnosisStatus).includes(status)) {
      throw new Error('Trạng thái chẩn đoán không hợp lệ');
    }

    // Date validation
    if (!recordedDate) {
      throw new Error('Ngày ghi nhận là bắt buộc');
    }

    const now = new Date();
    if (recordedDate > now) {
      throw new Error('Ngày ghi nhận không thể trong tương lai');
    }

    if (this.props.onsetDate && this.props.onsetDate > now) {
      throw new Error('Ngày khởi phát không thể trong tương lai');
    }

    if (this.props.onsetDate && recordedDate < this.props.onsetDate) {
      throw new Error('Ngày ghi nhận không thể trước ngày khởi phát');
    }

    // Code format validation
    if (code.length < 2 || code.length > 20) {
      throw new Error('Mã chẩn đoán phải có độ dài từ 2-20 ký tự');
    }

    // Display name validation
    if (display.length < 3 || display.length > 500) {
      throw new Error('Tên chẩn đoán phải có độ dài từ 3-500 ký tự');
    }

    // Confidence validation
    if (confidence !== undefined && (confidence < 0 || confidence > 100)) {
      throw new Error('Độ tin cậy phải từ 0-100');
    }

    // Vietnamese medical code validation
    if (this.props.vietnameseClassification === 'BYT-VN-2024') {
      this.validateVietnameseMedicalCode(code);
    }

    // ICD-10 code validation
    if (this.props.fhirCodeSystem?.includes('icd-10')) {
      this.validateICD10Code(code);
    }

    // Specialty code validation
    if (this.props.specialtyCode) {
      this.validateSpecialtyCode(this.props.specialtyCode);
    }
  }

  /**
   * Validate Vietnamese medical code format
   */
  private validateVietnameseMedicalCode(code: string): void {
    // Vietnamese medical code format: DEPT-XXX-YYYY
    const vietnameseCodeRegex = /^[A-Z]{2,4}-[A-Z0-9]{3}-[A-Z0-9]{4}$/;
    if (!vietnameseCodeRegex.test(code)) {
      throw new Error('Mã chẩn đoán Việt Nam phải có định dạng DEPT-XXX-YYYY');
    }
  }

  /**
   * Validate ICD-10 code format
   */
  private validateICD10Code(code: string): void {
    // ICD-10 code format: A00-Z99.999
    const icd10Regex = /^[A-Z][0-9]{2}(\.[0-9]{1,3})?$/;
    if (!icd10Regex.test(code)) {
      throw new Error('Mã ICD-10 phải có định dạng A00-Z99 hoặc A00.0-Z99.999');
    }
  }

  /**
   * Validate specialty code
   */
  private validateSpecialtyCode(specialtyCode: string): void {
    const validSpecialties = [
      'CARD', 'NEUR', 'ORTH', 'PEDI', 'OBGY', 'SURG', 'INTE', 'DERM',
      'OPHT', 'ENT', 'PSYC', 'RADI', 'PATH', 'ANES', 'EMRG', 'FAMI'
    ];

    if (!validSpecialties.includes(specialtyCode)) {
      throw new Error(`Mã chuyên khoa không hợp lệ. Các mã hợp lệ: ${validSpecialties.join(', ')}`);
    }
  }

  // Getters
  public get code(): string {
    return this.props.code;
  }

  public get display(): string {
    return this.props.display;
  }

  public get description(): string | undefined {
    return this.props.description;
  }

  public get category(): DiagnosisCategory {
    return this.props.category;
  }

  public get severity(): DiagnosisSeverity {
    return this.props.severity;
  }

  public get status(): DiagnosisStatus {
    return this.props.status;
  }

  public get onsetDate(): Date | undefined {
    return this.props.onsetDate;
  }

  public get recordedDate(): Date {
    return this.props.recordedDate;
  }

  public get recordedBy(): string {
    return this.props.recordedBy;
  }

  public get vietnameseClassification(): string | undefined {
    return this.props.vietnameseClassification;
  }

  public get specialtyCode(): string | undefined {
    return this.props.specialtyCode;
  }

  public get confidence(): number | undefined {
    return this.props.confidence;
  }

  public get notes(): string | undefined {
    return this.props.notes;
  }

  // Business logic methods
  public isPrimary(): boolean {
    return this.props.category === DiagnosisCategory.PRIMARY;
  }

  public isConfirmed(): boolean {
    return this.props.status === DiagnosisStatus.CONFIRMED;
  }

  public isCritical(): boolean {
    return this.props.severity === DiagnosisSeverity.CRITICAL;
  }

  public isHighConfidence(): boolean {
    return this.props.confidence !== undefined && this.props.confidence >= 80;
  }

  public isRecentlyRecorded(days: number = 7): boolean {
    const daysDiff = (new Date().getTime() - this.props.recordedDate.getTime()) / (1000 * 60 * 60 * 24);
    return daysDiff <= days;
  }

  public hasOnsetDate(): boolean {
    return this.props.onsetDate !== undefined;
  }

  public getDurationSinceOnset(): number | null {
    if (!this.props.onsetDate) return null;
    return new Date().getTime() - this.props.onsetDate.getTime();
  }

  /**
   * Get Vietnamese summary
   */
  public getVietnameseSummary(): string {
    const parts: string[] = [];
    
    parts.push(`${this.props.display} (${this.props.code})`);
    
    const severityMap = {
      [DiagnosisSeverity.MILD]: 'Nhẹ',
      [DiagnosisSeverity.MODERATE]: 'Trung bình',
      [DiagnosisSeverity.SEVERE]: 'Nặng',
      [DiagnosisSeverity.CRITICAL]: 'Nguy kịch'
    };
    
    const statusMap = {
      [DiagnosisStatus.PROVISIONAL]: 'Sơ bộ',
      [DiagnosisStatus.DIFFERENTIAL]: 'Phân biệt',
      [DiagnosisStatus.CONFIRMED]: 'Xác định',
      [DiagnosisStatus.REFUTED]: 'Bác bỏ',
      [DiagnosisStatus.ENTERED_IN_ERROR]: 'Nhập nhầm'
    };
    
    parts.push(`Mức độ: ${severityMap[this.props.severity]}`);
    parts.push(`Trạng thái: ${statusMap[this.props.status]}`);
    
    if (this.props.confidence) {
      parts.push(`Độ tin cậy: ${this.props.confidence}%`);
    }
    
    return parts.join(' | ');
  }

  /**
   * Convert to FHIR format
   */
  public toFHIR(): any {
    return {
      resourceType: 'Condition',
      code: {
        coding: [{
          system: this.props.fhirCodeSystem || 'http://hl7.org/fhir/sid/icd-10',
          code: this.props.code,
          display: this.props.display
        }],
        text: this.props.display
      },
      category: [{
        coding: [{
          system: 'http://terminology.hl7.org/CodeSystem/condition-category',
          code: this.props.category,
          display: this.props.category
        }]
      }],
      severity: {
        coding: [{
          system: 'http://snomed.info/sct',
          code: this.getSeveritySnomedCode(),
          display: this.props.severity
        }]
      },
      clinicalStatus: {
        coding: [{
          system: 'http://terminology.hl7.org/CodeSystem/condition-clinical',
          code: this.props.status === DiagnosisStatus.CONFIRMED ? 'active' : 'provisional'
        }]
      },
      onsetDateTime: this.props.onsetDate?.toISOString(),
      recordedDate: this.props.recordedDate.toISOString(),
      note: this.props.notes ? [{
        text: this.props.notes
      }] : undefined
    };
  }

  /**
   * Get SNOMED code for severity
   */
  private getSeveritySnomedCode(): string {
    const severityMap = {
      [DiagnosisSeverity.MILD]: '255604002',
      [DiagnosisSeverity.MODERATE]: '6736007',
      [DiagnosisSeverity.SEVERE]: '24484000',
      [DiagnosisSeverity.CRITICAL]: '442452003'
    };
    return severityMap[this.props.severity];
  }

  /**
   * Convert to JSON
   */
  public toJSON(): any {
    return {
      ...this.props,
      onsetDate: this.props.onsetDate?.toISOString(),
      recordedDate: this.props.recordedDate.toISOString()
    };
  }
}
