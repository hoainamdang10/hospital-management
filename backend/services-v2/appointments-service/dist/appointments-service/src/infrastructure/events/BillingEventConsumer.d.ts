/**
 * Billing Event Consumer - Infrastructure Layer
 * Consumes billing events from Billing Service
 * Handles billing requirements, insurance constraints, and financial aspects for appointments
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, Event-Driven Architecture
 */
import { InboxRepository } from '../inbox/InboxRepository';
import { IAppointmentRepository } from '../../domain/repositories/IAppointmentRepository';
import { IQueueRepository } from '../../domain/repositories/IQueueRepository';
import { IConflictResolutionService } from '../../application/services/IConflictResolutionService';
import { IReminderService } from '../../application/services/IReminderService';
import { PaymentCompletedHandler } from './handlers/PaymentCompletedHandler';
export interface BillingEventConsumerConfig {
    rabbitmqUrl: string;
    queueName: string;
    exchangeName: string;
    routingKey: string;
    routingKeys?: string[];
}
/**
 * Billing Event Consumer
 * Handles events from Billing Service and updates appointment state accordingly
 */
export declare class BillingEventConsumer {
    private readonly config;
    private readonly appointmentRepository;
    private readonly queueRepository;
    private readonly reminderService;
    private readonly conflictResolutionService;
    private readonly inboxRepository;
    private readonly paymentCompletedHandler;
    private isConnected;
    private channel;
    private connection;
    constructor(config: BillingEventConsumerConfig, appointmentRepository: IAppointmentRepository, queueRepository: IQueueRepository, reminderService: IReminderService, conflictResolutionService: IConflictResolutionService, inboxRepository: InboxRepository, paymentCompletedHandler: PaymentCompletedHandler);
    /**
     * Connect to RabbitMQ and start consuming events
     */
    connect(): Promise<void>;
    /**
     * Handle incoming message
     */
    private handleMessage;
    /**
     * Handle pre-authorization requested event
     */
    private handlePreAuthorizationRequested;
    /**
     * Handle pre-authorization approved event
     */
    private handlePreAuthorizationApproved;
    /**
     * Handle pre-authorization denied event
     */
    private handlePreAuthorizationDenied;
    /**
     * Handle billing rate updated event
     */
    private handleBillingRateUpdated;
    /**
     * Handle insurance coverage verified event
     */
    private handleInsuranceCoverageVerified;
    /**
     * Disconnect from RabbitMQ
     */
    disconnect(): Promise<void>;
    /**
     * Check if consumer is connected
     */
    isConsumerConnected(): boolean;
}
//# sourceMappingURL=BillingEventConsumer.d.ts.map