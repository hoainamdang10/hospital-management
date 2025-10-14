/**
 * Appointment Aggregate Unit Tests
 * V3 Clean Architecture + DDD Implementation
 *
 * @author Hospital Management Team
 * @version 3.0.0
 */

import { Appointment, AppointmentType, AppointmentPriority, AppointmentStatus } from '../../../src/domain/aggregates/Appointment.aggregate';
import { AppointmentId } from '../../../src/domain/value-objects/AppointmentId.vo';
import { TimeSlot } from '../../../src/domain/value-objects/TimeSlot.vo';
import { AppointmentDetails } from '../../../src/domain/value-objects/AppointmentDetails.vo';

// Helper to get future date
function getFutureDate(daysAhead: number = 1): string {
  const date = new Date();
  date.setDate(date.getDate() + daysAhead);
  return date.toISOString().split('T')[0];
}

describe('Appointment Aggregate', () => {
  describe('create', () => {
    it('should create appointment with valid data', () => {
      const appointmentId = AppointmentId.generate();
      const timeSlot = TimeSlot.create(getFutureDate(), '09:00:00');
      const details = AppointmentDetails.create('Khám tổng quát', 'Đau đầu', ['Sốt', 'Mệt mỏi']);

      const appointment = Appointment.create(
        appointmentId,
        'patient-123',
        'doctor-456',
        timeSlot,
        30,
        AppointmentType.CONSULTATION,
        AppointmentPriority.ROUTINE,
        details,
        200000,
        'user-789'
      );

      expect(appointment).toBeDefined();
      expect(appointment.appointmentId).toBe(appointmentId);
      expect(appointment.patientId).toBe('patient-123');
      expect(appointment.doctorId).toBe('doctor-456');
      expect(appointment.status).toBe(AppointmentStatus.SCHEDULED);
      expect(appointment.consultationFee).toBe(200000);
    });

    it('should throw error when duration is invalid', () => {
      const appointmentId = AppointmentId.generate();
      const timeSlot = TimeSlot.create(getFutureDate(), '09:00:00');
      const details = AppointmentDetails.create('Khám tổng quát');

      expect(() => {
        Appointment.create(
          appointmentId,
          'patient-123',
          'doctor-456',
          timeSlot,
          0, // Invalid duration
          AppointmentType.CONSULTATION,
          AppointmentPriority.ROUTINE,
          details,
          200000,
          'user-789'
        );
      }).toThrow('Duration must be between 1 and 480 minutes');
    });

    it('should throw error when consultation fee is negative', () => {
      const appointmentId = AppointmentId.generate();
      const timeSlot = TimeSlot.create(getFutureDate(), '09:00:00');
      const details = AppointmentDetails.create('Khám tổng quát');

      expect(() => {
        Appointment.create(
          appointmentId,
          'patient-123',
          'doctor-456',
          timeSlot,
          30,
          AppointmentType.CONSULTATION,
          AppointmentPriority.ROUTINE,
          details,
          -100000, // Negative fee
          'user-789'
        );
      }).toThrow('Consultation fee cannot be negative');
    });
  });

  describe('confirm', () => {
    it('should confirm appointment', () => {
      const appointment = createTestAppointment();

      appointment.confirm('user-123');

      expect(appointment.getStatus()).toBe(AppointmentStatus.CONFIRMED);
      expect(appointment.getConfirmedAt()).toBeDefined();
      expect(appointment.getConfirmedBy()).toBe('user-123');
    });

    it('should throw error when confirming cancelled appointment', () => {
      const appointment = createTestAppointment();
      appointment.cancel('Bệnh nhân hủy', 'user-123');

      expect(() => {
        appointment.confirm('user-456');
      }).toThrow('Only scheduled appointments can be confirmed');
    });
  });

  describe('cancel', () => {
    it('should cancel appointment', () => {
      const appointment = createTestAppointment();

      appointment.cancel('Bệnh nhân hủy', 'user-123');

      expect(appointment.getStatus()).toBe(AppointmentStatus.CANCELLED);
      expect(appointment.getCancelledAt()).toBeDefined();
      expect(appointment.getCancellationReason()).toBe('Bệnh nhân hủy');
      expect(appointment.getCancelledBy()).toBe('user-123');
    });

    it('should throw error when cancelling completed appointment', () => {
      const appointment = createTestAppointment();
      appointment.confirm('user-123');
      appointment.checkIn();
      appointment.start();
      appointment.complete();

      expect(() => {
        appointment.cancel('Test', 'user-456');
      }).toThrow('Cannot cancel completed appointment');
    });
  });

  describe('checkIn', () => {
    it('should check in confirmed appointment', () => {
      const appointment = createTestAppointment();
      appointment.confirm('user-123');

      appointment.checkIn();

      expect(appointment.getStatus()).toBe(AppointmentStatus.ARRIVED);
      expect(appointment.getCheckedInAt()).toBeDefined();
    });

    it('should throw error when checking in unconfirmed appointment', () => {
      const appointment = createTestAppointment();

      expect(() => {
        appointment.checkIn();
      }).toThrow('Only confirmed appointments can be checked in');
    });
  });

  describe('start', () => {
    it('should start appointment after check-in', () => {
      const appointment = createTestAppointment();
      appointment.confirm('user-123');
      appointment.checkIn();

      appointment.start();

      expect(appointment.getStatus()).toBe(AppointmentStatus.IN_PROGRESS);
      expect(appointment.getStartedAt()).toBeDefined();
    });

    it('should throw error when starting without check-in', () => {
      const appointment = createTestAppointment();
      appointment.confirm('user-123');

      expect(() => {
        appointment.start();
      }).toThrow('Patient must be checked in before starting appointment');
    });
  });

  describe('complete', () => {
    it('should complete appointment', () => {
      const appointment = createTestAppointment();
      appointment.confirm('user-123');
      appointment.checkIn();
      appointment.start();

      appointment.complete();

      expect(appointment.getStatus()).toBe(AppointmentStatus.COMPLETED);
      expect(appointment.getCompletedAt()).toBeDefined();
    });

    it('should throw error when completing without starting', () => {
      const appointment = createTestAppointment();
      appointment.confirm('user-123');
      appointment.checkIn();

      expect(() => {
        appointment.complete();
      }).toThrow('Only in-progress appointments can be completed');
    });
  });

  describe('markAsNoShow', () => {
    it('should mark appointment as no-show', () => {
      const appointment = createTestAppointment();
      appointment.confirm('user-123');

      appointment.markAsNoShow();

      expect(appointment.getStatus()).toBe(AppointmentStatus.NO_SHOW);
    });
  });

  describe('reschedule', () => {
    it('should reschedule appointment', () => {
      const appointment = createTestAppointment();
      const newTimeSlot = TimeSlot.create(getFutureDate(7), '14:00:00');

      appointment.reschedule(newTimeSlot, 'Patient requested time change', 'user-123');

      expect(appointment.getTimeSlot()).toBe(newTimeSlot);
      expect(appointment.getLastModifiedBy()).toBe('user-123');
    });

    it('should throw error when rescheduling completed appointment', () => {
      const appointment = createTestAppointment();
      appointment.confirm('user-123');
      appointment.checkIn();
      appointment.start();
      appointment.complete();

      const newTimeSlot = TimeSlot.create(getFutureDate(7), '14:00:00');

      expect(() => {
        appointment.reschedule(newTimeSlot, 'Patient requested time change', 'user-456');
      }).toThrow('Cannot reschedule completed appointment');
    });
  });
});

// Helper function
function createTestAppointment(): Appointment {
  const appointmentId = AppointmentId.generate();
  const timeSlot = TimeSlot.create(getFutureDate(), '09:00:00');
  const details = AppointmentDetails.create('Khám tổng quát');

  return Appointment.create(
    appointmentId,
    'patient-123',
    'doctor-456',
    timeSlot,
    30,
    AppointmentType.CONSULTATION,
    AppointmentPriority.ROUTINE,
    details,
    200000,
    'user-789'
  );
}

