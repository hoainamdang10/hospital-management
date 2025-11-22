/**
 * Admin Dashboard Service
 * API calls for admin dashboard statistics and data
 */

import { appointmentsClient, patientClient, staffClient, billingClient } from './clients';

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

export interface InvoiceStatusSummary {
  paid: number;
  pending: number;
  failed: number;
  refunded: number;
}

export interface PaymentRecord {
  invoiceId: string;
  patientName: string;
  amount: number;
  status: 'PAID' | 'PENDING' | 'FAILED' | 'REFUNDED';
  method: 'PayOS' | 'Cash' | 'Card' | 'BankTransfer';
  createdAt: string;
}

export interface WebhookEvent {
  timestamp: string;
  endpoint: string;
  statusCode: number;
  invoiceId?: string;
  eventType?: string;
  success: boolean;
}

/**
 * Get admin dashboard statistics
 */
export async function getAdminDashboardStats(): Promise<AdminDashboardStats> {
  try {
    // Fetch data from multiple services in parallel
    const [appointmentsData, patientsData, staffData] = await Promise.all([
      // Get total appointments
      appointmentsClient.get('/v1/appointments', {
        params: {
          page: 1,
          pageSize: 1000,
        },
      }).catch(() => ({ data: { data: { appointments: [], total: 0 } } })),

      // Get total patients (using patient registry service)
      patientClient.get('/v1/patients', {
        params: {
          page: 1,
          pageSize: 1,
        },
      }).catch(() => ({ data: { data: { total: 0 } } })),

      // Get total staff (using provider staff service)
      staffClient.get('/v1/staff/search', {
        params: {
          page: 1,
          pageSize: 1,
        },
      }).catch(() => ({ data: { data: { total: 0 } } })),
    ]);

    const totalAppointments = appointmentsData.data?.data?.total || appointmentsData.data?.data?.appointments?.length || 0;
    const totalPatients = patientsData.data?.data?.total || 0;
    const totalStaff = staffData.data?.data?.total || 0;

    // Calculate revenue from appointments if available (consultationFee)
    const appointments = appointmentsData.data?.data?.appointments || [];
    const totalRevenue = appointments.reduce((sum: number, apt: any) => sum + Number(apt.consultationFee || 0), 0);

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
    const response = await appointmentsClient.get('/v1/appointments', {
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
    const response = await appointmentsClient.get('/v1/appointments', {
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
      monthlyData[monthKey].revenue += Number(apt.consultationFee || 0);
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
 * Get invoice status summary and today's revenue breakdown
 */
export async function getInvoiceSummary(): Promise<{ summary: InvoiceStatusSummary; todayRevenue: { payos: number; cash: number } }> {
  try {
    const invoicesResp = await billingClient.get('/v1/billing/invoices/search', {
      params: { page: 1, pageSize: 1000 },
    });
    const invoices = invoicesResp.data?.data?.invoices || invoicesResp.data?.data || [];
    const payments: any[] = [];

    const summary: InvoiceStatusSummary = {
      paid: invoices.filter((i: any) => i.status?.toUpperCase() === 'PAID').length,
      pending: invoices.filter((i: any) => i.status?.toUpperCase() === 'PENDING').length,
      failed: invoices.filter((i: any) => i.status?.toUpperCase() === 'FAILED').length,
      refunded: invoices.filter((i: any) => i.status?.toUpperCase() === 'REFUNDED').length,
    };

    const todayRevenue = payments.reduce(
      (acc: { payos: number; cash: number }, p: any) => {
        const created = new Date(p.createdAt || p.paymentDate);
        const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
        const todayEnd = new Date(); todayEnd.setHours(23, 59, 59, 999);
        if (created >= todayStart && created <= todayEnd && String(p.status).toUpperCase() === 'PAID') {
          const method = String(p.method || p.paymentMethod || '').toLowerCase();
          const amount = Number(p.amount || p.totalAmount || 0);
          if (method.includes('payos')) acc.payos += amount; else acc.cash += amount;
        }
        return acc;
      },
      { payos: 0, cash: 0 }
    );

    return { summary, todayRevenue };
  } catch (error) {
    console.error('[AdminDashboardService] Failed to fetch invoice summary:', error);
    return { summary: { paid: 0, pending: 0, failed: 0, refunded: 0 }, todayRevenue: { payos: 0, cash: 0 } };
  }
}

/**
 * Get revenue trend by day for the last 14 days
 */
export async function getRevenueTrend(days: number = 14): Promise<{ date: string; amount: number }[]> {
  try {
    const resp = await billingClient.get('/v1/billing/invoices/search', {
      params: { page: 1, pageSize: 1000, status: 'PAID' },
    });
    const invoices = resp.data?.data?.invoices || resp.data?.data || [];
    const end = new Date(); end.setHours(0, 0, 0, 0);
    const trend: Record<string, number> = {};
    for (let i = 0; i < days; i++) {
      const d = new Date(end); d.setDate(end.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      trend[key] = 0;
    }
    invoices.forEach((inv: any) => {
      const paidAt = new Date(inv.paidAt || inv.updatedAt || inv.createdAt);
      const key = paidAt.toISOString().slice(0, 10);
      if (trend[key] !== undefined && String(inv.status).toUpperCase() === 'PAID') {
        trend[key] += Number(inv.totalAmount || inv.amount || 0);
      }
    });
    return Object.entries(trend)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, amount]) => ({ date, amount }));
  } catch (error) {
    console.error('[AdminDashboardService] Failed to fetch revenue trend:', error);
    const end = new Date(); end.setHours(0, 0, 0, 0);
    return Array.from({ length: days }).map((_, i) => {
      const d = new Date(end); d.setDate(end.getDate() - i);
      return { date: d.toISOString().slice(0, 10), amount: 0 };
    }).reverse();
  }
}

/**
 * Get invoice status distribution (for pie/donut)
 */
export async function getInvoiceStatusDistribution(): Promise<InvoiceStatusSummary> {
  try {
    const resp = await billingClient.get('/v1/billing/invoices/search', {
      params: { page: 1, pageSize: 1000 },
    });
    const invoices = resp.data?.data?.invoices || resp.data?.data || [];
    return {
      paid: invoices.filter((i: any) => i.status?.toUpperCase() === 'PAID').length,
      pending: invoices.filter((i: any) => i.status?.toUpperCase() === 'PENDING').length,
      failed: invoices.filter((i: any) => i.status?.toUpperCase() === 'FAILED').length,
      refunded: invoices.filter((i: any) => i.status?.toUpperCase() === 'REFUNDED').length,
    };
  } catch (error) {
    console.error('[AdminDashboardService] Failed to fetch invoice status distribution:', error);
    return { paid: 0, pending: 0, failed: 0, refunded: 0 };
  }
}

/**
 * Get recent payments for table
 */
export async function getRecentPayments(limit: number = 10): Promise<PaymentRecord[]> {
  try {
    const resp = await billingClient.get('/v1/billing/invoices/search', {
      params: { page: 1, pageSize: 1000, status: 'PAID', sortBy: 'updatedAt', sortOrder: 'DESC' },
    });
    const invoices = resp.data?.data?.invoices || resp.data?.data || [];
    return invoices.slice(0, limit).map((inv: any) => ({
      invoiceId: inv.invoiceId || inv.invoiceNumber || inv.id,
      patientName: inv.patientName || 'Bệnh nhân',
      amount: Number(inv.totalAmount || inv.amount || 0),
      status: 'PAID',
      method: (String(inv.paymentMethod || 'PayOS').toLowerCase().includes('cash') ? 'Cash' : 'PayOS'),
      createdAt: inv.paidAt || inv.updatedAt || inv.createdAt,
    }));
  } catch (error) {
    console.error('[AdminDashboardService] Failed to fetch recent payments:', error);
    return [];
  }
}

/**
 * Get recent webhook events
 */
export async function getRecentWebhooks(limit: number = 10): Promise<WebhookEvent[]> {
  try {
    return [];
  } catch (error) {
    console.error('[AdminDashboardService] Failed to fetch webhook events:', error);
    return [];
  }
}

/**
 * Estimate check-in count today (fallback based on confirmed appointments)
 */
export async function getTodayCheckInCount(): Promise<{ checkedIn: number; total: number }> {
  try {
    const resp = await appointmentsClient.get('/v1/appointments', { params: { page: 1, pageSize: 1000 } });
    const apts = resp.data?.data?.appointments || [];
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1);
    const todayApts = apts.filter((apt: any) => {
      const d = new Date(apt.appointmentDateTime);
      return d >= today && d < tomorrow;
    });
    const checkedIn = todayApts.filter((apt: any) => String(apt.status).toUpperCase() === 'CONFIRMED' || String(apt.status).toUpperCase() === 'COMPLETED').length;
    return { checkedIn, total: todayApts.length };
  } catch (error) {
    console.error('[AdminDashboardService] Failed to fetch check-in count:', error);
    return { checkedIn: 0, total: 0 };
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

    const response = await appointmentsClient.get('/v1/appointments', {
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
