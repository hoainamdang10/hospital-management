import { apiClient } from './client';
import { ApiResponse } from '../types';

// PayOS Payment types
export interface PayOSPaymentRequest {
  appointmentId: string;
  amount: number;
  description: string;
  serviceName: string;
  patientInfo: {
    doctorName: string;
    department: string;
    appointmentDate: string;
    timeSlot: string;
  };
  returnUrl?: string;
  cancelUrl?: string;
}

export interface PayOSPaymentResponse {
  orderCode: string;
  checkoutUrl: string;
  qrCode: string;
  amount: number;
  description: string;
  status: 'PENDING' | 'PAID' | 'CANCELLED' | 'EXPIRED';
  createdAt: string;
  expiredAt: string;
}

export interface PayOSWebhookData {
  orderCode: string;
  amount: number;
  description: string;
  accountNumber: string;
  reference: string;
  transactionDateTime: string;
  currency: string;
  paymentLinkId: string;
  code: string;
  desc: string;
  counterAccountBankId?: string;
  counterAccountBankName?: string;
  counterAccountName?: string;
  counterAccountNumber?: string;
  virtualAccountName?: string;
  virtualAccountNumber?: string;
}

export interface PaymentVerificationResponse {
  id: string;
  orderCode: string;
  amount: number;
  status: 'success' | 'failed' | 'pending' | 'cancelled';
  paymentMethod: 'payos' | 'cash';
  transactionId?: string;
  createdAt: string;
  appointmentId: string;
  description: string;
  failureReason?: string;
  payosData?: PayOSWebhookData;
}

export interface CashPaymentRequest {
  appointmentId: string;
  amount: number;
  paymentMethod: 'cash';
  notes?: string;
}

export interface CashPaymentResponse {
  orderCode: string;
  amount: number;
  status: 'PENDING';
  createdAt: string;
  appointmentId: string;
  description: string;
  cashierInstructions: string;
}

export interface PaymentHistoryItem {
  id: string;
  orderCode: string;
  appointmentId: string;
  amount: number;
  status: 'success' | 'failed' | 'pending' | 'cancelled';
  paymentMethod: 'payos' | 'cash';
  description: string;
  createdAt: string;
  transactionId?: string;
  doctorName?: string;
  department?: string;
  appointmentDate?: string;
}

export interface PaymentReceiptData {
  id: string;
  orderCode: string;
  appointmentId: string;
  patientName: string;
  patientId: string;
  doctorName: string;
  department: string;
  appointmentDate: string;
  timeSlot: string;
  amount: number;
  paymentMethod: 'payos' | 'cash';
  status: 'success' | 'pending';
  transactionId?: string;
  paidAt: string;
  hospitalInfo: {
    name: string;
    address: string;
    phone: string;
    email: string;
  };
}

