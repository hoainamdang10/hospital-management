import { DoctorSchedule, CreateScheduleRequest, UpdateScheduleRequest } from '@hospital/shared/dist/types/doctor.types';
export declare class ScheduleRepository {
    private supabase;
    constructor();
    findByDoctorId(doctor_id: string): Promise<DoctorSchedule[]>;
    findByDoctorAndDay(doctor_id: string, dayOfWeek: number): Promise<DoctorSchedule | null>;
    create(scheduleData: CreateScheduleRequest): Promise<DoctorSchedule>;
    update(scheduleId: string, scheduleData: UpdateScheduleRequest): Promise<DoctorSchedule | null>;
    delete(scheduleId: string): Promise<boolean>;
    upsertSchedule(doctor_id: string, dayOfWeek: number, scheduleData: UpdateScheduleRequest): Promise<DoctorSchedule>;
    getAvailability(doctor_id: string, date: Date): Promise<DoctorSchedule | null>;
    getWeeklySchedule(doctor_id: string): Promise<DoctorSchedule[]>;
    bulkUpdateSchedule(doctor_id: string, schedules: UpdateScheduleRequest[]): Promise<DoctorSchedule[]>;
    getAvailableTimeSlots(doctor_id: string, date: Date): Promise<string[]>;
    private timeStringToMinutes;
    private minutesToTimeString;
    private mapSupabaseScheduleToSchedule;
    getTodaySchedule(doctor_id: string): Promise<any[]>;
    private generateTimeSlotsForSchedule;
}
//# sourceMappingURL=schedule.repository.d.ts.map