/**
 * Prometheus Metrics for Billing Service
 * Provides production-ready monitoring for billing and payments
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Production Monitoring, Observability, PCI-DSS
 */

import { Registry, Counter, Histogram, Gauge, collectDefaultMetrics } from 'prom-client';

export class PrometheusMetrics {
  private registry: Registry;

  // API metrics
  public apiRequestsTotal: Counter;
  public apiRequestDuration: Histogram;
  public apiErrorsTotal: Counter;

  // Invoice metrics
  public invoicesCreatedTotal: Counter;
  public invoicesFinalizedTotal: Counter;
  public invoicesCancelledTotal: Counter;
  public invoiceAmountTotal: Counter;

  // Payment metrics
  public paymentsProcessedTotal: Counter;
  public paymentsFailedTotal: Counter;
  public paymentAmountTotal: Counter;
  public paymentProcessingDuration: Histogram;
  public refundsProcessedTotal: Counter;

  // Insurance metrics
  public insuranceClaimsSubmittedTotal: Counter;
  public insuranceClaimsApprovedTotal: Counter;
  public insuranceClaimsRejectedTotal: Counter;
  public claimProcessingDuration: Histogram;

  // Revenue metrics
  public revenueTotal: Gauge;
  public outstandingPaymentsTotal: Gauge;

  // Database metrics
  public dbQueryDuration: Histogram;
  public dbConnectionsActive: Gauge;

  // Cache metrics
  public cacheHitRate: Gauge;

  constructor() {
    this.registry = new Registry();

    // Collect default metrics (CPU, memory, etc.)
    collectDefaultMetrics({ register: this.registry });

    // API metrics
    this.apiRequestsTotal = new Counter({
      name: 'billing_api_requests_total',
      help: 'Total number of API requests',
      labelNames: ['method', 'endpoint', 'status_code'],
      registers: [this.registry]
    });

    this.apiRequestDuration = new Histogram({
      name: 'billing_api_request_duration_seconds',
      help: 'Duration of API requests in seconds',
      labelNames: ['method', 'endpoint'],
      buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1, 2, 5],
      registers: [this.registry]
    });

    this.apiErrorsTotal = new Counter({
      name: 'billing_api_errors_total',
      help: 'Total number of API errors',
      labelNames: ['method', 'endpoint', 'error_type'],
      registers: [this.registry]
    });

    // Invoice metrics
    this.invoicesCreatedTotal = new Counter({
      name: 'billing_invoices_created_total',
      help: 'Total number of invoices created',
      labelNames: ['invoice_type'],
      registers: [this.registry]
    });

    this.invoicesFinalizedTotal = new Counter({
      name: 'billing_invoices_finalized_total',
      help: 'Total number of invoices finalized',
      registers: [this.registry]
    });

    this.invoicesCancelledTotal = new Counter({
      name: 'billing_invoices_cancelled_total',
      help: 'Total number of invoices cancelled',
      registers: [this.registry]
    });

    this.invoiceAmountTotal = new Counter({
      name: 'billing_invoice_amount_total_vnd',
      help: 'Total invoice amount in VND',
      labelNames: ['invoice_type'],
      registers: [this.registry]
    });

    // Payment metrics
    this.paymentsProcessedTotal = new Counter({
      name: 'billing_payments_processed_total',
      help: 'Total number of payments processed',
      labelNames: ['payment_method', 'status'],
      registers: [this.registry]
    });

    this.paymentsFailedTotal = new Counter({
      name: 'billing_payments_failed_total',
      help: 'Total number of failed payments',
      labelNames: ['payment_method', 'failure_reason'],
      registers: [this.registry]
    });

    this.paymentAmountTotal = new Counter({
      name: 'billing_payment_amount_total_vnd',
      help: 'Total payment amount in VND',
      labelNames: ['payment_method'],
      registers: [this.registry]
    });

    this.paymentProcessingDuration = new Histogram({
      name: 'billing_payment_processing_duration_seconds',
      help: 'Duration of payment processing',
      labelNames: ['payment_method'],
      buckets: [0.1, 0.5, 1, 2, 5, 10],
      registers: [this.registry]
    });

    this.refundsProcessedTotal = new Counter({
      name: 'billing_refunds_processed_total',
      help: 'Total number of refunds processed',
      labelNames: ['refund_reason'],
      registers: [this.registry]
    });

    // Insurance metrics
    this.insuranceClaimsSubmittedTotal = new Counter({
      name: 'billing_insurance_claims_submitted_total',
      help: 'Total number of insurance claims submitted',
      labelNames: ['insurance_type'],
      registers: [this.registry]
    });

    this.insuranceClaimsApprovedTotal = new Counter({
      name: 'billing_insurance_claims_approved_total',
      help: 'Total number of insurance claims approved',
      labelNames: ['insurance_type'],
      registers: [this.registry]
    });

    this.insuranceClaimsRejectedTotal = new Counter({
      name: 'billing_insurance_claims_rejected_total',
      help: 'Total number of insurance claims rejected',
      labelNames: ['insurance_type', 'rejection_reason'],
      registers: [this.registry]
    });

    this.claimProcessingDuration = new Histogram({
      name: 'billing_claim_processing_duration_seconds',
      help: 'Duration of claim processing',
      buckets: [1, 5, 10, 30, 60, 300],
      registers: [this.registry]
    });

    // Revenue metrics
    this.revenueTotal = new Gauge({
      name: 'billing_revenue_total_vnd',
      help: 'Total revenue in VND',
      labelNames: ['period'],
      registers: [this.registry]
    });

    this.outstandingPaymentsTotal = new Gauge({
      name: 'billing_outstanding_payments_total_vnd',
      help: 'Total outstanding payments in VND',
      registers: [this.registry]
    });

    // Database metrics
    this.dbQueryDuration = new Histogram({
      name: 'billing_db_query_duration_seconds',
      help: 'Duration of database queries',
      labelNames: ['operation', 'table'],
      buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1],
      registers: [this.registry]
    });

    this.dbConnectionsActive = new Gauge({
      name: 'billing_db_connections_active',
      help: 'Number of active database connections',
      registers: [this.registry]
    });

    // Cache metrics
    this.cacheHitRate = new Gauge({
      name: 'billing_cache_hit_rate',
      help: 'Cache hit rate (0-1)',
      labelNames: ['cache_type'],
      registers: [this.registry]
    });
  }

  async getMetrics(): Promise<string> {
    return this.registry.metrics();
  }

  getRegistry(): Registry {
    return this.registry;
  }

  reset(): void {
    this.registry.resetMetrics();
  }
}

// Singleton instance
export const prometheusMetrics = new PrometheusMetrics();

