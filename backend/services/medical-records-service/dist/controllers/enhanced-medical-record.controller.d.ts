import { Request, Response } from "express";
interface AuthenticatedRequest extends Request {
    user?: {
        id: string;
        email: string;
        role: string;
    };
    shouldMaskData?: boolean;
}
export declare class EnhancedMedicalRecordController {
    private medicalRecordRepository;
    constructor();
    getAllMedicalRecords(req: AuthenticatedRequest, res: Response): Promise<void>;
    getMedicalRecordsByPatient(req: AuthenticatedRequest, res: Response): Promise<void>;
    createMedicalRecord(req: AuthenticatedRequest, res: Response): Promise<void>;
    updateMedicalRecord(req: AuthenticatedRequest, res: Response): Promise<void>;
    getHealthMetrics(req: Request, res: Response): Promise<void>;
    private maskSensitiveData;
    private maskText;
    private extractServices;
    private isCriticalResult;
    private trackChanges;
}
export declare const enhancedMedicalRecordController: EnhancedMedicalRecordController;
export {};
//# sourceMappingURL=enhanced-medical-record.controller.d.ts.map