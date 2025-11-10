import { Invoice } from '../../domain/aggregates/Invoice';
import { InvoiceId } from '../../domain/value-objects/InvoiceId';
import { Money } from '../../domain/value-objects/Money';
import { InvoiceStatus } from '../../domain/value-objects/InvoiceStatus';
import { Insurance } from '../../domain/value-objects/Insurance';
import { InvoiceItem } from '../../domain/entities/InvoiceItem';
import { Payment } from '../../domain/entities/Payment';

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

export class InvoiceMapper {
  public static toDomain(record: InvoiceRecord): Invoice {
    const items = record.items.map((item: any) =>
      InvoiceItem.create(
        item.description,
        item.quantity,
        Money.create(item.unitPrice, item.currency || record.currency),
        item.id
      )
    );

    const insurance = record.insurance
      ? Insurance.create(
          record.insurance.provider,
          record.insurance.policyNumber,
          record.insurance.coveragePercentage
        )
      : undefined;

    const payments = record.payments.map((p: any) =>
      Payment.create(
        Money.create(p.amount, p.currency || record.currency),
        p.method,
        p.transactionId,
        p.id
      )
    );

    const props = {
      id: InvoiceId.create(record.id),
      patientId: record.patient_id,
      invoiceNumber: record.invoice_number,
      items,
      subtotal: Money.create(record.subtotal, record.currency),
      tax: Money.create(record.tax, record.currency),
      insuranceCoverage: Money.create(record.insurance_coverage, record.currency),
      totalAmount: Money.create(record.total_amount, record.currency),
      outstandingAmount: Money.create(record.outstanding_amount, record.currency),
      status: InvoiceStatus.create(record.status as any),
      insurance,
      payments,
      createdAt: new Date(record.created_at),
      updatedAt: new Date(record.updated_at),
      finalizedAt: record.finalized_at ? new Date(record.finalized_at) : undefined,
      cancelledAt: record.cancelled_at ? new Date(record.cancelled_at) : undefined,
      cancellationReason: record.cancellation_reason
    };

    return Reflect.construct(Invoice, [props, record.id]);
  }

  public static toPersistence(invoice: Invoice): InvoiceRecord {
    const persistence = invoice.toPersistence();
    
    return {
      id: persistence.id,
      patient_id: persistence.patientId,
      invoice_number: persistence.invoiceNumber,
      items: persistence.items,
      subtotal: persistence.subtotal,
      tax: persistence.tax,
      insurance_coverage: persistence.insuranceCoverage,
      total_amount: persistence.totalAmount,
      outstanding_amount: persistence.outstandingAmount,
      currency: persistence.currency,
      status: persistence.status,
      insurance: persistence.insurance,
      payments: persistence.payments,
      created_at: persistence.createdAt.toISOString(),
      updated_at: persistence.updatedAt.toISOString(),
      finalized_at: persistence.finalizedAt?.toISOString(),
      cancelled_at: persistence.cancelledAt?.toISOString(),
      cancellation_reason: persistence.cancellationReason
    };
  }
}
