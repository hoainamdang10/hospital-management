import { IdentityEventConsumer } from '@/infrastructure/events/IdentityEventConsumer';
import { ILogger } from '@/application/services/ILogger';

const createLogger = (): jest.Mocked<ILogger> => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
  fatal: jest.fn()
});

const buildHandlers = () => ({
  staffCredentialHandler: {
    handleStaffCredentialVerified: jest.fn(),
    handleStaffStatusChanged: jest.fn(),
    handleStaffCredentialExpired: jest.fn(),
    handleStaffLicenseRevoked: jest.fn(),
    handleStaffPerformanceFlagged: jest.fn(),
    handleStaffDepartmentChanged: jest.fn(),
    handleStaffScheduleUpdated: jest.fn()
  },
  billingFraudHandler: {
    handlePaymentFailed: jest.fn(),
    handleInvoiceOverdue: jest.fn(),
    handleInsuranceFraudDetected: jest.fn()
  },
  appointmentAbuseHandler: {
    handleAppointmentNoShow: jest.fn(),
    handleAppointmentRescheduled: jest.fn(),
    handleAppointmentCompleted: jest.fn(),
    handleAppointmentAbuseDetected: jest.fn()
  },
  clinicalComplianceHandler: {
    handlePrescriptionAbuseDetected: jest.fn(),
    handleMedicalRecordAnomalyDetected: jest.fn(),
    handleClinicalRiskFlagged: jest.fn()
  },
  staffLifecycleHandler: {
    handleStaffRegistered: jest.fn(),
    handleStaffOffboarded: jest.fn(),
    handleStaffReinstated: jest.fn()
  },
  notificationHandler: {
    handleNotificationDeliveryFailed: jest.fn()
  },
  patientLifecycleHandler: {
    handlePatientDeceased: jest.fn(),
    handlePatientMerged: jest.fn(),
    handlePatientTransferred: jest.fn()
  }
});

const config = {
  rabbitmqUrl: 'amqp://localhost',
  exchange: 'hospital.events',
  queueName: 'identity-service',
  routingKeys: ['staff.credential_verified']
};

const buildConsumer = () => {
  const logger = createLogger();
  const handlers = buildHandlers();

  const consumer = new IdentityEventConsumer(
    config,
    logger,
    handlers.staffCredentialHandler as any,
    handlers.billingFraudHandler as any,
    handlers.appointmentAbuseHandler as any,
    handlers.clinicalComplianceHandler as any,
    handlers.staffLifecycleHandler as any,
    handlers.notificationHandler as any,
    handlers.patientLifecycleHandler as any
  );

  return { consumer, logger, handlers };
};

const createMessage = (routingKey: string, payload: any, overrides: any = {}) =>
  ({
    content: Buffer.from(
      JSON.stringify({
        eventId: 'evt-001',
        aggregateId: payload.staffId || payload.userId || 'entity-1',
        payload
      })
    ),
    fields: { routingKey },
    properties: { messageId: 'msg-001', ...overrides }
  } as any);

describe('IdentityEventConsumer.handleMessage', () => {
  it('gọi handler staffCredentialHandler khi nhận staff.credential_verified', async () => {
    const { consumer, handlers } = buildConsumer();

    const message = createMessage('staff.credential_verified', {
      staffId: 'STF-001',
      credentialNumber: 'CRED-001',
      credentialType: 'medical_license',
      issuingAuthority: 'MOH',
      verifiedAt: '2025-01-01T00:00:00Z'
    });

    await (consumer as any).handleMessage(message);

    expect(handlers.staffCredentialHandler.handleStaffCredentialVerified).toHaveBeenCalledWith(
      expect.objectContaining({
        staffId: 'STF-001',
        credentialNumber: 'CRED-001',
        verifiedAt: expect.any(Date)
      })
    );
  });

  it('ghi cảnh báo khi nhận routing key không hỗ trợ', async () => {
    const { consumer, logger } = buildConsumer();

    const message = createMessage('unknown.event', {});

    await (consumer as any).handleMessage(message);

    expect(logger.warn).toHaveBeenCalledWith('Unknown routing key', {
      routingKey: 'unknown.event',
      eventType: undefined
    });
  });

  it('ghi lỗi và ném exception khi handler trả lỗi', async () => {
    const { consumer, handlers, logger } = buildConsumer();
    handlers.staffCredentialHandler.handleStaffCredentialVerified.mockRejectedValue(new Error('handler failed'));

    const message = createMessage('staff.credential_verified', {
      staffId: 'STF-002',
      credentialNumber: 'CRED-002',
      credentialType: 'license',
      issuingAuthority: 'MOH',
      verifiedAt: '2025-02-01T00:00:00Z'
    });

    await expect((consumer as any).handleMessage(message)).rejects.toThrow('handler failed');
    expect(logger.error).toHaveBeenCalledWith('Error parsing or handling message', {
      error: 'handler failed',
      routingKey: 'staff.credential_verified',
      messageId: 'msg-001'
    });
  });
});
