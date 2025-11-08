/**
 * Prometheus Metrics for Appointments Service
 * Provides production-ready monitoring for appointment scheduling
 *
 * @author Hospital Management Team
 * @version 3.0.0
 * @compliance Production Monitoring, Observability
 */
import { Registry, Counter, Histogram, Gauge } from 'prom-client';
export declare class PrometheusMetrics {
    private registry;
    apiRequestsTotal: Counter;
    apiRequestDuration: Histogram;
    apiErrorsTotal: Counter;
    appointmentsScheduledTotal: Counter;
    appointmentsCancelledTotal: Counter;
    appointmentsCompletedTotal: Counter;
    appointmentsNoShowTotal: Counter;
    appointmentDuration: Histogram;
    queueSizeGauge: Gauge;
    queueWaitTime: Histogram;
    patientsInQueue: Gauge;
    availabilityCheckDuration: Histogram;
    slotsAvailableGauge: Gauge;
    conflictsDetectedTotal: Counter;
    conflictResolutionDuration: Histogram;
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