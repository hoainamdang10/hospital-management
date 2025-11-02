/**
 * Appointment Test Data Builder
 * Generates non-overlapping appointments for integration tests
 * Handles database exclusion constraint: exclude_doctor_time_overlap
 * 
 * @author Hospital Management Team
 * @version 1.0.0
 */

export class AppointmentTestDataBuilder {
  private static doctorCounter = 1;
  private static patientCounter = 1;
  // Use future date (1 month from now) to avoid "Cannot schedule appointment in the past" errors
  private static baseTime = (() => {
    const future = new Date();
    future.setMonth(future.getMonth() + 1);
    future.setHours(8, 0, 0, 0);
    return future;
  })();
  private static timeSlots = new Map<string, number>();

  /**
   * Generate non-overlapping appointment data
   * Each doctor gets slots 1 hour apart to prevent constraint violations
   */
  static generateNonOverlappingAppointment(options?: {
    doctorId?: string;
    patientId?: string;
    durationMinutes?: number;
    offsetHours?: number;
  }) {
    const durationMinutes = options?.durationMinutes || 30;
    const offsetHours = options?.offsetHours || 0;
    
    // Generate unique IDs if not provided
    const doctorId = options?.doctorId || this.generateDoctorId();
    const patientId = options?.patientId || this.generatePatientId();
    
    // Get next available slot for this doctor
    const currentSlot = this.timeSlots.get(doctorId) || 0;
    this.timeSlots.set(doctorId, currentSlot + 1);
    
    // Calculate start time: base + offset + (slot * 1 hour)
    const startMinutes = (offsetHours * 60) + (currentSlot * 60);
    const start = new Date(this.baseTime);
    start.setMinutes(start.getMinutes() + startMinutes);
    
    const end = new Date(start);
    end.setMinutes(end.getMinutes() + durationMinutes);
    
    return {
      doctorId,
      patientId,
      appointmentDate: start.toISOString().split('T')[0],
      appointmentTime: start.toISOString().split('T')[1].split('.')[0],
      startAtUtc: start.toISOString(),
      endAtUtc: end.toISOString(),
      durationMinutes
    };
  }

  /**
   * Generate multiple non-overlapping appointments for the same doctor
   */
  static generateMultipleForDoctor(
    doctorId: string,
    count: number,
    durationMinutes: number = 30
  ) {
    return Array.from({ length: count }, () => 
      this.generateNonOverlappingAppointment({ doctorId, durationMinutes })
    );
  }

  /**
   * Generate appointments with different doctors (no constraint issues)
   */
  static generateMultipleWithDifferentDoctors(count: number) {
    return Array.from({ length: count }, () => 
      this.generateNonOverlappingAppointment()
    );
  }

  /**
   * Generate specific time slot (use with caution - may overlap!)
   */
  static generateWithSpecificTime(
    doctorId: string,
    date: string,
    time: string,
    durationMinutes: number = 30
  ) {
    const start = new Date(`${date}T${time}Z`);
    const end = new Date(start);
    end.setMinutes(end.getMinutes() + durationMinutes);
    
    return {
      doctorId,
      patientId: this.generatePatientId(),
      appointmentDate: date,
      appointmentTime: time,
      startAtUtc: start.toISOString(),
      endAtUtc: end.toISOString(),
      durationMinutes
    };
  }

  /**
   * Generate doctor ID in correct format: XX-DOC-XXXXXX-XXX
   */
  static generateDoctorId(): string {
    const prefix = 'VN';
    const counter = String(this.doctorCounter++).padStart(6, '0');
    const suffix = '001';
    return `${prefix}-DOC-${counter}-${suffix}`;
  }

  /**
   * Generate patient ID in correct format: PAT-XXXXXX-XXX
   */
  static generatePatientId(): string {
    const counter = String(this.patientCounter++).padStart(6, '0');
    const suffix = '001';
    return `PAT-${counter}-${suffix}`;
  }

  /**
   * Reset all counters and slots (call in beforeEach)
   * Use unique timestamp-based counters to prevent conflicts across test runs
   */
  static reset() {
    // Use timestamp to ensure uniqueness across test runs
    const timestamp = Date.now();
    this.doctorCounter = timestamp % 100000; // Last 5 digits
    this.patientCounter = timestamp % 100000;
    this.timeSlots.clear();
    
    // Use future date that changes with each test run
    this.baseTime = (() => {
      const future = new Date();
      future.setMonth(future.getMonth() + 1);
      future.setHours(8, 0, 0, 0);
      return future;
    })();
  }

  /**
   * Get future date for testing
   */
  static getFutureDate(daysAhead: number = 1): string {
    const date = new Date();
    date.setDate(date.getDate() + daysAhead);
    return date.toISOString().split('T')[0];
  }

  /**
   * Get future datetime in UTC
   */
  static getFutureDatetime(hoursAhead: number = 1): Date {
    const date = new Date();
    date.setHours(date.getHours() + hoursAhead);
    return date;
  }

  /**
   * Create cancelled appointment data (won't trigger constraint)
   */
  static generateCancelledAppointment(doctorId: string) {
    const data = this.generateNonOverlappingAppointment({ doctorId });
    return {
      ...data,
      status: 'CANCELLED'
    };
  }

  /**
   * Validate appointment data format
   */
  static validateData(data: any): boolean {
    const doctorIdPattern = /^[A-Z]{2,4}-DOC-\d{6}-\d{3}$/;
    const patientIdPattern = /^PAT-\d{6}-\d{3}$/;
    
    return (
      doctorIdPattern.test(data.doctorId) &&
      patientIdPattern.test(data.patientId) &&
      data.durationMinutes > 0 &&
      new Date(data.startAtUtc) < new Date(data.endAtUtc)
    );
  }
}
