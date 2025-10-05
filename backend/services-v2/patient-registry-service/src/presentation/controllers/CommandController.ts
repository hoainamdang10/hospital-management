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
import { ResponseHelper } from '../middleware/ErrorHandlingMiddleware';

/**
 * Command Controller
 * Exposes CQRS command handlers via REST API
 */
export class CommandController {
  constructor(
    private readonly logger: ILogger,
    private readonly commandHandlers: PatientCommandHandlers
  ) {}

  /**
   * Execute a patient command
   * POST /api/v1/commands/patient
   */
  async executePatientCommand(req: Request, res: Response): Promise<void> {
    const command = req.body;

    this.logger.info('Executing patient command', {
      commandType: command.commandType,
      commandId: command.commandId
    });

    const result = await this.commandHandlers.handleCommand(command);

    if (result.success) {
      ResponseHelper.success(res, result, result.message);
    } else {
      res.status(400).json({
        success: false,
        message: result.message
      });
    }
  }

  /**
   * Get command handler status
   * GET /api/v1/commands/status
   */
  async getCommandHandlerStatus(_req: Request, res: Response): Promise<void> {
    this.logger.info('Getting command handler status');

    const status = this.commandHandlers.getStatus();

    ResponseHelper.success(res, status, 'Command handler status retrieved');
  }
}

