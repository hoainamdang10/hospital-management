import { Invoice } from "../../domain/aggregates/Invoice";
import { InvoiceId } from "../../domain/value-objects/InvoiceId";
import { Money } from "../../domain/value-objects/Money";
import { InvoiceStatus } from "../../domain/value-objects/InvoiceStatus";
import { Insurance } from "../../domain/value-objects/Insurance";
import { InvoiceItem } from "../../domain/entities/InvoiceItem";
import { Payment, VnpayTransactionData } from "../../domain/entities/Payment";

export interface InvoiceRecord {
  id: string;
  invoice_id: string;
  vietnamese_invoice_number?: string;
  patient_id: string;
  medical_record_id?: string;
  doctor_id: string;
  appointment_id?: string; // VARCHAR format like "2025-APT-202511-901"
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
  outstanding_amount?: number;
  outstanding_currency?: string;
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
  status?: string;
  transaction_id?: string;
  processed_at: string;
  processed_by?: string;
  payos_data?: any;
  payos_order_code?: number;
  payos_transaction_id?: string;
  vnpay_txn_ref?: string;
  vnpay_transaction_no?: string;
  vnpay_pay_date?: string;
  refunded_at?: string;
  refund_reason?: string;
  refunded_by?: string;
  gateway_refund_id?: string;
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
    paymentRecords: PaymentRecordData[] = [],
  ): Invoice {
    // Map billing items from separate table
    const items = itemRecords.map((item) =>
      InvoiceItem.create(
        item.description,
        item.quantity,
        Money.create(item.unit_price_amount, item.unit_price_currency),
        item.item_id,
      ),
    );

    // Map insurance from database fields
    const insurance = record.insurance_type
      ? Insurance.create(
        record.insurance_issued_by || "Unknown",
        record.insurance_number || "",
        record.insurance_coverage_level || 0,
      )
      : undefined;

    // Map payment records from separate table
    const payments = paymentRecords.map((p) => {
      // Reconstruct VNPAY transaction data if available
      let vnpayData: VnpayTransactionData | undefined;
      if (p.vnpay_txn_ref && p.vnpay_transaction_no && p.vnpay_pay_date) {
        // Convert ISO timestamp back to VNPAY format (yyyyMMddHHmmss)
        const payDate = new Date(p.vnpay_pay_date);
        const vnpayPayDate =
          payDate.getFullYear().toString() +
          (payDate.getMonth() + 1).toString().padStart(2, "0") +
          payDate.getDate().toString().padStart(2, "0") +
          payDate.getHours().toString().padStart(2, "0") +
          payDate.getMinutes().toString().padStart(2, "0") +
          payDate.getSeconds().toString().padStart(2, "0");

        vnpayData = {
          vnpTxnRef: p.vnpay_txn_ref,
          vnpTransactionNo: p.vnpay_transaction_no,
          vnpPayDate: vnpayPayDate,
        };
      }

      // Use createSigned() for negative amounts (refunds), create() for positive amounts
      const money =
        p.amount < 0
          ? Money.createSigned(p.amount, p.currency)
          : Money.create(p.amount, p.currency);

      return Payment.create(
        money,
        p.method as any, // Database stores string, cast to PaymentMethod
        p.transaction_id,
        p.payment_id,
        vnpayData, // Pass VNPAY data to Payment entity
        (p.status as any) || undefined,
        p.processed_at ? new Date(p.processed_at) : undefined,
        p.refunded_at ? new Date(p.refunded_at) : undefined,
        p.refund_reason,
        p.refunded_by,
        p.gateway_refund_id,
      );
    });

    const normalizedMetadata = this.normalizeMetadata(
      record,
      itemRecords,
      paymentRecords,
    );

    const totalAmountValue = Number(record.total_amount) || 0;
    const insuranceCoverageValue =
      Number(record.insurance_coverage_amount) || 0;
    const patientLiability = Math.max(
      totalAmountValue - insuranceCoverageValue,
      0,
    );

    const totalPaid = paymentRecords
      .filter((payment) => (payment.method || "").toLowerCase() !== "refund")
      .reduce(
        (sum, payment) => sum + Math.max(0, Number(payment.amount) || 0),
        0,
      );
    const outstandingFromPayments = Math.max(patientLiability - totalPaid, 0);

    const storedOutstandingRaw = Number(record.outstanding_amount);
    const storedPatientPayment = Number(record.patient_payment_amount);
    let normalizedOutstanding: number;
    if (Number.isFinite(storedOutstandingRaw)) {
      normalizedOutstanding = storedOutstandingRaw;
    } else if (Number.isFinite(storedPatientPayment)) {
      normalizedOutstanding = storedPatientPayment;
    } else {
      normalizedOutstanding = patientLiability;
    }

    if (normalizedOutstanding > patientLiability) {
      normalizedOutstanding = patientLiability;
    }
    if (outstandingFromPayments > normalizedOutstanding) {
      normalizedOutstanding = outstandingFromPayments;
    }
    if (normalizedOutstanding < 0) {
      normalizedOutstanding = 0;
    }

    const outstandingCurrency =
      record.outstanding_currency ||
      record.patient_payment_currency ||
      record.total_currency;

    const props = {
      id: InvoiceId.create(record.id),
      patientId: record.patient_id,
      appointmentId: record.appointment_id,
      staffId: record.doctor_id,
      metadata: normalizedMetadata,
      invoiceNumber: record.vietnamese_invoice_number || record.invoice_id,
      items,
      subtotal: Money.create(record.subtotal_amount, record.subtotal_currency),
      tax: Money.create(record.tax_amount, record.tax_currency),
      insuranceCoverage: Money.create(
        record.insurance_coverage_amount || 0,
        record.insurance_coverage_currency || record.total_currency,
      ),
      insurance,
      totalAmount: Money.create(record.total_amount, record.total_currency),
      outstandingAmount: Money.create(
        normalizedOutstanding,
        outstandingCurrency,
      ),
      status: InvoiceStatus.create(record.status as any),
      payments,
      paidAt: record.paid_at ? new Date(record.paid_at) : undefined,
      createdAt: new Date(record.created_at),
      updatedAt: new Date(record.updated_at),
      dueDate: record.due_date ? new Date(record.due_date) : new Date(),
      finalizedAt: record.finalized_at
        ? new Date(record.finalized_at)
        : undefined,
      cancelledAt: undefined, // Not in current schema
      cancellationReason: undefined, // Not in current schema
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
    const issuedAtIso = persistence.createdAt.toISOString();
    const dueDateSource =
      persistence.dueDate instanceof Date
        ? persistence.dueDate
        : new Date(
          (persistence.dueDate as Date | string | undefined) ||
          persistence.createdAt,
        );
    const dueDateIso = Number.isNaN(dueDateSource.getTime())
      ? new Date(persistence.createdAt.getTime() + 30 * 60 * 1000).toISOString()
      : dueDateSource.toISOString();

    const patientLiability = Math.max(
      (persistence.totalAmount ?? 0) - (persistence.insuranceCoverage ?? 0),
      0,
    );

    const invoiceRecord: Partial<InvoiceRecord> = {
      id: persistence.id,
      invoice_id: persistence.invoiceNumber || `INV-${Date.now()}`,
      vietnamese_invoice_number: persistence.invoiceNumber,
      patient_id: persistence.patientId,
      appointment_id: persistence.appointmentId,
      doctor_id: persistence.staffId || "00000000-0000-0000-0000-000000000000",
      metadata: persistence.metadata || {},
      status: persistence.status,
      subtotal_amount: persistence.subtotal,
      subtotal_currency: persistence.currency,
      tax_amount: persistence.tax,
      tax_currency: persistence.currency,
      total_amount: persistence.totalAmount,
      total_currency: persistence.currency,
      // Insurance coverage - re-enabled
      insurance_coverage_amount: persistence.insuranceCoverage ?? 0,
      insurance_coverage_currency: persistence.currency,
      patient_payment_amount: patientLiability,
      patient_payment_currency: persistence.currency,
      outstanding_amount: persistence.outstandingAmount,
      outstanding_currency: persistence.currency,
      // Insurance info - re-enabled
      // Map provider name to valid insurance_type enum: BHYT, BHTN, Private, Self-pay
      insurance_type: this.mapProviderToInsuranceType(persistence.insurance?.provider),
      insurance_number: persistence.insurance?.policyNumber,
      insurance_coverage_level: persistence.insurance?.coveragePercentage,
      insurance_issued_by: persistence.insurance?.provider,
      insurance_data: persistence.insurance
        ? JSON.stringify(persistence.insurance)
        : undefined,
      issued_by: "00000000-0000-0000-0000-000000000000", // System-generated invoice
      issued_at: issuedAtIso,
      due_date: dueDateIso,
      paid_at: persistence.paidAt?.toISOString(),
      created_at: issuedAtIso,
      updated_at: persistence.updatedAt.toISOString(),
      finalized_at: persistence.finalizedAt?.toISOString(),
      version: 1,
      contains_phi: true,
    };

    // Billing items records
    const itemRecords: Partial<BillingItemRecord>[] = persistence.items.map(
      (item: any) => ({
        invoice_id: persistence.id,
        item_id: item.id,
        description: item.description,
        vietnamese_description: item.description,
        quantity: item.quantity,
        unit_price_amount: item.unitPrice,
        unit_price_currency: item.currency || persistence.currency,
        total_price_amount: item.totalPrice,
        total_price_currency: item.currency || persistence.currency,
        taxable: true,
        insurance_coverable: true,
        category: "consultation",
      }),
    );

    // Payment records - each payment record gets its own UUID
    // Note: payment_id is the Payment entity ID, id is the database record ID
    // processed_by = patientId (in prepaid model, patient processes their own payment)
    const paymentRecords: Partial<PaymentRecordData>[] =
      persistence.payments.map((p: any) => ({
        // id field will be auto-generated by database (gen_random_uuid())
        // We don't set it here to avoid conflicts
        invoice_id: persistence.id,
        payment_id: p.id,
        amount: p.amount,
        currency: p.currency || persistence.currency,
        method: p.method,
        status: p.status,
        transaction_id: p.transactionId,
        processed_at: p.paidAt
          ? new Date(p.paidAt).toISOString()
          : p.refundedAt
            ? new Date(p.refundedAt).toISOString()
            : new Date().toISOString(),
        processed_by: persistence.patientId, // Patient processes their own payment (prepaid model)
        refunded_at: p.refundedAt
          ? new Date(p.refundedAt).toISOString()
          : undefined,
        refund_reason: p.refundReason,
        refunded_by: p.refundedBy,
        gateway_refund_id: p.gatewayRefundId,
        created_at: new Date().toISOString(),
        // VNPAY-specific fields for refund support
        vnpay_txn_ref: p.vnpayData?.vnpTxnRef,
        vnpay_transaction_no: p.vnpayData?.vnpTransactionNo,
        vnpay_pay_date: p.vnpayData?.vnpPayDate
          ? new Date(
            // Parse VNPAY date format: yyyyMMddHHmmss
            p.vnpayData.vnpPayDate.replace(
              /(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/,
              "$1-$2-$3T$4:$5:$6Z",
            ),
          ).toISOString()
          : undefined,
      }));

    return {
      invoice: invoiceRecord,
      items: itemRecords,
      payments: paymentRecords,
    };
  }

  private static normalizeMetadata(
    record: InvoiceRecord,
    itemRecords: BillingItemRecord[],
    paymentRecords: PaymentRecordData[],
  ): Record<string, any> {
    const metadata = { ...(record.metadata || {}) };
    const invoiceType = metadata.invoiceType;

    if (!invoiceType) {
      metadata.invoiceType = this.detectInvoiceType(
        record,
        itemRecords,
        paymentRecords,
        metadata,
      );
    }

    if (!metadata.serviceName) {
      metadata.serviceName = this.getDefaultServiceName(metadata.invoiceType);
    }

    if (!metadata.serviceDescription) {
      metadata.serviceDescription =
        itemRecords[0]?.description ||
        metadata.description ||
        metadata.serviceName;
    }

    return metadata;
  }

  private static detectInvoiceType(
    record: InvoiceRecord,
    itemRecords: BillingItemRecord[],
    paymentRecords: PaymentRecordData[],
    metadata: Record<string, any>,
  ): string {
    if (metadata.walletTopUp || metadata.wallet_top_up) {
      return "wallet_topup";
    }

    if (
      record.status?.toLowerCase() === "refunded" ||
      paymentRecords.some(
        (p) =>
          p.method?.toLowerCase() === "refund" ||
          p.status?.toLowerCase() === "refund_completed",
      )
    ) {
      return "refund";
    }

    if (record.appointment_id) {
      return "appointment_booking";
    }

    const lowerDescriptions = itemRecords
      .map((item) => item.description?.toLowerCase() || "")
      .join(" ");

    if (lowerDescriptions.includes("late cancellation")) {
      return "late_cancellation_fee";
    }

    if (lowerDescriptions.includes("no-show")) {
      return "no_show_fee";
    }

    if (
      lowerDescriptions.includes("đổi lịch") ||
      lowerDescriptions.includes("reschedule")
    ) {
      return "reschedule_fee";
    }

    if (lowerDescriptions.includes("thuốc")) {
      return "prescription";
    }

    if (
      lowerDescriptions.includes("xét nghiệm") ||
      lowerDescriptions.includes("lab")
    ) {
      return "lab_test";
    }

    return "medical_service";
  }

  private static getDefaultServiceName(invoiceType?: string): string {
    const mapping: Record<string, string> = {
      appointment_booking: "Đặt lịch khám",
      wallet_topup: "Nạp ví tài khoản",
      late_cancellation_fee: "Phí hủy lịch muộn",
      reschedule_fee: "Phí đổi lịch hẹn",
      no_show_fee: "Phí bỏ khám",
      prescription: "Thanh toán đơn thuốc",
      lab_test: "Thanh toán xét nghiệm",
      treatment_plan: "Thanh toán kế hoạch điều trị",
      medical_record: "Thanh toán hồ sơ y tế",
      refund: "Hoàn tiền",
      medical_service: "Dịch vụ y tế",
    };
    if (invoiceType && mapping[invoiceType]) {
      return mapping[invoiceType];
    }
    return "Dịch vụ y tế";
  }

  /**
   * Map insurance provider name to valid insurance_type enum
   * Valid enum values: BHYT, BHTN, Private, Self-pay
   */
  private static mapProviderToInsuranceType(provider?: string): string | undefined {
    if (!provider) {
      return undefined;
    }

    const normalizedProvider = provider.toUpperCase().trim();

    // Direct match for known enum values
    if (normalizedProvider === 'BHYT' || normalizedProvider.includes('BHYT') ||
      normalizedProvider.includes('BẢO HIỂM Y TẾ') || normalizedProvider.includes('BAO HIEM Y TE')) {
      return 'BHYT';
    }

    if (normalizedProvider === 'BHTN' || normalizedProvider.includes('BHTN') ||
      normalizedProvider.includes('TAI NẠN') || normalizedProvider.includes('TAI NAN')) {
      return 'BHTN';
    }

    if (normalizedProvider.includes('PRIVATE') || normalizedProvider.includes('TƯ NHÂN') ||
      normalizedProvider.includes('TU NHAN')) {
      return 'Private';
    }

    if (normalizedProvider.includes('SELF') || normalizedProvider.includes('TỰ') ||
      normalizedProvider.includes('TU TRA')) {
      return 'Self-pay';
    }

    // Default fallback - if provider exists but doesn't match, assume it's private insurance
    return 'Private';
  }
}
