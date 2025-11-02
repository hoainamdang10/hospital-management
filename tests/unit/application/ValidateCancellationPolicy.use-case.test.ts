/**
 * Validate Cancellation Policy Use Case Tests
 *
 * Kiểm tra các nhánh tính toán phí hủy lịch hẹn.
 */

import { ValidateCancellationPolicyUseCase } from '../../../src/application/use-cases/ValidateCancellationPolicy.use-case';
import { IAppointmentRepository } from '../../../src/domain/repositories/IAppointmentRepository';
import {
  Appointment,
  AppointmentType,
  AppointmentPriority,
} from '../../../src/domain/aggregates/Appointment.aggregate';
import { AppointmentId } from '../../../src/domain/value-objects/AppointmentId.vo';
import { TenantId } from '../../../src/domain/value-objects/TenantId.vo';
import { TimeSlot } from '../../../src/domain/value-objects/TimeSlot.vo';
import { AppointmentDetails } from '../../../src/domain/value-objects/AppointmentDetails.vo';

describe('ValidateCancellationPolicyUseCase', () => {
  const DEFAULT_FEE = 200_000;
  let repository: jest.Mocked<IAppointmentRepository>;
  let useCase: ValidateCancellationPolicyUseCase;

  beforeEach(() => {
    repository = {
      findByAppointmentId: jest.fn(),
    } as any;

    useCase = new ValidateCancellationPolicyUseCase(repository);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  const pad = (value: number): string => value.toString().padStart(2, '0');

  const formatDate = (date: Date): string =>
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

  const formatTime = (date: Date): string =>
    `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;

  const createAppointment = (date: Date, options: { fee?: number } = {}): Appointment => {
    const appointmentId = AppointmentId.generate();
    const tenantId = TenantId.createDefault();
    const timeSlot = TimeSlot.create(formatDate(date), formatTime(date));
    const details = AppointmentDetails.create('Khám định kỳ');

    return Appointment.create(
      appointmentId,
      tenantId,
      'PAT-202501-001',
      'DOC-202501-001',
      timeSlot,
      30,
      AppointmentType.CONSULTATION,
      AppointmentPriority.NORMAL,
      details,
      options.fee ?? DEFAULT_FEE,
      'user-creator'
    );
  };

  const executeUseCase = async () =>
    useCase.execute(
      { appointmentId: 'APT-001' },
      { userId: 'user-123', timestamp: new Date() }
    );

  it('should return failure when appointment not found', async () => {
    repository.findByAppointmentId.mockResolvedValue(null);

    const result = await executeUseCase();

    expect(result.success).toBe(false);
    expect(result.errors).toContain('Appointment not found');
  });

  it('should forbid cancellation when appointment already checked in', async () => {
    jest.useFakeTimers().setSystemTime(new Date(2025, 0, 1, 9, 0, 0));
    const appointment = createAppointment(new Date(2025, 0, 1, 10, 0, 0));
    appointment.checkIn(new Date());
    repository.findByAppointmentId.mockResolvedValue(appointment);

    const result = await executeUseCase();

    expect(result.success).toBe(true);
    expect(result.policy).toBeDefined();
    expect(result.policy?.canCancel).toBe(false);
    expect(result.policy?.cancellationFee).toBe(DEFAULT_FEE);
    expect(result.policy?.refundAmount).toBe(0);
    expect(result.policy?.reason).toContain('đã check-in');
  });

  it('should allow free cancellation when more than 24 hours before appointment', async () => {
    jest.useFakeTimers().setSystemTime(new Date(2025, 0, 1, 9, 0, 0));
    const appointment = createAppointment(new Date(2025, 0, 2, 12, 0, 0));
    repository.findByAppointmentId.mockResolvedValue(appointment);

    const result = await executeUseCase();

    expect(result.success).toBe(true);
    expect(result.policy).toBeDefined();
    expect(result.policy?.cancellationFee).toBe(0);
    expect(result.policy?.refundPercentage).toBe(100);
    expect(result.policy?.reason).toContain('Hủy miễn phí');
    expect(result.policy?.hoursBeforeAppointment).toBeGreaterThan(24);
  });

  it('should apply 50% fee when between 12 and 24 hours before appointment', async () => {
    jest.useFakeTimers().setSystemTime(new Date(2025, 0, 1, 9, 0, 0));
    const appointment = createAppointment(new Date(2025, 0, 1, 22, 0, 0));
    repository.findByAppointmentId.mockResolvedValue(appointment);

    const result = await executeUseCase();

    expect(result.success).toBe(true);
    expect(result.policy).toBeDefined();
    expect(result.policy?.cancellationFee).toBe(DEFAULT_FEE * 0.5);
    expect(result.policy?.refundPercentage).toBe(50);
    expect(result.policy?.reason).toContain('Phí hủy 50%');
    expect(result.policy?.hoursBeforeAppointment).toBeGreaterThanOrEqual(12);
    expect(result.policy?.hoursBeforeAppointment).toBeLessThan(24);
  });

  it('should apply full fee when less than 12 hours before appointment', async () => {
    jest.useFakeTimers().setSystemTime(new Date(2025, 0, 1, 9, 0, 0));
    const appointment = createAppointment(new Date(2025, 0, 1, 18, 0, 0));
    repository.findByAppointmentId.mockResolvedValue(appointment);

    const result = await executeUseCase();

    expect(result.success).toBe(true);
    expect(result.policy).toBeDefined();
    expect(result.policy?.cancellationFee).toBe(DEFAULT_FEE);
    expect(result.policy?.refundAmount).toBe(0);
    expect(result.policy?.reason).toContain('Phí hủy 100%');
    expect(result.policy?.hoursBeforeAppointment).toBeLessThan(12);
  });

  it('should treat past appointments as non-cancellable with full fee', async () => {
    jest.useFakeTimers().setSystemTime(new Date(2025, 0, 2, 9, 0, 0));
    const appointment = createAppointment(new Date(2025, 0, 1, 9, 0, 0));
    repository.findByAppointmentId.mockResolvedValue(appointment);

    const result = await executeUseCase();

    expect(result.success).toBe(true);
    expect(result.policy).toBeDefined();
    expect(result.policy?.canCancel).toBe(false);
    expect(result.policy?.cancellationFee).toBe(DEFAULT_FEE);
    expect(result.policy?.refundAmount).toBe(0);
    expect(result.policy?.reason).toContain('Lịch hẹn đã qua');
  });
});
