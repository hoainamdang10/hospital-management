import { Invoice } from "../../domain/aggregates/Invoice";

export interface PatientInvoiceResponse {
  invoiceId: string;
  invoiceNumber?: string;
  invoiceCode?: string;
  patientName?: string;
  appointmentId?: string;
  appointmentCode?: string;
  doctorName?: string;
  doctorDepartment?: string;
  cancellationReason?: string;
  metadata?: Record<string, any>;
  items: Array<{
    id: string;
    description: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }>;
  subtotal: number;
  tax: number;
  insuranceCoverage: number;
  totalAmount: number;
  patientPaymentAmount: number;
  outstandingAmount: number;
  paidAmount: number;
  status: string;
  createdAt: Date;
  issuedAt: Date;
  issueDate: Date;
  dueDate: Date;
  payments: Array<{
    id: string;
    amount: number;
    currency: string;
    method: string;
    status: string;
    transactionId?: string;
    paidAt?: Date;
    refundedAt?: Date;
    refundReason?: string;
    refundedBy?: string;
    gatewayRefundId?: string;
  }>;
}

interface PaymentStats {
  paid: number;
  refunded: number;
}

function computePaymentStats(invoice: Invoice): PaymentStats {
  const payments = Array.isArray(invoice.payments) ? invoice.payments : [];
  return payments.reduce(
    (acc, payment) => {
      const amount = payment?.amount?.amount ?? 0;
      if (payment.method === "refund") {
        acc.refunded += Math.abs(amount);
      } else if (payment.status === "completed") {
        acc.paid += amount;
      }
      return acc;
    },
    { paid: 0, refunded: 0 } as PaymentStats,
  );
}

export function mapInvoiceForPatientResponse(
  invoice: Invoice,
): PatientInvoiceResponse {
  const createdAt = invoice.createdAt;
  const dueDate = invoice.dueDate;
  const { paid: totalPaid, refunded: totalRefunded } =
    computePaymentStats(invoice);
  const hasRefund = totalRefunded > 0;

  return {
    invoiceId: invoice.id,
    invoiceNumber: invoice.invoiceNumber,
    invoiceCode: invoice.invoiceNumber,
    patientName: invoice.metadata?.patientName,
    appointmentId:
      invoice.getAppointmentId?.() ?? invoice.metadata?.appointmentId,
    appointmentCode:
      invoice.metadata?.appointmentCode ??
      invoice.metadata?.appointmentId ??
      invoice.getAppointmentId?.(),
    doctorName: invoice.metadata?.doctorName,
    doctorDepartment: invoice.metadata?.doctorDepartment,
    cancellationReason: invoice.metadata?.cancellationReason,
    metadata: invoice.metadata,
    items: (invoice.items || []).map((item: any) => ({
      id: item.id,
      description: item.description,
      quantity: item.quantity,
      unitPrice: item.unitPrice.amount,
      totalPrice: item.totalPrice.amount,
    })),
    subtotal: invoice.subtotal.amount,
    tax: invoice.tax.amount,
    insuranceCoverage: invoice.insuranceCoverage?.amount ?? 0,
    totalAmount: invoice.totalAmount.amount,
    patientPaymentAmount: Math.max(
      0,
      invoice.totalAmount.amount - (invoice.insuranceCoverage?.amount ?? 0),
    ),
    outstandingAmount: Math.max(
      0,
      invoice.totalAmount.amount -
        (invoice.insuranceCoverage?.amount ?? 0) -
        totalPaid,
    ),
    paidAmount: totalPaid,
    status: hasRefund ? "refunded" : invoice.status.value,
    createdAt,
    issuedAt: createdAt,
    issueDate: createdAt,
    dueDate,
    payments: invoice.payments.map((p) => ({
      id: p.id,
      amount: p.amount.amount,
      currency: p.amount.currency,
      method: p.method,
      status: p.status,
      transactionId: p.transactionId,
      paidAt: p.paidAt,
      refundedAt: p.refundedAt,
      refundReason: p.refundReason,
      refundedBy: p.refundedBy,
      gatewayRefundId: p.gatewayRefundId,
    })),
  };
}
