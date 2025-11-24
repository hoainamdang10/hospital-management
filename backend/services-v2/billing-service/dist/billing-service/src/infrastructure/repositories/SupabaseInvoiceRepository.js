"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SupabaseInvoiceRepository = void 0;
const InvoiceMapper_1 = require("../mappers/InvoiceMapper");
class SupabaseInvoiceRepository {
    constructor(supabase) {
        this.supabase = supabase;
        this.invoicesTable = "invoices";
        this.itemsTable = "billing_items";
        this.paymentsTable = "payment_records";
    }
    async save(invoice) {
        const { invoice: invoiceRecord, items, payments, } = InvoiceMapper_1.InvoiceMapper.toPersistence(invoice);
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
                .eq("invoice_id", invoiceRecord.id);
            const { error: itemsError } = await this.supabase
                .from(this.itemsTable)
                .insert(items);
            if (itemsError) {
                throw new Error(`Failed to save invoice items: ${itemsError.message}`);
            }
        }
        // 3. Upsert payments (insert new, update existing)
        // This is critical for refund flow - we need to update payment status
        if (payments.length > 0) {
            // Fetch existing payment_ids (Payment entity IDs) for this invoice
            const { data: existingPayments } = await this.supabase
                .from(this.paymentsTable)
                .select("payment_id, id")
                .eq("invoice_id", invoiceRecord.id);
            const existingPaymentMap = new Map((existingPayments || []).map((p) => [p.payment_id, p.id]));
            // Separate new payments and existing payments
            const newPayments = [];
            const updatedPayments = [];
            for (const payment of payments) {
                const existingDbId = existingPaymentMap.get(payment.payment_id);
                if (existingDbId) {
                    // Payment exists - update it (for refund status changes)
                    updatedPayments.push({
                        ...payment,
                        id: existingDbId, // Use existing database ID
                    });
                }
                else {
                    // New payment - insert it
                    newPayments.push(payment);
                }
            }
            // Insert new payments
            if (newPayments.length > 0) {
                const { error: insertError } = await this.supabase
                    .from(this.paymentsTable)
                    .insert(newPayments);
                if (insertError) {
                    throw new Error(`Failed to insert new payments: ${insertError.message}`);
                }
            }
            // Update existing payments (critical for refund flow)
            if (updatedPayments.length > 0) {
                // Supabase doesn't support batch update, so we update one by one
                for (const payment of updatedPayments) {
                    const { error: updateError } = await this.supabase
                        .from(this.paymentsTable)
                        .update({
                        amount: payment.amount,
                        currency: payment.currency,
                        method: payment.method,
                        transaction_id: payment.transaction_id,
                        processed_at: payment.processed_at,
                        processed_by: payment.processed_by,
                        status: payment.status,
                        refunded_at: payment.refunded_at,
                        refund_reason: payment.refund_reason,
                        refunded_by: payment.refunded_by,
                        gateway_refund_id: payment.gateway_refund_id,
                        vnpay_txn_ref: payment.vnpay_txn_ref,
                        vnpay_transaction_no: payment.vnpay_transaction_no,
                        vnpay_pay_date: payment.vnpay_pay_date,
                    })
                        .eq("id", payment.id);
                    if (updateError) {
                        throw new Error(`Failed to update payment ${payment.payment_id}: ${updateError.message}`);
                    }
                }
            }
        }
    }
    async findById(id) {
        // Fetch invoice
        const { data: invoiceData, error: invoiceError } = await this.supabase
            .from(this.invoicesTable)
            .select("*")
            .eq("id", id)
            .single();
        if (invoiceError) {
            if (invoiceError.code === "PGRST116")
                return null;
            throw new Error(`Failed to find invoice: ${invoiceError.message}`);
        }
        if (!invoiceData)
            return null;
        // Fetch related items
        const { data: itemsData, error: itemsError } = await this.supabase
            .from(this.itemsTable)
            .select("*")
            .eq("invoice_id", id);
        if (itemsError) {
            throw new Error(`Failed to fetch invoice items: ${itemsError.message}`);
        }
        // Fetch related payments
        const { data: paymentsData, error: paymentsError } = await this.supabase
            .from(this.paymentsTable)
            .select("*")
            .eq("invoice_id", id);
        if (paymentsError) {
            throw new Error(`Failed to fetch payments: ${paymentsError.message}`);
        }
        return InvoiceMapper_1.InvoiceMapper.toDomain(invoiceData, itemsData || [], paymentsData || []);
    }
    async findByPatientId(patientId) {
        const resolvedPatientId = await this.resolvePatientIdentifier(patientId);
        const targetPatientId = resolvedPatientId ?? patientId;
        // Fetch invoices
        const { data: invoicesData, error: invoicesError } = await this.supabase
            .from(this.invoicesTable)
            .select("*")
            .eq("patient_id", targetPatientId)
            .order("created_at", { ascending: false });
        if (invoicesError) {
            throw new Error(`Failed to find invoices by patient: ${invoicesError.message}`);
        }
        if (!invoicesData || invoicesData.length === 0)
            return [];
        // Fetch all items for these invoices
        const invoiceIds = invoicesData.map((inv) => inv.id);
        const { data: itemsData } = await this.supabase
            .from(this.itemsTable)
            .select("*")
            .in("invoice_id", invoiceIds);
        // Fetch all payments for these invoices
        const { data: paymentsData } = await this.supabase
            .from(this.paymentsTable)
            .select("*")
            .in("invoice_id", invoiceIds);
        // Map each invoice with its items and payments
        return invoicesData.map((invoice) => {
            const items = (itemsData || []).filter((item) => item.invoice_id === invoice.id);
            const payments = (paymentsData || []).filter((payment) => payment.invoice_id === invoice.id);
            return InvoiceMapper_1.InvoiceMapper.toDomain(invoice, items, payments);
        });
    }
    async findByInvoiceNumber(invoiceNumber) {
        // Try both invoice_id and vietnamese_invoice_number
        const { data: invoiceData, error: invoiceError } = await this.supabase
            .from(this.invoicesTable)
            .select("*")
            .or(`invoice_id.eq.${invoiceNumber},vietnamese_invoice_number.eq.${invoiceNumber}`)
            .single();
        if (invoiceError) {
            if (invoiceError.code === "PGRST116")
                return null;
            throw new Error(`Failed to find invoice by number: ${invoiceError.message}`);
        }
        if (!invoiceData)
            return null;
        // Fetch related items
        const { data: itemsData } = await this.supabase
            .from(this.itemsTable)
            .select("*")
            .eq("invoice_id", invoiceData.id);
        // Fetch related payments
        const { data: paymentsData } = await this.supabase
            .from(this.paymentsTable)
            .select("*")
            .eq("invoice_id", invoiceData.id);
        return InvoiceMapper_1.InvoiceMapper.toDomain(invoiceData, itemsData || [], paymentsData || []);
    }
    async findByAppointmentId(appointmentId) {
        // Fetch invoice by appointment_id
        const { data: invoiceData, error: invoiceError } = await this.supabase
            .from(this.invoicesTable)
            .select("*")
            .eq("appointment_id", appointmentId)
            .order("created_at", { ascending: false })
            .limit(1)
            .single();
        if (invoiceError) {
            if (invoiceError.code === "PGRST116")
                return null;
            throw new Error(`Failed to find invoice by appointment ID: ${invoiceError.message}`);
        }
        if (!invoiceData)
            return null;
        // Fetch related items
        const { data: itemsData, error: itemsError } = await this.supabase
            .from(this.itemsTable)
            .select("*")
            .eq("invoice_id", invoiceData.id);
        if (itemsError) {
            throw new Error(`Failed to fetch invoice items: ${itemsError.message}`);
        }
        // Fetch related payments
        const { data: paymentsData, error: paymentsError } = await this.supabase
            .from(this.paymentsTable)
            .select("*")
            .eq("invoice_id", invoiceData.id);
        if (paymentsError) {
            throw new Error(`Failed to fetch payments: ${paymentsError.message}`);
        }
        return InvoiceMapper_1.InvoiceMapper.toDomain(invoiceData, itemsData || [], paymentsData || []);
    }
    async findAllByAppointmentId(appointmentId) {
        // Fetch all invoices for an appointment (in case of multiple invoices)
        const { data: invoicesData, error: invoicesError } = await this.supabase
            .from(this.invoicesTable)
            .select("*")
            .eq("appointment_id", appointmentId)
            .order("created_at", { ascending: false });
        if (invoicesError) {
            throw new Error(`Failed to find invoices by appointment ID: ${invoicesError.message}`);
        }
        if (!invoicesData || invoicesData.length === 0)
            return [];
        // Fetch items and payments for all invoices
        const invoiceIds = invoicesData.map((inv) => inv.id);
        const { data: itemsData } = await this.supabase
            .from(this.itemsTable)
            .select("*")
            .in("invoice_id", invoiceIds);
        const { data: paymentsData } = await this.supabase
            .from(this.paymentsTable)
            .select("*")
            .in("invoice_id", invoiceIds);
        // Map each invoice with its items and payments
        return invoicesData.map((invoiceData) => {
            const invoiceItems = itemsData?.filter((item) => item.invoice_id === invoiceData.id) || [];
            const invoicePayments = paymentsData?.filter((payment) => payment.invoice_id === invoiceData.id) || [];
            return InvoiceMapper_1.InvoiceMapper.toDomain(invoiceData, invoiceItems, invoicePayments);
        });
    }
    async findOverdueInvoices(daysOverdue) {
        // Find invoices that are finalized but not fully paid
        // and have outstanding amount > 0
        let query = this.supabase
            .from(this.invoicesTable)
            .select("*")
            .in("status", ["pending", "partially_paid"])
            .gt("patient_payment_amount", 0)
            .not("finalized_at", "is", null);
        // If daysOverdue specified, filter by creation date
        if (daysOverdue) {
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - daysOverdue);
            query = query.lte("created_at", cutoffDate.toISOString());
        }
        query = query.order("created_at", { ascending: true });
        const { data: invoicesData, error } = await query;
        if (error) {
            throw new Error(`Failed to find overdue invoices: ${error.message}`);
        }
        if (!invoicesData || invoicesData.length === 0)
            return [];
        // Fetch items and payments for all invoices
        const invoiceIds = invoicesData.map((inv) => inv.id);
        const { data: itemsData } = await this.supabase
            .from(this.itemsTable)
            .select("*")
            .in("invoice_id", invoiceIds);
        const { data: paymentsData } = await this.supabase
            .from(this.paymentsTable)
            .select("*")
            .in("invoice_id", invoiceIds);
        return invoicesData.map((invoice) => {
            const items = (itemsData || []).filter((item) => item.invoice_id === invoice.id);
            const payments = (paymentsData || []).filter((payment) => payment.invoice_id === invoice.id);
            return InvoiceMapper_1.InvoiceMapper.toDomain(invoice, items, payments);
        });
    }
    async search(criteria) {
        let query = this.supabase.from(this.invoicesTable).select("*");
        // Filter by status
        if (criteria.status) {
            query = query.eq("status", criteria.status);
        }
        // Filter by patient ID
        if (criteria.patientId) {
            const resolvedPatientId = await this.resolvePatientIdentifier(criteria.patientId);
            const targetPatientId = resolvedPatientId ?? criteria.patientId;
            query = query.eq("patient_id", targetPatientId);
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
            query = query.gte("created_at", fromDateStr);
        }
        if (criteria.toDate) {
            const toDateStr = criteria.toDate instanceof Date
                ? criteria.toDate.toISOString()
                : criteria.toDate;
            query = query.lte("created_at", toDateStr);
        }
        // Filter by amount range
        if (criteria.minAmount !== undefined) {
            query = query.gte("total_amount", criteria.minAmount);
        }
        if (criteria.maxAmount !== undefined) {
            query = query.lte("total_amount", criteria.maxAmount);
        }
        // Order by creation date (newest first)
        query = query.order("created_at", { ascending: false });
        const { data: invoicesData, error } = await query;
        if (error) {
            throw new Error(`Failed to search invoices: ${error.message}`);
        }
        if (!invoicesData || invoicesData.length === 0)
            return [];
        // Fetch items and payments for all invoices
        const invoiceIds = invoicesData.map((inv) => inv.id);
        const { data: itemsData } = await this.supabase
            .from(this.itemsTable)
            .select("*")
            .in("invoice_id", invoiceIds);
        const { data: paymentsData } = await this.supabase
            .from(this.paymentsTable)
            .select("*")
            .in("invoice_id", invoiceIds);
        return invoicesData.map((invoice) => {
            const items = (itemsData || []).filter((item) => item.invoice_id === invoice.id);
            const payments = (paymentsData || []).filter((payment) => payment.invoice_id === invoice.id);
            return InvoiceMapper_1.InvoiceMapper.toDomain(invoice, items, payments);
        });
    }
    async getRevenueSummary(fromDate, toDate) {
        // Get all invoices in date range
        const invoices = await this.search({
            fromDate,
            toDate,
        });
        // Calculate summary statistics
        const paidInvoices = invoices.filter((inv) => inv.status.value === "paid");
        const pendingInvoices = invoices.filter((inv) => inv.status.value === "pending" || inv.status.value === "partially_paid");
        const totalRevenue = paidInvoices.reduce((sum, inv) => sum + inv.totalAmount.amount, 0);
        const averageInvoiceAmount = paidInvoices.length > 0 ? totalRevenue / paidInvoices.length : 0;
        // Aggregate by payment method
        const byPaymentMethod = {};
        paidInvoices.forEach((invoice) => {
            invoice.payments.forEach((payment) => {
                if (payment.status === "completed") {
                    const method = payment.method;
                    byPaymentMethod[method] =
                        (byPaymentMethod[method] || 0) + payment.amount.amount;
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
            byInsuranceType,
        };
    }
    async delete(id) {
        // Delete related items first
        await this.supabase.from(this.itemsTable).delete().eq("invoice_id", id);
        // Delete related payments
        await this.supabase.from(this.paymentsTable).delete().eq("invoice_id", id);
        // Delete main invoice
        const { error } = await this.supabase
            .from(this.invoicesTable)
            .delete()
            .eq("id", id);
        if (error) {
            throw new Error(`Failed to delete invoice: ${error.message}`);
        }
    }
    async resolvePatientIdentifier(identifier) {
        if (!identifier) {
            return null;
        }
        // PAT-xxxx code (domain identifier)
        if (this.isPatientCode(identifier)) {
            return await this.fetchPatientIdByColumn("patient_id", identifier);
        }
        if (this.isUUID(identifier)) {
            // Try actual patient UUID first
            const byPatientId = await this.fetchPatientIdByColumn("id", identifier);
            if (byPatientId) {
                return byPatientId;
            }
            // Fallback: treat as auth user UUID
            return await this.fetchPatientIdByColumn("user_id", identifier);
        }
        // Fallback for legacy identifiers: try patient_id then user_id
        const byCode = await this.fetchPatientIdByColumn("patient_id", identifier);
        if (byCode) {
            return byCode;
        }
        return await this.fetchPatientIdByColumn("user_id", identifier);
    }
    async fetchPatientIdByColumn(column, value) {
        try {
            const { data, error } = await this.supabase
                .getRawClient()
                .schema("patient_schema")
                .from("patients")
                .select("id")
                .eq(column, value)
                .single();
            if (error) {
                if (error?.code === "PGRST116") {
                    return null;
                }
                return null;
            }
            return data?.id ?? null;
        }
        catch {
            return null;
        }
    }
    isUUID(value) {
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        return uuidRegex.test(value);
    }
    isPatientCode(value) {
        return /^PAT-\d{6}-\d{3}$/i.test(value);
    }
}
exports.SupabaseInvoiceRepository = SupabaseInvoiceRepository;
//# sourceMappingURL=SupabaseInvoiceRepository.js.map