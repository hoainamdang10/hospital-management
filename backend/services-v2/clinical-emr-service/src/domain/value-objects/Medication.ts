/**
 * Medication Value Object - Clinical EMR Service
 * V2 Clean Architecture + DDD Implementation
 * Represents medication prescription with FHIR compliance and Vietnamese pharmaceutical standards
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, FHIR, Vietnamese Pharmaceutical Standards
 */

import { ValueObject } from '@shared/domain/base/value-object';

/**
 * Medication Status (FHIR Compliant)
 */
export enum MedicationStatus {
  ACTIVE = 'active',           // Đang sử dụng
  INACTIVE = 'inactive',       // Ngừng sử dụng
  ENTERED_IN_ERROR = 'entered-in-error', // Nhập nhầm
  STOPPED = 'stopped',         // Đã dừng
  ON_HOLD = 'on-hold',        // Tạm dừng
  COMPLETED = 'completed',     // Hoàn thành
  CANCELLED = 'cancelled'      // Hủy bỏ
}

/**
 * Dosage Form (Vietnamese Pharmaceutical Standards)
 */
export enum DosageForm {
  TABLET = 'tablet',           // Viên nén
  CAPSULE = 'capsule',         // Viên nang
  SYRUP = 'syrup',            // Siro
  INJECTION = 'injection',     // Tiêm
  CREAM = 'cream',            // Kem
  OINTMENT = 'ointment',      // Thuốc mỡ
  DROPS = 'drops',            // Thuốc nhỏ
  SPRAY = 'spray',            // Xịt
  POWDER = 'powder',          // Bột
  SOLUTION = 'solution'       // Dung dịch
}

/**
 * Route of Administration (FHIR Compliant)
 */
export enum RouteOfAdministration {
  ORAL = 'oral',              // Uống
  TOPICAL = 'topical',        // Bôi ngoài da
  INTRAVENOUS = 'intravenous', // Tiêm tĩnh mạch
  INTRAMUSCULAR = 'intramuscular', // Tiêm bắp
  SUBCUTANEOUS = 'subcutaneous', // Tiêm dưới da
  INHALATION = 'inhalation',  // Hít
  NASAL = 'nasal',           // Nhỏ mũi
  OPHTHALMIC = 'ophthalmic',  // Nhỏ mắt
  OTIC = 'otic',             // Nhỏ tai
  RECTAL = 'rectal',         // Đặt hậu môn
  VAGINAL = 'vaginal'        // Đặt âm đạo
}

/**
 * Frequency Unit
 */
export enum FrequencyUnit {
  TIMES_PER_DAY = 'times-per-day',     // Lần/ngày
  TIMES_PER_WEEK = 'times-per-week',   // Lần/tuần
  TIMES_PER_MONTH = 'times-per-month', // Lần/tháng
  AS_NEEDED = 'as-needed',             // Khi cần
  ONCE_DAILY = 'once-daily',           // Một lần/ngày
  TWICE_DAILY = 'twice-daily',         // Hai lần/ngày
  THREE_TIMES_DAILY = 'three-times-daily', // Ba lần/ngày
  FOUR_TIMES_DAILY = 'four-times-daily'    // Bốn lần/ngày
}

/**
 * Medication Properties
 */
export interface MedicationProps {
  // Core medication information
  code: string;                    // Drug code (Vietnamese or international)
  name: string;                    // Medication name in Vietnamese
  genericName?: string;            // Tên hoạt chất
  brandName?: string;              // Tên thương mại
  
  // Dosage information
  strength: string;                // Hàm lượng (e.g., "500mg", "5ml")
  dosageForm: DosageForm;         // Dạng bào chế
  route: RouteOfAdministration;    // Đường dùng
  
  // Prescription details
  dosage: string;                  // Liều dùng (e.g., "1 viên", "5ml")
  frequency: string;               // Tần suất (e.g., "2 lần/ngày")
  frequencyUnit: FrequencyUnit;    // Đơn vị tần suất
  duration?: string;               // Thời gian dùng (e.g., "7 ngày")
  
  // Instructions
  instructions: string;            // Hướng dẫn sử dụng (Vietnamese)
  specialInstructions?: string;    // Hướng dẫn đặc biệt
  
