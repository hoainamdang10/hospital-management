/**
 * PatientId Value Object
 * Vietnamese Healthcare Patient ID Format: PAT-YYYYMM-XXX
 */

import { ValueObject } from '../../../shared/domain/ValueObject';

interface PatientIdProps {
  value: string;
}

export class PatientId extends ValueObject<PatientIdProps> {
  private constructor(props: PatientIdProps) {
    super(props);
  }

  public static create(value: string): PatientId {
    if (!value || value.trim().length === 0) {
      throw new Error('Mã bệnh nhân không được để trống');
    }

    const normalizedValue = value.trim().toUpperCase();

    if (!this.isValidPatientId(normalizedValue)) {
      throw new Error('Mã bệnh nhân không đúng định dạng (PAT-YYYYMM-XXX)');
    }

    return new PatientId({ value: normalizedValue });
  }

  public static generate(): PatientId {
    const now = new Date();
    const year = now.getFullYear();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const sequence = Math.floor(Math.random() * 999) + 1;
    const sequenceStr = sequence.toString().padStart(3, '0');

    const patientId = `PAT-${year}${month}-${sequenceStr}`;
    return new PatientId({ value: patientId });
  }

  /**
   * Create from string value (alias for create)
   */
  public static fromString(value: string): PatientId {
    return PatientId.create(value);
  }

  public get value(): string {
    return this.props.value;
  }

  public getYear(): number {
    const yearMonth = this.props.value.split('-')[1];
    return parseInt(yearMonth.substring(0, 4));
  }

  public getMonth(): number {
    const yearMonth = this.props.value.split('-')[1];
    return parseInt(yearMonth.substring(4, 6));
  }

  public getSequence(): number {
    const sequence = this.props.value.split('-')[2];
    return parseInt(sequence);
  }

  public getRegistrationPeriod(): string {
    return `${this.getMonth()}/${this.getYear()}`;
  }

  private static isValidPatientId(value: string): boolean {
    // Format: PAT-YYYYMM-XXX
    const patientIdRegex = /^PAT-\d{6}-\d{3}$/;
    
    if (!patientIdRegex.test(value)) {
      return false;
    }

    // Validate year and month
    const yearMonth = value.split('-')[1];
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

  public equals(other: PatientId): boolean {
    return this.props.value === other.props.value;
  }

  public toString(): string {
    return this.props.value;
  }
}
