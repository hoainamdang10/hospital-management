import {
  IInvoiceRepository,
  SearchCriteria,
  RevenueSummary,
} from "../../domain/repositories/IInvoiceRepository";
import { Invoice } from "../../domain/aggregates/Invoice";
import { InvoiceMapper } from "../mappers/InvoiceMapper";
import type { OptimizedSupabaseClient } from "@shared/infrastructure/database/optimized-supabase-client";

export class SupabaseInvoiceRepository implements IInvoiceRepository {
  private readonly invoicesTable = "invoices";
  private readonly itemsTable = "billing_items";
  private readonly paymentsTable = "payment_records";

  constructor(private readonly supabase: OptimizedSupabaseClient) {}

  async save(invoice: Invoice): Promise<void> {
    const {
      invoice: invoiceRecord,
      items,
      payments,
    } = InvoiceMapper.toPersistence(invoice);

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

    // 3. Insert new payments (append only, don't delete)
    // Only insert payments that don't already exist in database
    if (payments.length > 0) {
      // Fetch existing payment_ids (Payment entity IDs) for this invoice
      const { data: existingPayments } = await this.supabase
        .from(this.paymentsTable)
        .select("payment_id")
        .eq("invoice_id", invoiceRecord.id);

      const existingPaymentIds = new Set(
        (existingPayments || []).map((p) => p.payment_id)
      );

      // Filter out payments that already exist (by payment_id, not database id)
      const newPayments = payments.filter((p) => !existingPaymentIds.has(p.payment_id));

      if (newPayments.length > 0) {
        const { error: paymentsError } = await this.supabase
          .from(this.paymentsTable)
          .insert(newPayments);

        if (paymentsError) {
          throw new Error(`Failed to save payments: ${paymentsError.message}`);
        }
      }
    }
  }

  async findById(id: string): Promise<Invoice | null> {
    // Fetch invoice
    const { data: invoiceData, error: invoiceError } = await this.supabase
      .from(this.invoicesTable)
      .select("*")
      .eq("id", id)
      .single();

    if (invoiceError) {
      if (invoiceError.code === "PGRST116") return null;
      throw new Error(`Failed to find invoice: ${invoiceError.message}`);
    }

    if (!invoiceData) return null;

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

    return InvoiceMapper.toDomain(
      invoiceData,
      itemsData || [],
      paymentsData || [],
    );
  }

