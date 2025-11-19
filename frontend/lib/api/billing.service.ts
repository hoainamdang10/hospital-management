import apiClient from './axios';

export interface Invoice {
    id: string;
    invoiceNumber: string;
    patientId: string;
    patientName: string;
    appointmentId: string;
    amount: number;
    status: 'PENDING' | 'PAID' | 'OVERDUE' | 'CANCELLED';
    dueDate: string;
    createdAt: string;
    items: InvoiceItem[];
}

export interface InvoiceItem {
    description: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
}

export interface SearchInvoicesParams {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    fromDate?: string;
    toDate?: string;
    patientId?: string;
}

export interface RevenueReportParams {
    fromDate: string;
    toDate: string;
    groupBy: 'day' | 'month';
}

export const billingService = {
    /**
     * Search invoices
     * GET /api/invoices/search
     */
    async searchInvoices(params: SearchInvoicesParams) {
        const response = await apiClient.get('/invoices/search', { params });
        return response.data;
    },

    /**
     * Get invoice details
     * GET /api/invoices/:id
     */
    async getInvoice(id: string) {
        const response = await apiClient.get(`/invoices/${id}`);
        return response.data;
    },

    /**
     * Get revenue report
     * GET /api/invoices/reports/revenue
     */
    async getRevenueReport(params: RevenueReportParams) {
        const response = await apiClient.get('/invoices/reports/revenue', { params });
        return response.data;
    },

    /**
     * Create payment link (PayOS)
     * POST /api/invoices/:id/payment-link
     */
    async createPaymentLink(id: string, returnUrl: string, cancelUrl: string) {
        const response = await apiClient.post(`/invoices/${id}/payment-link`, {
            returnUrl,
            cancelUrl
        });
        return response.data;
    }
};
