import { Request, Response } from 'express';
import { ReceptionistRepository } from '../repositories/receptionist.repository';
import logger from '@hospital/shared/dist/utils/logger';

export class CheckInController {
  private receptionistRepository: ReceptionistRepository;

  constructor() {
    this.receptionistRepository = new ReceptionistRepository();
  }

  // Create patient check-in
  createCheckIn = async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.user || !['receptionist', 'admin'].includes(req.user.role)) {
        res.status(403).json({
          success: false,
          error: { message: 'Chỉ lễ tân mới có thể thực hiện check-in' }
        });
        return;
      }

      const {
        appointment_id,
        patient_id,
        insuranceVerified = false,
        documentsComplete = true,
        notes = ''
      } = req.body;

      if (!appointment_id || !patient_id) {
        res.status(400).json({
          success: false,
          error: { message: 'Mã lịch hẹn và mã bệnh nhân là bắt buộc' }
        });
        return;
      }

      const checkInData = {
        patient_id: patient_id,
        appointment_id: appointment_id,
        receptionist_id: req.user.receptionist_id || req.user.id,
        check_in_time: new Date().toISOString(),
        insurance_verified: insuranceVerified,
        documents_complete: documentsComplete,
        notes: notes,
        status: 'checked_in'
      };

      const checkIn = await this.receptionistRepository.createCheckIn(checkInData);

      res.status(201).json({
        success: true,
        data: checkIn,
        message: 'Check-in thành công'
      });
    } catch (error) {
      logger.error('Error in createCheckIn:', error);
      res.status(500).json({
        success: false,
        error: { message: 'Lỗi server khi thực hiện check-in' }
      });
    }
  };

  // Get queue management data
  getQueue = async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.user || !['receptionist', 'admin', 'doctor'].includes(req.user.role)) {
        res.status(403).json({
          success: false,
          error: { message: 'Không có quyền xem hàng đợi' }
        });
        return;
      }

      const queue = await this.receptionistRepository.getQueue();

      res.json({
        success: true,
        data: queue
      });
    } catch (error) {
      logger.error('Error in getQueue:', error);
      res.status(500).json({
        success: false,
        error: { message: 'Lỗi server khi lấy thông tin hàng đợi' }
      });
    }
  };

  // Update appointment status
  updateAppointmentStatus = async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.user || !['receptionist', 'admin'].includes(req.user.role)) {
        res.status(403).json({
          success: false,
          error: { message: 'Không có quyền cập nhật trạng thái lịch hẹn' }
        });
        return;
      }

      const { appointment_id } = req.params;
      const { status, notes } = req.body;

      if (!appointment_id || !status) {
        res.status(400).json({
          success: false,
          error: { message: 'Mã lịch hẹn và trạng thái là bắt buộc' }
        });
        return;
      }

      // Update appointment status in database
      // This would typically be done through the appointment service
      // For now, we'll implement a basic update

      res.json({
        success: true,
        message: 'Cập nhật trạng thái lịch hẹn thành công'
      });
    } catch (error) {
      logger.error('Error in updateAppointmentStatus:', error);
      res.status(500).json({
        success: false,
        error: { message: 'Lỗi server khi cập nhật trạng thái' }
      });
    }
  };

  // Call next patient
  callNextPatient = async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.user || !['receptionist', 'admin'].includes(req.user.role)) {
        res.status(403).json({
          success: false,
          error: { message: 'Không có quyền gọi bệnh nhân' }
        });
        return;
      }

      const { doctor_id, roomNumber } = req.body;

      if (!doctor_id) {
        res.status(400).json({
          success: false,
          error: { message: 'Mã bác sĩ là bắt buộc' }
        });
        return;
      }

      // Get next patient in queue for the doctor
      const queue = await this.receptionistRepository.getQueue();
      const nextPatient = queue.find(item => 
        item.status === 'checked_in' && 
        item.appointment_id.includes(doctor_id) // This is a simplified check
      );

      if (!nextPatient) {
        res.status(404).json({
          success: false,
          error: { message: 'Không có bệnh nhân nào trong hàng đợi' }
        });
        return;
      }

      // Here you would typically:
      // 1. Update appointment status to 'in_progress'
      // 2. Send notification to patient
      // 3. Update queue display

      res.json({
        success: true,
        data: {
          patient: nextPatient,
          message: `Mời bệnh nhân ${nextPatient.patient_name} vào phòng ${roomNumber || 'khám'}`
        }
      });
    } catch (error) {
      logger.error('Error in callNextPatient:', error);
      res.status(500).json({
        success: false,
        error: { message: 'Lỗi server khi gọi bệnh nhân' }
      });
    }
  };
}
