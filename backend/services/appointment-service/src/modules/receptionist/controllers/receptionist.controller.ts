// Receptionist Controller
// Hospital Management System - Phase 2B Implementation

import { Request, Response } from 'express';
import logger from '@hospital/shared/dist/utils/logger';
import { ReceptionistRepository } from '../repositories/receptionist.repository';
import {
  ReceptionistError,
  ShiftSchedule
} from '../types/receptionist.types';

export class ReceptionistController {
  private receptionistRepository: ReceptionistRepository;

  constructor() {
    this.receptionistRepository = new ReceptionistRepository();
  }

  // =====================================================
  // RECEPTIONIST PROFILE MANAGEMENT
  // =====================================================

  /**
   * Get current receptionist profile
   * GET /api/receptionists/profile
   */
  getMyProfile = async (req: Request, res: Response): Promise<void> => {
    try {
      // Authorization check
      if (!req.user || req.user.role !== 'receptionist') {
        res.status(403).json({
          success: false,
          error: { message: 'Chỉ lễ tân mới có thể xem profile của mình' }
        });
        return;
      }

      const receptionist = await this.receptionistRepository.findByProfileId(req.user.id);

      if (!receptionist) {
        res.status(404).json({
          success: false,
          error: { message: 'Không tìm thấy thông tin lễ tân' }
        });
        return;
      }

      res.json({
        success: true,
        data: receptionist
      });
    } catch (error) {
      logger.error('Error in getMyProfile:', error);
      res.status(500).json({
        success: false,
        error: { message: 'Lỗi server khi lấy thông tin profile' }
      });
    }
  };

  /**
   * Get receptionist profile by ID
   * GET /api/receptionists/:receptionistId
   */
  getProfile = async (req: Request, res: Response): Promise<void> => {
    try {
      // Authorization check
      if (!req.user || !['receptionist', 'admin'].includes(req.user.role)) {
        res.status(403).json({
          success: false,
          error: { message: 'Không có quyền xem thông tin lễ tân' }
        });
        return;
      }

      const { receptionistId } = req.params;

      if (!receptionistId) {
        res.status(400).json({
          success: false,
          error: { message: 'Mã lễ tân là bắt buộc' }
        });
        return;
      }

      const receptionist = await this.receptionistRepository.findById(receptionistId);

      if (!receptionist) {
        res.status(404).json({
          success: false,
          error: { message: 'Không tìm thấy lễ tân' }
        });
        return;
      }

      res.json({
        success: true,
        data: receptionist
      });
    } catch (error) {
      logger.error('Error in getProfile:', error);
      res.status(500).json({
        success: false,
        error: { message: 'Lỗi server khi lấy thông tin lễ tân' }
      });
    }
  };

  /**
   * Update shift schedule
   * PUT /api/receptionists/:receptionistId/schedule
   */
  updateShiftSchedule = async (req: Request, res: Response): Promise<void> => {
    try {
      // Authorization check
      if (!req.user || !['receptionist', 'admin'].includes(req.user.role)) {
        res.status(403).json({
          success: false,
          error: { message: 'Không có quyền cập nhật lịch trình' }
        });
        return;
      }

      const { receptionistId } = req.params;
      const shiftSchedule: ShiftSchedule = req.body;

      if (!receptionistId) {
        res.status(400).json({
          success: false,
          error: { message: 'Mã lễ tân là bắt buộc' }
        });
        return;
      }

      // Validate shift schedule
      if (!this.validateShiftSchedule(shiftSchedule)) {
        res.status(400).json({
          success: false,
          error: { message: 'Lịch trình ca làm việc không hợp lệ' }
        });
        return;
      }

      // Check if user can update this receptionist's schedule
      if (req.user.role === 'receptionist' && req.user.receptionist_id !== receptionistId) {
        res.status(403).json({
          success: false,
          error: { message: 'Chỉ có thể cập nhật lịch trình của chính mình' }
        });
        return;
      }

      const success = await this.receptionistRepository.updateShiftSchedule(receptionistId, shiftSchedule);

      if (!success) {
        res.status(500).json({
          success: false,
          error: { message: 'Lỗi khi cập nhật lịch trình ca làm việc' }
        });
        return;
      }

      res.json({
        success: true,
        message: 'Cập nhật lịch trình thành công'
      });
    } catch (error) {
      logger.error('Error in updateShiftSchedule:', error);
      res.status(500).json({
        success: false,
        error: { message: 'Lỗi server khi cập nhật lịch trình' }
      });
    }
  };

  /**
   * Get dashboard statistics
   * GET /api/receptionists/dashboard/stats
   */
  getDashboardStats = async (req: Request, res: Response): Promise<void> => {
    try {
      // Authorization check
      if (!req.user || !['receptionist', 'admin'].includes(req.user.role)) {
        res.status(403).json({
          success: false,
          error: { message: 'Không có quyền truy cập thống kê' }
        });
        return;
      }

      const stats = await this.receptionistRepository.getDashboardStats();

      if (!stats) {
        res.status(500).json({
          success: false,
          error: { message: 'Lỗi khi lấy thống kê dashboard' }
        });
        return;
      }

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      logger.error('Error in getDashboardStats:', error);
      res.status(500).json({
        success: false,
        error: { message: 'Lỗi server khi lấy thống kê' }
      });
    }
  };

