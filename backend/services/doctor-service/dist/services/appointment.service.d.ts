interface AppointmentData {
    appointment_id: string;
    patient_id: string;
    patient_name?: string;
    patient_phone?: string;
    patient_email?: string;
    appointment_date: string;
    appointment_time: string;
    status: string;
    appointment_type: string;
    notes?: string;
}
interface AppointmentStats {
    total_appointments: number;
    appointments_this_month: number;
    appointments_today: number;
    monthly_stats: Array<{
        month: string;
        appointments: number;
        patients: number;
    }>;
    appointment_types: Array<{
        type: string;
        count: number;
        percentage: number;
    }>;
}
export declare class AppointmentService {
    private apiGatewayClient;
    constructor();
    getDoctorAppointments(doctor_id: string, filters?: {
        date?: string;
        status?: string;
        page?: number;
        limit?: number;
    }): Promise<{
        appointments: AppointmentData[];
        pagination?: any;
    }>;
    getDoctorAppointmentStats(doctor_id: string): Promise<AppointmentStats>;
    getDoctorPatientCount(doctor_id: string): Promise<number>;
    isServiceAvailable(): Promise<boolean>;
    getTodayAppointments(doctor_id: string): Promise<AppointmentData[]>;
    getMonthlyAppointments(doctor_id: string): Promise<AppointmentData[]>;
    getUpcomingAppointments(doctor_id: string): Promise<AppointmentData[]>;
    getRecentActivity(doctor_id: string): Promise<any[]>;
    private getDefaultStats;
}
export {};
//# sourceMappingURL=appointment.service.d.ts.map