  async findByPatientId(patientId: string): Promise<Invoice[]> {
    const resolvedPatientId = await this.resolvePatientIdentifier(patientId);
    const targetPatientId = resolvedPatientId ?? patientId;

    // Fetch invoices
    const { data: invoicesData, error: invoicesError } = await this.supabase
      .from(this.invoicesTable)
      .select("*")
      .eq("patient_id", targetPatientId)
      .order("created_at", { ascending: false });

    if (invoicesError) {
      throw new Error(
        `Failed to find invoices by patient: ${invoicesError.message}`,
      );
    }

    if (!invoicesData || invoicesData.length === 0) return [];

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
      const items = (itemsData || []).filter(
        (item) => item.invoice_id === invoice.id,
      );
      const payments = (paymentsData || []).filter(
        (payment) => payment.invoice_id === invoice.id,
      );
      return InvoiceMapper.toDomain(invoice, items, payments);
    });
  }

  async findByInvoiceNumber(invoiceNumber: string): Promise<Invoice | null> {
    // Try both invoice_id and vietnamese_invoice_number
    const { data: invoiceData, error: invoiceError } = await this.supabase
      .from(this.invoicesTable)
      .select("*")
      .or(
        `invoice_id.eq.${invoiceNumber},vietnamese_invoice_number.eq.${invoiceNumber}`,
      )
      .single();

    if (invoiceError) {
      if (invoiceError.code === "PGRST116") return null;
      throw new Error(
        `Failed to find invoice by number: ${invoiceError.message}`,
      );
    }

    if (!invoiceData) return null;

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

    return InvoiceMapper.toDomain(
      invoiceData,
      itemsData || [],
      paymentsData || [],
    );
  }

  async findOverdueInvoices(daysOverdue?: number): Promise<Invoice[]> {
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

    if (!invoicesData || invoicesData.length === 0) return [];

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
      const items = (itemsData || []).filter(
        (item) => item.invoice_id === invoice.id,
      );
      const payments = (paymentsData || []).filter(
        (payment) => payment.invoice_id === invoice.id,
      );
      return InvoiceMapper.toDomain(invoice, items, payments);
    });
  }

  async search(criteria: SearchCriteria): Promise<Invoice[]> {
    let query = this.supabase.from(this.invoicesTable).select("*");

    // Filter by status
    if (criteria.status) {
      query = query.eq("status", criteria.status);
    }

    // Filter by patient ID
    if (criteria.patientId) {
      const resolvedPatientId = await this.resolvePatientIdentifier(
        criteria.patientId,
      );
      const targetPatientId = resolvedPatientId ?? criteria.patientId;
      query = query.eq("patient_id", targetPatientId);
    }

    // Filter by invoice number (exact match)
    if (criteria.invoiceNumber) {
      query = query.or(
        `invoice_id.eq.${criteria.invoiceNumber},vietnamese_invoice_number.eq.${criteria.invoiceNumber}`,
      );
    }

    // Filter by date range
    if (criteria.fromDate) {
      const fromDateStr =
        criteria.fromDate instanceof Date
          ? criteria.fromDate.toISOString()
          : criteria.fromDate;
      query = query.gte("created_at", fromDateStr);
    }

    if (criteria.toDate) {
      const toDateStr =
        criteria.toDate instanceof Date
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

    if (!invoicesData || invoicesData.length === 0) return [];

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
      const items = (itemsData || []).filter(
        (item) => item.invoice_id === invoice.id,
      );
      const payments = (paymentsData || []).filter(
        (payment) => payment.invoice_id === invoice.id,
      );
      return InvoiceMapper.toDomain(invoice, items, payments);
    });
  }

  async getRevenueSummary(
    fromDate: Date,
    toDate: Date,
  ): Promise<RevenueSummary> {
    // Get all invoices in date range
    const invoices = await this.search({
      fromDate,
      toDate,
    });

    // Calculate summary statistics
    const paidInvoices = invoices.filter((inv) => inv.status.value === "paid");
    const pendingInvoices = invoices.filter(
      (inv) =>
        inv.status.value === "pending" || inv.status.value === "partially_paid",
    );

    const totalRevenue = paidInvoices.reduce(
      (sum, inv) => sum + inv.totalAmount.amount,
      0,
    );
    const averageInvoiceAmount =
      paidInvoices.length > 0 ? totalRevenue / paidInvoices.length : 0;

    // Aggregate by payment method
    const byPaymentMethod: { [method: string]: number } = {};
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
    const byInsuranceType: { [type: string]: number } = {};

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

  async delete(id: string): Promise<void> {
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

  private async resolvePatientIdentifier(
    identifier: string,
  ): Promise<string | null> {
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

  private async fetchPatientIdByColumn(
    column: "id" | "patient_id" | "user_id",
    value: string,
  ): Promise<string | null> {
    try {
      const { data, error } = await this.supabase
        .getRawClient()
        .schema("patient_schema")
        .from("patients")
        .select("id")
        .eq(column, value)
        .single();

      if (error) {
        if ((error as any)?.code === "PGRST116") {
          return null;
        }
        return null;
      }

      return (data as { id: string } | null)?.id ?? null;
    } catch {
      return null;
    }
  }

  private isUUID(value: string): boolean {
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(value);
  }

  private isPatientCode(value: string): boolean {
    return /^PAT-\d{6}-\d{3}$/i.test(value);
  }
}
