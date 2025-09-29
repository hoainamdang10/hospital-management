import logger from "@hospital/shared/dist/utils/logger";
import { Request, Response } from "express";
import { validationResult } from "express-validator";
import { DoctorRepository } from "../repositories/doctor.repository";
import { ExperienceRepository } from "../repositories/experience.repository";
import { ReviewRepository } from "../repositories/review.repository";
import { ScheduleRepository } from "../repositories/schedule.repository";
import { ShiftRepository } from "../repositories/shift.repository";
import { AppointmentService } from "../services/appointment.service";
import { PatientService } from "../services/patient.service";

export class DoctorController {
  private doctorRepository: DoctorRepository;
  private scheduleRepository: ScheduleRepository;
  private reviewRepository: ReviewRepository;
  private shiftRepository: ShiftRepository;
  private experienceRepository: ExperienceRepository;
  private appointmentService: AppointmentService;
  private patientService: PatientService;

  constructor() {
    this.doctorRepository = new DoctorRepository();
    this.scheduleRepository = new ScheduleRepository();
    this.reviewRepository = new ReviewRepository();
    this.shiftRepository = new ShiftRepository();
    this.experienceRepository = new ExperienceRepository();
    this.appointmentService = new AppointmentService();
    this.patientService = new PatientService();
  }

