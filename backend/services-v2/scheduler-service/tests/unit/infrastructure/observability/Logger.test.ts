import { Logger, LogLevel, LogContext } from '../../../../src/infrastructure/observability/Logger';
import winston from 'winston';

const mockLog = jest.fn();
const mockAdd = jest.fn();

jest.mock('winston', () => {
  return {
    createLogger: jest.fn(() => ({
      log: mockLog,
      add: mockAdd
    })),
    format: {
      combine: jest.fn(() => ({})),
      timestamp: jest.fn(() => ({})),
      errors: jest.fn(() => ({})),
      json: jest.fn(() => ({})),
      colorize: jest.fn(() => ({})),
      simple: jest.fn(() => ({}))
    },
    transports: {
      Console: jest.fn(),
      File: jest.fn()
    }
  };
});

describe('Logger', () => {
  let logger: Logger;

  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };

    // Reset singleton
    (Logger as any).instance = undefined;

    // Clear mocks
    mockLog.mockClear();
    mockAdd.mockClear();

    logger = Logger.getInstance();
  });

  afterEach(() => {
    process.env = originalEnv;
    jest.clearAllMocks();
  });

  describe('getInstance', () => {
    it('should return singleton instance', () => {
      const instance1 = Logger.getInstance();
      const instance2 = Logger.getInstance();

      expect(instance1).toBe(instance2);
    });

    it('should create logger with default log level', () => {
      expect(winston.createLogger).toHaveBeenCalledWith(
        expect.objectContaining({
          level: 'info'
        })
      );
    });

    it('should create logger with custom log level from env', () => {
      (Logger as any).instance = undefined;
      process.env.LOG_LEVEL = 'debug';

      Logger.getInstance();

      expect(winston.createLogger).toHaveBeenCalledWith(
        expect.objectContaining({
          level: 'debug'
        })
      );
    });

    it('should create logger with default meta', () => {
      expect(winston.createLogger).toHaveBeenCalledWith(
        expect.objectContaining({
          defaultMeta: {
            service: 'scheduler-service',
            environment: 'test', // NODE_ENV is 'test' in Jest
            version: '1.0.0'
          }
        })
      );
    });
  });

  describe('setDefaultContext', () => {
    it('should set default context', () => {
      const context: LogContext = {
        tenantId: 'test-tenant',
        correlationId: 'test-correlation-id'
      };

      logger.setDefaultContext(context);
      logger.info('Test message');

      expect(mockLog).toHaveBeenCalledWith(
        LogLevel.INFO,
        'Test message',
        expect.objectContaining({
          tenantId: 'test-tenant',
          correlationId: 'test-correlation-id'
        })
      );
    });

    it('should merge default context with log context', () => {
      logger.setDefaultContext({ tenantId: 'test-tenant' });
      logger.info('Test message', { scheduleId: 'test-schedule' });

      expect(mockLog).toHaveBeenCalledWith(
        LogLevel.INFO,
        'Test message',
        expect.objectContaining({
          tenantId: 'test-tenant',
          scheduleId: 'test-schedule'
        })
      );
    });
  });

  describe('generateCorrelationId', () => {
    it('should generate UUID correlation ID', () => {
      const correlationId = logger.generateCorrelationId();

      expect(correlationId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
    });

    it('should generate unique correlation IDs', () => {
      const id1 = logger.generateCorrelationId();
      const id2 = logger.generateCorrelationId();

      expect(id1).not.toBe(id2);
    });
  });

  describe('log levels', () => {
    it('should log info message', () => {
      logger.info('Info message', { key: 'value' });

      expect(mockLog).toHaveBeenCalledWith(
        LogLevel.INFO,
        'Info message',
        expect.objectContaining({ key: 'value' })
      );
    });

    it('should log warn message', () => {
      logger.warn('Warning message', { key: 'value' });

      expect(mockLog).toHaveBeenCalledWith(
        LogLevel.WARN,
        'Warning message',
        expect.objectContaining({ key: 'value' })
      );
    });

    it('should log error message', () => {
      const error = new Error('Test error');
      logger.error('Error message', error, { key: 'value' });

      expect(mockLog).toHaveBeenCalledWith(
        LogLevel.ERROR,
        'Error message',
        expect.objectContaining({
          key: 'value',
          error: {
            message: 'Test error',
            stack: expect.any(String),
            name: 'Error'
          }
        })
      );
    });

    it('should log error message without error object', () => {
      logger.error('Error message', undefined, { key: 'value' });

      expect(mockLog).toHaveBeenCalledWith(
        LogLevel.ERROR,
        'Error message',
        expect.objectContaining({ key: 'value' })
      );
    });

    it('should log debug message', () => {
      logger.debug('Debug message', { key: 'value' });

      expect(mockLog).toHaveBeenCalledWith(
        LogLevel.DEBUG,
        'Debug message',
        expect.objectContaining({ key: 'value' })
      );
    });
  });

  describe('structured logging helpers', () => {
    it('should log worker poll', () => {
      logger.logWorkerPoll('worker-1', 100, 5, { tenantId: 'test-tenant' });

      expect(mockLog).toHaveBeenCalledWith(
        LogLevel.INFO,
        'Worker poll completed',
        expect.objectContaining({
          workerId: 'worker-1',
          duration: 100,
          runsAcquired: 5,
          tenantId: 'test-tenant',
          event: 'worker.poll.completed'
        })
      );
    });

    it('should log worker run start', () => {
      logger.logWorkerRunStart('worker-1', 'run-1', 'schedule-1');

      expect(mockLog).toHaveBeenCalledWith(
        LogLevel.INFO,
        'Worker run started',
        expect.objectContaining({
          workerId: 'worker-1',
          runId: 'run-1',
          scheduleId: 'schedule-1',
          event: 'worker.run.started'
        })
      );
    });

    it('should log worker run complete', () => {
      logger.logWorkerRunComplete('worker-1', 'run-1', 'schedule-1', 500, 'SUCCEEDED');

      expect(mockLog).toHaveBeenCalledWith(
        LogLevel.INFO,
        'Worker run completed',
        expect.objectContaining({
          workerId: 'worker-1',
          runId: 'run-1',
          scheduleId: 'schedule-1',
          duration: 500,
          status: 'SUCCEEDED',
          event: 'worker.run.completed'
        })
      );
    });

    it('should log worker run failed', () => {
      const error = new Error('Run failed');
      logger.logWorkerRunFailed('worker-1', 'run-1', 'schedule-1', error);

      expect(mockLog).toHaveBeenCalledWith(
        LogLevel.ERROR,
        'Worker run failed',
        expect.objectContaining({
          workerId: 'worker-1',
          runId: 'run-1',
          scheduleId: 'schedule-1',
          event: 'worker.run.failed',
          error: expect.objectContaining({
            message: 'Run failed'
          })
        })
      );
    });

    it('should log API request', () => {
      logger.logApiRequest('POST', '/schedules', 200, 50);

      expect(mockLog).toHaveBeenCalledWith(
        LogLevel.INFO,
        'API request completed',
        expect.objectContaining({
          method: 'POST',
          path: '/schedules',
          statusCode: 200,
          duration: 50,
          event: 'api.request.completed'
        })
      );
    });

    it('should log API error', () => {
      const error = new Error('API error');
      logger.logApiError('POST', '/schedules', error);

      expect(mockLog).toHaveBeenCalledWith(
        LogLevel.ERROR,
        'API request failed',
        expect.objectContaining({
          method: 'POST',
          path: '/schedules',
          event: 'api.request.failed',
          error: expect.objectContaining({
            message: 'API error'
          })
        })
      );
    });

    it('should log database query', () => {
      logger.logDatabaseQuery('SELECT', 'schedules', 10);

      expect(mockLog).toHaveBeenCalledWith(
        LogLevel.DEBUG,
        'Database query executed',
        expect.objectContaining({
          operation: 'SELECT',
          table: 'schedules',
          duration: 10,
          event: 'database.query.executed'
        })
      );
    });

    it('should log database error', () => {
      const error = new Error('DB error');
      logger.logDatabaseError('INSERT', 'schedules', error);

      expect(mockLog).toHaveBeenCalledWith(
        LogLevel.ERROR,
        'Database query failed',
        expect.objectContaining({
          operation: 'INSERT',
          table: 'schedules',
          event: 'database.query.failed',
          error: expect.objectContaining({
            message: 'DB error'
          })
        })
      );
    });

    it('should log cleanup operation', () => {
      logger.logCleanupOperation('delete_old_runs', 100, 5000);

      expect(mockLog).toHaveBeenCalledWith(
        LogLevel.INFO,
        'Cleanup operation completed',
        expect.objectContaining({
          operationType: 'delete_old_runs',
          deletedCount: 100,
          duration: 5000,
          event: 'cleanup.operation.completed'
        })
      );
    });

    it('should log materialization', () => {
      logger.logMaterialization(50, 200, 3000);

      expect(mockLog).toHaveBeenCalledWith(
        LogLevel.INFO,
        'Materialization cycle completed',
        expect.objectContaining({
          schedulesProcessed: 50,
          runsCreated: 200,
          duration: 3000,
          event: 'materialization.cycle.completed'
        })
      );
    });
  });

  describe('timestamp', () => {
    it('should add timestamp to all logs', () => {
      logger.info('Test message');

      expect(mockLog).toHaveBeenCalledWith(
        LogLevel.INFO,
        'Test message',
        expect.objectContaining({
          timestamp: expect.any(String)
        })
      );
    });
  });
});

