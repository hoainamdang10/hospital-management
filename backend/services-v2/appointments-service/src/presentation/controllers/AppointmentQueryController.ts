/**
 * Appointment Query Controller - Presentation Layer
 * REST API controller for appointment queries (CQRS Read Model)
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, CQRS, REST API
 */

import { Request, Response } from "express";
import { GetAppointmentDetailsQuery } from "../../application/queries/GetAppointmentDetailsQuery";
import { ListAppointmentsQuery } from "../../application/queries/ListAppointmentsQuery";

export class AppointmentQueryController {
  constructor(
    private getAppointmentDetailsQuery: GetAppointmentDetailsQuery,
    private listAppointmentsQuery: ListAppointmentsQuery,
  ) {}

  /**
   * GET /api/appointments/:id
   * Get appointment details with patient/doctor info
   */
  async getAppointmentDetails(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const appointmentDetails =
        await this.getAppointmentDetailsQuery.execute(id);

      res.status(200).json({
        success: true,
        data: appointmentDetails,
      });
    } catch (error: any) {
      console.error(
        "[AppointmentQueryController] Failed to get appointment details:",
        error,
      );

      if (error.message.includes("not found")) {
        res.status(404).json({
          success: false,
          error: "Appointment not found",
        });
        return;
      }

      res.status(500).json({
        success: false,
        error: "Failed to get appointment details",
      });
    }
  }

  /**
   * GET /api/appointments
   * List appointments with filters and pagination
   *
   * Query params:
   * - patientId: Filter by patient ID
   * - doctorId: Filter by doctor ID
   * - startDate: Filter by start date (YYYY-MM-DD)
   * - endDate: Filter by end date (YYYY-MM-DD)
   * - status: Filter by status
   * - type: Filter by type
   * - priority: Filter by priority
   * - departmentId: Filter by department
   * - page: Page number (default: 1)
   * - pageSize: Page size (default: 20)
   */
  async listAppointments(req: Request, res: Response): Promise<void> {
    try {
      const {
        patientId,
        doctorId,
        startDate,
        endDate,
        status,
        type,
        priority,
        departmentId,
        page,
        pageSize,
      } = req.query;

      const result = await this.listAppointmentsQuery.execute({
        patientId: patientId as string,
        doctorId: doctorId as string,
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
        status: status as string,
        type: type as string,
        priority: priority as string,
        departmentId: departmentId as string,
        page: page ? parseInt(page as string) : undefined,
        pageSize: pageSize ? parseInt(pageSize as string) : undefined,
      });

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      console.error(
        "[AppointmentQueryController] Failed to list appointments:",
        error,
      );

      res.status(500).json({
        success: false,
        error: "Failed to list appointments",
      });
    }
  }

  /**
   * GET /api/patients/:patientId/appointments
   * Get appointments for a specific patient
   */
  async getPatientAppointments(req: Request, res: Response): Promise<void> {
    try {
      const { patientId } = req.params;
      const { page, pageSize } = req.query;

      const result = await this.listAppointmentsQuery.execute({
        patientId,
        page: page ? parseInt(page as string) : undefined,
        pageSize: pageSize ? parseInt(pageSize as string) : undefined,
      });

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      console.error(
        "[AppointmentQueryController] Failed to get patient appointments:",
        error,
      );

      res.status(500).json({
        success: false,
        error: "Failed to get patient appointments",
      });
    }
  }

  /**
   * GET /api/doctors/:doctorId/appointments
   * Get appointments for a specific doctor
   */
  async getDoctorAppointments(req: Request, res: Response): Promise<void> {
    try {
      const { doctorId } = req.params;
      const authUser = (req as any).user;
      const effectiveDoctorId =
        authUser?.role === "doctor" && authUser?.userId
          ? authUser.userId
          : doctorId;
      if (
        authUser?.role === "doctor" &&
        authUser?.userId &&
        authUser.userId !== doctorId
      ) {
        res.status(403).json({
          success: false,
          error: "Forbidden: doctor can only view own appointments",
        });
        return;
      }
      const { page, pageSize, startDate, endDate, status } = req.query;

      const result = await this.listAppointmentsQuery.execute({
        doctorId: effectiveDoctorId,
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
        status: status as string,
        page: page ? parseInt(page as string) : undefined,
        pageSize: pageSize ? parseInt(pageSize as string) : undefined,
      });

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      console.error(
        "[AppointmentQueryController] Failed to get doctor appointments:",
        error,
      );

      res.status(500).json({
        success: false,
        error: "Failed to get doctor appointments",
      });
    }
  }
}
