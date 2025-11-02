/**
 * NoteId Value Object - Clinical Note Identifier
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, Vietnamese Healthcare Standards
 */

import { ValueObject } from '@shared/domain/base/value-object';

export interface NoteIdProps {
  value: string;
}

/**
 * Clinical Note ID Value Object
 * Format: NOTE-YYYYMM-XXX (e.g., NOTE-202501-001)
 */
export class NoteId extends ValueObject<NoteIdProps> {
  private static readonly FORMAT_REGEX = /^NOTE-\d{6}-\d{3}$/;
  
  private constructor(props: NoteIdProps) {
    super(props);
  }

  /**
   * Create NoteId from string
   */
  public static create(value: string): NoteId {
    if (!value || value.trim() === '') {
      throw new Error('NoteId không được để trống');
    }

    const trimmedValue = value.trim().toUpperCase();
    
    if (!this.FORMAT_REGEX.test(trimmedValue)) {
      throw new Error(
        `NoteId phải có định dạng NOTE-YYYYMM-XXX (e.g., NOTE-202501-001), nhận được: ${trimmedValue}`
      );
    }

    return new NoteId({ value: trimmedValue });
  }

  /**
   * Generate new NoteId with current date
   */
  public static generate(sequenceNumber: number): NoteId {
    const now = new Date();
    const year = now.getFullYear();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const sequence = sequenceNumber.toString().padStart(3, '0');
    
    const noteId = `NOTE-${year}${month}-${sequence}`;
    return new NoteId({ value: noteId });
  }

  protected validateFormat(): void {
    if (!NoteId.FORMAT_REGEX.test(this.props.value)) {
      throw new Error(
        `NoteId không hợp lệ: ${this.props.value}. Định dạng yêu cầu: NOTE-YYYYMM-XXX`
      );
    }

    // Validate year and month
    const parts = this.props.value.split('-');
    const yearMonth = parts[1];
    const year = parseInt(yearMonth.substring(0, 4), 10);
    const month = parseInt(yearMonth.substring(4, 6), 10);

    const currentYear = new Date().getFullYear();
    if (year < 2020 || year > currentYear + 1) {
      throw new Error(`Năm không hợp lệ trong NoteId: ${year}`);
    }

    if (month < 1 || month > 12) {
      throw new Error(`Tháng không hợp lệ trong NoteId: ${month}`);
    }

    // Validate sequence number
    const sequence = parseInt(parts[2], 10);
    if (sequence < 1 || sequence > 999) {
      throw new Error(`Số thứ tự không hợp lệ trong NoteId: ${sequence}`);
    }
  }

  /**
   * Get the value as string
   */
  get value(): string {
    return this.props.value;
  }

  /**
   * Get year from NoteId
   */
  public getYear(): number {
    const yearMonth = this.props.value.split('-')[1];
    return parseInt(yearMonth.substring(0, 4), 10);
  }

  /**
   * Get month from NoteId
   */
  public getMonth(): number {
    const yearMonth = this.props.value.split('-')[1];
    return parseInt(yearMonth.substring(4, 6), 10);
  }

  /**
   * Get sequence number from NoteId
   */
  public getSequence(): number {
    const sequence = this.props.value.split('-')[2];
    return parseInt(sequence, 10);
  }

  /**
   * Check if NoteId is from current month
   */
  public isCurrentMonth(): boolean {
    const now = new Date();
    return this.getYear() === now.getFullYear() && this.getMonth() === now.getMonth() + 1;
  }

  /**
   * Check if NoteId is from current year
   */
  public isCurrentYear(): boolean {
    return this.getYear() === new Date().getFullYear();
  }

  /**
   * Convert to JSON
   */
  public toJSON(): any {
    return {
      value: this.props.value,
      year: this.getYear(),
      month: this.getMonth(),
      sequence: this.getSequence()
    };
  }

  /**
   * Convert to string
   */
  public override toString(): string {
    return this.props.value;
  }
}
