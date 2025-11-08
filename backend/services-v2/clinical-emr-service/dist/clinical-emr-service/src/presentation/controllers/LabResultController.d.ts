/**
 * LabResultController - Presentation Layer
 * HTTP request handlers for lab results
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, REST API
 */
import { Request, Response } from 'express';
import { CreateLabResultUseCase } from '../../application/use-cases/CreateLabResultUseCase';
import { GetLabResultUseCase } from '../../application/use-cases/GetLabResultUseCase';
import { UpdateLabResultUseCase } from '../../application/use-cases/UpdateLabResultUseCase';
import { GetPatientLabResultsUseCase } from '../../application/use-cases/GetPatientLabResultsUseCase';
import { BaseController } from './BaseController';
export declare class LabResultController extends BaseController {
    private readonly createLabResultUseCase;
    private readonly getLabResultUseCase;
    private readonly updateLabResultUseCase;
    private readonly getPatientLabResultsUseCase;
    constructor(createLabResultUseCase: CreateLabResultUseCase, getLabResultUseCase: GetLabResultUseCase, updateLabResultUseCase: UpdateLabResultUseCase, getPatientLabResultsUseCase: GetPatientLabResultsUseCase);
    /**
     * Create new lab result
     * POST /api/v2/clinical-emr/lab-results
     */
    createLabResult(req: Request, res: Response): Promise<void>;
    /**
     * Get lab result by ID
     * GET /api/v2/clinical-emr/lab-results/:id
     */
    getLabResult(req: Request, res: Response): Promise<void>;
    /**
     * Update lab result
     * PUT /api/v2/clinical-emr/lab-results/:id
     */
    updateLabResult(req: Request, res: Response): Promise<void>;
    /**
     * Get patient lab results
     * GET /api/v2/clinical-emr/patients/:patientId/lab-results
     */
    getPatientLabResults(req: Request, res: Response): Promise<void>;
}
//# sourceMappingURL=LabResultController.d.ts.map