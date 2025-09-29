import { Request, Response } from 'express';
import { getSupabase } from '../config/database.config';
import logger from '@hospital/shared/dist/utils/logger';

export class SlotManagementController {
  private supabase = getSupabase();

  /**
   * Generate appointment slots for a specific doctor
   * POST /api/doctors/:doctorId/slots/generate
   */
  async generateDoctorSlots(req: Request, res: Response): Promise<void> {
    try {
      const { doctor_id } = req.params;
      const { startDate, endDate } = req.body;

      // Validate input
      if (!startDate || !endDate) {
        res.status(400).json({
          success: false,
          error: { message: 'Ngày bắt đầu và ngày kết thúc là bắt buộc' }
        });
        return;
      }

      // Validate date range
      const start = new Date(startDate);
      const end = new Date(endDate);
      const today = new Date();
      
      if (start < today) {
        res.status(400).json({
          success: false,
          error: { message: 'Ngày bắt đầu không thể là ngày trong quá khứ' }
        });
        return;
      }

      if (end <= start) {
        res.status(400).json({
          success: false,
          error: { message: 'Ngày kết thúc phải sau ngày bắt đầu' }
        });
        return;
      }

      // Check if doctor exists
      const { data: doctor, error: doctorError } = await this.supabase
        .from('doctors')
        .select('doctor_id, full_name')
        .eq('doctor_id', doctor_id)
        .single();

      if (doctorError || !doctor) {
        res.status(404).json({
          success: false,
          error: { message: 'Không tìm thấy bác sĩ' }
        });
        return;
      }

      // Generate slots using database function
      const { data: results, error } = await this.supabase
        .rpc('generate_doctor_appointment_slots_enhanced', {
          input_doctor_id: doctor_id,
          start_date: startDate,
          end_date: endDate
        });

      if (error) {
        logger.error('Error generating slots:', error);
        res.status(500).json({
          success: false,
          error: { message: 'Lỗi khi tạo slot: ' + error.message }
        });
        return;
      }

      // Calculate summary statistics
      const totalSlots = results?.reduce((sum: number, day: any) => sum + day.slots_created, 0) || 0;
      const totalConflicts = results?.reduce((sum: number, day: any) => sum + day.conflicts_found, 0) || 0;
      const processedDays = results?.length || 0;

      res.json({
        success: true,
        message: `Đã tạo ${totalSlots} slot cho ${processedDays} ngày`,
        data: {
          doctor_id: doctor_id,
          doctor_name: doctor.full_name,
          start_date: startDate,
          end_date: endDate,
          summary: {
            total_slots_generated: totalSlots,
            total_conflicts_found: totalConflicts,
            days_processed: processedDays
          },
          daily_results: results
        }
      });

    } catch (error) {
      logger.error('Exception in generateDoctorSlots:', error);
      res.status(500).json({
        success: false,
        error: { message: 'Lỗi hệ thống khi tạo slot' }
      });
    }
  }

  /**
   * Get available slots for a doctor on a specific date
   * GET /api/doctors/:doctorId/slots/available?date=YYYY-MM-DD
   */
  async getAvailableSlots(req: Request, res: Response): Promise<void> {
    try {
      const { doctor_id } = req.params;
      const { date } = req.query;

      if (!date) {
        res.status(400).json({
          success: false,
          error: { message: 'Ngày là bắt buộc' }
        });
        return;
      }

      // Get available slots using database function
      const { data: slots, error } = await this.supabase
        .rpc('get_doctor_available_slots', {
          input_doctor_id: doctor_id,
          input_date: date
        });

      if (error) {
        logger.error('Error getting available slots:', error);
        res.status(500).json({
          success: false,
          error: { message: 'Lỗi khi lấy slot có sẵn: ' + error.message }
        });
        return;
      }

      res.json({
        success: true,
        data: {
          doctor_id: doctor_id,
          date: date,
          available_slots: slots || [],
          total_available: slots?.length || 0
        }
      });

    } catch (error) {
      logger.error('Exception in getAvailableSlots:', error);
      res.status(500).json({
        success: false,
        error: { message: 'Lỗi hệ thống khi lấy slot có sẵn' }
      });
    }
  }

