import { AppointmentScheduledEventHandler } from '../../../../src/infrastructure/events/AppointmentScheduledEventHandler';
import { AppointmentCancelledEventHandler } from '../../../../src/infrastructure/events/AppointmentCancelledEventHandler';
import { AppointmentCompletedEventHandler } from '../../../../src/infrastructure/events/AppointmentCompletedEventHandler';
import { createMockLogger, createMockStaffRepository, createTestStaff } from '../../../helpers/mockFactories';

describe('Appointment Event Handlers', () => {
  const doctorId = 'DOC-CARD-202501-001';
  const baseScheduledEvent = {
    appointmentId: 'APT-001',
    doctorId,
    patientId: 'PAT-001',
    scheduledTime: new Date().toISOString(),
    duration: 30,
    appointmentType: 'consultation',
    status: 'scheduled'
  };

  const baseCancelledEvent = {
    appointmentId: 'APT-002',
    doctorId,
    cancelledBy: 'patient',
    cancellationReason: 'Sick',
    cancelledAt: new Date().toISOString()
  };

  const baseCompletedEvent = {
    appointmentId: 'APT-003',
    doctorId,
    patientId: 'PAT-002',
    completedAt: new Date().toISOString(),
    duration: 45
  };

  let repository: ReturnType<typeof createMockStaffRepository>;
  let logger: ReturnType<typeof createMockLogger>;
  const staff = createTestStaff({ staffId: doctorId });

  beforeEach(() => {
    repository = createMockStaffRepository();
    logger = createMockLogger();
    jest.clearAllMocks();
  });

  describe('AppointmentScheduledEventHandler', () => {
    it('ghi log khi tìm thấy nhân viên', async () => {
      repository.findById.mockResolvedValue(staff);
      const handler = new AppointmentScheduledEventHandler(repository as any, logger);

      await handler.handle(baseScheduledEvent);

      expect(repository.findById).toHaveBeenCalled();
      expect(logger.info).toHaveBeenCalledWith(
        'Appointment scheduled for staff',
        expect.objectContaining({
          staffId: staff.id,
          appointmentId: baseScheduledEvent.appointmentId
        })
      );
      expect(logger.warn).not.toHaveBeenCalled();
    });

    it('ghi cảnh báo khi không tìm thấy nhân viên', async () => {
      repository.findById.mockResolvedValue(null);
      const handler = new AppointmentScheduledEventHandler(repository as any, logger);

      await handler.handle(baseScheduledEvent);

      expect(logger.warn).toHaveBeenCalledWith(
        'Staff not found for appointment',
        expect.objectContaining({
          doctorId: doctorId,
          appointmentId: baseScheduledEvent.appointmentId
        })
      );
    });

    it('ném lỗi và ghi log khi repository lỗi', async () => {
      repository.findById.mockRejectedValue(new Error('db down'));
      const handler = new AppointmentScheduledEventHandler(repository as any, logger);

      await expect(handler.handle(baseScheduledEvent)).rejects.toThrow('db down');
      expect(logger.error).toHaveBeenCalledWith(
        'Error handling AppointmentScheduled event',
        expect.objectContaining({ error: 'db down' })
      );
    });
  });

  describe('AppointmentCancelledEventHandler', () => {
    it('ghi log hủy lịch hẹn khi nhân viên tồn tại', async () => {
      repository.findById.mockResolvedValue(staff);
      const handler = new AppointmentCancelledEventHandler(repository as any, logger);

      await handler.handle(baseCancelledEvent);

      expect(logger.info).toHaveBeenCalledWith(
        'Appointment cancelled for staff',
        expect.objectContaining({
          staffId: staff.id,
          appointmentId: baseCancelledEvent.appointmentId,
          cancellationReason: baseCancelledEvent.cancellationReason
        })
      );
    });

    it('ghi cảnh báo khi không tìm thấy nhân viên bị hủy', async () => {
      repository.findById.mockResolvedValue(null);
      const handler = new AppointmentCancelledEventHandler(repository as any, logger);

      await handler.handle(baseCancelledEvent);

      expect(logger.warn).toHaveBeenCalledWith(
        'Staff not found for cancelled appointment',
        expect.objectContaining({
          doctorId: doctorId,
          appointmentId: baseCancelledEvent.appointmentId
        })
      );
    });
  });

  describe('AppointmentCompletedEventHandler', () => {
    it('ghi log hoàn tất lịch hẹn khi nhân viên tồn tại', async () => {
      repository.findById.mockResolvedValue(staff);
      const handler = new AppointmentCompletedEventHandler(repository as any, logger);

      await handler.handle(baseCompletedEvent);

      expect(logger.info).toHaveBeenCalledWith(
        'Appointment completed by staff',
        expect.objectContaining({
          staffId: staff.id,
          patientId: baseCompletedEvent.patientId
        })
      );
    });

    it('ghi cảnh báo khi không tìm thấy nhân viên hoàn tất lịch', async () => {
      repository.findById.mockResolvedValue(null);
      const handler = new AppointmentCompletedEventHandler(repository as any, logger);

      await handler.handle(baseCompletedEvent);

      expect(logger.warn).toHaveBeenCalledWith(
        'Staff not found for completed appointment',
        expect.objectContaining({
          doctorId: doctorId,
          appointmentId: baseCompletedEvent.appointmentId
        })
      );
    });

    it('ném lỗi khi repository lỗi', async () => {
      repository.findById.mockRejectedValue(new Error('query failed'));
      const handler = new AppointmentCompletedEventHandler(repository as any, logger);

      await expect(handler.handle(baseCompletedEvent)).rejects.toThrow('query failed');
      expect(logger.error).toHaveBeenCalledWith(
        'Error handling AppointmentCompleted event',
        expect.objectContaining({ error: 'query failed' })
      );
    });
  });
});

