/**
 * RefundPaymentUseCase - Application Layer
 * Handles payment refunds for cancelled appointments
 *
 * Flow:
 * 1. Find invoice by appointmentId
 * 2. Validate invoice is paid
 * 3. Calculate refund amount based on policy
 * 4. Process refund via Invoice.processRefund()
 * 5. Publish PaymentRefundedEvent
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, Event-Driven Architecture
 */
import { BaseHealthcareUseCase } from '../../../../shared/application/use-cases/base/use-case.interface';
import { IInvoiceRepository } from '../../domain/repositories/IInvoiceRepository';
import { IEventBus } from '../../../../shared/application/services/event-bus.interface';
import { ILogger } from '../../../../shared/application/services/logger.interface';
export interface RefundPaymentRequest {
    appointmentId: string;
    patientId: string;
    refundPercentage: number;
    reason: string;
    refundedBy: string;
}
export interface RefundPaymentResponse {
    success: boolean;
    message: string;
    refundId?: string;
    refundAmount?: number;
    errors?: string[];
}
export declare class RefundPaymentUseCase extends BaseHealthcareUseCase<RefundPaymentRequest, RefundPaymentResponse> {
    private readonly invoiceRepository;
    private readonly eventBus;
    private readonly logger;
    constructor(invoiceRepository: IInvoiceRepository, eventBus: IEventBus, logger: ILogger);
    protected executeInternal(request: RefundPaymentRequest): Promise<RefundPaymentResponse>;
    authorize(request: RefundPaymentRequest, userId: string): Promise<boolean>;
    involvesPHI(request: RefundPaymentRequest): boolean;
    getPatientId(request: RefundPaymentRequest): string | null;
}
//# sourceMappingURL=RefundPaymentUseCase.d.ts.map