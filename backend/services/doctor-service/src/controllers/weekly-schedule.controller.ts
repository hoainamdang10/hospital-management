import { Request, Response } from 'express';
import { supabaseAdmin } from '../config/database.config';
import logger from '@hospital/shared/dist/utils/logger';

interface TimeSlot {
  start_time: string;
  end_time: string;
  status: 'available' | 'booked' | 'break' | 'unavailable';
  appointment_id?: string;
  patient_name?: string;
  appointment_type?: string;
}

interface DailySchedule {
  date: string;
  day_of_week: number;
  day_name: string;
  is_working_day: boolean;
  
  // Schedule details
  start_time?: string;
  end_time?: string;
  break_start?: string;
  break_end?: string;
  
  // Availability
  total_slots: number;
  booked_slots: number;
  available_slots: number;
  
  // Time slots detail
  time_slots: TimeSlot[];
}

interface WeeklyScheduleResponse {
  week_start: string;
  week_end: string;
  doctor_id: string;
  doctor_name?: string;
  daily_schedules: DailySchedule[];
  summary: {
    total_working_days: number;
    total_slots: number;
    total_booked: number;
    total_available: number;
    occupancy_rate: number;
  };
}

export class WeeklyScheduleController {

  /**
   * Lấy lịch tuần chi tiết với availability real-time
   * GET /api/doctors/:doctorId/schedule/weekly
   */
  async getWeeklySchedule(req: Request, res: Response): Promise<void> {
    try {
      const { doctor_id } = req.params;
      const { date } = req.query;

      logger.info('📅 [WeeklySchedule] Getting weekly schedule', {
        doctor_id,
        date
      });

      // Xác định tuần cần lấy
      const targetDate = date ? new Date(date as string) : new Date();
      const { weekStart, weekEnd } = this.getWeekRange(targetDate);

      logger.info('📅 [WeeklySchedule] Week range calculated', {
        weekStart: weekStart.toISOString().split('T')[0],
        weekEnd: weekEnd.toISOString().split('T')[0]
      });

      // 1. Lấy thông tin bác sĩ
      const { data: doctor, error: doctorError } = await supabaseAdmin
        .from('doctors')
        .select('doctor_id, full_name')
        .eq('doctor_id', doctor_id)
        .single();

      if (doctorError || !doctor) {
        logger.error('❌ [WeeklySchedule] Doctor not found:', doctorError);
        res.status(404).json({
          success: false,
          error: { message: 'Không tìm thấy bác sĩ' }
        });
        return;
      }

      // 2. Lấy lịch làm việc cơ bản của bác sĩ
      const { data: schedules, error: scheduleError } = await supabaseAdmin
        .from('doctor_schedules')
        .select('*')
        .eq('doctor_id', doctor_id)
        .eq('is_available', true)
        .order('day_of_week');

      if (scheduleError) {
        logger.error('❌ [WeeklySchedule] Error getting schedules:', scheduleError);
        res.status(500).json({
          success: false,
          error: { message: 'Lỗi khi lấy lịch làm việc' }
        });
        return;
      }

      // 3. Lấy appointments trong tuần
      const { data: appointments, error: appointmentError } = await supabaseAdmin
        .from('appointments')
        .select(`
          appointment_id,
          appointment_date,
          start_time,
          end_time,
          status,
          appointment_type,
          patients!inner(
            patient_id,
            profiles!inner(full_name)
          )
        `)
        .eq('doctor_id', doctor_id)
        .gte('appointment_date', weekStart.toISOString().split('T')[0])
        .lte('appointment_date', weekEnd.toISOString().split('T')[0])
        .in('status', ['scheduled', 'confirmed', 'in_progress']);

      if (appointmentError) {
        logger.error('❌ [WeeklySchedule] Error getting appointments:', appointmentError);
      }

      // 4. Tạo daily schedules cho từng ngày trong tuần
      const dailySchedules: DailySchedule[] = [];
      let totalWorkingDays = 0;
      let totalSlots = 0;
      let totalBooked = 0;

      for (let i = 0; i < 7; i++) {
        const currentDate = new Date(weekStart);
        currentDate.setDate(weekStart.getDate() + i);
        
        const dayOfWeek = currentDate.getDay() === 0 ? 7 : currentDate.getDay(); // Convert Sunday from 0 to 7
        const dateStr = currentDate.toISOString().split('T')[0];
        
        // Tìm schedule cho ngày này
        const daySchedule = schedules?.find(s => s.day_of_week === dayOfWeek);
        
        if (daySchedule) {
          totalWorkingDays++;
          
          // Tạo time slots cho ngày này
          const timeSlots = this.generateTimeSlots(
            daySchedule,
            appointments?.filter(a => a.appointment_date === dateStr) || []
          );
          
          const bookedSlots = timeSlots.filter(slot => slot.status === 'booked').length;
          const availableSlots = timeSlots.filter(slot => slot.status === 'available').length;
          
          totalSlots += timeSlots.length;
          totalBooked += bookedSlots;

          dailySchedules.push({
            date: dateStr,
            day_of_week: dayOfWeek,
            day_name: this.getDayNameInVietnamese(currentDate),
            is_working_day: true,
            start_time: daySchedule.start_time,
            end_time: daySchedule.end_time,
            break_start: daySchedule.break_start,
            break_end: daySchedule.break_end,
            total_slots: timeSlots.length,
            booked_slots: bookedSlots,
            available_slots: availableSlots,
            time_slots: timeSlots
          });
        } else {
          // Ngày không làm việc
          dailySchedules.push({
            date: dateStr,
            day_of_week: dayOfWeek,
            day_name: this.getDayNameInVietnamese(currentDate),
            is_working_day: false,
            total_slots: 0,
            booked_slots: 0,
            available_slots: 0,
            time_slots: []
          });
        }
      }

      const response: WeeklyScheduleResponse = {
        week_start: weekStart.toISOString().split('T')[0],
        week_end: weekEnd.toISOString().split('T')[0],
        doctor_id: doctor_id,
        doctor_name: doctor.full_name,
        daily_schedules: dailySchedules,
        summary: {
          total_working_days: totalWorkingDays,
          total_slots: totalSlots,
          total_booked: totalBooked,
          total_available: totalSlots - totalBooked,
          occupancy_rate: totalSlots > 0 ? Math.round((totalBooked / totalSlots) * 100 * 100) / 100 : 0
        }
      };

      logger.info('✅ [WeeklySchedule] Successfully generated weekly schedule', {
        doctor_id,
        weekStart: response.week_start,
        weekEnd: response.week_end,
        workingDays: totalWorkingDays,
        totalSlots,
        occupancyRate: response.summary.occupancy_rate
      });

      res.json({
        success: true,
        data: response
      });

    } catch (error) {
      logger.error('💥 [WeeklySchedule] Unexpected error:', error);
      res.status(500).json({
        success: false,
        error: { message: 'Lỗi server khi lấy lịch tuần' }
      });
    }
  }

