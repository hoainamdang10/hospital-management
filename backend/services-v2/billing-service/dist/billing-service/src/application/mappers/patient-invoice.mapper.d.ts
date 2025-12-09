import { Invoice } from "../../domain/aggregates/Invoice";
export interface PatientInvoiceResponse {
    invoiceId: string;
    invoiceNumber?: string;
    invoiceCode?: string;
    patientName?: string;
    appointmentId?: string;
    appointmentCode?: string;
    doctorName?: string;
    doctorDepartment?: string;
    cancellationReason?: string;
    metadata?: Record<string, any>;
    items: Array<{
        id: string;
        description: string;
        quantity: number;
        unitPrice: number;
        totalPrice: number;
    }>;
    subtotal: number;
    tax: number;
    insuranceCoverage: number;
    totalAmount: number;
    patientPaymentAmount: number;
    outstandingAmount: number;
    paidAmount: number;
    status: string;
    createdAt: Date;
    issuedAt: Date;
    issueDate: Date;
    dueDate: Date;
    payments: Array<{
        id: string;
        amount: number;
        currency: string;
        method: string;
        status: string;
        transactionId?: string;
        paidAt?: Date;
        refundedAt?: Date;
        refundReason?: string;
        refundedBy?: string;
        gatewayRefundId?: string;
    }>;
}
export declare function mapInvoiceForPatientResponse(invoice: Invoice): PatientInvoiceResponse;
//# sourceMappingURL=patient-invoice.mapper.d.ts.map