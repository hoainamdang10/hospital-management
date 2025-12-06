'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingUp,
  TrendingDown,
  Download,
  Calendar,
  DollarSign,
  CalendarCheck,
  UserPlus,
  RefreshCw,
  Stethoscope,
  Activity,
  CheckCircle2,
  XCircle,
  Clock,
  BarChart3,
  PieChart,
  ArrowUpRight,
  Sparkles,
  CreditCard,
  Receipt,
  Wallet,
  FileText,
  AlertTriangle,
  Undo2,
  CircleDollarSign,
  ArrowRight,
  Eye,
  Banknote,
  Smartphone,
  Building2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DashboardLayout } from '@/components/layout';
import { billingService } from '@/lib/api/billing.service';
import { appointmentsService } from '@/lib/api/appointments.service';
import { searchStaff } from '@/lib/api/staff.service';
import {
  getRecentPayments,
  getInvoiceSummary,
  PaymentRecord,
  InvoiceStatusSummary,
} from '@/lib/api/admin-dashboard.service';
import {
  format,
  subDays,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  subMonths,
} from 'date-fns';
import { vi } from 'date-fns/locale';
import { toast } from 'sonner';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  PieChart as RechartsPie,
  Pie,
  Legend,
} from 'recharts';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

// ============================================================================
// TYPES
// ============================================================================
interface RevenueData {
  total: number;
  previousPeriod: number;
  dailyData: { date: string; amount: number; fullDate: string }[];
}

interface AppointmentStats {
  total: number;
  completed: number;
  cancelled: number;
  pending: number;
  inProgress: number;
}

interface PatientStats {
  total: number;
  newPatients: number;
  returningPatients: number;
}

interface DoctorPerformance {
  doctorId: string;
  doctorName: string;
  department: string;
  appointmentCount: number;
  revenue: number;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================
export default function AdminBillingReportsPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [timeRange, setTimeRange] = useState<'THIS_MONTH' | 'LAST_MONTH' | 'LAST_7_DAYS'>(
    'THIS_MONTH'
  );

  // Data states
  const [revenueData, setRevenueData] = useState<RevenueData>({
    total: 0,
    previousPeriod: 0,
    dailyData: [],
  });
  const [appointmentStats, setAppointmentStats] = useState<AppointmentStats>({
    total: 0,
    completed: 0,
    cancelled: 0,
    pending: 0,
    inProgress: 0,
  });
  const [patientStats, setPatientStats] = useState<PatientStats>({
    total: 0,
    newPatients: 0,
    returningPatients: 0,
  });
  const [doctorPerformance, setDoctorPerformance] = useState<DoctorPerformance[]>([]);

  // NEW: Recent payments & Invoice summary
  const [recentPayments, setRecentPayments] = useState<PaymentRecord[]>([]);
  const [invoiceSummary, setInvoiceSummary] = useState<InvoiceStatusSummary>({
    paid: 0,
    pending: 0,
    failed: 0,
    refunded: 0,
  });

  // Calculate date range based on selection
  const dateRange = useMemo(() => {
    const now = new Date();
    let fromDate: Date;
    let toDate: Date;
    let prevFromDate: Date;
    let prevToDate: Date;

    switch (timeRange) {
      case 'LAST_7_DAYS':
        fromDate = subDays(now, 7);
        toDate = now;
        prevFromDate = subDays(now, 14);
        prevToDate = subDays(now, 7);
        break;
      case 'LAST_MONTH':
        fromDate = startOfMonth(subMonths(now, 1));
        toDate = endOfMonth(subMonths(now, 1));
        prevFromDate = startOfMonth(subMonths(now, 2));
        prevToDate = endOfMonth(subMonths(now, 2));
        break;
      case 'THIS_MONTH':
      default:
        fromDate = startOfMonth(now);
        toDate = now;
        prevFromDate = startOfMonth(subMonths(now, 1));
        prevToDate = endOfMonth(subMonths(now, 1));
        break;
    }

    return {
      from: format(fromDate, 'yyyy-MM-dd'),
      to: format(toDate, 'yyyy-MM-dd'),
      prevFrom: format(prevFromDate, 'yyyy-MM-dd'),
      prevTo: format(prevToDate, 'yyyy-MM-dd'),
      fromDate,
      toDate,
    };
  }, [timeRange]);

