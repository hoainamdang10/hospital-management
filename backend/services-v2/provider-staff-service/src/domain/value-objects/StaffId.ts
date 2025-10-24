/**
 * StaffId Value Object
 * Vietnamese Healthcare Staff ID Format: {TYPE}-{DEPT}-YYYYMM-XXX
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, Vietnamese Healthcare Standards
 */

import { ValueObject } from '@shared/domain/base/value-object';

interface StaffIdProps {
  value: string;
}

export type StaffType = 'doctor' | 'nurse' | 'technician' | 'pharmacist' | 'therapist' | 'admin' | 'receptionist';

export class StaffId extends ValueObject<StaffIdProps> {
  private constructor(props: StaffIdProps) {
    super(props);
  }

  protected validateFormat(): void {
    if (!this.props.value || this.props.value.trim().length === 0) {
      throw new Error('Mã nhân viên không được để trống');
    }

    if (!StaffId.isValidStaffId(this.props.value)) {
      throw new Error('Mã nhân viên không đúng định dạng ({TYPE}-{DEPT}-YYYYMM-XXX)');
    }
  }

  public static create(value: string): StaffId {
    const normalizedValue = value.trim().toUpperCase();
    return new StaffId({ value: normalizedValue });
  }

  public static generate(staffType: StaffType, departmentCode: string = 'GEN'): StaffId {
    const now = new Date();
    const year = now.getFullYear();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const sequence = Math.floor(Math.random() * 999) + 1;
    const sequenceStr = sequence.toString().padStart(3, '0');
    
    const typePrefix = StaffId.getTypePrefix(staffType);
    const staffId = `${typePrefix}-${departmentCode.toUpperCase()}-${year}${month}-${sequenceStr}`;
    
    return new StaffId({ value: staffId });
  }

  public static fromString(value: string): StaffId {
    return StaffId.create(value);
  }

  public get value(): string {
    return this.props.value;
  }

  public getStaffType(): StaffType {
    const typePrefix = this.props.value.split('-')[0];
    return StaffId.getStaffTypeFromPrefix(typePrefix);
  }

  public getDepartmentCode(): string {
    return this.props.value.split('-')[1];
  }

  public getYear(): number {
    const yearMonth = this.props.value.split('-')[2];
    return parseInt(yearMonth.substring(0, 4));
  }

  public getMonth(): number {
    const yearMonth = this.props.value.split('-')[2];
    return parseInt(yearMonth.substring(4, 6));
  }

  public getSequence(): number {
    const sequence = this.props.value.split('-')[3];
    return parseInt(sequence);
  }

  public getRegistrationPeriod(): string {
    return `${this.getMonth()}/${this.getYear()}`;
  }

  public getDepartmentName(): string {
    const deptCode = this.getDepartmentCode();
    const departments: Record<string, string> = {
      'CARD': 'Tim mạch',
      'NEUR': 'Thần kinh',
      'ORTH': 'Chấn thương chỉnh hình',
      'PEDI': 'Nhi khoa',
      'OBGY': 'Sản phụ khoa',
      'DERM': 'Da liễu',
      'OPHT': 'Mắt',
      'ENT': 'Tai mũi họng',
      'PSYC': 'Tâm thần',
      'ANES': 'Gây mê hồi sức',
      'RADI': 'Chẩn đoán hình ảnh',
      'PATH': 'Giải phẫu bệnh',
      'EMRG': 'Cấp cứu',
      'FAMI': 'Y học gia đình',
      'INTE': 'Nội khoa',
      'SURG': 'Ngoại khoa',
      'PHAR': 'Dược',
      'THER': 'Vật lý trị liệu',
      'ADMIN': 'Hành chính',
      'GEN': 'Đa khoa'
    };
    
    return departments[deptCode] || 'Không xác định';
  }

  private static getTypePrefix(staffType: StaffType): string {
    const prefixes: Record<StaffType, string> = {
      'doctor': 'DOC',
      'nurse': 'NUR',
      'technician': 'TEC',
      'pharmacist': 'PHA',
      'therapist': 'THE',
      'admin': 'ADM',
      'receptionist': 'REC'
    };
    
    return prefixes[staffType];
  }

  private static getStaffTypeFromPrefix(prefix: string): StaffType {
    const types: Record<string, StaffType> = {
      'DOC': 'doctor',
      'NUR': 'nurse',
      'TEC': 'technician',
      'PHA': 'pharmacist',
      'THE': 'therapist',
      'ADM': 'admin',
      'REC': 'receptionist'
    };
    
    return types[prefix] || 'admin';
  }

  private static isValidStaffId(value: string): boolean {
    // Format: {TYPE}-{DEPT}-YYYYMM-XXX
    const staffIdRegex = /^(DOC|NUR|TEC|PHA|THE|ADM|REC)-[A-Z]{3,5}-\d{6}-\d{3}$/;
    
    if (!staffIdRegex.test(value)) {
      return false;
    }

    // Validate year and month
    const parts = value.split('-');
    const yearMonth = parts[2];
    const year = parseInt(yearMonth.substring(0, 4));
    const month = parseInt(yearMonth.substring(4, 6));
    
    const currentYear = new Date().getFullYear();
    
    // Year should be reasonable (not too far in past or future)
    if (year < 2000 || year > currentYear + 1) {
      return false;
    }

    // Month should be valid
    if (month < 1 || month > 12) {
      return false;
    }

    return true;
  }

  public override equals(other: StaffId): boolean {
    if (!other) return false;
    return this.props.value === other.props.value;
  }

  public override toString(): string {
    return this.props.value;
  }
}

