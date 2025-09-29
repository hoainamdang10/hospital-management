import { Request, Response } from 'express';
import { supabaseAdmin } from '../config/database.config';
import logger from '@hospital/shared/dist/utils/logger';

export class ReportsController {
  // Get daily activity report
  getDailyReport = async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.user || !['receptionist', 'admin'].includes(req.user.role)) {
        res.status(403).json({
          success: false,
          error: { message: 'Không có quyền xem báo cáo' }
        });
        return;
      }

      const { date } = req.query;
      const reportDate = date ? String(date) : new Date().toISOString().split('T')[0];

      // Get appointments for the day
      const { data: appointments, error: appointmentsError } = await supabaseAdmin
        .from('appointments')
        .select(`
          appointment_id,
          status,
          appointment_time,
          appointment_type,
          doctors:doctor_id (
            profiles:profile_id (
              full_name
            ),
            specialty
          )
        `)
        .eq('appointment_date', reportDate);

      // Get check-ins for the day
      const { data: checkIns, error: checkInsError } = await supabaseAdmin
        .from('patient_check_ins')
        .select('*')
        .gte('check_in_time', `${reportDate}T00:00:00`)
        .lt('check_in_time', `${reportDate}T23:59:59`);

      if (appointmentsError || checkInsError) {
        logger.error('Error getting daily report data:', { appointmentsError, checkInsError });
        res.status(500).json({
          success: false,
          error: { message: 'Lỗi khi lấy dữ liệu báo cáo hàng ngày' }
        });
        return;
      }

      // Calculate statistics
      const stats = {
        totalAppointments: appointments?.length || 0,
        completedAppointments: appointments?.filter(a => a.status === 'completed').length || 0,
        cancelledAppointments: appointments?.filter(a => a.status === 'cancelled').length || 0,
        noShowAppointments: appointments?.filter(a => a.status === 'no_show').length || 0,
        totalCheckIns: checkIns?.length || 0,
        averageWaitTime: 15, // Mock calculation
        busyHours: this.calculateBusyHours(appointments || []),
        departmentStats: this.calculateDepartmentStats(appointments || [])
      };

      res.json({
        success: true,
        data: {
          date: reportDate,
          statistics: stats,
          appointments: appointments || [],
          checkIns: checkIns || []
        }
      });
    } catch (error) {
      logger.error('Error in getDailyReport:', error);
      res.status(500).json({
        success: false,
        error: { message: 'Lỗi server khi tạo báo cáo hàng ngày' }
      });
    }
  };

  // Get weekly summary report
  getWeeklyReport = async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.user || !['receptionist', 'admin'].includes(req.user.role)) {
        res.status(403).json({
          success: false,
          error: { message: 'Không có quyền xem báo cáo' }
        });
        return;
      }

      const { startDate, endDate } = req.query;
      
      if (!startDate || !endDate) {
        res.status(400).json({
          success: false,
          error: { message: 'Ngày bắt đầu và ngày kết thúc là bắt buộc' }
        });
        return;
      }

      // Get appointments for the week
      const { data: appointments, error: appointmentsError } = await supabaseAdmin
        .from('appointments')
        .select(`
          appointment_id,
          appointment_date,
          status,
          appointment_type,
          doctors:doctor_id (
            profiles:profile_id (
              full_name
            ),
            specialty
          )
        `)
        .gte('appointment_date', startDate)
        .lte('appointment_date', endDate);

      // Get check-ins for the week
      const { data: checkIns, error: checkInsError } = await supabaseAdmin
        .from('patient_check_ins')
        .select('check_in_time, status')
        .gte('check_in_time', `${startDate}T00:00:00`)
        .lt('check_in_time', `${endDate}T23:59:59`);

      if (appointmentsError || checkInsError) {
        logger.error('Error getting weekly report data:', { appointmentsError, checkInsError });
        res.status(500).json({
          success: false,
          error: { message: 'Lỗi khi lấy dữ liệu báo cáo tuần' }
        });
        return;
      }

      // Calculate daily breakdown
      const dailyBreakdown = this.calculateDailyBreakdown(appointments || [], String(startDate), String(endDate));

      const weeklyStats = {
        totalAppointments: appointments?.length || 0,
        completedAppointments: appointments?.filter(a => a.status === 'completed').length || 0,
        cancelledAppointments: appointments?.filter(a => a.status === 'cancelled').length || 0,
        totalCheckIns: checkIns?.length || 0,
        dailyBreakdown,
        specialtyStats: this.calculateSpecialtyStats(appointments || [])
      };

      res.json({
        success: true,
        data: {
          period: { startDate, endDate },
          statistics: weeklyStats
        }
      });
    } catch (error) {
      logger.error('Error in getWeeklyReport:', error);
      res.status(500).json({
        success: false,
        error: { message: 'Lỗi server khi tạo báo cáo tuần' }
      });
    }
  };

  // Get patient flow report
  getPatientFlowReport = async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.user || !['receptionist', 'admin'].includes(req.user.role)) {
        res.status(403).json({
          success: false,
          error: { message: 'Không có quyền xem báo cáo luồng bệnh nhân' }
        });
        return;
      }

      const { date } = req.query;
      const reportDate = date ? String(date) : new Date().toISOString().split('T')[0];

      // Get hourly patient flow
      const { data: checkIns, error } = await supabaseAdmin
        .from('patient_check_ins')
        .select('check_in_time')
        .gte('check_in_time', `${reportDate}T00:00:00`)
        .lt('check_in_time', `${reportDate}T23:59:59`)
        .order('check_in_time', { ascending: true });

      if (error) {
        logger.error('Error getting patient flow data:', error);
        res.status(500).json({
          success: false,
          error: { message: 'Lỗi khi lấy dữ liệu luồng bệnh nhân' }
        });
        return;
      }

      // Calculate hourly distribution
      const hourlyFlow = this.calculateHourlyFlow(checkIns || []);

      res.json({
        success: true,
        data: {
          date: reportDate,
          hourlyFlow,
          peakHours: this.findPeakHours(hourlyFlow),
          totalPatients: checkIns?.length || 0
        }
      });
    } catch (error) {
      logger.error('Error in getPatientFlowReport:', error);
      res.status(500).json({
        success: false,
        error: { message: 'Lỗi server khi tạo báo cáo luồng bệnh nhân' }
      });
    }
  };

  // Helper methods
  private calculateBusyHours(appointments: any[]): any[] {
    const hourCounts: { [key: string]: number } = {};
    
    appointments.forEach(appointment => {
      const hour = appointment.appointment_time?.split(':')[0];
      if (hour) {
        hourCounts[hour] = (hourCounts[hour] || 0) + 1;
      }
    });

    return Object.entries(hourCounts)
      .map(([hour, count]) => ({ hour: `${hour}:00`, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }

  private calculateDepartmentStats(appointments: any[]): any[] {
    const deptCounts: { [key: string]: number } = {};
    
    appointments.forEach(appointment => {
      const specialty = appointment.doctors?.specialty || 'Unknown';
      deptCounts[specialty] = (deptCounts[specialty] || 0) + 1;
    });

    return Object.entries(deptCounts)
      .map(([specialty, count]) => ({ specialty, count }))
      .sort((a, b) => b.count - a.count);
  }

  private calculateDailyBreakdown(appointments: any[], startDate: string, endDate: string): any[] {
    const dailyStats: { [key: string]: any } = {};
    
    // Initialize all days in range
    const start = new Date(startDate);
    const end = new Date(endDate);
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      dailyStats[dateStr] = { date: dateStr, total: 0, completed: 0, cancelled: 0 };
    }

    // Count appointments by day
    appointments.forEach(appointment => {
      const date = appointment.appointment_date;
      if (dailyStats[date]) {
        dailyStats[date].total++;
        if (appointment.status === 'completed') dailyStats[date].completed++;
        if (appointment.status === 'cancelled') dailyStats[date].cancelled++;
      }
    });

    return Object.values(dailyStats);
  }

  private calculateSpecialtyStats(appointments: any[]): any[] {
    return this.calculateDepartmentStats(appointments);
  }

  private calculateHourlyFlow(checkIns: any[]): any[] {
    const hourCounts: { [key: string]: number } = {};
    
    // Initialize all hours
    for (let i = 0; i < 24; i++) {
      hourCounts[i.toString().padStart(2, '0')] = 0;
    }

    checkIns.forEach(checkIn => {
      const hour = new Date(checkIn.check_in_time).getHours().toString().padStart(2, '0');
      hourCounts[hour]++;
    });

    return Object.entries(hourCounts)
      .map(([hour, count]) => ({ hour: `${hour}:00`, count }));
  }

  private findPeakHours(hourlyFlow: any[]): string[] {
    return hourlyFlow
      .sort((a, b) => b.count - a.count)
      .slice(0, 3)
      .map(item => item.hour);
  }
}
