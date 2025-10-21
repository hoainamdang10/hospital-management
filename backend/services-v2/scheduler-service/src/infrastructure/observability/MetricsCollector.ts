import { Registry, Counter, Histogram, Gauge } from 'prom-client';

export class MetricsCollector {
  private static instance: MetricsCollector;
  private registry: Registry;

  // Worker Metrics
  public readonly workerPollDuration: Histogram;
  public readonly workerRunsExecuted: Counter;
  public readonly workerRunsFailed: Counter;
  public readonly workerActiveRuns: Gauge;
  public readonly workerCleanupOperations: Counter;
  public readonly workerCleanupDuration: Histogram;
  public readonly workerMaterializationDuration: Histogram;
  public readonly workerMaterializationRuns: Counter;

  // API Metrics
  public readonly apiRequestDuration: Histogram;
  public readonly apiRequestTotal: Counter;
  public readonly apiRequestErrors: Counter;

  // Database Metrics
  public readonly dbQueryDuration: Histogram;
  public readonly dbQueryTotal: Counter;
  public readonly dbQueryErrors: Counter;
  public readonly dbConnectionPoolSize: Gauge;

  // Business Metrics
  public readonly schedulesActive: Gauge;
  public readonly schedulesTotal: Counter;
  public readonly runsPending: Gauge;
  public readonly runsCompleted: Counter;
  public readonly runsFailed: Counter;

  // Unroutable Messages Metrics
  public readonly unroutableMessagesTotal: Counter;
  public readonly unroutableMessagesByExchange: Counter;

  private constructor() {
    this.registry = new Registry();

    // Worker Metrics
    this.workerPollDuration = new Histogram({
      name: 'scheduler_worker_poll_duration_seconds',
      help: 'Duration of worker poll operations',
      labelNames: ['worker_id', 'segment'],
      buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1, 5],
      registers: [this.registry]
    });

    this.workerRunsExecuted = new Counter({
      name: 'scheduler_worker_runs_executed_total',
      help: 'Total number of runs executed by workers',
      labelNames: ['worker_id', 'status'],
      registers: [this.registry]
    });

    this.workerRunsFailed = new Counter({
      name: 'scheduler_worker_runs_failed_total',
      help: 'Total number of runs failed',
      labelNames: ['worker_id', 'error_type'],
      registers: [this.registry]
    });

    this.workerActiveRuns = new Gauge({
      name: 'scheduler_worker_active_runs',
      help: 'Number of currently active runs',
      labelNames: ['worker_id'],
      registers: [this.registry]
    });

    this.workerCleanupOperations = new Counter({
      name: 'scheduler_worker_cleanup_operations_total',
      help: 'Total number of cleanup operations',
      labelNames: ['operation_type'],
      registers: [this.registry]
    });

    this.workerCleanupDuration = new Histogram({
      name: 'scheduler_worker_cleanup_duration_seconds',
      help: 'Duration of cleanup operations',
      labelNames: ['operation_type'],
      buckets: [0.1, 0.5, 1, 5, 10, 30, 60],
      registers: [this.registry]
    });

    this.workerMaterializationDuration = new Histogram({
      name: 'scheduler_worker_materialization_duration_seconds',
      help: 'Duration of materialization operations',
      buckets: [0.01, 0.05, 0.1, 0.5, 1, 5],
      registers: [this.registry]
    });

    this.workerMaterializationRuns = new Counter({
      name: 'scheduler_worker_materialization_runs_total',
      help: 'Total number of runs materialized',
      labelNames: ['schedule_type'],
      registers: [this.registry]
    });

    // API Metrics
    this.apiRequestDuration = new Histogram({
      name: 'scheduler_api_request_duration_seconds',
      help: 'Duration of API requests',
      labelNames: ['method', 'route', 'status_code'],
      buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1, 5],
      registers: [this.registry]
    });

    this.apiRequestTotal = new Counter({
      name: 'scheduler_api_request_total',
      help: 'Total number of API requests',
      labelNames: ['method', 'route', 'status_code'],
      registers: [this.registry]
    });

    this.apiRequestErrors = new Counter({
      name: 'scheduler_api_request_errors_total',
      help: 'Total number of API request errors',
      labelNames: ['method', 'route', 'error_type'],
      registers: [this.registry]
    });

    // Database Metrics
    this.dbQueryDuration = new Histogram({
      name: 'scheduler_db_query_duration_seconds',
      help: 'Duration of database queries',
      labelNames: ['operation', 'table'],
      buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1, 5],
      registers: [this.registry]
    });

    this.dbQueryTotal = new Counter({
      name: 'scheduler_db_query_total',
      help: 'Total number of database queries',
      labelNames: ['operation', 'table'],
      registers: [this.registry]
    });

    this.dbQueryErrors = new Counter({
      name: 'scheduler_db_query_errors_total',
      help: 'Total number of database query errors',
      labelNames: ['operation', 'table', 'error_type'],
      registers: [this.registry]
    });

    this.dbConnectionPoolSize = new Gauge({
      name: 'scheduler_db_connection_pool_size',
      help: 'Current database connection pool size',
      registers: [this.registry]
    });

    // Business Metrics
    this.schedulesActive = new Gauge({
      name: 'scheduler_schedules_active',
      help: 'Number of active schedules',
      labelNames: ['tenant_id', 'schedule_type'],
      registers: [this.registry]
    });

    this.schedulesTotal = new Counter({
      name: 'scheduler_schedules_total',
      help: 'Total number of schedules created',
      labelNames: ['tenant_id', 'schedule_type'],
      registers: [this.registry]
    });

    this.runsPending = new Gauge({
      name: 'scheduler_runs_pending',
      help: 'Number of pending runs',
      labelNames: ['tenant_id'],
      registers: [this.registry]
    });

    this.runsCompleted = new Counter({
      name: 'scheduler_runs_completed_total',
      help: 'Total number of completed runs',
      labelNames: ['tenant_id', 'status'],
      registers: [this.registry]
    });

    this.runsFailed = new Counter({
      name: 'scheduler_runs_failed_total',
      help: 'Total number of failed runs',
      labelNames: ['tenant_id', 'error_type'],
      registers: [this.registry]
    });

    // Unroutable Messages Metrics
    this.unroutableMessagesTotal = new Counter({
      name: 'scheduler_unroutable_messages_total',
      help: 'Total number of unroutable messages',
      labelNames: ['routing_key', 'exchange'],
      registers: [this.registry]
    });

    this.unroutableMessagesByExchange = new Counter({
      name: 'scheduler_unroutable_messages_by_exchange_total',
      help: 'Total number of unroutable messages grouped by exchange',
      labelNames: ['exchange'],
      registers: [this.registry]
    });

    // Register default metrics (CPU, memory, etc.)
    this.registry.setDefaultLabels({
      app: 'scheduler-service',
      version: '1.0.0'
    });
  }

  public static getInstance(): MetricsCollector {
    if (!MetricsCollector.instance) {
      MetricsCollector.instance = new MetricsCollector();
    }
    return MetricsCollector.instance;
  }

  public getRegistry(): Registry {
    return this.registry;
  }

  public async getMetrics(): Promise<string> {
    return this.registry.metrics();
  }

  public reset(): void {
    this.registry.resetMetrics();
  }
}

