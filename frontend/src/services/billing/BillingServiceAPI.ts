import { apiClient } from "../api/client";

export interface Invoice {
  id: string;
  patientName: string;
  patientId: string;
  doctorName: string;
  services: string[];
  totalAmount: number;
  paidAmount: number;
  status: "paid" | "pending" | "overdue" | "partial";
  paymentMethod?: "cash" | "card" | "transfer" | "insurance";
  createdDate: string;
  dueDate: string;
  paidDate?: string;
  notes?: string;
}

export interface InvoiceResponse {
  success: boolean;
  data?: Invoice | Invoice[];
  message?: string;
  error?: string;
}

export class BillingServiceAPI {
  private static instance: BillingServiceAPI;
  // Fixed: Changed from provider-staff-service to billing-service
  private baseUrl: string = "/billing-service/api/v1/billing";

  private constructor() {}

  public static getInstance(): BillingServiceAPI {
    if (!BillingServiceAPI.instance) {
      BillingServiceAPI.instance = new BillingServiceAPI();
    }
    return BillingServiceAPI.instance;
  }

  async getAllInvoices(params?: {
    status?: string;
    patientId?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<InvoiceResponse> {
    let url = this.baseUrl;
    if (params) {
      const queryParams = new URLSearchParams();
      if (params.status) queryParams.append("status", params.status);
      if (params.patientId) queryParams.append("patientId", params.patientId);
      if (params.startDate) queryParams.append("startDate", params.startDate);
      if (params.endDate) queryParams.append("endDate", params.endDate);
      const queryString = queryParams.toString();
      if (queryString) url += `?${queryString}`;
    }
    const response = await apiClient.get<Invoice[]>(url);
    return {
      success: response.success,
      data: response.data,
      message: response.message,
      error: response.error,
    };
  }

  async getInvoiceById(id: string): Promise<InvoiceResponse> {
    const response = await apiClient.get<Invoice>(`${this.baseUrl}/${id}`);
    return {
      success: response.success,
      data: response.data,
      message: response.message,
      error: response.error,
    };
  }

  async createInvoice(
    invoice: Omit<Invoice, "id" | "createdDate">
  ): Promise<InvoiceResponse> {
    const response = await apiClient.post<Invoice>(this.baseUrl, invoice);
    return {
      success: response.success,
      data: response.data,
      message: response.message,
      error: response.error,
    };
  }

  async updateInvoice(
    id: string,
    invoice: Partial<Invoice>
  ): Promise<InvoiceResponse> {
    const response = await apiClient.put<Invoice>(
      `${this.baseUrl}/${id}`,
      invoice
    );
    return {
      success: response.success,
      data: response.data,
      message: response.message,
      error: response.error,
    };
  }

  async deleteInvoice(id: string): Promise<InvoiceResponse> {
    const response = await apiClient.delete<Invoice>(`${this.baseUrl}/${id}`);
    return {
      success: response.success,
      message: response.message,
      error: response.error,
    };
  }

  async recordPayment(
    invoiceId: string,
    paymentData: {
      paymentMethod:
        | "CASH"
        | "CARD"
        | "BANK_TRANSFER"
        | "PAYOS"
        | "INSURANCE_DIRECT";
      amount: number;
      currency?: string;
      paymentDetails?: object;
      notes?: string;
    }
  ): Promise<InvoiceResponse> {
    // Fixed: Backend uses /payments endpoint with invoiceId in body
    const response = await apiClient.post<Invoice>(`${this.baseUrl}/payments`, {
      invoiceId,
      ...paymentData,
    });
    return {
      success: response.success,
      data: response.data,
      message: response.message,
      error: response.error,
    };
  }

  // Invoice Operations
  async cancelInvoice(
    invoiceId: string,
    reason?: string
  ): Promise<InvoiceResponse> {
    const response = await apiClient.post<Invoice>(
      `${this.baseUrl}/invoices/${invoiceId}/cancel`,
      { reason }
    );
    return {
      success: response.success,
      data: response.data,
      message: response.message,
      error: response.error,
    };
  }

  async voidInvoice(
    invoiceId: string,
    reason: string
  ): Promise<InvoiceResponse> {
    const response = await apiClient.post<Invoice>(
      `${this.baseUrl}/invoices/${invoiceId}/void`,
      { reason }
    );
    return {
      success: response.success,
      data: response.data,
      message: response.message,
      error: response.error,
    };
  }

  // Receipt
  async generateReceipt(
    invoiceId: string,
    language: "vi" | "en" = "vi"
  ): Promise<{
    success: boolean;
    data?: { receiptUrl: string; receiptId: string };
    message?: string;
    error?: string;
  }> {
    const response = await apiClient.get<{
      receiptUrl: string;
      receiptId: string;
    }>(`${this.baseUrl}/invoices/${invoiceId}/receipt?language=${language}`);
    return {
      success: response.success,
      data: response.data,
      message: response.message,
      error: response.error,
    };
  }

  // Payment History
  async getInvoicePayments(invoiceId: string): Promise<{
    success: boolean;
    data?: Array<{
      paymentId: string;
      amount: number;
      paymentMethod: string;
      status: string;
      processedAt: string;
      transactionId?: string;
    }>;
    message?: string;
    error?: string;
  }> {
    const response = await apiClient.get<
      Array<{
        paymentId: string;
        amount: number;
        paymentMethod: string;
        status: string;
        processedAt: string;
        transactionId?: string;
      }>
    >(`${this.baseUrl}/invoices/${invoiceId}/payments`);
    return {
      success: response.success,
      data: response.data,
      message: response.message,
      error: response.error,
    };
  }

  async getPaymentById(paymentId: string): Promise<{
    success: boolean;
    data?: {
      paymentId: string;
      invoiceId: string;
      amount: number;
      paymentMethod: string;
      status: string;
      processedAt: string;
      transactionId?: string;
    };
    message?: string;
    error?: string;
  }> {
    const response = await apiClient.get<{
      paymentId: string;
      invoiceId: string;
      amount: number;
      paymentMethod: string;
      status: string;
      processedAt: string;
      transactionId?: string;
    }>(`${this.baseUrl}/payments/${paymentId}`);
    return {
      success: response.success,
      data: response.data,
      message: response.message,
      error: response.error,
    };
  }

  async getAllPayments(params?: {
    invoiceId?: string;
    patientId?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<{
    success: boolean;
    data?: Array<{
      paymentId: string;
      invoiceId: string;
      amount: number;
      paymentMethod: string;
      status: string;
      processedAt: string;
    }>;
    message?: string;
    error?: string;
  }> {
    let url = `${this.baseUrl}/payments`;
    if (params) {
      const queryParams = new URLSearchParams();
      if (params.invoiceId) queryParams.append("invoiceId", params.invoiceId);
      if (params.patientId) queryParams.append("patientId", params.patientId);
      if (params.status) queryParams.append("status", params.status);
      if (params.startDate) queryParams.append("startDate", params.startDate);
      if (params.endDate) queryParams.append("endDate", params.endDate);
      const queryString = queryParams.toString();
      if (queryString) url += `?${queryString}`;
    }
    const response = await apiClient.get<
      Array<{
        paymentId: string;
        invoiceId: string;
        amount: number;
        paymentMethod: string;
        status: string;
        processedAt: string;
      }>
    >(url);
    return {
      success: response.success,
      data: response.data,
      message: response.message,
      error: response.error,
    };
  }

  // Refund
  async refundInvoice(
    invoiceId: string,
    refundData: {
      amount: number;
      reason: string;
      refundMethod?: "CASH" | "CARD" | "BANK_TRANSFER";
      notes?: string;
    }
  ): Promise<{
    success: boolean;
    data?: { refundId: string; refundAmount: number; status: string };
    message?: string;
    error?: string;
  }> {
    const response = await apiClient.post<{
      refundId: string;
      refundAmount: number;
      status: string;
    }>(`${this.baseUrl}/invoices/${invoiceId}/refund`, refundData);
    return {
      success: response.success,
      data: response.data,
      message: response.message,
      error: response.error,
    };
  }
}

export const billingServiceAPI = BillingServiceAPI.getInstance();
