/**
 * Scheduling Application Service Unit Tests
 * V2 Clean Architecture + DDD + CQRS Implementation
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 */

import { SchedulingApplicationService } from '../../../src/application/services/SchedulingApplicationService';
import { ISchedulingRepository } from '../../../src/application/interfaces/ISchedulingRepository';
import { IEventBus } from '../../../src/application/interfaces/IEventBus';
import { IAvailabilityService } from '../../../src/application/interfaces/IAvailabilityService';
import { Appointment, AppointmentStatus } from '../../../src/domain/aggregates/scheduling.aggregate';
import { AppointmentId, AppointmentType, AppointmentPriority } from '../../../src/domain/value-objects/AppointmentId';
import { PatientInfo } from '../../../src/domain/value-objects/PatientInfo';
import { ProviderInfo, ProviderType, ProviderStatus } from '../../../src/domain/value-objects/ProviderInfo';
import { TimeSlot, TimeSlotStatus } from '../../../src/domain/value-objects/TimeSlot';
import { AppointmentDetails, AppointmentReason } from '../../../src/domain/value-objects/AppointmentDetails';

// Mock implementations
class MockSchedulingRepository implements ISchedulingRepository {
  private appointments: Map<string, Appointment> = new Map();

  async save(appointment: Appointment): Promise<void> {
    this.appointments.set(appointment.id, appointment);
  }

  async findById(id: string): Promise<Appointment | null> {
    return this.appointments.get(id) || null;
  }

  async findByAppointmentId(appointmentId: string): Promise<Appointment | null> {
    for (const appointment of this.appointments.values()) {
      if (appointment.appointmentId.value === appointmentId) {
        return appointment;
      }
    }
    return null;
  }

  async findByPatientId(patientId: string): Promise<Appointment[]> {
    return Array.from(this.appointments.values()).filter(
      apt => apt.patient.patientId === patientId
    );
  }

  async findByProviderId(providerId: string): Promise<Appointment[]> {
    return Array.from(this.appointments.values()).filter(
      apt => apt.provider.providerId === providerId
    );
  }

  async findByProviderAndDate(providerId: string, date: Date): Promise<Appointment[]> {
    return Array.from(this.appointments.values()).filter(apt => {
      const appointmentDate = new Date(apt.timeSlot.startTime);
      return apt.provider.providerId === providerId &&
             appointmentDate.toDateString() === date.toDateString();
    });
  }

  async findByDateRange(startDate: Date, endDate: Date): Promise<Appointment[]> {
    return Array.from(this.appointments.values()).filter(apt => {
      const appointmentDate = apt.timeSlot.startTime;
      return appointmentDate >= startDate && appointmentDate <= endDate;
    });
  }

  async findByStatus(status: string): Promise<Appointment[]> {
    return Array.from(this.appointments.values()).filter(
      apt => apt.status === status
    );
  }

  async findByPatientAndDateRange(patientId: string, startDate: Date, endDate: Date): Promise<Appointment[]> {
    return Array.from(this.appointments.values()).filter(apt => {
      const appointmentDate = apt.timeSlot.startTime;
      return apt.patient.patientId === patientId &&
             appointmentDate >= startDate && appointmentDate <= endDate;
    });
  }

  async findByProviderAndDateRange(providerId: string, startDate: Date, endDate: Date): Promise<Appointment[]> {
    return Array.from(this.appointments.values()).filter(apt => {
      const appointmentDate = apt.timeSlot.startTime;
      return apt.provider.providerId === providerId &&
             appointmentDate >= startDate && appointmentDate <= endDate;
    });
  }

  async findByDepartmentAndDate(departmentCode: string, date: Date): Promise<Appointment[]> {
    return [];
  }

  async findByRoomAndDate(roomId: string, date: Date): Promise<Appointment[]> {
    return [];
  }

  async findConflicts(providerId: string, startTime: Date, endTime: Date, excludeAppointmentId?: string): Promise<Appointment[]> {
    return [];
  }

  async findAppointmentsForReminders(reminderTime: Date): Promise<Appointment[]> {
    return [];
  }

