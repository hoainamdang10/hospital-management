"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SupabaseInvoiceRepository = void 0;
const InvoiceMapper_1 = require("../mappers/InvoiceMapper");
class SupabaseInvoiceRepository {
    constructor(supabase) {
        this.supabase = supabase;
        this.invoicesTable = 'invoices';
        this.itemsTable = 'billing_items';
        this.paymentsTable = 'payment_records';
    }
    async save(invoice) {
        const { invoice: invoiceRecord, items, payments } = InvoiceMapper_1.InvoiceMapper.toPersistence(invoice);
        // Start transaction-like operation
        // 1. Upsert main invoice
        const { error: invoiceError } = await this.supabase
            .from(this.invoicesTable)
            .upsert(invoiceRecord);
        if (invoiceError) {
            throw new Error(`Failed to save invoice: ${invoiceError.message}`);
        }
        // 2. Delete existing items and insert new ones
        if (items.length > 0) {
            await this.supabase
                .from(this.itemsTable)
                .delete()
                .eq('invoice_id', invoiceRecord.id);
            const { error: itemsError } = await this.supabase
                .from(this.itemsTable)
                .insert(items);
            if (itemsError) {
                throw new Error(`Failed to save invoice items: ${itemsError.message}`);
            }
        }
        // 3. Insert new payments (append only, don't delete)
        if (payments.length > 0) {
            const { error: paymentsError } = await this.supabase
                .from(this.paymentsTable)
                .insert(payments);
            if (paymentsError) {
                throw new Error(`Failed to save payments: ${paymentsError.message}`);
            }
        }
    }
    async findById(id) {
        // Fetch invoice
        const { data: invoiceData, error: invoiceError } = await this.supabase
            .from(this.invoicesTable)
            .select('*')
            .eq('id', id)
            .single();
        if (invoiceError) {
            if (invoiceError.code === 'PGRST116')
                return null;
            throw new Error(`Failed to find invoice: ${invoiceError.message}`);
        }
        if (!invoiceData)
            return null;
        // Fetch related items
        const { data: itemsData, error: itemsError } = await this.supabase
            .from(this.itemsTable)
            .select('*')
            .eq('invoice_id', id);
        if (itemsError) {
            throw new Error(`Failed to fetch invoice items: ${itemsError.message}`);
        }
        // Fetch related payments
        const { data: paymentsData, error: paymentsError } = await this.supabase
            .from(this.paymentsTable)
            .select('*')
            .eq('invoice_id', id);
        if (paymentsError) {
            throw new Error(`Failed to fetch payments: ${paymentsError.message}`);
        }
        return InvoiceMapper_1.InvoiceMapper.toDomain(invoiceData, itemsData || [], paymentsData || []);
    }
    async findByPatientId(patientId) {
        // Fetch invoices
        const { data: invoicesData, error: invoicesError } = await this.supabase
            .from(this.invoicesTable)
            .select('*')
            .eq('patient_id', patientId)
            .order('created_at', { ascending: false });
        if (invoicesError) {
            throw new Error(`Failed to find invoices by patient: ${invoicesError.message}`);
        }
        if (!invoicesData || invoicesData.length === 0)
            return [];
        // Fetch all items for these invoices
        const invoiceIds = invoicesData.map(inv => inv.id);
        const { data: itemsData } = await this.supabase
            .from(this.itemsTable)
            .select('*')
            .in('invoice_id', invoiceIds);
        // Fetch all payments for these invoices
        const { data: paymentsData } = await this.supabase
            .from(this.paymentsTable)
            .select('*')
            .in('invoice_id', invoiceIds);
        // Map each invoice with its items and payments
        return invoicesData.map(invoice => {
            const items = (itemsData || []).filter(item => item.invoice_id === invoice.id);
            const payments = (paymentsData || []).filter(payment => payment.invoice_id === invoice.id);
            return InvoiceMapper_1.InvoiceMapper.toDomain(invoice, items, payments);
        });
    }
    async findByInvoiceNumber(invoiceNumber) {
        // Try both invoice_id and vietnamese_invoice_number
        const { data: invoiceData, error: invoiceError } = await this.supabase
            .from(this.invoicesTable)
            .select('*')
            .or(`invoice_id.eq.${invoiceNumber},vietnamese_invoice_number.eq.${invoiceNumber}`)
            .single();
        if (invoiceError) {
            if (invoiceError.code === 'PGRST116')
                return null;
            throw new Error(`Failed to find invoice by number: ${invoiceError.message}`);
        }
        if (!invoiceData)
            return null;
        // Fetch related items
        const { data: itemsData } = await this.supabase
            .from(this.itemsTable)
            .select('*')
            .eq('invoice_id', invoiceData.id);
        // Fetch related payments
        const { data: paymentsData } = await this.supabase
            .from(this.paymentsTable)
            .select('*')
            .eq('invoice_id', invoiceData.id);
        return InvoiceMapper_1.InvoiceMapper.toDomain(invoiceData, itemsData || [], paymentsData || []);
    }
    async findOverdueInvoices(daysOverdue) {
        // Find invoices that are finalized but not fully paid
        // and have outstanding amount > 0
        let query = this.supabase
            .from(this.invoicesTable)
            .select('*')
            .in('status', ['pending', 'partially_paid'])
            .gt('patient_payment_amount', 0)
            .not('finalized_at', 'is', null);
        // If daysOverdue specified, filter by creation date
        if (daysOverdue) {
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - daysOverdue);
            query = query.lte('created_at', cutoffDate.toISOString());
        }
        query = query.order('created_at', { ascending: true });
        const { data: invoicesData, error } = await query;
        if (error) {
            throw new Error(`Failed to find overdue invoices: ${error.message}`);
        }
        if (!invoicesData || invoicesData.length === 0)
            return [];
        // Fetch items and payments for all invoices
        const invoiceIds = invoicesData.map(inv => inv.id);
        const { data: itemsData } = await this.supabase
            .from(this.itemsTable)
            .select('*')
            .in('invoice_id', invoiceIds);
        const { data: paymentsData } = await this.supabase
            .from(this.paymentsTable)
            .select('*')
            .in('invoice_id', invoiceIds);
        return invoicesData.map(invoice => {
            const items = (itemsData || []).filter(item => item.invoice_id === invoice.id);
            const payments = (paymentsData || []).filter(payment => payment.invoice_id === invoice.id);
            return InvoiceMapper_1.InvoiceMapper.toDomain(invoice, items, payments);
        });
    }
    async search(criteria) {
        let query = this.supabase
            .from(this.invoicesTable)
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
            query = query.or(`invoice_id.eq.${criteria.invoiceNumber},vietnamese_invoice_number.eq.${criteria.invoiceNumber}`);
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
        const { data: invoicesData, error } = await query;
        if (error) {
            throw new Error(`Failed to search invoices: ${error.message}`);
        }
        if (!invoicesData || invoicesData.length === 0)
            return [];
        // Fetch items and payments for all invoices
        const invoiceIds = invoicesData.map(inv => inv.id);
        const { data: itemsData } = await this.supabase
            .from(this.itemsTable)
            .select('*')
            .in('invoice_id', invoiceIds);
        const { data: paymentsData } = await this.supabase
            .from(this.paymentsTable)
            .select('*')
            .in('invoice_id', invoiceIds);
        return invoicesData.map(invoice => {
            const items = (itemsData || []).filter(item => item.invoice_id === invoice.id);
            const payments = (paymentsData || []).filter(payment => payment.invoice_id === invoice.id);
            return InvoiceMapper_1.InvoiceMapper.toDomain(invoice, items, payments);
        });
    }
    async getRevenueSummary(fromDate, toDate) {
        // Get all invoices in date range
        const invoices = await this.search({
            fromDate,
            toDate
        });
        // Calculate summary statistics
        const paidInvoices = invoices.filter(inv => inv.status.value === 'paid');
        const pendingInvoices = invoices.filter(inv => inv.status.value === 'pending' || inv.status.value === 'partially_paid');
        const totalRevenue = paidInvoices.reduce((sum, inv) => sum + inv.totalAmount.amount, 0);
        const averageInvoiceAmount = paidInvoices.length > 0
            ? totalRevenue / paidInvoices.length
            : 0;
        // Aggregate by payment method
        const byPaymentMethod = {};
        paidInvoices.forEach(invoice => {
            invoice.payments.forEach(payment => {
                if (payment.status === 'completed') {
                    const method = payment.method;
                    byPaymentMethod[method] = (byPaymentMethod[method] || 0) + payment.amount.amount;
                }
            });
        });
        // REMOVED (Phase 1 Prepaid Model): Insurance breakdown - no insurance coverage in MVP
        const byInsuranceType = {};
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
    async delete(id) {
        // Delete related items first
        await this.supabase
            .from(this.itemsTable)
            .delete()
            .eq('invoice_id', id);
        // Delete related payments
        await this.supabase
            .from(this.paymentsTable)
            .delete()
            .eq('invoice_id', id);
        // Delete main invoice
        const { error } = await this.supabase
            .from(this.invoicesTable)
            .delete()
            .eq('id', id);
        if (error) {
            throw new Error(`Failed to delete invoice: ${error.message}`);
        }
    }
}
exports.SupabaseInvoiceRepository = SupabaseInvoiceRepository;
//# sourceMappingURL=SupabaseInvoiceRepository.js.map