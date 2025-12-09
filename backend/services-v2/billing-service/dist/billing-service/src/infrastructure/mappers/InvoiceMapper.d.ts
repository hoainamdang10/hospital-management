import { Invoice } from "../../domain/aggregates/Invoice";
export interface InvoiceRecord {
    id: string;
    invoice_id: string;
    vietnamese_invoice_number?: string;
    patient_id: string;
    medical_record_id?: string;
    doctor_id: string;
    appointment_id?: string;
    status: string;
    subtotal_amount: number;
    subtotal_currency: string;
    tax_amount: number;
    tax_currency: string;
    total_amount: number;
    total_currency: string;
    insurance_coverage_amount: number;
    insurance_coverage_currency: string;
    patient_payment_amount: number;
    patient_payment_currency: string;
    outstanding_amount?: number;
    outstanding_currency?: string;
    insurance_type?: string;
    insurance_number?: string;
    insurance_valid_until?: string;
    insurance_coverage_level?: number;
    insurance_issued_by?: string;
    insurance_data?: any;
    issued_at: string;
    due_date: string;
    finalized_at?: string;
    paid_at?: string;
    issued_by: string;
    notes?: string;
    metadata?: any;
    created_at: string;
    updated_at: string;
    version: number;
    contains_phi: boolean;
}
export interface BillingItemRecord {
    id: string;
    invoice_id: string;
    item_id: string;
    description: string;
    vietnamese_description?: string;
    quantity: number;
    unit_price_amount: number;
    unit_price_currency: string;
    total_price_amount: number;
    total_price_currency: string;
    category?: string;
    service_code?: string;
    taxable: boolean;
    insurance_coverable: boolean;
    medical_record_id?: string;
    metadata?: any;
    created_at: string;
}
export interface PaymentRecordData {
    id: string;
    invoice_id: string;
    payment_id: string;
    amount: number;
    currency: string;
    method: string;
    status?: string;
    transaction_id?: string;
    processed_at: string;
    processed_by?: string;
    payos_data?: any;
    payos_order_code?: number;
    payos_transaction_id?: string;
    vnpay_txn_ref?: string;
    vnpay_transaction_no?: string;
    vnpay_pay_date?: string;
    refunded_at?: string;
    refund_reason?: string;
    refunded_by?: string;
    gateway_refund_id?: string;
    notes?: string;
    metadata?: any;
    created_at: string;
}
export declare class InvoiceMapper {
    /**
     * Map from database records (normalized schema) to domain Invoice aggregate
     */
    static toDomain(record: InvoiceRecord, itemRecords?: BillingItemRecord[], paymentRecords?: PaymentRecordData[]): Invoice;
    /**
     * Map from domain Invoice aggregate to database records (normalized schema)
     * Returns main invoice record + separate arrays for items and payments
     */
    static toPersistence(invoice: Invoice): {
        invoice: Partial<InvoiceRecord>;
        items: Partial<BillingItemRecord>[];
        payments: Partial<PaymentRecordData>[];
    };
    private static normalizeMetadata;
    private static detectInvoiceType;
    private static getDefaultServiceName;
    /**
     * Map insurance provider name to valid insurance_type enum
     * Valid enum values: BHYT, BHTN, Private, Self-pay
     */
    private static mapProviderToInsuranceType;
}
//# sourceMappingURL=InvoiceMapper.d.ts.map