  // Status and dates
  status: MedicationStatus;
  prescribedDate: Date;           // Ngày kê đơn
  startDate?: Date;               // Ngày bắt đầu dùng
  endDate?: Date;                 // Ngày kết thúc
  
  // Prescriber information
  prescribedBy: string;           // Người kê đơn
  pharmacistNotes?: string;       // Ghi chú của dược sĩ
  
  // Vietnamese pharmaceutical context
  vietnameseDrugCode?: string;    // Mã thuốc Việt Nam
  registrationNumber?: string;    // Số đăng ký lưu hành
  manufacturer?: string;          // Nhà sản xuất
  
  // FHIR compliance
  fhirCodeSystem?: string;        // FHIR code system URI
  fhirVersion?: string;           // FHIR version
  
  // Safety information
  contraindications?: string[];   // Chống chỉ định
  sideEffects?: string[];        // Tác dụng phụ
  interactions?: string[];       // Tương tác thuốc
  allergies?: string[];          // Dị ứng
  
  // Additional metadata
  notes?: string;                // Ghi chú bổ sung
  priority?: 'routine' | 'urgent' | 'stat'; // Mức độ ưu tiên
}

/**
 * Medication Value Object
 * Represents a medication prescription with full FHIR compliance and Vietnamese standards
 */
export class Medication extends ValueObject<MedicationProps> {
  
  private constructor(props: MedicationProps) {
    super(props);
  }

  protected validateFormat(): void {
    this.validate();
  }

  /**
   * Create new medication
   */
  public static create(
    code: string,
    name: string,
    strength: string,
    dosageForm: DosageForm,
    route: RouteOfAdministration,
    dosage: string,
    frequency: string,
    frequencyUnit: FrequencyUnit,
    instructions: string,
    prescribedBy: string,
    options: {
      genericName?: string;
      brandName?: string;
      duration?: string;
      specialInstructions?: string;
      status?: MedicationStatus;
      prescribedDate?: Date;
      startDate?: Date;
      endDate?: Date;
      pharmacistNotes?: string;
      vietnameseDrugCode?: string;
      registrationNumber?: string;
      manufacturer?: string;
      fhirCodeSystem?: string;
      fhirVersion?: string;
      contraindications?: string[];
      sideEffects?: string[];
      interactions?: string[];
      allergies?: string[];
      notes?: string;
      priority?: 'routine' | 'urgent' | 'stat';
    } = {}
  ): Medication {
    const props: MedicationProps = {
      code: code.trim().toUpperCase(),
      name: name.trim(),
      genericName: options.genericName?.trim(),
      brandName: options.brandName?.trim(),
      strength: strength.trim(),
      dosageForm,
      route,
      dosage: dosage.trim(),
      frequency: frequency.trim(),
      frequencyUnit,
      duration: options.duration?.trim(),
      instructions: instructions.trim(),
      specialInstructions: options.specialInstructions?.trim(),
      status: options.status || MedicationStatus.ACTIVE,
      prescribedDate: options.prescribedDate || new Date(),
      startDate: options.startDate,
      endDate: options.endDate,
      prescribedBy: prescribedBy.trim(),
      pharmacistNotes: options.pharmacistNotes?.trim(),
      vietnameseDrugCode: options.vietnameseDrugCode?.trim().toUpperCase(),
      registrationNumber: options.registrationNumber?.trim(),
      manufacturer: options.manufacturer?.trim(),
      fhirCodeSystem: options.fhirCodeSystem?.trim(),
      fhirVersion: options.fhirVersion?.trim() || '4.0.1',
      contraindications: options.contraindications?.map(c => c.trim()),
      sideEffects: options.sideEffects?.map(s => s.trim()),
      interactions: options.interactions?.map(i => i.trim()),
      allergies: options.allergies?.map(a => a.trim()),
      notes: options.notes?.trim(),
      priority: options.priority || 'routine'
    };

    return new Medication(props);
  }