  async findOverdueAppointments(): Promise<Appointment[]> {
    return [];
  }

  async findByUrgencyLevel(urgencyLevel: 'routine' | 'urgent' | 'emergency'): Promise<Appointment[]> {
    return [];
  }

  async findFollowUpAppointments(originalAppointmentId: string): Promise<Appointment[]> {
    return [];
  }

  async search(filters: any): Promise<any> {
    return { appointments: [], totalCount: 0 };
  }

  async getStatistics(filters: any): Promise<any> {
    return { totalAppointments: this.appointments.size };
  }

  async delete(id: string): Promise<void> {
    this.appointments.delete(id);
  }

  async exists(id: string): Promise<boolean> {
    return this.appointments.has(id);
  }

  async count(filters: any): Promise<number> {
    return this.appointments.size;
  }
}

class MockEventBus implements IEventBus {
  private publishedEvents: any[] = [];

  async publish(event: any): Promise<void> {
    this.publishedEvents.push(event);
  }

  async publishAll(events: any[]): Promise<void> {
    this.publishedEvents.push(...events);
  }

  subscribe(eventType: string, handler: any): void {}
  unsubscribe(eventType: string, handler: any): void {}
  async getEventHistory(aggregateId: string): Promise<any[]> { return []; }
  async clearEventHistory(): Promise<void> {}

  getPublishedEvents(): any[] {
    return this.publishedEvents;
  }

  clearPublishedEvents(): void {
    this.publishedEvents = [];
  }
}

class MockAvailabilityService implements IAvailabilityService {
  async checkAvailability(providerId: string, startTime: Date, endTime: Date): Promise<boolean> {
    return true; // Always available for testing
  }

  async getProviderSchedule(providerId: string, date: Date): Promise<any> {
    return {
      providerId,
      providerName: 'Test Provider',
      department: 'Test Department',
      workingHours: { start: 8, end: 17 }
    };
  }

  async getDepartmentProviders(departmentCode: string): Promise<any[]> {
    return [];
  }

  async getAllProviders(): Promise<any[]> {
    return [];
  }

  async getAvailableSlots(providerId: string, date: Date, duration?: number): Promise<any[]> {
    return [];
  }

  async getDepartmentAvailableSlots(departmentCode: string, date: Date, duration?: number): Promise<any[]> {
    return [];
  }

  async blockTimeSlots(providerId: string, startTime: Date, endTime: Date, reason: string, blockedBy: string): Promise<void> {}
  async unblockTimeSlots(providerId: string, startTime: Date, endTime: Date, unblockedBy: string): Promise<void> {}
  async getWorkingHours(providerId: string, date: Date): Promise<any> { return {}; }
  async updateWorkingHours(providerId: string, workingHours: any, updatedBy: string): Promise<void> {}
  async getBreakTimes(providerId: string, date: Date): Promise<any[]> { return []; }
  async addBreakTime(providerId: string, breakTime: any, addedBy: string): Promise<void> {}
  async removeBreakTime(providerId: string, breakTimeId: string, removedBy: string): Promise<void> {}
  async checkConflicts(providerId: string, startTime: Date, endTime: Date, excludeAppointmentId?: string): Promise<any[]> { return []; }
  async getNextAvailableSlot(providerId: string, fromDate: Date, duration: number): Promise<any> { return null; }
  async getAlternativeProviders(departmentCode: string, startTime: Date, endTime: Date, excludeProviderId?: string): Promise<any[]> { return []; }
}