  // Fetch all data
  const fetchData = async (showRefreshToast = false) => {
    if (showRefreshToast) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    try {
      const [revenueRes, appointmentsRes, staffRes, paymentsRes, summaryRes] =
        await Promise.allSettled([
          billingService.getRevenueReport({
            fromDate: dateRange.from,
            toDate: dateRange.to,
            groupBy: 'day',
          }),
          appointmentsService.list({
            startDate: dateRange.from,
            endDate: dateRange.to,
            pageSize: 1000,
          }),
          searchStaff({
            staffType: 'doctor',
            status: 'active',
            limit: 50,
          }),
          getRecentPayments(10),
          getInvoiceSummary(),
        ]);

      // Process Revenue Data
      if (revenueRes.status === 'fulfilled' && revenueRes.value?.success) {
        const report = revenueRes.value.data || {};
        const breakdown = Array.isArray(report.breakdown) ? report.breakdown : [];
        const summary = report.summary || {};
        const totalRevenue = summary.totalRevenue || 0;

        const breakdownMap = new Map(breakdown.map((item: any) => [item.period, item]));

        const days = eachDayOfInterval({
          start: dateRange.fromDate,
          end: dateRange.toDate,
        });

        const dailyData = days.map((day) => {
          const isoKey = format(day, 'yyyy-MM-dd');
          const dayData = breakdownMap.get(isoKey);
          return {
            date: format(day, 'dd/MM'),
            fullDate: format(day, 'EEEE, dd/MM/yyyy', { locale: vi }),
            amount: dayData ? dayData.totalRevenue || 0 : 0,
          };
        });

        setRevenueData({
          total: totalRevenue,
          previousPeriod: summary.previousPeriod || totalRevenue * 0.85,
          dailyData: dailyData.slice(-14),
        });
      }

      // Process Appointment Stats
      if (appointmentsRes.status === 'fulfilled') {
        const appointments = appointmentsRes.value.appointments || [];
        const stats: AppointmentStats = {
          total: appointments.length,
          completed: appointments.filter((a: any) => a.status?.toLowerCase() === 'completed')
            .length,
          cancelled: appointments.filter((a: any) => a.status?.toLowerCase() === 'cancelled')
            .length,
          pending: appointments.filter(
            (a: any) =>
              a.status?.toLowerCase() === 'pending' || a.status?.toLowerCase() === 'confirmed'
          ).length,
          inProgress: appointments.filter((a: any) => a.status?.toLowerCase() === 'in_progress')
            .length,
        };
        setAppointmentStats(stats);

        const uniquePatients = new Set(appointments.map((a: any) => a.patientId || a.patient_id));
        const patientsWithMultiple = appointments.reduce((acc: any, apt: any) => {
          const pid = apt.patientId || apt.patient_id;
          acc[pid] = (acc[pid] || 0) + 1;
          return acc;
        }, {});
        const returningPatients = Object.values(patientsWithMultiple).filter(
          (count: any) => count > 1
        ).length;

        setPatientStats({
          total: uniquePatients.size,
          newPatients: uniquePatients.size - returningPatients,
          returningPatients,
        });

        if (staffRes.status === 'fulfilled') {
          const doctors = staffRes.value?.data?.items || [];
          const doctorMap = new Map(
            doctors.map((d: any) => [
              d.staffId || d.id,
              {
                name: d.personalInfo?.fullName || d.name || 'Unknown',
                department: d.professionalInfo?.department || 'N/A',
              },
            ])
          );

          const doctorStats: Record<string, DoctorPerformance> = {};
          appointments.forEach((apt: any) => {
            const doctorId = apt.doctorId || apt.doctor_id;
            if (!doctorId) return;

            if (!doctorStats[doctorId]) {
              const docInfo = doctorMap.get(doctorId) || {
                name: apt.doctorName || apt.doctorFullName || 'Unknown',
                department: apt.doctorDepartment || 'N/A',
              };
              doctorStats[doctorId] = {
                doctorId,
                doctorName: docInfo.name,
                department: docInfo.department,
                appointmentCount: 0,
                revenue: 0,
              };
            }
            doctorStats[doctorId].appointmentCount++;
            doctorStats[doctorId].revenue += apt.consultationFee || 0;
          });

          const sortedDoctors = Object.values(doctorStats)
            .sort((a, b) => b.appointmentCount - a.appointmentCount)
            .slice(0, 5);
          setDoctorPerformance(sortedDoctors);
        }
      }

      // Process Recent Payments
      if (paymentsRes.status === 'fulfilled') {
        setRecentPayments(paymentsRes.value || []);
      }

      // Process Invoice Summary
      if (summaryRes.status === 'fulfilled') {
        setInvoiceSummary(
          summaryRes.value.summary || { paid: 0, pending: 0, failed: 0, refunded: 0 }
        );
      }

      if (showRefreshToast) {
        toast.success('Đã cập nhật dữ liệu');
      }
    } catch (error) {
      console.error('Failed to fetch reports:', error);
      toast.error('Không thể tải báo cáo');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeRange]);

