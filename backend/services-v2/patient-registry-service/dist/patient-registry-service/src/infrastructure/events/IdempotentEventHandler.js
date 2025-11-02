"use strict";
/**
 * IdempotentEventHandler - Wrapper for idempotent event processing
 *
 * @author Hospital Management Team
 * @version 2.0.0
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.IdempotentEventHandler = void 0;
class IdempotentEventHandler {
    constructor(handlerName, auditService, logger, handler) {
        this.handlerName = handlerName;
        this.auditService = auditService;
        this.logger = logger;
        this.handler = handler;
    }
    /**
     * Handle event with idempotency check
     */
    async handle(message) {
        const startTime = Date.now();
        try {
            // Check if event was already processed
            const isProcessed = await this.auditService.isEventProcessed(message.eventId);
            if (isProcessed) {
                this.logger.info('Event already processed (idempotency check)', {
                    eventId: message.eventId,
                    eventType: message.eventType,
                    handler: this.handlerName
                });
                return;
            }
            // Mark as processing
            await this.auditService.markEventProcessing(message.eventId, message.eventType, this.handlerName, message.payload);
            // Execute handler
            await this.handler(message.payload);
            // Mark as completed
            const processingDuration = Date.now() - startTime;
            await this.auditService.markEventCompleted(message.eventId, processingDuration);
            this.logger.info('Event processed successfully', {
                eventId: message.eventId,
                eventType: message.eventType,
                handler: this.handlerName,
                processingDuration: `${processingDuration}ms`
            });
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            const errorStack = error instanceof Error ? error.stack : undefined;
            // Mark as failed
            await this.auditService.markEventFailed(message.eventId, errorMessage, errorStack);
            this.logger.error('Event processing failed', {
                eventId: message.eventId,
                eventType: message.eventType,
                handler: this.handlerName,
                error: errorMessage
            });
            throw error;
        }
    }
}
exports.IdempotentEventHandler = IdempotentEventHandler;
//# sourceMappingURL=IdempotentEventHandler.js.map