/**
 * Billing Service - Frontend API Client
 * Handles all billing-related API calls
 */

import { apiClient } from '@/lib/api-client';

export interface Invoice {
  id: string;
  patientId: string;
  invoiceNumber?: string;
  items: InvoiceItem[];
  subtotal: number;
  tax: number;
  insuranceCoverage: number;
  totalAmount: number;
  outstandingAmount: number;
  currency: string;
  status: 'draft' | 'pending' | 'partially_paid' | 'paid' | 'cancelled' | 'refunded';
  insurance?: {
    provider: string;
    policyNumber: string;
    coveragePercentage: number;
  };
  payments: Payment[];
  createdAt: string;
  updatedAt: string;
  finalizedAt?: string;
  cancelledAt?: string;
  cancellationReason?: string;
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
}

export interface BillingSummary {
  totalAmount: number;
  paidAmount: number;
  outstandingAmount: number;
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

class BillingService {
  private baseUrl = '/api/v1/billing';

  /**
   * Get patient invoices
   */
  async getPatientInvoices(patientId: string): Promise<Invoice[]> {
    const response = await apiClient.get(`${this.baseUrl}/patient/${patientId}`);
    return response.data;
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
    return response.data;
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
    const response = await apiClient.post(
      `${this.baseUrl}/${invoiceId}/payments`,
      paymentData
    );
    return response.data;
  }

  /**
   * Download invoice PDF
   */
  async downloadInvoice(invoiceId: string): Promise<Blob> {
    const response = await apiClient.get(`${this.baseUrl}/${invoiceId}/download`, {
      responseType: 'blob'
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
      params: criteria
    });
    return response.data;
  }
}

export const billingService = new BillingService();
