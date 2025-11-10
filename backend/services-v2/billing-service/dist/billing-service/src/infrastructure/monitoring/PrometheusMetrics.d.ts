/**
 * Prometheus Metrics for Billing Service
 * Provides production-ready monitoring for billing and payments
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Production Monitoring, Observability, PCI-DSS
 */
import { Registry, Counter, Histogram, Gauge } from 'prom-client';
export declare class PrometheusMetrics {
    private registry;
    apiRequestsTotal: Counter;
    apiRequestDuration: Histogram;
    apiErrorsTotal: Counter;
    invoicesCreatedTotal: Counter;
    invoicesFinalizedTotal: Counter;
    invoicesCancelledTotal: Counter;
    invoiceAmountTotal: Counter;
    paymentsProcessedTotal: Counter;
    paymentsFailedTotal: Counter;
    paymentAmountTotal: Counter;
    paymentProcessingDuration: Histogram;
    refundsProcessedTotal: Counter;
    insuranceClaimsSubmittedTotal: Counter;
    insuranceClaimsApprovedTotal: Counter;
    insuranceClaimsRejectedTotal: Counter;
    claimProcessingDuration: Histogram;
    revenueTotal: Gauge;
    outstandingPaymentsTotal: Gauge;
    dbQueryDuration: Histogram;
    dbConnectionsActive: Gauge;
    cacheHitRate: Gauge;
    constructor();
    getMetrics(): Promise<string>;
    getRegistry(): Registry;
    reset(): void;
}
export declare const prometheusMetrics: PrometheusMetrics;
//# sourceMappingURL=PrometheusMetrics.d.ts.map