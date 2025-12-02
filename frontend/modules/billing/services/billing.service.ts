/**
 * Billing Service - Frontend API Client
 * Handles all billing-related API calls
 */

import apiClient from '@/lib/api/axios';

export interface Invoice {
  id: string;
  patientId: string;
  appointmentId?: string;
  appointmentCode?: string;
  doctorName?: string;
  doctorDepartment?: string;
  invoiceNumber?: string;
  invoiceCode?: string;
  items: InvoiceItem[];
  subtotal: number;
  tax: number;
  insuranceCoverage: number;
  totalAmount: number;
  outstandingAmount: number;
  paidAmount?: number;
  currency: string;
  status: 'draft' | 'pending' | 'partially_paid' | 'paid' | 'cancelled' | 'refunded' | 'overdue';
  insurance?: {
    provider: string;
    policyNumber: string;
    coveragePercentage: number;
  };
  payments: Payment[];
  createdAt: string;
  updatedAt: string;
  issuedAt?: string;
  dueDate?: string;
  issueDate?: string;
  finalizedAt?: string;
  cancelledAt?: string;
  cancellationReason?: string;
  metadata?: Record<string, any>;
}

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface Payment {
  id: string;
  amount: number;
  method: string;
  transactionId?: string;
  status: string;
  processedAt: string;
  paidAt?: string;
  refundedAt?: string;
  refundReason?: string;
  refundedBy?: string;
  gatewayRefundId?: string;
}

export interface BillingSummary {
  totalAmount: number;
  paidAmount: number;
  outstandingAmount: number;
  totalPaid?: number;
  totalOutstanding?: number;
  invoiceCount: number;
  paidInvoiceCount: number;
  pendingInvoiceCount: number;
}

export interface PayOSPaymentLink {
  checkoutUrl: string;
  qrCode: string;
  paymentLinkId: string;
  orderCode: number;
  amount: number;
}

export interface WalletPaymentResult {
  success: boolean;
  message: string;
  invoiceId?: string;
  paymentId?: string;
  errors?: string[];
}

class BillingService {
  private baseUrl = '/v1/billing/invoices';

  /**
   * Get patient invoices
   */
  async getPatientInvoices(patientId: string): Promise<Invoice[]> {
    const response = await apiClient.get(`${this.baseUrl}/patient/${patientId}`);
    const data = response.data;

    const rawInvoices = Array.isArray(data)
      ? data
      : Array.isArray(data?.invoices)
        ? data.invoices
        : Array.isArray(data?.data?.invoices)
          ? data.data.invoices
          : [];

    return rawInvoices.map((invoice: any) => this.normalizeInvoice(invoice));
  }

  /**
   * Get patient billing summary
   */
  async getPatientBillingSummary(patientId: string): Promise<BillingSummary> {
    const response = await apiClient.get(`${this.baseUrl}/patient/${patientId}/summary`);
    return response.data;
  }

  /**
   * Get invoice by ID
   */
  async getInvoiceById(invoiceId: string): Promise<Invoice> {
    const response = await apiClient.get(`${this.baseUrl}/${invoiceId}`);
    return this.normalizeInvoice(response.data);
  }

  /**
   * Create PayOS payment link
   */
  async createPayOSPaymentLink(
    invoiceId: string,
    buyerInfo: {
      buyerName?: string;
      buyerEmail?: string;
      buyerPhone?: string;
    }
  ): Promise<PayOSPaymentLink> {
    const response = await apiClient.post(
      `${this.baseUrl}/${invoiceId}/payos/payment-link`,
      buyerInfo
    );
    return response.data;
  }

