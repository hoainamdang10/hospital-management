interface PatientData {
    patient_id: string;
    full_name: string;
    phone_number?: string;
    email?: string;
    date_of_birth?: string;
    gender?: string;
}
interface PatientStats {
    total_patients: number;
    unique_patients_this_month: number;
    total_unique_patients?: number;
    new_patients_last_30_days?: number;
    returning_patients_last_30_days?: number;
    new_vs_returning_ratio?: {
        new_percentage: number;
        returning_percentage: number;
    };
    demographics?: {
        gender: {
            male: number;
            female: number;
            other: number;
        };
        age_groups: {
            '0-18': number;
            '19-35': number;
            '36-50': number;
            '51-65': number;
            '65+': number;
        };
    };
    appointment_statistics?: {
        total_appointments: number;
        completed_appointments: number;
        average_appointments_per_patient: number;
        completion_rate: number;
    };
}
export declare class PatientService {
    private apiGatewayClient;
    constructor();
    getPatientById(patient_id: string): Promise<PatientData | null>;
    getPatientsByIds(patientIds: string[]): Promise<PatientData[]>;
    getDoctorPatientStats(doctor_id: string): Promise<PatientStats>;
    isServiceAvailable(): Promise<boolean>;
    searchPatients(query: string, limit?: number): Promise<PatientData[]>;
    getPatientCountForDoctor(doctor_id: string): Promise<number>;
}
export {};
//# sourceMappingURL=patient.service.d.ts.map