"use strict";
/**
 * Prometheus Metrics for Billing Service
 * Provides production-ready monitoring for billing and payments
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Production Monitoring, Observability, PCI-DSS
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.prometheusMetrics = exports.PrometheusMetrics = void 0;
const prom_client_1 = require("prom-client");
class PrometheusMetrics {
    constructor() {
        this.registry = new prom_client_1.Registry();
        // Collect default metrics (CPU, memory, etc.)
        (0, prom_client_1.collectDefaultMetrics)({ register: this.registry });
        // API metrics
        this.apiRequestsTotal = new prom_client_1.Counter({
            name: 'billing_api_requests_total',
            help: 'Total number of API requests',
            labelNames: ['method', 'endpoint', 'status_code'],
            registers: [this.registry]
        });
        this.apiRequestDuration = new prom_client_1.Histogram({
            name: 'billing_api_request_duration_seconds',
            help: 'Duration of API requests in seconds',
            labelNames: ['method', 'endpoint'],
            buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1, 2, 5],
            registers: [this.registry]
        });
        this.apiErrorsTotal = new prom_client_1.Counter({
            name: 'billing_api_errors_total',
            help: 'Total number of API errors',
            labelNames: ['method', 'endpoint', 'error_type'],
            registers: [this.registry]
        });
        // Invoice metrics
        this.invoicesCreatedTotal = new prom_client_1.Counter({
            name: 'billing_invoices_created_total',
            help: 'Total number of invoices created',
            labelNames: ['invoice_type'],
            registers: [this.registry]
        });
        this.invoicesFinalizedTotal = new prom_client_1.Counter({
            name: 'billing_invoices_finalized_total',
            help: 'Total number of invoices finalized',
            registers: [this.registry]
        });
        this.invoicesCancelledTotal = new prom_client_1.Counter({
            name: 'billing_invoices_cancelled_total',
            help: 'Total number of invoices cancelled',
            registers: [this.registry]
        });
        this.invoiceAmountTotal = new prom_client_1.Counter({
            name: 'billing_invoice_amount_total_vnd',
            help: 'Total invoice amount in VND',
            labelNames: ['invoice_type'],
            registers: [this.registry]
        });
        // Payment metrics
        this.paymentsProcessedTotal = new prom_client_1.Counter({
            name: 'billing_payments_processed_total',
            help: 'Total number of payments processed',
            labelNames: ['payment_method', 'status'],
            registers: [this.registry]
        });
        this.paymentsFailedTotal = new prom_client_1.Counter({
            name: 'billing_payments_failed_total',
            help: 'Total number of failed payments',
            labelNames: ['payment_method', 'failure_reason'],
            registers: [this.registry]
        });
        this.paymentAmountTotal = new prom_client_1.Counter({
            name: 'billing_payment_amount_total_vnd',
            help: 'Total payment amount in VND',
            labelNames: ['payment_method'],
            registers: [this.registry]
        });
        this.paymentProcessingDuration = new prom_client_1.Histogram({
            name: 'billing_payment_processing_duration_seconds',
            help: 'Duration of payment processing',
            labelNames: ['payment_method'],
            buckets: [0.1, 0.5, 1, 2, 5, 10],
            registers: [this.registry]
        });
        this.refundsProcessedTotal = new prom_client_1.Counter({
            name: 'billing_refunds_processed_total',
            help: 'Total number of refunds processed',
            labelNames: ['refund_reason'],
            registers: [this.registry]
        });
        // Insurance metrics
        this.insuranceClaimsSubmittedTotal = new prom_client_1.Counter({
            name: 'billing_insurance_claims_submitted_total',
            help: 'Total number of insurance claims submitted',
            labelNames: ['insurance_type'],
            registers: [this.registry]
        });
        this.insuranceClaimsApprovedTotal = new prom_client_1.Counter({
            name: 'billing_insurance_claims_approved_total',
            help: 'Total number of insurance claims approved',
            labelNames: ['insurance_type'],
            registers: [this.registry]
        });
        this.insuranceClaimsRejectedTotal = new prom_client_1.Counter({
            name: 'billing_insurance_claims_rejected_total',
            help: 'Total number of insurance claims rejected',
            labelNames: ['insurance_type', 'rejection_reason'],
            registers: [this.registry]
        });
        this.claimProcessingDuration = new prom_client_1.Histogram({
            name: 'billing_claim_processing_duration_seconds',
            help: 'Duration of claim processing',
            buckets: [1, 5, 10, 30, 60, 300],
            registers: [this.registry]
        });
        // Revenue metrics
        this.revenueTotal = new prom_client_1.Gauge({
            name: 'billing_revenue_total_vnd',
            help: 'Total revenue in VND',
            labelNames: ['period'],
            registers: [this.registry]
        });
        this.outstandingPaymentsTotal = new prom_client_1.Gauge({
            name: 'billing_outstanding_payments_total_vnd',
            help: 'Total outstanding payments in VND',
            registers: [this.registry]
        });
        // Database metrics
        this.dbQueryDuration = new prom_client_1.Histogram({
            name: 'billing_db_query_duration_seconds',
            help: 'Duration of database queries',
            labelNames: ['operation', 'table'],
            buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1],
            registers: [this.registry]
        });
        this.dbConnectionsActive = new prom_client_1.Gauge({
            name: 'billing_db_connections_active',
            help: 'Number of active database connections',
            registers: [this.registry]
        });
        // Cache metrics
        this.cacheHitRate = new prom_client_1.Gauge({
            name: 'billing_cache_hit_rate',
            help: 'Cache hit rate (0-1)',
            labelNames: ['cache_type'],
            registers: [this.registry]
        });
    }
    async getMetrics() {
        return this.registry.metrics();
    }
    getRegistry() {
        return this.registry;
    }
    reset() {
        this.registry.resetMetrics();
    }
}
exports.PrometheusMetrics = PrometheusMetrics;
// Singleton instance
exports.prometheusMetrics = new PrometheusMetrics();
//# sourceMappingURL=PrometheusMetrics.js.map