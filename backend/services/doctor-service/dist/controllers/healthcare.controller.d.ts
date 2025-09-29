import { Request, Response } from "express";
export declare class HealthcareController {
    private healthcareService;
    constructor();
    validateDoctorFHIR: (req: Request, res: Response) => Promise<void>;
    getDoctorFHIR: (req: Request, res: Response) => Promise<void>;
    searchICD10Codes: (req: Request, res: Response) => Promise<void>;
    validateICD10Code: (req: Request, res: Response) => Promise<void>;
    getICD10CodesByCategory: (req: Request, res: Response) => Promise<void>;
    createDiagnosis: (req: Request, res: Response) => Promise<void>;
    getPatientDiagnoses: (req: Request, res: Response) => Promise<void>;
    updateDiagnosis: (req: Request, res: Response) => Promise<void>;
    getHealthcareCompliance: (req: Request, res: Response) => Promise<void>;
}
//# sourceMappingURL=healthcare.controller.d.ts.map