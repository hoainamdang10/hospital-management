/**
 * StaffAvailability Entity
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 */

import { Entity } from '../../../shared/domain/base/entity';

interface StaffAvailabilityProps {
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class StaffAvailability extends Entity<StaffAvailabilityProps> {
  private constructor(props: StaffAvailabilityProps, id?: string) {
    super(props, id);
  }

  public static create(props: Omit<StaffAvailabilityProps, 'createdAt' | 'updatedAt'>): StaffAvailability {
    const now = new Date();
    return new StaffAvailability({ ...props, createdAt: now, updatedAt: now });
  }

  public static fromPersistence(data: any): StaffAvailability {
    return new StaffAvailability({
      dayOfWeek: data.day_of_week,
      startTime: data.start_time,
      endTime: data.end_time,
      isActive: data.is_active,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
    }, data.id);
  }

  public get dayOfWeek(): string {
    return this.props.dayOfWeek;
  }

  public get startTime(): string {
    return this.props.startTime;
  }

  public get endTime(): string {
    return this.props.endTime;
  }

  public get isActive(): boolean {
    return this.props.isActive;
  }

  public isAvailableAt(dateTime: Date): boolean {
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayOfWeek = dayNames[dateTime.getDay()];
    
    if (dayOfWeek !== this.props.dayOfWeek.toLowerCase()) {
      return false;
    }

    const timeStr = `${dateTime.getHours().toString().padStart(2, '0')}:${dateTime.getMinutes().toString().padStart(2, '0')}`;
    return timeStr >= this.props.startTime && timeStr <= this.props.endTime;
  }

  public validate(): void {
    if (!this.props.dayOfWeek) {
      throw new Error('Ngày trong tuần không được để trống');
    }
  }

  public toPersistence(): any {
    return {
      id: this.id,
      day_of_week: this.props.dayOfWeek,
      start_time: this.props.startTime,
      end_time: this.props.endTime,
      is_active: this.props.isActive,
      created_at: this.props.createdAt.toISOString(),
      updated_at: this.props.updatedAt.toISOString()
    };
  }
}

