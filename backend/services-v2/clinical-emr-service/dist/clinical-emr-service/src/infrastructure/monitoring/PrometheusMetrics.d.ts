/**
 * Prometheus Metrics for Clinical EMR Service
 * Provides production-ready monitoring for electronic medical records
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Production Monitoring, Observability, HIPAA
 */
import { Registry, Counter, Histogram, Gauge } from 'prom-client';
export declare class PrometheusMetrics {
    private registry;
    apiRequestsTotal: Counter;
    apiRequestDuration: Histogram;
    apiErrorsTotal: Counter;
    recordsCreatedTotal: Counter;
    recordsAccessedTotal: Counter;
    recordsUpdatedTotal: Counter;
    recordAccessDuration: Histogram;
    clinicalNotesCreatedTotal: Counter;
    clinicalNotesCosignedTotal: Counter;
    prescriptionsCreatedTotal: Counter;
    prescriptionsDispensedTotal: Counter;
    controlledSubstancePrescriptions: Counter;
    labResultsCreatedTotal: Counter;
    abnormalLabResultsTotal: Counter;
    fhirResourcesCreatedTotal: Counter;
    fhirValidationDuration: Histogram;
    phiAccessTotal: Counter;
    auditLogDuration: Histogram;
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