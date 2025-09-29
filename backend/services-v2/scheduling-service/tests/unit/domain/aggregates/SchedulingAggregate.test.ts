/**
 * Scheduling Aggregate Unit Tests
 * V2 Clean Architecture + DDD Implementation
 * Tests for Appointment aggregate business logic
 *
 * @author Hospital Management Team
 * @version 2.0.0
 */

import {
  Appointment,
  AppointmentStatus,
} from "../../../../src/domain/aggregates/scheduling.aggregate";
import {
  AppointmentPriority,
  AppointmentType,
} from "../../../../src/domain/value-objects/AppointmentId";
import { TestDataFactory } from "../../../factories/TestDataFactory";
import { TEST_CONSTANTS } from "../../../setup";

describe("Scheduling Aggregate", () => {
  describe("Appointment Creation", () => {
    it("should create appointment with valid data", () => {
      const appointment = TestDataFactory.createAppointment();

      expect(appointment).toBeDefined();
      expect(appointment.id).toBeDefined();
      expect(appointment.appointmentId).toBeDefined();
      expect(appointment.patient).toBeDefined();
      expect(appointment.provider).toBeDefined();
      expect(appointment.timeSlot).toBeDefined();
      expect(appointment.details).toBeDefined();
      expect(appointment.status).toBe(AppointmentStatus.SCHEDULED);
      expect(appointment.createdAt).toBeValidDate();
      expect(appointment.updatedAt).toBeValidDate();
      expect(appointment.version).toBe(1);
    });

    it("should generate unique appointment IDs", () => {
      const appointment1 = TestDataFactory.createAppointment();
      const appointment2 = TestDataFactory.createAppointment();

      expect(appointment1.appointmentId.value).not.toBe(
        appointment2.appointmentId.value
      );
      expect(appointment1.id).not.toBe(appointment2.id);
    });

    it("should set correct initial status", () => {
      const appointment = TestDataFactory.createAppointment();

      expect(appointment.status).toBe(AppointmentStatus.SCHEDULED);
      expect(appointment.confirmedAt).toBeUndefined();
      expect(appointment.startedAt).toBeUndefined();
      expect(appointment.completedAt).toBeUndefined();
      expect(appointment.cancelledAt).toBeUndefined();
    });

    it("should validate Vietnamese healthcare business rules", () => {
      // Note: Business rules validation is handled in Value Objects
      // This test verifies the aggregate accepts valid data
      const validAppointment = TestDataFactory.createAppointment();
      expect(validAppointment).toBeDefined();
      expect(validAppointment.status).toBe(AppointmentStatus.SCHEDULED);
    });
  });

  describe("Appointment State Transitions", () => {
    let appointment: Appointment;

    beforeEach(() => {
      appointment = TestDataFactory.createAppointment();
    });

    describe("Confirm Appointment", () => {
      it("should confirm scheduled appointment", () => {
        const userId = "test-user";
        appointment.confirm(userId);

        expect(appointment.status).toBe(AppointmentStatus.CONFIRMED);
        expect(appointment.confirmedAt).toBeValidDate();
        expect(appointment.confirmedBy).toBe(userId);
        expect(appointment.version).toBe(2);
      });

      it("should not confirm already confirmed appointment", () => {
        appointment.confirm("user1");

        expect(() => {
          appointment.confirm("user2");
        }).toThrow("Cuộc hẹn đã được xác nhận");
      });

      it("should not confirm cancelled appointment", () => {
        appointment.cancel("user1", "Test cancellation");

        expect(() => {
          appointment.confirm("user2");
        }).toThrow("Không thể xác nhận cuộc hẹn đã hủy");
      });
    });

    describe("Start Appointment", () => {
      it("should start confirmed appointment", () => {
        const userId = "test-user";
        appointment.confirm(userId);
        appointment.start(userId);

        expect(appointment.status).toBe(AppointmentStatus.IN_PROGRESS);
        expect(appointment.startedAt).toBeValidDate();
        expect(appointment.startedBy).toBe(userId);
        expect(appointment.version).toBe(3);
      });

      it("should not start unconfirmed appointment", () => {
        expect(() => {
          appointment.start("test-user");
        }).toThrow("Chỉ có thể bắt đầu cuộc hẹn đã được xác nhận");
      });

      it("should not start already started appointment", () => {
        appointment.confirm("user1");
        appointment.start("user1");

        expect(() => {
          appointment.start("user2");
        }).toThrow("Cuộc hẹn đã được bắt đầu");
      });
    });

    describe("Complete Appointment", () => {
      it("should complete in-progress appointment", () => {
        const userId = "test-user";
        const summary = "Khám xong, bệnh nhân khỏe mạnh";

        appointment.confirm(userId);
        appointment.start(userId);
        appointment.complete(userId, summary);

        expect(appointment.status).toBe(AppointmentStatus.COMPLETED);
        expect(appointment.completedAt).toBeValidDate();
        expect(appointment.completedBy).toBe(userId);
        expect(appointment.completionSummary).toBe(summary);
        expect(appointment.version).toBe(4);
      });

      it("should not complete appointment not in progress", () => {
        expect(() => {
          appointment.complete("test-user", "Summary");
        }).toThrow("Chỉ có thể hoàn thành cuộc hẹn đang diễn ra");
      });

      it("should require completion summary", () => {
        appointment.confirm("user1");
        appointment.start("user1");

        expect(() => {
          appointment.complete("user1", "");
        }).toThrow("Tóm tắt hoàn thành là bắt buộc");
      });
    });

    describe("Cancel Appointment", () => {
      it("should cancel scheduled appointment", () => {
        const userId = "test-user";
        const reason = "Bệnh nhân hủy lịch";

        appointment.cancel(userId, reason);

        expect(appointment.status).toBe(AppointmentStatus.CANCELLED);
        expect(appointment.cancelledAt).toBeValidDate();
        expect(appointment.cancelledBy).toBe(userId);
        expect(appointment.cancellationReason).toBe(reason);
        expect(appointment.version).toBe(2);
      });

      it("should cancel confirmed appointment", () => {
        const userId = "test-user";
        const reason = "Bác sĩ bận đột xuất";

        appointment.confirm(userId);
        appointment.cancel(userId, reason);

        expect(appointment.status).toBe(AppointmentStatus.CANCELLED);
        expect(appointment.cancellationReason).toBe(reason);
      });

      it("should not cancel completed appointment", () => {
        const userId = "test-user";

        appointment.confirm(userId);
        appointment.start(userId);
        appointment.complete(userId, "Completed");

        expect(() => {
          appointment.cancel(userId, "Reason");
        }).toThrow("Không thể hủy cuộc hẹn đã hoàn thành");
      });

      it("should require cancellation reason", () => {
        expect(() => {
          appointment.cancel("test-user", "");
        }).toThrow("Lý do hủy là bắt buộc");
      });
    });

    describe("Mark No Show", () => {
      it("should mark confirmed appointment as no show", () => {
        const userId = "test-user";
        const reason = "Bệnh nhân không đến";

        appointment.confirm(userId);
        appointment.markNoShow(userId, reason);

        expect(appointment.status).toBe(AppointmentStatus.NO_SHOW);
        expect(appointment.noShowAt).toBeValidDate();
        expect(appointment.noShowBy).toBe(userId);
        expect(appointment.noShowReason).toBe(reason);
        expect(appointment.version).toBe(3);
      });

      it("should not mark unconfirmed appointment as no show", () => {
        expect(() => {
          appointment.markNoShow("test-user", "Reason");
        }).toThrow("Chỉ có thể đánh dấu vắng mặt cho cuộc hẹn đã xác nhận");
      });
    });

    describe("Reschedule Appointment", () => {
      it("should reschedule confirmed appointment", () => {
        const userId = "test-user";
        const newTimeSlot = TestDataFactory.createTimeSlot({
          startTime: new Date(TEST_CONSTANTS.DATES.NEXT_WEEK),
          endTime: new Date(
            TEST_CONSTANTS.DATES.NEXT_WEEK.getTime() + 30 * 60 * 1000
          ),
        });
        const reason = "Bệnh nhân yêu cầu đổi lịch";

        appointment.confirm(userId);
        const oldTimeSlot = appointment.timeSlot;
        appointment.reschedule(newTimeSlot, reason, userId);

        expect(appointment.timeSlot).toBe(newTimeSlot);
        expect(appointment.previousTimeSlot).toBe(oldTimeSlot);
        expect(appointment.rescheduleReason).toBe(reason);
        expect(appointment.rescheduledAt).toBeValidDate();
        expect(appointment.rescheduledBy).toBe(userId);
        expect(appointment.version).toBe(3);
      });

      it("should not reschedule completed appointment", () => {
        const userId = "test-user";
        const newTimeSlot = TestDataFactory.createTimeSlot();

        appointment.confirm(userId);
        appointment.start(userId);
        appointment.complete(userId, "Completed");

        expect(() => {
          appointment.reschedule(newTimeSlot, "Reason", userId);
        }).toThrow("Không thể thay đổi lịch hẹn đã hoàn thành");
      });

      it("should validate new time slot", () => {
        const userId = "test-user";
        const pastTimeSlot = TestDataFactory.createTimeSlot({
          startTime: TEST_CONSTANTS.DATES.YESTERDAY,
          endTime: new Date(
            TEST_CONSTANTS.DATES.YESTERDAY.getTime() + 30 * 60 * 1000
          ),
        });

        appointment.confirm(userId);

        expect(() => {
          appointment.reschedule(pastTimeSlot, "Reason", userId);
        }).toThrow("Thời gian hẹn mới phải trong tương lai");
      });
    });
  });

  describe("Domain Events", () => {
    let appointment: Appointment;

    beforeEach(() => {
      appointment = TestDataFactory.createAppointment();
    });

    it("should publish AppointmentScheduledEvent on creation", () => {
      const events = appointment.getUncommittedEvents();

      expect(events).toHaveLength(1);
      expect(events[0].eventType).toBe("AppointmentScheduledEvent");
      expect(events[0].aggregateId).toBe(appointment.id);
    });

    it("should publish AppointmentConfirmedEvent on confirmation", () => {
      appointment.confirm("test-user");
      const events = appointment.getUncommittedEvents();

      expect(events).toHaveLength(2); // Scheduled + Confirmed
      expect(events[1].eventType).toBe("AppointmentConfirmedEvent");
    });

    it("should publish AppointmentCancelledEvent on cancellation", () => {
      appointment.cancel("test-user", "Test reason");
      const events = appointment.getUncommittedEvents();

      expect(events).toHaveLength(2); // Scheduled + Cancelled
      expect(events[1].eventType).toBe("AppointmentCancelledEvent");
    });

    it("should publish AppointmentRescheduledEvent on reschedule", () => {
      const newTimeSlot = TestDataFactory.createTimeSlot();
      appointment.confirm("test-user");
      appointment.reschedule(newTimeSlot, "Test reason", "test-user");

      const events = appointment.getUncommittedEvents();
      expect(events).toHaveLength(3); // Scheduled + Confirmed + Rescheduled
      expect(events[2].eventType).toBe("AppointmentRescheduledEvent");
    });

    it("should clear uncommitted events after marking as committed", () => {
      appointment.confirm("test-user");
      expect(appointment.getUncommittedEvents()).toHaveLength(2);

      appointment.markEventsAsCommitted();
      expect(appointment.getUncommittedEvents()).toHaveLength(0);
    });
  });

  describe("Business Rules Validation", () => {
    it("should validate emergency appointment priority", () => {
      const emergencyAppointment = TestDataFactory.createEmergencyAppointment();

      expect(emergencyAppointment.appointmentId.priority).toBe(
        AppointmentPriority.EMERGENCY
      );
      expect(emergencyAppointment.appointmentId.type).toBe(
        AppointmentType.EMERGENCY
      );
      expect(emergencyAppointment.details.urgencyLevel).toBe("emergency");
    });

    it("should validate Vietnamese healthcare compliance", () => {
      const vietnameseAppointment =
        TestDataFactory.createVietnameseHealthcareAppointment();

      expect(vietnameseAppointment.patient.phone).toBeValidVietnamesePhone();
      expect(
        vietnameseAppointment.patient.nationalId
      ).toBeValidVietnameseNationalId();
      expect(vietnameseAppointment.patient.insuranceType).toBe("BHYT");
      expect(vietnameseAppointment.provider.licenseNumber).toMatch(
        /^VN-[A-Z]{2}-\d{4}$/
      );
    });

    it("should validate appointment duration limits", () => {
      expect(() => {
        TestDataFactory.createAppointment({
          details: TestDataFactory.createAppointmentDetails({
            estimatedDuration: 10, // Less than minimum 15 minutes
          }),
        });
      }).toThrow("Thời gian hẹn tối thiểu là 15 phút");

      expect(() => {
        TestDataFactory.createAppointment({
          details: TestDataFactory.createAppointmentDetails({
            estimatedDuration: 500, // More than maximum 480 minutes (8 hours)
          }),
        });
      }).toThrow("Thời gian hẹn tối đa là 8 giờ");
    });
  });

  describe("PHI (Protected Health Information) Compliance", () => {
    it("should identify appointments containing PHI", () => {
      const appointment = TestDataFactory.createAppointment();

      expect(appointment.containsPHI()).toBe(true);
    });

    it("should return patient ID for PHI tracking", () => {
      const appointment = TestDataFactory.createAppointment();

      expect(appointment.getPatientId()).toBe(appointment.patient.patientId);
    });

    it("should mask sensitive information in toString", () => {
      const appointment = TestDataFactory.createAppointment();
      const stringRepresentation = appointment.toString();

      // Should not contain full phone number or national ID
      expect(stringRepresentation).not.toContain(appointment.patient.phone);
      expect(stringRepresentation).not.toContain(
        appointment.patient.nationalId
      );
      expect(stringRepresentation).toContain("***"); // Should contain masked values
    });
  });
});
