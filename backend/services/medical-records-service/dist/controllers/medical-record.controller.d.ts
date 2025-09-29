import { Request, Response } from "express";
interface AuthenticatedRequest extends Request {
    user?: {
        id: string;
        email: string;
        role: string;
    };
}
export declare class MedicalRecordController {
    private medicalRecordRepository;
    constructor();
    getAllMedicalRecords(req: Request, res: Response): Promise<void>;
    getMedicalRecordById(req: Request, res: Response): Promise<void>;
    getMedicalRecordsByPatientId(req: Request, res: Response): Promise<void>;
    getMedicalRecordsByDoctorId(req: Request, res: Response): Promise<void>;
    createMedicalRecord(req: AuthenticatedRequest, res: Response): Promise<void>;
    updateMedicalRecord(req: AuthenticatedRequest, res: Response): Promise<void>;
    deleteMedicalRecord(req: Request, res: Response): Promise<void>;
    addVitalSigns(req: AuthenticatedRequest, res: Response): Promise<void>;
    listVitalSigns(req: Request, res: Response): Promise<void>;
    createLabResult(req: AuthenticatedRequest, res: Response): Promise<void>;
    updateLabResult(req: AuthenticatedRequest, res: Response): Promise<void>;
    listLabResultsByRecord(req: Request, res: Response): Promise<void>;
    listLabResultsByPatient(req: Request, res: Response): Promise<void>;
    getPatientHistory(req: Request, res: Response): Promise<void>;
    createPrescriptionForRecord(req: AuthenticatedRequest, res: Response): Promise<void>;
    updatePrescriptionInRecord(req: AuthenticatedRequest, res: Response): Promise<void>;
    getPrescriptionsByPatientId(req: Request, res: Response): Promise<void>;
    getPrescriptionsByDoctorId(req: Request, res: Response): Promise<void>;
}
export {};
//# sourceMappingURL=medical-record.controller.d.ts.map