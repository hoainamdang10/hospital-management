import { Request, Response } from "express";
export declare class PatientHealthcareController {
    private healthcareService;
    constructor();
    validatePatientFHIR: (req: Request, res: Response) => Promise<void>;
    getPatientFHIR: (req: Request, res: Response) => Promise<void>;
    getPatientMedicalHistory: (req: Request, res: Response) => Promise<void>;
    getDiagnosesByCategory: (req: Request, res: Response) => Promise<void>;
    getHealthcareTimeline: (req: Request, res: Response) => Promise<void>;
    getHealthcareCompliance: (req: Request, res: Response) => Promise<void>;
    getHealthSummary: (req: Request, res: Response) => Promise<void>;
}
//# sourceMappingURL=healthcare.controller.d.ts.map