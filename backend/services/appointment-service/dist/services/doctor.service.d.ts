import { DoctorInfo } from '../types/appointment.types';
export declare class DoctorService {
    private apiGatewayClient;
    constructor();
    getDoctorById(doctor_id: string): Promise<DoctorInfo | null>;
    checkDoctorAvailability(doctor_id: string, date: string, startTime: string, endTime: string): Promise<boolean>;
    getAvailableTimeSlots(doctor_id: string, date: string, duration?: number): Promise<{
        start_time: string;
        end_time: string;
    }[]>;
    verifyDoctorExists(doctor_id: string): Promise<boolean>;
    private timeToMinutes;
    private minutesToTime;
}
//# sourceMappingURL=doctor.service.d.ts.map