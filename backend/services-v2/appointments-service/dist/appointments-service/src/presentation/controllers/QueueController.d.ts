/**
 * Queue Controller - Presentation Layer
 * V3 Clean Architecture + DDD Implementation
 *
 * @author Hospital Management Team
 * @version 3.0.0
 * @compliance Clean Architecture, RESTful API, Vietnamese Healthcare Standards
 */
import { Request, Response } from 'express';
import { CallNextPatientUseCase } from '../../application/use-cases/CallNextPatient.use-case';
import { JoinQueueUseCase } from '../../application/use-cases/JoinQueue.use-case';
import { LeaveQueueUseCase } from '../../application/use-cases/LeaveQueue.use-case';
import { GetQueueStatusUseCase } from '../../application/use-cases/GetQueueStatus.use-case';
import { ValidateCancellationPolicyUseCase } from '../../application/use-cases/ValidateCancellationPolicy.use-case';
import { ManageAppointmentRemindersUseCase } from '../../application/use-cases/ManageAppointmentReminders.use-case';
export declare class QueueController {
    private readonly callNextPatientUseCase;
    private readonly joinQueueUseCase;
    private readonly leaveQueueUseCase;
    private readonly getQueueStatusUseCase;
    private readonly validateCancellationPolicyUseCase;
    private readonly manageAppointmentRemindersUseCase;
    constructor(callNextPatientUseCase: CallNextPatientUseCase, joinQueueUseCase: JoinQueueUseCase, leaveQueueUseCase: LeaveQueueUseCase, getQueueStatusUseCase: GetQueueStatusUseCase, validateCancellationPolicyUseCase: ValidateCancellationPolicyUseCase, manageAppointmentRemindersUseCase: ManageAppointmentRemindersUseCase);
    /**
     * POST /api/queue/call-next
     * Call next patient in queue
     */
    callNextPatient(req: Request, res: Response): Promise<void>;
    /**
     * POST /api/queue/join
     * Join queue
     */
    joinQueue(req: Request, res: Response): Promise<void>;
    /**
     * POST /api/queue/leave
     * Leave queue
     */
    leaveQueue(req: Request, res: Response): Promise<void>;
    /**
     * GET /api/queue/status
     * Get queue status
     */
    getQueueStatus(req: Request, res: Response): Promise<void>;
    /**
     * GET /api/appointments/:id/cancellation-policy
     * Validate cancellation policy
     */
    validateCancellationPolicy(req: Request, res: Response): Promise<void>;
    /**
     * POST /api/appointments/:id/reminders
     * Manage appointment reminders
     */
    manageReminders(req: Request, res: Response): Promise<void>;
}
//# sourceMappingURL=QueueController.d.ts.map