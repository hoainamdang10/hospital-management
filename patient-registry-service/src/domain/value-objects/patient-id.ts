/**
 * Patient ID Value Object - Domain Layer
 * Vietnamese healthcare patient ID with validation
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance HIPAA, Vietnamese Healthcare Standards
 */

import { HealthcareValueObject } from '../../../shared/domain/base/entity';

export interface PatientIdProps {
  value: string;
}

/**
 * Patient ID Value Object
 * Format: PAT-YYYYMM-XXX (e.g., PAT-202412-001)
 */
export class PatientId extends HealthcareValueObject<PatientIdProps> {
  private constructor(props: PatientIdProps) {
    super(props);
  }

  /**
   * Create new Patient ID
   */
  public static create(value?: string): PatientId {
    const patientIdValue = value || PatientId.generateNew();
    return new PatientId({ value: patientIdValue });
  }

  /**
   * Generate new Patient ID
   */
  public static generateNew(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const sequence = String(Math.floor(Math.random() * 999) + 1).padStart(3, '0');
    
    return `PAT-${year}${month}-${sequence}`;
  }

  /**
   * Create from existing value
   */
  public static fromString(value: string): PatientId {
    return new PatientId({ value });
  }

  /**
   * Get string value
   */
  get value(): string {
    return this.props.value;
  }

  /**
   * Validate format
   */
  protected validateFormat(): void {
    const patientIdRegex = /^PAT-\d{6}-\d{3}$/;
    
    if (!patientIdRegex.test(this.props.value)) {
      throw new Error('Mã bệnh nhân không đúng định dạng. Định dạng hợp lệ: PAT-YYYYMM-XXX');
    }

    // Validate year and month
    const parts = this.props.value.split('-');
    const yearMonth = parts[1];
    const year = parseInt(yearMonth.substring(0, 4));
    const month = parseInt(yearMonth.substring(4, 6));

    const currentYear = new Date().getFullYear();
    if (year < 2020 || year > currentYear + 1) {
      throw new Error(`Năm trong mã bệnh nhân không hợp lệ: ${year}`);
    }

    if (month < 1 || month > 12) {
      throw new Error(`Tháng trong mã bệnh nhân không hợp lệ: ${month}`);
    }
  }

  /**
   * Contains PHI - Patient ID is considered PHI
   */
  containsPHI(): boolean {
    return true;
  }

  /**
   * Validate PHI format
   */
  protected validatePHIFormat(): void {
    // Patient ID must be properly formatted for HIPAA compliance
    if (this.props.value.length !== 11) {
      throw new Error('Mã bệnh nhân phải có độ dài 11 ký tự để tuân thủ HIPAA');
    }
  }

  /**
   * Anonymize for non-PHI use
   */
  anonymize(): Partial<PatientIdProps> {
    // Return masked version
    const parts = this.props.value.split('-');
    return {
      value: `PAT-${parts[1]}-***`
    };
  }

  /**
   * String representation
   */
  toString(): string {
    return this.props.value;
  }

  /**
   * Get year from Patient ID
   */
  getYear(): number {
    const yearMonth = this.props.value.split('-')[1];
    return parseInt(yearMonth.substring(0, 4));
  }

  /**
   * Get month from Patient ID
   */
  getMonth(): number {
    const yearMonth = this.props.value.split('-')[1];
    return parseInt(yearMonth.substring(4, 6));
  }

  /**
   * Get sequence number
   */
  getSequence(): number {
    const sequence = this.props.value.split('-')[2];
    return parseInt(sequence);
  }

  /**
   * Check if Patient ID is from current year
   */
  isCurrentYear(): boolean {
    return this.getYear() === new Date().getFullYear();
  }

  /**
   * Check if Patient ID is from current month
   */
  isCurrentMonth(): boolean {
    const now = new Date();
    return this.getYear() === now.getFullYear() && 
           this.getMonth() === (now.getMonth() + 1);
  }

  /**
   * Generate next sequence for same year-month
   */
  public static generateNextInSequence(existingIds: PatientId[]): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const yearMonth = `${year}${month}`;

    // Find existing IDs for current year-month
    const currentMonthIds = existingIds
      .filter(id => id.props.value.includes(`PAT-${yearMonth}-`))
      .map(id => id.getSequence())
      .sort((a, b) => b - a); // Sort descending

    const nextSequence = currentMonthIds.length > 0 ? currentMonthIds[0] + 1 : 1;
    const sequence = String(nextSequence).padStart(3, '0');

    return `PAT-${yearMonth}-${sequence}`;
  }

  /**
   * Validate against business rules
   */
  public static validateBusinessRules(patientId: string, existingIds: PatientId[]): void {
    const id = PatientId.fromString(patientId);

    // Check for duplicates
    const duplicate = existingIds.find(existing => existing.equals(id));
    if (duplicate) {
      throw new Error(`Mã bệnh nhân đã tồn tại: ${patientId}`);
    }

    // Check sequence logic
    const sequence = id.getSequence();
    const sameMonthIds = existingIds.filter(existing => 
      existing.getYear() === id.getYear() && 
      existing.getMonth() === id.getMonth()
    );

    if (sameMonthIds.length > 0) {
      const maxSequence = Math.max(...sameMonthIds.map(existing => existing.getSequence()));
      if (sequence <= maxSequence) {
        throw new Error(`Số thứ tự bệnh nhân phải lớn hơn ${maxSequence} cho tháng ${id.getMonth()}/${id.getYear()}`);
      }
    }
  }
}
