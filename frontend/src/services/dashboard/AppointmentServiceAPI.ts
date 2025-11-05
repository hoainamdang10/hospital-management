import { appointmentServiceAPI } from "../appointment/AppointmentServiceAPI";
import type { Appointment, AppointmentResponse } from "../appointment/AppointmentServiceAPI";

export class DashboardAppointmentServiceAPI {
  private static instance: DashboardAppointmentServiceAPI;

  private constructor() {}

  public static getInstance(): DashboardAppointmentServiceAPI {
    if (!DashboardAppointmentServiceAPI.instance) {
      DashboardAppointmentServiceAPI.instance =
        new DashboardAppointmentServiceAPI();
    }
    return DashboardAppointmentServiceAPI.instance;
  }

  async getDashboardAppointments(): Promise<AppointmentResponse> {
    return appointmentServiceAPI.getAllAppointments();
  }
}

export const dashboardAppointmentServiceAPI =
  DashboardAppointmentServiceAPI.getInstance();
