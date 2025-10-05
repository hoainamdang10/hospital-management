"use strict";
/**
 * CommandController - CQRS Command Controller
 * Handles command-based operations for Patient Registry
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, CQRS Pattern
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommandController = void 0;
const ErrorHandlingMiddleware_1 = require("../middleware/ErrorHandlingMiddleware");
/**
 * Command Controller
 * Exposes CQRS command handlers via REST API
 */
class CommandController {
    constructor(logger, commandHandlers) {
        this.logger = logger;
        this.commandHandlers = commandHandlers;
    }
    /**
     * Execute a patient command
     * POST /api/v1/commands/patient
     */
    async executePatientCommand(req, res) {
        const command = req.body;
        this.logger.info('Executing patient command', {
            commandType: command.commandType,
            commandId: command.commandId
        });
        const result = await this.commandHandlers.handleCommand(command);
        if (result.success) {
            ErrorHandlingMiddleware_1.ResponseHelper.success(res, result, result.message);
        }
        else {
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
    async getCommandHandlerStatus(_req, res) {
        this.logger.info('Getting command handler status');
        const status = this.commandHandlers.getStatus();
        ErrorHandlingMiddleware_1.ResponseHelper.success(res, status, 'Command handler status retrieved');
    }
}
exports.CommandController = CommandController;
//# sourceMappingURL=CommandController.js.map