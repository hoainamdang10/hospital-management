/**
 * CommandController - CQRS Command Controller
 * Handles command-based operations for Patient Registry
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, CQRS Pattern
 */
import { Request, Response } from 'express';
import { ILogger } from '@shared/application/services/logger.interface';
import { PatientCommandHandlers } from '../../application/handlers/PatientCommandHandlers';
/**
 * Command Controller
 * Exposes CQRS command handlers via REST API
 */
export declare class CommandController {
    private readonly logger;
    private readonly commandHandlers;
    constructor(logger: ILogger, commandHandlers: PatientCommandHandlers);
    /**
     * Execute a patient command
     * POST /api/v1/commands/patient
     */
    executePatientCommand(req: Request, res: Response): Promise<void>;
    /**
     * Get command handler status
     * GET /api/v1/commands/status
     */
    getCommandHandlerStatus(_req: Request, res: Response): Promise<void>;
}
//# sourceMappingURL=CommandController.d.ts.map