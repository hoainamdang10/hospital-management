export interface MedicalRecord {
    record_id: string;
    patient_id: string;
    doctor_id: string;
    appointment_id?: string;
    visit_date: Date;
    symptoms?: string;
    examination_notes?: string;
    diagnosis?: string;
    treatment?: string;
    medications?: string;
    notes?: string;
    basic_vitals?: BasicVitalSigns;
    prescriptions?: EmbeddedPrescription[];
    status: "active" | "archived" | "deleted";
    created_at: Date;
    updated_at: Date;
    created_by?: string;
    updated_by?: string;
}
export interface BasicVitalSigns {
    temperature?: number;
    blood_pressure?: string;
    heart_rate?: number;
    weight?: number;
    height?: number;
}
export interface MedicalRecordAttachment {
    attachment_id: string;
    record_id: string;
    file_name: string;
    file_path: string;
    file_type: string;
    file_size: number;
    mime_type: string;
    description?: string;
    uploaded_by: string;
    uploaded_at: Date;
}
export interface CreateMedicalRecordRequest {
    patient_id: string;
    doctor_id: string;
    appointment_id?: string;
    visit_date: string;
    symptoms?: string;
    examination_notes?: string;
    diagnosis?: string;
    treatment?: string;
    medications?: string;
    notes?: string;
    basic_vitals?: BasicVitalSigns;
    prescriptions?: CreateEmbeddedPrescriptionRequest[];
}
export interface UpdateMedicalRecordRequest {
    symptoms?: string;
    examination_notes?: string;
    diagnosis?: string;
    treatment?: string;
    medications?: string;
    notes?: string;
    basic_vitals?: BasicVitalSigns;
    prescriptions?: CreateEmbeddedPrescriptionRequest[];
    status?: "active" | "archived" | "deleted";
}
export interface VitalSignsHistory {
    vital_id: string;
    record_id: string;
    recorded_at: Date;
    recorded_by: string;
    temperature?: number;
    blood_pressure_systolic?: number;
    blood_pressure_diastolic?: number;
    heart_rate?: number;
    respiratory_rate?: number;
    oxygen_saturation?: number;
    weight?: number;
    height?: number;
    bmi?: number;
    notes?: string;
}
export interface LabResult {
    result_id: string;
    record_id: string;
    test_name: string;
    test_type: string;
    test_date: Date;
    result_value?: string;
    reference_range?: string;
    unit?: string;
    status: "pending" | "completed" | "cancelled";
    result_date?: Date;
    lab_technician?: string;
    notes?: string;
    created_at: Date;
}
export interface EmbeddedPrescription {
    prescription_id: string;
    prescription_date: Date;
    status: "active" | "completed" | "cancelled";
    medications: SimplifiedMedication[];
    notes?: string;
    total_cost?: number;
    created_at: Date;
    updated_at: Date;
}
export interface SimplifiedMedication {
    medication_name: string;
    dosage: string;
    instructions: string;
    quantity: number;
    cost_per_unit?: number;
    total_cost?: number;
}
export interface CreateEmbeddedPrescriptionRequest {
    prescription_date: string;
    medications: CreateSimplifiedMedicationRequest[];
    notes?: string;
}
export interface CreateSimplifiedMedicationRequest {
    medication_name: string;
    dosage: string;
    instructions: string;
    quantity: number;
    cost_per_unit?: number;
}
export interface UpdateEmbeddedPrescriptionRequest {
    status?: "active" | "completed" | "cancelled";
    medications?: CreateSimplifiedMedicationRequest[];
    notes?: string;
}
export interface CreateVitalSignsRequest {
    recorded_at: string;
    temperature?: number;
    blood_pressure_systolic?: number;
    blood_pressure_diastolic?: number;
    heart_rate?: number;
    respiratory_rate?: number;
    oxygen_saturation?: number;
    weight?: number;
    height?: number;
    notes?: string;
}
export interface CreateLabResultRequest {
    test_name: string;
    test_type: string;
    test_date: string;
    result_value?: string;
    reference_range?: string;
    unit?: string;
    result_date?: string;
    lab_technician?: string;
    notes?: string;
    status?: "pending" | "completed" | "cancelled";
}
//# sourceMappingURL=medical-record.types.d.ts.map