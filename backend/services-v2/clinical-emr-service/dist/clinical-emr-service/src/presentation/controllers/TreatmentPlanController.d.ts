/**
 * TreatmentPlanController - HTTP Controller for Treatment Plans
 * @compliance Clean Architecture, RESTful API
 */
import { Request, Response, NextFunction } from 'express';
import { CreateTreatmentPlanUseCase, GetTreatmentPlanUseCase, UpdateTreatmentPlanUseCase, CompleteTreatmentPlanUseCase, ListTreatmentPlansUseCase } from '../../application/use-cases';
export declare class TreatmentPlanController {
    private readonly createUseCase;
    private readonly getUseCase;
    private readonly updateUseCase;
    private readonly completeUseCase;
    private readonly listUseCase;
    constructor(createUseCase: CreateTreatmentPlanUseCase, getUseCase: GetTreatmentPlanUseCase, updateUseCase: UpdateTreatmentPlanUseCase, completeUseCase: CompleteTreatmentPlanUseCase, listUseCase: ListTreatmentPlansUseCase);
    createPlan(req: Request, res: Response, next: NextFunction): Promise<void>;
    getPlan(req: Request, res: Response, next: NextFunction): Promise<void>;
    updatePlan(req: Request, res: Response, next: NextFunction): Promise<void>;
    completePlan(req: Request, res: Response, next: NextFunction): Promise<void>;
    listPlans(req: Request, res: Response, next: NextFunction): Promise<void>;
}
//# sourceMappingURL=TreatmentPlanController.d.ts.map