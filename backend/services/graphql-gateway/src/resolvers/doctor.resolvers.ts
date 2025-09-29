import logger from "@hospital/shared/dist/utils/logger";
import { GraphQLContext } from "../context";

/**
 * Doctor GraphQL Resolvers
 * Handles all doctor-related queries, mutations, and subscriptions
 */
export const doctorResolvers = {
  Query: {
    // Get single doctor
    async doctor(
      _: any,
      { id, doctor_id }: { id?: string; doctor_id?: string },
      context: GraphQLContext
    ) {
      try {
        const identifier = id || doctor_id;
        if (!identifier) {
          throw new Error("Cần cung cấp ID hoặc mã bác sĩ");
        }

        logger.debug("Fetching doctor:", {
          identifier,
          requestId: context.requestId,
        });

        const response = await context.restApi.getDoctor(identifier);

        if (!response.success) {
          throw new Error(
            response.error?.message || "Không thể lấy thông tin bác sĩ"
          );
        }

        return response.data;
      } catch (error) {
        logger.error("Error fetching doctor:", error);
        throw error;
      }
    },

    // Get multiple doctors with filtering and pagination
    async doctors(
      _: any,
      {
        filters,
        limit = 20,
        offset = 0,
        sortBy = "created_at",
        sortOrder = "DESC",
      }: {
        filters?: any;
        limit?: number;
        offset?: number;
        sortBy?: string;
        sortOrder?: string;
      },
      context: GraphQLContext
    ) {
      try {
        logger.debug("Fetching doctors:", {
          filters,
          limit,
          offset,
          sortBy,
          sortOrder,
          requestId: context.requestId,
        });

        const params = {
          page: Math.floor(offset / limit) + 1,
          limit,
          ...filters,
        };

        const response = await context.restApi.getDoctors(params);

        if (!response.success) {
          throw new Error(
            response.error?.message || "Không thể lấy danh sách bác sĩ"
          );
        }

        // Transform to GraphQL Connection format
        const doctors = Array.isArray(response.data) ? response.data : [];
        const totalCount = response.pagination?.total || doctors.length;

        return {
          edges: doctors.map((doctor: any, index: number) => ({
            node: doctor,
            cursor: Buffer.from(`${offset + index}`).toString("base64"),
          })),
          pageInfo: {
            hasNextPage: response.pagination?.hasNext || false,
            hasPreviousPage: response.pagination?.hasPrev || false,
            startCursor:
              doctors.length > 0
                ? Buffer.from(`${offset}`).toString("base64")
                : null,
            endCursor:
              doctors.length > 0
                ? Buffer.from(`${offset + doctors.length - 1}`).toString(
                    "base64"
                  )
                : null,
          },
          totalCount,
        };
      } catch (error) {
        logger.error("Error fetching doctors:", error);
        throw error;
      }
    },

    // Search doctors
    async searchDoctors(
      _: any,
      {
        query,
        filters,
        limit = 20,
        offset = 0,
      }: {
        query: string;
        filters?: any;
        limit?: number;
        offset?: number;
      },
      context: GraphQLContext
    ) {
      try {
        logger.debug("Searching doctors:", {
          query,
          filters,
          limit,
          offset,
          requestId: context.requestId,
        });

        const params = {
          page: Math.floor(offset / limit) + 1,
          limit,
          search: query,
          ...filters,
        };

        const response = await context.restApi.getDoctors(params);

        if (!response.success) {
          throw new Error(
            response.error?.message || "Không thể tìm kiếm bác sĩ"
          );
        }

        // Transform to GraphQL Connection format
        const doctors = Array.isArray(response.data) ? response.data : [];
        const totalCount = response.pagination?.total || doctors.length;

        return {
          edges: doctors.map((doctor: any, index: number) => ({
            node: doctor,
            cursor: Buffer.from(`${offset + index}`).toString("base64"),
          })),
          pageInfo: {
            hasNextPage: response.pagination?.hasNext || false,
            hasPreviousPage: response.pagination?.hasPrev || false,
            startCursor:
              doctors.length > 0
                ? Buffer.from(`${offset}`).toString("base64")
                : null,
            endCursor:
              doctors.length > 0
                ? Buffer.from(`${offset + doctors.length - 1}`).toString(
                    "base64"
                  )
                : null,
          },
          totalCount,
        };
      } catch (error) {
        logger.error("Error searching doctors:", error);
        throw error;
      }
    },

    // Get doctor availability
    async doctorAvailability(
      _: any,
      { doctor_id, date }: { doctor_id: string; date: string },
      context: GraphQLContext
    ) {
      try {
        logger.debug("Fetching doctor availability:", {
          doctor_id,
          date,
          requestId: context.requestId,
        });

        const response = await context.restApi.getAvailableSlots(
          doctor_id,
          date
        );

        if (!response.success) {
          throw new Error(
            response.error?.message || "Không thể lấy lịch trống của bác sĩ"
          );
        }

        return response.data || [];
      } catch (error) {
        logger.error("Error fetching doctor availability:", error);
        throw error;
      }
    },

    // Get doctor statistics
    async doctorStats(
      _: any,
      { doctor_id }: { doctor_id: string },
      context: GraphQLContext
    ) {
      try {
        // Use DataLoader for optimization
        const stats = await context.dataloaders.doctorStats.load(doctor_id);

        if (!stats) {
          throw new Error("Không thể lấy thống kê bác sĩ");
        }

        return stats;
      } catch (error) {
        logger.error("Error fetching doctor stats:", error);
        throw error;
      }
    },

    // Get doctor reviews
    async doctorReviews(
      _: any,
      {
        doctor_id,
        limit = 10,
        offset = 0,
      }: { doctor_id: string; limit?: number; offset?: number },
      context: GraphQLContext
    ) {
      try {
        logger.debug("Fetching doctor reviews:", {
          doctor_id,
          limit,
          offset,
          requestId: context.requestId,
        });

        const response = await context.restApi.getDoctorReviews({
          doctor_id,
          limit,
          offset,
        });

        if (!response.success) {
          throw new Error(
            response.error?.message || "Không thể lấy đánh giá bác sĩ"
          );
        }

        return response.data || [];
      } catch (error) {
        logger.error("Error fetching doctor reviews:", error);
        throw error;
      }
    },

    // Get doctor schedule (legacy support)
    async doctorSchedule(
      _: any,
      { doctor_id, date }: { doctor_id: string; date?: string },
      context: GraphQLContext
    ) {
      try {
        logger.debug("Fetching doctor schedule:", {
          doctor_id,
          date,
          requestId: context.requestId,
        });

        const response = await context.restApi.getDoctorSchedule(
          doctor_id,
          date
        );

        if (!response.success) {
          throw new Error(
            response.error?.message || "Không thể lấy lịch làm việc bác sĩ"
          );
        }

        return response.data || [];
      } catch (error) {
        logger.error("Error fetching doctor schedule:", error);
        throw error;
      }
    },

    // Enhanced doctor schedule queries
    async doctorScheduleEnhanced(
      _: any,
      {
        doctor_id,
        weekStartDate,
      }: { doctor_id: string; weekStartDate?: string },
      context: GraphQLContext
    ) {
      try {
        logger.debug("Fetching enhanced doctor schedule:", {
          doctor_id,
          weekStartDate,
          requestId: context.requestId,
        });

        const response = await context.restApi.getDoctorSchedule(
          doctor_id,
          weekStartDate
        );

        if (!response.success) {
          throw new Error(
            response.error?.message || "Không thể lấy lịch làm việc nâng cao"
          );
        }

        return response.data || [];
      } catch (error) {
        logger.error("Error fetching enhanced doctor schedule:", error);
        throw error;
      }
    },

    async doctorWeeklyAvailability(
      _: any,
      {
        doctor_id,
        weekStartDate,
      }: { doctor_id: string; weekStartDate: string },
      context: GraphQLContext
    ) {
      try {
        logger.debug("Fetching doctor weekly availability:", {
          doctor_id,
          weekStartDate,
          requestId: context.requestId,
        });

        const response = await context.restApi.getDoctorSchedule(
          doctor_id,
          weekStartDate
        );

        if (!response.success) {
          throw new Error(
            response.error?.message || "Không thể lấy lịch tuần bác sĩ"
          );
        }

        return response.data;
      } catch (error) {
        logger.error("Error fetching doctor weekly availability:", error);
        throw error;
      }
    },

    async doctorAppointmentSlots(
      _: any,
      { doctor_id, date }: { doctor_id: string; date: string },
      context: GraphQLContext
    ) {
      try {
        logger.debug("Fetching doctor appointment slots:", {
          doctor_id,
          date,
          requestId: context.requestId,
        });

        const response = await context.restApi.getAppointments({
          doctor_id,
          dateFrom: date,
        });

        if (!response.success) {
          throw new Error(
            response.error?.message || "Không thể lấy slot cuộc hẹn"
          );
        }

        return response.data || [];
      } catch (error) {
        logger.error("Error fetching doctor appointment slots:", error);
        throw error;
      }
    },

    // Get single room
    async room(_: any, { id }: { id: string }, context: GraphQLContext) {
      try {
        logger.debug("Fetching room:", { id, requestId: context.requestId });

        const response = await context.restApi.getRoom(id);

        if (!response.success) {
          throw new Error(
            response.error?.message || "Không thể lấy thông tin phòng"
          );
        }

        return response.data;
      } catch (error) {
        logger.error("Error fetching room:", error);
        throw error;
      }
    },

    // Get multiple rooms
    async rooms(
      _: any,
      { departmentId, roomType, is_active = true, limit = 20 }: any,
      context: GraphQLContext
    ) {
      try {
        logger.debug("Fetching rooms:", {
          departmentId,
          roomType,
          is_active,
          limit,
          requestId: context.requestId,
        });

        const response = await context.restApi.getRooms({
          departmentId,
          roomType,
          is_active,
          limit,
        });

        if (!response.success) {
          throw new Error(
            response.error?.message || "Không thể lấy danh sách phòng"
          );
        }

        return response.data || [];
      } catch (error) {
        logger.error("Error fetching rooms:", error);
        throw error;
      }
    },
  },

  Mutation: {
    // Create new doctor
    async createDoctor(
      _: any,
      { input }: { input: any },
      context: GraphQLContext
    ) {
      try {
        // Require authentication and admin role
        if (!context.user) {
          throw new Error("Yêu cầu xác thực");
        }

        if (context.user.role !== "admin") {
          throw new Error("Chỉ admin mới có thể tạo bác sĩ mới");
        }

        logger.debug("Creating doctor:", {
          input: { ...input, email: input.email },
          userId: context.user.id,
          requestId: context.requestId,
        });

        const response = await context.restApi.createDoctor(input);

        if (!response.success) {
          throw new Error(
            response.error?.message || "Không thể tạo bác sĩ mới"
          );
        }

        // Clear relevant caches
        context.dataloaders.doctorById.clear(response.data.id);
        if (input.departmentId) {
          context.dataloaders.doctorsByDepartment.clear(input.departmentId);
        }

        return response.data;
      } catch (error) {
        logger.error("Error creating doctor:", error);
        throw error;
      }
    },

    // Update doctor
    async updateDoctor(
      _: any,
      { id, input }: { id: string; input: any },
      context: GraphQLContext
    ) {
      try {
        // Require authentication
        if (!context.user) {
          throw new Error("Yêu cầu xác thực");
        }

        // Check permissions (admin or the doctor themselves)
        if (context.user.role !== "admin" && context.user.doctor_id !== id) {
          throw new Error("Không có quyền cập nhật thông tin bác sĩ này");
        }

        logger.debug("Updating doctor:", {
          id,
          input,
          userId: context.user.id,
          requestId: context.requestId,
        });

        const response = await context.restApi.updateDoctor(id, input);

        if (!response.success) {
          throw new Error(
            response.error?.message || "Không thể cập nhật thông tin bác sĩ"
          );
        }

        // Clear relevant caches
        context.dataloaders.doctorById.clear(id);
        if (input.departmentId) {
          context.dataloaders.doctorsByDepartment.clear(input.departmentId);
        }

        return response.data;
      } catch (error) {
        logger.error("Error updating doctor:", error);
        throw error;
      }
    },

    // Delete doctor (soft delete)
    async deleteDoctor(
      _: any,
      { id }: { id: string },
      context: GraphQLContext
    ) {
      try {
        // Require admin role
        if (!context.user || context.user.role !== "admin") {
          throw new Error("Chỉ admin mới có thể xóa bác sĩ");
        }

        logger.debug("Deleting doctor:", {
          id,
          userId: context.user.id,
          requestId: context.requestId,
        });

        const response = await context.restApi.deleteDoctor(id);

        if (!response.success) {
          throw new Error(response.error?.message || "Không thể xóa bác sĩ");
        }

        // Clear all related caches
        context.dataloaders.doctorById.clear(id);

        return true;
      } catch (error) {
        logger.error("Error deleting doctor:", error);
        throw error;
      }
    },

    // Create doctor review
    async createDoctorReview(
      _: any,
      { input }: { input: any },
      context: GraphQLContext
    ) {
      try {
        logger.debug("Creating doctor review:", {
          input,
          requestId: context.requestId,
        });

        const response = await context.restApi.createDoctorReview(input);

        if (!response.success) {
          throw new Error(
            response.error?.message || "Không thể tạo đánh giá bác sĩ"
          );
        }

        logger.info("Doctor review created successfully:", {
          reviewId: response.data.id,
        });
        return response.data;
      } catch (error) {
        logger.error("Error creating doctor review:", error);
        throw error;
      }
    },

    // Update doctor review
    async updateDoctorReview(
      _: any,
      {
        id,
        rating,
        comment,
      }: { id: string; rating?: number; comment?: string },
      context: GraphQLContext
    ) {
      try {
        logger.debug("Updating doctor review:", {
          id,
          rating,
          comment,
          requestId: context.requestId,
        });

        const response = await context.restApi.updateDoctorReview(id, {
          rating,
          comment,
        });

        if (!response.success) {
          throw new Error(
            response.error?.message || "Không thể cập nhật đánh giá bác sĩ"
          );
        }

        logger.info("Doctor review updated successfully:", { reviewId: id });
        return response.data;
      } catch (error) {
        logger.error("Error updating doctor review:", error);
        throw error;
      }
    },

    // Delete doctor review
    async deleteDoctorReview(
      _: any,
      { id }: { id: string },
      context: GraphQLContext
    ) {
      try {
        logger.debug("Deleting doctor review:", {
          id,
          requestId: context.requestId,
        });

        const response = await context.restApi.deleteDoctorReview(id);

        if (!response.success) {
          throw new Error(
            response.error?.message || "Không thể xóa đánh giá bác sĩ"
          );
        }

        logger.info("Doctor review deleted successfully:", { reviewId: id });
        return true;
      } catch (error) {
        logger.error("Error deleting doctor review:", error);
        throw error;
      }
    },
  },

  // Field resolvers for Doctor type
  Doctor: {
    // Resolve department using DataLoader
    async department(parent: any, _: any, context: GraphQLContext) {
      if (!parent.departmentId) return null;

      try {
        return await context.dataloaders.departmentById.load(
          parent.departmentId
        );
      } catch (error) {
        logger.error("Error loading doctor department:", error);
        return null;
      }
    },

    // Resolve appointments using DataLoader
    async appointments(
      parent: any,
      { status, dateFrom, dateTo, limit = 10, offset = 0 }: any,
      context: GraphQLContext
    ) {
      try {
        const appointments =
          await context.dataloaders.appointmentsByDoctor.load(
            parent.doctor_id || parent.id
          );

        // Apply filters
        let filteredAppointments = appointments || [];

        if (status) {
          filteredAppointments = filteredAppointments.filter(
            (apt: any) => apt.status === status
          );
        }

        if (dateFrom) {
          filteredAppointments = filteredAppointments.filter(
            (apt: any) => new Date(apt.scheduledDate) >= new Date(dateFrom)
          );
        }

        if (dateTo) {
          filteredAppointments = filteredAppointments.filter(
            (apt: any) => new Date(apt.scheduledDate) <= new Date(dateTo)
          );
        }

        // Apply pagination
        const paginatedAppointments = filteredAppointments.slice(
          offset,
          offset + limit
        );

        return {
          edges: paginatedAppointments.map(
            (appointment: any, index: number) => ({
              node: appointment,
              cursor: Buffer.from(`${offset + index}`).toString("base64"),
            })
          ),
          pageInfo: {
            hasNextPage: offset + limit < filteredAppointments.length,
            hasPreviousPage: offset > 0,
            startCursor:
              paginatedAppointments.length > 0
                ? Buffer.from(`${offset}`).toString("base64")
                : null,
            endCursor:
              paginatedAppointments.length > 0
                ? Buffer.from(
                    `${offset + paginatedAppointments.length - 1}`
                  ).toString("base64")
                : null,
          },
          totalCount: filteredAppointments.length,
        };
      } catch (error) {
        logger.error("Error loading doctor appointments:", error);
        return {
          edges: [],
          pageInfo: {
            hasNextPage: false,
            hasPreviousPage: false,
            startCursor: null,
            endCursor: null,
          },
          totalCount: 0,
        };
      }
    },

    // Resolve reviews using DataLoader
    async reviews(
      parent: any,
      { limit = 10, offset = 0 }: any,
      context: GraphQLContext
    ) {
      try {
        const reviews = await context.dataloaders.doctorReviews.load(
          parent.doctor_id || parent.id
        );

        // Apply pagination
        const paginatedReviews = (reviews || []).slice(offset, offset + limit);

        return {
          edges: paginatedReviews.map((review: any, index: number) => ({
            node: review,
            cursor: Buffer.from(`${offset + index}`).toString("base64"),
          })),
          pageInfo: {
            hasNextPage: offset + limit < (reviews || []).length,
            hasPreviousPage: offset > 0,
            startCursor:
              paginatedReviews.length > 0
                ? Buffer.from(`${offset}`).toString("base64")
                : null,
            endCursor:
              paginatedReviews.length > 0
                ? Buffer.from(
                    `${offset + paginatedReviews.length - 1}`
                  ).toString("base64")
                : null,
          },
          totalCount: (reviews || []).length,
        };
      } catch (error) {
        logger.error("Error loading doctor reviews:", error);
        return {
          edges: [],
          pageInfo: {
            hasNextPage: false,
            hasPreviousPage: false,
            startCursor: null,
            endCursor: null,
          },
          totalCount: 0,
        };
      }
    },

    // Computed fields
    async averageRating(parent: any, _: any, context: GraphQLContext) {
      try {
        const stats = await context.dataloaders.doctorStats.load(
          parent.doctor_id || parent.id
        );
        return stats?.averageRating || 0;
      } catch (error) {
        logger.error("Error loading doctor average rating:", error);
        return 0;
      }
    },

    async totalPatients(parent: any, _: any, context: GraphQLContext) {
      try {
        const stats = await context.dataloaders.doctorStats.load(
          parent.doctor_id || parent.id
        );
        return stats?.totalPatients || 0;
      } catch (error) {
        logger.error("Error loading doctor total patients:", error);
        return 0;
      }
    },

    async totalAppointments(parent: any, _: any, context: GraphQLContext) {
      try {
        const stats = await context.dataloaders.doctorStats.load(
          parent.doctor_id || parent.id
        );
        return stats?.totalAppointments || 0;
      } catch (error) {
        logger.error("Error loading doctor total appointments:", error);
        return 0;
      }
    },

    async upcomingAppointments(parent: any, _: any, context: GraphQLContext) {
      try {
        const stats = await context.dataloaders.doctorStats.load(
          parent.doctor_id || parent.id
        );
        return stats?.upcomingAppointments || 0;
      } catch (error) {
        logger.error("Error loading doctor upcoming appointments:", error);
        return 0;
      }
    },

    async availableToday(parent: any, _: any, context: GraphQLContext) {
      try {
        const today = new Date().toISOString().split("T")[0];
        const slots = await context.dataloaders.availableSlots.load(
          `${parent.doctor_id || parent.id}:${today}`
        );
        return (slots || []).some((slot: any) => slot.isAvailable);
      } catch (error) {
        logger.error("Error checking doctor availability today:", error);
        return false;
      }
    },
  },

  // Field resolvers for DoctorReview type
  DoctorReview: {
    // Map database snake_case to GraphQL camelCase
    serviceQuality: (parent: any) => parent.service_quality,
    isVerified: (parent: any) => parent.is_verified,
    isAnonymous: (parent: any) => parent.is_anonymous,
    created_at: (parent: any) => parent.created_at,
    updated_at: (parent: any) => parent.updated_at,

    // Resolve relationships using DataLoaders
    async doctor(parent: any, _: any, context: GraphQLContext) {
      if (!parent.doctor_id && !parent.doctor_id) return null;

      try {
        const doctor_id = parent.doctor_id || parent.doctor_id;
        return await context.dataloaders.doctorById.load(doctor_id);
      } catch (error) {
        logger.error("Error loading review doctor:", error);
        return null;
      }
    },

    async patient(parent: any, _: any, context: GraphQLContext) {
      if (!parent.patient_id && !parent.patient_id) return null;

      try {
        const patient_id = parent.patient_id || parent.patient_id;
        return await context.dataloaders.patientById.load(patient_id);
      } catch (error) {
        logger.error("Error loading review patient:", error);
        return null;
      }
    },

    async appointment(parent: any, _: any, context: GraphQLContext) {
      if (!parent.appointment_id && !parent.appointment_id) return null;

      try {
        const appointment_id = parent.appointment_id || parent.appointment_id;
        return await context.dataloaders.appointmentById.load(appointment_id);
      } catch (error) {
        logger.error("Error loading review appointment:", error);
        return null;
      }
    },
  },

  // Field resolvers for Enhanced DoctorSchedule type
  DoctorSchedule: {
    // Map database snake_case to GraphQL camelCase for enhanced schedule
    dayOfWeek: (parent: any) => parent.day_of_week,
    startTime: (parent: any) => parent.start_time,
    endTime: (parent: any) => parent.end_time,
    templateId: (parent: any) => parent.template_id,

    // Enhanced break system
    breakPeriods: (parent: any) => {
      if (!parent.break_periods) return [];
      try {
        const periods =
          typeof parent.break_periods === "string"
            ? JSON.parse(parent.break_periods)
            : parent.break_periods;
        return Array.isArray(periods)
          ? periods.map((period: any) => ({
              startTime: period.start_time,
              endTime: period.end_time,
              breakType: period.break_type,
            }))
          : [];
      } catch {
        return [];
      }
    },

    // Appointment configuration
    slotDuration: (parent: any) => parent.slot_duration,
    bufferTime: (parent: any) => parent.buffer_time,
    maxAppointments: (parent: any) => parent.max_appointments,

    // Availability settings
    isAvailable: (parent: any) => parent.is_available,
    availabilityType: (parent: any) =>
      parent.availability_type?.toUpperCase() || "REGULAR",

    // Department rules
    departmentRules: (parent: any) => parent.department_rules,

    // Effective period
    effectiveFrom: (parent: any) => parent.effective_from,
    effectiveTo: (parent: any) => parent.effective_to,

    // Status
    is_active: (parent: any) => parent.is_active,

    // Timestamps
    created_at: (parent: any) => parent.created_at,
    updated_at: (parent: any) => parent.updated_at,

    // Resolve relationships using DataLoaders
    async doctor(parent: any, _: any, context: GraphQLContext) {
      if (!parent.doctor_id && !parent.doctor_id) return null;

      try {
        const doctor_id = parent.doctor_id || parent.doctor_id;
        return await context.dataloaders.doctorById.load(doctor_id);
      } catch (error) {
        logger.error("Error loading schedule doctor:", error);
        return null;
      }
    },

    async room(parent: any, _: any, context: GraphQLContext) {
      if (!parent.room_id && !parent.roomId) return null;

      try {
        const roomId = parent.room_id || parent.roomId;
        // Note: Need to implement roomById dataloader
        // Room functionality moved to Department Service
        const response = await context.restApi.getRoom(roomId);
        return response.success ? response.data : null;
      } catch (error) {
        logger.error("Error loading schedule room:", error);
        return null;
      }
    },
  },

  // Field resolvers for Room type
  Room: {
    // Map database snake_case to GraphQL camelCase
    roomNumber: (parent: any) => parent.room_number,
    roomType: (parent: any) => parent.room_type,
    departmentId: (parent: any) => parent.department_id,
    currentOccupancy: (parent: any) => parent.current_occupancy,
    floorNumber: (parent: any) => parent.floor_number,
    dailyRate: (parent: any) => parent.daily_rate,
    equipmentIds: (parent: any) => parent.equipment_ids,
    is_active: (parent: any) => parent.is_active,
    created_at: (parent: any) => parent.created_at,
    updated_at: (parent: any) => parent.updated_at,

    // Resolve relationships using DataLoaders
    async department(parent: any, _: any, context: GraphQLContext) {
      if (!parent.department_id && !parent.departmentId) return null;

      try {
        const departmentId = parent.department_id || parent.departmentId;
        return await context.dataloaders.departmentById.load(departmentId);
      } catch (error) {
        logger.error("Error loading room department:", error);
        return null;
      }
    },
  },
};

export default doctorResolvers;