  /**
   * Get doctor's weekly availability with department rules
   * GET /api/doctors/:doctorId/availability/weekly?startDate=YYYY-MM-DD
   */
  async getWeeklyAvailability(req: Request, res: Response): Promise<void> {
    try {
      const { doctor_id } = req.params;
      const { startDate } = req.query;

      const weekStart = startDate ? new Date(startDate as string) : new Date();
      
      // Ensure we start from Monday
      const dayOfWeek = weekStart.getDay();
      const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
      weekStart.setDate(weekStart.getDate() + mondayOffset);

      const weekStartStr = weekStart.toISOString().split('T')[0];

      // Get weekly availability using database function
      const { data: availability, error } = await this.supabase
        .rpc('get_doctor_weekly_availability', {
          input_doctor_id: doctor_id,
          week_start_date: weekStartStr
        });

      if (error) {
        logger.error('Error getting weekly availability:', error);
        res.status(500).json({
          success: false,
          error: { message: 'Lỗi khi lấy lịch tuần: ' + error.message }
        });
        return;
      }

      res.json({
        success: true,
        data: {
          doctor_id: doctor_id,
          week_start: weekStartStr,
          week_end: new Date(weekStart.getTime() + 6 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          weekly_schedule: availability || []
        }
      });

    } catch (error) {
      logger.error('Exception in getWeeklyAvailability:', error);
      res.status(500).json({
        success: false,
        error: { message: 'Lỗi hệ thống khi lấy lịch tuần' }
      });
    }
  }

  /**
   * Bulk generate slots for multiple doctors
   * POST /api/doctors/slots/bulk-generate
   */
  async bulkGenerateSlots(req: Request, res: Response): Promise<void> {
    try {
      const { departmentId, daysAhead = 30 } = req.body;

      // Validate input
      if (daysAhead < 1 || daysAhead > 90) {
        res.status(400).json({
          success: false,
          error: { message: 'Số ngày phải từ 1 đến 90' }
        });
        return;
      }

      // Generate slots using database function
      const { data: results, error } = await this.supabase
        .rpc('generate_bulk_appointment_slots', {
          department_filter: departmentId || null,
          days_ahead: daysAhead
        });

      if (error) {
        logger.error('Error in bulk slot generation:', error);
        res.status(500).json({
          success: false,
          error: { message: 'Lỗi khi tạo slot hàng loạt: ' + error.message }
        });
        return;
      }

      // Calculate summary
      const totalDoctors = results?.length || 0;
      const totalSlots = results?.reduce((sum: number, doctor: any) => sum + doctor.total_slots_generated, 0) || 0;
      const successfulDoctors = results?.filter((doctor: any) => doctor.total_slots_generated > 0).length || 0;

      res.json({
        success: true,
        message: `Đã tạo ${totalSlots} slot cho ${successfulDoctors}/${totalDoctors} bác sĩ`,
        data: {
          department_id: departmentId,
          days_ahead: daysAhead,
          summary: {
            total_doctors_processed: totalDoctors,
            successful_doctors: successfulDoctors,
            total_slots_generated: totalSlots
          },
          doctor_results: results
        }
      });

    } catch (error) {
      logger.error('Exception in bulkGenerateSlots:', error);
      res.status(500).json({
        success: false,
        error: { message: 'Lỗi hệ thống khi tạo slot hàng loạt' }
      });
    }
  }

  /**
   * Check doctor availability for specific time
   * GET /api/doctors/:doctorId/availability/check?date=YYYY-MM-DD&time=HH:MM&duration=30
   */
  async checkAvailability(req: Request, res: Response): Promise<void> {
    try {
      const { doctor_id } = req.params;
      const { date, time, duration = 30 } = req.query;

      if (!date || !time) {
        res.status(400).json({
          success: false,
          error: { message: 'Ngày và giờ là bắt buộc' }
        });
        return;
      }

      // Check availability using database function
      const { data: isAvailable, error } = await this.supabase
        .rpc('check_doctor_availability', {
          input_doctor_id: doctor_id,
          input_date: date,
          input_start_time: time,
          input_duration: parseInt(duration as string)
        });

      if (error) {
        logger.error('Error checking availability:', error);
        res.status(500).json({
          success: false,
          error: { message: 'Lỗi khi kiểm tra tình trạng có sẵn: ' + error.message }
        });
        return;
      }

      res.json({
        success: true,
        data: {
          doctor_id: doctor_id,
          date: date,
          time: time,
          duration: duration,
          is_available: isAvailable
        }
      });

    } catch (error) {
      logger.error('Exception in checkAvailability:', error);
      res.status(500).json({
        success: false,
        error: { message: 'Lỗi hệ thống khi kiểm tra tình trạng có sẵn' }
      });
    }
  }
}
