/**
 * PrescriptionController - HTTP Controller for Prescriptions
 * @compliance Clean Architecture, RESTful API, Pharmacy Integration
 */
import { Request, Response, NextFunction } from 'express';
import { CreatePrescriptionUseCase, GetPrescriptionUseCase, DispensePrescriptionUseCase, ListPrescriptionsUseCase } from '../../application/use-cases';
export declare class PrescriptionController {
    private readonly createUseCase;
    private readonly getUseCase;
    private readonly dispenseUseCase;
    private readonly listUseCase;
    constructor(createUseCase: CreatePrescriptionUseCase, getUseCase: GetPrescriptionUseCase, dispenseUseCase: DispensePrescriptionUseCase, listUseCase: ListPrescriptionsUseCase);
    createPrescription(req: Request, res: Response, next: NextFunction): Promise<void>;
    getPrescription(req: Request, res: Response, next: NextFunction): Promise<void>;
    dispensePrescription(req: Request, res: Response, next: NextFunction): Promise<void>;
    listPrescriptions(req: Request, res: Response, next: NextFunction): Promise<void>;
}
//# sourceMappingURL=PrescriptionController.d.ts.map