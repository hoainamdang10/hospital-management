/**
 * DoctorId Value Object
 * Vietnamese Healthcare Doctor ID Format: {DEPT}-DOC-YYYYMM-XXX
 */

import { ValueObject } from '../../../shared/domain/ValueObject';

interface DoctorIdProps {
  value: string;
}

export class DoctorId extends ValueObject<DoctorIdProps> {
  private constructor(props: DoctorIdProps) {
    super(props);
  }

  public static create(value: string): DoctorId {
    if (!value || value.trim().length === 0) {
      throw new Error('Mã bác sĩ không được để trống');
    }

    const normalizedValue = value.trim().toUpperCase();

    if (!this.isValidDoctorId(normalizedValue)) {
      throw new Error('Mã bác sĩ không đúng định dạng ({DEPT}-DOC-YYYYMM-XXX)');
    }

    return new DoctorId({ value: normalizedValue });
  }

  public static generate(departmentCode: string = 'GEN'): DoctorId {
    const now = new Date();
    const year = now.getFullYear();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const sequence = Math.floor(Math.random() * 999) + 1;
    const sequenceStr = sequence.toString().padStart(3, '0');
    
    const doctorId = `${departmentCode.toUpperCase()}-DOC-${year}${month}-${sequenceStr}`;
    return new DoctorId({ value: doctorId });
  }

  public get value(): string {
    return this.props.value;
  }

  public getDepartmentCode(): string {
    return this.props.value.split('-')[0];
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
      'GEN': 'Đa khoa'
    };
    
    return departments[deptCode] || 'Không xác định';
  }

  private static isValidDoctorId(value: string): boolean {
    // Format: {DEPT}-DOC-YYYYMM-XXX
    const doctorIdRegex = /^[A-Z]{3,4}-DOC-\d{6}-\d{3}$/;
    
    if (!doctorIdRegex.test(value)) {
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

    // Validate department code
    const validDeptCodes = [
      'CARD', 'NEUR', 'ORTH', 'PEDI', 'OBGY', 'DERM', 'OPHT', 'ENT',
      'PSYC', 'ANES', 'RADI', 'PATH', 'EMRG', 'FAMI', 'INTE', 'SURG', 'GEN'
    ];
    
    const deptCode = parts[0];
    return validDeptCodes.includes(deptCode);
  }

  public equals(other: DoctorId): boolean {
    return this.props.value === other.props.value;
  }

  public toString(): string {
    return this.props.value;
  }
}
