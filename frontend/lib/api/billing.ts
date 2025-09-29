import { apiClient } from './client';
import { ApiResponse } from '../types';

// Billing types
export interface Bill {
  id: string;
  patient_id: string;
  appointment_id?: string;
  bill_date: string;
  due_date: string;
  subtotal: number;
  tax_amount: number;
  discount_amount: number;
  insurance_coverage: number;
  total_amount: number;
  amount_paid: number;
  balance_due: number;
  status: 'pending' | 'paid' | 'overdue' | 'cancelled' | 'refunded';
  notes?: string;
  created_at: string;
  updated_at: string;
  items?: BillItem[];
  payments?: Payment[];
}

export interface BillItem {
  id: string;
  bill_id: string;
  service_type: 'consultation' | 'procedure' | 'medication' | 'lab_test' | 'room_charge' | 'other';
  description: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  created_at: string;
}

export interface Payment {
  id: string;
  bill_id: string;
  payment_date: string;
  payment_method: 'cash' | 'card' | 'bank_transfer' | 'insurance' | 'online';
  amount: number;
  transaction_id?: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  notes?: string;
  created_at: string;
}

export interface Insurance {
  id: string;
  patient_id: string;
  provider_name: string;
  policy_number: string;
  coverage_percentage: number;
  max_coverage_amount?: number;
  deductible_amount?: number;
  expiry_date?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateBillRequest {
  patient_id: string;
  appointment_id?: string;
  due_date: string;
  tax_rate?: number;
  discount_amount?: number;
  insurance_coverage?: number;
  notes?: string;
  items: {
    service_type: 'consultation' | 'procedure' | 'medication' | 'lab_test' | 'room_charge' | 'other';
    description: string;
    quantity: number;
    unit_price: number;
  }[];
}

export interface UpdateBillRequest {
  status?: 'pending' | 'paid' | 'overdue' | 'cancelled' | 'refunded';
  due_date?: string;
  discount_amount?: number;
  insurance_coverage?: number;
  notes?: string;
}

export interface CreatePaymentRequest {
  bill_id: string;
  payment_method: 'cash' | 'card' | 'bank_transfer' | 'insurance' | 'online';
  amount: number;
  transaction_id?: string;
  notes?: string;
}

export interface CreateInsuranceRequest {
  patient_id: string;
  provider_name: string;
  policy_number: string;
  coverage_percentage: number;
  max_coverage_amount?: number;
  deductible_amount?: number;
  expiry_date?: string;
}

export interface StripePaymentIntent {
  payment_intent_id: string;
  amount: number;
  currency: string;
  status: string;
  client_secret: string;
}

export interface PaymentSummary {
  total_revenue: number;
  total_pending: number;
  total_overdue: number;
  payment_methods: {
    method: string;
    amount: number;
    count: number;
  }[];
  monthly_revenue: {
    month: string;
    revenue: number;
  }[];
}

// Billing API
export const billingApi = {
  // Bills CRUD
  getAllBills: async (params?: { page?: number; limit?: number }): Promise<ApiResponse<Bill[]>> => {
    return apiClient.get<Bill[]>('/billing/bills', params);
  },

  getBillById: async (billId: string): Promise<ApiResponse<Bill>> => {
    return apiClient.get<Bill>(`/billing/bills/${billId}`);
  },

  getBillsByPatientId: async (patientId: string): Promise<ApiResponse<Bill[]>> => {
    return apiClient.get<Bill[]>(`/billing/bills/patient/${patientId}`);
  },

  createBill: async (data: CreateBillRequest): Promise<ApiResponse<Bill>> => {
    return apiClient.post<Bill>('/billing/bills', data);
  },

  updateBill: async (billId: string, data: UpdateBillRequest): Promise<ApiResponse<Bill>> => {
    return apiClient.put<Bill>(`/billing/bills/${billId}`, data);
  },

  deleteBill: async (billId: string): Promise<ApiResponse<void>> => {
    return apiClient.delete<void>(`/billing/bills/${billId}`);
  },

  // Payments
  createPayment: async (data: CreatePaymentRequest): Promise<ApiResponse<Payment>> => {
    return apiClient.post<Payment>('/billing/payments', data);
  },

  getPaymentsByBillId: async (billId: string): Promise<ApiResponse<Payment[]>> => {
    return apiClient.get<Payment[]>(`/billing/payments/bill/${billId}`);
  },

  // Stripe Payments
  createPaymentIntent: async (billId: string, amount: number): Promise<ApiResponse<StripePaymentIntent>> => {
    return apiClient.post<StripePaymentIntent>('/billing/stripe/payment-intent', { billId, amount });
  },

  confirmPayment: async (paymentIntentId: string, billId: string): Promise<ApiResponse<Payment>> => {
    return apiClient.post<Payment>('/billing/stripe/confirm-payment', { paymentIntentId, billId });
  },

  // Insurance
  createInsurance: async (data: CreateInsuranceRequest): Promise<ApiResponse<Insurance>> => {
    return apiClient.post<Insurance>('/billing/insurance', data);
  },

  getInsuranceByPatientId: async (patientId: string): Promise<ApiResponse<Insurance[]>> => {
    return apiClient.get<Insurance[]>(`/billing/insurance/patient/${patientId}`);
  },

  // Analytics
  getPaymentSummary: async (): Promise<ApiResponse<PaymentSummary>> => {
    return apiClient.get<PaymentSummary>('/billing/analytics/summary');
  },

  // Invoice
  generateInvoice: async (billId: string): Promise<ApiResponse<any>> => {
    return apiClient.get<any>(`/billing/bills/${billId}/invoice`);
  },
};
