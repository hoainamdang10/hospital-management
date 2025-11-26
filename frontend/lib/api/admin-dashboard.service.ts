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
  description?: string;
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
/**
 * Get admin dashboard statistics with REAL data calculation
 */
export async function getAdminDashboardStats(): Promise<AdminDashboardStats> {
  try {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;

    // Fetch data from multiple services in parallel
    const [appointmentsResp, patientsResp, staffResp, invoicesResp] = await Promise.all([
      appointmentsClient.get('/v1/appointments', {
        params: { page: 1, pageSize: 1000, sortBy: 'appointmentDateTime', sortOrder: 'desc' },
      }).catch(() => ({ data: { data: { appointments: [], total: 0 } } })),

      patientClient.get('/v1/patients', {
        params: { page: 1, pageSize: 1000, sortBy: 'createdAt', sortOrder: 'desc' },
      }).catch(() => ({ data: { data: { patients: [], total: 0 } } })),

      staffClient.get('/v1/staff/search', {
        params: { page: 1, pageSize: 1000 },
      }).catch(() => ({ data: { data: { items: [], pagination: { total: 0 } } } })),

      billingClient.get('/v1/billing/invoices/search', {
        params: { pageSize: 1000 },
      }).catch((err) => {
        console.error('Failed to fetch invoices for stats:', err);
        return { data: { invoices: [] } };
      }),
    ]);

    // 1. Appointments (Count only)
    const appointments = appointmentsResp.data?.data?.appointments || [];
    const totalAppointments = appointmentsResp.data?.data?.total || appointments.length;

    let thisMonthApts = 0;
    let lastMonthApts = 0;

    appointments.forEach((apt: any) => {
      let date: Date;
      if (apt.appointmentDateTime) {
        date = new Date(apt.appointmentDateTime);
      } else if (apt.appointmentDate) {
        date = new Date(apt.appointmentDate);
        if (apt.appointmentTime) {
          const [hours, minutes] = apt.appointmentTime.split(':');
          date.setHours(parseInt(hours), parseInt(minutes));
        }
      } else {
        return;
      }

      if (date.getMonth() === currentMonth && date.getFullYear() === currentYear) {
        thisMonthApts++;
      } else if (date.getMonth() === lastMonth && date.getFullYear() === lastMonthYear) {
        lastMonthApts++;
      }
    });

    // 2. Revenue (From Invoices)
    const invoices = invoicesResp.data?.invoices || invoicesResp.data?.data?.invoices || invoicesResp.data?.data || [];
    let thisMonthRevenue = 0;
    let lastMonthRevenue = 0;

    invoices.forEach((inv: any) => {
      // Only count PAID invoices for revenue
      if (inv.status?.toLowerCase() !== 'paid') return;

      const date = new Date(inv.createdAt);
      const amount = Number(inv.totalAmount || 0);

      if (date.getMonth() === currentMonth && date.getFullYear() === currentYear) {
        thisMonthRevenue += amount;
      } else if (date.getMonth() === lastMonth && date.getFullYear() === lastMonthYear) {
        lastMonthRevenue += amount;
      }
    });

    // 3. Patients
    const patients = patientsResp.data?.data?.patients || patientsResp.data?.data || [];
    const totalPatients = patientsResp.data?.data?.total || patients.length;

    let thisMonthPatients = 0;
    let lastMonthPatients = 0;

    patients.forEach((p: any) => {
      const dateStr = p.createdAt || p.created_at || p.joinedAt;
      if (dateStr) {
        const date = new Date(dateStr);
        if (date.getMonth() === currentMonth && date.getFullYear() === currentYear) {
          thisMonthPatients++;
        } else if (date.getMonth() === lastMonth && date.getFullYear() === lastMonthYear) {
          lastMonthPatients++;
        }
      }
    });

    // 4. Staff
    const staffList = staffResp.data?.data?.items || [];
    const totalStaff = staffResp.data?.data?.pagination?.total || staffList.length;

    let thisMonthStaff = 0;
    let lastMonthStaff = 0;

    staffList.forEach((s: any) => {
      const dateStr = s.hireDate || s.createdAt || s.created_at;
      if (dateStr) {
        const date = new Date(dateStr);
        if (date.getMonth() === currentMonth && date.getFullYear() === currentYear) {
          thisMonthStaff++;
        } else if (date.getMonth() === lastMonth && date.getFullYear() === lastMonthYear) {
          lastMonthStaff++;
        }
      }
    });

    // Helper to calculate percentage change
    const calculateChange = (current: number, previous: number): string => {
      if (previous === 0) return current > 0 ? '+100%' : '0%';
      const change = ((current - previous) / previous) * 100;
      return `${change > 0 ? '+' : ''}${change.toFixed(1)}%`;
    };

    return {
      totalRevenue: thisMonthRevenue,
      revenueChange: calculateChange(thisMonthRevenue, lastMonthRevenue),
      totalAppointments: totalAppointments, // Total all time
      appointmentsChange: calculateChange(thisMonthApts, lastMonthApts),
      totalPatients: totalPatients,
      patientsChange: calculateChange(thisMonthPatients, lastMonthPatients),
      totalStaff: totalStaff,
      staffChange: calculateChange(thisMonthStaff, lastMonthStaff),
    };
  } catch (error) {
    console.error('[AdminDashboardService] Failed to fetch stats:', error);

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

    return appointments.map((apt: any) => {
      let dateTime = apt.appointmentDateTime;
      if (!dateTime && apt.appointmentDate) {
        dateTime = apt.appointmentDate;
        if (apt.appointmentTime) {
          dateTime += `T${apt.appointmentTime}`;
        }
      }

      return {
        id: apt.appointmentId,
        patientName: apt.patientName || 'Bệnh nhân',
        appointmentType: apt.appointmentType || 'Khám bệnh',
        appointmentDateTime: dateTime || new Date().toISOString(),
        status: apt.status,
      };
    });
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
      let date: Date;
      if (apt.appointmentDateTime) {
        date = new Date(apt.appointmentDateTime);
      } else if (apt.appointmentDate) {
        date = new Date(apt.appointmentDate);
        if (apt.appointmentTime) {
          const [hours, minutes] = apt.appointmentTime.split(':');
          date.setHours(parseInt(hours), parseInt(minutes));
        }
      } else {
        return;
      }

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
      params: { status: 'paid' },
    });
    const invoices = resp.data?.invoices || resp.data?.data?.invoices || resp.data?.data || [];
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
      params: {},
    });
    const invoices = resp.data?.invoices || resp.data?.data?.invoices || resp.data?.data || [];
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
    // 1. Fetch Invoices
    const resp = await billingClient.get('/v1/billing/invoices/search', {
      params: { status: 'paid', pageSize: limit },
    });
    const invoices = resp.data?.invoices || resp.data?.data?.invoices || resp.data?.data || [];

    if (invoices.length === 0) return [];

    // 2. Fetch Patients (to get names)
    // Note: In a real app, we should fetch only specific IDs, but for MVP/Dashboard we fetch a batch
    const patientsResp = await patientClient.get('/v1/patients', {
      params: { page: 1, pageSize: 1000 },
    }).catch(() => ({ data: { data: { patients: [] } } }));

    const patients = patientsResp.data?.data?.patients || [];
    const patientMap = new Map(patients.map((p: any) => [
      p.id || p.patient_id,
      p.personalInfo?.fullName || p.personal_info?.fullName || p.fullName || 'Bệnh nhân'
    ]));

    // 3. Fetch Appointments (to get type/description)
    const appointmentsResp = await appointmentsClient.get('/v1/appointments', {
      params: { page: 1, pageSize: 1000 },
    }).catch(() => ({ data: { data: { appointments: [] } } }));

    const appointments = appointmentsResp.data?.data?.appointments || [];
    const appointmentMap = new Map(appointments.map((apt: any) => [
      apt.appointmentId || apt.id,
      apt
    ]));

    // 4. Map Data
    return invoices.map((inv: any) => {
      const patientName = patientMap.get(inv.patientId) || inv.patientName || 'Bệnh nhân';
      const appointment = appointmentMap.get(inv.appointmentId) as any;

      let description = '';
      if (appointment) {
        description = appointment.appointmentType || 'Khám bệnh';
        // Add time if available
        if (appointment.appointmentTime) {
          description += ` - ${appointment.appointmentTime.slice(0, 5)}`;
        }
      }

      return {
        invoiceId: inv.invoiceId || inv.invoiceNumber || inv.id,
        patientName: patientName,
        amount: Number(inv.totalAmount || inv.amount || 0),
        status: 'PAID',
        method: (String(inv.paymentMethod || 'PayOS').toLowerCase().includes('cash') ? 'Cash' : 'PayOS'),
        createdAt: inv.paidAt || inv.updatedAt || inv.createdAt,
        description: description
      };
    });
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
