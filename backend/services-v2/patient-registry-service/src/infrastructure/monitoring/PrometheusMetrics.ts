/**
 * Prometheus Metrics for Patient Registry Service
 * Provides production-ready monitoring for patient management
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Production Monitoring, Observability, HIPAA
 */

import {
  Registry,
  Counter,
  Histogram,
  Gauge,
  collectDefaultMetrics,
} from 'prom-client';

export class PrometheusMetrics {
  private registry: Registry;

  // API metrics
  public apiRequestsTotal: Counter;
  public apiRequestDuration: Histogram;
  public apiErrorsTotal: Counter;

  // Patient metrics
  public patientsRegisteredTotal: Counter;
  public patientSearchDuration: Histogram;
  public patientMatchDuration: Histogram;
  public duplicatePatientsDetected: Counter;

  // Insurance metrics
  public insuranceValidationsTotal: Counter;
  public insuranceValidationDuration: Histogram;
  public bhytValidationsTotal: Counter;

  // Database metrics
  public dbQueryDuration: Histogram;
  public dbConnectionsActive: Gauge;

  // Cache metrics
  public cacheHitRate: Gauge;
  public cacheSize: Gauge;

  constructor() {
    this.registry = new Registry();

    // Collect default metrics (CPU, memory, etc.)
    collectDefaultMetrics({ register: this.registry });

    // API metrics
    this.apiRequestsTotal = new Counter({
      name: 'patient_registry_api_requests_total',
      help: 'Total number of API requests',
      labelNames: ['method', 'endpoint', 'status_code'],
      registers: [this.registry],
    });

    this.apiRequestDuration = new Histogram({
      name: 'patient_registry_api_request_duration_seconds',
      help: 'Duration of API requests in seconds',
      labelNames: ['method', 'endpoint'],
      buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1, 2, 5],
      registers: [this.registry],
    });

    this.apiErrorsTotal = new Counter({
      name: 'patient_registry_api_errors_total',
      help: 'Total number of API errors',
      labelNames: ['method', 'endpoint', 'error_type'],
      registers: [this.registry],
    });

    // Patient metrics
    this.patientsRegisteredTotal = new Counter({
      name: 'patient_registry_patients_registered_total',
      help: 'Total number of patients registered',
      labelNames: ['registration_type'],
      registers: [this.registry],
    });

    this.patientSearchDuration = new Histogram({
      name: 'patient_registry_patient_search_duration_seconds',
      help: 'Duration of patient search operations',
      labelNames: ['search_type'],
      buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5],
      registers: [this.registry],
    });

    this.patientMatchDuration = new Histogram({
      name: 'patient_registry_patient_match_duration_seconds',
      help: 'Duration of patient matching (PMI) operations',
      buckets: [0.1, 0.5, 1, 2, 5, 10],
      registers: [this.registry],
    });

    this.duplicatePatientsDetected = new Counter({
      name: 'patient_registry_duplicate_patients_detected_total',
      help: 'Total number of duplicate patients detected',
      labelNames: ['match_score'],
      registers: [this.registry],
    });

    // Insurance metrics
    this.insuranceValidationsTotal = new Counter({
      name: 'patient_registry_insurance_validations_total',
      help: 'Total number of insurance validations',
      labelNames: ['coverage_type', 'status'],
      registers: [this.registry],
    });

    this.insuranceValidationDuration = new Histogram({
      name: 'patient_registry_insurance_validation_duration_seconds',
      help: 'Duration of insurance validation operations',
      labelNames: ['coverage_type'],
      buckets: [0.1, 0.5, 1, 2, 5],
      registers: [this.registry],
    });

    this.bhytValidationsTotal = new Counter({
      name: 'patient_registry_bhyt_validations_total',
      help: 'Total number of BHYT validations',
      labelNames: ['status'],
      registers: [this.registry],
    });

    // Database metrics
    this.dbQueryDuration = new Histogram({
      name: 'patient_registry_db_query_duration_seconds',
      help: 'Duration of database queries',
      labelNames: ['operation', 'table'],
      buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1],
      registers: [this.registry],
    });

    this.dbConnectionsActive = new Gauge({
      name: 'patient_registry_db_connections_active',
      help: 'Number of active database connections',
      registers: [this.registry],
    });

    // Cache metrics
    this.cacheHitRate = new Gauge({
      name: 'patient_registry_cache_hit_rate',
      help: 'Cache hit rate (0-1)',
      labelNames: ['cache_type'],
      registers: [this.registry],
    });

    this.cacheSize = new Gauge({
      name: 'patient_registry_cache_size',
      help: 'Number of items in cache',
      labelNames: ['cache_type'],
      registers: [this.registry],
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
