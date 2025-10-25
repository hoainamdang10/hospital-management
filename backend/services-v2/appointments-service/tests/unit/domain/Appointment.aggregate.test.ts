/**
 * Appointment Aggregate Tests
 * Unit tests for Appointment aggregate root
 *
 * @author Hospital Management Team
 * @version 3.0.0
 */

import { Appointment, AppointmentType, AppointmentPriority, AppointmentStatus } from '../../../src/domain/aggregates/Appointment.aggregate';
import { AppointmentId } from '../../../src/domain/value-objects/AppointmentId.vo';
import { TimeSlot } from '../../../src/domain/value-objects/TimeSlot.vo';
import { AppointmentDetails } from '../../../src/domain/value-objects/AppointmentDetails.vo';
import { TenantId } from '../../../src/domain/value-objects/TenantId.vo';

describe('Appointment Aggregate', () => {
  const createTestAppointment = (): Appointment => {
    const appointmentId = AppointmentId.generate();
    const tenantId = TenantId.createDefault();
    const timeSlot = TimeSlot.create('2025-12-01', '10:00:00');
    const details = AppointmentDetails.create('Routine checkup');

    return Appointment.create(
      appointmentId,
      tenantId,
      'PAT-001',
      'DOC-001',
      timeSlot,
      30,
      AppointmentType.CONSULTATION,
      AppointmentPriority.NORMAL,
      details,
      200000,
      'user-123'
    );
  };

  describe('create', () => {
    it('should create appointment with valid data', () => {
      const appointment = createTestAppointment();

      expect(appointment).toBeDefined();
      expect(appointment.getStatus()).toBe(AppointmentStatus.SCHEDULED);
      expect(appointment.getDurationMinutes()).toBe(30);
      expect(appointment.getConsultationFee()).toBe(200000);
    });

    it('should reject appointment with negative duration', () => {
      const appointmentId = AppointmentId.generate();
      const tenantId = TenantId.createDefault();
      const timeSlot = TimeSlot.create('2025-12-01', '10:00:00');
      const details = AppointmentDetails.create('Test');

      expect(() => {
        Appointment.create(
          appointmentId,
          tenantId,
          'PAT-001',
          'DOC-001',
          timeSlot,
          -10, // Invalid duration
          AppointmentType.CONSULTATION,
          AppointmentPriority.NORMAL,
          details,
          200000,
          'user-123'
        );
      }).toThrow('Duration must be between 1 and 480 minutes');
    });

    it('should reject appointment with duration > 480 minutes', () => {
      const appointmentId = AppointmentId.generate();
      const tenantId = TenantId.createDefault();
      const timeSlot = TimeSlot.create('2025-12-01', '10:00:00');
      const details = AppointmentDetails.create('Test');

      expect(() => {
        Appointment.create(
          appointmentId,
          tenantId,
          'PAT-001',
          'DOC-001',
          timeSlot,
          500, // Too long
          AppointmentType.CONSULTATION,
          AppointmentPriority.NORMAL,
          details,
          200000,
          'user-123'
        );
      }).toThrow('Duration must be between 1 and 480 minutes');
    });

    it('should reject appointment with negative fee', () => {
      const appointmentId = AppointmentId.generate();
      const tenantId = TenantId.createDefault();
      const timeSlot = TimeSlot.create('2025-12-01', '10:00:00');
      const details = AppointmentDetails.create('Test');

      expect(() => {
        Appointment.create(
          appointmentId,
          tenantId,
          'PAT-001',
          'DOC-001',
          timeSlot,
          30,
          AppointmentType.CONSULTATION,
          AppointmentPriority.NORMAL,
          details,
          -100, // Negative fee
          'user-123'
        );
      }).toThrow('Consultation fee cannot be negative');
    });

    it('should reject appointment in the past', () => {
      const appointmentId = AppointmentId.generate();
      const tenantId = TenantId.createDefault();
      const pastTimeSlot = TimeSlot.create('2020-01-01', '10:00:00');
      const details = AppointmentDetails.create('Test');

      expect(() => {
        Appointment.create(
          appointmentId,
          tenantId,
          'PAT-001',
          'DOC-001',
          pastTimeSlot,
          30,
          AppointmentType.CONSULTATION,
          AppointmentPriority.NORMAL,
          details,
          200000,
          'user-123'
        );
      }).toThrow('Cannot schedule appointment in the past');
    });
  });

  describe('confirm', () => {
    it('should confirm scheduled appointment', () => {
      const appointment = createTestAppointment();

      appointment.confirm('doctor-123');

      expect(appointment.getStatus()).toBe(AppointmentStatus.CONFIRMED);
      expect(appointment.getConfirmedBy()).toBe('doctor-123');
      expect(appointment.getConfirmedAt()).toBeDefined();
    });

    it('should reject confirmation of non-scheduled appointment', () => {
      const appointment = createTestAppointment();
      appointment.confirm('doctor-123');

      expect(() => {
        appointment.confirm('doctor-456');
      }).toThrow('Only scheduled appointments can be confirmed');
    });
  });

  describe('checkIn', () => {
    it('should check in confirmed appointment', () => {
      const appointment = createTestAppointment();
      appointment.confirm('doctor-123');

      appointment.checkIn();

      expect(appointment.getStatus()).toBe(AppointmentStatus.ARRIVED);
      expect(appointment.getCheckedInAt()).toBeDefined();
    });

    it('should reject check-in for non-confirmed appointment', () => {
      const appointment = createTestAppointment();

      expect(() => {
        appointment.checkIn();
      }).toThrow('Only confirmed appointments can be checked in');
    });
  });

  describe('start', () => {
    it('should start appointment after check-in', () => {
      const appointment = createTestAppointment();
      appointment.confirm('doctor-123');
      appointment.checkIn();

      appointment.start();

      expect(appointment.getStatus()).toBe(AppointmentStatus.IN_PROGRESS);
      expect(appointment.getStartedAt()).toBeDefined();
    });

    it('should reject start before check-in', () => {
      const appointment = createTestAppointment();
      appointment.confirm('doctor-123');

      expect(() => {
        appointment.start();
      }).toThrow('Patient must be checked in before starting appointment');
    });
  });

  describe('complete', () => {
    it('should complete in-progress appointment', () => {
      const appointment = createTestAppointment();
      appointment.confirm('doctor-123');
      appointment.checkIn();
      appointment.start();

      appointment.complete();

      expect(appointment.getStatus()).toBe(AppointmentStatus.COMPLETED);
      expect(appointment.getCompletedAt()).toBeDefined();
    });

    it('should reject completion of non-in-progress appointment', () => {
      const appointment = createTestAppointment();

      expect(() => {
        appointment.complete();
      }).toThrow('Only in-progress appointments can be completed');
    });
  });

  describe('cancel', () => {
    it('should cancel scheduled appointment', () => {
      const appointment = createTestAppointment();

      appointment.cancel('Patient requested', 'patient-123');

      expect(appointment.getStatus()).toBe(AppointmentStatus.CANCELLED);
      expect(appointment.getCancellationReason()).toBe('Patient requested');
      expect(appointment.getCancelledBy()).toBe('patient-123');
      expect(appointment.getCancelledAt()).toBeDefined();
    });

    it('should reject cancellation of completed appointment', () => {
      const appointment = createTestAppointment();
      appointment.confirm('doctor-123');
      appointment.checkIn();
      appointment.start();
      appointment.complete();

      expect(() => {
        appointment.cancel('Too late', 'patient-123');
      }).toThrow('Cannot cancel completed appointment');
    });

    it('should reject cancellation of already cancelled appointment', () => {
      const appointment = createTestAppointment();
      appointment.cancel('First cancellation', 'patient-123');

      expect(() => {
        appointment.cancel('Second cancellation', 'patient-456');
      }).toThrow('Appointment is already cancelled');
    });

    it('should publish AppointmentCancelled event', () => {
      const appointment = createTestAppointment();

      appointment.cancel('Patient requested', 'patient-123');

      const events = (appointment as any).getDomainEvents();
      expect(events).toBeDefined();
      expect(events.length).toBeGreaterThan(0);
    });
  });

  describe('markAsNoShow', () => {
    it('should mark confirmed appointment as no-show', () => {
      const appointment = createTestAppointment();
      appointment.confirm('doctor-123');

      appointment.markAsNoShow();

      expect(appointment.getStatus()).toBe(AppointmentStatus.NO_SHOW);
    });

    it('should reject no-show for in-progress appointment', () => {
      const appointment = createTestAppointment();
      appointment.confirm('doctor-123');
      appointment.checkIn();
      appointment.start();

      expect(() => {
        appointment.markAsNoShow();
      }).toThrow('Only scheduled/confirmed appointments can be marked as no-show');
    });
  });

  describe('reschedule', () => {
    it('should reschedule appointment to new time', () => {
      const appointment = createTestAppointment();
      const newTimeSlot = TimeSlot.create('2025-12-02', '14:00:00');

      appointment.reschedule(newTimeSlot, 'Doctor unavailable', 'admin-123');

      expect(appointment.getTimeSlot().appointmentDate).toBe('2025-12-02');
      expect(appointment.getTimeSlot().appointmentTime).toBe('14:00:00');
      expect(appointment.getStatus()).toBe(AppointmentStatus.SCHEDULED);
      expect(appointment.getConfirmedAt()).toBeUndefined();
    });

    it('should reject reschedule of completed appointment', () => {
      const appointment = createTestAppointment();
      appointment.confirm('doctor-123');
      appointment.checkIn();
      appointment.start();
      appointment.complete();

      const newTimeSlot = TimeSlot.create('2025-12-02', '14:00:00');

      expect(() => {
        appointment.reschedule(newTimeSlot, 'Too late', 'admin-123');
      }).toThrow('Cannot reschedule completed appointment');
    });

    it('should reject reschedule to past time', () => {
      const appointment = createTestAppointment();
      const pastTimeSlot = TimeSlot.create('2020-01-01', '10:00:00');

      expect(() => {
        appointment.reschedule(pastTimeSlot, 'Invalid time', 'admin-123');
      }).toThrow('Cannot reschedule to past time');
    });

    it('should publish AppointmentRescheduled event', () => {
      const appointment = createTestAppointment();
      const newTimeSlot = TimeSlot.create('2025-12-02', '14:00:00');

      appointment.reschedule(newTimeSlot, 'Doctor unavailable', 'admin-123');

      const events = (appointment as any).getDomainEvents();
      expect(events.length).toBeGreaterThan(0);
    });
  });

  describe('containsPHI', () => {
    it('should indicate that appointment contains PHI', () => {
      const appointment = createTestAppointment();

      expect(appointment.containsPHI()).toBe(true);
    });
  });

  describe('getPatientId', () => {
    it('should return patient ID', () => {
      const appointment = createTestAppointment();

      expect(appointment.getPatientId()).toBe('PAT-001');
    });
  });
});
