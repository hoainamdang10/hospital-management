import { CreatePatientDto, Patient, PatientSearchFilters, PatientWithProfile, UpdatePatientDto } from "../types/patient.types";
export declare class PatientRepository {
    private supabase;
    private pool;
    private calculateAge;
    getAllPatients(filters?: PatientSearchFilters, page?: number, limit?: number): Promise<{
        patients: PatientWithProfile[];
        total: number;
    }>;
    private getAllPatientsDirectQuery;
    getPatientById(patient_id: string): Promise<PatientWithProfile | null>;
    getPatientByProfileId(profileId: string): Promise<PatientWithProfile | null>;
    getPatientsByDoctorId(doctor_id: string): Promise<PatientWithProfile[]>;
    verifyProfileExists(profileId: string): Promise<boolean>;
    createPatient(patientData: CreatePatientDto): Promise<Patient>;
    updatePatient(patient_id: string, updateData: UpdatePatientDto): Promise<Patient>;
    deletePatient(patient_id: string): Promise<boolean>;
    patientExists(patient_id: string): Promise<boolean>;
    getPatientStats(): Promise<{
        total: number;
        active: number;
        inactive: number;
        byGender: {
            male: number;
            female: number;
            other: number;
        };
        byBloodType: Record<string, number>;
    }>;
    searchPatients(searchTerm: string, limit?: number): Promise<PatientWithProfile[]>;
    getPatientsWithUpcomingAppointments(): Promise<PatientWithProfile[]>;
    getPatientMedicalSummary(patient_id: string): Promise<{
        patient: PatientWithProfile | null;
        appointmentCount: number;
        lastAppointment: string | null;
        medicalHistory: string[];
        allergies: string[];
        currentMedications: any;
    }>;
    getPatientCountForDoctor(doctor_id: string): Promise<number>;
    getPatientStatsForDoctor(doctor_id: string): Promise<any>;
}
//# sourceMappingURL=patient.repository.d.ts.map