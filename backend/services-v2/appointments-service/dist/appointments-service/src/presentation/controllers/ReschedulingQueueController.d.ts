/**
 * Rescheduling Queue Controller - Presentation Layer
 * HTTP endpoints for rescheduling queue management
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, REST API Design
 */
import { Request, Response } from 'express';
import { ReschedulingService } from '../../application/services/ReschedulingService';
import { IReschedulingQueueRepository } from '../../domain/interfaces/IReschedulingQueueRepository';
export interface ReschedulingQueueControllerDependencies {
    reschedulingService: ReschedulingService;
    reschedulingQueueRepository: IReschedulingQueueRepository;
}
export declare class ReschedulingQueueController {
    private dependencies;
    constructor(dependencies: ReschedulingQueueControllerDependencies);
    /**
     * Get queue statistics
     * GET /api/v1/rescheduling-queue/statistics
     */
    getStatistics(req: Request, res: Response): Promise<void>;
    /**
     * Get pending rescheduling entries
     * GET /api/v1/rescheduling-queue/pending
     */
    getPendingEntries(req: Request, res: Response): Promise<void>;
    /**
     * Get rescheduling entry by ID
     * GET /api/v1/rescheduling-queue/:id
     */
    getEntryById(req: Request, res: Response): Promise<void>;
    /**
     * Update patient response
     * PATCH /api/v1/rescheduling-queue/:id/patient-response
     */
    updatePatientResponse(req: Request, res: Response): Promise<void>;
    /**
     * Process expired entries
     * POST /api/v1/rescheduling-queue/process-expired
     */
    processExpiredEntries(req: Request, res: Response): Promise<void>;
    /**
     * Get entries by doctor ID
     * GET /api/v1/rescheduling-queue/doctor/:doctorId
     */
    getEntriesByDoctor(req: Request, res: Response): Promise<void>;
    /**
     * Complete rescheduling
     * POST /api/v1/rescheduling-queue/:id/complete
     */
    completeRescheduling(req: Request, res: Response): Promise<void>;
    /**
     * Find available slots for rescheduling
     * GET /api/v1/rescheduling-queue/:id/available-slots
     */
    findAvailableSlots(req: Request, res: Response): Promise<void>;
}
//# sourceMappingURL=ReschedulingQueueController.d.ts.map