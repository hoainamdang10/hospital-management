"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScheduleRepository = void 0;
const database_config_1 = require("../config/database.config");
const logger_1 = __importDefault(require("@hospital/shared/dist/utils/logger"));
class ScheduleRepository {
    constructor() {
        this.supabase = (0, database_config_1.getSupabase)();
    }
    async findByDoctorId(doctor_id) {
        try {
            const { data, error } = await this.supabase
                .from('doctor_schedules')
                .select('*')
                .eq('doctor_id', doctor_id)
                .order('day_of_week');
            if (error)
                throw error;
            return data?.map(this.mapSupabaseScheduleToSchedule) || [];
        }
        catch (error) {
            logger_1.default.error('Error finding schedules by doctor ID', { error, doctor_id });
            throw error;
        }
    }
    async findByDoctorAndDay(doctor_id, dayOfWeek) {
        try {
            const { data, error } = await this.supabase
                .from('doctor_schedules')
                .select('*')
                .eq('doctor_id', doctor_id)
                .eq('day_of_week', dayOfWeek)
                .single();
            if (error) {
                if (error.code === 'PGRST116')
                    return null;
                throw error;
            }
            return this.mapSupabaseScheduleToSchedule(data);
        }
        catch (error) {
            logger_1.default.error('Error finding schedule by doctor and day', { error, doctor_id, dayOfWeek });
            throw error;
        }
    }
    async create(scheduleData) {
        try {
            const { data, error } = await this.supabase
                .from('doctor_schedules')
                .insert([{
                    doctor_id: scheduleData.doctor_id,
                    day_of_week: scheduleData.day_of_week,
                    start_time: scheduleData.start_time,
                    end_time: scheduleData.end_time,
                    is_available: scheduleData.is_available,
                    break_start: scheduleData.break_start,
                    break_end: scheduleData.break_end,
                    max_appointments: scheduleData.max_appointments || 10,
                    slot_duration: scheduleData.slot_duration || 30
                }])
                .select()
                .single();
            if (error)
                throw error;
            return this.mapSupabaseScheduleToSchedule(data);
        }
        catch (error) {
            logger_1.default.error('Error creating schedule', { error, scheduleData });
            throw error;
        }
    }
    async update(scheduleId, scheduleData) {
        try {
            const { data, error } = await this.supabase
                .from('doctor_schedules')
                .update(scheduleData)
                .eq('schedule_id', scheduleId)
                .select()
                .single();
            if (error) {
                if (error.code === 'PGRST116')
                    return null;
                throw error;
            }
            return this.mapSupabaseScheduleToSchedule(data);
        }
        catch (error) {
            logger_1.default.error('Error updating schedule', { error, scheduleId, scheduleData });
            throw error;
        }
    }
    async delete(scheduleId) {
        try {
            const { error } = await this.supabase
                .from('doctor_schedules')
                .delete()
                .eq('schedule_id', scheduleId);
            if (error)
                throw error;
            return true;
        }
        catch (error) {
            logger_1.default.error('Error deleting schedule', { error, scheduleId });
            throw error;
        }
    }
    async upsertSchedule(doctor_id, dayOfWeek, scheduleData) {
        try {
            const existingSchedule = await this.findByDoctorAndDay(doctor_id, dayOfWeek);
            if (existingSchedule) {
                const updated = await this.update(existingSchedule.schedule_id, scheduleData);
                if (!updated)
                    throw new Error('Failed to update schedule');
                return updated;
            }
            else {
                const createData = {
                    doctor_id: doctor_id,
                    day_of_week: dayOfWeek,
                    start_time: scheduleData.start_time || '09:00',
                    end_time: scheduleData.end_time || '17:00',
                    is_available: scheduleData.is_available ?? true,
                    break_start: scheduleData.break_start,
                    break_end: scheduleData.break_end,
                    max_appointments: scheduleData.max_appointments,
                    slot_duration: scheduleData.slot_duration
                };
                return await this.create(createData);
            }
        }
        catch (error) {
            logger_1.default.error('Error upserting schedule', { error, doctor_id, dayOfWeek, scheduleData });
            throw error;
        }
    }
    async getAvailability(doctor_id, date) {
        try {
            const dayOfWeek = date.getDay();
            const { data, error } = await this.supabase
                .rpc('get_doctor_availability', {
                doctor_id_param: doctor_id,
                check_date: date.toISOString().split('T')[0]
            });
            if (error)
                throw error;
            if (!data || data.length === 0)
                return null;
            const availability = data[0];
            return {
                schedule_id: `temp_${doctor_id}`,
                doctor_id: doctor_id,
                day_of_week: dayOfWeek,
                start_time: availability.start_time,
                end_time: availability.end_time,
                is_available: availability.is_available,
                break_start: availability.break_start,
                break_end: availability.break_end,
                max_appointments: availability.max_appointments,
                slot_duration: availability.slot_duration,
                created_at: new Date(),
                updated_at: new Date()
            };
        }
        catch (error) {
            logger_1.default.error('Error getting doctor availability', { error, doctor_id, date });
            throw error;
        }
    }
    async getWeeklySchedule(doctor_id) {
        try {
            const schedules = await this.findByDoctorId(doctor_id);
            const weeklySchedule = [];
            for (let day = 0; day <= 6; day++) {
                const existingSchedule = schedules.find(s => s.day_of_week === day);
                if (existingSchedule) {
                    weeklySchedule.push(existingSchedule);
                }
                else {
                    weeklySchedule.push({
                        schedule_id: `default_${doctor_id}`,
                        doctor_id: doctor_id,
                        day_of_week: day,
                        start_time: '09:00',
                        end_time: '17:00',
                        is_available: false,
                        max_appointments: 0,
                        slot_duration: 30,
                        created_at: new Date(),
                        updated_at: new Date()
                    });
                }
            }
            return weeklySchedule.sort((a, b) => a.day_of_week - b.day_of_week);
        }
        catch (error) {
            logger_1.default.error('Error getting weekly schedule', { error, doctor_id });
            throw error;
        }
    }
    async bulkUpdateSchedule(doctor_id, schedules) {
        try {
            const updatedSchedules = [];
            for (let i = 0; i < schedules.length; i++) {
                const scheduleData = schedules[i];
                const dayOfWeek = scheduleData.day_of_week ?? i;
                const updated = await this.upsertSchedule(doctor_id, dayOfWeek, scheduleData);
                updatedSchedules.push(updated);
            }
            return updatedSchedules;
        }
        catch (error) {
            logger_1.default.error('Error bulk updating schedule', { error, doctor_id, schedules });
            throw error;
        }
    }
    async getAvailableTimeSlots(doctor_id, date) {
        try {
            const availability = await this.getAvailability(doctor_id, date);
            if (!availability || !availability.is_available) {
                return [];
            }
            const slots = [];
            const startTime = this.timeStringToMinutes(availability.start_time);
            const endTime = this.timeStringToMinutes(availability.end_time);
            const slotDuration = availability.slot_duration || 30;
            let breakStart = null;
            let breakEnd = null;
            if (availability.break_start && availability.break_end) {
                breakStart = this.timeStringToMinutes(availability.break_start);
                breakEnd = this.timeStringToMinutes(availability.break_end);
            }
            for (let time = startTime; time < endTime; time += slotDuration) {
                if (breakStart && breakEnd && time >= breakStart && time < breakEnd) {
                    continue;
                }
                slots.push(this.minutesToTimeString(time));
            }
            return slots;
        }
        catch (error) {
            logger_1.default.error('Error getting available time slots', { error, doctor_id, date });
            throw error;
        }
    }
    timeStringToMinutes(timeString) {
        const [hours, minutes] = timeString.split(':').map(Number);
        return hours * 60 + minutes;
    }
    minutesToTimeString(minutes) {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
    }
    mapSupabaseScheduleToSchedule(supabaseSchedule) {
        return {
            schedule_id: supabaseSchedule.schedule_id,
            doctor_id: supabaseSchedule.doctor_id,
            day_of_week: supabaseSchedule.day_of_week,
            start_time: supabaseSchedule.start_time,
            end_time: supabaseSchedule.end_time,
            is_available: supabaseSchedule.is_available,
            break_start: supabaseSchedule.break_start,
            break_end: supabaseSchedule.break_end,
            max_appointments: supabaseSchedule.max_appointments,
            slot_duration: supabaseSchedule.slot_duration,
            created_at: new Date(supabaseSchedule.created_at),
            updated_at: new Date(supabaseSchedule.updated_at)
        };
    }
    async getTodaySchedule(doctor_id) {
        try {
            const today = new Date();
            const dayOfWeek = today.getDay();
            const todayDate = today.toISOString().split('T')[0];
            const schedule = await this.findByDoctorAndDay(doctor_id, dayOfWeek);
            if (!schedule || !schedule.is_available) {
                return [];
            }
            const { data: appointments, error: appointmentError } = await this.supabase
                .from('appointments')
                .select(`
          appointment_id,
          start_time,
          end_time,
          status,
          appointment_type,
          reason,
          patients!inner(
            patient_id,
            profiles!inner(
              full_name,
              phone_number
            )
          )
        `)
                .eq('doctor_id', doctor_id)
                .eq('appointment_date', todayDate);
            if (appointmentError) {
                logger_1.default.error('Error fetching today appointments:', appointmentError);
                throw appointmentError;
            }
            const timeSlots = this.generateTimeSlotsForSchedule(schedule.start_time, schedule.end_time, schedule.break_start, schedule.break_end, schedule.slot_duration || 30);
            const scheduleWithAppointments = timeSlots.map(slot => {
                const appointment = appointments?.find(apt => apt.start_time === slot.time);
                return {
                    time: slot.time,
                    patient_name: appointment?.patients?.profiles?.full_name || 'Unknown Patient',
                    appointment_type: appointment?.appointment_type,
                    status: appointment ? appointment.status : 'available',
                    duration: schedule.slot_duration || 30,
                    reason: appointment?.reason,
                    appointment_id: appointment?.appointment_id
                };
            });
            return scheduleWithAppointments;
        }
        catch (error) {
            logger_1.default.error('Error getting today schedule', { error, doctor_id });
            throw error;
        }
    }
    generateTimeSlotsForSchedule(startTime, endTime, breakStart, breakEnd, slotDuration = 30) {
        const slots = [];
        const start = new Date(`2000-01-01T${startTime}`);
        const end = new Date(`2000-01-01T${endTime}`);
        const breakStartTime = breakStart ? new Date(`2000-01-01T${breakStart}`) : null;
        const breakEndTime = breakEnd ? new Date(`2000-01-01T${breakEnd}`) : null;
        let current = new Date(start);
        while (current < end) {
            const timeString = current.toTimeString().slice(0, 5);
            if (breakStartTime && breakEndTime) {
                if (current >= breakStartTime && current < breakEndTime) {
                    current.setMinutes(current.getMinutes() + slotDuration);
                    continue;
                }
            }
            slots.push({ time: timeString });
            current.setMinutes(current.getMinutes() + slotDuration);
        }
        return slots;
    }
}
exports.ScheduleRepository = ScheduleRepository;
//# sourceMappingURL=schedule.repository.js.map