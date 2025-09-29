import { CreateEmbeddedPrescriptionRequest, CreateMedicalRecordRequest, EmbeddedPrescription, MedicalRecord, UpdateEmbeddedPrescriptionRequest, UpdateMedicalRecordRequest } from "../types/medical-record.types";
export declare class MedicalRecordRepository {
    private supabase;
    private pool;
    findAll(limit?: number, offset?: number): Promise<MedicalRecord[]>;
    findById(recordId: string): Promise<MedicalRecord | null>;
    findByPatientId(patient_id: string): Promise<MedicalRecord[]>;
    findByDoctorId(doctor_id: string): Promise<MedicalRecord[]>;
    create(recordData: CreateMedicalRecordRequest, createdBy: string): Promise<MedicalRecord>;
    update(recordId: string, recordData: UpdateMedicalRecordRequest, updatedBy: string): Promise<MedicalRecord>;
    delete(recordId: string): Promise<void>;
    count(): Promise<number>;
    insertVital(recordId: string, payload: import("../types/medical-record.types").CreateVitalSignsRequest, recordedBy: string): Promise<void>;
    listVitals(recordId: string, from?: string, to?: string): Promise<import("../types/medical-record.types").VitalSignsHistory[]>;
    createLabResult(recordId: string, payload: import("../types/medical-record.types").CreateLabResultRequest): Promise<void>;
    updateLabResult(recordId: string, resultId: string, payload: Partial<import("../types/medical-record.types").CreateLabResultRequest>): Promise<void>;
    listLabResultsByRecord(recordId: string): Promise<any[]>;
    listLabResultsByPatient(patientId: string): Promise<any[]>;
    getPatientHistory(patientId: string, from?: string, to?: string, type?: "records" | "vitals" | "labs" | "all"): Promise<any[]>;
    createPrescriptionForRecord(recordId: string, prescriptionData: CreateEmbeddedPrescriptionRequest, createdBy: string): Promise<EmbeddedPrescription>;
    updatePrescriptionInRecord(recordId: string, prescriptionId: string, updateData: UpdateEmbeddedPrescriptionRequest): Promise<EmbeddedPrescription>;
    getPrescriptionsByPatientId(patient_id: string): Promise<EmbeddedPrescription[]>;
    getPrescriptionsByDoctorId(doctor_id: string): Promise<EmbeddedPrescription[]>;
    private mapSupabaseRecordToMedicalRecord;
}
//# sourceMappingURL=medical-record.repository.d.ts.map