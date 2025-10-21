export class Timezone {
  private static readonly VALID_TIMEZONES = [
    'UTC',
    'Asia/Ho_Chi_Minh',
    'Asia/Bangkok',
    'Asia/Singapore',
    'Asia/Tokyo',
    'America/New_York',
    'America/Los_Angeles',
    'Europe/London',
    'Europe/Paris'
  ];

  private constructor(private readonly value: string) {}

  public static create(value: string): Timezone {
    if (!value || value.trim().length === 0) {
      return Timezone.utc();
    }

    const trimmedValue = value.trim();

    if (!Timezone.VALID_TIMEZONES.includes(trimmedValue)) {
      throw new Error(`Invalid timezone: ${value}. Must be one of: ${Timezone.VALID_TIMEZONES.join(', ')}`);
    }

    return new Timezone(trimmedValue);
  }

  public static utc(): Timezone {
    return new Timezone('UTC');
  }

  public static hoChiMinh(): Timezone {
    return new Timezone('Asia/Ho_Chi_Minh');
  }

  public getValue(): string {
    return this.value;
  }

  public isUTC(): boolean {
    return this.value === 'UTC';
  }

  public equals(other: Timezone): boolean {
    return this.value === other.value;
  }

  public toString(): string {
    return this.value;
  }
}

