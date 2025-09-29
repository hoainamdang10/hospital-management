export interface Receptionist {
    receptionist_id: string;
    profile_id: string;
    full_name: string;
    department_id?: string;
    shift_schedule: any;
    access_permissions: {
        can_manage_appointments: boolean;
        can_manage_patients: boolean;
        can_view_medical_records: boolean;
    };
    can_manage_appointments: boolean;
    can_manage_patients: boolean;
    can_view_medical_records: boolean;
    languages_spoken: string[];
    status: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
    created_by?: string;
}
export interface CheckInData {
    patient_id: string;
    appointment_id: string;
    receptionist_id: string;
    check_in_time: string;
    insurance_verified: boolean;
    documents_complete: boolean;
    notes?: string;
    status: string;
}
export interface QueueItem {
    id: string;
    patient_id: string;
    appointment_id: string;
    patient_name: string;
    doctor_name: string;
    appointment_time: string;
    status: string;
    check_in_time?: string;
    queue_number: number;
    estimated_wait_time: number;
}
export declare class ReceptionistRepository {
    private pool;
    private supabase;
    findById(receptionistId: string): Promise<Receptionist | null>;
    findByProfileId(profileId: string): Promise<Receptionist | null>;
    updateShiftSchedule(receptionistId: string, schedule: any): Promise<boolean>;
    createCheckIn(checkInData: CheckInData): Promise<any>;
    getQueue(): Promise<QueueItem[]>;
    getDashboardStats(): Promise<any>;
}
//# sourceMappingURL=receptionist.repository.d.ts.map