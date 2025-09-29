export interface FHIRPractitioner {
    resourceType: "Practitioner";
    id: string;
    identifier: Array<{
        use: string;
        system: string;
        value: string;
    }>;
    active: boolean;
    name: Array<{
        use: string;
        family: string;
        given: string[];
        prefix?: string[];
        suffix?: string[];
    }>;
    telecom: Array<{
        system: string;
        value: string;
        use: string;
    }>;
    address?: Array<{
        use: string;
        line: string[];
        city: string;
        state: string;
        postalCode: string;
        country: string;
    }>;
    gender?: string;
    birthDate?: string;
    qualification: Array<{
        identifier: Array<{
            system: string;
            value: string;
        }>;
        code: {
            coding: Array<{
                system: string;
                code: string;
                display: string;
            }>;
        };
        period?: {
            start: string;
            end?: string;
        };
        issuer?: {
            display: string;
        };
    }>;
}
export interface FHIRValidationResult {
    isValid: boolean;
    fhir_compliance_score: number;
    errors: string[];
    warnings: string[];
    validated_at: string;
}
export interface ICD10Code {
    code: string;
    description: string;
    category: string;
    subcategory?: string;
    notes?: string;
    includes?: string[];
    excludes?: string[];
}
export interface ICD10SearchResult {
    codes: ICD10Code[];
    total: number;
    query: string;
    search_time: number;
}
export interface CreateDiagnosisRequest {
    patient_id: string;
    doctor_id: string;
    appointment_id?: string;
    icd10_code: string;
    description: string;
    diagnosis_type: "primary" | "secondary" | "differential";
    severity?: "mild" | "moderate" | "severe" | "critical";
    status: "active" | "resolved" | "inactive" | "chronic" | "recurrent";
    onset_date?: string;
    diagnosis_date?: string;
    notes?: string;
    clinical_notes?: string;
    follow_up_required?: boolean;
}
export interface UpdateDiagnosisRequest {
    icd10_code?: string;
    description?: string;
    diagnosis_type?: "primary" | "secondary" | "differential";
    severity?: "mild" | "moderate" | "severe" | "critical";
    status?: "active" | "resolved" | "inactive" | "chronic" | "recurrent";
    onset_date?: string;
    diagnosis_date?: string;
    notes?: string;
    clinical_notes?: string;
    follow_up_required?: boolean;
}
export interface Diagnosis {
    diagnosis_id: string;
    patient_id: string;
    doctor_id: string;
    appointment_id?: string;
    icd10_code: string;
    description: string;
    diagnosis_type: "primary" | "secondary" | "differential";
    severity?: "mild" | "moderate" | "severe" | "critical";
    status: "active" | "resolved" | "inactive" | "chronic" | "recurrent";
    onset_date?: string;
    diagnosis_date?: string;
    notes?: string;
    clinical_notes?: string;
    follow_up_required?: boolean;
    id?: string;
    created_at: string;
    updated_at: string;
    created_by: string;
    updated_by?: string;
}
export interface HealthcareMetrics {
    total_diagnoses: number;
    active_diagnoses: number;
    resolved_diagnoses: number;
    fhir_compliance_rate: number;
    icd10_usage_stats: {
        [category: string]: number;
    };
    last_updated: string;
}
export interface FHIRPatient {
    resourceType: "Patient";
    id: string;
    identifier: Array<{
        use: string;
        system: string;
        value: string;
    }>;
    active: boolean;
    name: Array<{
        use: string;
        family: string;
        given: string[];
        prefix?: string[];
        suffix?: string[];
    }>;
    telecom: Array<{
        system: string;
        value: string;
        use: string;
    }>;
    gender?: string;
    birthDate?: string;
    address?: Array<{
        use: string;
        line: string[];
        city: string;
        state: string;
        postalCode: string;
        country: string;
    }>;
    maritalStatus?: {
        coding: Array<{
            system: string;
            code: string;
            display: string;
        }>;
    };
    contact?: Array<{
        relationship: Array<{
            coding: Array<{
                system: string;
                code: string;
                display: string;
            }>;
        }>;
        name: {
            family: string;
            given: string[];
        };
        telecom: Array<{
            system: string;
            value: string;
            use: string;
        }>;
    }>;
}
export interface PatientDiagnosis extends Diagnosis {
    patient_name?: string;
    doctor_name?: string;
    appointment_date?: string;
    follow_up_required?: boolean;
    diagnosis_date?: string;
}
export interface HealthcareServiceResponse<T = any> {
    success: boolean;
    data?: T;
    error?: {
        message: string;
        code?: string;
        details?: any;
    };
    message?: string;
    timestamp?: string;
}
//# sourceMappingURL=healthcare.types.d.ts.map