  /**
   * Create Vietnamese medication
   */
  public static createVietnamese(
    vietnameseDrugCode: string,
    name: string,
    strength: string,
    dosageForm: DosageForm,
    route: RouteOfAdministration,
    dosage: string,
    frequency: string,
    frequencyUnit: FrequencyUnit,
    instructions: string,
    prescribedBy: string,
    registrationNumber: string,
    options: {
      genericName?: string;
      brandName?: string;
      duration?: string;
      manufacturer?: string;
      specialInstructions?: string;
      startDate?: Date;
      endDate?: Date;
      contraindications?: string[];
      sideEffects?: string[];
      notes?: string;
    } = {}
  ): Medication {
    return this.create(
      vietnameseDrugCode,
      name,
      strength,
      dosageForm,
      route,
      dosage,
      frequency,
      frequencyUnit,
      instructions,
      prescribedBy,
      {
        ...options,
        vietnameseDrugCode,
        registrationNumber,
        fhirCodeSystem: 'http://moh.gov.vn/fhir/CodeSystem/medication'
      }
    );
  }

  /**
   * Validate medication properties
   */
  private validate(): void {
    const { 
      code, name, strength, dosage, frequency, instructions, prescribedBy, prescribedDate 
    } = this.props;

    // Required fields validation
    if (!code || code.trim() === '') {
      throw new Error('Mã thuốc là bắt buộc');
    }

    if (!name || name.trim() === '') {
      throw new Error('Tên thuốc là bắt buộc');
    }

    if (!strength || strength.trim() === '') {
      throw new Error('Hàm lượng thuốc là bắt buộc');
    }

    if (!dosage || dosage.trim() === '') {
      throw new Error('Liều dùng là bắt buộc');
    }

    if (!frequency || frequency.trim() === '') {
      throw new Error('Tần suất dùng là bắt buộc');
    }

    if (!instructions || instructions.trim() === '') {
      throw new Error('Hướng dẫn sử dụng là bắt buộc');
    }

    if (!prescribedBy || prescribedBy.trim() === '') {
      throw new Error('Người kê đơn là bắt buộc');
    }

    // Enum validation
    if (!Object.values(DosageForm).includes(this.props.dosageForm)) {
      throw new Error('Dạng bào chế không hợp lệ');
    }

    if (!Object.values(RouteOfAdministration).includes(this.props.route)) {
      throw new Error('Đường dùng thuốc không hợp lệ');
    }

    if (!Object.values(FrequencyUnit).includes(this.props.frequencyUnit)) {
      throw new Error('Đơn vị tần suất không hợp lệ');
    }

    if (!Object.values(MedicationStatus).includes(this.props.status)) {
      throw new Error('Trạng thái thuốc không hợp lệ');
    }

    // Date validation
    if (!prescribedDate) {
      throw new Error('Ngày kê đơn là bắt buộc');
    }

    const now = new Date();
    if (prescribedDate > now) {
      throw new Error('Ngày kê đơn không thể trong tương lai');
    }

    if (this.props.startDate && this.props.endDate) {
      if (this.props.startDate >= this.props.endDate) {
        throw new Error('Ngày bắt đầu phải trước ngày kết thúc');
      }
    }

    // Length validation
    if (code.length < 2 || code.length > 50) {
      throw new Error('Mã thuốc phải có độ dài từ 2-50 ký tự');
    }

    if (name.length < 2 || name.length > 200) {
      throw new Error('Tên thuốc phải có độ dài từ 2-200 ký tự');
    }

    if (instructions.length < 5 || instructions.length > 1000) {
      throw new Error('Hướng dẫn sử dụng phải có độ dài từ 5-1000 ký tự');
    }

    // Vietnamese drug code validation
    if (this.props.vietnameseDrugCode) {
      this.validateVietnameseDrugCode(this.props.vietnameseDrugCode);
    }

    // Registration number validation
    if (this.props.registrationNumber) {
      this.validateRegistrationNumber(this.props.registrationNumber);
    }

    // Strength format validation
    this.validateStrengthFormat(strength);

    // Dosage format validation
    this.validateDosageFormat(dosage);
  }

  /**
   * Validate Vietnamese drug code format
   */
  private validateVietnameseDrugCode(code: string): void {
    // Vietnamese drug code format: VN-XXXXX-XX
    const vietnameseCodeRegex = /^VN-[A-Z0-9]{5}-[A-Z0-9]{2}$/;
    if (!vietnameseCodeRegex.test(code)) {
      throw new Error('Mã thuốc Việt Nam phải có định dạng VN-XXXXX-XX');
    }
  }

