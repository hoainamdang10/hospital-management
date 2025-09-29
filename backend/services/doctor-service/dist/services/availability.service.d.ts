export interface TimeSlot {
    start_time: string;
    end_time: string;
    is_available: boolean;
    appointment_count: number;
    max_appointments: number;
    slot_type: "available" | "booked" | "break" | "unavailable";
    appointment_id?: string;
    patient_name?: string;
    appointment_type?: string;
}
export interface DoctorAvailability {
    doctor_id: string;
    date: string;
    day_of_week: number;
    is_working_day: boolean;
    start_time?: string;
    end_time?: string;
    break_start?: string;
    break_end?: string;
    max_appointments: number;
    slot_duration: number;
    total_slots: number;
    available_slots: number;
    booked_slots: number;
    time_slots: TimeSlot[];
}
export interface AvailabilityQuery {
    doctor_id: string;
    date: string;
    duration?: number;
    appointment_type?: string;
    include_breaks?: boolean;
}
export declare class AvailabilityService {
    getDoctorAvailability(query: AvailabilityQuery): Promise<DoctorAvailability | null>;
    getAvailableTimeSlots(doctor_id: string, date: string, duration?: number): Promise<TimeSlot[]>;
    isTimeSlotAvailable(doctor_id: string, date: string, start_time: string, end_time: string): Promise<boolean>;
    private getDoctorSchedule;
    private getDoctorAppointments;
    private generateTimeSlots;
    private calculateAvailabilityStats;
    private isWithinWorkingHours;
    private checkAppointmentConflict;
    private timeToMinutes;
    private minutesToTime;
}
//# sourceMappingURL=availability.service.d.ts.map