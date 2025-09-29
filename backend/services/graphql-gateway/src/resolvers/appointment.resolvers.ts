import { logger } from "@hospital/shared";
import { contextUtils, GraphQLContext } from "../context";

/**
 * Appointment GraphQL Resolvers
 * Handles all appointment-related queries, mutations, and subscriptions
 * Supports Vietnamese language and hospital management requirements
 */
export const appointmentResolvers = {
  Query: {
    // Get single appointment
    async appointment(
      _: any,
      { id, appointment_id }: { id?: string; appointment_id?: string },
      context: GraphQLContext
    ) {
      try {
        const identifier = id || appointment_id;
        if (!identifier) {
          throw new Error(
            contextUtils.translate(
              context,
              "appointment.errors.missing_identifier"
            )
          );
        }

        logger.debug("Fetching appointment:", {
          identifier,
          requestId: context.requestId,
        });

        const response = await context.restApi.getAppointment(identifier);

        if (!response.success) {
          throw new Error(
            response.error?.message ||
              contextUtils.translate(context, "appointment.errors.fetch_failed")
          );
        }

        return response.data;
      } catch (error) {
        logger.error("Error fetching appointment:", error);
        throw error;
      }
    },

    // Get multiple appointments with filters
    async appointments(
      _: any,
      {
        filters,
        limit = 20,
        offset = 0,
        sortBy = "scheduledDateTime",
        sortOrder = "ASC",
      }: any,
      context: GraphQLContext
    ) {
      try {
        logger.debug("Fetching appointments:", {
          filters,
          limit,
          offset,
          requestId: context.requestId,
        });

        const response = await context.restApi.getAppointments({
          ...filters,
          limit,
          offset,
          sortBy,
          sortOrder,
        });

        if (!response.success) {
          throw new Error(
            response.error?.message ||
              contextUtils.translate(context, "appointment.errors.fetch_failed")
          );
        }

        return {
          edges: response.data.map((appointment: any) => ({
            node: appointment,
            cursor: Buffer.from(appointment.id).toString("base64"),
          })),
          pageInfo: {
            hasNextPage: response.data.length === limit,
            hasPreviousPage: offset > 0,
            startCursor:
              response.data.length > 0
                ? Buffer.from(response.data[0].id).toString("base64")
                : null,
            endCursor:
              response.data.length > 0
                ? Buffer.from(
                    response.data[response.data.length - 1].id
                  ).toString("base64")
                : null,
          },
          totalCount: (response as any).totalCount || response.data.length,
        };
      } catch (error) {
        logger.error("Error fetching appointments:", error);
        throw error;
      }
    },

    // Get today's appointments
    async todayAppointments(
      _: any,
      { doctor_id, departmentId, status }: any,
      context: GraphQLContext
    ) {
      try {
        logger.debug("Fetching today appointments:", {
          doctor_id,
          departmentId,
          status,
          requestId: context.requestId,
        });

        const today = new Date().toISOString().split("T")[0];
        const response = await context.restApi.getTodayAppointments({
          doctor_id,
          departmentId,
          status,
          date: today,
        });

        if (!response.success) {
          throw new Error(
            response.error?.message ||
              contextUtils.translate(context, "appointment.errors.today_failed")
          );
        }

        return response.data;
      } catch (error) {
        logger.error("Error fetching today appointments:", error);
        throw error;
      }
    },

    // Waiting queue for reception flow
    async waitingQueue(
      _: any,
      {
        doctor_id,
        department_id,
        date,
      }: { doctor_id?: string; department_id?: string; date?: string },
      context: GraphQLContext
    ) {
      try {
        logger.debug("Fetching waiting queue:", {
          doctor_id,
          department_id,
          date,
          requestId: context.requestId,
        });

        const params: any = {};
        if (doctor_id) params.doctor_id = doctor_id;
        if (department_id) params.department_id = department_id;
        if (date) params.date = date;

        const response = await context.restApi.getReceptionistQueue(params);
        if (!response.success) {
          throw new Error(
            response.error?.message ||
              contextUtils.translate(context, "appointment.errors.fetch_failed")
          );
        }

        const items = Array.isArray(response.data) ? response.data : [];
        return items.map((item: any) => ({
          appointment_id: item.appointment_id || item.id,
          doctor_id: item.doctor_id,
          patient_id: item.patient_id,
          status: (item.status || "CONFIRMED").toUpperCase(),
          scheduled_time: item.scheduled_time || item.start_time,
          scheduled_date_time:
            item.scheduled_date_time || item.scheduled_time || item.start_time,
          duration: item.duration || 30,
          checked_in_at: item.check_in_time || item.checked_in_at,
        }));
      } catch (error) {
        logger.error("Error fetching waiting queue:", error);
        throw error;
      }
    },

    // Get upcoming appointments
    async upcomingAppointments(
      _: any,
      { doctor_id, patient_id, days = 7, limit = 20 }: any,
      context: GraphQLContext
    ) {
      try {
        logger.debug("Fetching upcoming appointments:", {
          doctor_id,
          patient_id,
          days,
          limit,
          requestId: context.requestId,
        });

        const response = await context.restApi.getUpcomingAppointments({
          doctor_id,
          patient_id,
          days,
          limit,
        });

        if (!response.success) {
          throw new Error(
            response.error?.message ||
              contextUtils.translate(
                context,
                "appointment.errors.upcoming_failed"
              )
          );
        }

        return response.data;
      } catch (error) {
        logger.error("Error fetching upcoming appointments:", error);
        throw error;
      }
    },

    // Get available slots
    async availableSlots(
      _: any,
      {
        doctor_id,
        date,
        duration = 30,
      }: { doctor_id: string; date: string; duration: number },
      context: GraphQLContext
    ) {
      try {
        logger.debug("Fetching available slots:", {
          doctor_id,
          date,
          duration,
          requestId: context.requestId,
        });

        const cacheKey = `${doctor_id}`;
        const slots = await context.dataloaders.availableSlots.load(cacheKey);

        // Filter slots by duration if needed
        return slots.filter((slot: any) => slot.duration >= duration);
      } catch (error) {
        logger.error("Error fetching available slots:", error);
        throw error;
      }
    },

    // Get appointment statistics
    async appointmentStats(
      _: any,
      { doctor_id, patient_id, departmentId, dateFrom, dateTo }: any,
      context: GraphQLContext
    ) {
      try {
        logger.debug("Fetching appointment stats:", {
          doctor_id,
          patient_id,
          departmentId,
          requestId: context.requestId,
        });

        const response = await context.restApi.getAppointmentStats({
          doctor_id,
          patient_id,
          departmentId,
          dateFrom,
          dateTo,
        });

        if (!response.success) {
          throw new Error(
            response.error?.message ||
              contextUtils.translate(context, "appointment.errors.stats_failed")
          );
        }

        return response.data;
      } catch (error) {
        logger.error("Error fetching appointment stats:", error);
        throw error;
      }
    },
  },

  Mutation: {
    // Create new appointment
    async createAppointment(
      _: any,
      { input }: { input: any },
      context: GraphQLContext
    ) {
      try {
        logger.debug("Creating appointment:", {
          input,
          requestId: context.requestId,
        });

        const response = await context.restApi.createAppointment(input);

        if (!response.success) {
          throw new Error(
            response.error?.message ||
              contextUtils.translate(
                context,
                "appointment.errors.create_failed"
              )
          );
        }

        logger.info("Appointment created successfully:", {
          appointment_id: response.data.appointment_id,
        });
        return response.data;
      } catch (error) {
        logger.error("Error creating appointment:", error);
        throw error;
      }
    },

    // Update appointment
    async updateAppointment(
      _: any,
      { id, input }: { id: string; input: any },
      context: GraphQLContext
    ) {
      try {
        logger.debug("Updating appointment:", {
          id,
          input,
          requestId: context.requestId,
        });

        const response = await context.restApi.updateAppointment(id, input);

        if (!response.success) {
          throw new Error(
            response.error?.message ||
              contextUtils.translate(
                context,
                "appointment.errors.update_failed"
              )
          );
        }

        logger.info("Appointment updated successfully:", {
          appointment_id: id,
        });
        return response.data;
      } catch (error) {
        logger.error("Error updating appointment:", error);
        throw error;
      }
    },

    // Cancel appointment
    async cancelAppointment(
      _: any,
      { input }: { input: any },
      context: GraphQLContext
    ) {
      try {
        logger.debug("Cancelling appointment:", {
          input,
          requestId: context.requestId,
        });

        const response = await context.restApi.cancelAppointment(
          input.appointment_id,
          input.reason || "Hủy cuộc hẹn"
        );

        if (!response.success) {
          throw new Error(
            response.error?.message ||
              contextUtils.translate(
                context,
                "appointment.errors.cancel_failed"
              )
          );
        }

        logger.info("Appointment cancelled successfully:", {
          appointment_id: input.appointment_id,
        });
        return response.data;
      } catch (error) {
        logger.error("Error cancelling appointment:", error);
        throw error;
      }
    },

    // Confirm appointment
    async confirmAppointment(
      _: any,
      { id }: { id: string },
      context: GraphQLContext
    ) {
      try {
        logger.debug("Confirming appointment:", {
          id,
          requestId: context.requestId,
        });

        const response = await context.restApi.confirmAppointment(id);

        if (!response.success) {
          throw new Error(
            response.error?.message ||
              contextUtils.translate(
                context,
                "appointment.errors.confirm_failed"
              )
          );
        }

        logger.info("Appointment confirmed successfully:", {
          appointment_id: id,
        });
        return response.data;
      } catch (error) {
        logger.error("Error confirming appointment:", error);
        throw error;
      }
    },

    // Reschedule appointment
    async rescheduleAppointment(
      _: any,
      { input }: { input: any },
      context: GraphQLContext
    ) {
      try {
        logger.debug("Rescheduling appointment:", {
          input,
          requestId: context.requestId,
        });

        const response = await context.restApi.rescheduleAppointment(
          input.appointment_id,
          {
            newDate: input.newDate,
            newTime: input.newTime,
          }
        );

        if (!response.success) {
          throw new Error(
            response.error?.message ||
              contextUtils.translate(
                context,
                "appointment.errors.reschedule_failed"
              )
          );
        }

        logger.info("Appointment rescheduled successfully:", {
          appointment_id: input.appointment_id,
        });
        return response.data;
      } catch (error) {
        logger.error("Error rescheduling appointment:", error);
        throw error;
      }
    },

    // Check in appointment - DELEGATED to Receptionist Service
    async checkInAppointment(
      _: any,
      { id }: { id: string },
      context: GraphQLContext
    ) {
      try {
        logger.debug("Delegating check-in to Receptionist Service:", {
          id,
          requestId: context.requestId,
        });

        // TODO: Call Receptionist Service API for check-in
        // This ensures proper queue management and receptionist workflow
        // For now, return error to indicate delegation needed
        throw new Error(
          contextUtils.translate(
            context,
            "appointment.errors.checkin_delegated_to_receptionist"
          ) || "Check-in operations are handled by Receptionist Service"
        );

        // Future implementation should call:
        // const response = await context.restApi.receptionistCheckIn(id);
      } catch (error) {
        logger.error("Error in check-in delegation:", error);
        throw error;
      }
    },

    // Complete appointment
    async completeAppointment(
      _: any,
      { id, notes }: { id: string; notes?: string },
      context: GraphQLContext
    ) {
      try {
        logger.debug("Completing appointment:", {
          id,
          notes,
          requestId: context.requestId,
        });

        const response = await context.restApi.completeAppointment(id, notes);

        if (!response.success) {
          throw new Error(
            response.error?.message ||
              contextUtils.translate(
                context,
                "appointment.errors.complete_failed"
              )
          );
        }

        logger.info("Appointment completed successfully:", {
          appointment_id: id,
        });
        return response.data;
      } catch (error) {
        logger.error("Error completing appointment:", error);
        throw error;
      }
    },
  },

  // Field resolvers for Appointment type
  Appointment: {
    // Calculate end date time
    endDateTime(parent: any) {
      if (!parent.scheduledDateTime || !parent.duration) return null;

      const startTime = new Date(parent.scheduledDateTime);
      const endTime = new Date(startTime.getTime() + parent.duration * 60000);
      return endTime.toISOString();
    },

    // Resolve doctor using DataLoader
    async doctor(parent: any, _: any, context: GraphQLContext) {
      if (!parent.doctor_id) return null;

      try {
        return await context.dataloaders.doctorById.load(parent.doctor_id);
      } catch (error) {
        logger.error("Error loading appointment doctor:", error);
        return null;
      }
    },

    // Resolve patient using DataLoader
    async patient(parent: any, _: any, context: GraphQLContext) {
      if (!parent.patient_id) return null;

      try {
        return await context.dataloaders.patientById.load(parent.patient_id);
      } catch (error) {
        logger.error("Error loading appointment patient:", error);
        return null;
      }
    },

    // Resolve department using DataLoader
    async department(parent: any, _: any, context: GraphQLContext) {
      if (!parent.departmentId) return null;

      try {
        return await context.dataloaders.departmentById.load(
          parent.departmentId
        );
      } catch (error) {
        logger.error("Error loading appointment department:", error);
        return null;
      }
    },

    // Computed fields
    isToday(parent: any) {
      if (!parent.scheduledDate) return false;

      const today = new Date().toISOString().split("T")[0];
      const appointmentDate = new Date(parent.scheduledDate)
        .toISOString()
        .split("T")[0];
      return today === appointmentDate;
    },

    isUpcoming(parent: any) {
      if (!parent.scheduledDateTime) return false;

      const now = new Date();
      const appointmentTime = new Date(parent.scheduledDateTime);
      return appointmentTime > now && parent.status !== "CANCELLED";
    },

    isPast(parent: any) {
      if (!parent.scheduledDateTime) return false;

      const now = new Date();
      const appointmentTime = new Date(parent.scheduledDateTime);
      return appointmentTime < now;
    },

    canCancel(parent: any) {
      if (
        !parent.scheduledDateTime ||
        parent.status === "CANCELLED" ||
        parent.status === "COMPLETED"
      ) {
        return false;
      }

      const now = new Date();
      const appointmentTime = new Date(parent.scheduledDateTime);
      const hoursUntilAppointment =
        (appointmentTime.getTime() - now.getTime()) / (1000 * 60 * 60);

      // Can cancel if appointment is more than 2 hours away
      return hoursUntilAppointment > 2;
    },

    canReschedule(parent: any) {
      if (
        !parent.scheduledDateTime ||
        parent.status === "CANCELLED" ||
        parent.status === "COMPLETED"
      ) {
        return false;
      }

      const now = new Date();
      const appointmentTime = new Date(parent.scheduledDateTime);
      const hoursUntilAppointment =
        (appointmentTime.getTime() - now.getTime()) / (1000 * 60 * 60);

      // Can reschedule if appointment is more than 4 hours away
      return hoursUntilAppointment > 4;
    },

    timeUntilAppointment(parent: any) {
      if (!parent.scheduledDateTime) return null;

      const now = new Date();
      const appointmentTime = new Date(parent.scheduledDateTime);
      const minutesUntil = Math.floor(
        (appointmentTime.getTime() - now.getTime()) / (1000 * 60)
      );

      return minutesUntil > 0 ? minutesUntil : null;
    },

    waitingTime(parent: any) {
      if (!parent.checkedInAt || parent.status !== "CONFIRMED") return null;

      const now = new Date();
      const checkedInTime = new Date(parent.checkedInAt);
      const waitingMinutes = Math.floor(
        (now.getTime() - checkedInTime.getTime()) / (1000 * 60)
      );

      return waitingMinutes > 0 ? waitingMinutes : 0;
    },
  },
};

export default appointmentResolvers;
