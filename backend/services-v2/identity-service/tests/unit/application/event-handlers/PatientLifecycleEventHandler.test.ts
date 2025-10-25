/**
 * Unit Tests for PatientLifecycleEventHandler
 * Tests event handling from Patient Registry Service
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, High Test Coverage
 */

import { PatientLifecycleEventHandler } from '@application/event-handlers/PatientLifecycleEventHandler';
import { DeactivateUserUseCase } from '@application/use-cases/DeactivateUserUseCase';
import { InboxService } from '@infrastructure/inbox/InboxService';

describe('PatientLifecycleEventHandler', () => {
  let handler: PatientLifecycleEventHandler;
  let mockDeactivateUserUseCase: jest.Mocked<DeactivateUserUseCase>;
  let mockInboxService: jest.Mocked<InboxService>;
  let mockLogger: any;

  beforeEach(() => {
    mockDeactivateUserUseCase = { execute: jest.fn() } as any;
    mockInboxService = {
      checkProcessed: jest.fn(),
      storeEvent: jest.fn(),
      markProcessed: jest.fn(),
      markFailed: jest.fn()
    } as any;

    mockLogger = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn()
    };

    handler = new PatientLifecycleEventHandler(
      mockDeactivateUserUseCase,
      mockInboxService,
      mockLogger
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('handlePatientDeceased', () => {
    const mockEvent = {
      eventId: 'evt-701',
      patientId: 'patient-123',
      userId: 'user-456',
      deceasedDate: new Date('2025-01-01T00:00:00Z'),
      deathCertificateNumber: 'DC-789',
      recordedBy: 'admin-123',
      occurredAt: new Date('2025-01-01T10:00:00Z')
    };

    it('should permanently deactivate user account when patient deceased', async () => {
      mockInboxService.checkProcessed.mockResolvedValue(false);
      mockInboxService.storeEvent.mockResolvedValue({
        isNew: true,
        inboxId: 'inbox-1',
        status: 'PENDING'
      });

      await handler.handlePatientDeceased(mockEvent);

      expect(mockInboxService.checkProcessed).toHaveBeenCalledWith('evt-701');
      expect(mockInboxService.storeEvent).toHaveBeenCalledWith({
        eventId: 'evt-701',
        eventType: 'PatientDeceasedEvent',
        aggregateId: 'patient-123',
        aggregateType: 'Patient',
        payloadJson: mockEvent,
        sourceService: 'patient-registry-service',
        routingKey: 'patient.deceased',
        occurredAt: mockEvent.occurredAt
      });
      expect(mockDeactivateUserUseCase.execute).toHaveBeenCalledWith({
        userId: 'user-456',
        reason: expect.stringContaining('Patient deceased'),
        deactivatedBy: 'admin-123'
      });
      expect(mockInboxService.markProcessed).toHaveBeenCalledWith('evt-701');
      expect(mockLogger.info).toHaveBeenCalled();
    });

    it('should skip if event already processed (idempotency)', async () => {
      mockInboxService.checkProcessed.mockResolvedValue(true);

      await handler.handlePatientDeceased(mockEvent);

      expect(mockInboxService.checkProcessed).toHaveBeenCalledWith('evt-701');
      expect(mockInboxService.storeEvent).not.toHaveBeenCalled();
      expect(mockDeactivateUserUseCase.execute).not.toHaveBeenCalled();
      expect(mockLogger.debug).toHaveBeenCalledWith('Event already processed', { eventId: 'evt-701' });
    });

    it('should mark as failed on error', async () => {
      mockInboxService.checkProcessed.mockResolvedValue(false);
      mockInboxService.storeEvent.mockRejectedValue(new Error('Database error'));

      await expect(handler.handlePatientDeceased(mockEvent)).rejects.toThrow('Database error');

      expect(mockInboxService.markFailed).toHaveBeenCalledWith('evt-701', 'Database error');
      expect(mockLogger.error).toHaveBeenCalled();
    });

    it('should handle use case failure gracefully', async () => {
      mockInboxService.checkProcessed.mockResolvedValue(false);
      mockInboxService.storeEvent.mockResolvedValue({
        isNew: true,
        inboxId: 'inbox-2',
        status: 'PENDING'
      });
      mockDeactivateUserUseCase.execute.mockRejectedValue(new Error('User not found'));

      await expect(handler.handlePatientDeceased(mockEvent)).rejects.toThrow('User not found');

      expect(mockInboxService.markFailed).toHaveBeenCalledWith('evt-701', 'User not found');
      expect(mockLogger.error).toHaveBeenCalled();
    });
  });
});
