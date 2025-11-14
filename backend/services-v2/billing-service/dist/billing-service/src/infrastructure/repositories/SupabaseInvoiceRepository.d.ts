import { IInvoiceRepository, SearchCriteria, RevenueSummary } from '../../domain/repositories/IInvoiceRepository';
import { Invoice } from '../../domain/aggregates/Invoice';
export declare class SupabaseInvoiceRepository implements IInvoiceRepository {
    private readonly supabase;
    private readonly invoicesTable;
    private readonly itemsTable;
    private readonly paymentsTable;
    save(invoice: Invoice): Promise<void>;
    findById(id: string): Promise<Invoice | null>;
    findByPatientId(patientId: string): Promise<Invoice[]>;
    findByInvoiceNumber(invoiceNumber: string): Promise<Invoice | null>;
    findOverdueInvoices(daysOverdue?: number): Promise<Invoice[]>;
    search(criteria: SearchCriteria): Promise<Invoice[]>;
    getRevenueSummary(fromDate: Date, toDate: Date): Promise<RevenueSummary>;
    delete(id: string): Promise<void>;
}
//# sourceMappingURL=SupabaseInvoiceRepository.d.ts.map