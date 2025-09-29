import { Request } from 'express';
export interface AuthenticatedRequest extends Request {
    user?: {
        id: string;
        email: string;
        role: string;
        profile_id?: string;
    };
    body: any;
    query: any;
    params: any;
    headers: any;
    path: string;
    method: string;
}
export interface PaymentCreateRequest {
    appointmentId: string;
    amount: number;
    description: string;
    serviceName: string;
    patientInfo: {
        name: string;
        email: string;
        phone: string;
    };
}
export interface PaymentRefundRequest {
    appointmentId: string;
    amount: number;
    description: string;
}
export interface PaymentCancelRequest {
    reason: string;
}
export interface PayOSPaymentData {
    orderCode: number;
    amount: number;
    description: string;
    items: Array<{
        name: string;
        quantity: number;
        price: number;
    }>;
    returnUrl: string;
    cancelUrl: string;
    buyerName?: string;
    buyerEmail?: string;
    buyerPhone?: string;
}
export interface PayOSWebhookData {
    code: string;
    desc: string;
    data: {
        orderCode: number;
        amount: number;
        description: string;
        accountNumber: string;
        reference: string;
        transactionDateTime: string;
        currency: string;
        paymentLinkId: string;
        code: string;
        desc: string;
        counterAccountBankId?: string;
        counterAccountBankName?: string;
        counterAccountName?: string;
        counterAccountNumber?: string;
        virtualAccountName?: string;
        virtualAccountNumber?: string;
    };
    signature: string;
}
export interface PaymentRecord {
    id: string;
    appointment_id: string;
    patient_id: string;
    amount: number;
    currency: string;
    status: 'pending' | 'success' | 'failed' | 'cancelled';
    payment_method: 'payos' | 'cash' | 'bank_transfer';
    transaction_id?: string;
    payment_link_id?: string;
    checkout_url?: string;
    description?: string;
    metadata?: any;
    created_at: string;
    updated_at: string;
}
export interface PaymentStats {
    totalPayments: number;
    totalAmount: number;
    successfulPayments: number;
    failedPayments: number;
    pendingPayments: number;
    cancelledPayments: number;
}
export interface CustomError extends Error {
    statusCode?: number;
    code?: string;
}
//# sourceMappingURL=index.d.ts.map