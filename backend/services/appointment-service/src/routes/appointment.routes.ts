import express from "express";
import { AppointmentController } from "../controllers/appointment.controller";
import { parameterMappingMiddleware } from "../middleware/parameter-mapping.middleware";
import {
  validateAppointmentId,
  validateAppointmentSearch,
  validateAvailableSlots,
  validateConfirmAppointment,
  validateCreateAppointment,
  validateDoctorId,
  validatePatientId,
  validateUpdateAppointment,
} from "../validators/appointment.validators";

const router = express.Router();
const appointmentController = new AppointmentController();

// Apply parameter mapping middleware to all routes
// This converts kebab-case route params to snake_case for database consistency
router.use(parameterMappingMiddleware);

// GET /api/appointments - Get all appointments with optional filters and pagination
router.get(
  "/",
  validateAppointmentSearch,
  appointmentController.getAllAppointments.bind(appointmentController)
);

// GET /api/appointments/stats - Get appointment statistics
router.get(
  "/stats",
  appointmentController.getAppointmentStats.bind(appointmentController)
);

// GET /api/appointments/realtime/status - Get real-time service status
router.get(
  "/realtime/status",
  appointmentController.getRealtimeStatus.bind(appointmentController)
);

// GET /api/appointments/live - Get live appointments (real-time enabled)
router.get(
  "/live",
  appointmentController.getLiveAppointments.bind(appointmentController)
);

// GET /api/appointments/available-slots - Get available time slots
router.get(
  "/available-slots",
  validateAvailableSlots,
  appointmentController.getAvailableTimeSlots.bind(appointmentController)
);

// GET /api/appointments/doctor/:doctor_id - Get appointments by doctor ID
router.get(
  "/doctor/:doctor-id",
  validateDoctorId,
  appointmentController.getAppointmentsByDoctorId.bind(appointmentController)
);

// GET /api/appointments/doctor/:doctor-id/upcoming - Get upcoming appointments for doctor
router.get(
  "/doctor/:doctor-id/upcoming",
  validateDoctorId,
  appointmentController.getUpcomingAppointments.bind(appointmentController)
);

// GET /api/appointments/doctor/:doctor-id/stats - Get appointment statistics for doctor
router.get(
  "/doctor/:doctor-id/stats",
  validateDoctorId,
  appointmentController.getDoctorAppointmentStats.bind(appointmentController)
);

// GET /api/appointments/doctor/:doctor-id/patients/count - Get patient count for doctor
router.get(
  "/doctor/:doctor-id/patients/count",
  validateDoctorId,
  appointmentController.getDoctorPatientCount.bind(appointmentController)
);

// GET /api/appointments/patient/:patient_id - Get appointments by patient ID
router.get(
  "/patient/:patient-id",
  validatePatientId,
  appointmentController.getAppointmentsByPatientId.bind(appointmentController)
);

// GET /api/appointments/:appointment_id - Get appointment by ID
router.get(
  "/:appointment-id",
  validateAppointmentId,
  appointmentController.getAppointmentById.bind(appointmentController)
);

// POST /api/appointments - Create new appointment
router.post(
  "/",
  validateCreateAppointment,
  appointmentController.createAppointment.bind(appointmentController)
);

// PUT /api/appointments/:appointment_id - Update appointment
router.put(
  "/:appointment-id",
  validateUpdateAppointment,
  appointmentController.updateAppointment.bind(appointmentController)
);

// POST /api/appointments/:appointment-id/confirm - Confirm appointment
router.post(
  "/:appointment-id/confirm",
  validateConfirmAppointment,
  appointmentController.confirmAppointment.bind(appointmentController)
);

// DELETE /api/appointments/:appointment_id - Cancel appointment
router.delete(
  "/:appointment-id",
  validateAppointmentId,
  appointmentController.cancelAppointment.bind(appointmentController)
);

// CALENDAR INTEGRATION ROUTES

// GET /api/appointments/calendar - Get calendar view
router.get(
  "/calendar",
  appointmentController.getCalendarView.bind(appointmentController)
);

// GET /api/appointments/doctor/:doctor-id/weekly - Get weekly schedule for doctor
router.get(
  "/doctor/:doctor-id/weekly",
  validateDoctorId,
  appointmentController.getWeeklySchedule.bind(appointmentController)
);

// PUT /api/appointments/:id/reschedule - Reschedule appointment
router.put(
  "/:id/reschedule",
  validateAppointmentId,
  appointmentController.rescheduleAppointment.bind(appointmentController)
);

// REAL-TIME FEATURES ROUTES

// GET /api/appointments/realtime/status - Get real-time service status
router.get(
  "/realtime/status",
  appointmentController.getRealtimeStatus.bind(appointmentController)
);

// GET /api/appointments/live - Get live appointments with real-time capabilities
router.get(
  "/live",
  appointmentController.getLiveAppointments.bind(appointmentController)
);

export default router;
