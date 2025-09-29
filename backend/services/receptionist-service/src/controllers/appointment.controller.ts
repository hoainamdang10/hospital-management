import { Request, Response } from 'express';
import { supabaseAdmin } from '../config/database.config';
import logger from '@hospital/shared/dist/utils/logger';

export class AppointmentController {
  // Get today's appointments
  getTodayAppointments = async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.user || !['receptionist', 'admin'].includes(req.user.role)) {
        res.status(403).json({
          success: false,
          error: { message: 'Không có quyền xem lịch hẹn' }
        });
        return;
      }

      const today = new Date().toISOString().split('T')[0];
      const { status, doctor_id, page = 1, limit = 20 } = req.query;

      let query = supabaseAdmin
        .from('appointments')
        .select(`
          appointment_id,
          patient_id,
          doctor_id,
          appointment_date,
          appointment_time,
          status,
          appointment_type,
          notes,
          receptionist_notes,
          insurance_verified,
          patients:patient_id (
            patient_id,
            profiles:profile_id (
              full_name,
              phone_number
            )
          ),
          doctors:doctor_id (
            doctor_id,
            profiles:profile_id (
              full_name
            ),
            specialty
          ),
          patient_check_ins (
            check_in_time,
            status,
            notes
          )
        `)
        .eq('appointment_date', today)
        .order('appointment_time', { ascending: true });

      // Apply filters
      if (status) {
        query = query.eq('status', status);
      }
      if (doctor_id) {
        query = query.eq('doctor_id', doctor_id);
      }

      // Apply pagination
      const offset = (Number(page) - 1) * Number(limit);
      query = query.range(offset, offset + Number(limit) - 1);

      const { data: appointments, error } = await query;

      if (error) {
        logger.error('Error getting today appointments:', error);
        res.status(500).json({
          success: false,
          error: { message: 'Lỗi khi lấy danh sách lịch hẹn hôm nay' }
        });
        return;
      }

      res.json({
        success: true,
        data: appointments || [],
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: appointments?.length || 0
        }
      });
    } catch (error) {
      logger.error('Error in getTodayAppointments:', error);
      res.status(500).json({
        success: false,
        error: { message: 'Lỗi server khi lấy lịch hẹn' }
      });
    }
  };

  // Update appointment notes
  updateAppointmentNotes = async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.user || !['receptionist', 'admin'].includes(req.user.role)) {
        res.status(403).json({
          success: false,
          error: { message: 'Không có quyền cập nhật ghi chú lịch hẹn' }
        });
        return;
      }

      const { appointment_id } = req.params;
      const { receptionist_notes, insurance_verified } = req.body;

      if (!appointment_id) {
        res.status(400).json({
          success: false,
          error: { message: 'Mã lịch hẹn là bắt buộc' }
        });
        return;
      }

      const updateData: any = {
        updated_at: new Date().toISOString()
      };

      if (receptionist_notes !== undefined) {
        updateData.receptionist_notes = receptionist_notes;
      }
      if (insurance_verified !== undefined) {
        updateData.insurance_verified = insurance_verified;
      }

      const { error } = await supabaseAdmin
        .from('appointments')
        .update(updateData)
        .eq('appointment_id', appointment_id);

      if (error) {
        logger.error('Error updating appointment notes:', error);
        res.status(500).json({
          success: false,
          error: { message: 'Lỗi khi cập nhật ghi chú lịch hẹn' }
        });
        return;
      }

      res.json({
        success: true,
        message: 'Cập nhật ghi chú lịch hẹn thành công'
      });
    } catch (error) {
      logger.error('Error in updateAppointmentNotes:', error);
      res.status(500).json({
        success: false,
        error: { message: 'Lỗi server khi cập nhật ghi chú' }
      });
    }
  };

  // Reschedule appointment
  rescheduleAppointment = async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.user || !['receptionist', 'admin'].includes(req.user.role)) {
        res.status(403).json({
          success: false,
          error: { message: 'Không có quyền đổi lịch hẹn' }
        });
        return;
      }

      const { appointment_id } = req.params;
      const { new_date, new_time, reason } = req.body;

      if (!appointment_id || !new_date || !new_time) {
        res.status(400).json({
          success: false,
          error: { message: 'Mã lịch hẹn, ngày mới và giờ mới là bắt buộc' }
        });
        return;
      }

      // Check if new slot is available
      const { data: existingAppointment, error: checkError } = await supabaseAdmin
        .from('appointments')
        .select('doctor_id')
        .eq('appointment_date', new_date)
        .eq('appointment_time', new_time)
        .neq('appointment_id', appointment_id)
        .single();

      if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows returned
        logger.error('Error checking appointment availability:', checkError);
        res.status(500).json({
          success: false,
          error: { message: 'Lỗi khi kiểm tra tính khả dụng của lịch hẹn' }
        });
        return;
      }

      if (existingAppointment) {
        res.status(409).json({
          success: false,
          error: { message: 'Khung giờ này đã có lịch hẹn khác' }
        });
        return;
      }

      // Update appointment
      const { error: updateError } = await supabaseAdmin
        .from('appointments')
        .update({
          appointment_date: new_date,
          appointment_time: new_time,
          status: 'rescheduled',
          receptionist_notes: reason ? `Đổi lịch: ${reason}` : 'Đổi lịch bởi lễ tân',
          updated_at: new Date().toISOString()
        })
        .eq('appointment_id', appointment_id);

      if (updateError) {
        logger.error('Error rescheduling appointment:', updateError);
        res.status(500).json({
          success: false,
          error: { message: 'Lỗi khi đổi lịch hẹn' }
        });
        return;
      }

      res.json({
        success: true,
        message: 'Đổi lịch hẹn thành công'
      });
    } catch (error) {
      logger.error('Error in rescheduleAppointment:', error);
      res.status(500).json({
        success: false,
        error: { message: 'Lỗi server khi đổi lịch hẹn' }
      });
    }
  };

  // Cancel appointment
  cancelAppointment = async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.user || !['receptionist', 'admin'].includes(req.user.role)) {
        res.status(403).json({
          success: false,
          error: { message: 'Không có quyền hủy lịch hẹn' }
        });
        return;
      }

      const { appointment_id } = req.params;
      const { reason } = req.body;

      if (!appointment_id) {
        res.status(400).json({
          success: false,
          error: { message: 'Mã lịch hẹn là bắt buộc' }
        });
        return;
      }

      const { error } = await supabaseAdmin
        .from('appointments')
        .update({
          status: 'cancelled',
          receptionist_notes: reason ? `Hủy lịch: ${reason}` : 'Hủy lịch bởi lễ tân',
          updated_at: new Date().toISOString()
        })
        .eq('appointment_id', appointment_id);

      if (error) {
        logger.error('Error cancelling appointment:', error);
        res.status(500).json({
          success: false,
          error: { message: 'Lỗi khi hủy lịch hẹn' }
        });
        return;
      }

      res.json({
        success: true,
        message: 'Hủy lịch hẹn thành công'
      });
    } catch (error) {
      logger.error('Error in cancelAppointment:', error);
      res.status(500).json({
        success: false,
        error: { message: 'Lỗi server khi hủy lịch hẹn' }
      });
    }
  };
}