  /**
   * Tính toán khoảng thời gian tuần (Thứ Hai đến Chủ Nhật)
   */
  private getWeekRange(date: Date): { weekStart: Date; weekEnd: Date } {
    const weekStart = new Date(date);
    const day = weekStart.getDay();
    const diff = weekStart.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
    weekStart.setDate(diff);
    weekStart.setHours(0, 0, 0, 0);

    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);

    return { weekStart, weekEnd };
  }

  /**
   * Tạo time slots cho một ngày dựa trên schedule và appointments
   */
  private generateTimeSlots(schedule: any, appointments: any[]): TimeSlot[] {
    const slots: TimeSlot[] = [];
    const slotDuration = schedule.slot_duration || 30; // minutes
    
    const startTime = this.parseTime(schedule.start_time);
    const endTime = this.parseTime(schedule.end_time);
    const breakStart = schedule.break_start ? this.parseTime(schedule.break_start) : null;
    const breakEnd = schedule.break_end ? this.parseTime(schedule.break_end) : null;

    let currentTime = startTime;

    while (currentTime < endTime) {
      const slotEnd = currentTime + slotDuration;
      const slotStartStr = this.formatTime(currentTime);
      const slotEndStr = this.formatTime(slotEnd);

      // Kiểm tra xem slot này có phải là break time không
      let isBreakTime = false;
      if (breakStart && breakEnd) {
        isBreakTime = currentTime >= breakStart && currentTime < breakEnd;
      }

      // Tìm appointment cho slot này
      const appointment = appointments.find(apt => {
        const aptStart = this.parseTime(apt.start_time);
        return aptStart === currentTime;
      });

      let status: TimeSlot['status'] = 'available';
      let appointment_id: string | undefined;
      let patientName: string | undefined;
      let appointmentType: string | undefined;

      if (isBreakTime) {
        status = 'break';
      } else if (appointment) {
        status = 'booked';
        appointment_id = appointment.appointment_id;
        patientName = appointment.patients?.profiles?.full_name;
        appointmentType = appointment.appointment_type;
      }

      slots.push({
        start_time: slotStartStr,
        end_time: slotEndStr,
        status,
        appointment_id: appointment_id,
        patient_name: patientName,
        appointment_type: appointmentType
      });

      currentTime = slotEnd;
    }

    return slots;
  }

  /**
   * Parse time string (HH:MM:SS) to minutes from midnight
   */
  private parseTime(timeStr: string): number {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
  }

  /**
   * Format minutes from midnight to time string (HH:MM)
   */
  private formatTime(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  }

  /**
   * Chuyển đổi tên ngày sang tiếng Việt
   */
  private getDayNameInVietnamese(date: Date): string {
    const days = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
    return days[date.getDay()];
  }
}
