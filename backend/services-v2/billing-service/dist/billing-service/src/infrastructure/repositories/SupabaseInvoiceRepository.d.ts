import { IInvoiceRepository, SearchCriteria, RevenueSummary } from "../../domain/repositories/IInvoiceRepository";
import { Invoice } from "../../domain/aggregates/Invoice";
import type { OptimizedSupabaseClient } from "../../../../shared/infrastructure/database/optimized-supabase-client";
export declare class SupabaseInvoiceRepository implements IInvoiceRepository {
    private readonly supabase;
    private readonly invoicesTable;
    private readonly itemsTable;
    private readonly paymentsTable;
    constructor(supabase: OptimizedSupabaseClient);
    save(invoice: Invoice): Promise<void>;
    findById(id: string): Promise<Invoice | null>;
    findByPatientId(patientId: string): Promise<Invoice[]>;
    findByInvoiceNumber(invoiceNumber: string): Promise<Invoice | null>;
    findByAppointmentId(appointmentId: string): Promise<Invoice | null>;
    findAllByAppointmentId(appointmentId: string): Promise<Invoice[]>;
    findOverdueInvoices(daysOverdue?: number): Promise<Invoice[]>;
    search(criteria: SearchCriteria): Promise<Invoice[]>;
    getRevenueSummary(fromDate: Date, toDate: Date): Promise<RevenueSummary>;
    delete(id: string): Promise<void>;
    private resolvePatientIdentifier;
    private fetchPatientIdByColumn;
    private isUUID;
    private isPatientCode;
}
//# sourceMappingURL=SupabaseInvoiceRepository.d.ts.map