// PayOS API
export const paymentsApi = {
  // PayOS Payments
  createPayOSPayment: async (data: PayOSPaymentRequest): Promise<ApiResponse<PayOSPaymentResponse>> => {
    return apiClient.post<PayOSPaymentResponse>('/payments/payos/create', data);
  },

  // Cash Payments
  createCashPayment: async (data: CashPaymentRequest): Promise<ApiResponse<CashPaymentResponse>> => {
    return apiClient.post<CashPaymentResponse>('/payments/cash/create', data);
  },

  // Payment Verification
  verifyPayment: async (orderCode: string): Promise<ApiResponse<PaymentVerificationResponse>> => {
    return apiClient.get<PaymentVerificationResponse>(`/payments/verify?orderCode=${orderCode}`);
  },

  // Payment Status Check
  checkPaymentStatus: async (orderCode: string): Promise<ApiResponse<PaymentVerificationResponse>> => {
    return apiClient.get<PaymentVerificationResponse>(`/payments/status/${orderCode}`);
  },

  // Payment History
  getPaymentHistory: async (patientId: string, params?: { 
    page?: number; 
    limit?: number; 
    status?: string;
    method?: string;
  }): Promise<ApiResponse<PaymentHistoryItem[]>> => {
    return apiClient.get<PaymentHistoryItem[]>(`/payments/history/${patientId}`, params);
  },

  // Payment Receipt
  getPaymentReceipt: async (paymentId: string): Promise<ApiResponse<PaymentReceiptData>> => {
    return apiClient.get<PaymentReceiptData>(`/payments/receipt/${paymentId}`);
  },

  downloadPaymentReceipt: async (paymentId: string): Promise<Blob> => {
    const response = await fetch(`${apiClient.baseUrl}/payments/receipt/${paymentId}/download`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to download receipt');
    }
    
    return response.blob();
  },

  // PayOS Webhook (for backend use)
  handlePayOSWebhook: async (webhookData: PayOSWebhookData): Promise<ApiResponse<PaymentVerificationResponse>> => {
    return apiClient.post<PaymentVerificationResponse>('/payments/payos/webhook', webhookData);
  },

  // Cancel Payment
  cancelPayment: async (orderCode: string): Promise<ApiResponse<{ success: boolean; message: string }>> => {
    return apiClient.post<{ success: boolean; message: string }>(`/payments/cancel/${orderCode}`, {});
  },

  // Refund Payment (for admin use)
  refundPayment: async (orderCode: string, reason?: string): Promise<ApiResponse<{ success: boolean; message: string }>> => {
    return apiClient.post<{ success: boolean; message: string }>(`/payments/refund/${orderCode}`, { reason });
  },

  // Payment Analytics (for admin use)
  getPaymentAnalytics: async (params?: {
    startDate?: string;
    endDate?: string;
    method?: string;
  }): Promise<ApiResponse<{
    totalRevenue: number;
    totalTransactions: number;
    successRate: number;
    methodBreakdown: {
      payos: { count: number; amount: number };
      cash: { count: number; amount: number };
    };
    dailyRevenue: { date: string; amount: number }[];
  }>> => {
    return apiClient.get('/payments/analytics', params);
  }
};

// PayOS Configuration
export const payosConfig = {
  // These should be set in environment variables
  clientId: process.env.NEXT_PUBLIC_PAYOS_CLIENT_ID,
  apiKey: process.env.NEXT_PUBLIC_PAYOS_API_KEY,
  checksumKey: process.env.NEXT_PUBLIC_PAYOS_CHECKSUM_KEY,
  
  // URLs
  baseUrl: 'https://api-merchant.payos.vn',
  sandboxUrl: 'https://api-merchant-sandbox.payos.vn',
  
  // Payment settings
  currency: 'VND',
  locale: 'vi',
  
  // Default return URLs (can be overridden)
  defaultReturnUrl: `${process.env.NEXT_PUBLIC_APP_URL}/patient/payment/result`,
  defaultCancelUrl: `${process.env.NEXT_PUBLIC_APP_URL}/patient/payment/checkout`,
};

// Utility functions
export const paymentUtils = {
  formatCurrency: (amount: number): string => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  },

  formatDateTime: (dateString: string): string => {
    return new Intl.DateTimeFormat('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }).format(new Date(dateString));
  },

  generateOrderCode: (): string => {
    // Generate a unique order code
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    return `HM${timestamp}${random}`;
  },

  validateAmount: (amount: number): boolean => {
    // PayOS minimum amount is 1,000 VND
    return amount >= 1000 && amount <= 500000000; // Max 500M VND
  },

  getPaymentStatusColor: (status: string): string => {
    switch (status) {
      case 'success':
        return 'text-green-600';
      case 'failed':
        return 'text-red-600';
      case 'pending':
        return 'text-yellow-600';
      case 'cancelled':
        return 'text-gray-600';
      default:
        return 'text-gray-400';
    }
  },

  getPaymentStatusBadgeVariant: (status: string): 'default' | 'secondary' | 'destructive' | 'outline' => {
    switch (status) {
      case 'success':
        return 'default';
      case 'failed':
        return 'destructive';
      case 'pending':
        return 'secondary';
      case 'cancelled':
        return 'outline';
      default:
        return 'outline';
    }
  }
};

export default paymentsApi;