  /**
   * Process manual payment (at counter)
   */
  async processPayment(
    invoiceId: string,
    paymentData: {
      amount: number;
      method: 'cash' | 'card' | 'transfer';
      transactionId?: string;
    }
  ): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.post(`${this.baseUrl}/${invoiceId}/payments`, paymentData);
    return response.data;
  }

  /**
   * Pay invoice with wallet balance
   */
  async payInvoiceWithWallet(
    invoiceId: string,
    payload?: { description?: string }
  ): Promise<WalletPaymentResult> {
    const response = await apiClient.post(
      `${this.baseUrl}/${invoiceId}/payments/wallet`,
      payload ?? {}
    );

    const data = response.data?.data ?? response.data;
    return {
      success: Boolean(data?.success ?? data?.invoiceId),
      message: data?.message || 'Thanh toán ví thành công',
      invoiceId: data?.invoiceId ?? data?.data?.invoiceId ?? data?.invoice?.id,
      paymentId: data?.paymentId ?? data?.data?.paymentId,
      errors: data?.errors,
    };
  }

  /**
   * Download invoice PDF
   */
  async downloadInvoice(invoiceId: string): Promise<Blob> {
    const response = await apiClient.get(`${this.baseUrl}/${invoiceId}/download`, {
      responseType: 'blob',
    });
    return response.data;
  }

  /**
   * Search invoices
   */
  async searchInvoices(criteria: {
    patientId?: string;
    status?: string;
    fromDate?: string;
    toDate?: string;
  }): Promise<Invoice[]> {
    const response = await apiClient.get(`${this.baseUrl}/search`, {
      params: criteria,
    });
    return response.data;
  }

  private normalizeInvoice(invoice: any): Invoice {
    const toNumber = (value: any, fallback = 0): number => {
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : fallback;
    };

    const rawStatus =
      invoice?.status || invoice?.invoiceStatus || invoice?.paymentStatus || 'pending';
    const normalizedStatus = (() => {
      const statusValue = (rawStatus as string).toString().toLowerCase();
      if (
        statusValue === 'paid' ||
        statusValue === 'pending' ||
        statusValue === 'partially_paid' ||
        statusValue === 'cancelled' ||
        statusValue === 'refunded' ||
        statusValue === 'draft' ||
        statusValue === 'overdue'
      ) {
        return statusValue;
      }
      return 'pending';
    })() as Invoice['status'];

    const normalizedId =
      invoice?.id ||
      invoice?.invoiceId ||
      invoice?.invoice_id ||
      invoice?.invoiceNumber ||
      invoice?.invoice_number ||
      `invoice-${Date.now()}`;

    const totalAmount = toNumber(invoice?.totalAmount ?? invoice?.total_amount);
    let paidAmount = toNumber(
      invoice?.paidAmount ?? invoice?.paid_amount ?? invoice?.patient_payment_amount
    );
    const outstandingAmount = toNumber(
      invoice?.outstandingAmount ??
        invoice?.outstanding_amount ??
        Math.max(0, totalAmount - paidAmount)
    );
    // Nếu paidAmount không có hoặc đang chứa outstanding, tính paid dựa trên total - outstanding
    if (!paidAmount && totalAmount) {
      paidAmount = Math.max(0, totalAmount - outstandingAmount);
    }

    return {
      ...invoice,
      id: normalizedId.toString(),
      metadata: invoice?.metadata || invoice?.meta || {},
      invoiceNumber:
        invoice?.invoiceNumber ||
        invoice?.invoice_number ||
        invoice?.invoiceId ||
        invoice?.invoice_id,
      invoiceCode: invoice?.vietnamese_invoice_number,
      appointmentId: invoice?.appointmentId ?? invoice?.appointment_id,
      appointmentCode:
        invoice?.appointmentCode ??
        invoice?.appointment_code ??
        invoice?.appointmentId ??
        invoice?.appointment_id,
      doctorName:
        invoice?.doctorName ??
        invoice?.doctor_name ??
        invoice?.providerName ??
        invoice?.provider_name,
      doctorDepartment:
        invoice?.doctorDepartment ??
        invoice?.doctor_department ??
        invoice?.departmentName ??
        invoice?.department_name,
      subtotal: toNumber(invoice?.subtotal ?? invoice?.subtotalAmount ?? invoice?.subtotal_amount),
      tax: toNumber(invoice?.tax ?? invoice?.taxAmount ?? invoice?.tax_amount),
      insuranceCoverage: toNumber(
        invoice?.insuranceCoverage ??
          invoice?.insurance_coverage_amount ??
          invoice?.insuranceCoverageAmount
      ),
      totalAmount,
      outstandingAmount,
      paidAmount,
      currency: invoice?.currency || invoice?.total_currency || 'VND',
      status: normalizedStatus,
      payments: invoice?.payments || invoice?.paymentHistory || [],
      createdAt: invoice?.createdAt ?? invoice?.created_at ?? new Date().toISOString(),
      updatedAt: invoice?.updatedAt ?? invoice?.updated_at ?? new Date().toISOString(),
      issuedAt:
        invoice?.issueDate ??
        invoice?.issue_date ??
        invoice?.issuedAt ??
        invoice?.issued_at ??
        invoice?.createdAt ??
        invoice?.created_at,
      issueDate:
        invoice?.issueDate ??
        invoice?.issue_date ??
        invoice?.issuedAt ??
        invoice?.issued_at ??
        invoice?.createdAt ??
        invoice?.created_at,
      dueDate: invoice?.dueDate ?? invoice?.due_date ?? invoice?.final_due_date,
      finalizedAt: invoice?.finalizedAt ?? invoice?.finalized_at,
      cancelledAt: invoice?.cancelledAt ?? invoice?.cancelled_at,
      cancellationReason: invoice?.cancellationReason ?? invoice?.cancellation_reason,
    };
  }
}

export const billingService = new BillingService();
