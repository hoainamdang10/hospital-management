export class TenantId {
  private constructor(private readonly value: string) {}

  public static create(value: string): TenantId {
    if (!value || value.trim().length === 0) {
      throw new Error('Tenant ID cannot be empty');
    }

    const trimmedValue = value.trim();

    if (trimmedValue.length > 100) {
      throw new Error('Tenant ID cannot exceed 100 characters');
    }

    if (!/^[a-zA-Z0-9_-]+$/.test(trimmedValue)) {
      throw new Error('Tenant ID can only contain alphanumeric characters, hyphens, and underscores');
    }

    return new TenantId(trimmedValue);
  }

  public getValue(): string {
    return this.value;
  }

  public equals(other: TenantId): boolean {
    return this.value === other.value;
  }

  public toString(): string {
    return this.value;
  }
}

