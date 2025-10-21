export class DedupKey {
  private constructor(private readonly value: string) {}

  public static create(value: string): DedupKey {
    if (!value || value.trim().length === 0) {
      throw new Error('Deduplication key cannot be empty');
    }

    const trimmedValue = value.trim();

    if (trimmedValue.length > 255) {
      throw new Error('Deduplication key cannot exceed 255 characters');
    }

    return new DedupKey(trimmedValue);
  }

  public static fromParts(parts: string[]): DedupKey {
    if (parts.length === 0) {
      throw new Error('Cannot create deduplication key from empty parts');
    }

    const value = parts.join(':');
    return DedupKey.create(value);
  }

  public getValue(): string {
    return this.value;
  }

  public equals(other: DedupKey): boolean {
    return this.value === other.value;
  }

  public toString(): string {
    return this.value;
  }
}

