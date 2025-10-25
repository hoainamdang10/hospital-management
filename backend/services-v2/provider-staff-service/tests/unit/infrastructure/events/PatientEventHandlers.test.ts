import { PatientRegisteredEventHandler } from '../../../../src/infrastructure/events/PatientRegisteredEventHandler';
import { PatientUpdatedEventHandler } from '../../../../src/infrastructure/events/PatientUpdatedEventHandler';
import { createMockLogger } from '../../../helpers/mockFactories';

describe('Patient Event Handlers', () => {
  let logger: ReturnType<typeof createMockLogger>;

  beforeEach(() => {
    logger = createMockLogger();
    jest.clearAllMocks();
  });

  describe('PatientRegisteredEventHandler', () => {
    const eventData = {
      patientId: 'PAT-100',
      fullName: 'Nguyễn Văn A',
      dateOfBirth: '1990-01-01',
      gender: 'male',
      phoneNumber: '0901234567',
      email: 'patient@example.com',
      registeredAt: new Date().toISOString()
    };

    it('ghi log khi xử lý sự kiện đăng ký bệnh nhân', async () => {
      const handler = new PatientRegisteredEventHandler(logger);

      await handler.handle(eventData);

      expect(logger.info).toHaveBeenCalledWith(
        'Handling PatientRegistered event',
        expect.objectContaining({
          patientId: eventData.patientId,
          fullName: eventData.fullName
        })
      );
      expect(logger.error).not.toHaveBeenCalled();
    });

    it('ghi lỗi khi xảy ra exception', async () => {
      const handler = new PatientRegisteredEventHandler(logger);
      logger.info.mockImplementationOnce(() => {
        throw new Error('log failed');
      });

      await expect(handler.handle(eventData)).rejects.toThrow('log failed');
      expect(logger.error).toHaveBeenCalledWith(
        'Error handling PatientRegistered event',
        expect.objectContaining({
          error: 'log failed',
          patientId: eventData.patientId
        })
      );
    });
  });

  describe('PatientUpdatedEventHandler', () => {
    const eventData = {
      patientId: 'PAT-200',
      updatedFields: { phoneNumber: '0912345678', address: 'Hanoi' },
      updatedBy: 'nurse-1',
      updatedAt: new Date().toISOString()
    };

    it('ghi log cập nhật bệnh nhân', async () => {
      const handler = new PatientUpdatedEventHandler(logger);

      await handler.handle(eventData);

      expect(logger.info).toHaveBeenCalledWith(
        'Patient information updated',
        expect.objectContaining({
          patientId: eventData.patientId,
          updatedFields: Object.keys(eventData.updatedFields)
        })
      );
    });

    it('ghi lỗi khi có exception', async () => {
      const handler = new PatientUpdatedEventHandler(logger);
      logger.info.mockImplementationOnce(() => {
        throw new Error('write failed');
      });

      await expect(handler.handle(eventData)).rejects.toThrow('write failed');
      expect(logger.error).toHaveBeenCalledWith(
        'Error handling PatientUpdated event',
        expect.objectContaining({
          error: 'write failed',
          patientId: eventData.patientId
        })
      );
    });
  });
});

