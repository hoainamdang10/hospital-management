import { IInvoiceRepository, SearchCriteria, RevenueSummary } from '../../domain/repositories/IInvoiceRepository';
import { Invoice } from '../../domain/aggregates/Invoice';
import { InvoiceMapper } from '../mappers/InvoiceMapper';
import { createClient } from '@supabase/supabase-js';

export class SupabaseInvoiceRepository implements IInvoiceRepository {
  private readonly supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      db: { schema: 'billing_schema' },
      auth: { autoRefreshToken: false, persistSession: false }
    }
  );
  private readonly tableName = 'invoices';

  async save(invoice: Invoice): Promise<void> {
    const record = InvoiceMapper.toPersistence(invoice);
    
    const { error } = await this.supabase
      .from(this.tableName)
      .upsert(record);

    if (error) {
      throw new Error(`Failed to save invoice: ${error.message}`);
    }
  }

  async findById(id: string): Promise<Invoice | null> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new Error(`Failed to find invoice: ${error.message}`);
    }

    return data ? InvoiceMapper.toDomain(data) : null;
  }

  async findByPatientId(patientId: string): Promise<Invoice[]> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('*')
      .eq('patient_id', patientId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to find invoices by patient: ${error.message}`);
    }

    return data ? data.map(InvoiceMapper.toDomain) : [];
  }

  async findByInvoiceNumber(invoiceNumber: string): Promise<Invoice | null> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('*')
      .eq('invoice_number', invoiceNumber)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new Error(`Failed to find invoice by number: ${error.message}`);
    }

    return data ? InvoiceMapper.toDomain(data) : null;
  }

  async findOverdueInvoices(daysOverdue?: number): Promise<Invoice[]> {
    // Find invoices that are finalized but not fully paid
    // and have outstanding amount > 0
    let query = this.supabase
      .from(this.tableName)
      .select('*')
      .in('status', ['pending', 'partially_paid'])
      .gt('outstanding_amount', 0)
      .not('finalized_at', 'is', null);

    // If daysOverdue specified, filter by creation date
    if (daysOverdue) {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOverdue);
      query = query.lte('created_at', cutoffDate.toISOString());
    }

    query = query.order('created_at', { ascending: true });

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to find overdue invoices: ${error.message}`);
    }

    return data ? data.map(InvoiceMapper.toDomain) : [];
  }

  async search(criteria: SearchCriteria): Promise<Invoice[]> {
    let query = this.supabase
      .from(this.tableName)
      .select('*');

    // Filter by status
    if (criteria.status) {
      query = query.eq('status', criteria.status);
    }

    // Filter by patient ID
    if (criteria.patientId) {
      query = query.eq('patient_id', criteria.patientId);
    }

    // Filter by invoice number (exact match)
    if (criteria.invoiceNumber) {
      query = query.eq('invoice_number', criteria.invoiceNumber);
    }

    // Filter by date range
    if (criteria.fromDate) {
      const fromDateStr = criteria.fromDate instanceof Date 
        ? criteria.fromDate.toISOString() 
        : criteria.fromDate;
      query = query.gte('created_at', fromDateStr);
    }

    if (criteria.toDate) {
      const toDateStr = criteria.toDate instanceof Date 
        ? criteria.toDate.toISOString() 
        : criteria.toDate;
      query = query.lte('created_at', toDateStr);
    }

    // Filter by amount range
    if (criteria.minAmount !== undefined) {
      query = query.gte('total_amount', criteria.minAmount);
    }

    if (criteria.maxAmount !== undefined) {
      query = query.lte('total_amount', criteria.maxAmount);
    }

    // Order by creation date (newest first)
    query = query.order('created_at', { ascending: false });

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to search invoices: ${error.message}`);
    }

    return data ? data.map(InvoiceMapper.toDomain) : [];
  }

  async getRevenueSummary(fromDate: Date, toDate: Date): Promise<RevenueSummary> {
    // Get all invoices in date range
    const invoices = await this.search({
      fromDate,
      toDate
    });

    // Calculate summary statistics
    const paidInvoices = invoices.filter(inv => inv.status.value === 'paid');
    const pendingInvoices = invoices.filter(inv => 
      inv.status.value === 'pending' || inv.status.value === 'partially_paid'
    );

    const totalRevenue = paidInvoices.reduce((sum, inv) => sum + inv.totalAmount.amount, 0);
    const averageInvoiceAmount = paidInvoices.length > 0 
      ? totalRevenue / paidInvoices.length 
      : 0;

    // Aggregate by payment method
    const byPaymentMethod: { [method: string]: number } = {};
    paidInvoices.forEach(invoice => {
      invoice.payments.forEach(payment => {
        if (payment.status === 'completed') {
          const method = payment.method;
          byPaymentMethod[method] = (byPaymentMethod[method] || 0) + payment.amount.amount;
        }
      });
    });

    // Aggregate by insurance type
    const byInsuranceType: { [type: string]: number } = {};
    paidInvoices.forEach(invoice => {
      if (invoice.insurance) {
        const type = invoice.insurance.provider;
        byInsuranceType[type] = (byInsuranceType[type] || 0) + invoice.insuranceCoverage.amount;
      }
    });

    return {
      totalRevenue,
      totalInvoices: invoices.length,
      paidInvoices: paidInvoices.length,
      pendingInvoices: pendingInvoices.length,
      averageInvoiceAmount,
      byPaymentMethod,
      byInsuranceType
    };
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.supabase
      .from(this.tableName)
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to delete invoice: ${error.message}`);
    }
  }
}
