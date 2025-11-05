/**
 * SupabaseBillingRepository - Infrastructure Layer
 * V2 Clean Architecture + DDD Implementation
 * Supabase implementation of billing repository with Vietnamese healthcare compliance
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, Repository Pattern, Schema-per-Service, HIPAA
 */

import { OptimizedSupabaseClient } from "../../../../shared/infrastructure/database/optimized-supabase-client";
import {
  BillingAggregate,
  BillingItem,
  InsuranceClaim,
  InvoiceStatus,
  PaymentMethod,
  PaymentRecord,
} from "../../domain/aggregates/BillingAggregate";
import { IBillingRepository } from "../../domain/repositories/IBillingRepository";
import { Insurance, InsuranceType } from "../../domain/value-objects/Insurance";
import { InvoiceId } from "../../domain/value-objects/InvoiceId";
import { Money } from "../../domain/value-objects/Money";
import { ILogger } from "../../../../shared/infrastructure/logging/logger.interface";
import { IAuditService } from "../../../../shared/application/services/audit.service.interface";

interface BillingRecord {
  id: string; // UUID primary key
  invoice_id: string; // Business key (INV-YYYYMM-XXXXXX)
  patient_id: string;
  medical_record_id: string;
  doctor_id: string;
  appointment_id: string;
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
  due_date: string;
  issued_at: string;
  issued_by: string;
  notes?: string;
  vietnamese_invoice_number?: string;
  insurance_data?: any;
  version?: number; // Optimistic locking
  created_at: string;
  updated_at: string;
}

interface BillingItemRecord {
  id: string;
  invoice_id: string; // Changed from billing_id
  item_id: string; // Added for domain model
  description: string;
  vietnamese_description: string;
  quantity: number;
  unit_price_amount: number;
  unit_price_currency: string;
  total_price_amount: number;
  total_price_currency: string;
  category: string;
  taxable: boolean;
  insurance_coverable: boolean;
  medical_record_id?: string;
  service_code?: string;
  created_at: string;
}

interface PaymentRecordDB {
  id: string;
  invoice_id: string;
  payment_id: string;
  amount: number;
  currency: string;
  method: string;
  transaction_id?: string;
  processed_at: string;
  processed_by: string;
  payos_data?: any;
  payos_order_code?: number;
  payos_transaction_id?: string;
  notes?: string;
  metadata?: any;
  created_at: string;
}

interface InsuranceClaimRecord {
  id: string;
  invoice_id: string;
  claim_id: string;
  claim_number?: string;
  insurance_type: string;
  insurance_number: string;
  insurance_data?: any;
  claim_amount: number;
  approved_amount?: number;
  currency: string;
  status: string;
  submitted_at: string;
  processed_at?: string;
  rejection_reason?: string;
  metadata?: any;
  created_at: string;
  updated_at: string;
}

export interface SupabaseBillingRepositoryConfig {
  supabase: OptimizedSupabaseClient;
  logger: ILogger;
  auditService: IAuditService;
  schema: string;
  tableName: string;
}

/**
 * Supabase Billing Repository
 * Implements billing repository with Vietnamese healthcare compliance
 */
export class SupabaseBillingRepository implements IBillingRepository {
  private readonly supabaseClient: OptimizedSupabaseClient;
  private readonly logger: ILogger;
  private readonly auditService: IAuditService;
  private readonly schema: string;
  private readonly tableName: string;

  constructor(config: SupabaseBillingRepositoryConfig) {
    this.supabaseClient = config.supabase;
    this.logger = config.logger;
    this.auditService = config.auditService;
    this.schema = config.schema || 'billing_schema';
    this.tableName = config.tableName || 'invoices';
  }