  async getAllDoctors(req: Request, res: Response): Promise<void> {
    try {
      const page = Math.max(parseInt(req.query.page as string) || 1, 1);
      const limit = Math.min(
        Math.max(parseInt(req.query.limit as string) || 50, 1),
        100
      );
      const offset = (page - 1) * limit;

      // Performance optimization: Use Promise.all for parallel queries
      const startTime = Date.now();
      const [doctors, total] = await Promise.all([
        this.doctorRepository.findAll(limit, offset),
        this.doctorRepository.count(),
      ]);
      const queryTime = Date.now() - startTime;

      res.json({
        success: true,
        message: "Doctors retrieved successfully",
        data: doctors,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1,
        },
        performance: {
          query_time_ms: queryTime,
          total_records: total,
          returned_records: doctors.length,
        },
      });
    } catch (error) {
      logger.error("Error fetching doctors", { error, query: req.query });
      res.status(500).json({
        success: false,
        message: "Failed to retrieve doctors",
        error: process.env.NODE_ENV === "development" ? error : undefined,
      });
    }
  }

  async getDoctorById(req: Request, res: Response): Promise<void> {
    try {
      const { doctor_id } = req.params;
      const doctor = await this.doctorRepository.findById(doctor_id);

      if (!doctor) {
        res.status(404).json({
          success: false,
          message: "Doctor not found",
        });
        return;
      }

      res.json({
        success: true,
        data: doctor,
      });
    } catch (error) {
      logger.error("Error fetching doctor by ID", {
        error,
        doctor_id: req.params.doctor_id,
      });
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: process.env.NODE_ENV === "development" ? error : undefined,
      });
    }
  }

  async getDoctorByProfileId(req: Request, res: Response): Promise<void> {
    try {
      const { profileId } = req.params;
      const doctor = await this.doctorRepository.findByProfileId(profileId);

      if (!doctor) {
        res.status(404).json({
          success: false,
          message: "Doctor not found for this profile",
        });
        return;
      }

      res.json({
        success: true,
        data: doctor,
      });
    } catch (error) {
      logger.error("Error fetching doctor by profile ID", {
        error,
        profileId: req.params.profileId,
      });
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: process.env.NODE_ENV === "development" ? error : undefined,
      });
    }
  }

  async getDoctorsByDepartment(req: Request, res: Response): Promise<void> {
    try {
      const { departmentId } = req.params;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const offset = (page - 1) * limit;

      // MODERN APPROACH: Combined query for data + count
      const { doctors, total } =
        await this.doctorRepository.findByDepartmentWithCount(
          departmentId,
          limit,
          offset
        );

      const totalPages = Math.ceil(total / limit);

      res.json({
        success: true,
        data: doctors,
        pagination: {
          page,
          limit,
          total,
          total_pages: totalPages,
          has_previous: page > 1,
          has_next: page < totalPages,
        },
      });
    } catch (error) {
      logger.error("Error fetching doctors by department", {
        error,
        departmentId: req.params.departmentId,
      });
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: process.env.NODE_ENV === "development" ? error : undefined,
      });
    }
  }

  async searchDoctors(req: Request, res: Response): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = Math.min(parseInt(req.query.limit as string) || 50, 100); // Max 100 per page
      const offset = (page - 1) * limit;

      // Enhanced search query with validation
      const searchQuery = {
        specialty: req.query.specialty as string,
        department_id: req.query.department_id as string,
        gender: req.query.gender as string,
        search: req.query.search as string,
        min_rating: req.query.min_rating
          ? parseFloat(req.query.min_rating as string)
          : undefined,
        max_consultation_fee: req.query.max_consultation_fee
          ? parseFloat(req.query.max_consultation_fee as string)
          : undefined,
        languages: req.query.languages as string,
        availability_status: req.query.availability_status as string,
        experience_years: req.query.experience_years
          ? parseInt(req.query.experience_years as string)
          : undefined,
        sort_by: (req.query.sort_by as string) || "rating",
        sort_order: (req.query.sort_order as "asc" | "desc") || "desc",
      };

      // Validate search parameters
      if (
        searchQuery.min_rating &&
        (searchQuery.min_rating < 0 || searchQuery.min_rating > 5)
      ) {
        res.status(400).json({
          success: false,
          message: "Invalid rating range. Rating must be between 0 and 5.",
        });
        return;
      }

      if (searchQuery.experience_years && searchQuery.experience_years < 0) {
        res.status(400).json({
          success: false,
          message: "Experience years must be a positive number.",
        });
        return;
      }

      const startTime = Date.now();
      const result = await this.doctorRepository.search(
        searchQuery,
        limit,
        offset
      );
      const searchTime = Date.now() - startTime;

      // Get total count for proper pagination
      const totalCount =
        await this.doctorRepository.getSearchCount(searchQuery);

      res.json({
        success: true,
        message: "Doctors retrieved successfully",
        data: result,
        pagination: {
          page,
          limit,
          total: totalCount,
          totalPages: Math.ceil(totalCount / limit),
          hasNext: page < Math.ceil(totalCount / limit),
          hasPrev: page > 1,
        },
        search_metadata: {
          query_time_ms: searchTime,
          filters_applied: Object.keys(searchQuery).filter(
            (key) =>
              searchQuery[key as keyof typeof searchQuery] !== undefined &&
              searchQuery[key as keyof typeof searchQuery] !== ""
          ),
          total_results: totalCount,
          search_term: searchQuery.search || null,
          sort_by: searchQuery.sort_by,
          sort_order: searchQuery.sort_order,
        },
      });
    } catch (error) {
      logger.error("Error searching doctors", { error, query: req.query });
      res.status(500).json({
        success: false,
        message: "Failed to search doctors",
        error: process.env.NODE_ENV === "development" ? error : undefined,
      });
    }
  }

  async createDoctor(req: Request, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: errors.array(),
        });
        return;
      }

      // Check if this is a direct doctor creation (with profile_id) or needs redirect
      const { profile_id } = req.body;

      if (!profile_id) {
        // No profile_id provided - redirect to Auth Service for complete registration
        logger.info(
          "Doctor creation request without profile_id - redirecting to Auth Service"
        );

        res.status(400).json({
          success: false,
          error: "Doctor creation handled by Auth Service",
          message:
            "Use Auth Service /api/auth/register-doctor endpoint for complete doctor registration",
          redirect: {
            service: "auth-service",
            endpoint: "/api/auth/register-doctor",
            method: "POST",
            required_fields: [
              "email",
              "password",
              "full_name",
              "phone_number",
              "license_number",
              "department_id",
              "specialization",
            ],
            example: {
              email: "doctor@hospital.com",
              password: "Doctor123!",
              full_name: "Dr. John Smith",
              phone_number: "0123456789",
              license_number: "VN-MD-1234",
              department_id: "CARD",
              specialization: "Cardiology",
              years_of_experience: 5,
              education: "MD from University of Medicine",
              certifications: ["Board Certified Cardiologist"],
            },
          },
          timestamp: new Date().toISOString(),
        });
        return;
      }

      // profile_id provided - this is a direct doctor creation (internal service call)
      logger.info("Direct doctor creation request with profile_id:", {
        profile_id,
        full_name: req.body.full_name,
      });

      const doctor = await this.doctorRepository.create(req.body);

      logger.info("Doctor created successfully:", {
        doctor_id: doctor.doctor_id,
        profile_id: doctor.profile_id,
      });

      res.status(201).json({
        success: true,
        message: "Doctor created successfully",
        data: doctor,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error("Error creating doctor", { error, body: req.body });
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: process.env.NODE_ENV === "development" ? error : undefined,
      });
    }
  }

  async updateDoctor(req: Request, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: errors.array(),
        });
        return;
      }

      const { doctor_id } = req.params;
      const doctor = await this.doctorRepository.update(doctor_id, req.body);

      if (!doctor) {
        res.status(404).json({
          success: false,
          message: "Doctor not found",
        });
        return;
      }

      res.json({
        success: true,
        message: "Doctor updated successfully",
        data: doctor,
      });
    } catch (error) {
      logger.error("Error updating doctor", {
        error,
        doctor_id: req.params.doctor_id,
        body: req.body,
      });
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: process.env.NODE_ENV === "development" ? error : undefined,
      });
    }
  }

  async deleteDoctor(req: Request, res: Response): Promise<void> {
    try {
      const { doctor_id } = req.params;
      const success = await this.doctorRepository.delete(doctor_id);

      if (!success) {
        res.status(404).json({
          success: false,
          message: "Doctor not found",
        });
        return;
      }

      res.json({
        success: true,
        message: "Doctor deleted successfully",
      });
    } catch (error) {
      logger.error("Error deleting doctor", {
        error,
        doctor_id: req.params.doctor_id,
      });
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: process.env.NODE_ENV === "development" ? error : undefined,
      });
    }
  }

  // =====================================================
  // SCHEDULE MANAGEMENT ENDPOINTS
  // =====================================================

  async getDoctorSchedule(req: Request, res: Response): Promise<void> {
    try {
      const { doctor_id } = req.params;
      const schedule = await this.scheduleRepository.findByDoctorId(doctor_id);

      res.json({
        success: true,
        data: schedule,
      });
    } catch (error) {
      logger.error("Error fetching doctor schedule", {
        error,
        doctor_id: req.params.doctor_id,
      });
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: process.env.NODE_ENV === "development" ? error : undefined,
      });
    }
  }

  async getTodaySchedule(req: Request, res: Response): Promise<void> {
    try {
      const { doctor_id } = req.params;
      const today = new Date();
      const dayOfWeek = today.getDay(); // 0 = Sunday, 6 = Saturday

      // Get today's schedule from weekly schedule
      const weeklySchedule =
        await this.scheduleRepository.getWeeklySchedule(doctor_id);
      const todaySchedule = weeklySchedule.filter(
        (slot: any) => slot.day_of_week === dayOfWeek
      );

      res.json({
        success: true,
        data: todaySchedule,
      });
    } catch (error) {
      logger.error("Error fetching today schedule", {
        error,
        doctor_id: req.params.doctor_id,
      });
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: process.env.NODE_ENV === "development" ? error : undefined,
      });
    }
  }

  async getWeeklySchedule(req: Request, res: Response): Promise<void> {
    try {
      const { doctor_id } = req.params;
      const schedule =
        await this.scheduleRepository.getWeeklySchedule(doctor_id);

      res.json({
        success: true,
        data: schedule,
      });
    } catch (error) {
      logger.error("Error fetching weekly schedule", {
        error,
        doctor_id: req.params.doctor_id,
      });
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: process.env.NODE_ENV === "development" ? error : undefined,
      });
    }
  }

  async updateSchedule(req: Request, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: errors.array(),
        });
        return;
      }

      const { doctor_id } = req.params;
      const { schedules } = req.body; // Array of schedule updates

      const updatedSchedules = await this.scheduleRepository.bulkUpdateSchedule(
        doctor_id,
        schedules
      );

      res.json({
        success: true,
        message: "Schedule updated successfully",
        data: updatedSchedules,
      });
    } catch (error) {
      logger.error("Error updating schedule", {
        error,
        doctor_id: req.params.doctor_id,
        body: req.body,
      });
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: process.env.NODE_ENV === "development" ? error : undefined,
      });
    }
  }

  async getAvailability(req: Request, res: Response): Promise<void> {
    try {
      const { doctor_id } = req.params;
      const { date } = req.query;

      if (!date) {
        res.status(400).json({
          success: false,
          message: "Date parameter is required",
        });
        return;
      }

      const checkDate = new Date(date as string);
      const availability = await this.scheduleRepository.getAvailability(
        doctor_id,
        checkDate
      );

      res.json({
        success: true,
        data: availability,
      });
    } catch (error) {
      logger.error("Error fetching availability", {
        error,
        doctor_id: req.params.doctor_id,
        date: req.query.date,
      });
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: process.env.NODE_ENV === "development" ? error : undefined,
      });
    }
  }

  async getAvailableTimeSlots(req: Request, res: Response): Promise<void> {
    try {
      const { doctor_id } = req.params;
      const { date } = req.query;

      if (!date) {
        res.status(400).json({
          success: false,
          message: "Date parameter is required",
        });
        return;
      }

      const checkDate = new Date(date as string);
      const timeSlots = await this.scheduleRepository.getAvailableTimeSlots(
        doctor_id,
        checkDate
      );

      res.json({
        success: true,
        data: timeSlots,
      });
    } catch (error) {
      logger.error("Error fetching available time slots", {
        error,
        doctor_id: req.params.doctor_id,
        date: req.query.date,
      });
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: process.env.NODE_ENV === "development" ? error : undefined,
      });
    }
  }

  // =====================================================
  // REVIEW MANAGEMENT ENDPOINTS
  // =====================================================

  async getDoctorReviews(req: Request, res: Response): Promise<void> {
    try {
      const { doctor_id } = req.params;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const offset = (page - 1) * limit;

      const reviews = await this.reviewRepository.findByDoctorId(
        doctor_id,
        limit,
        offset
      );

      res.json({
        success: true,
        data: reviews,
        pagination: {
          page,
          limit,
          total: reviews.length,
        },
      });
    } catch (error) {
      logger.error("Error fetching doctor reviews", {
        error,
        doctor_id: req.params.doctor_id,
      });
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: process.env.NODE_ENV === "development" ? error : undefined,
      });
    }
  }

  async getReviewStats(req: Request, res: Response): Promise<void> {
    try {
      const { doctor_id } = req.params;
      const stats = await this.reviewRepository.getReviewStats(doctor_id);

      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      logger.error("Error fetching review stats", {
        error,
        doctor_id: req.params.doctor_id,
      });
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: process.env.NODE_ENV === "development" ? error : undefined,
      });
    }
  }

  // =====================================================
  // SHIFT MANAGEMENT ENDPOINTS
  // =====================================================

  async getDoctorShifts(req: Request, res: Response): Promise<void> {
    try {
      const { doctor_id } = req.params;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const offset = (page - 1) * limit;

      const shifts = await this.shiftRepository.findByDoctorId(
        doctor_id,
        limit,
        offset
      );

      res.json({
        success: true,
        data: shifts,
        pagination: {
          page,
          limit,
          total: shifts.length,
        },
      });
    } catch (error) {
      logger.error("Error fetching doctor shifts", {
        error,
        doctor_id: req.params.doctor_id,
      });
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: process.env.NODE_ENV === "development" ? error : undefined,
      });
    }
  }

  async getUpcomingShifts(req: Request, res: Response): Promise<void> {
    try {
      const { doctor_id } = req.params;
      const days = parseInt(req.query.days as string) || 7;

      const shifts = await this.shiftRepository.getUpcomingShifts(
        doctor_id,
        days
      );

      res.json({
        success: true,
        data: shifts,
      });
    } catch (error) {
      logger.error("Error fetching upcoming shifts", {
        error,
        doctor_id: req.params.doctor_id,
      });
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: process.env.NODE_ENV === "development" ? error : undefined,
      });
    }
  }

  async createShift(req: Request, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: errors.array(),
        });
        return;
      }

      const shift = await this.shiftRepository.create(req.body);

      res.status(201).json({
        success: true,
        message: "Shift created successfully",
        data: shift,
      });
    } catch (error) {
      logger.error("Error creating shift", { error, body: req.body });
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: process.env.NODE_ENV === "development" ? error : undefined,
      });
    }
  }

  async updateShift(req: Request, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: errors.array(),
        });
        return;
      }

      const { shiftId } = req.params;
      const shift = await this.shiftRepository.update(shiftId, req.body);

      if (!shift) {
        res.status(404).json({
          success: false,
          message: "Shift not found",
        });
        return;
      }

      res.json({
        success: true,
        message: "Shift updated successfully",
        data: shift,
      });
    } catch (error) {
      logger.error("Error updating shift", {
        error,
        shiftId: req.params.shiftId,
        body: req.body,
      });
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: process.env.NODE_ENV === "development" ? error : undefined,
      });
    }
  }

  async confirmShift(req: Request, res: Response): Promise<void> {
    try {
      const { shiftId } = req.params;
      const shift = await this.shiftRepository.confirmShift(shiftId);

      if (!shift) {
        res.status(404).json({
          success: false,
          message: "Shift not found",
        });
        return;
      }

      res.json({
        success: true,
        message: "Shift confirmed successfully",
        data: shift,
      });
    } catch (error) {
      logger.error("Error confirming shift", {
        error,
        shiftId: req.params.shiftId,
      });
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: process.env.NODE_ENV === "development" ? error : undefined,
      });
    }
  }

  async getShiftStatistics(req: Request, res: Response): Promise<void> {
    try {
      const { doctor_id } = req.params;
      const { startDate, endDate } = req.query;

      if (!startDate || !endDate) {
        res.status(400).json({
          success: false,
          message: "Start date and end date are required",
        });
        return;
      }

      const stats = await this.shiftRepository.getShiftStatistics(
        doctor_id,
        new Date(startDate as string),
        new Date(endDate as string)
      );

      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      logger.error("Error fetching shift statistics", {
        error,
        doctor_id: req.params.doctor_id,
      });
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: process.env.NODE_ENV === "development" ? error : undefined,
      });
    }
  }

  // =====================================================
  // EXPERIENCE MANAGEMENT ENDPOINTS
  // =====================================================

  async getDoctorExperiences(req: Request, res: Response): Promise<void> {
    try {
      const { doctor_id } = req.params;
      const { type } = req.query;

      let experiences;
      if (type) {
        experiences = await this.experienceRepository.findByType(
          doctor_id,
          type as any
        );
      } else {
        experiences = await this.experienceRepository.findByDoctorId(doctor_id);
      }

      res.json({
        success: true,
        data: experiences,
      });
    } catch (error) {
      logger.error("Error fetching doctor experiences", {
        error,
        doctor_id: req.params.doctor_id,
      });
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: process.env.NODE_ENV === "development" ? error : undefined,
      });
    }
  }

  async getExperienceTimeline(req: Request, res: Response): Promise<void> {
    try {
      const { doctor_id } = req.params;
      const timeline =
        await this.experienceRepository.getExperienceTimeline(doctor_id);

      res.json({
        success: true,
        data: timeline,
      });
    } catch (error) {
      logger.error("Error fetching experience timeline", {
        error,
        doctor_id: req.params.doctor_id,
      });
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: process.env.NODE_ENV === "development" ? error : undefined,
      });
    }
  }

  async getTotalExperience(req: Request, res: Response): Promise<void> {
    try {
      const { doctor_id } = req.params;
      const totalExperience =
        await this.experienceRepository.calculateTotalExperience(doctor_id);

      res.json({
        success: true,
        data: totalExperience,
      });
    } catch (error) {
      logger.error("Error calculating total experience", {
        error,
        doctor_id: req.params.doctor_id,
      });
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: process.env.NODE_ENV === "development" ? error : undefined,
      });
    }
  }

  async createExperience(req: Request, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: errors.array(),
        });
        return;
      }

      const experience = await this.experienceRepository.create(req.body);

      res.status(201).json({
        success: true,
        message: "Experience created successfully",
        data: experience,
      });
    } catch (error) {
      logger.error("Error creating experience", { error, body: req.body });
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: process.env.NODE_ENV === "development" ? error : undefined,
      });
    }
  }

  async updateExperience(req: Request, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: errors.array(),
        });
        return;
      }

      const { experienceId } = req.params;
      const experience = await this.experienceRepository.update(
        experienceId,
        req.body
      );

      if (!experience) {
        res.status(404).json({
          success: false,
          message: "Experience not found",
        });
        return;
      }

      res.json({
        success: true,
        message: "Experience updated successfully",
        data: experience,
      });
    } catch (error) {
      logger.error("Error updating experience", {
        error,
        experienceId: req.params.experienceId,
        body: req.body,
      });
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: process.env.NODE_ENV === "development" ? error : undefined,
      });
    }
  }

  async deleteExperience(req: Request, res: Response): Promise<void> {
    try {
      const { experienceId } = req.params;
      const success = await this.experienceRepository.delete(experienceId);

      if (!success) {
        res.status(404).json({
          success: false,
          message: "Experience not found",
        });
        return;
      }

      res.json({
        success: true,
        message: "Experience deleted successfully",
      });
    } catch (error) {
      logger.error("Error deleting experience", {
        error,
        experienceId: req.params.experienceId,
      });
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: process.env.NODE_ENV === "development" ? error : undefined,
      });
    }
  }

  // =====================================================
  // ENHANCED DOCTOR PROFILE ENDPOINT
  // =====================================================

  async getDoctorProfile(req: Request, res: Response): Promise<void> {
    try {
      const { doctor_id } = req.params;

      // Get basic doctor info
      const doctor = await this.doctorRepository.findById(doctor_id);
      if (!doctor) {
        res.status(404).json({
          success: false,
          message: "Doctor not found",
        });
        return;
      }

      // Get additional profile data
      const [schedule, reviewStats, experiences, upcomingShifts] =
        await Promise.all([
          this.scheduleRepository.getWeeklySchedule(doctor_id),
          this.reviewRepository.getReviewStats(doctor_id),
          this.experienceRepository.findByDoctorId(doctor_id),
          this.shiftRepository.getUpcomingShifts(doctor_id, 7),
        ]);

      const profile = {
        ...doctor,
        schedule,
        review_stats: reviewStats,
        experiences,
        current_shifts: upcomingShifts,
      };

      res.json({
        success: true,
        data: profile,
      });
    } catch (error) {
      logger.error("Error fetching doctor profile", {
        error,
        doctor_id: req.params.doctor_id,
      });
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: process.env.NODE_ENV === "development" ? error : undefined,
      });
    }
  }

  // =====================================================
  // APPOINTMENT MANAGEMENT ENDPOINTS
  // =====================================================

  async getDoctorAppointments(req: Request, res: Response): Promise<void> {
    try {
      const { doctor_id } = req.params;
      const { date, status, page = 1, limit = 10 } = req.query;

      // Verify doctor exists
      const doctor = await this.doctorRepository.findById(doctor_id);
      if (!doctor) {
        res.status(404).json({
          success: false,
          message: "Doctor not found",
        });
        return;
      }

      // Get appointments from Appointment Service
      const appointmentResult =
        await this.appointmentService.getDoctorAppointments(doctor_id, {
          date: date as string,
          status: status as string,
          page: Number(page),
          limit: Number(limit),
        });

      // Enrich appointment data with patient information
      const enrichedAppointments = [];
      for (const appointment of appointmentResult.appointments) {
        let patientInfo = null;

        // Try to get patient information
        if (appointment.patient_id) {
          patientInfo = await this.patientService.getPatientById(
            appointment.patient_id
          );
        }

        enrichedAppointments.push({
          appointment_id: appointment.appointment_id,
          patient_id: appointment.patient_id,
          patient_name:
            patientInfo?.full_name ||
            appointment.patient_name ||
            "Unknown Patient",
          patient_phone:
            patientInfo?.phone_number || appointment.patient_phone || "N/A",
          patient_email:
            patientInfo?.email || appointment.patient_email || "N/A",
          appointment_date: appointment.appointment_date,
          appointment_time: appointment.appointment_time,
          appointment_type: appointment.appointment_type || "Khám tổng quát",
          status: appointment.status,
          notes: appointment.notes || "",
        });
      }

      res.json({
        success: true,
        data: enrichedAppointments,
        pagination: appointmentResult.pagination || {
          page: Number(page),
          limit: Number(limit),
          total: enrichedAppointments.length,
          totalPages: Math.ceil(enrichedAppointments.length / Number(limit)),
        },
        source: "appointment-service",
      });
    } catch (error) {
      logger.error("Error fetching doctor appointments", {
        error,
        doctor_id: req.params.doctor_id,
      });
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: process.env.NODE_ENV === "development" ? error : undefined,
      });
    }
  }

  async getDoctorStats(req: Request, res: Response): Promise<void> {
    try {
      const { doctor_id } = req.params;

      // Verify doctor exists
      const doctor = await this.doctorRepository.findById(doctor_id);
      if (!doctor) {
        res.status(404).json({
          success: false,
          message: "Doctor not found",
        });
        return;
      }

      // Get data from multiple services in parallel
      const [
        reviewStats,
        appointmentStats,
        totalExperience,
        todayAppointments,
        monthlyAppointments,
        patientCount,
        patientStats,
      ] = await Promise.allSettled([
        this.reviewRepository.getReviewStats(doctor_id),
        this.appointmentService.getDoctorAppointmentStats(doctor_id),
        this.experienceRepository.calculateTotalExperience(doctor_id),
        this.appointmentService.getTodayAppointments(doctor_id),
        this.appointmentService.getMonthlyAppointments(doctor_id),
        this.patientService.getPatientCountForDoctor(doctor_id),
        this.patientService.getDoctorPatientStats(doctor_id),
      ]);

      // Extract results safely
      const reviews =
        reviewStats.status === "fulfilled"
          ? reviewStats.value
          : { average_rating: 0, total_reviews: 0 };
      const appointments =
        appointmentStats.status === "fulfilled" ? appointmentStats.value : null;
      const experience =
        totalExperience.status === "fulfilled"
          ? totalExperience.value
          : { total_years: 0 };
      const todayApts =
        todayAppointments.status === "fulfilled" ? todayAppointments.value : [];
      const monthlyApts =
        monthlyAppointments.status === "fulfilled"
          ? monthlyAppointments.value
          : [];
      const totalPatients =
        patientCount.status === "fulfilled" ? patientCount.value : 0;
      const patientStatsData =
        patientStats.status === "fulfilled" ? patientStats.value : null;

      // Calculate success rate based on completed appointments
      const completedAppointments = monthlyApts.filter(
        (apt) => apt.status === "completed"
      ).length;
      const totalMonthlyAppointments = monthlyApts.length;
      const successRate =
        totalMonthlyAppointments > 0
          ? (completedAppointments / totalMonthlyAppointments) * 100
          : 0;

      // Build comprehensive stats
      const stats = {
        total_patients: totalPatients,
        total_appointments: appointments?.total_appointments || 0,
        appointments_this_month:
          appointments?.appointments_this_month || monthlyApts.length,
        appointments_today: todayApts.length,
        success_rate: Math.round(successRate * 10) / 10,
        average_rating: reviews.average_rating || 0,
        total_reviews: reviews.total_reviews || 0,
        years_experience: Math.round(experience.total_years * 10) / 10,
        specialization: doctor.specialty,
        department: doctor.department_id,
        status: doctor.availability_status || "active",
        // Add patient statistics from Patient Service
        new_patients: patientStatsData?.new_patients_last_30_days || 0,
        follow_up_patients:
          patientStatsData?.returning_patients_last_30_days || 0,
        total_unique_patients:
          patientStatsData?.total_unique_patients || totalPatients,
        patient_demographics: patientStatsData?.demographics || null,
        monthly_stats: appointments?.monthly_stats || [],
        appointment_types: appointments?.appointment_types || [],
        data_sources: {
          appointments:
            appointmentStats.status === "fulfilled"
              ? "appointment-service"
              : "unavailable",
          patients:
            patientCount.status === "fulfilled"
              ? "patient-service"
              : "unavailable",
          patient_stats:
            patientStats.status === "fulfilled"
              ? "patient-service"
              : "unavailable",
          reviews:
            reviewStats.status === "fulfilled" ? "database" : "unavailable",
          experience:
            totalExperience.status === "fulfilled" ? "database" : "unavailable",
        },
      };

      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      logger.error("Error fetching doctor stats", {
        error,
        doctor_id: req.params.doctor_id,
      });
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: process.env.NODE_ENV === "development" ? error : undefined,
      });
    }
  }

  // =====================================================
  // REAL-TIME FEATURES
  // =====================================================

  /**
   * Get real-time service status
   */
  async getRealtimeStatus(req: Request, res: Response): Promise<void> {
    try {
      res.json({
        success: true,
        data: {
          realtime_enabled: true,
          websocket_enabled: true,
          supabase_subscription: true,
          doctor_monitoring: true,
          shift_tracking: true,
          experience_management: true,
          connected_clients: 0, // Will be updated when WebSocket is integrated
          last_event: null,
          uptime: process.uptime(),
          subscriptions: {
            doctors: true,
            profiles: true,
            shifts: true,
            experiences: true,
          },
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error("Error in getRealtimeStatus:", error);
      res.status(500).json({
        success: false,
        error: "Failed to get real-time status",
        message: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * Get live doctors with real-time capabilities
   */
  async getLiveDoctors(req: Request, res: Response): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      // Get current doctors
      const offset = (page - 1) * limit;
      const doctors = await this.doctorRepository.search({}, limit, offset);
      const total = await this.doctorRepository.getSearchCount({});

      res.json({
        success: true,
        data: {
          doctors,
          realtime_enabled: true,
          live_updates: true,
          websocket_channel: "doctors_realtime",
          subscription_info: {
            events: ["INSERT", "UPDATE", "DELETE"],
            filters: [
              "availability_updates",
              "schedule_updates",
              "shift_updates",
              "experience_updates",
              "new_doctors",
            ],
            rooms: [
              "medical_staff",
              "admin_dashboard",
              "appointment_service",
              "doctor_{doctorId}",
            ],
          },
        },
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error("Error in getLiveDoctors:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch live doctors",
        message: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      });
    }
  }

  // =====================================================
  // AUTHENTICATED DOCTOR DASHBOARD METHODS
  // =====================================================

  async getCurrentDoctorProfile(req: any, res: Response): Promise<void> {
    try {
      // Get user info from auth middleware
      const userId = req.user?.id;
      const userRole = req.user?.role;

      // DEBUG: Log user info
      logger.info("🔍 DEBUG getCurrentDoctorProfile - req.user:", {
        userId,
        userRole,
        fullUser: req.user,
      });

      if (!userId || userRole !== "doctor") {
        res.status(401).json({
          success: false,
          message: "Unauthorized: Doctor access required",
        });
        return;
      }

      // Find doctor by profile_id
      logger.info("🔍 DEBUG - Looking for doctor with profile_id:", userId);
      const doctor = await this.doctorRepository.findByProfileId(userId);

      if (!doctor) {
        logger.error("🔍 DEBUG - Doctor not found for profile_id:", userId);
        res.status(404).json({
          success: false,
          message: "Doctor not found",
        });
        return;
      }

      logger.info("🔍 DEBUG - Doctor found:", {
        doctor_id: doctor.doctor_id,
        full_name: doctor.full_name,
      });

      res.json({
        success: true,
        data: doctor,
      });
    } catch (error) {
      logger.error("Error getting current doctor profile:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: process.env.NODE_ENV === "development" ? error : undefined,
      });
    }
  }

  async getCurrentDoctorStats(req: any, res: Response): Promise<void> {
    try {
      // Get user info from auth middleware
      const userId = req.user?.id;
      const userRole = req.user?.role;

      if (!userId || userRole !== "doctor") {
        res.status(401).json({
          success: false,
          message: "Unauthorized: Doctor access required",
        });
        return;
      }

      // Find doctor by profile_id
      const doctor = await this.doctorRepository.findByProfileId(userId);

      if (!doctor) {
        res.status(404).json({
          success: false,
          message: "Doctor not found",
        });
        return;
      }

      // Get dashboard statistics
      const stats = await this.doctorRepository.getDashboardStats(
        doctor.doctor_id
      );

      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      logger.error("Error getting current doctor stats:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: process.env.NODE_ENV === "development" ? error : undefined,
      });
    }
  }

  /**
   * Get complete dashboard data for current authenticated doctor
   * Includes stats, today's schedule, recent appointments, and quick metrics
   */
  async getDashboardComplete(req: any, res: Response): Promise<void> {
    try {
      const startTime = Date.now();

      // Get user info from auth middleware
      const userId = req.user?.id;
      const userRole = req.user?.role;

      if (!userId || userRole !== "doctor") {
        res.status(401).json({
          success: false,
          message: "Unauthorized: Doctor access required",
        });
        return;
      }

      // Find doctor by profile_id
      const doctor = await this.doctorRepository.findByProfileId(userId);

      if (!doctor) {
        res.status(404).json({
          success: false,
          message: "Doctor not found",
        });
        return;
      }

      const doctor_id = doctor.doctor_id;

      // Get all dashboard data in parallel for optimal performance
      const [
        dashboardStats,
        todaySchedule,
        recentAppointments,
        reviewStats,
        weeklyStats,
        monthlyStats,
      ] = await Promise.allSettled([
        this.doctorRepository.getDashboardStats(doctor_id),
        this.scheduleRepository.getTodaySchedule(doctor_id),
        this.doctorRepository.getRecentAppointments(doctor_id, 5),
        this.reviewRepository.getReviewStats(doctor_id),
        this.doctorRepository.getWeeklyStats(doctor_id),
        this.doctorRepository.getMonthlyStats(doctor_id),
      ]);

      // Process results and handle errors gracefully
      const processResult = (result: any, fallback: any = null) => {
        return result.status === "fulfilled" ? result.value : fallback;
      };

      const stats = processResult(dashboardStats, {
        todayAppointments: 0,
        totalAppointments: 0,
        completedAppointments: 0,
        totalPatients: 0,
        totalReviews: 0,
        averageRating: 0,
      });

      const schedule = processResult(todaySchedule, []);
      const appointments = processResult(recentAppointments, []);
      const reviews = processResult(reviewStats, {
        average_rating: 0,
        total_reviews: 0,
      });
      const weekly = processResult(weeklyStats, {
        appointments: 0,
        revenue: 0,
      });
      const monthly = processResult(monthlyStats, {
        appointments: 0,
        revenue: 0,
        success_rate: 0,
      });

      // Combine all data
      const dashboardData = {
        stats: {
          ...stats,
          thisWeekAppointments: weekly.appointments || 0,
          thisMonthAppointments: monthly.appointments || 0,
          successRate: monthly.success_rate || 0,
          totalRevenue: monthly.revenue || 0,
          averageRating: reviews.average_rating || 0,
          totalReviews: reviews.total_reviews || 0,
        },
        todaySchedule: schedule,
        recentAppointments: appointments,
        quickMetrics: {
          patientsToday: schedule.filter((s: any) => s.status === "booked")
            .length,
          completedToday: schedule.filter((s: any) => s.status === "completed")
            .length,
          upcomingToday: schedule.filter(
            (s: any) =>
              s.status === "booked" && new Date(s.start_time) > new Date()
          ).length,
          emergencyCount: appointments.filter(
            (a: any) => a.priority === "emergency"
          ).length,
        },
        lastUpdated: new Date().toISOString(),
        responseTime: Date.now() - startTime,
      };

      res.json({
        success: true,
        data: dashboardData,
        message: "Dashboard data loaded successfully",
      });
    } catch (error) {
      logger.error("Error getting complete dashboard data:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: process.env.NODE_ENV === "development" ? error : undefined,
      });
    }
  }

  async getTodayAppointments(req: any, res: Response): Promise<void> {
    try {
      // Get user info from auth middleware
      const userId = req.user?.id;
      const userRole = req.user?.role;

      if (!userId || userRole !== "doctor") {
        res.status(401).json({
          success: false,
          message: "Unauthorized: Doctor access required",
        });
        return;
      }

      // Find doctor by profile_id
      const doctor = await this.doctorRepository.findByProfileId(userId);

      if (!doctor) {
        res.status(404).json({
          success: false,
          message: "Doctor not found",
        });
        return;
      }

      // Get today's appointments
      const appointments = await this.appointmentService.getTodayAppointments(
        doctor.doctor_id
      );

      res.json({
        success: true,
        data: appointments,
      });
    } catch (error) {
      logger.error("Error getting today appointments:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: process.env.NODE_ENV === "development" ? error : undefined,
      });
    }
  }

  async getUpcomingAppointments(req: any, res: Response): Promise<void> {
    try {
      // Get user info from auth middleware
      const userId = req.user?.id;
      const userRole = req.user?.role;

      if (!userId || userRole !== "doctor") {
        res.status(401).json({
          success: false,
          message: "Unauthorized: Doctor access required",
        });
        return;
      }

      // Find doctor by profile_id
      const doctor = await this.doctorRepository.findByProfileId(userId);

      if (!doctor) {
        res.status(404).json({
          success: false,
          message: "Doctor not found",
        });
        return;
      }

      // Get upcoming appointments
      const appointments =
        await this.appointmentService.getUpcomingAppointments(doctor.doctor_id);

      res.json({
        success: true,
        data: appointments,
      });
    } catch (error) {
      logger.error("Error getting upcoming appointments:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: process.env.NODE_ENV === "development" ? error : undefined,
      });
    }
  }

  async getRecentActivity(req: any, res: Response): Promise<void> {
    try {
      // Get user info from auth middleware
      const userId = req.user?.id;
      const userRole = req.user?.role;

      if (!userId || userRole !== "doctor") {
        res.status(401).json({
          success: false,
          message: "Unauthorized: Doctor access required",
        });
        return;
      }

      // Find doctor by profile_id
      const doctor = await this.doctorRepository.findByProfileId(userId);

      if (!doctor) {
        res.status(404).json({
          success: false,
          message: "Doctor not found",
        });
        return;
      }

      // Get recent activity
      const activity = await this.appointmentService.getRecentActivity(
        doctor.doctor_id
      );

      res.json({
        success: true,
        data: activity,
      });
    } catch (error) {
      logger.error("Error getting recent activity:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: process.env.NODE_ENV === "development" ? error : undefined,
      });
    }
  }
}
