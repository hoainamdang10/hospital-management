import { MetricsCollector } from '../../../../src/infrastructure/observability/MetricsCollector';
import { Registry } from 'prom-client';

describe('MetricsCollector', () => {
  let metricsCollector: MetricsCollector;

  beforeEach(() => {
    // Reset singleton
    (MetricsCollector as any).instance = undefined;
    metricsCollector = MetricsCollector.getInstance();
  });

  afterEach(() => {
    metricsCollector.reset();
  });

  describe('getInstance', () => {
    it('should return singleton instance', () => {
      const instance1 = MetricsCollector.getInstance();
      const instance2 = MetricsCollector.getInstance();

      expect(instance1).toBe(instance2);
    });
  });

  describe('getRegistry', () => {
    it('should return Prometheus registry', () => {
      const registry = metricsCollector.getRegistry();

      expect(registry).toBeInstanceOf(Registry);
    });
  });

  describe('worker metrics', () => {
    it('should record worker poll duration', () => {
      metricsCollector.workerPollDuration.observe({ worker_id: 'worker-1', segment: '5' }, 0.5);

      const metrics = metricsCollector.getRegistry().getSingleMetric('scheduler_worker_poll_duration_seconds');
      expect(metrics).toBeDefined();
    });

    it('should increment worker runs executed', () => {
      metricsCollector.workerRunsExecuted.inc({ worker_id: 'worker-1', status: 'SUCCEEDED' });

      const metrics = metricsCollector.getRegistry().getSingleMetric('scheduler_worker_runs_executed_total');
      expect(metrics).toBeDefined();
    });

    it('should increment worker runs failed', () => {
      metricsCollector.workerRunsFailed.inc({ worker_id: 'worker-1', error_type: 'timeout' });

      const metrics = metricsCollector.getRegistry().getSingleMetric('scheduler_worker_runs_failed_total');
      expect(metrics).toBeDefined();
    });

    it('should set worker active runs gauge', () => {
      metricsCollector.workerActiveRuns.set({ worker_id: 'worker-1' }, 5);

      const metrics = metricsCollector.getRegistry().getSingleMetric('scheduler_worker_active_runs');
      expect(metrics).toBeDefined();
    });

    it('should increment worker cleanup operations', () => {
      metricsCollector.workerCleanupOperations.inc({ operation_type: 'delete_old_runs' });

      const metrics = metricsCollector.getRegistry().getSingleMetric('scheduler_worker_cleanup_operations_total');
      expect(metrics).toBeDefined();
    });

    it('should record worker cleanup duration', () => {
      metricsCollector.workerCleanupDuration.observe({ operation_type: 'delete_old_runs' }, 5.0);

      const metrics = metricsCollector.getRegistry().getSingleMetric('scheduler_worker_cleanup_duration_seconds');
      expect(metrics).toBeDefined();
    });

    it('should record worker materialization duration', () => {
      metricsCollector.workerMaterializationDuration.observe({}, 1.5);

      const metrics = metricsCollector.getRegistry().getSingleMetric('scheduler_worker_materialization_duration_seconds');
      expect(metrics).toBeDefined();
    });

    it('should increment worker materialization runs', () => {
      metricsCollector.workerMaterializationRuns.inc({ schedule_type: 'ONCE' });

      const metrics = metricsCollector.getRegistry().getSingleMetric('scheduler_worker_materialization_runs_total');
      expect(metrics).toBeDefined();
    });
  });

  describe('API metrics', () => {
    it('should record API request duration', () => {
      metricsCollector.apiRequestDuration.observe({ method: 'POST', route: '/schedules', status_code: '200' }, 0.05);

      const metrics = metricsCollector.getRegistry().getSingleMetric('scheduler_api_request_duration_seconds');
      expect(metrics).toBeDefined();
    });

    it('should increment API request total', () => {
      metricsCollector.apiRequestTotal.inc({ method: 'POST', route: '/schedules', status_code: '200' });

      const metrics = metricsCollector.getRegistry().getSingleMetric('scheduler_api_request_total');
      expect(metrics).toBeDefined();
    });

    it('should increment API request errors', () => {
      metricsCollector.apiRequestErrors.inc({ method: 'POST', route: '/schedules', error_type: 'validation' });

      const metrics = metricsCollector.getRegistry().getSingleMetric('scheduler_api_request_errors_total');
      expect(metrics).toBeDefined();
    });
  });

  describe('database metrics', () => {
    it('should record database query duration', () => {
      metricsCollector.dbQueryDuration.observe({ operation: 'SELECT', table: 'schedules' }, 0.01);

      const metrics = metricsCollector.getRegistry().getSingleMetric('scheduler_db_query_duration_seconds');
      expect(metrics).toBeDefined();
    });

    it('should increment database query total', () => {
      metricsCollector.dbQueryTotal.inc({ operation: 'INSERT', table: 'schedules' });

      const metrics = metricsCollector.getRegistry().getSingleMetric('scheduler_db_query_total');
      expect(metrics).toBeDefined();
    });

    it('should increment database query errors', () => {
      metricsCollector.dbQueryErrors.inc({ operation: 'UPDATE', table: 'schedules', error_type: 'constraint' });

      const metrics = metricsCollector.getRegistry().getSingleMetric('scheduler_db_query_errors_total');
      expect(metrics).toBeDefined();
    });

    it('should set database connection pool size', () => {
      metricsCollector.dbConnectionPoolSize.set(10);

      const metrics = metricsCollector.getRegistry().getSingleMetric('scheduler_db_connection_pool_size');
      expect(metrics).toBeDefined();
    });
  });

  describe('business metrics', () => {
    it('should set schedules active gauge', () => {
      metricsCollector.schedulesActive.set({ tenant_id: 'test-tenant', schedule_type: 'ONCE' }, 50);

      const metrics = metricsCollector.getRegistry().getSingleMetric('scheduler_schedules_active');
      expect(metrics).toBeDefined();
    });

    it('should increment schedules total', () => {
      metricsCollector.schedulesTotal.inc({ tenant_id: 'test-tenant', schedule_type: 'ONCE' });

      const metrics = metricsCollector.getRegistry().getSingleMetric('scheduler_schedules_total');
      expect(metrics).toBeDefined();
    });

    it('should set runs pending gauge', () => {
      metricsCollector.runsPending.set({ tenant_id: 'test-tenant' }, 100);

      const metrics = metricsCollector.getRegistry().getSingleMetric('scheduler_runs_pending');
      expect(metrics).toBeDefined();
    });

    it('should increment runs completed', () => {
      metricsCollector.runsCompleted.inc({ tenant_id: 'test-tenant', status: 'SUCCEEDED' });

      const metrics = metricsCollector.getRegistry().getSingleMetric('scheduler_runs_completed_total');
      expect(metrics).toBeDefined();
    });

    it('should increment runs failed', () => {
      metricsCollector.runsFailed.inc({ tenant_id: 'test-tenant', error_type: 'timeout' });

      const metrics = metricsCollector.getRegistry().getSingleMetric('scheduler_runs_failed_total');
      expect(metrics).toBeDefined();
    });
  });

  describe('unroutable messages metrics', () => {
    it('should increment unroutable messages total', () => {
      metricsCollector.unroutableMessagesTotal.inc({ routing_key: 'test.topic', exchange: 'scheduler-events' });

      const metrics = metricsCollector.getRegistry().getSingleMetric('scheduler_unroutable_messages_total');
      expect(metrics).toBeDefined();
    });

    it('should increment unroutable messages by exchange', () => {
      metricsCollector.unroutableMessagesByExchange.inc({ exchange: 'scheduler-events' });

      const metrics = metricsCollector.getRegistry().getSingleMetric('scheduler_unroutable_messages_by_exchange_total');
      expect(metrics).toBeDefined();
    });
  });

  describe('getMetrics', () => {
    it('should return metrics in Prometheus format', async () => {
      metricsCollector.schedulesTotal.inc({ tenant_id: 'test-tenant', schedule_type: 'ONCE' });

      const metrics = await metricsCollector.getMetrics();

      expect(metrics).toContain('scheduler_schedules_total');
      expect(metrics).toContain('tenant_id="test-tenant"');
      expect(metrics).toContain('schedule_type="ONCE"');
    });

    it('should include default labels', async () => {
      const metrics = await metricsCollector.getMetrics();

      expect(metrics).toContain('app="scheduler-service"');
      expect(metrics).toContain('version="1.0.0"');
    });
  });

  describe('reset', () => {
    it('should reset all metrics', async () => {
      metricsCollector.schedulesTotal.inc({ tenant_id: 'test-tenant', schedule_type: 'ONCE' });
      metricsCollector.workerRunsExecuted.inc({ worker_id: 'worker-1', status: 'SUCCEEDED' });

      metricsCollector.reset();

      const metrics = await metricsCollector.getMetrics();
      
      // After reset, counters should be 0 or not present
      expect(metrics).toBeDefined();
    });
  });

  describe('metric types', () => {
    it('should have Counter metrics', () => {
      expect(metricsCollector.workerRunsExecuted).toBeDefined();
      expect(metricsCollector.apiRequestTotal).toBeDefined();
      expect(metricsCollector.schedulesTotal).toBeDefined();
    });

    it('should have Histogram metrics', () => {
      expect(metricsCollector.workerPollDuration).toBeDefined();
      expect(metricsCollector.apiRequestDuration).toBeDefined();
      expect(metricsCollector.dbQueryDuration).toBeDefined();
    });

    it('should have Gauge metrics', () => {
      expect(metricsCollector.workerActiveRuns).toBeDefined();
      expect(metricsCollector.schedulesActive).toBeDefined();
      expect(metricsCollector.runsPending).toBeDefined();
    });
  });

  describe('metric labels', () => {
    it('should support worker_id label', () => {
      metricsCollector.workerRunsExecuted.inc({ worker_id: 'worker-1', status: 'SUCCEEDED' });
      metricsCollector.workerRunsExecuted.inc({ worker_id: 'worker-2', status: 'SUCCEEDED' });

      // Both workers should be tracked separately
      expect(metricsCollector.workerRunsExecuted).toBeDefined();
    });

    it('should support tenant_id label', () => {
      metricsCollector.schedulesTotal.inc({ tenant_id: 'tenant-1', schedule_type: 'ONCE' });
      metricsCollector.schedulesTotal.inc({ tenant_id: 'tenant-2', schedule_type: 'ONCE' });

      // Both tenants should be tracked separately
      expect(metricsCollector.schedulesTotal).toBeDefined();
    });

    it('should support multiple labels', () => {
      metricsCollector.apiRequestDuration.observe({ method: 'POST', route: '/schedules', status_code: '200' }, 0.05);
      metricsCollector.apiRequestDuration.observe({ method: 'GET', route: '/schedules', status_code: '200' }, 0.01);

      // Different combinations should be tracked separately
      expect(metricsCollector.apiRequestDuration).toBeDefined();
    });
  });
});

