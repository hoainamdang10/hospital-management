import logger from '@hospital/shared/dist/utils/logger';
import { ApiGatewayClient, createApiGatewayClient, defaultApiGatewayConfig } from '@hospital/shared/dist/clients/api-gateway.client';

interface AppointmentData {
  appointment_id: string;
  patient_id: string;
  patient_name?: string;
  patient_phone?: string;
  patient_email?: string;
  appointment_date: string;
  appointment_time: string;
  status: string;
  appointment_type: string;
  notes?: string;
}

interface AppointmentServiceResponse {
  success: boolean;
  data: AppointmentData[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface AppointmentStats {
  total_appointments: number;
  appointments_this_month: number;
  appointments_today: number;
  monthly_stats: Array<{
    month: string;
    appointments: number;
    patients: number;
  }>;
  appointment_types: Array<{
    type: string;
    count: number;
    percentage: number;
  }>;
}

export class AppointmentService {
  private apiGatewayClient: ApiGatewayClient;

  constructor() {
    this.apiGatewayClient = createApiGatewayClient({
      ...defaultApiGatewayConfig,
      serviceName: 'doctor-service',
    });
  }

  // Get doctor's appointments
  async getDoctorAppointments(
    doctor_id: string,
    filters: {
      date?: string;
      status?: string;
      page?: number;
      limit?: number;
    } = {}
  ): Promise<{ appointments: AppointmentData[]; pagination?: any }> {
    try {
      logger.info('🔄 Fetching doctor appointments via API Gateway', { doctor_id, filters });

      const response = await this.apiGatewayClient.getDoctorAppointments(doctor_id, filters);

      if (response.success && response.data) {
        logger.info('✅ Doctor appointments fetched successfully via API Gateway', {
          doctor_id,
          appointmentCount: response.data.appointments?.length || 0
        });

        return {
          appointments: response.data.appointments || [],
          pagination: response.data.pagination
        };
      }

      logger.warn('⚠️ No appointments found via API Gateway', { doctor_id });
      return { appointments: [] };
    } catch (error) {
      logger.error('❌ Error fetching doctor appointments via API Gateway:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        doctor_id,
        filters
      });

      // Return empty array instead of throwing error to maintain service availability
      return { appointments: [] };
    }
  }

  // Get appointment statistics for a doctor
  async getDoctorAppointmentStats(doctor_id: string): Promise<AppointmentStats> {
    try {
      logger.info('🔄 Fetching appointment stats via API Gateway', { doctor_id });

      const response = await this.apiGatewayClient.getAppointmentStats(doctor_id);

      if (response.success && response.data) {
        logger.info('✅ Appointment stats fetched successfully via API Gateway', { doctor_id });
        return response.data as AppointmentStats;
      }

      logger.warn('⚠️ No appointment stats found via API Gateway', { doctor_id });
      // Return default stats if service is unavailable
      return this.getDefaultStats();
    } catch (error) {
      logger.error('❌ Error fetching appointment stats via API Gateway:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        doctor_id
      });

      // Return default stats to maintain service availability
      return this.getDefaultStats();
    }
  }

