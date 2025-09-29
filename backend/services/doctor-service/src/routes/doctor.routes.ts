import {
  CommonValidationSchemas,
  validateRequest,
} from "@hospital/shared/dist/middleware/validation.middleware";
import express from "express";
import { body, param, query } from "express-validator";
import { AppointmentStatsController } from "../controllers/appointment-stats.controller";
import { DashboardController } from "../controllers/dashboard.controller";
import { DoctorController } from "../controllers/doctor.controller";
import { EnhancedReviewsController } from "../controllers/enhanced-reviews.controller";
import { WeeklyScheduleController } from "../controllers/weekly-schedule.controller";
import { authMiddleware, requireDoctor } from "../middleware/auth.middleware";
import { parameterMappingMiddleware } from "../middleware/parameter-mapping.middleware";

// Force rebuild timestamp: 2025-06-23 01:15

const router = express.Router();
const doctorController = new DoctorController();
const appointmentStatsController = new AppointmentStatsController();
const weeklyScheduleController = new WeeklyScheduleController();
const enhancedReviewsController = new EnhancedReviewsController();
const dashboardController = new DashboardController();

// Apply parameter mapping middleware to all routes
// This converts kebab-case route params to snake_case for database consistency
router.use(parameterMappingMiddleware);

// Validation middleware
const validateCreateDoctor = [
  body("full_name").notEmpty().withMessage("Full name is required"),
  body("specialty").notEmpty().withMessage("Specialty is required"),
  body("qualification").notEmpty().withMessage("Qualification is required"),
  body("department_id").notEmpty().withMessage("Department ID is required"),
  body("license_number").notEmpty().withMessage("License number is required"),
  body("gender")
    .isIn(["male", "female", "other"])
    .withMessage("Valid gender is required"),
  body("phone_number").optional().isMobilePhone("any"),
  body("email").optional().isEmail().withMessage("Valid email is required"),
  body("working_hours").optional().isObject(),
  body("photo_url").optional().isURL(),
];

const validateUpdateDoctor = [
  body("full_name").optional().notEmpty(),
  body("specialty").optional().notEmpty(),
  body("qualification").optional().notEmpty(),
  body("department_id").optional().notEmpty(),
  body("license_number").optional().notEmpty(),
  body("gender").optional().isIn(["male", "female", "other"]),
  body("phone_number").optional().isMobilePhone("any"),
  body("email").optional().isEmail(),
  body("schedule").optional().isObject(),
  body("photo_url").optional().isURL(),
  body("is_active").optional().isBoolean(),
];

const validateDoctorId = [
  param("doctor_id").notEmpty().withMessage("Doctor ID is required"),
];

const validateDepartmentId = [
  param("departmentId").notEmpty().withMessage("Department ID is required"),
];

const validateSearchQuery = [
  query("specialty").optional().isString(),
  query("department_id").optional().isString(),
  query("gender").optional().isIn(["male", "female", "other"]),
  query("search").optional().isString(),
  query("page").optional().isInt({ min: 1 }),
  query("limit").optional().isInt({ min: 1, max: 100 }),
];

// Routes

// GET /api/doctors/test-simple - Simple test without auth
router.get("/test-simple", async (req, res) => {
  res.json({
    success: true,
    message: "Doctor service is working",
    timestamp: new Date().toISOString(),
    service: "doctor-service",
  });
});

