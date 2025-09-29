/**
 * Scheduling Aggregate Unit Tests
 * V2 Clean Architecture + DDD Implementation
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 */

import { Appointment, AppointmentStatus } from '../../../src/domain/aggregates/scheduling.aggregate';
import { AppointmentId, AppointmentType, AppointmentPriority } from '../../../src/domain/value-objects/AppointmentId';
import { PatientInfo } from '../../../src/domain/value-objects/PatientInfo';
import { ProviderInfo, ProviderType, ProviderStatus } from '../../../src/domain/value-objects/ProviderInfo';
import { TimeSlot, TimeSlotStatus } from '../../../src/domain/value-objects/TimeSlot';
import { AppointmentDetails, AppointmentReason } from '../../../src/domain/value-objects/AppointmentDetails';

describe('Scheduling Aggregate', () => {
  let appointmentId: AppointmentId;
  let patientInfo: PatientInfo;
  let providerInfo: ProviderInfo;
  let timeSlot: TimeSlot;
  let appointmentDetails: AppointmentDetails;

  beforeEach(() => {
    // Setup test data
    appointmentId = AppointmentId.create(
      AppointmentType.CONSULTATION,
      'CARD',
      AppointmentPriority.NORMAL
    );

    patientInfo = PatientInfo.create(
      'PAT-202412-001',
      'Nguyễn Văn A',
      '0123456789',
      '1990-01-01',
      '123456789',
      'patient@test.com',
      'Hà Nội',
      '0987654321',
      'BHYT123456',
      'BHYT'
    );

    providerInfo = ProviderInfo.create(
      'CARD-DOC-202412-001',
      'Bác sĩ Trần Thị B',
      'Tim mạch',
      'CARD',
      'VN-TM-1234',
      ProviderType.DOCTOR,
      ProviderStatus.ACTIVE,
      '0111222333',
      'doctor@test.com',
      10,
      ['Thạc sĩ Y khoa', 'Chuyên khoa Tim mạch'],
      ['vi', 'en']
    );

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(10, 0, 0, 0);
    const endTime = new Date(tomorrow);
    endTime.setMinutes(30);

    timeSlot = TimeSlot.create(
      tomorrow,
      endTime,
      TimeSlotStatus.AVAILABLE,
      providerInfo.providerId,
      'ROOM-001'
    );

    appointmentDetails = AppointmentDetails.create(
      'Khám tim định kỳ',
      30,
      false,
      false,
      'routine',
      AppointmentReason.CONSULTATION,
      'Đau ngực nhẹ',
      'Bệnh nhân cần khám định kỳ'
    );
  });

  describe('create', () => {
    it('should create a valid appointment', () => {
      const appointment = Appointment.create(
        appointmentId,
        patientInfo,
        providerInfo,
        timeSlot,
        appointmentDetails,
        'ROOM-001',
        'USER-001'
      );

      expect(appointment).toBeDefined();
      expect(appointment.status).toBe(AppointmentStatus.SCHEDULED);
      expect(appointment.appointmentId).toBe(appointmentId);
      expect(appointment.patient).toBe(patientInfo);
      expect(appointment.provider).toBe(providerInfo);
      expect(appointment.timeSlot).toBe(timeSlot);
      expect(appointment.details).toBe(appointmentDetails);
      expect(appointment.roomId).toBe('ROOM-001');
      expect(appointment.createdBy).toBe('USER-001');
    });

    it('should add domain event when created', () => {
      const appointment = Appointment.create(
        appointmentId,
        patientInfo,
        providerInfo,
        timeSlot,
        appointmentDetails,
        'ROOM-001',
        'USER-001'
      );

      const events = appointment.getUncommittedEvents();
      expect(events).toHaveLength(1);
      expect(events[0].eventType).toBe('AppointmentScheduled');
    });

    it('should validate business rules on creation', () => {
      // Test with past time slot
      const pastTime = new Date();
      pastTime.setHours(pastTime.getHours() - 1);
      const pastEndTime = new Date(pastTime);
      pastEndTime.setMinutes(30);
      
      const pastTimeSlot = TimeSlot.create(
        pastTime,
        pastEndTime,
        TimeSlotStatus.AVAILABLE
      );

      expect(() => {
        Appointment.create(
          appointmentId,
          patientInfo,
          providerInfo,
          pastTimeSlot,
          appointmentDetails,
          'ROOM-001',
          'USER-001'
        );
      }).toThrow('Không thể đặt lịch hẹn trong quá khứ');
    });
  });

  describe('confirm', () => {
    it('should confirm a scheduled appointment', () => {
      const appointment = Appointment.create(
        appointmentId,
        patientInfo,
        providerInfo,
        timeSlot,
        appointmentDetails,
        'ROOM-001',
        'USER-001'
      );

      appointment.confirm('USER-002');

      expect(appointment.status).toBe(AppointmentStatus.CONFIRMED);
      expect(appointment.confirmedAt).toBeDefined();
    });

    it('should not confirm non-scheduled appointment', () => {
      const appointment = Appointment.create(
        appointmentId,
        patientInfo,
        providerInfo,
        timeSlot,
        appointmentDetails,
        'ROOM-001',
        'USER-001'
      );

      appointment.confirm('USER-002');

      expect(() => {
        appointment.confirm('USER-002');
      }).toThrow('Chỉ có thể xác nhận cuộc hẹn đã lên lịch');
    });
  });

  describe('cancel', () => {
    it('should cancel an appointment', () => {
      const appointment = Appointment.create(
        appointmentId,
        patientInfo,
        providerInfo,
        timeSlot,
        appointmentDetails,
        'ROOM-001',
        'USER-001'
      );

      appointment.cancel('Bệnh nhân yêu cầu hủy', 'USER-002');

      expect(appointment.status).toBe(AppointmentStatus.CANCELLED);
      expect(appointment.cancelledAt).toBeDefined();
      expect(appointment.cancellationReason).toBe('Bệnh nhân yêu cầu hủy');

      const events = appointment.getUncommittedEvents();
      expect(events).toHaveLength(2); // Scheduled + Cancelled
      expect(events[1].eventType).toBe('AppointmentCancelled');
    });
  });

  describe('reschedule', () => {
    it('should reschedule an appointment', () => {
      const appointment = Appointment.create(
        appointmentId,
        patientInfo,
        providerInfo,
        timeSlot,
        appointmentDetails,
        'ROOM-001',
        'USER-001'
      );

      const newTime = new Date(timeSlot.startTime);
      newTime.setHours(newTime.getHours() + 2);
      const newEndTime = new Date(newTime);
      newEndTime.setMinutes(30);

      const newTimeSlot = TimeSlot.create(
        newTime,
        newEndTime,
        TimeSlotStatus.AVAILABLE
      );

      appointment.reschedule(newTimeSlot, 'Thay đổi lịch', 'USER-002');

      expect(appointment.status).toBe(AppointmentStatus.RESCHEDULED);
      expect(appointment.timeSlot).toBe(newTimeSlot);

      const events = appointment.getUncommittedEvents();
      expect(events).toHaveLength(2); // Scheduled + Rescheduled
      expect(events[1].eventType).toBe('AppointmentRescheduled');
    });
  });

  describe('healthcare compliance', () => {
    it('should contain PHI', () => {
      const appointment = Appointment.create(
        appointmentId,
        patientInfo,
        providerInfo,
        timeSlot,
        appointmentDetails,
        'ROOM-001',
        'USER-001'
      );

      expect(appointment.containsPHI()).toBe(true);
    });

    it('should return patient ID', () => {
      const appointment = Appointment.create(
        appointmentId,
        patientInfo,
        providerInfo,
        timeSlot,
        appointmentDetails,
        'ROOM-001',
        'USER-001'
      );

      expect(appointment.getPatientId()).toBe(patientInfo.patientId);
    });

    it('should validate business invariants', () => {
      const appointment = Appointment.create(
        appointmentId,
        patientInfo,
        providerInfo,
        timeSlot,
        appointmentDetails,
        'ROOM-001',
        'USER-001'
      );

      expect(() => {
        appointment.validateInvariants();
      }).not.toThrow();
    });
  });

  describe('persistence', () => {
    it('should convert to persistence format', () => {
      const appointment = Appointment.create(
        appointmentId,
        patientInfo,
        providerInfo,
        timeSlot,
        appointmentDetails,
        'ROOM-001',
        'USER-001'
      );

      const persistenceData = appointment.toPersistence();

      expect(persistenceData).toHaveProperty('id');
      expect(persistenceData).toHaveProperty('appointment_id');
      expect(persistenceData).toHaveProperty('patient_id');
      expect(persistenceData).toHaveProperty('provider_id');
      expect(persistenceData).toHaveProperty('start_time');
      expect(persistenceData).toHaveProperty('end_time');
      expect(persistenceData).toHaveProperty('status');
      expect(persistenceData).toHaveProperty('version');
      expect(persistenceData).toHaveProperty('last_modified');
    });
  });
});