  /**
   * Validate registration number format
   */
  private validateRegistrationNumber(regNumber: string): void {
    // Vietnamese registration number format: VD-XXXXX-XX
    const regNumberRegex = /^VD-[0-9]{5}-[0-9]{2}$/;
    if (!regNumberRegex.test(regNumber)) {
      throw new Error('Số đăng ký lưu hành phải có định dạng VD-XXXXX-XX');
    }
  }

  /**
   * Validate strength format
   */
  private validateStrengthFormat(strength: string): void {
    // Strength format: number + unit (e.g., "500mg", "5ml", "10%")
    const strengthRegex = /^[0-9]+(\.[0-9]+)?(mg|g|ml|l|%|IU|mcg|units?)$/i;
    if (!strengthRegex.test(strength)) {
      throw new Error('Hàm lượng phải có định dạng số + đơn vị (ví dụ: 500mg, 5ml, 10%)');
    }
  }

  /**
   * Validate dosage format
   */
  private validateDosageFormat(dosage: string): void {
    // Dosage format: number + unit (e.g., "1 viên", "5ml", "2 gói")
    const dosageRegex = /^[0-9]+(\.[0-9]+)?\s*(viên|ml|gói|thìa|giọt|lần xịt|ống|vỉ)$/i;
    if (!dosageRegex.test(dosage)) {
      throw new Error('Liều dùng phải có định dạng số + đơn vị (ví dụ: 1 viên, 5ml, 2 gói)');
    }
  }

  // Getters
  public get code(): string {
    return this.props.code;
  }

  public get name(): string {
    return this.props.name;
  }

  public get genericName(): string | undefined {
    return this.props.genericName;
  }

  public get brandName(): string | undefined {
    return this.props.brandName;
  }

  public get strength(): string {
    return this.props.strength;
  }

  public get dosageForm(): DosageForm {
    return this.props.dosageForm;
  }

  public get route(): RouteOfAdministration {
    return this.props.route;
  }

  public get dosage(): string {
    return this.props.dosage;
  }

  public get frequency(): string {
    return this.props.frequency;
  }

  public get frequencyUnit(): FrequencyUnit {
    return this.props.frequencyUnit;
  }

  public get duration(): string | undefined {
    return this.props.duration;
  }

  public get instructions(): string {
    return this.props.instructions;
  }

  public get status(): MedicationStatus {
    return this.props.status;
  }

  public get prescribedDate(): Date {
    return this.props.prescribedDate;
  }

  public get prescribedBy(): string {
    return this.props.prescribedBy;
  }

  public get vietnameseDrugCode(): string | undefined {
    return this.props.vietnameseDrugCode;
  }

  public get registrationNumber(): string | undefined {
    return this.props.registrationNumber;
  }

  public get contraindications(): string[] | undefined {
    return this.props.contraindications;
  }

  public get sideEffects(): string[] | undefined {
    return this.props.sideEffects;
  }

  public get interactions(): string[] | undefined {
    return this.props.interactions;
  }

  // Business logic methods
  public isActive(): boolean {
    return this.props.status === MedicationStatus.ACTIVE;
  }

  public isCompleted(): boolean {
    return this.props.status === MedicationStatus.COMPLETED;
  }

  public isOralMedication(): boolean {
    return this.props.route === RouteOfAdministration.ORAL;
  }

  public isInjection(): boolean {
    return [
      RouteOfAdministration.INTRAVENOUS,
      RouteOfAdministration.INTRAMUSCULAR,
      RouteOfAdministration.SUBCUTANEOUS
    ].includes(this.props.route);
  }

  public hasContraindications(): boolean {
    return !!this.props.contraindications && this.props.contraindications.length > 0;
  }

  public hasSideEffects(): boolean {
    return !!this.props.sideEffects && this.props.sideEffects.length > 0;
  }

  public hasInteractions(): boolean {
    return !!this.props.interactions && this.props.interactions.length > 0;
  }

  public isHighPriority(): boolean {
    return this.props.priority === 'urgent' || this.props.priority === 'stat';
  }

  public isExpired(): boolean {
    if (!this.props.endDate) return false;
    return new Date() > this.props.endDate;
  }

