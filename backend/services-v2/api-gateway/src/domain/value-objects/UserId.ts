import { ValueObject } from '@shared/domain/base/value-object';
import { validate as uuidValidate } from 'uuid';

export interface UserIdProps {
  value: string;
}

export class UserId extends ValueObject<UserIdProps> {
  private constructor(props: UserIdProps) {
    super(props);
  }

  protected validateFormat(): void {
    if (!this.props.value || this.props.value.trim().length === 0) {
      throw new Error('User ID cannot be empty');
    }

    if (!uuidValidate(this.props.value)) {
      throw new Error('Invalid User ID format - must be a valid UUID');
    }
  }

  public static create(value: string): UserId {
    const trimmedValue = value.trim().toLowerCase();
    return new UserId({ value: trimmedValue });
  }

  public get value(): string {
    return this.props.value;
  }

  public toString(): string {
    return this.props.value;
  }
}

