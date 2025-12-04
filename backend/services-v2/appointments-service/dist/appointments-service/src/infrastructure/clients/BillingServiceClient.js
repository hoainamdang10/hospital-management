"use strict";
/**
 * Billing Service HTTP Client
 * Handles communication with Billing Service for payment link creation
 *
 * @author Hospital Management Team
 * @version 1.0.0
 * @compliance Clean Architecture - Infrastructure Layer
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BillingServiceClient = void 0;
const axios_1 = __importDefault(require("axios"));
const axios_retry_1 = __importDefault(require("axios-retry"));
/**
 * Billing Service Client
 * Provides HTTP client for inter-service communication with Billing Service
 */
class BillingServiceClient {
    constructor(config) {
        this.retryAttempts = config.retryAttempts || 3;
        this.retryDelay = config.retryDelay || 1000;
        this.internalToken =
            process.env.INTERNAL_SERVICE_TOKEN ||
                process.env.BILLING_INTERNAL_TOKEN ||
                process.env.INTERNAL_TOKEN ||
                "dev-internal-token";
        // Create axios instance with base configuration
        this.client = axios_1.default.create({
            baseURL: config.baseUrl,
            timeout: config.timeout || 5000,
            headers: {
                "Content-Type": "application/json",
                "X-Service-Name": "appointments-service",
                "x-internal-token": this.internalToken,
            },
        });
        // Configure retry logic
        (0, axios_retry_1.default)(this.client, {
            retries: this.retryAttempts,
            retryDelay: axios_retry_1.default.exponentialDelay,
            retryCondition: (error) => {
                // Retry on network errors or specific HTTP status codes
                return (axios_retry_1.default.isNetworkOrIdempotentRequestError(error) ||
                    error.response?.status === 429 || // Rate limit
                    error.response?.status === 503 || // Service unavailable
                    error.response?.status === 504 // Gateway timeout
                );
            },
            onRetry: (retryCount, error, requestConfig) => {
                console.warn(`[BillingServiceClient] Retry attempt ${retryCount} for ${requestConfig.url}`, { error: error.message });
            },
        });
        this.setupInterceptors();
    }
    /**
     * Setup request/response interceptors
     */
    setupInterceptors() {
        // Request interceptor
        this.client.interceptors.request.use((config) => {
            console.log(`[BillingServiceClient] Request: ${config.method?.toUpperCase()} ${config.url}`);
            // Ensure internal token is always attached
            if (this.internalToken) {
                config.headers = config.headers || {};
                config.headers["x-internal-token"] = this.internalToken;
            }
            return config;
        }, (error) => {
            console.error("[BillingServiceClient] Request error:", error);
            return Promise.reject(error);
        });
        // Response interceptor
        this.client.interceptors.response.use((response) => {
            console.log(`[BillingServiceClient] Response: ${response.status} ${response.config.url}`);
            return response;
        }, (error) => {
            console.error("[BillingServiceClient] Response error:", {
                url: error.config?.url,
                status: error.response?.status,
                message: error.message,
            });
            return Promise.reject(error);
        });
    }
    /**
     * Create PayOS payment link for invoice
     * POST /api/v1/invoices/:invoiceId/payos/payment-link
     *
     * @param request - Payment link creation request
     * @returns Payment link response with checkout URL
     * @throws Error if request fails after retries
     */
    async createPaymentLink(request) {
        try {
            console.log("[BillingServiceClient] Creating payment link", {
                invoiceId: request.invoiceId,
            });
            const response = await this.client.post(`/api/v1/invoices/${request.invoiceId}/payos/payment-link`, {
                buyerName: request.buyerName,
                buyerEmail: request.buyerEmail,
                buyerPhone: request.buyerPhone,
            });
            console.log("[BillingServiceClient] Payment link created successfully", {
                invoiceId: request.invoiceId,
                checkoutUrl: response.data.checkoutUrl,
            });
            return response.data;
        }
        catch (error) {
            if (axios_1.default.isAxiosError(error)) {
                const errorMessage = error.response?.data?.message || error.message;
                console.error("[BillingServiceClient] Failed to create payment link", {
                    invoiceId: request.invoiceId,
                    status: error.response?.status,
                    message: errorMessage,
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
    async searchInvoices(request) {
        try {
            console.log("[BillingServiceClient] Searching invoices", {
                criteria: request,
            });
            const response = await this.client.get("/api/v1/invoices/search", {
                params: request,
            });
            console.log("[BillingServiceClient] Search completed", {
                total: response.data.total,
            });
            return response.data;
        }
        catch (error) {
            if (axios_1.default.isAxiosError(error)) {
                const errorMessage = error.response?.data?.message || error.message;
                console.error("[BillingServiceClient] Failed to search invoices", {
                    status: error.response?.status,
                    message: errorMessage,
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
    async healthCheck() {
        try {
            const response = await this.client.get("/health");
            return response.status === 200;
        }
        catch (error) {
            console.error("[BillingServiceClient] Health check failed:", error);
            return false;
        }
    }
}
exports.BillingServiceClient = BillingServiceClient;
//# sourceMappingURL=BillingServiceClient.js.map