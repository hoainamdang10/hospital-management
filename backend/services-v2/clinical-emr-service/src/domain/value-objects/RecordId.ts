/**
 * RecordId Value Object - Clinical EMR Service
 * Vietnamese Medical Record ID format: MED-YYYYMM-XXX
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, Vietnamese Healthcare Standards
 */

import { ValueObject } from '../../../shared/domain/ValueObject';

interface RecordIdProps {
  value: string;
}

export class RecordId extends ValueObject<RecordIdProps> {
  private constructor(props: RecordIdProps) {
    super(props);
    this.validate();
  }

  /**
   * Create RecordId from string value
   */
  public static create(value: string): RecordId {
    return new RecordId({ value: value.trim().toUpperCase() });
  }

  /**
   * Generate new RecordId with Vietnamese format: MED-YYYYMM-XXX
   */
  public static generate(): RecordId {
    const now = new Date();
    const year = now.getFullYear();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    
    // Generate random 3-digit sequence
    const sequence = Math.floor(Math.random() * 999) + 1;
    const sequenceStr = sequence.toString().padStart(3, '0');
    
    const recordId = `MED-${year}${month}-${sequenceStr}`;
    return new RecordId({ value: recordId });
  }

  /**
   * Generate RecordId with specific sequence (for testing)
   */
  public static generateWithSequence(sequence: number): RecordId {
    const now = new Date();
    const year = now.getFullYear();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const sequenceStr = sequence.toString().padStart(3, '0');
    
    const recordId = `MED-${year}${month}-${sequenceStr}`;
    return new RecordId({ value: recordId });
  }

  /**
   * Validate RecordId format
   */
  private validate(): void {
    const { value } = this.props;

    if (!value) {
      throw new Error('RecordId không được để trống');
    }

    // Vietnamese Medical Record ID format: MED-YYYYMM-XXX
    const recordIdRegex = /^MED-\d{6}-\d{3}$/;
    if (!recordIdRegex.test(value)) {
      throw new Error(
        'RecordId phải có định dạng MED-YYYYMM-XXX (ví dụ: MED-202501-001)'
      );
    }

    // Validate year and month
    const yearMonth = value.substring(4, 10);
    const year = parseInt(yearMonth.substring(0, 4));
    const month = parseInt(yearMonth.substring(4, 6));

    const currentYear = new Date().getFullYear();
    if (year < 2020 || year > currentYear + 1) {
      throw new Error(`Năm trong RecordId phải từ 2020 đến ${currentYear + 1}`);
    }

    if (month < 1 || month > 12) {
      throw new Error('Tháng trong RecordId phải từ 01 đến 12');
    }

    // Validate sequence
    const sequence = parseInt(value.substring(11, 14));
    if (sequence < 1 || sequence > 999) {
      throw new Error('Số thứ tự trong RecordId phải từ 001 đến 999');
    }
  }

  /**
   * Get string value
   */
  public get value(): string {
    return this.props.value;
  }

  /**
   * Get year from RecordId
   */
  public getYear(): number {
    return parseInt(this.props.value.substring(4, 8));
  }

  /**
   * Get month from RecordId
   */
  public getMonth(): number {
    return parseInt(this.props.value.substring(8, 10));
  }

  /**
   * Get sequence number from RecordId
   */
  public getSequence(): number {
    return parseInt(this.props.value.substring(11, 14));
  }

  /**
   * Get year-month string (YYYYMM)
   */
  public getYearMonth(): string {
    return this.props.value.substring(4, 10);
  }

  /**
   * Check if RecordId is from current month
   */
  public isCurrentMonth(): boolean {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    
    return this.getYear() === currentYear && this.getMonth() === currentMonth;
  }

  /**
   * Check if RecordId is from current year
   */
  public isCurrentYear(): boolean {
    const currentYear = new Date().getFullYear();
    return this.getYear() === currentYear;
  }

  /**
   * Convert to string
   */
  public toString(): string {
    return this.props.value;
  }

  /**
   * Convert to JSON
   */
  public toJSON(): string {
    return this.props.value;
  }

  /**
   * Create from database value
   */
  public static fromDatabase(value: string | null | undefined): RecordId | null {
    if (!value) return null;
    return RecordId.create(value);
  }

  /**
   * Convert to database value
   */
  public toDatabase(): string {
    return this.props.value;
  }
}
