import { Request, Response } from 'express';
import { ScheduleController } from '../../../../src/presentation/controllers/ScheduleController';
import {
  CreateScheduleUseCase,
  CancelScheduleUseCase,
  GetScheduleUseCase,
  GetScheduleRunsUseCase,
  RunNowUseCase,
  ListSchedulesUseCase,
  UpdateScheduleUseCase,
  DeleteScheduleUseCase,
  GetRunUseCase,
  RetryRunUseCase
} from '../../../../src/application/use-cases';

describe('ScheduleController', () => {
  let controller: ScheduleController;
  let mockCreateScheduleUseCase: jest.Mocked<CreateScheduleUseCase>;
  let mockCancelScheduleUseCase: jest.Mocked<CancelScheduleUseCase>;
  let mockGetScheduleUseCase: jest.Mocked<GetScheduleUseCase>;
  let mockGetScheduleRunsUseCase: jest.Mocked<GetScheduleRunsUseCase>;
  let mockRunNowUseCase: jest.Mocked<RunNowUseCase>;
  let mockListSchedulesUseCase: jest.Mocked<ListSchedulesUseCase>;
  let mockUpdateScheduleUseCase: jest.Mocked<UpdateScheduleUseCase>;
  let mockDeleteScheduleUseCase: jest.Mocked<DeleteScheduleUseCase>;
  let mockGetRunUseCase: jest.Mocked<GetRunUseCase>;
  let mockRetryRunUseCase: jest.Mocked<RetryRunUseCase>;

  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;

  beforeEach(() => {
    mockCreateScheduleUseCase = { execute: jest.fn() } as any;
    mockCancelScheduleUseCase = { execute: jest.fn() } as any;
    mockGetScheduleUseCase = { execute: jest.fn() } as any;
    mockGetScheduleRunsUseCase = { execute: jest.fn() } as any;
    mockRunNowUseCase = { execute: jest.fn() } as any;
    mockListSchedulesUseCase = { execute: jest.fn() } as any;
    mockUpdateScheduleUseCase = { execute: jest.fn() } as any;
    mockDeleteScheduleUseCase = { execute: jest.fn() } as any;
    mockGetRunUseCase = { execute: jest.fn() } as any;
    mockRetryRunUseCase = { execute: jest.fn() } as any;

    controller = new ScheduleController(
      mockCreateScheduleUseCase,
      mockCancelScheduleUseCase,
      mockGetScheduleUseCase,
      mockGetScheduleRunsUseCase,
      mockRunNowUseCase,
      mockListSchedulesUseCase,
      mockUpdateScheduleUseCase,
      mockDeleteScheduleUseCase,
      mockGetRunUseCase,
      mockRetryRunUseCase
    );

    jsonMock = jest.fn();
    statusMock = jest.fn().mockReturnValue({ json: jsonMock });

    mockRequest = {
      body: {},
      params: {},
      query: {}
    };

    mockResponse = {
      status: statusMock,
      json: jsonMock
    };

    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('createOrUpdateByDedup', () => {
    it('should create schedule successfully', async () => {
      const mockResult = { scheduleId: 'test-id', status: 'ACTIVE', nextRunAt: '2025-01-08T10:00:00.000Z' };
      mockCreateScheduleUseCase.execute.mockResolvedValue(mockResult);

      mockRequest.body = { tenantId: 'test-tenant', dedupKey: 'test-key' };

      await controller.createOrUpdateByDedup(mockRequest as Request, mockResponse as Response);

      expect(mockCreateScheduleUseCase.execute).toHaveBeenCalledWith(mockRequest.body);
      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        data: mockResult
      });
    });

    it('should handle use case error', async () => {
      mockCreateScheduleUseCase.execute.mockRejectedValue(new Error('Validation failed'));

      mockRequest.body = { tenantId: 'test-tenant' };

      await controller.createOrUpdateByDedup(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        error: 'Validation failed'
      });
    });
  });

  describe('cancelByOwner', () => {
    it('should cancel schedules successfully', async () => {
      const mockResult = { cancelledCount: 3, scheduleIds: ['id1', 'id2', 'id3'] };
      mockCancelScheduleUseCase.execute.mockResolvedValue(mockResult);

      mockRequest.body = { tenantId: 'test-tenant', ownerService: 'test-service' };

      await controller.cancelByOwner(mockRequest as Request, mockResponse as Response);

      expect(mockCancelScheduleUseCase.execute).toHaveBeenCalledWith(mockRequest.body);
      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        data: mockResult
      });
    });

    it('should handle use case error', async () => {
      mockCancelScheduleUseCase.execute.mockRejectedValue(new Error('Cancel failed'));

      await controller.cancelByOwner(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        error: 'Cancel failed'
      });
    });
  });

  describe('getSchedule', () => {
    it('should get schedule successfully', async () => {
      const mockResult = {
        schedule: {
          scheduleId: 'test-id',
          tenantId: 'tenant-1',
          ownerService: 'test-service',
          scheduleType: 'CRON',
          timezone: 'UTC',
          topicOrCommand: 'test.topic',
          payloadJson: {},
          jitterMs: 0,
          retryPolicy: {},
          dedupKey: 'dedup-1',
          status: 'ACTIVE',
          createdAt: '2025-01-01T00:00:00Z',
          updatedAt: '2025-01-07T00:00:00Z'
        },
        totalRuns: 0
      };
      mockGetScheduleUseCase.execute.mockResolvedValue(mockResult);

      mockRequest.params = { scheduleId: 'test-id' };

      await controller.getSchedule(mockRequest as Request, mockResponse as Response);

      expect(mockGetScheduleUseCase.execute).toHaveBeenCalledWith({ scheduleId: 'test-id' });
      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        data: mockResult
      });
    });

    it('should return 404 if schedule not found', async () => {
      mockGetScheduleUseCase.execute.mockRejectedValue(new Error('Schedule not found'));

      mockRequest.params = { scheduleId: 'non-existent-id' };

      await controller.getSchedule(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(404);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        error: 'Schedule not found'
      });
    });

    it('should handle other errors', async () => {
      mockGetScheduleUseCase.execute.mockRejectedValue(new Error('Database error'));

      mockRequest.params = { scheduleId: 'test-id' };

      await controller.getSchedule(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        error: 'Database error'
      });
    });
  });

  describe('getScheduleRuns', () => {
    it('should get schedule runs with default pagination', async () => {
      const mockResult = { runs: [], total: 0 };
      mockGetScheduleRunsUseCase.execute.mockResolvedValue(mockResult);

      mockRequest.params = { scheduleId: 'test-id' };
      mockRequest.query = {};

      await controller.getScheduleRuns(mockRequest as Request, mockResponse as Response);

      expect(mockGetScheduleRunsUseCase.execute).toHaveBeenCalledWith({
        scheduleId: 'test-id',
        limit: 100,
        offset: 0
      });
      expect(statusMock).toHaveBeenCalledWith(200);
    });

    it('should get schedule runs with custom pagination', async () => {
      const mockResult = { runs: [], total: 0 };
      mockGetScheduleRunsUseCase.execute.mockResolvedValue(mockResult);

      mockRequest.params = { scheduleId: 'test-id' };
      mockRequest.query = { limit: '50', offset: '100' };

      await controller.getScheduleRuns(mockRequest as Request, mockResponse as Response);

      expect(mockGetScheduleRunsUseCase.execute).toHaveBeenCalledWith({
        scheduleId: 'test-id',
        limit: 50,
        offset: 100
      });
    });

    it('should handle use case error', async () => {
      mockGetScheduleRunsUseCase.execute.mockRejectedValue(new Error('Query failed'));

      mockRequest.params = { scheduleId: 'test-id' };

      await controller.getScheduleRuns(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        error: 'Query failed'
      });
    });
  });

  describe('runNow', () => {
    it('should trigger run now successfully', async () => {
      const mockResult = {
        runId: 'run-id',
        scheduleId: 'test-id',
        dueAtUtc: '2025-01-07T10:00:00Z',
        status: 'DUE'
      };
      mockRunNowUseCase.execute.mockResolvedValue(mockResult);

      mockRequest.params = { scheduleId: 'test-id' };

      await controller.runNow(mockRequest as Request, mockResponse as Response);

      expect(mockRunNowUseCase.execute).toHaveBeenCalledWith({ scheduleId: 'test-id' });
      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        data: mockResult
      });
    });

    it('should return 404 if schedule not found', async () => {
      mockRunNowUseCase.execute.mockRejectedValue(new Error('Schedule not found'));

      mockRequest.params = { scheduleId: 'non-existent-id' };

      await controller.runNow(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(404);
    });

    it('should return 400 if schedule not active', async () => {
      mockRunNowUseCase.execute.mockRejectedValue(new Error('Schedule is not active'));

      mockRequest.params = { scheduleId: 'test-id' };

      await controller.runNow(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        error: 'Schedule is not active'
      });
    });
  });

  describe('healthCheck', () => {
    it('should return health status', async () => {
      await controller.healthCheck(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'healthy',
          service: 'scheduler-service',
          version: '1.0.0'
        })
      );
    });
  });

  describe('listSchedules', () => {
    it('should list schedules successfully', async () => {
      const mockResult = { schedules: [], total: 0, limit: 100, offset: 0 };
      mockListSchedulesUseCase.execute.mockResolvedValue(mockResult);

      mockRequest.query = { tenantId: 'test-tenant', ownerService: 'test-service' };

      await controller.listSchedules(mockRequest as Request, mockResponse as Response);

      expect(mockListSchedulesUseCase.execute).toHaveBeenCalledWith({
        tenantId: 'test-tenant',
        ownerService: 'test-service',
        ownerResourceType: undefined,
        ownerResourceId: undefined,
        policyTag: undefined,
        limit: 100,
        offset: 0
      });
      expect(statusMock).toHaveBeenCalledWith(200);
    });

    it('should return 400 if tenantId is missing', async () => {
      mockRequest.query = {};

      await controller.listSchedules(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        error: 'tenantId is required'
      });
    });

    it('should list schedules with custom pagination', async () => {
      const mockResult = { schedules: [], total: 0, limit: 50, offset: 100 };
      mockListSchedulesUseCase.execute.mockResolvedValue(mockResult);

      mockRequest.query = { tenantId: 'test-tenant', limit: '50', offset: '100' };

      await controller.listSchedules(mockRequest as Request, mockResponse as Response);

      expect(mockListSchedulesUseCase.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          limit: 50,
          offset: 100
        })
      );
    });

    it('should handle use case error', async () => {
      mockListSchedulesUseCase.execute.mockRejectedValue(new Error('Query failed'));

      mockRequest.query = { tenantId: 'test-tenant' };

      await controller.listSchedules(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
    });
  });

  describe('updateSchedule', () => {
    it('should update schedule successfully', async () => {
      const mockResult = {
        scheduleId: 'test-id',
        tenantId: 'tenant-1',
        dedupKey: 'dedup-1',
        ownerService: 'test-service',
        ownerResourceType: 'test-resource',
        ownerResourceId: 'resource-1',
        policyTag: 'default',
        topicOrCommand: 'test.topic',
        payloadJson: { updated: true },
        scheduleType: 'CRON',
        status: 'ACTIVE',
        endAtUtc: null,
        maxRuns: null,
        createdAtUtc: '2025-01-01T00:00:00Z',
        updatedAtUtc: '2025-01-07T00:00:00Z'
      };
      mockUpdateScheduleUseCase.execute.mockResolvedValue(mockResult);

      mockRequest.params = { scheduleId: 'test-id' };
      mockRequest.body = { payloadJson: { updated: true } };

      await controller.updateSchedule(mockRequest as Request, mockResponse as Response);

      expect(mockUpdateScheduleUseCase.execute).toHaveBeenCalledWith({
        scheduleId: 'test-id',
        payloadJson: { updated: true },
        endAtUtc: undefined,
        maxRuns: undefined
      });
      expect(statusMock).toHaveBeenCalledWith(200);
    });

    it('should return 404 if schedule not found', async () => {
      mockUpdateScheduleUseCase.execute.mockRejectedValue(new Error('Schedule not found'));

      mockRequest.params = { scheduleId: 'non-existent-id' };
      mockRequest.body = {};

      await controller.updateSchedule(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(404);
    });

    it('should handle endAtUtc conversion', async () => {
      const mockResult = {
        scheduleId: 'test-id',
        tenantId: 'tenant-1',
        dedupKey: 'dedup-1',
        ownerService: 'test-service',
        ownerResourceType: 'test-resource',
        ownerResourceId: 'resource-1',
        policyTag: 'default',
        topicOrCommand: 'test.topic',
        payloadJson: {},
        scheduleType: 'CRON',
        status: 'ACTIVE',
        endAtUtc: '2025-12-31T23:59:59Z',
        maxRuns: null,
        createdAtUtc: '2025-01-01T00:00:00Z',
        updatedAtUtc: '2025-01-07T00:00:00Z'
      };
      mockUpdateScheduleUseCase.execute.mockResolvedValue(mockResult);

      mockRequest.params = { scheduleId: 'test-id' };
      mockRequest.body = { endAtUtc: '2025-12-31T23:59:59Z' };

      await controller.updateSchedule(mockRequest as Request, mockResponse as Response);

      expect(mockUpdateScheduleUseCase.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          endAtUtc: new Date('2025-12-31T23:59:59Z')
        })
      );
    });
  });

  describe('deleteSchedule', () => {
    it('should delete schedule successfully', async () => {
      const mockResult = { scheduleId: 'test-id', deleted: true };
      mockDeleteScheduleUseCase.execute.mockResolvedValue(mockResult);

      mockRequest.params = { scheduleId: 'test-id' };

      await controller.deleteSchedule(mockRequest as Request, mockResponse as Response);

      expect(mockDeleteScheduleUseCase.execute).toHaveBeenCalledWith({ scheduleId: 'test-id' });
      expect(statusMock).toHaveBeenCalledWith(200);
    });

    it('should return 404 if schedule not found', async () => {
      mockDeleteScheduleUseCase.execute.mockRejectedValue(new Error('Schedule not found'));

      mockRequest.params = { scheduleId: 'non-existent-id' };

      await controller.deleteSchedule(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(404);
    });
  });

  describe('getRun', () => {
    it('should get run successfully', async () => {
      const mockResult = {
        runId: 'run-id',
        scheduleId: 'schedule-id',
        tenantId: 'tenant-1',
        dueAtUtc: '2025-01-07T10:00:00Z',
        status: 'SUCCEEDED',
        segment: null,
        lockedBy: null,
        lockedAtUtc: null,
        startedAtUtc: '2025-01-07T10:00:00Z',
        finishedAtUtc: '2025-01-07T10:00:05Z',
        lastError: null,
        attempt: 0,
        createdAtUtc: '2025-01-07T09:00:00Z',
        updatedAtUtc: '2025-01-07T10:00:05Z'
      };
      mockGetRunUseCase.execute.mockResolvedValue(mockResult);

      mockRequest.params = { runId: 'run-id' };

      await controller.getRun(mockRequest as Request, mockResponse as Response);

      expect(mockGetRunUseCase.execute).toHaveBeenCalledWith({ runId: 'run-id' });
      expect(statusMock).toHaveBeenCalledWith(200);
    });

    it('should return 404 if run not found', async () => {
      mockGetRunUseCase.execute.mockRejectedValue(new Error('Run not found'));

      mockRequest.params = { runId: 'non-existent-id' };

      await controller.getRun(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(404);
    });
  });

  describe('retryRun', () => {
    it('should retry run successfully', async () => {
      const mockResult = {
        runId: 'run-id',
        scheduleId: 'schedule-id',
        status: 'DUE',
        attempt: 1,
        retriedAtUtc: '2025-01-07T10:00:00Z'
      };
      mockRetryRunUseCase.execute.mockResolvedValue(mockResult);

      mockRequest.params = { runId: 'run-id' };

      await controller.retryRun(mockRequest as Request, mockResponse as Response);

      expect(mockRetryRunUseCase.execute).toHaveBeenCalledWith({ runId: 'run-id' });
      expect(statusMock).toHaveBeenCalledWith(200);
    });

    it('should return 404 if run not found', async () => {
      mockRetryRunUseCase.execute.mockRejectedValue(new Error('Run not found'));

      mockRequest.params = { runId: 'non-existent-id' };

      await controller.retryRun(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(404);
    });

    it('should return 400 if cannot retry', async () => {
      mockRetryRunUseCase.execute.mockRejectedValue(new Error('Cannot retry run in SUCCEEDED status'));

      mockRequest.params = { runId: 'run-id' };

      await controller.retryRun(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        error: 'Cannot retry run in SUCCEEDED status'
      });
    });
  });
});

