/**
 * UserId Value Object
 * Strongly-typed identifier for User aggregate
 */

import { ValueObject } from '../../../shared/domain/ValueObject';
import { v4 as uuidv4 } from 'uuid';

interface UserIdProps {
  value: string;
}

export class UserId extends ValueObject<UserIdProps> {
  private constructor(props: UserIdProps) {
    super(props);
  }

  public static create(value: string): UserId {
    if (!value || value.trim().length === 0) {
      throw new Error('UserId không được để trống');
    }

    if (!this.isValidUUID(value)) {
      throw new Error('UserId phải là UUID hợp lệ');
    }

    return new UserId({ value: value.trim() });
  }

  public static generate(): UserId {
    return new UserId({ value: uuidv4() });
  }

  public get value(): string {
    return this.props.value;
  }

  private static isValidUUID(value: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(value);
  }

  public equals(other: UserId): boolean {
    return this.props.value === other.props.value;
  }

  public toString(): string {
    return this.props.value;
  }
}