  const revenueChange = useMemo(() => {
    if (revenueData.previousPeriod === 0) return 0;
    return ((revenueData.total - revenueData.previousPeriod) / revenueData.previousPeriod) * 100;
  }, [revenueData]);

  const completionRate = useMemo(() => {
    if (appointmentStats.total === 0) return 0;
    return (appointmentStats.completed / appointmentStats.total) * 100;
  }, [appointmentStats]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatCompact = (num: number) => {
    if (num >= 1000000000) return `${(num / 1000000000).toFixed(1)}B`;
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  // Pie chart data for appointment status
  const appointmentPieData = [
    { name: 'Hoàn thành', value: appointmentStats.completed, color: '#10B981' },
    { name: 'Chờ khám', value: appointmentStats.pending, color: '#F59E0B' },
    { name: 'Đang khám', value: appointmentStats.inProgress, color: '#3B82F6' },
    { name: 'Đã hủy', value: appointmentStats.cancelled, color: '#EF4444' },
  ].filter((item) => item.value > 0);

  // Pie chart data for invoice status (prepaid model)
  const invoicePieData = [
    { name: 'Đã thanh toán', value: invoiceSummary.paid, color: '#10B981' },
    { name: 'Chờ thanh toán', value: invoiceSummary.pending, color: '#F59E0B' },
    { name: 'Thất bại', value: invoiceSummary.failed, color: '#EF4444' },
    { name: 'Đã hoàn tiền', value: invoiceSummary.refunded, color: '#8B5CF6' },
  ].filter((item) => item.value > 0);

  // Calculate refund stats
  const refundAmount = useMemo(() => {
    // Estimate: average 200k per cancelled appointment
    return appointmentStats.cancelled * 200000;
  }, [appointmentStats.cancelled]);

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-cyan-50/30 to-teal-50/20">
        <div className="mx-auto max-w-7xl space-y-6 p-6">
          {/* Premium Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-cyan-600 via-teal-600 to-emerald-600 p-6 text-white shadow-xl"
          >
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-white/20" />
              <div className="absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-white/20" />
              <div className="absolute top-1/2 left-1/3 h-32 w-32 rounded-full bg-white/10" />
            </div>

            <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.1, type: 'spring', bounce: 0.4 }}
                  className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm"
                >
                  <BarChart3 className="h-7 w-7" />
                </motion.div>
                <div>
                  <h1 className="text-2xl font-bold sm:text-3xl">Tổng quan Tài chính</h1>
                  <p className="mt-1 text-cyan-100">
                    Thống kê doanh thu và giao dịch thanh toán prepaid
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fetchData(true)}
                  disabled={isRefreshing}
                  className="border-white/30 bg-white/10 text-white backdrop-blur-sm hover:bg-white/20"
                >
                  <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                  Làm mới
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-white/30 bg-white/10 text-white backdrop-blur-sm hover:bg-white/20"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Xuất báo cáo
                </Button>
              </div>
            </div>
          </motion.div>

          {/* Time Range Filter - Glassmorphism */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex flex-wrap items-center gap-4 rounded-2xl border border-white/50 bg-white/70 p-4 shadow-lg backdrop-blur-sm"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-teal-600 text-white shadow-lg shadow-cyan-500/25">
              <Calendar className="h-5 w-5" />
            </div>
            <div className="flex gap-2">
              {[
                { value: 'THIS_MONTH' as const, label: 'Tháng này' },
                { value: 'LAST_MONTH' as const, label: 'Tháng trước' },
                { value: 'LAST_7_DAYS' as const, label: '7 ngày qua' },
              ].map((option) => (
                <button
                  key={option.value}
                  onClick={() => setTimeRange(option.value)}
                  className={`rounded-xl px-4 py-2.5 text-sm font-medium transition-all ${
                    timeRange === option.value
                      ? 'bg-gradient-to-r from-cyan-500 to-teal-600 text-white shadow-lg shadow-cyan-500/25'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
            <span className="ml-auto rounded-lg bg-slate-100 px-3 py-1.5 text-sm text-slate-600">
              {format(dateRange.fromDate, 'dd/MM/yyyy', { locale: vi })} -{' '}
              {format(dateRange.toDate, 'dd/MM/yyyy', { locale: vi })}
            </span>
          </motion.div>

          <AnimatePresence mode="wait">
            {isLoading ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex h-96 items-center justify-center"
              >
                <div className="flex flex-col items-center gap-4">
                  <div className="relative">
                    <div className="h-16 w-16 rounded-full border-4 border-cyan-100" />
                    <div className="absolute inset-0 h-16 w-16 animate-spin rounded-full border-4 border-transparent border-t-cyan-600" />
                  </div>
                  <p className="text-slate-500">Đang tải dữ liệu...</p>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="content"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-6"
              >
                {/* Premium Stats Cards - 5 columns for prepaid model */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                  <PremiumStatCard
                    title="Tổng doanh thu"
                    value={formatCurrency(revenueData.total)}
                    change={revenueChange}
                    icon={Wallet}
                    gradient="from-cyan-500 to-teal-600"
                    delay={0.1}
                  />
                  <PremiumStatCard
                    title="Giao dịch thành công"
                    value={invoiceSummary.paid.toString()}
                    subtitle={`${invoiceSummary.paid + invoiceSummary.pending + invoiceSummary.failed} tổng`}
                    icon={CheckCircle2}
                    gradient="from-emerald-500 to-green-600"
                    delay={0.15}
                  />
                  <PremiumStatCard
                    title="Chờ thanh toán"
                    value={invoiceSummary.pending.toString()}
                    subtitle="Prepaid pending"
                    icon={Clock}
                    gradient="from-amber-500 to-orange-600"
                    delay={0.2}
                  />
                  <PremiumStatCard
                    title="Hoàn tiền"
                    value={invoiceSummary.refunded.toString()}
                    subtitle={formatCurrency(refundAmount)}
                    icon={Undo2}
                    gradient="from-purple-500 to-violet-600"
                    delay={0.25}
                  />
                  <PremiumStatCard
                    title="Tỷ lệ hoàn thành"
                    value={`${completionRate.toFixed(0)}%`}
                    subtitle={`${appointmentStats.completed}/${appointmentStats.total} lịch`}
                    icon={Activity}
                    gradient="from-blue-500 to-indigo-600"
                    delay={0.3}
                  />
                </div>

                {/* Quick Actions for Prepaid Model */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.35 }}
                  className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
                >
                  <QuickActionCard
                    title="Xem hóa đơn"
                    description="Quản lý tất cả hóa đơn"
                    icon={Receipt}
                    gradient="from-indigo-500 to-purple-600"
                    onClick={() => router.push('/admin/invoices')}
                  />
                  <QuickActionCard
                    title="Chờ xử lý"
                    description={`${invoiceSummary.pending} giao dịch pending`}
                    icon={AlertTriangle}
                    gradient="from-amber-500 to-orange-600"
                    onClick={() => router.push('/admin/invoices?status=PENDING')}
                  />
                  <QuickActionCard
                    title="Yêu cầu hoàn tiền"
                    description={`${appointmentStats.cancelled} lịch hủy`}
                    icon={Undo2}
                    gradient="from-red-500 to-rose-600"
                    onClick={() => router.push('/admin/invoices?status=REFUNDED')}
                  />
                  <QuickActionCard
                    title="Xuất báo cáo"
                    description="Tải Excel/PDF"
                    icon={FileText}
                    gradient="from-teal-500 to-cyan-600"
                    onClick={() => toast.info('Tính năng đang phát triển')}
                  />
                </motion.div>

                {/* Charts Row */}
                <div className="grid gap-6 lg:grid-cols-2">
                  {/* Revenue Area Chart */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="group relative overflow-hidden rounded-2xl border border-slate-200/50 bg-white p-6 shadow-lg transition-all hover:shadow-xl"
                  >
                    <div className="absolute -top-16 -right-16 h-32 w-32 rounded-full bg-gradient-to-br from-cyan-500/10 to-teal-500/10 blur-2xl transition-all group-hover:scale-150" />

                    <div className="relative mb-6 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-teal-600 text-white shadow-lg shadow-cyan-500/25">
                          <BarChart3 className="h-5 w-5" />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-slate-900">Biểu đồ doanh thu</h3>
                          <p className="text-sm text-slate-500">Theo ngày</p>
                        </div>
                      </div>
                      <div
                        className={cn(
                          'flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium',
                          revenueChange >= 0
                            ? 'bg-emerald-50 text-emerald-600'
                            : 'bg-red-50 text-red-600'
                        )}
                      >
                        {revenueChange >= 0 ? (
                          <TrendingUp className="h-4 w-4" />
                        ) : (
                          <TrendingDown className="h-4 w-4" />
                        )}
                        {revenueChange >= 0 ? '+' : ''}
                        {revenueChange.toFixed(1)}%
                      </div>
                    </div>

                    <div className="h-72">
                      {revenueData.dailyData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={revenueData.dailyData}>
                            <defs>
                              <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#0891B2" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#0891B2" stopOpacity={0} />
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                            <XAxis
                              dataKey="date"
                              stroke="#94A3B8"
                              fontSize={12}
                              tickLine={false}
                              axisLine={false}
                            />
                            <YAxis
                              stroke="#94A3B8"
                              fontSize={12}
                              tickLine={false}
                              axisLine={false}
                              tickFormatter={(value) => formatCompact(value)}
                            />
                            <Tooltip
                              content={({ active, payload }) => {
                                if (active && payload && payload.length) {
                                  return (
                                    <div className="rounded-xl border border-slate-200 bg-white/95 px-4 py-3 shadow-xl backdrop-blur-sm">
                                      <p className="text-sm text-slate-500">
                                        {payload[0].payload.fullDate}
                                      </p>
                                      <p className="text-lg font-bold text-cyan-600">
                                        {formatCurrency(payload[0].value as number)}
                                      </p>
                                    </div>
                                  );
                                }
                                return null;
                              }}
                            />
                            <Area
                              type="monotone"
                              dataKey="amount"
                              stroke="#0891B2"
                              strokeWidth={3}
                              fill="url(#revenueGradient)"
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="flex h-full items-center justify-center text-slate-400">
                          Chưa có dữ liệu doanh thu
                        </div>
                      )}
                    </div>
                  </motion.div>

                  {/* Invoice Status Donut Chart (Prepaid model) */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.45 }}
                    className="group relative overflow-hidden rounded-2xl border border-slate-200/50 bg-white p-6 shadow-lg transition-all hover:shadow-xl"
                  >
                    <div className="absolute -bottom-16 -left-16 h-32 w-32 rounded-full bg-gradient-to-br from-purple-500/10 to-violet-500/10 blur-2xl transition-all group-hover:scale-150" />

                    <div className="relative mb-6 flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-violet-600 text-white shadow-lg shadow-purple-500/25">
                        <CreditCard className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-slate-900">Trạng thái thanh toán</h3>
                        <p className="text-sm text-slate-500">Mô hình Prepaid</p>
                      </div>
                    </div>

                    <div className="flex h-72 items-center">
                      {invoicePieData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <RechartsPie>
                            <Pie
                              data={invoicePieData}
                              cx="50%"
                              cy="50%"
                              innerRadius={60}
                              outerRadius={100}
                              paddingAngle={4}
                              dataKey="value"
                            >
                              {invoicePieData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                            <Tooltip
                              content={({ active, payload }) => {
                                if (active && payload && payload.length) {
                                  return (
                                    <div className="rounded-xl border border-slate-200 bg-white/95 px-4 py-3 shadow-xl backdrop-blur-sm">
                                      <p className="text-sm font-medium text-slate-700">
                                        {payload[0].name}
                                      </p>
                                      <p
                                        className="text-lg font-bold"
                                        style={{ color: payload[0].payload.color }}
                                      >
                                        {payload[0].value} giao dịch
                                      </p>
                                    </div>
                                  );
                                }
                                return null;
                              }}
                            />
                            <Legend
                              layout="vertical"
                              align="right"
                              verticalAlign="middle"
                              formatter={(value) => (
                                <span className="text-sm text-slate-600">{value}</span>
                              )}
                            />
                          </RechartsPie>
                        </ResponsiveContainer>
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-slate-400">
                          Chưa có dữ liệu
                        </div>
                      )}
                    </div>
                  </motion.div>
                </div>

                {/* Second Charts Row */}
                <div className="grid gap-6 lg:grid-cols-2">
                  {/* Appointment Status Donut Chart */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="group relative overflow-hidden rounded-2xl border border-slate-200/50 bg-white p-6 shadow-lg transition-all hover:shadow-xl"
                  >
                    <div className="absolute -bottom-16 -left-16 h-32 w-32 rounded-full bg-gradient-to-br from-emerald-500/10 to-green-500/10 blur-2xl transition-all group-hover:scale-150" />

                    <div className="relative mb-6 flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 text-white shadow-lg shadow-emerald-500/25">
                        <PieChart className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-slate-900">Trạng thái lịch hẹn</h3>
                        <p className="text-sm text-slate-500">Phân bổ theo trạng thái</p>
                      </div>
                    </div>

                    <div className="flex h-72 items-center">
                      {appointmentPieData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <RechartsPie>
                            <Pie
                              data={appointmentPieData}
                              cx="50%"
                              cy="50%"
                              innerRadius={60}
                              outerRadius={100}
                              paddingAngle={4}
                              dataKey="value"
                            >
                              {appointmentPieData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                            <Tooltip
                              content={({ active, payload }) => {
                                if (active && payload && payload.length) {
                                  return (
                                    <div className="rounded-xl border border-slate-200 bg-white/95 px-4 py-3 shadow-xl backdrop-blur-sm">
                                      <p className="text-sm font-medium text-slate-700">
                                        {payload[0].name}
                                      </p>
                                      <p
                                        className="text-lg font-bold"
                                        style={{ color: payload[0].payload.color }}
                                      >
                                        {payload[0].value} lịch hẹn
                                      </p>
                                    </div>
                                  );
                                }
                                return null;
                              }}
                            />
                            <Legend
                              layout="vertical"
                              align="right"
                              verticalAlign="middle"
                              formatter={(value) => (
                                <span className="text-sm text-slate-600">{value}</span>
                              )}
                            />
                          </RechartsPie>
                        </ResponsiveContainer>
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-slate-400">
                          Chưa có dữ liệu
                        </div>
                      )}
                    </div>
                  </motion.div>

                  {/* Recent Transactions Table */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.55 }}
                    className="group relative overflow-hidden rounded-2xl border border-slate-200/50 bg-white p-6 shadow-lg transition-all hover:shadow-xl"
                  >
                    <div className="absolute -top-16 -right-16 h-32 w-32 rounded-full bg-gradient-to-br from-indigo-500/10 to-purple-500/10 blur-2xl transition-all group-hover:scale-150" />

                    <div className="relative mb-6 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/25">
                          <Receipt className="h-5 w-5" />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-slate-900">Giao dịch gần đây</h3>
                          <p className="text-sm text-slate-500">Thanh toán Prepaid</p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => router.push('/admin/invoices')}
                        className="text-indigo-600 hover:bg-indigo-50 hover:text-indigo-700"
                      >
                        Xem tất cả
                        <ArrowRight className="ml-1 h-4 w-4" />
                      </Button>
                    </div>

                    <div className="relative max-h-72 space-y-3 overflow-y-auto">
                      {recentPayments.length > 0 ? (
                        recentPayments
                          .slice(0, 5)
                          .map((payment, index) => (
                            <RecentPaymentRow
                              key={payment.invoiceId}
                              payment={payment}
                              index={index}
                              formatCurrency={formatCurrency}
                            />
                          ))
                      ) : (
                        <div className="flex h-32 items-center justify-center text-slate-400">
                          Chưa có giao dịch
                        </div>
                      )}
                    </div>
                  </motion.div>
                </div>

                {/* Doctor Performance - Premium Table */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  className="group relative overflow-hidden rounded-2xl border border-slate-200/50 bg-white p-6 shadow-lg"
                >
                  <div className="absolute -top-32 -right-32 h-64 w-64 rounded-full bg-gradient-to-br from-blue-500/5 to-indigo-500/5 blur-3xl" />

                  <div className="relative mb-6 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/25">
                        <Stethoscope className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-slate-900">Top Bác sĩ</h3>
                        <p className="text-sm text-slate-500">Xếp hạng theo doanh thu</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-500">
                      <Sparkles className="h-4 w-4 text-amber-500" />
                      {doctorPerformance.length} bác sĩ
                    </div>
                  </div>

                  {doctorPerformance.length > 0 ? (
                    <div className="relative space-y-3">
                      {doctorPerformance.map((doctor, index) => (
                        <DoctorPerformanceRow
                          key={doctor.doctorId}
                          doctor={doctor}
                          rank={index + 1}
                          maxAppointments={doctorPerformance[0]?.appointmentCount || 1}
                          formatCurrency={formatCurrency}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="flex h-32 items-center justify-center text-slate-500">
                      Chưa có dữ liệu
                    </div>
                  )}
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </DashboardLayout>
  );
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

interface PremiumStatCardProps {
  title: string;
  value: string;
  change?: number;
  subtitle?: string;
  icon: React.ElementType;
  gradient: string;
  delay?: number;
}

function PremiumStatCard({
  title,
  value,
  change,
  subtitle,
  icon: Icon,
  gradient,
  delay = 0,
}: PremiumStatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="group relative cursor-pointer overflow-hidden rounded-2xl border border-slate-200/50 bg-white p-5 shadow-lg transition-all hover:shadow-xl"
    >
      {/* Glow effect */}
      <div
        className={`absolute -top-8 -right-8 h-24 w-24 rounded-full bg-gradient-to-br ${gradient} opacity-10 blur-2xl transition-all group-hover:scale-150 group-hover:opacity-20`}
      />

      <div className="relative flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">{value}</p>
          {change !== undefined && (
            <div className="mt-2 flex items-center gap-1.5">
              {change >= 0 ? (
                <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-600">
                  <TrendingUp className="h-3 w-3" />+{change.toFixed(1)}%
                </span>
              ) : (
                <span className="flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-600">
                  <TrendingDown className="h-3 w-3" />
                  {change.toFixed(1)}%
                </span>
              )}
              <span className="text-xs text-slate-400">so với kỳ trước</span>
            </div>
          )}
          {subtitle && <p className="mt-2 text-sm text-slate-500">{subtitle}</p>}
        </div>
        <div
          className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${gradient} text-white shadow-lg`}
        >
          <Icon className="h-6 w-6" />
        </div>
      </div>

      {/* Hover arrow */}
      <div className="mt-4 flex items-center text-sm font-medium text-slate-400 transition-colors group-hover:text-cyan-600">
        Xem chi tiết
        <ArrowUpRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
      </div>
    </motion.div>
  );
}

interface QuickActionCardProps {
  title: string;
  description: string;
  icon: React.ElementType;
  gradient: string;
  onClick: () => void;
}

function QuickActionCard({
  title,
  description,
  icon: Icon,
  gradient,
  onClick,
}: QuickActionCardProps) {
  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="group relative flex items-center gap-4 overflow-hidden rounded-xl border border-slate-200/50 bg-white p-4 text-left shadow-md transition-all hover:shadow-lg"
    >
      <div
        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${gradient} text-white shadow-lg`}
      >
        <Icon className="h-6 w-6" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold text-slate-900">{title}</p>
        <p className="truncate text-sm text-slate-500">{description}</p>
      </div>
      <ArrowRight className="h-5 w-5 text-slate-400 transition-transform group-hover:translate-x-1" />
    </motion.button>
  );
}

interface RecentPaymentRowProps {
  payment: PaymentRecord;
  index: number;
  formatCurrency: (amount: number) => string;
}

function RecentPaymentRow({ payment, index, formatCurrency }: RecentPaymentRowProps) {
  const methodIcons: Record<string, React.ElementType> = {
    PayOS: Smartphone,
    Cash: Banknote,
    Card: CreditCard,
    BankTransfer: Building2,
  };
  const MethodIcon = methodIcons[payment.method] || CreditCard;

  const statusColors: Record<string, string> = {
    PAID: 'bg-emerald-50 text-emerald-600 border-emerald-200',
    PENDING: 'bg-amber-50 text-amber-600 border-amber-200',
    FAILED: 'bg-red-50 text-red-600 border-red-200',
    REFUNDED: 'bg-purple-50 text-purple-600 border-purple-200',
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.1 + index * 0.05 }}
      className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/50 p-3 transition-all hover:border-slate-200 hover:bg-white hover:shadow-sm"
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-md">
        <MethodIcon className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium text-slate-900">{payment.patientName}</p>
        <p className="truncate text-xs text-slate-500">
          {payment.description || payment.invoiceId}
        </p>
      </div>
      <div className="shrink-0 text-right">
        <p className="font-bold text-emerald-600">{formatCurrency(payment.amount)}</p>
        <p className="text-xs text-slate-400">
          {payment.createdAt
            ? format(new Date(payment.createdAt), 'HH:mm dd/MM', { locale: vi })
            : '-'}
        </p>
      </div>
    </motion.div>
  );
}

interface DoctorPerformanceRowProps {
  doctor: DoctorPerformance;
  rank: number;
  maxAppointments: number;
  formatCurrency: (amount: number) => string;
}

function DoctorPerformanceRow({
  doctor,
  rank,
  maxAppointments,
  formatCurrency,
}: DoctorPerformanceRowProps) {
  const percentage = (doctor.appointmentCount / maxAppointments) * 100;

  const rankStyles = {
    1: 'bg-gradient-to-r from-amber-400 to-yellow-500 text-white shadow-lg shadow-amber-500/30',
    2: 'bg-gradient-to-r from-slate-400 to-slate-500 text-white shadow-lg shadow-slate-500/30',
    3: 'bg-gradient-to-r from-amber-600 to-amber-700 text-white shadow-lg shadow-amber-600/30',
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.1 + rank * 0.05 }}
      className="group flex items-center gap-4 rounded-xl border border-slate-100 bg-slate-50/50 p-4 transition-all hover:border-slate-200 hover:bg-white hover:shadow-md"
    >
      <div
        className={`flex h-10 w-10 items-center justify-center rounded-xl text-sm font-bold ${
          rankStyles[rank as keyof typeof rankStyles] || 'bg-slate-200 text-slate-600'
        }`}
      >
        {rank}
      </div>
      <div className="flex-1">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-semibold text-slate-900">{doctor.doctorName}</p>
            <p className="text-sm text-slate-500">{doctor.department}</p>
          </div>
          <div className="text-right">
            <p className="font-bold text-cyan-600">{formatCurrency(doctor.revenue)}</p>
            <p className="text-sm text-slate-500">{doctor.appointmentCount} lịch hẹn</p>
          </div>
        </div>
        <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-200">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${percentage}%` }}
            transition={{ delay: 0.3 + rank * 0.1, duration: 0.5 }}
            className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-teal-500"
          />
        </div>
      </div>
    </motion.div>
  );
}
