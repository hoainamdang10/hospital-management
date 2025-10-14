import { ValueObject } from '@shared/domain/base/value-object';

export interface JWTTokenProps {
  value: string;
}

export class JWTToken extends ValueObject<JWTTokenProps> {
  private constructor(props: JWTTokenProps) {
    super(props);
  }

  protected validateFormat(): void {
    if (!this.props.value || this.props.value.trim().length === 0) {
      throw new Error('JWT token cannot be empty');
    }

    const parts = this.props.value.split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid JWT token format - must have 3 parts');
    }

    if (parts.some(part => part.length === 0)) {
      throw new Error('Invalid JWT token - empty part detected');
    }
  }

  public static create(value: string): JWTToken {
    return new JWTToken({ value: value.trim() });
  }

  public get value(): string {
    return this.props.value;
  }

  public getHeader(): string {
    return this.props.value.split('.')[0];
  }

  public getPayload(): string {
    return this.props.value.split('.')[1];
  }

  public getSignature(): string {
    return this.props.value.split('.')[2];
  }

  public toString(): string {
    return this.props.value;
  }
}