describe('SchedulingApplicationService', () => {
  let service: SchedulingApplicationService;
  let mockRepository: MockSchedulingRepository;
  let mockEventBus: MockEventBus;
  let mockAvailabilityService: MockAvailabilityService;

  beforeEach(() => {
    mockRepository = new MockSchedulingRepository();
    mockEventBus = new MockEventBus();
    mockAvailabilityService = new MockAvailabilityService();

    service = new SchedulingApplicationService(
      mockRepository,
      mockEventBus,
      mockAvailabilityService
    );
  });

  describe('scheduleAppointment', () => {
    it('should schedule appointment successfully', async () => {
      const request = {
        patientId: 'PAT-202412-001',
        patientName: 'Nguyễn Văn A',
        patientPhone: '0123456789',
        patientDateOfBirth: '1990-01-01',
        patientNationalId: '123456789',
        providerId: 'CARD-DOC-202412-001',
        providerName: 'Bác sĩ Trần Thị B',
        department: 'Tim mạch',
        departmentCode: 'CARD',
        appointmentType: AppointmentType.CONSULTATION,
        priority: AppointmentPriority.NORMAL,
        startTime: new Date('2024-12-20T10:00:00Z'),
        endTime: new Date('2024-12-20T10:30:00Z'),
        reason: 'Khám tim định kỳ',
        estimatedDuration: 30,
        createdBy: 'USER-001'
      };

      const response = await service.scheduleAppointment(request);

      expect(response.success).toBe(true);
      expect(response.appointmentId).toBeDefined();
      expect(response.message).toContain('thành công');
    });
  });

  describe('confirmAppointment', () => {
    it('should confirm appointment successfully', async () => {
      // First create an appointment
      const appointment = createTestAppointment();
      await mockRepository.save(appointment);

      const response = await service.confirmAppointment(appointment.id, 'USER-002');

      expect(response.success).toBe(true);
      expect(response.message).toContain('xác nhận thành công');

      // Verify appointment status changed
      const updatedAppointment = await mockRepository.findById(appointment.id);
      expect(updatedAppointment?.status).toBe(AppointmentStatus.CONFIRMED);
    });

    it('should return error when appointment not found', async () => {
      const response = await service.confirmAppointment('non-existent-id', 'USER-002');

      expect(response.success).toBe(false);
      expect(response.errors).toContain('APPOINTMENT_NOT_FOUND');
    });
  });

  describe('cancelAppointment', () => {
    it('should cancel appointment successfully', async () => {
      const appointment = createTestAppointment();
      await mockRepository.save(appointment);

      const response = await service.cancelAppointment(
        appointment.id,
        'Bệnh nhân yêu cầu hủy',
        'USER-002'
      );

      expect(response.success).toBe(true);
      expect(response.message).toContain('hủy thành công');

      // Verify appointment status changed
      const updatedAppointment = await mockRepository.findById(appointment.id);
      expect(updatedAppointment?.status).toBe(AppointmentStatus.CANCELLED);
    });
  });

  describe('getAppointmentsByPatientId', () => {
    it('should return appointments for patient', async () => {
      const appointment = createTestAppointment();
      await mockRepository.save(appointment);

      const appointments = await service.getAppointmentsByPatientId('PAT-202412-001');

      expect(appointments).toHaveLength(1);
      expect(appointments[0].patient.patientId).toBe('PAT-202412-001');
    });
  });
});

function createTestAppointment(): Appointment {
  const appointmentId = AppointmentId.create(
    AppointmentType.CONSULTATION,
    'CARD',
    AppointmentPriority.NORMAL
  );

  const patientInfo = PatientInfo.create(
    'PAT-202412-001',
    'Nguyễn Văn A',
    '0123456789',
    '1990-01-01',
    '123456789'
  );

  const providerInfo = ProviderInfo.create(
    'CARD-DOC-202412-001',
    'Bác sĩ Trần Thị B',
    'Tim mạch',
    'CARD',
    'VN-TM-1234',
    ProviderType.DOCTOR,
    ProviderStatus.ACTIVE
  );

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(10, 0, 0, 0);
  const endTime = new Date(tomorrow);
  endTime.setMinutes(30);

  const timeSlot = TimeSlot.create(
    tomorrow,
    endTime,
    TimeSlotStatus.AVAILABLE
  );

  const appointmentDetails = AppointmentDetails.create(
    'Khám tim định kỳ',
    30,
    false,
    false,
    'routine',
    AppointmentReason.CONSULTATION
  );

  return Appointment.create(
    appointmentId,
    patientInfo,
    providerInfo,
    timeSlot,
    appointmentDetails,
    'ROOM-001',
    'USER-001'
  );
}