  /**
   * Save billing aggregate
   */
  async save(billing: BillingAggregate): Promise<void> {
    try {
      this.logger.info('Saving billing aggregate to database', {
        invoiceId: billing.invoiceId.value,
        patientId: billing.patientId,
        totalAmount: billing.totalAmount.amount,
        status: billing.status
      });

      const client = await this.supabaseClient.getConnection();

      // Check if billing already exists
      const existingBilling = await this.findById(billing.invoiceId);
      if (existingBilling) {
        // Update existing billing
        await this.updateBilling(billing);
        return;
      }

      // Map aggregate to database format
      const billingRecord = this.toPersistence(billing);

      // Use upsert to handle both create and update
      const { data, error } = await client
        .schema(this.schema)
        .from(this.tableName)
        .upsert(billingRecord, {
          onConflict: 'invoice_id',
          ignoreDuplicates: false
        })
        .select()
        .single();

      if (error) {
        this.logger.error('Error saving billing to database', {
          invoiceId: billing.invoiceId.value,
          error: error.message,
          details: error.details
        });

        throw new Error(`Lỗi lưu hóa đơn: ${error.message}`);
      }

      // Save billing items
      if (billing.items.length > 0) {
        await this.saveBillingItems(billing.items, billing.invoiceId.value);
      }

      // HIPAA audit logging
      await this.auditService.logBillingAccess(
        'SAVE',
        billing.invoiceId.value,
        'SYSTEM',
        'Billing record saved to database',
        {
          patientId: billing.patientId,
          doctorId: billing.doctorId,
          totalAmount: billing.totalAmount.amount,
          status: billing.status
        }
      );

      // Save payments
      if (billing.payments.length > 0) {
        const paymentRecords = billing.payments.map((payment) =>
          this.mapPaymentToRecord(payment, billing.invoiceId.value)
        );
        const { error: paymentsError } = await client
          .schema(this.schema)
          .from("invoice_payments")
          .upsert(paymentRecords, {
            onConflict: 'payment_id',
            ignoreDuplicates: false
          });

        if (paymentsError) {
          throw new Error(`Failed to save payments: ${paymentsError.message}`);
        }
      }

      // Save insurance claims
      if (billing.insuranceClaims.length > 0) {
        const claimRecords = billing.insuranceClaims.map((claim) =>
          this.mapClaimToRecord(claim, billing.invoiceId.value)
        );
        const { error: claimsError } = await client
          .schema(this.schema)
          .from("insurance_claims")
          .upsert(claimRecords, {
            onConflict: 'id',
            ignoreDuplicates: false
          });

        if (claimsError) {
          throw new Error(
            `Failed to save insurance claims: ${claimsError.message}`
          );
        }
      }

      this.logger.info('Billing aggregate saved successfully', {
        invoiceId: billing.invoiceId.value,
        id: data?.id
      });

    } catch (error) {
      this.logger.error('Error saving billing aggregate', {
        invoiceId: billing.invoiceId.value,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      throw new Error(`Lỗi lưu hóa đơn: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Find billing by invoice ID
   */
  async findById(id: InvoiceId): Promise<BillingAggregate | null> {
    return this.findByStringId(id.value);
  }

  /**
   * Find billing by string ID
   */
  async findByStringId(id: string): Promise<BillingAggregate | null> {
    try {
      const client = await this.supabaseClient.getConnection();

      // Get invoice record by invoice_id (business key)
      const { data: invoiceData, error: invoiceError } = await client
        .schema(this.schema)
        .from(this.tableName)
        .select("*")
        .eq("invoice_id", id)
        .single();

      if (invoiceError || !invoiceData) {
        return null;
      }

      // Get related data using invoice_id
      const [itemsResult, paymentsResult, claimsResult] = await Promise.all([
        client.schema(this.schema).from("invoice_items").select("*").eq("invoice_id", id),
        client.schema(this.schema).from("invoice_payments").select("*").eq("invoice_id", id),
        client.schema(this.schema).from("insurance_claims").select("*").eq("invoice_id", id),
      ]);

      const items = itemsResult.data || [];
      const payments = paymentsResult.data || [];
      const claims = claimsResult.data || [];

      return this.mapFromRecord(invoiceData, items, payments, claims);
    } catch (error) {
      console.error("Error finding billing by ID:", error);
      throw error;
    }
  }

  /**
   * Find billings by patient ID
   */
  async findByPatientId(patientId: string): Promise<BillingAggregate[]> {
    try {
      const client = await this.supabaseClient.getConnection();

      const { data, error } = await client
        .schema(this.schema)
        .from(this.tableName)
        .select("*")
        .eq("patient_id", patientId)
        .order("created_at", { ascending: false });

      if (error) {
        throw new Error(
          `Failed to find billings by patient ID: ${error.message}`
        );
      }

      const billings: BillingAggregate[] = [];
      for (const record of data || []) {
        const billing = await this.findByStringId(record.invoice_id);
        if (billing) {
          billings.push(billing);
        }
      }

      return billings;
    } catch (error) {
      console.error("Error finding billings by patient ID:", error);
      throw error;
    }
  }

  /**
   * Find billing by medical record ID
   */
  async findByMedicalRecordId(
    medicalRecordId: string
  ): Promise<BillingAggregate | null> {
    try {
      const client = await this.supabaseClient.getConnection();

      const { data, error } = await client
        .schema(this.schema)
        .from(this.tableName)
        .select("*")
        .eq("medical_record_id", medicalRecordId)
        .single();

      if (error || !data) {
        return null;
      }

      return this.findByStringId(data.invoice_id);
    } catch (error) {
      console.error("Error finding billing by medical record ID:", error);
      throw error;
    }
  }

  /**
   * Find billing by appointment ID
   */
  async findByAppointmentId(
    appointmentId: string
  ): Promise<BillingAggregate | null> {
    try {
      const client = await this.supabaseClient.getConnection();

      const { data, error } = await client
        .schema(this.schema)
        .from(this.tableName)
        .select("*")
        .eq("appointment_id", appointmentId)
        .single();

      if (error || !data) {
        return null;
      }

      return this.findByStringId(data.invoice_id);
    } catch (error) {
      console.error("Error finding billing by appointment ID:", error);
      throw error;
    }
  }

  /**
   * Find billings by doctor ID
   */
  async findByDoctorId(doctorId: string): Promise<BillingAggregate[]> {
    try {
      const client = await this.supabaseClient.getConnection();

      const { data, error } = await client
        .schema(this.schema)
        .from(this.tableName)
        .select("*")
        .eq("doctor_id", doctorId)
        .order("created_at", { ascending: false });

      if (error) {
        throw new Error(
          `Failed to find billings by doctor ID: ${error.message}`
        );
      }

      const billings: BillingAggregate[] = [];
      for (const record of data || []) {
        const billing = await this.findByStringId(record.invoice_id);
        if (billing) {
          billings.push(billing);
        }
      }

      return billings;
    } catch (error) {
      console.error("Error finding billings by doctor ID:", error);
      throw error;
    }
  }

  /**
   * Find billings by status
   */
  async findByStatus(status: InvoiceStatus): Promise<BillingAggregate[]> {
    try {
      const client = await this.supabaseClient.getConnection();

      const { data, error } = await client
        .schema(this.schema)
        .from(this.tableName)
        .select("*")
        .eq("status", status)
        .order("created_at", { ascending: false });

      if (error) {
        throw new Error(`Failed to find billings by status: ${error.message}`);
      }

      const billings: BillingAggregate[] = [];
      for (const record of data || []) {
        const billing = await this.findByStringId(record.invoice_id);
        if (billing) {
          billings.push(billing);
        }
      }

      return billings;
    } catch (error) {
      console.error("Error finding billings by status:", error);
      throw error;
    }
  }

  /**
   * Find overdue invoices
   */
  async findOverdueInvoices(): Promise<BillingAggregate[]> {
    try {
      const client = await this.supabaseClient.getConnection();
      const now = new Date().toISOString();

      const { data, error } = await client
        .schema(this.schema)
        .from(this.tableName)
        .select("*")
        .lt("due_date", now)
        .in("status", ["pending", "partially_paid"])
        .order("due_date", { ascending: true });

      if (error) {
        throw new Error(`Failed to find overdue invoices: ${error.message}`);
      }

      const billings: BillingAggregate[] = [];
      for (const record of data || []) {
        const billing = await this.findByStringId(record.invoice_id);
        if (billing) {
          billings.push(billing);
        }
      }

      return billings;
    } catch (error) {
      console.error("Error finding overdue invoices:", error);
      throw error;
    }
  }

  /**
   * Find billings by date range
   */
  async findByDateRange(
    startDate: Date,
    endDate: Date
  ): Promise<BillingAggregate[]> {
    try {
      const client = await this.supabaseClient.getConnection();

      const { data, error } = await client
        .schema(this.schema)
        .from(this.tableName)
        .select("*")
        .gte("issued_at", startDate.toISOString())
        .lte("issued_at", endDate.toISOString())
        .order("issued_at", { ascending: false });

      if (error) {
        throw new Error(
          `Failed to find billings by date range: ${error.message}`
        );
      }

      const billings: BillingAggregate[] = [];
      for (const record of data || []) {
        const billing = await this.findByStringId(record.invoice_id);
        if (billing) {
          billings.push(billing);
        }
      }

      return billings;
    } catch (error) {
      console.error("Error finding billings by date range:", error);
      throw error;
    }
  }

  /**
   * Find billings by insurance type
   */
  async findByInsuranceType(
    insuranceType: InsuranceType
  ): Promise<BillingAggregate[]> {
    try {
      const client = await this.supabaseClient.getConnection();

      const { data, error } = await client
        .schema(this.schema)
        .from(this.tableName)
        .select("*")
        .not("insurance_data", "is", null)
        .order("created_at", { ascending: false });

      if (error) {
        throw new Error(
          `Failed to find billings by insurance type: ${error.message}`
        );
      }

      const billings: BillingAggregate[] = [];
      for (const record of data || []) {
        if (record.insurance_data?.type === insuranceType) {
          const billing = await this.findByStringId(record.invoice_id);
          if (billing) {
            billings.push(billing);
          }
        }
      }

      return billings;
    } catch (error) {
      console.error("Error finding billings by insurance type:", error);
      throw error;
    }
  }

  /**
   * Update billing aggregate
   */
  async update(billing: BillingAggregate): Promise<void> {
    try {
      const client = await this.supabaseClient.getConnection();
      const billingRecord = this.toPersistence(billing);

      const { error } = await client
        .schema(this.schema)
        .from(this.tableName)
        .update({
          ...billingRecord,
          updated_at: new Date().toISOString(),
        })
        .eq("invoice_id", billing.invoiceId.value);

      if (error) {
        throw new Error(`Failed to update billing: ${error.message}`);
      }

      // Note: For simplicity, we're only updating the main billing record
      // In a production system, you might want to handle items, payments, and claims updates
    } catch (error) {
      console.error("Error updating billing aggregate:", error);
      throw error;
    }
  }

  /**
   * Delete billing aggregate
   */
  async delete(id: InvoiceId): Promise<void> {
    try {
      const client = await this.supabaseClient.getConnection();

      // With CASCADE DELETE, we only need to delete the main invoice
      // invoice_items and invoice_payments will be automatically deleted
      const { error } = await client
        .schema(this.schema)
        .from(this.tableName)
        .delete()
        .eq("invoice_id", id.value);

      if (error) {
        throw new Error(`Failed to delete billing: ${error.message}`);
      }
    } catch (error) {
      console.error("Error deleting billing aggregate:", error);
      throw error;
    }
  }

  /**
   * Check if billing exists
   */
  async exists(id: InvoiceId): Promise<boolean> {
    try {
      const client = await this.supabaseClient.getConnection();

      const { data, error } = await client
        .schema(this.schema)
        .from(this.tableName)
        .select("invoice_id")
        .eq("invoice_id", id.value)
        .single();

      return !error && !!data;
    } catch (error) {
      console.error("Error checking billing existence:", error);
      return false;
    }
  }

  /**
   * Get total count of billings
   */
  async count(): Promise<number> {
    try {
      const client = await this.supabaseClient.getConnection();

      const { count, error } = await client
        .schema(this.schema)
        .from(this.tableName)
        .select("*", { count: "exact", head: true });

      if (error) {
        throw new Error(`Failed to count billings: ${error.message}`);
      }

      return count || 0;
    } catch (error) {
      console.error("Error counting billings:", error);
      throw error;
    }
  }

  // Additional methods will be implemented in the next part due to file size limit
  // Including: search, findWithPagination, bulkSave, getStatistics, etc.

  /**
   * Map billing aggregate to database record (toPersistence)
   */
  private toPersistence(
    billing: BillingAggregate
  ): Omit<BillingRecord, "created_at" | "updated_at"> {
    return {
      id: billing.id.value,
      invoice_id: billing.invoiceId.value, // Business key
      patient_id: billing.patientId,
      medical_record_id: billing.medicalRecordId,
      doctor_id: billing.doctorId,
      appointment_id: billing.appointmentId,
      status: billing.status,
      subtotal_amount: billing.subtotal.amount,
      subtotal_currency: billing.subtotal.currency,
      tax_amount: billing.taxAmount.amount,
      tax_currency: billing.taxAmount.currency,
      total_amount: billing.totalAmount.amount,
      total_currency: billing.totalAmount.currency,
      insurance_coverage_amount: billing.insuranceCoverage.amount,
      insurance_coverage_currency: billing.insuranceCoverage.currency,
      patient_payment_amount: billing.patientPayment.amount,
      patient_payment_currency: billing.patientPayment.currency,
      due_date: billing.dueDate.toISOString(),
      issued_at: billing.issuedAt.toISOString(),
      issued_by: billing.issuedBy,
      notes: billing.notes,
      vietnamese_invoice_number: billing.vietnameseInvoiceNumber,
      insurance_data: billing.insurance ? billing.insurance.toJSON() : null,
    };
  }

  /**
   * Alias for backward compatibility
   */
  private mapToRecord(
    billing: BillingAggregate
  ): Omit<BillingRecord, "created_at" | "updated_at"> {
    return this.toPersistence(billing);
  }

  /**
   * Map billing item to database record
   */
  private mapItemToRecord(
    item: BillingItem,
    invoiceId: string
  ): Omit<BillingItemRecord, "created_at"> {
    return {
      id: item.id,
      invoice_id: invoiceId, // Changed from billing_id
      item_id: item.id, // Added for domain model
      description: item.description,
      vietnamese_description: item.vietnameseDescription,
      quantity: item.quantity,
      unit_price_amount: item.unitPrice.amount,
      unit_price_currency: item.unitPrice.currency,
      total_price_amount: item.totalPrice.amount,
      total_price_currency: item.totalPrice.currency,
      category: item.category,
      taxable: item.taxable,
      insurance_coverable: item.insuranceCoverable,
      medical_record_id: item.medicalRecordId,
      service_code: item.serviceCode,
    };
  }

  /**
   * Map payment to database record
   */
  private mapPaymentToRecord(
    payment: PaymentRecord,
    invoiceId: string
  ): Omit<PaymentRecordDB, "created_at"> {
    return {
      id: payment.id,
      invoice_id: invoiceId,
      payment_id: payment.id,
      amount: payment.amount.amount,
      currency: payment.amount.currency,
      method: payment.method,
      transaction_id: payment.transactionId,
      processed_at: payment.processedAt.toISOString(),
      processed_by: payment.processedBy,
      payos_data: payment.payosData,
      payos_order_code: payment.payosData?.orderCode,
      payos_transaction_id: payment.payosData?.transactionId,
      notes: payment.notes,
      metadata: undefined,
    };
  }

  /**
   * Map insurance claim to database record
   */
  private mapClaimToRecord(
    claim: InsuranceClaim,
    invoiceId: string
  ): Omit<InsuranceClaimRecord, "created_at" | "updated_at"> {
    return {
      id: claim.id,
      invoice_id: invoiceId,
      claim_id: claim.id,
      claim_number: claim.claimNumber,
      insurance_type: claim.insurance.type,
      insurance_number: claim.insurance.number,
      insurance_data: claim.insurance.toJSON(),
      claim_amount: claim.claimAmount.amount,
      approved_amount: claim.approvedAmount?.amount,
      currency: claim.claimAmount.currency,
      status: claim.status,
      submitted_at: claim.submittedAt.toISOString(),
      processed_at: claim.processedAt?.toISOString(),
      rejection_reason: claim.rejectionReason,
      metadata: undefined,
    };
  }

  /**
   * Save billing items to database
   */
  private async saveBillingItems(
    items: BillingItem[],
    invoiceId: string
  ): Promise<void> {
    try {
      const client = await this.supabaseClient.getConnection();

      const itemRecords = items.map((item) =>
        this.mapItemToRecord(item, invoiceId)
      );

      const { error } = await client
        .schema(this.schema)
        .from("invoice_items")
        .upsert(itemRecords, {
          onConflict: 'item_id',
          ignoreDuplicates: false
        });

      if (error) {
        throw new Error(`Failed to save billing items: ${error.message}`);
      }
    } catch (error) {
      console.error("Error saving billing items:", error);
      throw error;
    }
  }

  /**
   * Update billing aggregate
   */
  private async updateBilling(billing: BillingAggregate): Promise<void> {
    try {
      const client = await this.supabaseClient.getConnection();
      const billingRecord = this.toPersistence(billing);

      const { error } = await client
        .schema(this.schema)
        .from(this.tableName)
        .update({
          ...billingRecord,
          updated_at: new Date().toISOString(),
        })
        .eq("invoice_id", billing.invoiceId.value);

      if (error) {
        throw new Error(`Failed to update billing: ${error.message}`);
      }

      // Update billing items
      if (billing.items.length > 0) {
        await this.saveBillingItems(billing.items, billing.invoiceId.value);
      }

      // Update payments
      if (billing.payments.length > 0) {
        const paymentRecords = billing.payments.map((payment) =>
          this.mapPaymentToRecord(payment, billing.invoiceId.value)
        );
        const { error: paymentsError } = await client
          .schema(this.schema)
          .from("invoice_payments")
          .upsert(paymentRecords, {
            onConflict: 'payment_id',
            ignoreDuplicates: false
          });

        if (paymentsError) {
          throw new Error(`Failed to update payments: ${paymentsError.message}`);
        }
      }

      // Update insurance claims
      if (billing.insuranceClaims.length > 0) {
        const claimRecords = billing.insuranceClaims.map((claim) =>
          this.mapClaimToRecord(claim, billing.invoiceId.value)
        );
        const { error: claimsError } = await client
          .schema(this.schema)
          .from("insurance_claims")
          .upsert(claimRecords, {
            onConflict: 'id',
            ignoreDuplicates: false
          });

        if (claimsError) {
          throw new Error(`Failed to update insurance claims: ${claimsError.message}`);
        }
      }
    } catch (error) {
      console.error("Error updating billing aggregate:", error);
      throw error;
    }
  }

  /**
   * Map database record to billing aggregate
   */
  private mapFromRecord(
    billingRecord: BillingRecord,
    itemRecords: BillingItemRecord[],
    paymentRecords: PaymentRecordDB[],
    claimRecords: InsuranceClaimRecord[]
  ): BillingAggregate {
    // Map items
    const items: BillingItem[] = itemRecords.map((record) => ({
      id: record.item_id || record.id, // Use item_id from domain model
      description: record.description,
      vietnameseDescription: record.vietnamese_description,
      quantity: record.quantity,
      unitPrice: Money.create(
        record.unit_price_amount,
        record.unit_price_currency
      ),
      totalPrice: Money.create(
        record.total_price_amount,
        record.total_price_currency
      ),
      category: record.category as any,
      taxable: record.taxable,
      insuranceCoverable: record.insurance_coverable,
      medicalRecordId: record.medical_record_id,
      serviceCode: record.service_code,
    }));

    // Map payments
    const payments: PaymentRecord[] = paymentRecords.map((record) => ({
      id: record.payment_id || record.id,
      amount: Money.create(record.amount, record.currency),
      method: record.method as PaymentMethod,
      transactionId: record.transaction_id,
      processedAt: new Date(record.processed_at),
      processedBy: record.processed_by,
      notes: record.notes,
      payosData: record.payos_data,
    }));

    // Map insurance claims
    const insuranceClaims: InsuranceClaim[] = claimRecords.map((record) => ({
      id: record.id,
      insurance: this.mapInsuranceFromJSON(record.insurance_data),
      claimAmount: Money.create(record.claim_amount, record.currency),
      approvedAmount: record.approved_amount
        ? Money.create(record.approved_amount, record.currency)
        : undefined,
      status: record.status as any,
      submittedAt: new Date(record.submitted_at),
      processedAt: record.processed_at
        ? new Date(record.processed_at)
        : undefined,
      rejectionReason: record.rejection_reason,
      claimNumber: record.claim_number,
    }));

    // Map insurance
    const insurance = billingRecord.insurance_data
      ? this.mapInsuranceFromJSON(billingRecord.insurance_data)
      : undefined;

    // Reconstitute aggregate using invoice_id as business key
    return BillingAggregate.reconstitute(
      InvoiceId.create(billingRecord.invoice_id), // Use invoice_id instead of id
      billingRecord.patient_id,
      billingRecord.medical_record_id,
      billingRecord.doctor_id,
      billingRecord.appointment_id,
      billingRecord.status as InvoiceStatus,
      items,
      Money.create(
        billingRecord.subtotal_amount,
        billingRecord.subtotal_currency
      ),
      Money.create(billingRecord.tax_amount, billingRecord.tax_currency),
      Money.create(billingRecord.total_amount, billingRecord.total_currency),
      insurance,
      Money.create(
        billingRecord.insurance_coverage_amount,
        billingRecord.insurance_coverage_currency
      ),
      Money.create(
        billingRecord.patient_payment_amount,
        billingRecord.patient_payment_currency
      ),
      payments,
      insuranceClaims,
      new Date(billingRecord.due_date),
      new Date(billingRecord.issued_at),
      billingRecord.issued_by,
      billingRecord.notes,
      billingRecord.vietnamese_invoice_number
    );
  }

  /**
   * Map insurance from JSON
   */
  private mapInsuranceFromJSON(data: any): Insurance {
    switch (data.type) {
      case "BHYT":
        return Insurance.createBHYT(
          data.number,
          new Date(data.validUntil),
          data.coverageLevel,
          data.beneficiaryType,
          data.issuedBy
        );
      case "BHTN":
        return Insurance.createBHTN(
          data.number,
          new Date(data.validUntil),
          data.accidentType,
          new Date(data.accidentDate),
          data.employerInfo
        );
      case "Private":
        return Insurance.createPrivate(
          data.number,
          new Date(data.validUntil),
          data.coverageLevel,
          data.insuranceCompany,
          data.policyType
        );
      default:
        return Insurance.createSelfPay();
    }
  }

  /**
   * Search billings with criteria - Placeholder implementation
   */
  async search(criteria: any): Promise<any> {
    // This would be a complex implementation with dynamic query building
    // For now, returning a basic structure
    return {
      results: [],
      totalCount: 0,
      pageInfo: {
        currentPage: 1,
        totalPages: 0,
        hasNextPage: false,
        hasPreviousPage: false,
      },
    };
  }

  /**
   * Get billings with pagination - Placeholder implementation
   */
  async findWithPagination(
    pageSize: number,
    pageNumber: number,
    sortBy?: string,
    sortOrder?: "asc" | "desc"
  ): Promise<any> {
    return {
      results: [],
      totalCount: 0,
      pageInfo: {
        currentPage: pageNumber,
        totalPages: 0,
        hasNextPage: false,
        hasPreviousPage: false,
      },
    };
  }

  /**
   * Bulk save billing aggregates - Placeholder implementation
   */
  async bulkSave(billings: BillingAggregate[]): Promise<void> {
    for (const billing of billings) {
      await this.save(billing);
    }
  }

  /**
   * Find billings by multiple IDs - Placeholder implementation
   */
  async findByIds(ids: InvoiceId[]): Promise<BillingAggregate[]> {
    const billings: BillingAggregate[] = [];
    for (const id of ids) {
      const billing = await this.findById(id);
      if (billing) {
        billings.push(billing);
      }
    }
    return billings;
  }

  // Additional methods (getStatistics, getRevenueReport, etc.) would be implemented here
  // These are complex reporting methods that would require extensive SQL queries

  /**
   * Get billing statistics - Placeholder implementation
   */
  async getStatistics(criteria?: any): Promise<any> {
    return {
      totalInvoices: 0,
      totalAmount: Money.zero(),
      totalPaid: Money.zero(),
      totalPending: Money.zero(),
      totalOverdue: Money.zero(),
      averageInvoiceAmount: Money.zero(),
      paymentMethodBreakdown: {},
      insuranceBreakdown: {},
      statusBreakdown: {},
      monthlyTrends: [],
    };
  }

  /**
   * Get revenue report - Placeholder implementation
   */
  async getRevenueReport(criteria: any): Promise<any[]> {
    return [];
  }

  /**
   * Get outstanding invoices report - Placeholder implementation
   */
  async getOutstandingInvoicesReport(): Promise<any> {
    return {
      totalOutstanding: Money.zero(),
      overdueCount: 0,
      overdueAmount: Money.zero(),
      agingBreakdown: [],
      topOverduePatients: [],
    };
  }

  /**
   * Get insurance claims report - Placeholder implementation
   */
  async getInsuranceClaimsReport(criteria?: any): Promise<any> {
    return {
      totalClaims: 0,
      totalClaimAmount: Money.zero(),
      approvedClaims: 0,
      approvedAmount: Money.zero(),
      rejectedClaims: 0,
      rejectedAmount: Money.zero(),
      pendingClaims: 0,
      pendingAmount: Money.zero(),
      averageProcessingDays: 0,
      claimsByInsuranceType: {},
    };
  }

  /**
   * Get payment trends - Placeholder implementation
   */
  async getPaymentTrends(criteria: any): Promise<any[]> {
    return [];
  }

  /**
   * Find invoices requiring attention
   */
  async findInvoicesRequiringAttention(): Promise<any> {
    try {
      const client = await this.supabaseClient.getConnection();
      const now = new Date().toISOString();

      // Get overdue invoices
      const { data: overdueData } = await client
        .schema(this.schema)
        .from(this.tableName)
        .select('*')
        .lt('due_date', now)
        .in('status', ['PENDING', 'PARTIALLY_PAID'])
        .order('due_date', { ascending: true })
        .limit(10);

      // Get high value unpaid invoices (> 10M VND)
      const { data: highValueData } = await client
        .schema(this.schema)
        .from(this.tableName)
        .select('*')
        .in('status', ['PENDING', 'PARTIALLY_PAID'])
        .gte('patient_payment_amount', 10000000)
        .order('patient_payment_amount', { ascending: false })
        .limit(10);

      return {
        overdueInvoices: overdueData || [],
        expiredInsuranceInvoices: [],
        highValueUnpaidInvoices: highValueData || [],
        longPendingClaims: [],
      };
    } catch (error) {
      this.logger.error('Error finding invoices requiring attention', { error });
      throw error;
    }
  }

  /**
   * Get doctor billing performance
   */
  async getDoctorBillingPerformance(
    doctorId: string,
    dateRange: any
  ): Promise<any> {
    try {
      const client = await this.supabaseClient.getConnection();

      // Get invoices for doctor in date range
      const { data: invoices, error } = await client
        .schema(this.schema)
        .from(this.tableName)
        .select('*')
        .eq('doctor_id', doctorId)
        .gte('issued_at', dateRange.from.toISOString())
        .lte('issued_at', dateRange.to.toISOString());

      if (error) throw error;

      if (!invoices || invoices.length === 0) {
        return {
          totalInvoices: 0,
          totalRevenue: Money.zero(),
          averageInvoiceAmount: Money.zero(),
          collectionRate: 0,
          insuranceUtilization: 0,
          topServices: [],
          monthlyPerformance: [],
        };
      }

      // Calculate metrics
      const totalRevenue = invoices.reduce((sum, inv) => sum + inv.total_amount, 0);
      const paidInvoices = invoices.filter(inv => inv.status === 'PAID');
      const paidAmount = paidInvoices.reduce((sum, inv) => sum + inv.total_amount, 0);
      const withInsurance = invoices.filter(inv => inv.insurance_data);

      return {
        totalInvoices: invoices.length,
        totalRevenue: Money.create(totalRevenue, 'VND'),
        averageInvoiceAmount: Money.create(totalRevenue / invoices.length, 'VND'),
        collectionRate: invoices.length > 0 ? (paidAmount / totalRevenue) * 100 : 0,
        insuranceUtilization: invoices.length > 0 ? (withInsurance.length / invoices.length) * 100 : 0,
        topServices: [],
        monthlyPerformance: [],
      };
    } catch (error) {
      this.logger.error('Error getting doctor billing performance', { error, doctorId });
      throw error;
    }
  }

  /**
   * Get patient billing history
   */
  async getPatientBillingHistory(
    patientId: string,
    limit?: number
  ): Promise<any> {
    try {
      const client = await this.supabaseClient.getConnection();

      // Get invoices for patient
      let query = client
        .schema(this.schema)
        .from(this.tableName)
        .select('*')
        .eq('patient_id', patientId)
        .order('issued_at', { ascending: false });

      if (limit) {
        query = query.limit(limit);
      }

      const { data: invoices, error } = await query;

      if (error) throw error;

      if (!invoices || invoices.length === 0) {
        return {
          totalInvoices: 0,
          totalAmount: Money.zero(),
          totalPaid: Money.zero(),
          outstandingAmount: Money.zero(),
          paymentHistory: [],
          insuranceUtilization: {},
        };
      }

      // Get payment history
      const { data: payments } = await client
        .schema(this.schema)
        .from('invoice_payments')
        .select('*')
        .in('invoice_id', invoices.map(inv => inv.invoice_id))
        .order('processed_at', { ascending: false });

      // Calculate totals
      const totalAmount = invoices.reduce((sum, inv) => sum + inv.total_amount, 0);
      const paidInvoices = invoices.filter(inv => inv.status === 'PAID');
      const totalPaid = paidInvoices.reduce((sum, inv) => sum + inv.total_amount, 0);
      const outstandingInvoices = invoices.filter(inv => ['PENDING', 'PARTIALLY_PAID'].includes(inv.status));
      const outstandingAmount = outstandingInvoices.reduce((sum, inv) => sum + inv.patient_payment_amount, 0);

      return {
        totalInvoices: invoices.length,
        totalAmount: Money.create(totalAmount, 'VND'),
        totalPaid: Money.create(totalPaid, 'VND'),
        outstandingAmount: Money.create(outstandingAmount, 'VND'),
        paymentHistory: payments || [],
        insuranceUtilization: {},
      };
    } catch (error) {
      this.logger.error('Error getting patient billing history', { error, patientId });
      throw error;
    }
  }

  /**
   * Generate next invoice sequence number
   */
  async getNextSequenceNumber(year: number, month: number): Promise<number> {
    try {
      const { data, error } = await this.supabase
        .schema(this.SCHEMA)
        .rpc('get_next_invoice_sequence', {
          p_year: year,
          p_month: month
        });

      if (error) {
        this.logger.error('[BillingRepository] Failed to get next sequence number', { error, year, month });
        throw new Error(`Failed to get next sequence number: ${error.message}`);
      }

      return data || 1;
    } catch (error) {
      this.logger.error('[BillingRepository] Error getting next sequence number', { error });
      throw error;
    }
  }

  /**
   * Validate invoice uniqueness - Placeholder implementation
   */
  async isInvoiceNumberUnique(invoiceNumber: string): Promise<boolean> {
    return true;
  }

  /**
   * Archive old invoices - Placeholder implementation
   */
  async archiveOldInvoices(olderThanDays: number): Promise<number> {
    return 0;
  }

  /**
   * Get billing summary for dashboard
   */
  async getDashboardSummary(): Promise<any> {
    try {
      const client = await this.supabaseClient.getConnection();
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const yearStart = new Date(now.getFullYear(), 0, 1).toISOString();

      // Get today's revenue
      const { data: todayInvoices } = await client
        .schema(this.schema)
        .from(this.tableName)
        .select('total_amount')
        .eq('status', 'PAID')
        .gte('issued_at', todayStart);

      const todayRevenue = todayInvoices?.reduce((sum, inv) => sum + inv.total_amount, 0) || 0;

      // Get month revenue
      const { data: monthInvoices } = await client
        .schema(this.schema)
        .from(this.tableName)
        .select('total_amount')
        .eq('status', 'PAID')
        .gte('issued_at', monthStart);

      const monthRevenue = monthInvoices?.reduce((sum, inv) => sum + inv.total_amount, 0) || 0;

      // Get year revenue
      const { data: yearInvoices } = await client
        .schema(this.schema)
        .from(this.tableName)
        .select('total_amount')
        .eq('status', 'PAID')
        .gte('issued_at', yearStart);

      const yearRevenue = yearInvoices?.reduce((sum, inv) => sum + inv.total_amount, 0) || 0;

      // Get pending invoices count
      const { count: pendingCount } = await client
        .schema(this.schema)
        .from(this.tableName)
        .select('*', { count: 'exact', head: true })
        .eq('status', 'PENDING');

      // Get overdue invoices count
      const { count: overdueCount } = await client
        .schema(this.schema)
        .from(this.tableName)
        .select('*', { count: 'exact', head: true })
        .lt('due_date', now.toISOString())
        .in('status', ['PENDING', 'PARTIALLY_PAID']);

      // Get recent payments
      const { data: recentPayments } = await client
        .schema(this.schema)
        .from('invoice_payments')
        .select('*')
        .order('processed_at', { ascending: false })
        .limit(10);

      return {
        todayRevenue: Money.create(todayRevenue, 'VND'),
        monthRevenue: Money.create(monthRevenue, 'VND'),
        yearRevenue: Money.create(yearRevenue, 'VND'),
        pendingInvoices: pendingCount || 0,
        overdueInvoices: overdueCount || 0,
        recentPayments: recentPayments || [],
        topPaymentMethods: [],
      };
    } catch (error) {
      this.logger.error('Error getting dashboard summary', { error });
      throw error;
    }
  }

  // =====================================================
  // ADVANCED QUERY METHODS FOR USE CASES
  // =====================================================

  /**
   * Search invoices with advanced criteria
   */
  async search(criteria: any): Promise<any> {
    try {
      const client = await this.supabaseClient.getConnection();

      let query = client
        .schema(this.schema)
        .from(this.tableName)
        .select('*', { count: 'exact' });

      // Apply filters
      if (criteria.patientId) {
        query = query.eq('patient_id', criteria.patientId);
      }

      if (criteria.doctorId) {
        query = query.eq('doctor_id', criteria.doctorId);
      }

      if (criteria.status) {
        query = query.eq('status', criteria.status);
      }

      if (criteria.dateRange) {
        query = query
          .gte('issued_at', criteria.dateRange.from.toISOString())
          .lte('issued_at', criteria.dateRange.to.toISOString());
      }

      if (criteria.amountRange) {
        query = query
          .gte('total_amount', criteria.amountRange.min.amount)
          .lte('total_amount', criteria.amountRange.max.amount);
      }

      if (criteria.searchText) {
        query = query.or(`invoice_id.ilike.%${criteria.searchText}%,vietnamese_invoice_number.ilike.%${criteria.searchText}%`);
      }

      // Sorting
      const sortBy = criteria.sortBy || 'issued_at';
      const sortOrder = criteria.sortOrder === 'asc' ? { ascending: true } : { ascending: false };
      query = query.order(sortBy, sortOrder);

      // Pagination
      const pageSize = criteria.pageSize || 20;
      const pageNumber = criteria.pageNumber || 1;
      const offset = (pageNumber - 1) * pageSize;
      query = query.range(offset, offset + pageSize - 1);

      const { data: records, error, count } = await query;

      if (error) throw error;

      // Get related data
      const results = await this.enrichInvoicesWithRelatedData(records || []);

      const totalCount = count || 0;
      const totalPages = Math.ceil(totalCount / pageSize);

      return {
        results,
        totalCount,
        pageInfo: {
          currentPage: pageNumber,
          totalPages,
          hasNextPage: pageNumber < totalPages,
          hasPreviousPage: pageNumber > 1
        }
      };

    } catch (error) {
      this.logger.error('Error searching invoices', { error, criteria });
      throw error;
    }
  }

  /**
   * Find invoices with pagination
   */
  async findWithPagination(
    pageSize: number,
    pageNumber: number,
    sortBy?: string,
    sortOrder?: 'asc' | 'desc'
  ): Promise<any> {
    try {
      const client = await this.supabaseClient.getConnection();

      const offset = (pageNumber - 1) * pageSize;
      const sort = sortBy || 'issued_at';
      const order = sortOrder === 'asc' ? { ascending: true } : { ascending: false };

      const { data: records, error, count } = await client
        .schema(this.schema)
        .from(this.tableName)
        .select('*', { count: 'exact' })
        .order(sort, order)
        .range(offset, offset + pageSize - 1);

      if (error) throw error;

      const results = await this.enrichInvoicesWithRelatedData(records || []);
      const totalCount = count || 0;
      const totalPages = Math.ceil(totalCount / pageSize);

      return {
        results,
        totalCount,
        pageInfo: {
          currentPage: pageNumber,
          totalPages,
          hasNextPage: pageNumber < totalPages,
          hasPreviousPage: pageNumber > 1
        }
      };

    } catch (error) {
      this.logger.error('Error finding with pagination', { error });
      throw error;
    }
  }

  /**
   * Helper: Enrich invoices with related data (items, payments)
   */
  private async enrichInvoicesWithRelatedData(records: any[]): Promise<BillingAggregate[]> {
    if (records.length === 0) return [];

    const client = await this.supabaseClient.getConnection();
    const invoiceIds = records.map(r => r.invoice_id);

    const { data: items } = await client
      .schema(this.schema)
      .from('billing_items')
      .select('*')
      .in('invoice_id', invoiceIds);

    const { data: payments } = await client
      .schema(this.schema)
      .from('invoice_payments')
      .select('*')
      .in('invoice_id', invoiceIds);

    return records.map(record => {
      const recordItems = items?.filter(i => i.invoice_id === record.invoice_id) || [];
      const recordPayments = payments?.filter(p => p.invoice_id === record.invoice_id) || [];
      return this.mapToDomain(record, recordItems, recordPayments);
    });
  }

  /**
   * Get revenue report with grouping
   */
  async getRevenueReport(criteria: any): Promise<any[]> {
    try {
      const client = await this.supabaseClient.getConnection();

      // Get all paid invoices in date range
      let query = client
        .schema(this.schema)
        .from(this.tableName)
        .select('*')
        .eq('status', 'PAID')
        .gte('issued_at', criteria.dateRange.from.toISOString())
        .lte('issued_at', criteria.dateRange.to.toISOString());

      if (criteria.doctorId) {
        query = query.eq('doctor_id', criteria.doctorId);
      }

      const { data: invoices, error } = await query;

      if (error) throw error;

      if (!invoices || invoices.length === 0) {
        return [];
      }

      // Group by period
      const grouped = this.groupInvoicesByPeriod(invoices, criteria.groupBy);

      // Calculate metrics for each period
      return grouped.map(group => {
        const totalRevenue = group.invoices.reduce((sum, inv) => sum + inv.total_amount, 0);
        const cashRevenue = group.invoices
          .filter(inv => !inv.insurance_data)
          .reduce((sum, inv) => sum + inv.patient_payment_amount, 0);
        const insuranceRevenue = group.invoices
          .filter(inv => inv.insurance_data)
          .reduce((sum, inv) => sum + inv.insurance_coverage_amount, 0);

        return {
          period: group.period,
          totalRevenue: Money.create(totalRevenue, 'VND'),
          cashRevenue: Money.create(cashRevenue, 'VND'),
          insuranceRevenue: Money.create(insuranceRevenue, 'VND'),
          invoiceCount: group.invoices.length,
          averageInvoiceAmount: Money.create(totalRevenue / group.invoices.length, 'VND')
        };
      });

    } catch (error) {
      this.logger.error('Error getting revenue report', { error, criteria });
      throw error;
    }
  }

  /**
   * Get outstanding invoices report
   */
  async getOutstandingInvoicesReport(): Promise<any> {
    try {
      const client = await this.supabaseClient.getConnection();
      const now = new Date();

      // Get all outstanding invoices
      const { data: invoices, error } = await client
        .schema(this.schema)
        .from(this.tableName)
        .select('*')
        .in('status', ['PENDING', 'PARTIALLY_PAID']);

      if (error) throw error;

      if (!invoices || invoices.length === 0) {
        return {
          totalOutstanding: Money.zero(),
          overdueCount: 0,
          overdueAmount: Money.zero(),
          agingBreakdown: [],
          topOverduePatients: []
        };
      }

      // Calculate totals
      const totalOutstanding = invoices.reduce((sum, inv) => sum + inv.patient_payment_amount, 0);
      const overdueInvoices = invoices.filter(inv => inv.due_date && new Date(inv.due_date) < now);
      const overdueAmount = overdueInvoices.reduce((sum, inv) => sum + inv.patient_payment_amount, 0);

      // Calculate aging breakdown
      const agingBreakdown = this.calculateAgingBreakdown(invoices, now);

      // Get top overdue patients
      const topOverduePatients = this.getTopOverduePatients(overdueInvoices);

      return {
        totalOutstanding: Money.create(totalOutstanding, 'VND'),
        overdueCount: overdueInvoices.length,
        overdueAmount: Money.create(overdueAmount, 'VND'),
        agingBreakdown,
        topOverduePatients
      };

    } catch (error) {
      this.logger.error('Error getting outstanding invoices report', { error });
      throw error;
    }
  }

  /**
   * Get insurance claims report
   */
  async getInsuranceClaimsReport(criteria?: any): Promise<any> {
    try {
      const client = await this.supabaseClient.getConnection();

      let query = client
        .schema(this.schema)
        .from(this.tableName)
        .select('*')
        .not('insurance_data', 'is', null);

      if (criteria?.dateRange) {
        query = query
          .gte('issued_at', criteria.dateRange.from.toISOString())
          .lte('issued_at', criteria.dateRange.to.toISOString());
      }

      const { data: invoices, error } = await query;

      if (error) throw error;

      if (!invoices || invoices.length === 0) {
        return {
          totalClaims: 0,
          totalClaimAmount: Money.zero(),
          approvedClaims: 0,
          approvedAmount: Money.zero(),
          rejectedClaims: 0,
          rejectedAmount: Money.zero(),
          pendingClaims: 0,
          pendingAmount: Money.zero(),
          averageProcessingDays: 0,
          claimsByInsuranceType: {}
        };
      }

      // Calculate metrics
      const totalClaimAmount = invoices.reduce((sum, inv) => sum + inv.insurance_coverage_amount, 0);

      const approvedInvoices = invoices.filter(inv =>
        inv.insurance_data?.claimStatus === 'approved'
      );
      const approvedAmount = approvedInvoices.reduce((sum, inv) => sum + inv.insurance_coverage_amount, 0);

      const rejectedInvoices = invoices.filter(inv =>
        inv.insurance_data?.claimStatus === 'rejected'
      );
      const rejectedAmount = rejectedInvoices.reduce((sum, inv) => sum + inv.insurance_coverage_amount, 0);

      const pendingInvoices = invoices.filter(inv =>
        inv.insurance_data?.claimStatus === 'submitted'
      );
      const pendingAmount = pendingInvoices.reduce((sum, inv) => sum + inv.insurance_coverage_amount, 0);

      return {
        totalClaims: invoices.length,
        totalClaimAmount: Money.create(totalClaimAmount, 'VND'),
        approvedClaims: approvedInvoices.length,
        approvedAmount: Money.create(approvedAmount, 'VND'),
        rejectedClaims: rejectedInvoices.length,
        rejectedAmount: Money.create(rejectedAmount, 'VND'),
        pendingClaims: pendingInvoices.length,
        pendingAmount: Money.create(pendingAmount, 'VND'),
        averageProcessingDays: 0, // TODO: Calculate from timestamps
        claimsByInsuranceType: this.groupClaimsByInsuranceType(invoices)
      };

    } catch (error) {
      this.logger.error('Error getting insurance claims report', { error, criteria });
      throw error;
    }
  }

  /**
   * Get payment trends
   */
  async getPaymentTrends(criteria: any): Promise<any[]> {
    try {
      const client = await this.supabaseClient.getConnection();

      // Get all payments in date range
      const { data: payments, error } = await client
        .schema(this.schema)
        .from('invoice_payments')
        .select('*')
        .gte('processed_at', criteria.dateRange.from.toISOString())
        .lte('processed_at', criteria.dateRange.to.toISOString())
        .order('processed_at', { ascending: true });

      if (error) throw error;

      if (!payments || payments.length === 0) {
        return [];
      }

      // Group by period
      const grouped = this.groupPaymentsByPeriod(payments, criteria.groupBy);

      // Calculate metrics for each period
      return grouped.map(group => {
        const totalPayments = group.payments.reduce((sum, p) => sum + p.amount, 0);
        const paymentMethodBreakdown = this.calculatePaymentMethodBreakdown(group.payments, totalPayments);

        return {
          period: group.period,
          totalPayments: Money.create(totalPayments, 'VND'),
          paymentCount: group.payments.length,
          averagePaymentAmount: Money.create(totalPayments / group.payments.length, 'VND'),
          paymentMethodBreakdown
        };
      });

    } catch (error) {
      this.logger.error('Error getting payment trends', { error, criteria });
      throw error;
    }
  }

  /**
   * Get statistics
   */
  async getStatistics(criteria?: any): Promise<any> {
    try {
      const client = await this.supabaseClient.getConnection();

      let query = client
        .schema(this.schema)
        .from(this.tableName)
        .select('*');

      if (criteria?.dateRange) {
        query = query
          .gte('issued_at', criteria.dateRange.from.toISOString())
          .lte('issued_at', criteria.dateRange.to.toISOString());
      }

      if (criteria?.doctorId) {
        query = query.eq('doctor_id', criteria.doctorId);
      }

      const { data: invoices, error } = await query;

      if (error) throw error;

      if (!invoices || invoices.length === 0) {
        return {
          totalInvoices: 0,
          totalAmount: Money.zero(),
          totalPaid: Money.zero(),
          totalPending: Money.zero(),
          totalOverdue: Money.zero(),
          averageInvoiceAmount: Money.zero(),
          paymentMethodBreakdown: {},
          insuranceBreakdown: {},
          statusBreakdown: {},
          monthlyTrends: []
        };
      }

      // Calculate totals
      const totalAmount = invoices.reduce((sum, inv) => sum + inv.total_amount, 0);
      const paidInvoices = invoices.filter(inv => inv.status === 'PAID');
      const totalPaid = paidInvoices.reduce((sum, inv) => sum + inv.total_amount, 0);
      const pendingInvoices = invoices.filter(inv => inv.status === 'PENDING');
      const totalPending = pendingInvoices.reduce((sum, inv) => sum + inv.patient_payment_amount, 0);

      const now = new Date();
      const overdueInvoices = invoices.filter(inv =>
        inv.due_date && new Date(inv.due_date) < now && ['PENDING', 'PARTIALLY_PAID'].includes(inv.status)
      );
      const totalOverdue = overdueInvoices.reduce((sum, inv) => sum + inv.patient_payment_amount, 0);

      return {
        totalInvoices: invoices.length,
        totalAmount: Money.create(totalAmount, 'VND'),
        totalPaid: Money.create(totalPaid, 'VND'),
        totalPending: Money.create(totalPending, 'VND'),
        totalOverdue: Money.create(totalOverdue, 'VND'),
        averageInvoiceAmount: Money.create(totalAmount / invoices.length, 'VND'),
        paymentMethodBreakdown: {},
        insuranceBreakdown: this.calculateInsuranceBreakdown(invoices),
        statusBreakdown: this.calculateStatusBreakdown(invoices),
        monthlyTrends: []
      };

    } catch (error) {
      this.logger.error('Error getting statistics', { error, criteria });
      throw error;
    }
  }

  // =====================================================
  // HELPER METHODS
  // =====================================================

  /**
   * Group invoices by period (day/week/month)
   */
  private groupInvoicesByPeriod(invoices: any[], groupBy: string): any[] {
    const groups = new Map<string, any[]>();

    for (const invoice of invoices) {
      const date = new Date(invoice.issued_at);
      let periodKey: string;

      if (groupBy === 'day') {
        periodKey = date.toISOString().split('T')[0];
      } else if (groupBy === 'week') {
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        periodKey = weekStart.toISOString().split('T')[0];
      } else { // month
        periodKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      }

      if (!groups.has(periodKey)) {
        groups.set(periodKey, []);
      }
      groups.get(periodKey)!.push(invoice);
    }

    return Array.from(groups.entries()).map(([period, invoices]) => ({
      period,
      invoices
    }));
  }

  /**
   * Group payments by period
   */
  private groupPaymentsByPeriod(payments: any[], groupBy: string): any[] {
    const groups = new Map<string, any[]>();

    for (const payment of payments) {
      const date = new Date(payment.processed_at);
      let periodKey: string;

      if (groupBy === 'day') {
        periodKey = date.toISOString().split('T')[0];
      } else if (groupBy === 'week') {
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        periodKey = weekStart.toISOString().split('T')[0];
      } else { // month
        periodKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      }

      if (!groups.has(periodKey)) {
        groups.set(periodKey, []);
      }
      groups.get(periodKey)!.push(payment);
    }

    return Array.from(groups.entries()).map(([period, payments]) => ({
      period,
      payments
    }));
  }

  /**
   * Calculate aging breakdown for outstanding invoices
   */
  private calculateAgingBreakdown(invoices: any[], asOfDate: Date): any[] {
    const aging = {
      current: { count: 0, amount: 0 },
      days1to30: { count: 0, amount: 0 },
      days31to60: { count: 0, amount: 0 },
      days61to90: { count: 0, amount: 0 },
      over90Days: { count: 0, amount: 0 }
    };

    for (const inv of invoices) {
      const amount = inv.patient_payment_amount;

      if (!inv.due_date) {
        aging.current.count++;
        aging.current.amount += amount;
        continue;
      }

      const dueDate = new Date(inv.due_date);
      const daysOverdue = Math.floor((asOfDate.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));

      if (daysOverdue <= 0) {
        aging.current.count++;
        aging.current.amount += amount;
      } else if (daysOverdue <= 30) {
        aging.days1to30.count++;
        aging.days1to30.amount += amount;
      } else if (daysOverdue <= 60) {
        aging.days31to60.count++;
        aging.days31to60.amount += amount;
      } else if (daysOverdue <= 90) {
        aging.days61to90.count++;
        aging.days61to90.amount += amount;
      } else {
        aging.over90Days.count++;
        aging.over90Days.amount += amount;
      }
    }

    return [
      { ageRange: 'Current', count: aging.current.count, amount: Money.create(aging.current.amount, 'VND') },
      { ageRange: '1-30 days', count: aging.days1to30.count, amount: Money.create(aging.days1to30.amount, 'VND') },
      { ageRange: '31-60 days', count: aging.days31to60.count, amount: Money.create(aging.days31to60.amount, 'VND') },
      { ageRange: '61-90 days', count: aging.days61to90.count, amount: Money.create(aging.days61to90.amount, 'VND') },
      { ageRange: 'Over 90 days', count: aging.over90Days.count, amount: Money.create(aging.over90Days.amount, 'VND') }
    ];
  }

  /**
   * Get top overdue patients
   */
  private getTopOverduePatients(invoices: any[]): any[] {
    const patientMap = new Map<string, any>();

    for (const inv of invoices) {
      const patientId = inv.patient_id;

      if (!patientMap.has(patientId)) {
        patientMap.set(patientId, {
          patientId,
          invoiceCount: 0,
          totalAmount: 0,
          oldestInvoiceDate: new Date(inv.issued_at)
        });
      }

      const patient = patientMap.get(patientId)!;
      patient.invoiceCount++;
      patient.totalAmount += inv.patient_payment_amount;

      const invoiceDate = new Date(inv.issued_at);
      if (invoiceDate < patient.oldestInvoiceDate) {
        patient.oldestInvoiceDate = invoiceDate;
      }
    }

    return Array.from(patientMap.values())
      .sort((a, b) => b.totalAmount - a.totalAmount)
      .slice(0, 10)
      .map(p => ({
        ...p,
        totalAmount: Money.create(p.totalAmount, 'VND')
      }));
  }

  /**
   * Calculate payment method breakdown
   */
  private calculatePaymentMethodBreakdown(payments: any[], totalAmount: number): any {
    const methods = ['CASH', 'CARD', 'BANK_TRANSFER', 'PAYOS', 'INSURANCE_DIRECT'];
    const breakdown: any = {};

    for (const method of methods) {
      const filtered = payments.filter(p => p.method === method);
      const amount = filtered.reduce((sum, p) => sum + p.amount, 0);

      breakdown[method] = {
        count: filtered.length,
        amount: Money.create(amount, 'VND'),
        percentage: totalAmount > 0 ? (amount / totalAmount) * 100 : 0
      };
    }

    return breakdown;
  }

  /**
   * Group claims by insurance type
   */
  private groupClaimsByInsuranceType(invoices: any[]): any {
    const types = ['BHYT', 'BHTN', 'Private'];
    const breakdown: any = {};

    for (const type of types) {
      const filtered = invoices.filter(inv => inv.insurance_data?.type === type);
      const approved = filtered.filter(inv => inv.insurance_data?.claimStatus === 'approved');

      breakdown[type] = {
        count: filtered.length,
        amount: Money.create(filtered.reduce((sum, inv) => sum + inv.insurance_coverage_amount, 0), 'VND'),
        approvalRate: filtered.length > 0 ? (approved.length / filtered.length) * 100 : 0
      };
    }

    return breakdown;
  }

  /**
   * Calculate insurance breakdown
   */
  private calculateInsuranceBreakdown(invoices: any[]): any {
    const types = ['BHYT', 'BHTN', 'Private'];
    const breakdown: any = {};

    for (const type of types) {
      const filtered = invoices.filter(inv => inv.insurance_data?.type === type);

      breakdown[type] = {
        count: filtered.length,
        amount: Money.create(filtered.reduce((sum, inv) => sum + inv.total_amount, 0), 'VND')
      };
    }

    return breakdown;
  }

  /**
   * Calculate status breakdown
   */
  private calculateStatusBreakdown(invoices: any[]): any {
    const statuses = ['DRAFT', 'PENDING', 'PARTIALLY_PAID', 'PAID', 'CANCELLED'];
    const breakdown: any = {};

    for (const status of statuses) {
      const filtered = invoices.filter(inv => inv.status === status);

      breakdown[status] = {
        count: filtered.length,
        amount: Money.create(filtered.reduce((sum, inv) => sum + inv.total_amount, 0), 'VND')
      };
    }

    return breakdown;
  }
}
