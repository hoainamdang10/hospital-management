import { apiClient } from "./client";

export interface PaymentResponse {
    success: boolean;
    data?: any;
    error?: {
        code: string;
        message: string;
    };
}

export interface CreatePaymentParams {
    appointmentId: string;
    amount: number;
    description: string;
    serviceName: string;
    patientInfo?: {
        doctorName: string;
        department: string;
        appointmentDate: string;
        timeSlot: string;
    };
}

export interface CreateCashPaymentParams {
    appointmentId: string;
    amount: number;
    description?: string;
}

/**
 * Payment API Client - Microservice Architecture
 * Routes requests through API Gateway to Payment Service
 */
export const paymentApi = {
    /**
     * Create PayOS payment link via microservice
     */
    async createPayOSPayment(params: CreatePaymentParams): Promise<PaymentResponse> {
        try {
            const response = await apiClient.post('/api/payment/proxy', {
                endpoint: '/api/payments/payos/create',
                method: 'POST',
                data: params
            });
            return response.data;
        } catch (error: any) {
            console.error('API Error - Create PayOS Payment:', error);
            return {
                success: false,
                error: {
                    code: error.code || 'PAYOS_CREATE_ERROR',
                    message: error.message || 'Failed to create PayOS payment'
                }
            };
        }
    },

    /**
     * Create cash payment record via microservice
     */
    async createCashPayment(params: CreateCashPaymentParams): Promise<PaymentResponse> {
        try {
            const response = await apiClient.post('/api/payment/proxy', {
                endpoint: '/api/payments/cash/create',
                method: 'POST',
                data: params
            });
            return response.data;
        } catch (error: any) {
            console.error('API Error - Create Cash Payment:', error);
            return {
                success: false,
                error: {
                    code: error.code || 'CASH_PAYMENT_ERROR',
                    message: error.message || 'Failed to create cash payment'
                }
            };
        }
    },

    /**
     * Verify payment status via microservice
     */
    async verifyPayment(orderCode: string): Promise<PaymentResponse> {
        try {
            const response = await apiClient.post('/api/payment/proxy', {
                endpoint: `/api/payments/verify?orderCode=${orderCode}`,
                method: 'GET'
            });
            return response.data;
        } catch (error: any) {
            console.error('API Error - Verify Payment:', error);
            return {
                success: false,
                error: {
                    code: error.code || 'PAYMENT_VERIFY_ERROR',
                    message: error.message || 'Failed to verify payment'
                }
            };
        }
    },

    /**
     * Get payment history via microservice
     */
    async getPaymentHistory(params?: {
        page?: number;
        limit?: number;
        status?: string;
        method?: string;
    }): Promise<PaymentResponse> {
        try {
            const queryParams = new URLSearchParams();
            if (params?.page) queryParams.append('page', params.page.toString());
            if (params?.limit) queryParams.append('limit', params.limit.toString());
            if (params?.status) queryParams.append('status', params.status);
            if (params?.method) queryParams.append('method', params.method);

            const response = await apiClient.post('/api/payment/proxy', {
                endpoint: `/api/payments/history?${queryParams.toString()}`,
                method: 'GET'
            });
            return response.data;
        } catch (error: any) {
            console.error('API Error - Get Payment History:', error);
            return {
                success: false,
                error: {
                    code: error.code || 'PAYMENT_HISTORY_ERROR',
                    message: error.message || 'Failed to get payment history'
                }
            };
        }
    },

    /**
     * Health check for payment service
     */
    async healthCheck(): Promise<PaymentResponse> {
        try {
            const response = await apiClient.get('/api/payment/proxy');
            return response.data;
        } catch (error: any) {
            console.error('API Error - Payment Health Check:', error);
            return {
                success: false,
                error: {
                    code: error.code || 'PAYMENT_HEALTH_ERROR',
                    message: error.message || 'Payment service health check failed'
                }
            };
        }
    }
};