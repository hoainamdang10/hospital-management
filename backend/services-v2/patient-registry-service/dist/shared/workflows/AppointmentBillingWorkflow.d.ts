/**
 * AppointmentBillingWorkflow - Appointment to Billing Integration Workflows
 * Seamless integration between appointment scheduling and billing processes
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Vietnamese Healthcare Standards, BHYT/BHTN Integration, PayOS Integration
 */
export interface BillingContext {
    appointmentId: string;
    patientId: string;
    doctorId: string;
    serviceType: "CONSULTATION" | "TREATMENT" | "PROCEDURE" | "EMERGENCY" | "FOLLOW_UP";
    services: Array<{
        serviceCode: string;
        serviceName: string;
        vietnameseServiceName: string;
        basePrice: number;
        quantity: number;
        discount?: number;
    }>;
    insuranceInfo?: {
        bhytCardNumber?: string;
        bhtnCardNumber?: string;
        coveragePercentage?: number;
        copayAmount?: number;
    };
    paymentMethod: "CASH" | "CARD" | "BANK_TRANSFER" | "PAYOS" | "INSURANCE";
    vietnameseBillingInfo: {
        patientName: string;
        address: string;
        taxCode?: string;
        companyName?: string;
    };
}
export interface PaymentContext {
    invoiceId: string;
    totalAmount: number;
    insuranceCoverage: number;
    patientPayment: number;
    paymentMethod: string;
    payosTransactionId?: string;
    bhytClaimId?: string;
    bhtnClaimId?: string;
}
export interface InvoiceContext {
    invoiceNumber: string;
    invoiceDate: Date;
    dueDate: Date;
    items: Array<{
        description: string;
        vietnameseDescription: string;
        quantity: number;
        unitPrice: number;
        totalPrice: number;
    }>;
    subtotal: number;
    taxAmount: number;
    discountAmount: number;
    totalAmount: number;
    vietnameseInvoiceInfo: {
        issuedBy: string;
        issuedDate: string;
        paymentTerms: string;
    };
}
export declare class AppointmentBillingWorkflow {
    private static instance;
    private orchestrator;
    private constructor();
    static getInstance(): AppointmentBillingWorkflow;
    /**
     * Register all appointment-billing workflows
     */
    private registerAppointmentBillingWorkflows;
    /**
     * Appointment Invoice Generation Workflow
     */
    private registerAppointmentInvoiceGenerationWorkflow;
    /**
     * Insurance Claim Processing Workflow
     */
    private registerInsuranceClaimProcessingWorkflow;
    /**
     * Payment Processing Workflow
     */
    private registerPaymentProcessingWorkflow;
    /**
     * Billing Reconciliation Workflow
     */
    private registerBillingReconciliationWorkflow;
    /**
     * Refund Processing Workflow
     */
    private registerRefundProcessingWorkflow;
    /**
     * BHYT Integration Workflow
     */
    private registerBHYTIntegrationWorkflow;
    /**
     * PayOS Integration Workflow
     */
    private registerPayOSIntegrationWorkflow;
    /**
     * Execute appointment invoice generation
     */
    executeAppointmentInvoiceGeneration(billingContext: BillingContext): Promise<any>;
    /**
     * Execute insurance claim processing
     */
    executeInsuranceClaimProcessing(billingContext: BillingContext): Promise<any>;
    /**
     * Execute payment processing
     */
    executePaymentProcessing(billingContext: BillingContext, paymentContext: PaymentContext): Promise<any>;
    /**
     * Execute complete appointment-billing workflow
     */
    executeCompleteAppointmentBilling(billingContext: BillingContext): Promise<any>;
    /**
     * Get appointment-billing workflow status
     */
    getAppointmentBillingStatus(): any;
}
//# sourceMappingURL=AppointmentBillingWorkflow.d.ts.map