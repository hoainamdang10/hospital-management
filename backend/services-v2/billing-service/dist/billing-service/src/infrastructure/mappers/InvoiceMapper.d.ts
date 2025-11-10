import { Invoice } from '../../domain/aggregates/Invoice';
export interface InvoiceRecord {
    id: string;
    patient_id: string;
    invoice_number?: string;
    items: any[];
    subtotal: number;
    tax: number;
    insurance_coverage: number;
    total_amount: number;
    outstanding_amount: number;
    currency: string;
    status: string;
    insurance?: any;
    payments: any[];
    created_at: string;
    updated_at: string;
    finalized_at?: string;
    cancelled_at?: string;
    cancellation_reason?: string;
}
export declare class InvoiceMapper {
    static toDomain(record: InvoiceRecord): Invoice;
    static toPersistence(invoice: Invoice): InvoiceRecord;
}
//# sourceMappingURL=InvoiceMapper.d.ts.map