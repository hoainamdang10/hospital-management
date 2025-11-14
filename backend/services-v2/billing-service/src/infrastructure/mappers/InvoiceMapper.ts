import { Invoice } from '../../domain/aggregates/Invoice';
import { InvoiceId } from '../../domain/value-objects/InvoiceId';
import { Money } from '../../domain/value-objects/Money';
import { InvoiceStatus } from '../../domain/value-objects/InvoiceStatus';
import { Insurance } from '../../domain/value-objects/Insurance';
import { InvoiceItem } from '../../domain/entities/InvoiceItem';
import { Payment } from '../../domain/entities/Payment';

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
  transaction_id?: string;
  processed_at: string;
  processed_by?: string;
  payos_data?: any;
  payos_order_code?: number;
  payos_transaction_id?: string;
  notes?: string;
  metadata?: any;
  created_at: string;
}

export class InvoiceMapper {
  /**
   * Map from database records (normalized schema) to domain Invoice aggregate
   */
  public static toDomain(
    record: InvoiceRecord,
    itemRecords: BillingItemRecord[] = [],
    paymentRecords: PaymentRecordData[] = []
  ): Invoice {
    // Map billing items from separate table
    const items = itemRecords.map((item) =>
      InvoiceItem.create(
        item.description,
        item.quantity,
        Money.create(item.unit_price_amount, item.unit_price_currency),
        item.item_id
      )
    );

    // Map insurance from database fields
    const insurance = record.insurance_type
      ? Insurance.create(
          record.insurance_issued_by || 'Unknown',
          record.insurance_number || '',
          record.insurance_coverage_level || 0
        )
      : undefined;

    // Map payment records from separate table
    const payments = paymentRecords.map((p) =>
      Payment.create(
        Money.create(p.amount, p.currency),
        p.method as any, // Database stores string, cast to PaymentMethod
        p.transaction_id,
        p.payment_id
      )
    );

    const props = {
      id: InvoiceId.create(record.id),
      patientId: record.patient_id,
      invoiceNumber: record.vietnamese_invoice_number || record.invoice_id,
      items,
      subtotal: Money.create(record.subtotal_amount, record.subtotal_currency),
      tax: Money.create(record.tax_amount, record.tax_currency),
      insuranceCoverage: Money.create(record.insurance_coverage_amount, record.insurance_coverage_currency),
      totalAmount: Money.create(record.total_amount, record.total_currency),
      outstandingAmount: Money.create(record.patient_payment_amount, record.patient_payment_currency),
      status: InvoiceStatus.create(record.status as any),
      insurance,
      payments,
      createdAt: new Date(record.created_at),
      updatedAt: new Date(record.updated_at),
      finalizedAt: record.finalized_at ? new Date(record.finalized_at) : undefined,
      cancelledAt: undefined, // Not in current schema
      cancellationReason: undefined // Not in current schema
    };

    return Reflect.construct(Invoice, [props, record.id]);
  }

  /**
   * Map from domain Invoice aggregate to database records (normalized schema)
   * Returns main invoice record + separate arrays for items and payments
   */
  public static toPersistence(invoice: Invoice): {
    invoice: Partial<InvoiceRecord>;
    items: Partial<BillingItemRecord>[];
    payments: Partial<PaymentRecordData>[];
  } {
    const persistence = invoice.toPersistence();
    
    // Main invoice record
    const invoiceRecord: Partial<InvoiceRecord> = {
      id: persistence.id,
      invoice_id: persistence.invoiceNumber || `INV-${Date.now()}`,
      vietnamese_invoice_number: persistence.invoiceNumber,
      patient_id: persistence.patientId,
      status: persistence.status,
      subtotal_amount: persistence.subtotal,
      subtotal_currency: persistence.currency,
      tax_amount: persistence.tax,
      tax_currency: persistence.currency,
      total_amount: persistence.totalAmount,
      total_currency: persistence.currency,
      insurance_coverage_amount: persistence.insuranceCoverage,
      insurance_coverage_currency: persistence.currency,
      patient_payment_amount: persistence.outstandingAmount,
      patient_payment_currency: persistence.currency,
      insurance_type: persistence.insurance?.provider,
      insurance_number: persistence.insurance?.policyNumber,
      insurance_coverage_level: persistence.insurance?.coveragePercentage,
      insurance_issued_by: persistence.insurance?.provider,
      created_at: persistence.createdAt.toISOString(),
      updated_at: persistence.updatedAt.toISOString(),
      finalized_at: persistence.finalizedAt?.toISOString(),
      version: 1,
      contains_phi: true
    };

    // Billing items records
    const itemRecords: Partial<BillingItemRecord>[] = persistence.items.map((item: any) => ({
      invoice_id: persistence.id,
      item_id: item.id,
      description: item.description,
      quantity: item.quantity,
      unit_price_amount: item.unitPrice,
      unit_price_currency: item.currency || persistence.currency,
      total_price_amount: item.totalPrice,
      total_price_currency: item.currency || persistence.currency,
      taxable: true,
      insurance_coverable: true
    }));

    // Payment records
    const paymentRecords: Partial<PaymentRecordData>[] = persistence.payments.map((p: any) => ({
      invoice_id: persistence.id,
      payment_id: p.id,
      amount: p.amount,
      currency: p.currency || persistence.currency,
      method: p.method,
      transaction_id: p.transactionId,
      processed_at: new Date().toISOString()
    }));

    return {
      invoice: invoiceRecord,
      items: itemRecords,
      payments: paymentRecords
    };
  }
}