  /**
   * Get receptionist performance metrics
   * GET /api/receptionists/:receptionistId/performance
   */
  getPerformanceMetrics = async (req: Request, res: Response): Promise<void> => {
    try {
      // Authorization check
      if (!req.user || !['receptionist', 'admin'].includes(req.user.role)) {
        res.status(403).json({
          success: false,
          error: { message: 'Không có quyền xem thống kê hiệu suất' }
        });
        return;
      }

      const { receptionistId } = req.params;
      const { period = 'week', startDate, endDate } = req.query;

      // Check if user can view this receptionist's performance
      if (req.user.role === 'receptionist' && req.user.receptionist_id !== receptionistId) {
        res.status(403).json({
          success: false,
          error: { message: 'Chỉ có thể xem hiệu suất của chính mình' }
        });
        return;
      }

      // Mock performance metrics - would be implemented in repository
      const performanceMetrics = {
        period,
        receptionist_id: receptionistId,
        metrics: {
          total_patients_served: 156,
          average_check_in_time: 2.3, // minutes
          patient_satisfaction_score: 8.7,
          efficiency_rating: 92.5,
          error_rate: 1.2, // percentage
          on_time_performance: 96.8, // percentage
          queue_management_score: 89.3
        },
        trends: {
          patients_served_trend: 'increasing',
          satisfaction_trend: 'stable',
          efficiency_trend: 'improving'
        },
        achievements: [
          'Highest patient satisfaction this month',
          'Zero errors in check-in process for 5 days',
          'Improved queue management efficiency by 15%'
        ]
      };

      res.json({
        success: true,
        data: performanceMetrics
      });
    } catch (error) {
      logger.error('Error in getPerformanceMetrics:', error);
      res.status(500).json({
        success: false,
        error: { message: 'Lỗi server khi lấy thống kê hiệu suất' }
      });
    }
  };

  /**
   * Get receptionist work schedule
   * GET /api/receptionists/:receptionistId/schedule
   */
  getWorkSchedule = async (req: Request, res: Response): Promise<void> => {
    try {
      // Authorization check
      if (!req.user || !['receptionist', 'admin'].includes(req.user.role)) {
        res.status(403).json({
          success: false,
          error: { message: 'Không có quyền xem lịch trình làm việc' }
        });
        return;
      }

      const { receptionistId } = req.params;
      const { week, month } = req.query;

      const receptionist = await this.receptionistRepository.findById(receptionistId);

      if (!receptionist) {
        res.status(404).json({
          success: false,
          error: { message: 'Không tìm thấy lễ tân' }
        });
        return;
      }

      // Return current shift schedule
      res.json({
        success: true,
        data: {
          receptionist_id: receptionistId,
          shift_schedule: receptionist.shift_schedule,
          current_week: week || this.getCurrentWeek(),
          current_month: month || this.getCurrentMonth()
        }
      });
    } catch (error) {
      logger.error('Error in getWorkSchedule:', error);
      res.status(500).json({
        success: false,
        error: { message: 'Lỗi server khi lấy lịch trình làm việc' }
      });
    }
  };

  /**
   * Update receptionist status
   * PUT /api/receptionists/:receptionistId/status
   */
  updateStatus = async (req: Request, res: Response): Promise<void> => {
    try {
      // Authorization check - only admin can update status
      if (!req.user || req.user.role !== 'admin') {
        res.status(403).json({
          success: false,
          error: { message: 'Chỉ admin mới có thể cập nhật trạng thái lễ tân' }
        });
        return;
      }

      const { receptionistId } = req.params;
      const { status, reason } = req.body;

      if (!receptionistId || !status) {
        res.status(400).json({
          success: false,
          error: { message: 'Mã lễ tân và trạng thái là bắt buộc' }
        });
        return;
      }

      // Validate status
      const validStatuses = ['active', 'inactive', 'on_leave'];
      if (!validStatuses.includes(status)) {
        res.status(400).json({
          success: false,
          error: { message: 'Trạng thái không hợp lệ' }
        });
        return;
      }

      // This would be implemented in the repository
      // For now, return success response
      res.json({
        success: true,
        message: 'Cập nhật trạng thái thành công',
        data: {
          receptionist_id: receptionistId,
          new_status: status,
          reason: reason || null,
          updated_at: new Date().toISOString()
        }
      });
    } catch (error) {
      logger.error('Error in updateStatus:', error);
      res.status(500).json({
        success: false,
        error: { message: 'Lỗi server khi cập nhật trạng thái' }
      });
    }
  };

  // =====================================================
  // HELPER METHODS
  // =====================================================

  private validateShiftSchedule(schedule: ShiftSchedule): boolean {
    try {
      // Basic validation for shift schedule
      const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
      
      for (const day of days) {
        const shift = schedule[day as keyof ShiftSchedule];
        if (shift && typeof shift === 'object' && 'start_time' in shift && 'end_time' in shift) {
          // Validate time format (HH:MM)
          const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
          if (!timeRegex.test(shift.start_time) || !timeRegex.test(shift.end_time)) {
            return false;
          }
          
          // Validate that end time is after start time
          const startMinutes = this.timeToMinutes(shift.start_time);
          const endMinutes = this.timeToMinutes(shift.end_time);
          if (endMinutes <= startMinutes) {
            return false;
          }
        }
      }
      
      return true;
    } catch (error) {
      logger.error('Error validating shift schedule:', error);
      return false;
    }
  }

  private timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }

  private getCurrentWeek(): string {
    const now = new Date();
    const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
    return startOfWeek.toISOString().split('T')[0];
  }

  private getCurrentMonth(): string {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  }
}
