/**
 * Prometheus Metrics for Clinical EMR Service
 * Provides production-ready monitoring for electronic medical records
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Production Monitoring, Observability, HIPAA
 */

import { Registry, Counter, Histogram, Gauge, collectDefaultMetrics } from 'prom-client';

export class PrometheusMetrics {
  private registry: Registry;

  // API metrics
  public apiRequestsTotal: Counter;
  public apiRequestDuration: Histogram;
  public apiErrorsTotal: Counter;

  // EMR metrics
  public recordsCreatedTotal: Counter;
  public recordsAccessedTotal: Counter;
  public recordsUpdatedTotal: Counter;
  public recordAccessDuration: Histogram;

  // Clinical notes metrics
  public clinicalNotesCreatedTotal: Counter;
  public clinicalNotesCosignedTotal: Counter;

  // Prescription metrics
  public prescriptionsCreatedTotal: Counter;
  public prescriptionsDispensedTotal: Counter;
  public controlledSubstancePrescriptions: Counter;

  // Lab results metrics
  public labResultsCreatedTotal: Counter;
  public abnormalLabResultsTotal: Counter;

  // FHIR metrics
  public fhirResourcesCreatedTotal: Counter;
  public fhirValidationDuration: Histogram;

  // Audit metrics
  public phiAccessTotal: Counter;
  public auditLogDuration: Histogram;

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
      name: 'clinical_emr_api_requests_total',
      help: 'Total number of API requests',
      labelNames: ['method', 'endpoint', 'status_code'],
      registers: [this.registry]
    });

    this.apiRequestDuration = new Histogram({
      name: 'clinical_emr_api_request_duration_seconds',
      help: 'Duration of API requests in seconds',
      labelNames: ['method', 'endpoint'],
      buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1, 2, 5],
      registers: [this.registry]
    });

    this.apiErrorsTotal = new Counter({
      name: 'clinical_emr_api_errors_total',
      help: 'Total number of API errors',
      labelNames: ['method', 'endpoint', 'error_type'],
      registers: [this.registry]
    });

    // EMR metrics
    this.recordsCreatedTotal = new Counter({
      name: 'clinical_emr_records_created_total',
      help: 'Total number of medical records created',
      labelNames: ['record_type'],
      registers: [this.registry]
    });

    this.recordsAccessedTotal = new Counter({
      name: 'clinical_emr_records_accessed_total',
      help: 'Total number of medical records accessed',
      labelNames: ['record_type', 'access_type'],
      registers: [this.registry]
    });

    this.recordsUpdatedTotal = new Counter({
      name: 'clinical_emr_records_updated_total',
      help: 'Total number of medical records updated',
      labelNames: ['record_type'],
      registers: [this.registry]
    });

    this.recordAccessDuration = new Histogram({
      name: 'clinical_emr_record_access_duration_seconds',
      help: 'Duration of record access operations',
      labelNames: ['operation'],
      buckets: [0.01, 0.05, 0.1, 0.5, 1, 2],
      registers: [this.registry]
    });

    // Clinical notes metrics
    this.clinicalNotesCreatedTotal = new Counter({
      name: 'clinical_emr_clinical_notes_created_total',
      help: 'Total number of clinical notes created',
      labelNames: ['note_type'],
      registers: [this.registry]
    });

    this.clinicalNotesCosignedTotal = new Counter({
      name: 'clinical_emr_clinical_notes_cosigned_total',
      help: 'Total number of clinical notes cosigned',
      registers: [this.registry]
    });

    // Prescription metrics
    this.prescriptionsCreatedTotal = new Counter({
      name: 'clinical_emr_prescriptions_created_total',
      help: 'Total number of prescriptions created',
      labelNames: ['medication_type'],
      registers: [this.registry]
    });

    this.prescriptionsDispensedTotal = new Counter({
      name: 'clinical_emr_prescriptions_dispensed_total',
      help: 'Total number of prescriptions dispensed',
      registers: [this.registry]
    });

    this.controlledSubstancePrescriptions = new Counter({
      name: 'clinical_emr_controlled_substance_prescriptions_total',
      help: 'Total number of controlled substance prescriptions',
      labelNames: ['schedule'],
      registers: [this.registry]
    });

    // Lab results metrics
    this.labResultsCreatedTotal = new Counter({
      name: 'clinical_emr_lab_results_created_total',
      help: 'Total number of lab results created',
      labelNames: ['test_type'],
      registers: [this.registry]
    });

    this.abnormalLabResultsTotal = new Counter({
      name: 'clinical_emr_abnormal_lab_results_total',
      help: 'Total number of abnormal lab results',
      labelNames: ['severity'],
      registers: [this.registry]
    });

    // FHIR metrics
    this.fhirResourcesCreatedTotal = new Counter({
      name: 'clinical_emr_fhir_resources_created_total',
      help: 'Total number of FHIR resources created',
      labelNames: ['resource_type'],
      registers: [this.registry]
    });

    this.fhirValidationDuration = new Histogram({
      name: 'clinical_emr_fhir_validation_duration_seconds',
      help: 'Duration of FHIR validation',
      buckets: [0.01, 0.05, 0.1, 0.5, 1],
      registers: [this.registry]
    });

    // Audit metrics
    this.phiAccessTotal = new Counter({
      name: 'clinical_emr_phi_access_total',
      help: 'Total number of PHI access events',
      labelNames: ['user_role', 'access_type'],
      registers: [this.registry]
    });

    this.auditLogDuration = new Histogram({
      name: 'clinical_emr_audit_log_duration_seconds',
      help: 'Duration of audit logging operations',
      buckets: [0.001, 0.005, 0.01, 0.05, 0.1],
      registers: [this.registry]
    });

    // Database metrics
    this.dbQueryDuration = new Histogram({
      name: 'clinical_emr_db_query_duration_seconds',
      help: 'Duration of database queries',
      labelNames: ['operation', 'table'],
      buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1],
      registers: [this.registry]
    });

    this.dbConnectionsActive = new Gauge({
      name: 'clinical_emr_db_connections_active',
      help: 'Number of active database connections',
      registers: [this.registry]
    });

    // Cache metrics
    this.cacheHitRate = new Gauge({
      name: 'clinical_emr_cache_hit_rate',
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

