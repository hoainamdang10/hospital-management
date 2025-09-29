/**
 * Patient ID Value Object - Healthcare Domain
 * Generates and validates patient IDs with healthcare format
 * 
 * @author Hospital Management Team
 * @version 1.0.0
 * @compliance HIPAA, Healthcare Standards
 */

import { ValueObject } from '../base/value-object';

interface PatientIdProps {
  value: string;
}

/**
 * Patient ID Value Object
 * Format: PAT-YYYYMM-XXX (e.g., PAT-202412-001)
 */
export class PatientId extends ValueObject<PatientIdProps> {
  private static readonly PATIENT_ID_PATTERN = /^PAT-\d{6}-\d{3}$/;

  private constructor(props: PatientIdProps) {
    super(props);
  }

  /**
   * Create new patient ID with healthcare format
   */
  public static create(): PatientId {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const random = Math.floor(Math.random() * 999) + 1;
    const sequence = String(random).padStart(3, '0');
    
    const patientId = `PAT-${year}${month}-${sequence}`;
    
    return new PatientId({ value: patientId });
  }

  /**
   * Create patient ID from existing value
   */
  public static fromString(value: string): PatientId {
    const patientId = new PatientId({ value });
    
    if (!patientId.isValid()) {
      throw new Error(`Invalid patient ID format: ${value}. Expected format: PAT-YYYYMM-XXX`);
    }
    
    return patientId;
  }

  /**
   * Validate patient ID format
   */
  public isValid(): boolean {
    return PatientId.PATIENT_ID_PATTERN.test(this.props.value);
  }

  /**
   * Get patient ID value
   */
  get value(): string {
    return this.props.value;
  }

  /**
   * Extract year and month from patient ID
   */
  public getRegistrationPeriod(): { year: number; month: number } {
    if (!this.isValid()) {
      throw new Error('Cannot extract period from invalid patient ID');
    }

    const parts = this.props.value.split('-');
    const yearMonth = parts[1];
    const year = parseInt(yearMonth.substring(0, 4));
    const month = parseInt(yearMonth.substring(4, 6));

    return { year, month };
  }

  /**
   * Get sequence number from patient ID
   */
  public getSequenceNumber(): number {
    if (!this.isValid()) {
      throw new Error('Cannot extract sequence from invalid patient ID');
    }

    const parts = this.props.value.split('-');
    return parseInt(parts[2]);
  }

  /**
   * Check if patient ID is from current month
   */
  public isFromCurrentMonth(): boolean {
    const { year, month } = this.getRegistrationPeriod();
    const now = new Date();
    return year === now.getFullYear() && month === (now.getMonth() + 1);
  }

  /**
   * Convert to string representation
   */
  public toString(): string {
    return this.props.value;
  }
}