  public getDurationInDays(): number | null {
    if (!this.props.startDate || !this.props.endDate) return null;
    const diffTime = this.props.endDate.getTime() - this.props.startDate.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  /**
   * Get Vietnamese summary
   */
  public getVietnameseSummary(): string {
    const parts: string[] = [];
    
    parts.push(`${this.props.name} ${this.props.strength}`);
    
    const dosageFormMap = {
      [DosageForm.TABLET]: 'viên nén',
      [DosageForm.CAPSULE]: 'viên nang',
      [DosageForm.SYRUP]: 'siro',
      [DosageForm.INJECTION]: 'tiêm',
      [DosageForm.CREAM]: 'kem',
      [DosageForm.OINTMENT]: 'thuốc mỡ',
      [DosageForm.DROPS]: 'thuốc nhỏ',
      [DosageForm.SPRAY]: 'xịt',
      [DosageForm.POWDER]: 'bột',
      [DosageForm.SOLUTION]: 'dung dịch'
    };
    
    parts.push(`(${dosageFormMap[this.props.dosageForm]})`);
    parts.push(`${this.props.dosage}, ${this.props.frequency}`);
    
    if (this.props.duration) {
      parts.push(`trong ${this.props.duration}`);
    }
    
    return parts.join(' ');
  }

  /**
   * Convert to FHIR format
   */
  public toFHIR(): any {
    return {
      resourceType: 'MedicationRequest',
      medicationCodeableConcept: {
        coding: [{
          system: this.props.fhirCodeSystem || 'http://moh.gov.vn/fhir/CodeSystem/medication',
          code: this.props.code,
          display: this.props.name
        }],
        text: this.props.name
      },
      status: this.props.status,
      intent: 'order',
      authoredOn: this.props.prescribedDate.toISOString(),
      dosageInstruction: [{
        text: this.props.instructions,
        route: {
          coding: [{
            system: 'http://snomed.info/sct',
            code: this.getRouteSnomedCode(),
            display: this.props.route
          }]
        },
        doseAndRate: [{
          doseQuantity: {
            value: this.extractDoseValue(),
            unit: this.extractDoseUnit()
          }
        }],
        timing: {
          repeat: {
            frequency: this.extractFrequencyValue(),
            period: 1,
            periodUnit: this.getTimingUnit()
          }
        }
      }],
      note: this.props.notes ? [{
        text: this.props.notes
      }] : undefined
    };
  }

  /**
   * Get SNOMED code for route
   */
  private getRouteSnomedCode(): string {
    const routeMap = {
      [RouteOfAdministration.ORAL]: '26643006',
      [RouteOfAdministration.TOPICAL]: '6064005',
      [RouteOfAdministration.INTRAVENOUS]: '47625008',
      [RouteOfAdministration.INTRAMUSCULAR]: '78421000',
      [RouteOfAdministration.SUBCUTANEOUS]: '34206005'
    } as Record<RouteOfAdministration, string>;
    return routeMap[this.props.route] || '26643006';
  }

  /**
   * Extract dose value from dosage string
   */
  private extractDoseValue(): number {
    const match = this.props.dosage.match(/^([0-9]+(?:\.[0-9]+)?)/);
    return match ? parseFloat(match[1]) : 1;
  }

  /**
   * Extract dose unit from dosage string
   */
  private extractDoseUnit(): string {
    const match = this.props.dosage.match(/[0-9]+(?:\.[0-9]+)?\s*(.+)$/);
    return match ? match[1] : 'viên';
  }

  /**
   * Extract frequency value
   */
  private extractFrequencyValue(): number {
    const match = this.props.frequency.match(/^([0-9]+)/);
    return match ? parseInt(match[1]) : 1;
  }

  /**
   * Get timing unit for FHIR
   */
  private getTimingUnit(): string {
    if (this.props.frequency.includes('ngày')) return 'd';
    if (this.props.frequency.includes('tuần')) return 'wk';
    if (this.props.frequency.includes('tháng')) return 'mo';
    return 'd';
  }

  /**
   * Convert to JSON
   */
  public toJSON(): any {
    return {
      ...this.props,
      prescribedDate: this.props.prescribedDate.toISOString(),
      startDate: this.props.startDate?.toISOString(),
      endDate: this.props.endDate?.toISOString()
    };
  }
}
