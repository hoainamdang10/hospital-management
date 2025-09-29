"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AvailabilityController = void 0;
const logger_1 = __importDefault(require("@hospital/shared/dist/utils/logger"));
const response_helpers_1 = require("@hospital/shared/dist/utils/response-helpers");
const availability_service_1 = require("../services/availability.service");
class AvailabilityController {
    constructor() {
        this.getDoctorAvailability = async (req, res) => {
            try {
                const { doctor_id, date } = req.params;
                const { duration, appointment_type, include_breaks } = req.query;
                logger_1.default.info("🔄 [Availability] Getting doctor availability", {
                    doctor_id,
                    date,
                    duration,
                    appointment_type,
                    include_breaks,
                });
                if (!this.isValidDate(date)) {
                    res
                        .status(400)
                        .json(response_helpers_1.ResponseHelper.error("Invalid date format. Use YYYY-MM-DD", "INVALID_DATE_FORMAT"));
                    return;
                }
                const query = {
                    doctor_id: doctor_id,
                    date,
                    duration: duration ? parseInt(duration) : 30,
                    appointment_type: appointment_type,
                    include_breaks: include_breaks === "true",
                };
                const availability = await this.availabilityService.getDoctorAvailability(query);
                if (!availability) {
                    res
                        .status(404)
                        .json(response_helpers_1.ResponseHelper.error("Doctor availability not found for the specified date", "AVAILABILITY_NOT_FOUND"));
                    return;
                }
                logger_1.default.info("✅ [Availability] Doctor availability retrieved successfully", {
                    doctor_id,
                    date,
                    available_slots: availability.available_slots,
                    total_slots: availability.total_slots,
                });
                res.json(response_helpers_1.ResponseHelper.success(availability));
            }
            catch (error) {
                logger_1.default.error("❌ [Availability] Error getting doctor availability:", error);
                res
                    .status(500)
                    .json(response_helpers_1.ResponseHelper.error("Internal server error while getting doctor availability", "INTERNAL_SERVER_ERROR"));
            }
        };
        this.getAvailableTimeSlots = async (req, res) => {
            try {
                const { doctor_id, date } = req.params;
                const { duration } = req.query;
                logger_1.default.info("🔄 [Availability] Getting available time slots", {
                    doctor_id,
                    date,
                    duration,
                });
                if (!this.isValidDate(date)) {
                    res
                        .status(400)
                        .json(response_helpers_1.ResponseHelper.error("Invalid date format. Use YYYY-MM-DD", "INVALID_DATE_FORMAT"));
                    return;
                }
                const slotDuration = duration ? parseInt(duration) : 30;
                const availableSlots = await this.availabilityService.getAvailableTimeSlots(doctor_id, date, slotDuration);
                logger_1.default.info("✅ [Availability] Available time slots retrieved successfully", {
                    doctor_id,
                    date,
                    slots_count: availableSlots.length,
                });
                res.json(response_helpers_1.ResponseHelper.success({
                    doctor_id: doctor_id,
                    date,
                    slot_duration: slotDuration,
                    available_slots: availableSlots,
                    total_available: availableSlots.length,
                }));
            }
            catch (error) {
                logger_1.default.error("❌ [Availability] Error getting available time slots:", error);
                res
                    .status(500)
                    .json(response_helpers_1.ResponseHelper.error("Internal server error while getting available time slots", "INTERNAL_SERVER_ERROR"));
            }
        };
        this.checkTimeSlotAvailability = async (req, res) => {
            try {
                const { doctor_id } = req.params;
                const { date, start_time, end_time } = req.body;
                logger_1.default.info("🔄 [Availability] Checking time slot availability", {
                    doctor_id,
                    date,
                    start_time,
                    end_time,
                });
                if (!date || !start_time || !end_time) {
                    res
                        .status(400)
                        .json(response_helpers_1.ResponseHelper.error("Missing required fields: date, start_time, end_time", "MISSING_REQUIRED_FIELDS"));
                    return;
                }
                if (!this.isValidDate(date)) {
                    res
                        .status(400)
                        .json(response_helpers_1.ResponseHelper.error("Invalid date format. Use YYYY-MM-DD", "INVALID_DATE_FORMAT"));
                    return;
                }
                if (!this.isValidTime(start_time) || !this.isValidTime(end_time)) {
                    res
                        .status(400)
                        .json(response_helpers_1.ResponseHelper.error("Invalid time format. Use HH:MM", "INVALID_TIME_FORMAT"));
                    return;
                }
                const isAvailable = await this.availabilityService.isTimeSlotAvailable(doctor_id, date, start_time, end_time);
                logger_1.default.info("✅ [Availability] Time slot availability checked", {
                    doctor_id,
                    date,
                    start_time,
                    end_time,
                    is_available: isAvailable,
                });
                res.json(response_helpers_1.ResponseHelper.success({
                    doctor_id: doctor_id,
                    date,
                    start_time,
                    end_time,
                    is_available: isAvailable,
                    checked_at: new Date().toISOString(),
                }));
            }
            catch (error) {
                logger_1.default.error("❌ [Availability] Error checking time slot availability:", error);
                res
                    .status(500)
                    .json(response_helpers_1.ResponseHelper.error("Internal server error while checking time slot availability", "INTERNAL_SERVER_ERROR"));
            }
        };
        this.getWeeklyAvailability = async (req, res) => {
            try {
                const { doctor_id, startDate } = req.params;
                const { duration } = req.query;
                logger_1.default.info("🔄 [Availability] Getting weekly availability", {
                    doctor_id,
                    startDate,
                    duration,
                });
                if (!this.isValidDate(startDate)) {
                    res
                        .status(400)
                        .json(response_helpers_1.ResponseHelper.error("Invalid date format. Use YYYY-MM-DD", "INVALID_DATE_FORMAT"));
                    return;
                }
                const slotDuration = duration ? parseInt(duration) : 30;
                const weeklyAvailability = [];
                for (let i = 0; i < 7; i++) {
                    const currentDate = new Date(startDate);
                    currentDate.setDate(currentDate.getDate() + i);
                    const dateStr = currentDate.toISOString().split("T")[0];
                    const availability = await this.availabilityService.getDoctorAvailability({
                        doctor_id: doctor_id,
                        date: dateStr,
                        duration: slotDuration,
                    });
                    weeklyAvailability.push({
                        date: dateStr,
                        day_of_week: currentDate.getDay(),
                        day_name: currentDate.toLocaleDateString("vi-VN", {
                            weekday: "long",
                        }),
                        availability: availability,
                    });
                }
                logger_1.default.info("✅ [Availability] Weekly availability retrieved successfully", {
                    doctor_id,
                    startDate,
                    days_retrieved: weeklyAvailability.length,
                });
                res.json(response_helpers_1.ResponseHelper.success({
                    doctor_id: doctor_id,
                    start_date: startDate,
                    slot_duration: slotDuration,
                    weekly_availability: weeklyAvailability,
                }));
            }
            catch (error) {
                logger_1.default.error("❌ [Availability] Error getting weekly availability:", error);
                res
                    .status(500)
                    .json(response_helpers_1.ResponseHelper.error("Internal server error while getting weekly availability", "INTERNAL_SERVER_ERROR"));
            }
        };
        this.availabilityService = new availability_service_1.AvailabilityService();
    }
    isValidDate(dateString) {
        const regex = /^\d{4}-\d{2}-\d{2}$/;
        if (!regex.test(dateString))
            return false;
        const date = new Date(dateString);
        return date instanceof Date && !isNaN(date.getTime());
    }
    isValidTime(timeString) {
        const regex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
        return regex.test(timeString);
    }
}
exports.AvailabilityController = AvailabilityController;
//# sourceMappingURL=availability.controller.js.map