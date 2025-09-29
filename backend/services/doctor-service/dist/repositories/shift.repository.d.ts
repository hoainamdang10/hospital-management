import { DoctorShift, CreateShiftRequest, UpdateShiftRequest } from '@hospital/shared/dist/types/doctor.types';
export declare class ShiftRepository {
    private supabase;
    constructor();
    findByDoctorId(doctor_id: string, limit?: number, offset?: number): Promise<DoctorShift[]>;
    findById(shiftId: string): Promise<DoctorShift | null>;
    findByDateRange(doctor_id: string, startDate: Date, endDate: Date): Promise<DoctorShift[]>;
    findByDepartment(departmentId: string, date?: Date, limit?: number): Promise<DoctorShift[]>;
    create(shiftData: CreateShiftRequest): Promise<DoctorShift>;
    update(shiftId: string, shiftData: UpdateShiftRequest): Promise<DoctorShift | null>;
    delete(shiftId: string): Promise<boolean>;
    confirmShift(shiftId: string): Promise<DoctorShift | null>;
    completeShift(shiftId: string, notes?: string): Promise<DoctorShift | null>;
    cancelShift(shiftId: string, reason?: string): Promise<DoctorShift | null>;
    getUpcomingShifts(doctor_id: string, days?: number): Promise<DoctorShift[]>;
    getEmergencyShifts(departmentId?: string, date?: Date): Promise<DoctorShift[]>;
    getShiftStatistics(doctor_id: string, startDate: Date, endDate: Date): Promise<{
        total_shifts: number;
        completed_shifts: number;
        cancelled_shifts: number;
        emergency_shifts: number;
        total_hours: number;
    }>;
    private checkShiftConflicts;
    private timeStringToMinutes;
    private mapSupabaseShiftToShift;
}
//# sourceMappingURL=shift.repository.d.ts.map