  // Get total patient count for a doctor
  async getDoctorPatientCount(doctor_id: string): Promise<number> {
    try {
      logger.info('🔄 Fetching patient count via API Gateway', { doctor_id });

      // Use appointment stats to get patient count
      const stats = await this.getDoctorAppointmentStats(doctor_id);

      // Calculate unique patients from monthly stats
      const uniquePatients = stats.monthly_stats.reduce((total, month) => {
        return total + month.patients;
      }, 0);

      logger.info('✅ Patient count calculated via API Gateway', {
        doctor_id,
        count: uniquePatients
      });

      return uniquePatients;
    } catch (error) {
      logger.error('❌ Error fetching patient count via API Gateway:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        doctor_id
      });

      return 0;
    }
  }

  // Check if Appointment Service is available
  async isServiceAvailable(): Promise<boolean> {
    try {
      logger.info('🔄 Checking appointment service health via API Gateway');

      const isHealthy = await this.apiGatewayClient.checkServiceHealth('appointments');

      if (isHealthy) {
        logger.info('✅ Appointment service is healthy via API Gateway');
      } else {
        logger.warn('⚠️ Appointment service is not healthy via API Gateway');
      }

      return isHealthy;
    } catch (error) {
      logger.error('❌ Error checking appointment service health via API Gateway:', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      return false;
    }
  }

  // Get appointments for today
  async getTodayAppointments(doctor_id: string): Promise<AppointmentData[]> {
    logger.info('🔄 Fetching today appointments via API Gateway', { doctor_id });

    const today = new Date().toISOString().split('T')[0];
    const result = await this.getDoctorAppointments(doctor_id, {
      date: today,
      limit: 100
    });

    logger.info('✅ Today appointments fetched via API Gateway', {
      doctor_id,
      count: result.appointments.length
    });

    return result.appointments;
  }

  // Get appointments for current month
  async getMonthlyAppointments(doctor_id: string): Promise<AppointmentData[]> {
    try {
      logger.info('🔄 Fetching monthly appointments via API Gateway', { doctor_id });

      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

      // Use the API Gateway client with date range filters
      const result = await this.getDoctorAppointments(doctor_id, {
        // Note: This assumes the API Gateway client supports date range filtering
        // If not, we might need to extend the client or use a different approach
        limit: 1000
      });

      // Filter appointments for current month (client-side filtering as fallback)
      const monthlyAppointments = result.appointments.filter(appointment => {
        const appointmentDate = new Date(appointment.appointment_date);
        return appointmentDate >= startOfMonth && appointmentDate <= endOfMonth;
      });

      logger.info('✅ Monthly appointments fetched via API Gateway', {
        doctor_id,
        count: monthlyAppointments.length
      });

      return monthlyAppointments;
    } catch (error) {
      logger.error('❌ Error fetching monthly appointments via API Gateway:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        doctor_id
      });

      return [];
    }
  }

  // Get upcoming appointments
  async getUpcomingAppointments(doctor_id: string): Promise<AppointmentData[]> {
    try {
      logger.info('🔄 Fetching upcoming appointments via API Gateway', { doctor_id });

      const today = new Date().toISOString().split('T')[0];

      // Use API Gateway client with filters for upcoming appointments
      const result = await this.getDoctorAppointments(doctor_id, {
        limit: 10
      });

      // Filter for upcoming appointments (client-side filtering as fallback)
      const upcomingAppointments = result.appointments.filter(appointment => {
        const appointmentDate = new Date(appointment.appointment_date);
        const todayDate = new Date(today);
        return appointmentDate >= todayDate &&
               ['confirmed', 'scheduled'].includes(appointment.status);
      });

      // Sort by date and time
      upcomingAppointments.sort((a, b) => {
        const dateA = new Date(`${a.appointment_date} ${a.appointment_time}`);
        const dateB = new Date(`${b.appointment_date} ${b.appointment_time}`);
        return dateA.getTime() - dateB.getTime();
      });

      logger.info('✅ Upcoming appointments fetched via API Gateway', {
        doctor_id,
        count: upcomingAppointments.length
      });

      return upcomingAppointments.slice(0, 10); // Limit to 10
    } catch (error) {
      logger.error('❌ Error fetching upcoming appointments via API Gateway:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        doctor_id
      });

      return [];
    }
  }

  // Get recent activity
  async getRecentActivity(doctor_id: string): Promise<any[]> {
    try {
      logger.info('🔄 Fetching recent activity via API Gateway', { doctor_id });

      // Use API Gateway client to get recent appointments
      const result = await this.getDoctorAppointments(doctor_id, {
        limit: 10
      });

      // Sort by most recent first
      const appointments = result.appointments.sort((a, b) => {
        const dateA = new Date(`${a.appointment_date} ${a.appointment_time}`);
        const dateB = new Date(`${b.appointment_date} ${b.appointment_time}`);
        return dateB.getTime() - dateA.getTime(); // Descending order
      });

      const recentActivity = appointments.slice(0, 10).map((apt: AppointmentData) => ({
        type: 'appointment',
        description: `${apt.status} appointment with ${apt.patient_name || apt.patient_id}`,
        date: apt.appointment_date,
        time: apt.appointment_time,
        status: apt.status
      }));

      logger.info('✅ Recent activity fetched via API Gateway', {
        doctor_id,
        count: recentActivity.length
      });

      return recentActivity;
    } catch (error) {
      logger.error('❌ Error fetching recent activity via API Gateway:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        doctor_id
      });

      return [];
    }
  }

  private getDefaultStats(): AppointmentStats {
    return {
      total_appointments: 0,
      appointments_this_month: 0,
      appointments_today: 0,
      monthly_stats: [
        { month: 'Jan', appointments: 0, patients: 0 },
        { month: 'Feb', appointments: 0, patients: 0 },
        { month: 'Mar', appointments: 0, patients: 0 },
        { month: 'Apr', appointments: 0, patients: 0 },
        { month: 'May', appointments: 0, patients: 0 },
        { month: 'Jun', appointments: 0, patients: 0 }
      ],
      appointment_types: [
        { type: 'Khám tổng quát', count: 0, percentage: 0 },
        { type: 'Tái khám', count: 0, percentage: 0 },
        { type: 'Khám chuyên khoa', count: 0, percentage: 0 },
        { type: 'Tư vấn', count: 0, percentage: 0 }
      ]
    };
  }
}
