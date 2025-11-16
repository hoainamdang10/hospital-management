/**
 * Billing Service HTTP Client
 * Handles communication with Billing Service for payment link creation
 * 
 * @author Hospital Management Team
 * @version 1.0.0
 * @compliance Clean Architecture - Infrastructure Layer
 */

import axios, { AxiosInstance, AxiosError } from 'axios';
import axiosRetry from 'axios-retry';

export interface BillingServiceClientConfig {
  baseUrl: string;
  timeout?: number;
  retryAttempts?: number;
  retryDelay?: number;
}

export interface CreatePaymentLinkRequest {
  invoiceId: string;
  buyerName?: string;
  buyerEmail?: string;
  buyerPhone?: string;
}

export interface CreatePaymentLinkResponse {
  success: boolean;
  checkoutUrl: string;
  qrCode: string;
  paymentLinkId: string;
  orderCode: number;
  amount: number;
}

export interface SearchInvoicesRequest {
  patientId?: string;
  status?: string;
  fromDate?: Date;
  toDate?: Date;
  minAmount?: number;
  maxAmount?: number;
  invoiceNumber?: string;
}

export interface InvoiceSummary {
  invoiceId: string;
  invoiceNumber?: string;
  patientId: string;
  totalAmount: number;
  outstandingAmount: number;
  status: string;
  createdAt: Date;
  finalizedAt?: Date;
}

export interface SearchInvoicesResponse {
  invoices: InvoiceSummary[];
  total: number;
}

/**
 * Billing Service Client
 * Provides HTTP client for inter-service communication with Billing Service
 */
export class BillingServiceClient {
  private readonly client: AxiosInstance;
  private readonly retryAttempts: number;
  private readonly retryDelay: number;

  constructor(config: BillingServiceClientConfig) {
    this.retryAttempts = config.retryAttempts || 3;
    this.retryDelay = config.retryDelay || 1000;

    // Create axios instance with base configuration
    this.client = axios.create({
      baseURL: config.baseUrl,
      timeout: config.timeout || 5000,
      headers: {
        'Content-Type': 'application/json',
        'X-Service-Name': 'appointments-service'
      }
    });

    // Configure retry logic
    axiosRetry(this.client, {
      retries: this.retryAttempts,
      retryDelay: axiosRetry.exponentialDelay,
      retryCondition: (error: AxiosError) => {
        // Retry on network errors or specific HTTP status codes
        return (
          axiosRetry.isNetworkOrIdempotentRequestError(error) ||
          error.response?.status === 429 || // Rate limit
          error.response?.status === 503 || // Service unavailable
          error.response?.status === 504    // Gateway timeout
        );
      },
      onRetry: (retryCount, error, requestConfig) => {
        console.warn(
          `[BillingServiceClient] Retry attempt ${retryCount} for ${requestConfig.url}`,
          { error: error.message }
        );
      }
    });

    this.setupInterceptors();
  }

  /**
   * Setup request/response interceptors
   */
  private setupInterceptors(): void {
    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        console.log(`[BillingServiceClient] Request: ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => {
        console.error('[BillingServiceClient] Request error:', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => {
        console.log(`[BillingServiceClient] Response: ${response.status} ${response.config.url}`);
        return response;
      },
      (error: AxiosError) => {
        console.error('[BillingServiceClient] Response error:', {
          url: error.config?.url,
          status: error.response?.status,
          message: error.message
        });
        return Promise.reject(error);
      }
    );
  }

  /**
   * Create PayOS payment link for invoice
   * POST /api/v1/invoices/:invoiceId/payos/payment-link
   * 
   * @param request - Payment link creation request
   * @returns Payment link response with checkout URL
   * @throws Error if request fails after retries
   */
  async createPaymentLink(request: CreatePaymentLinkRequest): Promise<CreatePaymentLinkResponse> {
    try {
      console.log('[BillingServiceClient] Creating payment link', {
        invoiceId: request.invoiceId
      });

      const response = await this.client.post<CreatePaymentLinkResponse>(
        `/api/v1/invoices/${request.invoiceId}/payos/payment-link`,
        {
          buyerName: request.buyerName,
          buyerEmail: request.buyerEmail,
          buyerPhone: request.buyerPhone
        }
      );

      console.log('[BillingServiceClient] Payment link created successfully', {
        invoiceId: request.invoiceId,
        checkoutUrl: response.data.checkoutUrl
      });

      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const errorMessage = error.response?.data?.message || error.message;
        console.error('[BillingServiceClient] Failed to create payment link', {
          invoiceId: request.invoiceId,
          status: error.response?.status,
          message: errorMessage
        });
        throw new Error(`Failed to create payment link: ${errorMessage}`);
      }
      throw error;
    }
  }

  /**
   * Search invoices
   * GET /api/v1/invoices/search
   *
   * @param request - Search criteria
   * @returns Search results with invoice summaries
   * @throws Error if request fails after retries
   */
  async searchInvoices(request: SearchInvoicesRequest): Promise<SearchInvoicesResponse> {
    try {
      console.log('[BillingServiceClient] Searching invoices', {
        criteria: request
      });

      const response = await this.client.get<SearchInvoicesResponse>(
        '/api/v1/invoices/search',
        {
          params: request
        }
      );

      console.log('[BillingServiceClient] Search completed', {
        total: response.data.total
      });

      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const errorMessage = error.response?.data?.message || error.message;
        console.error('[BillingServiceClient] Failed to search invoices', {
          status: error.response?.status,
          message: errorMessage
        });
        throw new Error(`Failed to search invoices: ${errorMessage}`);
      }
      throw error;
    }
  }

  /**
   * Health check
   * GET /health
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.client.get('/health');
      return response.status === 200;
    } catch (error) {
      console.error('[BillingServiceClient] Health check failed:', error);
      return false;
    }
  }
}
