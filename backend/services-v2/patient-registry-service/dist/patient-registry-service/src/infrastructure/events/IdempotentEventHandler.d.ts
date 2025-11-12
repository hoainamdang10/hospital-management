/**
 * IdempotentEventHandler - Wrapper for idempotent event processing
 *
 * @author Hospital Management Team
 * @version 2.0.0
 */
import { ILogger } from '@shared/application/services/logger.interface';
import { AuditService } from '../audit/AuditService';
export interface EventMessage {
    eventId: string;
    eventType: string;
    payload: any;
}
export declare class IdempotentEventHandler<T> {
    private handlerName;
    private auditService;
    private logger;
    private handler;
    constructor(handlerName: string, auditService: AuditService, logger: ILogger, handler: (eventData: T) => Promise<void>);
    /**
     * Handle event with idempotency check
     */
    handle(message: EventMessage): Promise<void>;
}
//# sourceMappingURL=IdempotentEventHandler.d.ts.map