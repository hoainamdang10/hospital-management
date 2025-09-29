import { SupabaseClient } from '@supabase/supabase-js';
import {
  DoctorSchedule,
  CreateScheduleRequest,
  UpdateScheduleRequest
} from '@hospital/shared/dist/types/doctor.types';
import { getSupabase } from '../config/database.config';
import logger from '@hospital/shared/dist/utils/logger';

export class ScheduleRepository {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = getSupabase();
  }

  async findByDoctorId(doctor_id: string): Promise<DoctorSchedule[]> {
    try {
      const { data, error } = await this.supabase
        .from('doctor_schedules')
        .select('*')
        .eq('doctor_id', doctor_id)
        .order('day_of_week');

      if (error) throw error;

      return data?.map(this.mapSupabaseScheduleToSchedule) || [];
    } catch (error) {
      logger.error('Error finding schedules by doctor ID', { error, doctor_id });
      throw error;
    }
  }

  async findByDoctorAndDay(doctor_id: string, dayOfWeek: number): Promise<DoctorSchedule | null> {
    try {
      const { data, error } = await this.supabase
        .from('doctor_schedules')
        .select('*')
        .eq('doctor_id', doctor_id)
        .eq('day_of_week', dayOfWeek)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null;
        throw error;
      }

      return this.mapSupabaseScheduleToSchedule(data);
    } catch (error) {
      logger.error('Error finding schedule by doctor and day', { error, doctor_id, dayOfWeek });
      throw error;
    }
  }

  async create(scheduleData: CreateScheduleRequest): Promise<DoctorSchedule> {
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

      if (error) throw error;

      return this.mapSupabaseScheduleToSchedule(data);
    } catch (error) {
      logger.error('Error creating schedule', { error, scheduleData });
      throw error;
    }
  }

  async update(scheduleId: string, scheduleData: UpdateScheduleRequest): Promise<DoctorSchedule | null> {
    try {
      const { data, error } = await this.supabase
        .from('doctor_schedules')
        .update(scheduleData)
        .eq('schedule_id', scheduleId)
        .select()
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null;
        throw error;
      }

      return this.mapSupabaseScheduleToSchedule(data);
    } catch (error) {
      logger.error('Error updating schedule', { error, scheduleId, scheduleData });
      throw error;
    }
  }

  async delete(scheduleId: string): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('doctor_schedules')
        .delete()
        .eq('schedule_id', scheduleId);

      if (error) throw error;

      return true;
    } catch (error) {
      logger.error('Error deleting schedule', { error, scheduleId });
      throw error;
    }
  }

  async upsertSchedule(doctor_id: string, dayOfWeek: number, scheduleData: UpdateScheduleRequest): Promise<DoctorSchedule> {
    try {
      // Check if schedule exists
      const existingSchedule = await this.findByDoctorAndDay(doctor_id, dayOfWeek);

      if (existingSchedule) {
        // Update existing schedule
        const updated = await this.update(existingSchedule.schedule_id, scheduleData);
        if (!updated) throw new Error('Failed to update schedule');
        return updated;
      } else {
        // Create new schedule
        const createData: CreateScheduleRequest = {
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
    } catch (error) {
      logger.error('Error upserting schedule', { error, doctor_id, dayOfWeek, scheduleData });
      throw error;
    }
  }

  async getAvailability(doctor_id: string, date: Date): Promise<DoctorSchedule | null> {
    try {
      const dayOfWeek = date.getDay(); // 0=Sunday, 6=Saturday

      const { data, error } = await this.supabase
        .rpc('get_doctor_availability', {
          doctor_id_param: doctor_id,
          check_date: date.toISOString().split('T')[0]
        });

      if (error) throw error;

      if (!data || data.length === 0) return null;

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
    } catch (error) {
      logger.error('Error getting doctor availability', { error, doctor_id, date });
      throw error;
    }
  }

  async getWeeklySchedule(doctor_id: string): Promise<DoctorSchedule[]> {
    try {
      const schedules = await this.findByDoctorId(doctor_id);
      
      // Ensure we have all 7 days (0-6)
      const weeklySchedule: DoctorSchedule[] = [];
      
      for (let day = 0; day <= 6; day++) {
        const existingSchedule = schedules.find(s => s.day_of_week === day);
        
        if (existingSchedule) {
          weeklySchedule.push(existingSchedule);
        } else {
          // Create default unavailable schedule for missing days
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
    } catch (error) {
      logger.error('Error getting weekly schedule', { error, doctor_id });
      throw error;
    }
  }

  async bulkUpdateSchedule(doctor_id: string, schedules: UpdateScheduleRequest[]): Promise<DoctorSchedule[]> {
    try {
      const updatedSchedules: DoctorSchedule[] = [];

      for (let i = 0; i < schedules.length; i++) {
        const scheduleData = schedules[i];
        const dayOfWeek = scheduleData.day_of_week ?? i;
        
        const updated = await this.upsertSchedule(doctor_id, dayOfWeek, scheduleData);
        updatedSchedules.push(updated);
      }

      return updatedSchedules;
    } catch (error) {
      logger.error('Error bulk updating schedule', { error, doctor_id, schedules });
      throw error;
    }
  }

  async getAvailableTimeSlots(doctor_id: string, date: Date): Promise<string[]> {
    try {
      const availability = await this.getAvailability(doctor_id, date);
      
      if (!availability || !availability.is_available) {
        return [];
      }

      const slots: string[] = [];
      const startTime = this.timeStringToMinutes(availability.start_time);
      const endTime = this.timeStringToMinutes(availability.end_time);
      const slotDuration = availability.slot_duration || 30;
      
      let breakStart: number | null = null;
      let breakEnd: number | null = null;
      
      if (availability.break_start && availability.break_end) {
        breakStart = this.timeStringToMinutes(availability.break_start);
        breakEnd = this.timeStringToMinutes(availability.break_end);
      }

      for (let time = startTime; time < endTime; time += slotDuration) {
        // Skip break time
        if (breakStart && breakEnd && time >= breakStart && time < breakEnd) {
          continue;
        }

        slots.push(this.minutesToTimeString(time));
      }

      return slots;
    } catch (error) {
      logger.error('Error getting available time slots', { error, doctor_id, date });
      throw error;
    }
  }

  private timeStringToMinutes(timeString: string): number {
    const [hours, minutes] = timeString.split(':').map(Number);
    return hours * 60 + minutes;
  }

  private minutesToTimeString(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  }

  private mapSupabaseScheduleToSchedule(supabaseSchedule: any): DoctorSchedule {
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

  async getTodaySchedule(doctor_id: string): Promise<any[]> {
    try {
      const today = new Date();
      const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
      const todayDate = today.toISOString().split('T')[0];

      // Get doctor's schedule for today
      const schedule = await this.findByDoctorAndDay(doctor_id, dayOfWeek);

      if (!schedule || !schedule.is_available) {
        return []; // Doctor not available today
      }

      // Get appointments for today
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
        logger.error('Error fetching today appointments:', appointmentError);
        throw appointmentError;
      }

      // Generate time slots based on schedule
      const timeSlots = this.generateTimeSlotsForSchedule(
        schedule.start_time,
        schedule.end_time,
        schedule.break_start,
        schedule.break_end,
        schedule.slot_duration || 30
      );

      // Map appointments to time slots
      const scheduleWithAppointments = timeSlots.map(slot => {
        const appointment = appointments?.find(apt =>
          apt.start_time === slot.time
        );

        return {
          time: slot.time,
          patient_name: (appointment?.patients as any)?.profiles?.full_name || 'Unknown Patient',
          appointment_type: appointment?.appointment_type,
          status: appointment ? appointment.status : 'available',
          duration: schedule.slot_duration || 30,
          reason: appointment?.reason,
          appointment_id: appointment?.appointment_id
        };
      });

      return scheduleWithAppointments;

    } catch (error) {
      logger.error('Error getting today schedule', { error, doctor_id });
      throw error;
    }
  }

  private generateTimeSlotsForSchedule(
    startTime: string,
    endTime: string,
    breakStart?: string,
    breakEnd?: string,
    slotDuration: number = 30
  ): { time: string }[] {
    const slots: { time: string }[] = [];

    const start = new Date(`2000-01-01T${startTime}`);
    const end = new Date(`2000-01-01T${endTime}`);
    const breakStartTime = breakStart ? new Date(`2000-01-01T${breakStart}`) : null;
    const breakEndTime = breakEnd ? new Date(`2000-01-01T${breakEnd}`) : null;

    let current = new Date(start);

    while (current < end) {
      const timeString = current.toTimeString().slice(0, 5);

      // Skip break time
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
