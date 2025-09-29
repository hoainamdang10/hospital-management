import { SupabaseClient } from '@supabase/supabase-js';
import {
  DoctorShift,
  CreateShiftRequest,
  UpdateShiftRequest
} from '@hospital/shared/dist/types/doctor.types';
import { getSupabase } from '../config/database.config';
import logger from '@hospital/shared/dist/utils/logger';

export class ShiftRepository {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = getSupabase();
  }

  async findByDoctorId(doctor_id: string, limit: number = 50, offset: number = 0): Promise<DoctorShift[]> {
    try {
      const { data, error } = await this.supabase
        .from('doctor_shifts')
        .select('*')
        .eq('doctor_id', doctor_id)
        .order('shift_date', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;

      return data?.map(this.mapSupabaseShiftToShift) || [];
    } catch (error) {
      logger.error('Error finding shifts by doctor ID', { error, doctor_id });
      throw error;
    }
  }

  async findById(shiftId: string): Promise<DoctorShift | null> {
    try {
      const { data, error } = await this.supabase
        .from('doctor_shifts')
        .select('*')
        .eq('shift_id', shiftId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null;
        throw error;
      }

      return this.mapSupabaseShiftToShift(data);
    } catch (error) {
      logger.error('Error finding shift by ID', { error, shiftId });
      throw error;
    }
  }

  async findByDateRange(doctor_id: string, startDate: Date, endDate: Date): Promise<DoctorShift[]> {
    try {
      const { data, error } = await this.supabase
        .from('doctor_shifts')
        .select('*')
        .eq('doctor_id', doctor_id)
        .gte('shift_date', startDate.toISOString().split('T')[0])
        .lte('shift_date', endDate.toISOString().split('T')[0])
        .order('shift_date', { ascending: true });

      if (error) throw error;

      return data?.map(this.mapSupabaseShiftToShift) || [];
    } catch (error) {
      logger.error('Error finding shifts by date range', { error, doctor_id, startDate, endDate });
      throw error;
    }
  }

  async findByDepartment(departmentId: string, date?: Date, limit: number = 50): Promise<DoctorShift[]> {
    try {
      let query = this.supabase
        .from('doctor_shifts')
        .select('*')
        .eq('department_id', departmentId);

      if (date) {
        query = query.eq('shift_date', date.toISOString().split('T')[0]);
      }

      const { data, error } = await query
        .order('shift_date', { ascending: true })
        .limit(limit);

      if (error) throw error;

      return data?.map(this.mapSupabaseShiftToShift) || [];
    } catch (error) {
      logger.error('Error finding shifts by department', { error, departmentId, date });
      throw error;
    }
  }

  async create(shiftData: CreateShiftRequest): Promise<DoctorShift> {
    try {
      // Check for conflicts
      const conflicts = await this.checkShiftConflicts(
        shiftData.doctor_id,
        shiftData.shift_date,
        shiftData.start_time,
        shiftData.end_time
      );

      if (conflicts.length > 0) {
        throw new Error('Shift conflicts with existing schedule');
      }

      const { data, error } = await this.supabase
        .from('doctor_shifts')
        .insert([{
          doctor_id: shiftData.doctor_id,
          shift_type: shiftData.shift_type,
          shift_date: shiftData.shift_date.toISOString().split('T')[0],
          start_time: shiftData.start_time,
          end_time: shiftData.end_time,
          department_id: shiftData.department_id,
          is_emergency_shift: shiftData.is_emergency_shift || false,
          notes: shiftData.notes,
          status: 'scheduled'
        }])
        .select()
        .single();

      if (error) throw error;

      return this.mapSupabaseShiftToShift(data);
    } catch (error) {
      logger.error('Error creating shift', { error, shiftData });
      throw error;
    }
  }

  async update(shiftId: string, shiftData: UpdateShiftRequest): Promise<DoctorShift | null> {
    try {
      // If updating time/date, check for conflicts
      if (shiftData.shift_date || shiftData.start_time || shiftData.end_time) {
        const existingShift = await this.findById(shiftId);
        if (!existingShift) return null;

        const conflicts = await this.checkShiftConflicts(
          existingShift.doctor_id,
          shiftData.shift_date || existingShift.shift_date,
          shiftData.start_time || existingShift.start_time,
          shiftData.end_time || existingShift.end_time,
          shiftId // Exclude current shift from conflict check
        );

        if (conflicts.length > 0) {
          throw new Error('Shift update conflicts with existing schedule');
        }
      }

      const updateData: any = { ...shiftData };
      if (shiftData.shift_date) {
        updateData.shift_date = shiftData.shift_date.toISOString().split('T')[0];
      }

      const { data, error } = await this.supabase
        .from('doctor_shifts')
        .update(updateData)
        .eq('shift_id', shiftId)
        .select()
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null;
        throw error;
      }

      return this.mapSupabaseShiftToShift(data);
    } catch (error) {
      logger.error('Error updating shift', { error, shiftId, shiftData });
      throw error;
    }
  }

  async delete(shiftId: string): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('doctor_shifts')
        .delete()
        .eq('shift_id', shiftId);

      if (error) throw error;

      return true;
    } catch (error) {
      logger.error('Error deleting shift', { error, shiftId });
      throw error;
    }
  }

  async confirmShift(shiftId: string): Promise<DoctorShift | null> {
    try {
      return await this.update(shiftId, { status: 'confirmed' });
    } catch (error) {
      logger.error('Error confirming shift', { error, shiftId });
      throw error;
    }
  }

  async completeShift(shiftId: string, notes?: string): Promise<DoctorShift | null> {
    try {
      const updateData: UpdateShiftRequest = { status: 'completed' };
      if (notes) updateData.notes = notes;
      
      return await this.update(shiftId, updateData);
    } catch (error) {
      logger.error('Error completing shift', { error, shiftId });
      throw error;
    }
  }

  async cancelShift(shiftId: string, reason?: string): Promise<DoctorShift | null> {
    try {
      const updateData: UpdateShiftRequest = { status: 'cancelled' };
      if (reason) updateData.notes = reason;
      
      return await this.update(shiftId, updateData);
    } catch (error) {
      logger.error('Error cancelling shift', { error, shiftId });
      throw error;
    }
  }

  async getUpcomingShifts(doctor_id: string, days: number = 7): Promise<DoctorShift[]> {
    try {
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(startDate.getDate() + days);

      const { data, error } = await this.supabase
        .from('doctor_shifts')
        .select('*')
        .eq('doctor_id', doctor_id)
        .gte('shift_date', startDate.toISOString().split('T')[0])
        .lte('shift_date', endDate.toISOString().split('T')[0])
        .in('status', ['scheduled', 'confirmed'])
        .order('shift_date', { ascending: true });

      if (error) throw error;

      return data?.map(this.mapSupabaseShiftToShift) || [];
    } catch (error) {
      logger.error('Error getting upcoming shifts', { error, doctor_id, days });
      throw error;
    }
  }

  async getEmergencyShifts(departmentId?: string, date?: Date): Promise<DoctorShift[]> {
    try {
      let query = this.supabase
        .from('doctor_shifts')
        .select('*')
        .eq('is_emergency_shift', true);

      if (departmentId) {
        query = query.eq('department_id', departmentId);
      }

      if (date) {
        query = query.eq('shift_date', date.toISOString().split('T')[0]);
      }

      const { data, error } = await query
        .order('shift_date', { ascending: true });

      if (error) throw error;

      return data?.map(this.mapSupabaseShiftToShift) || [];
    } catch (error) {
      logger.error('Error getting emergency shifts', { error, departmentId, date });
      throw error;
    }
  }

  async getShiftStatistics(doctor_id: string, startDate: Date, endDate: Date): Promise<{
    total_shifts: number;
    completed_shifts: number;
    cancelled_shifts: number;
    emergency_shifts: number;
    total_hours: number;
  }> {
    try {
      const shifts = await this.findByDateRange(doctor_id, startDate, endDate);

      const stats = {
        total_shifts: shifts.length,
        completed_shifts: shifts.filter(s => s.status === 'completed').length,
        cancelled_shifts: shifts.filter(s => s.status === 'cancelled').length,
        emergency_shifts: shifts.filter(s => s.is_emergency_shift).length,
        total_hours: 0
      };

      // Calculate total hours
      stats.total_hours = shifts
        .filter(s => s.status === 'completed')
        .reduce((total, shift) => {
          const start = this.timeStringToMinutes(shift.start_time);
          const end = this.timeStringToMinutes(shift.end_time);
          return total + (end - start) / 60;
        }, 0);

      return stats;
    } catch (error) {
      logger.error('Error getting shift statistics', { error, doctor_id, startDate, endDate });
      throw error;
    }
  }

  private async checkShiftConflicts(
    doctor_id: string,
    shiftDate: Date,
    startTime: string,
    endTime: string,
    excludeShiftId?: string
  ): Promise<DoctorShift[]> {
    try {
      let query = this.supabase
        .from('doctor_shifts')
        .select('*')
        .eq('doctor_id', doctor_id)
        .eq('shift_date', shiftDate.toISOString().split('T')[0])
        .neq('status', 'cancelled');

      if (excludeShiftId) {
        query = query.neq('shift_id', excludeShiftId);
      }

      const { data, error } = await query;

      if (error) throw error;

      const shifts = data?.map(this.mapSupabaseShiftToShift) || [];

      // Check for time overlaps
      const newStart = this.timeStringToMinutes(startTime);
      const newEnd = this.timeStringToMinutes(endTime);

      return shifts.filter(shift => {
        const existingStart = this.timeStringToMinutes(shift.start_time);
        const existingEnd = this.timeStringToMinutes(shift.end_time);

        // Check if times overlap
        return (newStart < existingEnd && newEnd > existingStart);
      });
    } catch (error) {
      logger.error('Error checking shift conflicts', { error, doctor_id, shiftDate, startTime, endTime });
      throw error;
    }
  }

  private timeStringToMinutes(timeString: string): number {
    const [hours, minutes] = timeString.split(':').map(Number);
    return hours * 60 + minutes;
  }

  private mapSupabaseShiftToShift(supabaseShift: any): DoctorShift {
    return {
      shift_id: supabaseShift.shift_id,
      doctor_id: supabaseShift.doctor_id,
      shift_type: supabaseShift.shift_type,
      shift_date: new Date(supabaseShift.shift_date),
      start_time: supabaseShift.start_time,
      end_time: supabaseShift.end_time,
      department_id: supabaseShift.department_id,
      status: supabaseShift.status,
      is_emergency_shift: supabaseShift.is_emergency_shift,
      notes: supabaseShift.notes,
      created_at: new Date(supabaseShift.created_at),
      updated_at: new Date(supabaseShift.updated_at)
    };
  }
}
