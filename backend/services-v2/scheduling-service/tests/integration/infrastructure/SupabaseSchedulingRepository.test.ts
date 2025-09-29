/**
 * Supabase Scheduling Repository Integration Tests
 * V2 Clean Architecture + DDD Implementation
 *
 * @author Hospital Management Team
 * @version 2.0.0
 */

import {
  OptimizedSupabaseClient,
  OptimizedSupabaseClientConfig,
} from "../../../shared/infrastructure/database/optimized-supabase-client";
import {
  Appointment,
  AppointmentStatus,
} from "../../../src/domain/aggregates/scheduling.aggregate";
import { SupabaseSchedulingRepository } from "../../../src/infrastructure/persistence/SupabaseSchedulingRepository";
import { TestDataFactory } from "../../factories/TestDataFactory";

describe("SupabaseSchedulingRepository Integration Tests", () => {
  let repository: SupabaseSchedulingRepository;
  let supabaseClient: OptimizedSupabaseClient;
  let testAppointment: Appointment;

  beforeAll(async () => {
    // Setup test database connection
    const config: OptimizedSupabaseClientConfig = {
      supabaseUrl: process.env.SUPABASE_URL || "http://localhost:54321",
      supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY || "test-key",
      serviceName: "scheduling-service-test",
      schemaName: "scheduling_schema",
      enableOptimizations: false, // Disable for testing
    };

    supabaseClient = new OptimizedSupabaseClient(config);
    repository = new SupabaseSchedulingRepository(supabaseClient);
  });

  beforeEach(async () => {
    // Create test appointment
    testAppointment = TestDataFactory.createAppointment();

    // Clean up any existing test data
    await cleanupTestData();
  });

  afterEach(async () => {
    // Clean up test data after each test
    await cleanupTestData();
  });

  afterAll(async () => {
    // Final cleanup
    await cleanupTestData();
  });

  describe("save", () => {
    it("should save new appointment successfully", async () => {
      await repository.save(testAppointment);

      const saved = await repository.findById(testAppointment.id);
      expect(saved).toBeDefined();
      expect(saved?.appointmentId.value).toBe(
        testAppointment.appointmentId.value
      );
      expect(saved?.patient.patientId).toBe(testAppointment.patient.patientId);
      expect(saved?.provider.providerId).toBe(
        testAppointment.provider.providerId
      );
      expect(saved?.status).toBe(AppointmentStatus.SCHEDULED);
    });

    it("should update existing appointment", async () => {
      // Save initial appointment
      await repository.save(testAppointment);

      // Modify and save again
      testAppointment.confirm("USER-002");
      await repository.save(testAppointment);

      const updated = await repository.findById(testAppointment.id);
      expect(updated?.status).toBe(AppointmentStatus.CONFIRMED);
      expect(updated?.confirmedAt).toBeDefined();
    });

    it("should handle optimistic concurrency conflicts", async () => {
      await repository.save(testAppointment);

      // Simulate concurrent modification
      const appointment1 = await repository.findById(testAppointment.id);
      const appointment2 = await repository.findById(testAppointment.id);

      if (appointment1 && appointment2) {
        appointment1.confirm("USER-001");
        appointment2.confirm("USER-002");

        await repository.save(appointment1);

        // This should fail due to version mismatch
        await expect(repository.save(appointment2)).rejects.toThrow();
      }
    });
  });

  describe("findById", () => {
    it("should find appointment by ID", async () => {
      await repository.save(testAppointment);

      const found = await repository.findById(testAppointment.id);
      expect(found).toBeDefined();
      expect(found?.id).toBe(testAppointment.id);
    });

    it("should return null for non-existent ID", async () => {
      const found = await repository.findById("non-existent-id");
      expect(found).toBeNull();
    });
  });

  describe("findByAppointmentId", () => {
    it("should find appointment by appointment ID", async () => {
      await repository.save(testAppointment);

      const found = await repository.findByAppointmentId(
        testAppointment.appointmentId.value
      );
      expect(found).toBeDefined();
      expect(found?.appointmentId.value).toBe(
        testAppointment.appointmentId.value
      );
    });
  });

  describe("findByPatientId", () => {
    it("should find appointments by patient ID", async () => {
      await repository.save(testAppointment);

      const appointments = await repository.findByPatientId(
        testAppointment.patient.patientId
      );
      expect(appointments).toHaveLength(1);
      expect(appointments[0].patient.patientId).toBe(
        testAppointment.patient.patientId
      );
    });

    it("should return empty array for non-existent patient", async () => {
      const appointments = await repository.findByPatientId(
        "non-existent-patient"
      );
      expect(appointments).toHaveLength(0);
    });
  });

  describe("findByProviderId", () => {
    it("should find appointments by provider ID", async () => {
      await repository.save(testAppointment);

      const appointments = await repository.findByProviderId(
        testAppointment.provider.providerId
      );
      expect(appointments).toHaveLength(1);
      expect(appointments[0].provider.providerId).toBe(
        testAppointment.provider.providerId
      );
    });
  });

  describe("findByProviderAndDate", () => {
    it("should find appointments by provider and date", async () => {
      await repository.save(testAppointment);

      const appointmentDate = testAppointment.timeSlot.startTime;
      const appointments = await repository.findByProviderAndDate(
        testAppointment.provider.providerId,
        appointmentDate
      );

      expect(appointments).toHaveLength(1);
      expect(appointments[0].provider.providerId).toBe(
        testAppointment.provider.providerId
      );
    });

    it("should return empty array for different date", async () => {
      await repository.save(testAppointment);

      const differentDate = new Date();
      differentDate.setDate(differentDate.getDate() + 10);

      const appointments = await repository.findByProviderAndDate(
        testAppointment.provider.providerId,
        differentDate
      );

      expect(appointments).toHaveLength(0);
    });
  });

  describe("findConflicts", () => {
    it("should find conflicting appointments", async () => {
      await repository.save(testAppointment);

      // Create overlapping time slot
      const conflictStart = new Date(testAppointment.timeSlot.startTime);
      conflictStart.setMinutes(conflictStart.getMinutes() + 15);

      const conflictEnd = new Date(testAppointment.timeSlot.endTime);
      conflictEnd.setMinutes(conflictEnd.getMinutes() + 15);

      const conflicts = await repository.findConflicts(
        testAppointment.provider.providerId,
        conflictStart,
        conflictEnd
      );

      expect(conflicts).toHaveLength(1);
      expect(conflicts[0].id).toBe(testAppointment.id);
    });

    it("should not find conflicts for non-overlapping times", async () => {
      await repository.save(testAppointment);

      // Create non-overlapping time slot
      const nonConflictStart = new Date(testAppointment.timeSlot.endTime);
      nonConflictStart.setMinutes(nonConflictStart.getMinutes() + 30);

      const nonConflictEnd = new Date(nonConflictStart);
      nonConflictEnd.setMinutes(nonConflictEnd.getMinutes() + 30);

      const conflicts = await repository.findConflicts(
        testAppointment.provider.providerId,
        nonConflictStart,
        nonConflictEnd
      );

      expect(conflicts).toHaveLength(0);
    });

    it("should exclude specified appointment from conflicts", async () => {
      await repository.save(testAppointment);

      const conflicts = await repository.findConflicts(
        testAppointment.provider.providerId,
        testAppointment.timeSlot.startTime,
        testAppointment.timeSlot.endTime,
        testAppointment.appointmentId.value
      );

      expect(conflicts).toHaveLength(0);
    });
  });

  describe("exists", () => {
    it("should return true for existing appointment", async () => {
      await repository.save(testAppointment);

      const exists = await repository.exists(testAppointment.id);
      expect(exists).toBe(true);
    });

    it("should return false for non-existent appointment", async () => {
      const exists = await repository.exists("non-existent-id");
      expect(exists).toBe(false);
    });
  });

  describe("delete", () => {
    it("should soft delete appointment", async () => {
      await repository.save(testAppointment);

      await repository.delete(testAppointment.id);

      // Should not be found in normal queries
      const found = await repository.findById(testAppointment.id);
      expect(found).toBeNull();

      // But should still exist in database (soft delete)
      const exists = await repository.exists(testAppointment.id);
      expect(exists).toBe(true);
    });
  });

  // Helper functions
  function createTestAppointment(): Appointment {
    const appointmentId = AppointmentId.create(
      AppointmentType.CONSULTATION,
      "CARD",
      AppointmentPriority.NORMAL
    );

    const patientInfo = PatientInfo.create(
      "PAT-202412-001",
      "Nguyễn Văn A",
      "0123456789",
      "1990-01-01",
      "123456789"
    );

    const providerInfo = ProviderInfo.create(
      "CARD-DOC-202412-001",
      "Bác sĩ Trần Thị B",
      "Tim mạch",
      "CARD",
      "VN-TM-1234",
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
      "Khám tim định kỳ",
      30,
      false,
      false,
      "routine",
      AppointmentReason.CONSULTATION
    );

    return Appointment.create(
      appointmentId,
      patientInfo,
      providerInfo,
      timeSlot,
      appointmentDetails,
      "ROOM-001",
      "USER-001"
    );
  }

  async function cleanupTestData(): Promise<void> {
    try {
      // Clean up test appointments
      await supabaseClient
        .query()
        .from("appointments")
        .delete()
        .like("patient_id", "PAT-202412-%")
        .like("provider_id", "CARD-DOC-202412-%");

      // Clean up test domain events
      await supabaseClient
        .query()
        .from("domain_events")
        .delete()
        .like("aggregate_id", "%test%");
    } catch (error) {
      // Ignore cleanup errors in tests
      console.warn("Test cleanup warning:", error);
    }
  }
});
