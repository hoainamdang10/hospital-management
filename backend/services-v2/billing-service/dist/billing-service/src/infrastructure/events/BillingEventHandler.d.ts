/**
 * BillingEventHandler - Billing Service Event Handler
 * Handles cross-service events for billing and payment operations
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Event-Driven Architecture, Vietnamese Healthcare Standards, PayOS Integration
 */
import { BaseEventHandler, EventProcessingResult } from '../../../shared/events/BaseEventHandler';
import { IntegrationEvent } from '../../../shared/events/EventBusConfiguration';
import { GenerateInvoiceUseCase } from '../../application/use-cases/GenerateInvoiceUseCase';
import { ProcessPaymentUseCase } from '../../application/use-cases/ProcessPaymentUseCase';
import { ValidateInsuranceUseCase } from '../../application/use-cases/ValidateInsuranceUseCase';
export declare class BillingEventHandler extends BaseEventHandler {
    private generateInvoiceUseCase;
    private processPaymentUseCase;
    private validateInsuranceUseCase;
    constructor(generateInvoiceUseCase: GenerateInvoiceUseCase, processPaymentUseCase: ProcessPaymentUseCase, validateInsuranceUseCase: ValidateInsuranceUseCase, logger?: any);
    /**
     * Process integration events
     */
    protected processEvent(event: IntegrationEvent): Promise<EventProcessingResult>;
    /**
     * Handle appointment completed event
     */
    private handleAppointmentCompleted;
    /**
     * Handle medical record created event
     */
    private handleMedicalRecordCreated;
    /**
     * Handle patient registered event
     */
    private handlePatientRegistered;
    /**
     * Handle test results ready event
     */
    private handleTestResultsReady;
    /**
     * Handle medication prescribed event
     */
    private handleMedicationPrescribed;
    /**
     * Handle imaging study completed event
     */
    private handleImagingStudyCompleted;
    /**
     * Handle insurance verification completed event
     */
    private handleInsuranceVerificationCompleted;
    /**
     * Handle external payment completed event
     */
    private handleExternalPaymentCompleted;
    /**
     * Get test price based on test type
     */
    private getTestPrice;
    /**
     * Get imaging price based on study type
     */
    private getImagingPrice;
    /**
     * Get handler status with billing-specific metrics
     */
    getBillingStatus(): any;
}
//# sourceMappingURL=BillingEventHandler.d.ts.map