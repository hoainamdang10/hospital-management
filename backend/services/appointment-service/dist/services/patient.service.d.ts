import { PatientInfo } from '../types/appointment.types';
export declare class PatientService {
    private baseUrl;
    constructor();
    getPatientById(patient_id: string): Promise<PatientInfo | null>;
    verifyPatientExists(patient_id: string): Promise<boolean>;
    getPatientAppointmentCount(patient_id: string): Promise<number>;
    hasActiveAppointments(patient_id: string): Promise<boolean>;
}
//# sourceMappingURL=patient.service.d.ts.map