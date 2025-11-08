/**
 * Admin Dashboard Service
 * API calls for admin dashboard statistics and data
 */

import { appointmentsClient, patientClient, staffClient } from './clients';

export interface AdminDashboardStats {
  totalRevenue: number;
  revenueChange: string;
  totalAppointments: number;
  appointmentsChange: string;
  totalPatients: number;
  patientsChange: string;
  totalStaff: number;
  staffChange: string;
}

export interface RecentAppointment {
  id: string;
  patientName: string;
  appointmentType: string;
  appointmentDateTime: string;
  status: 'SCHEDULED' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';
}

export interface MonthlyStats {
  month: string;
  patients: number;
  revenue: number;
  appointments: number;
}

/**
 * Get admin dashboard statistics
 */
export async function getAdminDashboardStats(): Promise<AdminDashboardStats> {
  try {
    // Fetch data from multiple services in parallel
    const [appointmentsData, patientsData, staffData] = await Promise.all([
      // Get total appointments
      appointmentsClient.get('/api/v1/appointments', {
        params: {
          page: 1,
          pageSize: 1000,
        },
      }).catch(() => ({ data: { data: { appointments: [], total: 0 } } })),

      // Get total patients (using patient registry service)
      patientClient.get('/api/v1/patients', {
        params: {
          page: 1,
          pageSize: 1,
        },
      }).catch(() => ({ data: { data: { total: 0 } } })),

      // Get total staff (using provider staff service)
      staffClient.get('/api/v1/staff/search', {
        params: {
          page: 1,
          pageSize: 1,
        },
      }).catch(() => ({ data: { data: { total: 0 } } })),
    ]);

    const totalAppointments = appointmentsData.data?.data?.total || appointmentsData.data?.data?.appointments?.length || 0;
    const totalPatients = patientsData.data?.data?.total || 0;
    const totalStaff = staffData.data?.data?.total || 0;

    // Calculate revenue (mock for now - will integrate with billing service)
    const totalRevenue = totalAppointments * 500000; // Average 500k per appointment

    // Calculate changes (mock - compare with previous period)
    const revenueChange = '+20.1%';
    const appointmentsChange = '+180.1%';
    const patientsChange = '+19%';
    const staffChange = '+201';

    return {
      totalRevenue,
      revenueChange,
      totalAppointments,
      appointmentsChange,
      totalPatients,
      patientsChange,
      totalStaff,
      staffChange,
    };
  } catch (error) {
    console.error('[AdminDashboardService] Failed to fetch stats:', error);
    
    // Return default values on error
    return {
      totalRevenue: 0,
      revenueChange: '0%',
      totalAppointments: 0,
      appointmentsChange: '0%',
      totalPatients: 0,
      patientsChange: '0%',
      totalStaff: 0,
      staffChange: '0',
    };
  }
}

/**
 * Get recent appointments for admin dashboard
 */
export async function getRecentAppointments(limit: number = 10): Promise<RecentAppointment[]> {
  try {
    const response = await appointmentsClient.get('/api/v1/appointments', {
      params: {
        page: 1,
        pageSize: limit,
        sortBy: 'appointmentDateTime',
        sortOrder: 'desc',
      },
    });

    const appointments = response.data?.data?.appointments || [];

    return appointments.map((apt: any) => ({
      id: apt.appointmentId,
      patientName: apt.patientName || 'Bệnh nhân',
      appointmentType: apt.appointmentType || 'Khám bệnh',
      appointmentDateTime: apt.appointmentDateTime,
      status: apt.status,
    }));
  } catch (error) {
    console.error('[AdminDashboardService] Failed to fetch recent appointments:', error);
    return [];
  }
}

/**
 * Get monthly statistics for chart
 */
export async function getMonthlyStats(): Promise<MonthlyStats[]> {
  try {
    // Fetch all appointments
    const response = await appointmentsClient.get('/api/v1/appointments', {
      params: {
        page: 1,
        pageSize: 1000,
      },
    });

    const appointments = response.data?.data?.appointments || [];

    // Group by month
    const monthlyData: { [key: string]: { patients: Set<string>; appointments: number; revenue: number } } = {};

    appointments.forEach((apt: any) => {
      const date = new Date(apt.appointmentDateTime);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = {
          patients: new Set(),
          appointments: 0,
          revenue: 0,
        };
      }

      monthlyData[monthKey].patients.add(apt.patientId);
      monthlyData[monthKey].appointments += 1;
      monthlyData[monthKey].revenue += 500000; // Mock revenue per appointment
    });

    // Convert to array and format
    const months = ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'T10', 'T11', 'T12'];
    const currentYear = new Date().getFullYear();

    return months.map((month, index) => {
      const monthKey = `${currentYear}-${String(index + 1).padStart(2, '0')}`;
      const data = monthlyData[monthKey];

      return {
        month,
        patients: data ? data.patients.size : 0,
        revenue: data ? data.revenue / 1000000 : 0, // Convert to millions
        appointments: data ? data.appointments : 0,
      };
    });
  } catch (error) {
    console.error('[AdminDashboardService] Failed to fetch monthly stats:', error);
    
    // Return empty data
    return ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'T10', 'T11', 'T12'].map(month => ({
      month,
      patients: 0,
      revenue: 0,
      appointments: 0,
    }));
  }
}

/**
 * Get today's appointments count
 */
export async function getTodayAppointmentsCount(): Promise<number> {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const response = await appointmentsClient.get('/api/v1/appointments', {
      params: {
        page: 1,
        pageSize: 1000,
      },
    });

    const appointments = response.data?.data?.appointments || [];
    
    const todayAppointments = appointments.filter((apt: any) => {
      const aptDate = new Date(apt.appointmentDateTime);
      return aptDate >= today && aptDate < tomorrow;
    });

    return todayAppointments.length;
  } catch (error) {
    console.error('[AdminDashboardService] Failed to fetch today appointments:', error);
    return 0;
  }
}

/**
 * Format currency (VND)
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(amount);
}

/**
 * Format number with commas
 */
export function formatNumber(num: number): string {
  return new Intl.NumberFormat('vi-VN').format(num);
}
