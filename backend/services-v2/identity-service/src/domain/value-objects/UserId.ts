/**
 * UserId Value Object
 * User ID Format: USR-YYYYMM-XXX
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 */

import { ValueObject } from '@shared/domain/base/value-object';
import { randomBytes } from 'crypto';

interface UserIdProps {
  value: string;
}

export class UserId extends ValueObject<UserIdProps> {
  private constructor(props: UserIdProps) {
    super(props);
  }

  /**
   * Validate format - required by ValueObject base class
   */
  protected validateFormat(): void {
    if (!this.props.value || this.props.value.trim().length === 0) {
      throw new Error('User ID không được để trống');
    }
  }

  public static create(value: string): UserId {
    return new UserId({ value: value.trim() });
  }

  public static generate(): UserId {
    const now = new Date();
    const year = now.getFullYear();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    // Use crypto.randomBytes for secure random number generation
    const randomBuffer = randomBytes(2);
    const sequence = (randomBuffer.readUInt16BE(0) % 999) + 1;
    const sequenceStr = sequence.toString().padStart(3, '0');

    const userId = `USR-${year}${month}-${sequenceStr}`;
    return new UserId({ value: userId });
  }

  public static fromUUID(uuid: string): UserId {
    return new UserId({ value: uuid });
  }

  /**
   * Create UserId from existing string value
   * Used by repository when reconstituting from database
   */
  public static fromString(value: string): UserId {
    return new UserId({ value });
  }

  public get value(): string {
    return this.props.value;
  }

  public toString(): string {
    return this.props.value;
  }
}
