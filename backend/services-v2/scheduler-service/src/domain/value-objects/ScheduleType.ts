export enum ScheduleType {
  ONCE = 'ONCE',
  CRON = 'CRON',
  RRULE = 'RRULE'
}

export class ScheduleTypeVO {
  private constructor(private readonly value: ScheduleType) {}

  public static create(value: string): ScheduleTypeVO {
    const upperValue = value.toUpperCase();
    
    if (!Object.values(ScheduleType).includes(upperValue as ScheduleType)) {
      throw new Error(`Invalid schedule type: ${value}. Must be ONCE, CRON, or RRULE`);
    }

    return new ScheduleTypeVO(upperValue as ScheduleType);
  }

  public static once(): ScheduleTypeVO {
    return new ScheduleTypeVO(ScheduleType.ONCE);
  }

  public static cron(): ScheduleTypeVO {
    return new ScheduleTypeVO(ScheduleType.CRON);
  }

  public static rrule(): ScheduleTypeVO {
    return new ScheduleTypeVO(ScheduleType.RRULE);
  }

  public getValue(): ScheduleType {
    return this.value;
  }

  public isOnce(): boolean {
    return this.value === ScheduleType.ONCE;
  }

  public isCron(): boolean {
    return this.value === ScheduleType.CRON;
  }

  public isRRule(): boolean {
    return this.value === ScheduleType.RRULE;
  }

  public equals(other: ScheduleTypeVO): boolean {
    return this.value === other.value;
  }

  public toString(): string {
    return this.value;
  }
}

