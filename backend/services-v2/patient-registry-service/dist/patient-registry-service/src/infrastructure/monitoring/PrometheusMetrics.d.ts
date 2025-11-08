/**
 * Prometheus Metrics for Patient Registry Service
 * Provides production-ready monitoring for patient management
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Production Monitoring, Observability, HIPAA
 */
import { Registry, Counter, Histogram, Gauge } from "prom-client";
export declare class PrometheusMetrics {
    private registry;
    apiRequestsTotal: Counter;
    apiRequestDuration: Histogram;
    apiErrorsTotal: Counter;
    patientsRegisteredTotal: Counter;
    patientSearchDuration: Histogram;
    patientMatchDuration: Histogram;
    duplicatePatientsDetected: Counter;
    insuranceValidationsTotal: Counter;
    insuranceValidationDuration: Histogram;
    bhytValidationsTotal: Counter;
    dbQueryDuration: Histogram;
    dbConnectionsActive: Gauge;
    cacheHitRate: Gauge;
    cacheSize: Gauge;
    constructor();
    getMetrics(): Promise<string>;
    getRegistry(): Registry;
    reset(): void;
}
export declare const prometheusMetrics: PrometheusMetrics;
//# sourceMappingURL=PrometheusMetrics.d.ts.map