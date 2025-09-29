/**
 * Doctor ID Value Object - Domain Layer
 * Vietnamese healthcare doctor ID with department-based format
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance HIPAA, Vietnamese Healthcare Standards, Medical License Validation
 */

import { HealthcareValueObject } from '../../../shared/domain/base/entity';

export interface DoctorIdProps {
  value: string;
}

export enum MedicalDepartment {
  CARDIOLOGY = 'CARD',
  NEUROLOGY = 'NEUR',
  ORTHOPEDICS = 'ORTH',
  PEDIATRICS = 'PEDI',
  INTERNAL_MEDICINE = 'INTE',
  SURGERY = 'SURG',
  OBSTETRICS_GYNECOLOGY = 'OBGY',
  EMERGENCY = 'EMER',
  RADIOLOGY = 'RADI',
  ANESTHESIOLOGY = 'ANES',
  PSYCHIATRY = 'PSYC',
  DERMATOLOGY = 'DERM',
  OPHTHALMOLOGY = 'OPHT',
  ENT = 'ENTO',
  UROLOGY = 'UROL'
}

/**
 * Doctor ID Value Object
 * Format: {DEPT}-DOC-YYYYMM-XXX (e.g., CARD-DOC-202412-001)
 */
export class DoctorId extends HealthcareValueObject<DoctorIdProps> {
  private constructor(props: DoctorIdProps) {
    super(props);
  }

  /**
   * Create new Doctor ID
   */
  public static create(department: MedicalDepartment, value?: string): DoctorId {
    const doctorIdValue = value || DoctorId.generateNew(department);
    return new DoctorId({ value: doctorIdValue });
  }

  /**
   * Generate new Doctor ID for department
   */
  public static generateNew(department: MedicalDepartment): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const sequence = String(Math.floor(Math.random() * 999) + 1).padStart(3, '0');
    
