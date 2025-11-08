/**
 * MedicalImagingController - Presentation Layer
 * HTTP request handlers for medical imaging
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, REST API
 */
import { Request, Response } from 'express';
import { CreateMedicalImagingUseCase } from '../../application/use-cases/CreateMedicalImagingUseCase';
import { GetMedicalImagingUseCase } from '../../application/use-cases/GetMedicalImagingUseCase';
import { UpdateMedicalImagingUseCase } from '../../application/use-cases/UpdateMedicalImagingUseCase';
import { GetPatientMedicalImagingUseCase } from '../../application/use-cases/GetPatientMedicalImagingUseCase';
import { BaseController } from './BaseController';
export declare class MedicalImagingController extends BaseController {
    private readonly createMedicalImagingUseCase;
    private readonly getMedicalImagingUseCase;
    private readonly updateMedicalImagingUseCase;
    private readonly getPatientMedicalImagingUseCase;
    constructor(createMedicalImagingUseCase: CreateMedicalImagingUseCase, getMedicalImagingUseCase: GetMedicalImagingUseCase, updateMedicalImagingUseCase: UpdateMedicalImagingUseCase, getPatientMedicalImagingUseCase: GetPatientMedicalImagingUseCase);
    /**
     * Create new medical imaging study
     * POST /api/v2/clinical-emr/medical-imaging
     */
    createMedicalImaging(req: Request, res: Response): Promise<void>;
    /**
     * Get medical imaging by ID
     * GET /api/v2/clinical-emr/medical-imaging/:id
     */
    getMedicalImaging(req: Request, res: Response): Promise<void>;
    /**
     * Update medical imaging
     * PUT /api/v2/clinical-emr/medical-imaging/:id
     */
    updateMedicalImaging(req: Request, res: Response): Promise<void>;
    /**
     * Get patient medical imaging
     * GET /api/v2/clinical-emr/medical-imaging/patients/:patientId
     */
    getPatientMedicalImaging(req: Request, res: Response): Promise<void>;
}
//# sourceMappingURL=MedicalImagingController.d.ts.map