/**
 * Test Data Builder - Helps create test data easily
 */

export class AppointmentTestDataBuilder {
  private data: any;

  constructor() {
    this.data = {
      patientId: `test-patient-${Date.now()}`,
      providerId: `test-provider-${Date.now()}`,
      tenantId: 'test-tenant',
      appointmentDate: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
      timeSlot: {
        startTime: '09:00',
        endTime: '09:30'
      },
      appointmentType: 'CONSULTATION',
      consultationFee: 500000,
      notes: 'Test appointment'
    };
  }

  withPatientId(patientId: string): this {
    this.data.patientId = patientId;
    return this;
  }

  withProviderId(providerId: string): this {
    this.data.providerId = providerId;
    return this;
  }

  withDate(date: Date): this {
    this.data.appointmentDate = date.toISOString();
    return this;
  }

  withTimeSlot(startTime: string, endTime: string): this {
    this.data.timeSlot = { startTime, endTime };
    return this;
  }

  withType(type: 'CONSULTATION' | 'FOLLOW_UP' | 'EMERGENCY' | 'CHECKUP'): this {
    this.data.appointmentType = type;
    return this;
  }

  withFee(fee: number): this {
    this.data.consultationFee = fee;
    return this;
  }

  withNotes(notes: string): this {
    this.data.notes = notes;
    return this;
  }

  build() {
    return { ...this.data };
  }
}

export class QueueTestDataBuilder {
  private data: any;

  constructor() {
    this.data = {
      patientId: `test-queue-patient-${Date.now()}`,
      providerId: `test-queue-provider-${Date.now()}`,
      departmentId: 'dept-001',
      priority: 'NORMAL',
      reason: 'Test queue entry'
    };
  }

  withPatientId(patientId: string): this {
    this.data.patientId = patientId;
    return this;
  }

  withProviderId(providerId: string): this {
    this.data.providerId = providerId;
    return this;
  }

  withPriority(priority: 'NORMAL' | 'URGENT' | 'EMERGENCY'): this {
    this.data.priority = priority;
    return this;
  }

  withReason(reason: string): this {
    this.data.reason = reason;
    return this;
  }

  build() {
    return { ...this.data };
  }
}

export const createAppointment = () => new AppointmentTestDataBuilder();
export const createQueueEntry = () => new QueueTestDataBuilder();

/**
 * Helper to wait for async operations (event processing, etc.)
 */
export const waitFor = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Helper to retry an assertion until it passes or timeout
 */
export const waitForCondition = async (
  condition: () => Promise<boolean>,
  options: { timeout?: number; interval?: number } = {}
): Promise<void> => {
  const timeout = options.timeout || 10000; // 10 seconds default
  const interval = options.interval || 500; // 500ms default
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    if (await condition()) {
      return;
    }
    await waitFor(interval);
  }

  throw new Error(`Condition not met within ${timeout}ms`);
};
