export interface CreatePaymentRequest {
    orderCode: string;
    appointmentId: string;
    amount: number;
    description: string;
    paymentMethod: 'payos' | 'cash';
    status: 'pending' | 'success' | 'failed' | 'cancelled';
    userId: string;
    patientInfo?: {
        doctorName: string;
        department: string;
        appointmentDate: string;
        timeSlot: string;
    };
}
export interface UpdatePaymentRequest {
    status?: 'pending' | 'success' | 'failed' | 'cancelled';
    transactionId?: string;
    paymentLinkId?: string;
    checkoutUrl?: string;
    qrCode?: string;
    paidAt?: string;
    cancelReason?: string;
    failureReason?: string;
}
export interface Payment {
    id: string;
    orderCode: string;
    appointmentId: string;
    amount: number;
    description: string;
    paymentMethod: 'payos' | 'cash';
    status: 'pending' | 'success' | 'failed' | 'cancelled';
    userId: string;
    transactionId?: string;
    paymentLinkId?: string;
    checkoutUrl?: string;
    qrCode?: string;
    createdAt: string;
    updatedAt: string;
    paidAt?: string;
    cancelReason?: string;
    failureReason?: string;
}
export interface PaymentReceipt {
    id: string;
    orderCode: string;
    amount: number;
    status: string;
    paymentMethod: 'payos' | 'cash';
    transactionId?: string;
    createdAt: string;
    appointmentId: string;
    description: string;
    patientName: string;
    patientId: string;
    patientPhone: string;
    patientEmail: string;
    doctorName: string;
    doctorId: string;
    department: string;
    appointmentDate: string;
    timeSlot: string;
    consultationFee: number;
    serviceFee: number;
    vat: number;
    total: number;
    hospitalName: string;
    hospitalAddress: string;
    hospitalPhone: string;
    hospitalTaxCode: string;
}
export declare class PaymentRepository {
    private supabase;
    constructor();
    createPayment(paymentData: CreatePaymentRequest): Promise<Payment>;
    updatePayment(id: string, updateData: UpdatePaymentRequest): Promise<Payment>;
    getPaymentByOrderCode(orderCode: string): Promise<Payment | null>;
    getPaymentsByUserId(userId: string, page?: number, limit?: number, filters?: {
        status?: string;
        paymentMethod?: string;
    }): Promise<Payment[]>;
    getPaymentReceiptById(paymentId: string, userId: string): Promise<PaymentReceipt | null>;
    getPaymentStats(userId: string): Promise<{
        totalPayments: number;
        totalAmount: number;
        successfulPayments: number;
        pendingPayments: number;
    }>;
    private mapSupabasePaymentToPayment;
    private mapSupabaseReceiptToReceipt;
}
//# sourceMappingURL=payment.repository.d.ts.map