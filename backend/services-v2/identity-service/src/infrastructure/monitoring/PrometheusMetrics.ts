/**
 * Prometheus Metrics for Identity Service
 * Provides production-ready monitoring for event-driven architecture
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Production Monitoring, Observability
 */

import { Registry, Counter, Histogram, Gauge, collectDefaultMetrics } from 'prom-client';

export class PrometheusMetrics {
  private registry: Registry;

  // Event metrics
  public eventsConsumedTotal: Counter;
  public eventsProcessedDuration: Histogram;
  public eventsFailedTotal: Counter;
  public inboxSize: Gauge;

  // Use case metrics
  public useCaseDuration: Histogram;

  // API metrics
  public apiRequestsTotal: Counter;
  public apiRequestDuration: Histogram;

  // Cache metrics
  public cacheHitRate: Gauge;

  // Circuit breaker metrics
  public circuitBreakerState: Gauge;

  constructor() {
    this.registry = new Registry();

    // Collect default metrics (CPU, memory, etc.)
    collectDefaultMetrics({ register: this.registry });

    // Event consumption metrics
    this.eventsConsumedTotal = new Counter({
      name: 'identity_events_consumed_total',
      help: 'Total number of events consumed from RabbitMQ',
      labelNames: ['event_type', 'source_service'],
      registers: [this.registry]
    });

    this.eventsProcessedDuration = new Histogram({
      name: 'identity_events_processed_duration_seconds',
      help: 'Duration of event processing in seconds',
      labelNames: ['event_type', 'status'],
      buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1, 2, 5],
      registers: [this.registry]
    });

    this.eventsFailedTotal = new Counter({
      name: 'identity_events_failed_total',
      help: 'Total number of failed event processing attempts',
      labelNames: ['event_type', 'error_type'],
      registers: [this.registry]
    });

    this.inboxSize = new Gauge({
      name: 'identity_inbox_size',
      help: 'Number of pending events in inbox',
      labelNames: ['status'],
      registers: [this.registry]
    });

    // Use case metrics
    this.useCaseDuration = new Histogram({
      name: 'identity_use_case_duration_seconds',
      help: 'Duration of use case execution in seconds',
      labelNames: ['use_case', 'status'],
      buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1, 2, 5],
      registers: [this.registry]
    });

    // API metrics
    this.apiRequestsTotal = new Counter({
      name: 'identity_api_requests_total',
      help: 'Total number of API requests',
      labelNames: ['method', 'endpoint', 'status_code'],
      registers: [this.registry]
    });

    this.apiRequestDuration = new Histogram({
      name: 'identity_api_request_duration_seconds',
      help: 'Duration of API requests in seconds',
      labelNames: ['method', 'endpoint'],
      buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1, 2, 5],
      registers: [this.registry]
    });

    // Cache metrics
    this.cacheHitRate = new Gauge({
      name: 'identity_cache_hit_rate',
      help: 'Cache hit rate (0-1)',
      labelNames: ['cache_type'],
      registers: [this.registry]
    });

    // Circuit breaker metrics
    this.circuitBreakerState = new Gauge({
      name: 'identity_circuit_breaker_state',
      help: 'Circuit breaker state (0=CLOSED, 1=OPEN, 2=HALF_OPEN)',
      labelNames: ['breaker_name'],
      registers: [this.registry]
    });
  }

  /**
   * Get metrics in Prometheus format
   */
  async getMetrics(): Promise<string> {
    return this.registry.metrics();
  }

  /**
   * Get registry for custom metrics
   */
  getRegistry(): Registry {
    return this.registry;
  }

  /**
   * Record event consumption
   */
  recordEventConsumed(eventType: string, sourceService: string): void {
    this.eventsConsumedTotal.inc({ event_type: eventType, source_service: sourceService });
  }

  /**
   * Record event processing duration
   */
  recordEventProcessingDuration(eventType: string, status: 'success' | 'failed', durationSeconds: number): void {
    this.eventsProcessedDuration.observe({ event_type: eventType, status }, durationSeconds);
  }

  /**
   * Record event processing failure
   */
  recordEventFailed(eventType: string, errorType: string): void {
    this.eventsFailedTotal.inc({ event_type: eventType, error_type: errorType });
  }

  /**
   * Update inbox size
   */
  updateInboxSize(status: 'pending' | 'processed' | 'failed', count: number): void {
    this.inboxSize.set({ status }, count);
  }

  /**
   * Record use case execution duration
   */
  recordUseCaseDuration(useCase: string, status: 'success' | 'failed', durationSeconds: number): void {
    this.useCaseDuration.observe({ use_case: useCase, status }, durationSeconds);
  }

  /**
   * Record API request
   */
  recordApiRequest(method: string, endpoint: string, statusCode: number): void {
    this.apiRequestsTotal.inc({ method, endpoint, status_code: statusCode.toString() });
  }

  /**
   * Record API request duration
   */
  recordApiRequestDuration(method: string, endpoint: string, durationSeconds: number): void {
    this.apiRequestDuration.observe({ method, endpoint }, durationSeconds);
  }

  /**
   * Update cache hit rate
   */
  updateCacheHitRate(cacheType: string, hitRate: number): void {
    this.cacheHitRate.set({ cache_type: cacheType }, hitRate);
  }

  /**
   * Update circuit breaker state
   */
  updateCircuitBreakerState(breakerName: string, state: 'CLOSED' | 'OPEN' | 'HALF_OPEN'): void {
    const stateValue = state === 'CLOSED' ? 0 : state === 'OPEN' ? 1 : 2;
    this.circuitBreakerState.set({ breaker_name: breakerName }, stateValue);
  }

  /**
   * Reset all metrics (for testing)
   */
  reset(): void {
    this.registry.resetMetrics();
  }
}

// Singleton instance
export const prometheusMetrics = new PrometheusMetrics();
