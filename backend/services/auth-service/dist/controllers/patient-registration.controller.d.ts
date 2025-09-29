import { Request, Response } from "express";
export interface PatientRegistrationRequest {
    email: string;
    password: string;
    full_name: string;
    national_id: string;
    date_of_birth: string;
    gender: "male" | "female" | "other";
    phone_number: string;
    address: {
        province: string;
        district: string;
        ward: string;
        street: string;
        house_number?: string;
    };
    blood_type?: "A+" | "A-" | "B+" | "B-" | "AB+" | "AB-" | "O+" | "O-";
    weight?: number;
    height?: number;
    medical_history: string[];
    drug_allergies: string[];
    current_medications?: string;
    insurance_number?: string;
    insurance_provider?: string;
    insurance_valid_from?: string;
    insurance_valid_to?: string;
    emergency_contact: {
        name: string;
        relationship: string;
        phone_number: string;
        address?: string;
    };
    occupation?: string;
    notes?: string;
}
export declare class PatientRegistrationController {
    private authService;
    constructor();
    registerPatient: (req: Request, res: Response) => Promise<void>;
    validatePatientData: (data: PatientRegistrationRequest) => string[];
    getRegistrationStats: (req: Request, res: Response) => Promise<void>;
}
//# sourceMappingURL=patient-registration.controller.d.ts.map