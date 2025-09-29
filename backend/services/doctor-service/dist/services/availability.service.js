"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AvailabilityService = void 0;
const logger_1 = __importDefault(require("@hospital/shared/dist/utils/logger"));
const database_config_1 = require("../config/database.config");
class AvailabilityService {
    async getDoctorAvailability(query) {
        try {
            const { doctor_id, date, duration = 30, include_breaks = false } = query;
            logger_1.default.info("🔄 Getting doctor availability", {
                doctor_id,
                date,
                duration,
            });
            const schedule = await this.getDoctorSchedule(doctor_id, date);
            if (!schedule) {
                logger_1.default.warn("⚠️ No schedule found for doctor", { doctor_id, date });
                return null;
            }
            const appointments = await this.getDoctorAppointments(doctor_id, date);
            const timeSlots = await this.generateTimeSlots(schedule, appointments, duration, include_breaks);
            const stats = this.calculateAvailabilityStats(timeSlots);
            const availability = {
                doctor_id,
                date,
                day_of_week: new Date(date).getDay(),
                is_working_day: schedule.is_available,
                start_time: schedule.start_time,
                end_time: schedule.end_time,
                break_start: schedule.break_start,
                break_end: schedule.break_end,
                max_appointments: schedule.max_appointments,
                slot_duration: duration,
                total_slots: stats.total_slots,
                available_slots: stats.available_slots,
                booked_slots: stats.booked_slots,
                time_slots: timeSlots,
            };
            logger_1.default.info("✅ Doctor availability retrieved successfully", {
                doctor_id,
                date,
                available_slots: stats.available_slots,
                total_slots: stats.total_slots,
            });
            return availability;
        }
        catch (error) {
            logger_1.default.error("❌ Error getting doctor availability:", error);
            throw error;
        }
    }
    async getAvailableTimeSlots(doctor_id, date, duration = 30) {
        try {
            const availability = await this.getDoctorAvailability({
                doctor_id,
                date,
                duration,
            });
            if (!availability) {
                return [];
            }
            return availability.time_slots.filter((slot) => slot.is_available && slot.slot_type === "available");
        }
        catch (error) {
            logger_1.default.error("❌ Error getting available time slots:", error);
            throw error;
        }
    }
    async isTimeSlotAvailable(doctor_id, date, start_time, end_time) {
        try {
            logger_1.default.info("🔄 Checking time slot availability", {
                doctor_id,
                date,
                start_time,
                end_time,
            });
            const schedule = await this.getDoctorSchedule(doctor_id, date);
            if (!schedule || !schedule.is_available) {
                logger_1.default.info("⚠️ Doctor not working on this date", { doctor_id, date });
                return false;
            }
            if (!this.isWithinWorkingHours(start_time, end_time, schedule)) {
                logger_1.default.info("⚠️ Time outside working hours", {
                    start_time,
                    end_time,
                    schedule,
                });
                return false;
            }
            const hasConflict = await this.checkAppointmentConflict(doctor_id, date, start_time, end_time);
            if (hasConflict) {
                logger_1.default.info("⚠️ Time slot conflicts with existing appointment", {
                    doctor_id,
                    date,
                    start_time,
                    end_time,
                });
                return false;
            }
            logger_1.default.info("✅ Time slot is available", {
                doctor_id,
                date,
                start_time,
                end_time,
            });
            return true;
        }
        catch (error) {
            logger_1.default.error("❌ Error checking time slot availability:", error);
            return false;
        }
    }
    async getDoctorSchedule(doctor_id, date) {
        try {
            const dayOfWeek = new Date(date).getDay();
            const { data, error } = await database_config_1.supabaseAdmin
                .from("doctor_schedules")
                .select("*")
                .eq("doctor_id", doctor_id)
                .eq("day_of_week", dayOfWeek)
                .eq("is_available", true)
                .single();
            if (error && error.code !== "PGRST116") {
                throw error;
            }
            return data;
        }
        catch (error) {
            logger_1.default.error("Error getting doctor schedule:", error);
            return null;
        }
    }
    async getDoctorAppointments(doctor_id, date) {
        try {
            const { data, error } = await database_config_1.supabaseAdmin
                .from("appointments")
                .select(`
          appointment_id,
          start_time,
          end_time,
          appointment_type,
          status,
          patients!patient_id (
            profiles!profile_id (
              full_name
            )
          )
        `)
                .eq("doctor_id", doctor_id)
                .eq("appointment_date", date)
                .not("status", "in", "(cancelled,no_show)")
                .order("start_time");
            if (error) {
                throw error;
            }
            return data || [];
        }
        catch (error) {
            logger_1.default.error("Error getting doctor appointments:", error);
            return [];
        }
    }
    async generateTimeSlots(schedule, appointments, duration, include_breaks) {
        const slots = [];
        const startMinutes = this.timeToMinutes(schedule.start_time);
        const endMinutes = this.timeToMinutes(schedule.end_time);
        const breakStartMinutes = schedule.break_start
            ? this.timeToMinutes(schedule.break_start)
            : null;
        const breakEndMinutes = schedule.break_end
            ? this.timeToMinutes(schedule.break_end)
            : null;
        for (let currentMinutes = startMinutes; currentMinutes < endMinutes; currentMinutes += duration) {
            const slotStart = this.minutesToTime(currentMinutes);
            const slotEnd = this.minutesToTime(currentMinutes + duration);
            const isDuringBreak = breakStartMinutes &&
                breakEndMinutes &&
                currentMinutes >= breakStartMinutes &&
                currentMinutes < breakEndMinutes;
            if (isDuringBreak && !include_breaks) {
                continue;
            }
            const conflictingAppointment = appointments.find((apt) => {
                const aptStart = this.timeToMinutes(apt.start_time);
                const aptEnd = this.timeToMinutes(apt.end_time);
                return currentMinutes < aptEnd && currentMinutes + duration > aptStart;
            });
            const slot = {
                start_time: slotStart,
                end_time: slotEnd,
                is_available: !conflictingAppointment && !isDuringBreak,
                appointment_count: conflictingAppointment ? 1 : 0,
                max_appointments: 1,
                slot_type: isDuringBreak
                    ? "break"
                    : conflictingAppointment
                        ? "booked"
                        : "available",
            };
            if (conflictingAppointment) {
                slot.appointment_id = conflictingAppointment.appointment_id;
                slot.patient_name =
                    conflictingAppointment.patients?.profiles?.full_name;
                slot.appointment_type = conflictingAppointment.appointment_type;
            }
            slots.push(slot);
        }
        return slots;
    }
    calculateAvailabilityStats(timeSlots) {
        const total_slots = timeSlots.length;
        const available_slots = timeSlots.filter((slot) => slot.is_available).length;
        const booked_slots = timeSlots.filter((slot) => slot.slot_type === "booked").length;
        return { total_slots, available_slots, booked_slots };
    }
    isWithinWorkingHours(start_time, end_time, schedule) {
        const startMinutes = this.timeToMinutes(start_time);
        const endMinutes = this.timeToMinutes(end_time);
        const workStartMinutes = this.timeToMinutes(schedule.start_time);
        const workEndMinutes = this.timeToMinutes(schedule.end_time);
        return startMinutes >= workStartMinutes && endMinutes <= workEndMinutes;
    }
    async checkAppointmentConflict(doctor_id, date, start_time, end_time) {
        try {
            logger_1.default.info("⚠️ Appointment conflict check delegated to Appointment Service", {
                doctor_id,
                date,
                start_time,
                end_time,
            });
            return false;
        }
        catch (error) {
            logger_1.default.error("Error checking appointment conflict:", error);
            return true;
        }
    }
    timeToMinutes(timeStr) {
        const [hours, minutes] = timeStr.split(":").map(Number);
        return hours * 60 + minutes;
    }
    minutesToTime(minutes) {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}`;
    }
}
exports.AvailabilityService = AvailabilityService;
//# sourceMappingURL=availability.service.js.map