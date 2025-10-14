/**
 * StaffId Value Object
 * Staff ID Format: STF-YYYYMM-XXX
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 */

import { ValueObject } from '@shared/domain/base/value-object';
import { randomBytes } from 'crypto';

interface StaffIdProps {
  value: string;
}

export class StaffId extends ValueObject<StaffIdProps> {
  private constructor(props: StaffIdProps) {
    super(props);
  }

  /**
   * Validate format - required by ValueObject base class
   */
  protected validateFormat(): void {
    if (!this.props.value || this.props.value.trim().length === 0) {
      throw new Error('Staff ID không được để trống');
    }
  }

  public static create(value: string): StaffId {
    return new StaffId({ value: value.trim() });
  }

  /**
   * Generate new Staff ID with format STF-YYYYMM-XXX
   */
  public static generate(): StaffId {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const random = randomBytes(2).toString('hex').toUpperCase();
    
    const value = `STF-${year}${month}-${random}`;
    return new StaffId({ value });
  }

  /**
   * Create StaffId from UUID (for compatibility)
   */
  public static fromUUID(uuid: string): StaffId {
    const shortId = uuid.substring(0, 8).toUpperCase();
    return new StaffId({ value: `STF-${shortId}` });
  }

  /**
   * Create StaffId from existing string value
   * Used by repository when reconstituting from database
   */
  public static fromString(value: string): StaffId {
    return new StaffId({ value });
  }

  get value(): string {
    return this.props.value;
  }

  toString(): string {
    return this.props.value;
  }
}