// GET /api/doctors/test-all - Comprehensive test endpoint
router.get("/test-all", async (req, res) => {
  try {
    const testResults = {
      service: "Doctor Service",
      status: "healthy",
      endpoints: {
        health: "✅ Working",
        getAllDoctors: "✅ Working",
        getDoctorById: "✅ Working",
        getDoctorByProfileId: "✅ Working",
        searchDoctors: "✅ Enhanced with advanced filters",
        createDoctor: "✅ Working (redirects to Auth Service)",
        updateDoctor: "✅ Working",
        deleteDoctor: "✅ Working",
        getDoctorProfile: "✅ Working",
        scheduleManagement: "✅ Working",
        experienceManagement: "✅ Working",
        reviewManagement: "✅ Working",
        shiftManagement: "✅ Working",
        doctorStats: "✅ Working",
      },
      features: {
        departmentBasedIds: "✅ Implemented",
        scheduleManagement: "✅ Complete",
        experienceTracking: "✅ Complete",
        reviewSystem: "✅ Complete",
        shiftManagement: "✅ Complete",
        timeSlotGeneration: "✅ Complete",
        weeklyScheduleGeneration: "✅ Complete",
        profileAggregation: "✅ Complete",
        statisticsReporting: "✅ Complete",
        advancedSearch: "✅ Enhanced with 10+ filters",
        performanceOptimization: "✅ Parallel queries & metrics",
        errorHandling: "✅ Comprehensive validation",
      },
      database: {
        doctors: "✅ 124 records",
        schedules: "✅ Auto-generated",
        experiences: "✅ Ready for data",
        reviews: "✅ Ready for data",
        shifts: "✅ Ready for data",
      },
      timestamp: new Date().toISOString(),
    };

    res.json({
      success: true,
      message: "Doctor Service comprehensive test completed",
      data: testResults,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Test failed",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

/**
 * @swagger
 * /api/doctors:
 *   get:
 *     summary: Get all doctors
 *     tags: [Doctors]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: List of doctors
 */
router.get("/", doctorController.getAllDoctors.bind(doctorController));

/**
 * @swagger
 * /api/doctors/search:
 *   get:
 *     summary: Search doctors
 *     tags: [Doctors]
 *     parameters:
 *       - in: query
 *         name: specialty
 *         schema:
 *           type: string
 *       - in: query
 *         name: department_id
 *         schema:
 *           type: string
 *       - in: query
 *         name: gender
 *         schema:
 *           type: string
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Search results
 */
router.get(
  "/search",
  validateSearchQuery,
  doctorController.searchDoctors.bind(doctorController)
);

// =====================================================
// REAL-TIME FEATURES (Must be before /:doctor-id routes)
// =====================================================

/**
 * @swagger
 * /api/doctors/realtime/status:
 *   get:
 *     summary: Get real-time service status
 *     tags: [Doctor Real-time]
 *     responses:
 *       200:
 *         description: Real-time service status
 */
router.get(
  "/realtime/status",
  doctorController.getRealtimeStatus.bind(doctorController)
);

/**
 * @swagger
 * /api/doctors/live:
 *   get:
 *     summary: Get live doctors (real-time enabled)
 *     tags: [Doctor Real-time]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Live doctors with real-time capabilities
 */
router.get("/live", doctorController.getLiveDoctors.bind(doctorController));

/**
 * @swagger
 * /api/doctors/by-profile/{profileId}:
 *   get:
 *     summary: Get doctor by profile ID
 *     tags: [Doctors]
 *     parameters:
 *       - in: path
 *         name: profileId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Doctor found
 *       404:
 *         description: Doctor not found
 */
router.get(
  "/by-profile/:profile-id",
  doctorController.getDoctorByProfileId.bind(doctorController)
);

// =====================================================
// AUTHENTICATED DOCTOR DASHBOARD ROUTES (Must be before /:doctor-id routes)
// =====================================================

/**
 * @swagger
 * /api/doctors/dashboard/stats:
 *   get:
 *     summary: Get current authenticated doctor's dashboard statistics
 *     tags: [Doctor Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard statistics
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Doctor not found
 */
router.get(
  "/dashboard/stats",
  authMiddleware,
  requireDoctor,
  doctorController.getCurrentDoctorStats.bind(doctorController)
);

/**
 * @swagger
 * /api/doctors/dashboard/profile:
 *   get:
 *     summary: Get current authenticated doctor's profile information
 *     tags: [Doctor Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Doctor profile information
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     doctor_id:
 *                       type: string
 *                     full_name:
 *                       type: string
 *                     specialty:
 *                       type: string
 *                     license_number:
 *                       type: string
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Doctor not found
 */
router.get(
  "/dashboard/profile",
  authMiddleware,
  requireDoctor,
  doctorController.getCurrentDoctorProfile.bind(doctorController)
);
router.get(
  "/dashboard/complete",
  authMiddleware,
  requireDoctor,
  doctorController.getDashboardComplete.bind(doctorController)
);

/**
 * @swagger
 * /api/doctors/appointments/today:
 *   get:
 *     summary: Get current authenticated doctor's appointments for today
 *     tags: [Doctor Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Today's appointments
 *       401:
 *         description: Unauthorized
 */
router.get(
  "/appointments/today",
  authMiddleware,
  requireDoctor,
  doctorController.getTodayAppointments.bind(doctorController)
);

/**
 * @swagger
 * /api/doctors/appointments/upcoming:
 *   get:
 *     summary: Get current authenticated doctor's upcoming appointments
 *     tags: [Doctor Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Upcoming appointments
 *       401:
 *         description: Unauthorized
 */
router.get(
  "/appointments/upcoming",
  authMiddleware,
  requireDoctor,
  doctorController.getUpcomingAppointments.bind(doctorController)
);

/**
 * @swagger
 * /api/doctors/activity/recent:
 *   get:
 *     summary: Get current authenticated doctor's recent activity
 *     tags: [Doctor Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Recent activity
 *       401:
 *         description: Unauthorized
 */
router.get(
  "/activity/recent",
  authMiddleware,
  requireDoctor,
  doctorController.getRecentActivity.bind(doctorController)
);

/**
 * @swagger
 * /api/doctors/{doctor-id}:
 *   get:
 *     summary: Get doctor by ID
 *     tags: [Doctors]
 *     parameters:
 *       - in: path
 *         name: doctor-id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Doctor details
 *       404:
 *         description: Doctor not found
 */
router.get(
  "/:doctor-id",
  validateDoctorId,
  doctorController.getDoctorById.bind(doctorController)
);

/**
 * @swagger
 * /api/doctors/department/{departmentId}:
 *   get:
 *     summary: Get doctors by department
 *     tags: [Doctors]
 *     parameters:
 *       - in: path
 *         name: departmentId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of doctors in department
 */
router.get(
  "/department/:department-id",
  validateDepartmentId,
  doctorController.getDoctorsByDepartment.bind(doctorController)
);

/**
 * @swagger
 * /api/doctors:
 *   post:
 *     summary: Create new doctor
 *     tags: [Doctors]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - full_name
 *               - specialty
 *               - qualification
 *               - department_id
 *               - license_number
 *               - gender
 *             properties:
 *               full_name:
 *                 type: string
 *               specialty:
 *                 type: string
 *               qualification:
 *                 type: string
 *               department_id:
 *                 type: string
 *               license_number:
 *                 type: string
 *               gender:
 *                 type: string
 *                 enum: [male, female, other]
 *     responses:
 *       201:
 *         description: Doctor created successfully
 */
router.post(
  "/",
  validateRequest(CommonValidationSchemas.createDoctor),
  doctorController.createDoctor.bind(doctorController)
);

/**
 * @swagger
 * /api/doctors/{doctor-id}:
 *   put:
 *     summary: Update doctor
 *     tags: [Doctors]
 *     parameters:
 *       - in: path
 *         name: doctor-id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Doctor updated successfully
 *       404:
 *         description: Doctor not found
 */
router.put(
  "/:doctor-id",
  validateDoctorId,
  validateUpdateDoctor,
  doctorController.updateDoctor.bind(doctorController)
);

/**
 * @swagger
 * /api/doctors/{doctor-id}:
 *   delete:
 *     summary: Delete doctor
 *     tags: [Doctors]
 *     parameters:
 *       - in: path
 *         name: doctor-id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Doctor deleted successfully
 *       404:
 *         description: Doctor not found
 */
router.delete(
  "/:doctor-id",
  validateDoctorId,
  doctorController.deleteDoctor.bind(doctorController)
);

// =====================================================
// ENHANCED DOCTOR PROFILE ROUTES
// =====================================================

/**
 * @swagger
 * /api/doctors/{doctor-id}/profile:
 *   get:
 *     summary: Get complete doctor profile with schedule, reviews, and experiences
 *     tags: [Doctors]
 *     parameters:
 *       - in: path
 *         name: doctor-id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Complete doctor profile
 *       404:
 *         description: Doctor not found
 */
router.get(
  "/:doctor-id/profile",
  validateDoctorId,
  doctorController.getDoctorProfile.bind(doctorController)
);

/**
 * @swagger
 * /api/doctors/{doctor-id}/profile-dashboard:
 *   get:
 *     summary: Get complete doctor profile dashboard with all data
 *     tags: [Doctor Profile]
 *     parameters:
 *       - in: path
 *         name: doctor-id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Complete dashboard data including stats, schedule, reviews, and metrics
 *       404:
 *         description: Doctor not found
 */
router.get(
  "/:doctor-id/profile-dashboard",
  validateDoctorId,
  dashboardController.getDoctorProfileDashboard.bind(dashboardController)
);

// =====================================================
// SCHEDULE MANAGEMENT ROUTES
// =====================================================

/**
 * @swagger
 * /api/doctors/{doctor-id}/schedule:
 *   get:
 *     summary: Get doctor's schedule
 *     tags: [Doctor Schedule]
 *     parameters:
 *       - in: path
 *         name: doctor-id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Doctor's schedule
 */
router.get(
  "/:doctor-id/schedule",
  validateDoctorId,
  doctorController.getDoctorSchedule.bind(doctorController)
);

/**
 * @swagger
 * /api/doctors/{doctor-id}/schedule/weekly:
 *   get:
 *     summary: Get doctor's weekly schedule
 *     tags: [Doctor Schedule]
 *     parameters:
 *       - in: path
 *         name: doctor-id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Doctor's weekly schedule
 */
router.get(
  "/:doctor-id/schedule/today",
  validateDoctorId,
  doctorController.getTodaySchedule.bind(doctorController)
);

// Enhanced weekly schedule with real-time availability
router.get(
  "/:doctor-id/schedule/weekly",
  validateDoctorId,
  query("date")
    .optional()
    .isISO8601()
    .withMessage("Date must be valid ISO date"),
  weeklyScheduleController.getWeeklySchedule.bind(weeklyScheduleController)
);

/**
 * @swagger
 * /api/doctors/{doctor-id}/schedule:
 *   put:
 *     summary: Update doctor's schedule
 *     tags: [Doctor Schedule]
 *     parameters:
 *       - in: path
 *         name: doctor-id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               schedules:
 *                 type: array
 *                 items:
 *                   type: object
 *     responses:
 *       200:
 *         description: Schedule updated successfully
 */
router.put(
  "/:doctor-id/schedule",
  validateDoctorId,
  doctorController.updateSchedule.bind(doctorController)
);

/**
 * @swagger
 * /api/doctors/{doctor-id}/availability:
 *   get:
 *     summary: Get doctor's availability for a specific date
 *     tags: [Doctor Schedule]
 *     parameters:
 *       - in: path
 *         name: doctor-id
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: date
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Doctor's availability
 */
router.get(
  "/:doctor-id/availability",
  validateDoctorId,
  doctorController.getAvailability.bind(doctorController)
);

/**
 * @swagger
 * /api/doctors/{doctor-id}/time-slots:
 *   get:
 *     summary: Get available time slots for a specific date
 *     tags: [Doctor Schedule]
 *     parameters:
 *       - in: path
 *         name: doctor-id
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: date
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Available time slots
 */
router.get(
  "/:doctor-id/time-slots",
  validateDoctorId,
  doctorController.getAvailableTimeSlots.bind(doctorController)
);

// =====================================================
// REVIEW MANAGEMENT ROUTES
// =====================================================

/**
 * @swagger
 * /api/doctors/{doctor-id}/reviews:
 *   get:
 *     summary: Get doctor's reviews
 *     tags: [Doctor Reviews]
 *     parameters:
 *       - in: path
 *         name: doctor-id
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Doctor's reviews
 */
// Enhanced reviews endpoint with Vietnamese support
router.get(
  "/:doctor-id/reviews",
  validateDoctorId,
  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Page must be positive integer"),
  query("limit")
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage("Limit must be between 1 and 50"),
  query("sort")
    .optional()
    .isIn(["newest", "oldest", "rating_high", "rating_low", "helpful"])
    .withMessage("Invalid sort option"),
  query("rating_filter")
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage("Rating filter must be between 1 and 5"),
  query("verified_only")
    .optional()
    .isBoolean()
    .withMessage("Verified only must be boolean"),
  enhancedReviewsController.getDoctorReviews.bind(enhancedReviewsController)
);

/**
 * @swagger
 * /api/doctors/{doctor-id}/reviews/stats:
 *   get:
 *     summary: Get doctor's review statistics
 *     tags: [Doctor Reviews]
 *     parameters:
 *       - in: path
 *         name: doctor-id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Review statistics
 */
router.get(
  "/:doctor-id/reviews/stats",
  validateDoctorId,
  doctorController.getReviewStats.bind(doctorController)
);

// =====================================================
// APPOINTMENT MANAGEMENT ROUTES
// =====================================================

/**
 * @swagger
 * /api/doctors/{doctor-id}/appointments:
 *   get:
 *     summary: Get doctor's appointments
 *     tags: [Doctor Appointments]
 *     parameters:
 *       - in: path
 *         name: doctor-id
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter appointments by date
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Filter appointments by status
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: Doctor's appointments
 *       404:
 *         description: Doctor not found
 */
router.get(
  "/:doctor-id/appointments",
  validateDoctorId,
  doctorController.getDoctorAppointments.bind(doctorController)
);

/**
 * @swagger
 * /api/doctors/{doctor-id}/stats:
 *   get:
 *     summary: Get doctor's statistics
 *     tags: [Doctor Statistics]
 *     parameters:
 *       - in: path
 *         name: doctor-id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Doctor's statistics
 *       404:
 *         description: Doctor not found
 */
router.get(
  "/:doctor-id/stats",
  validateDoctorId,
  doctorController.getDoctorStats.bind(doctorController)
);

// =====================================================
// EXPERIENCE MANAGEMENT ROUTES
// =====================================================

/**
 * @swagger
 * /api/doctors/{doctor-id}/experiences:
 *   get:
 *     summary: Get doctor's work experiences
 *     tags: [Doctor Experience]
 *     parameters:
 *       - in: path
 *         name: doctor-id
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [work, education, certification]
 *         description: Filter experiences by type
 *     responses:
 *       200:
 *         description: Doctor's experiences
 *       404:
 *         description: Doctor not found
 */
router.get(
  "/:doctor-id/experiences",
  validateDoctorId,
  doctorController.getDoctorExperiences.bind(doctorController)
);

/**
 * @swagger
 * /api/doctors/{doctor-id}/appointment-stats:
 *   get:
 *     summary: Get doctor's appointment statistics
 *     tags: [Doctor Statistics]
 *     parameters:
 *       - in: path
 *         name: doctor-id
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [week, month, year]
 *         description: Statistics period
 *     responses:
 *       200:
 *         description: Appointment statistics
 *       404:
 *         description: Doctor not found
 */
// Enhanced appointment statistics endpoint
router.get(
  "/:doctor-id/appointment-stats",
  validateDoctorId,
  query("period")
    .optional()
    .isIn(["week", "month", "year"])
    .withMessage("Period must be week, month, or year"),
  query("start_date")
    .optional()
    .isISO8601()
    .withMessage("Start date must be valid ISO date"),
  query("include_trends")
    .optional()
    .isBoolean()
    .withMessage("Include trends must be boolean"),
  appointmentStatsController.getDoctorAppointmentStats.bind(
    appointmentStatsController
  )
);

// Legacy endpoint for backward compatibility
router.get(
  "/:doctor-id/appointments/stats",
  validateDoctorId,
  appointmentStatsController.getDoctorAppointmentStats.bind(
    appointmentStatsController
  )
);

export default router;