    return `${department}-DOC-${year}${month}-${sequence}`;
  }

  /**
   * Create from existing value
   */
  public static fromString(value: string): DoctorId {
    return new DoctorId({ value });
  }

  /**
   * Get string value
   */
  get value(): string {
    return this.props.value;
  }

  /**
   * Get department from Doctor ID
   */
  get department(): MedicalDepartment {
    const parts = this.props.value.split('-');
    return parts[0] as MedicalDepartment;
  }

  /**
   * Get year from Doctor ID
   */
  get year(): number {
    const parts = this.props.value.split('-');
    const yearMonth = parts[2];
    return parseInt(yearMonth.substring(0, 4));
  }

  /**
   * Get month from Doctor ID
   */
  get month(): number {
    const parts = this.props.value.split('-');
    const yearMonth = parts[2];
    return parseInt(yearMonth.substring(4, 6));
  }

  /**
   * Get sequence number
   */
  get sequence(): number {
    const parts = this.props.value.split('-');
    return parseInt(parts[3]);
  }

  /**
   * Validate format
   */
  protected validateFormat(): void {
    const doctorIdRegex = /^[A-Z]{4}-DOC-\d{6}-\d{3}$/;
    
    if (!doctorIdRegex.test(this.props.value)) {
      throw new Error('Mã bác sĩ không đúng định dạng. Định dạng hợp lệ: DEPT-DOC-YYYYMM-XXX');
    }

    // Validate department code
    const department = this.department;
    if (!Object.values(MedicalDepartment).includes(department)) {
      throw new Error(`Mã khoa không hợp lệ: ${department}`);
    }

    // Validate year and month
    const year = this.year;
    const month = this.month;

    const currentYear = new Date().getFullYear();
    if (year < 2020 || year > currentYear + 1) {
      throw new Error(`Năm trong mã bác sĩ không hợp lệ: ${year}`);
    }

    if (month < 1 || month > 12) {
      throw new Error(`Tháng trong mã bác sĩ không hợp lệ: ${month}`);
    }
  }

  /**
   * Contains PHI - Doctor ID is considered PHI
   */
  containsPHI(): boolean {
    return true;
  }

  /**
   * Validate PHI format
   */
  protected validatePHIFormat(): void {
    if (this.props.value.length !== 15) {
      throw new Error('Mã bác sĩ phải có độ dài 15 ký tự để tuân thủ HIPAA');
    }
  }

  /**
   * Anonymize for non-PHI use
   */
  anonymize(): Partial<DoctorIdProps> {
    const parts = this.props.value.split('-');
    return {
      value: `${parts[0]}-DOC-${parts[2]}-***`
    };
  }

  /**
   * Get department name in Vietnamese
   */
  getDepartmentNameVietnamese(): string {
    const departmentNames: { [key in MedicalDepartment]: string } = {
      [MedicalDepartment.CARDIOLOGY]: 'Tim mạch',
      [MedicalDepartment.NEUROLOGY]: 'Thần kinh',
      [MedicalDepartment.ORTHOPEDICS]: 'Chấn thương chỉnh hình',
      [MedicalDepartment.PEDIATRICS]: 'Nhi khoa',
      [MedicalDepartment.INTERNAL_MEDICINE]: 'Nội khoa',
      [MedicalDepartment.SURGERY]: 'Ngoại khoa',
      [MedicalDepartment.OBSTETRICS_GYNECOLOGY]: 'Sản phụ khoa',
      [MedicalDepartment.EMERGENCY]: 'Cấp cứu',
      [MedicalDepartment.RADIOLOGY]: 'Chẩn đoán hình ảnh',
      [MedicalDepartment.ANESTHESIOLOGY]: 'Gây mê hồi sức',
      [MedicalDepartment.PSYCHIATRY]: 'Tâm thần',
      [MedicalDepartment.DERMATOLOGY]: 'Da liễu',
      [MedicalDepartment.OPHTHALMOLOGY]: 'Mắt',
      [MedicalDepartment.ENT]: 'Tai mũi họng',
      [MedicalDepartment.UROLOGY]: 'Tiết niệu'
    };

    return departmentNames[this.department];
  }

  /**
   * Check if doctor is from emergency department
   */
  isEmergencyDoctor(): boolean {
    return this.department === MedicalDepartment.EMERGENCY;
  }

  /**
   * Check if doctor is from surgical department
   */
  isSurgicalDoctor(): boolean {
    const surgicalDepartments = [
      MedicalDepartment.SURGERY,
      MedicalDepartment.ORTHOPEDICS,
      MedicalDepartment.NEUROLOGY,
      MedicalDepartment.CARDIOLOGY,
      MedicalDepartment.UROLOGY
    ];
    return surgicalDepartments.includes(this.department);
  }

  /**
   * Check if doctor is from pediatric department
   */
  isPediatricDoctor(): boolean {
    return this.department === MedicalDepartment.PEDIATRICS;
  }

  /**
   * Generate next sequence for same department and year-month
   */
  public static generateNextInSequence(
    department: MedicalDepartment,
    existingIds: DoctorId[]
  ): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const yearMonth = `${year}${month}`;

    // Find existing IDs for current department and year-month
    const currentMonthIds = existingIds
      .filter(id => 
        id.department === department && 
        id.props.value.includes(`${department}-DOC-${yearMonth}-`)
      )
      .map(id => id.sequence)
      .sort((a, b) => b - a); // Sort descending

    const nextSequence = currentMonthIds.length > 0 ? currentMonthIds[0] + 1 : 1;
    const sequence = String(nextSequence).padStart(3, '0');

    return `${department}-DOC-${yearMonth}-${sequence}`;
  }

  /**
   * Validate against business rules
   */
  public static validateBusinessRules(
    doctorId: string,
    department: MedicalDepartment,
    existingIds: DoctorId[]
  ): void {
    const id = DoctorId.fromString(doctorId);

    // Check department consistency
    if (id.department !== department) {
      throw new Error(`Mã bác sĩ không khớp với khoa: ${id.department} vs ${department}`);
    }

    // Check for duplicates
    const duplicate = existingIds.find(existing => existing.equals(id));
    if (duplicate) {
      throw new Error(`Mã bác sĩ đã tồn tại: ${doctorId}`);
    }

    // Check sequence logic
    const sequence = id.sequence;
    const sameDepartmentMonthIds = existingIds.filter(existing => 
      existing.department === id.department &&
      existing.year === id.year && 
      existing.month === id.month
    );

    if (sameDepartmentMonthIds.length > 0) {
      const maxSequence = Math.max(...sameDepartmentMonthIds.map(existing => existing.sequence));
      if (sequence <= maxSequence) {
        throw new Error(`Số thứ tự bác sĩ phải lớn hơn ${maxSequence} cho khoa ${id.getDepartmentNameVietnamese()} tháng ${id.month}/${id.year}`);
      }
    }
  }

  /**
   * Get department hierarchy level
   */
  getDepartmentHierarchyLevel(): number {
    const hierarchyLevels: { [key in MedicalDepartment]: number } = {
      [MedicalDepartment.EMERGENCY]: 1, // Highest priority
      [MedicalDepartment.SURGERY]: 2,
      [MedicalDepartment.CARDIOLOGY]: 2,
      [MedicalDepartment.NEUROLOGY]: 2,
      [MedicalDepartment.INTERNAL_MEDICINE]: 3,
      [MedicalDepartment.PEDIATRICS]: 3,
      [MedicalDepartment.OBSTETRICS_GYNECOLOGY]: 3,
      [MedicalDepartment.ORTHOPEDICS]: 4,
      [MedicalDepartment.ANESTHESIOLOGY]: 4,
      [MedicalDepartment.RADIOLOGY]: 5,
      [MedicalDepartment.PSYCHIATRY]: 5,
      [MedicalDepartment.DERMATOLOGY]: 6,
      [MedicalDepartment.OPHTHALMOLOGY]: 6,
      [MedicalDepartment.ENT]: 6,
      [MedicalDepartment.UROLOGY]: 6
    };

    return hierarchyLevels[this.department];
  }

  /**
   * String representation
   */
  toString(): string {
    return `${this.props.value} (${this.getDepartmentNameVietnamese()})`;
  }
}
