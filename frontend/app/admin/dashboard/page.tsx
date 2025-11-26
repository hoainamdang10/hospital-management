'use client';

import { useState, useEffect } from 'react';
import {
  Users,
  Calendar,
  DollarSign,
  TrendingUp,
  Clock,
  Loader2,
  CreditCard,
  Activity,
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight,
  MoreHorizontal,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout';
import { WelcomeHeader } from '@/components/dashboard/WelcomeHeader';
import { useAuth } from '@/hooks/useAuth';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import {
  getAdminDashboardStats,
  getRecentAppointments,
  getMonthlyStats,
  getInvoiceSummary,
  getRevenueTrend,
  getInvoiceStatusDistribution,
  getRecentPayments,
  getRecentWebhooks,
  getTodayCheckInCount,
  formatCurrency,
  formatNumber,
  type AdminDashboardStats,
  type RecentAppointment,
  type MonthlyStats,
  type InvoiceStatusSummary,
  type PaymentRecord,
  type WebhookEvent
} from '@/lib/api/admin-dashboard.service';

/**
 * Admin Dashboard Page
 * Route: /admin/dashboard
 * 
 * Optimized for "Booking Online & Prepaid" model.
 * Focuses on Revenue, Booking Status, and Payment Health.
 */
export default function AdminDashboardPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [isLoading, setIsLoading] = useState(true);

  // State
  const [stats, setStats] = useState<AdminDashboardStats>({
    totalRevenue: 0,
    revenueChange: '0%',
    totalAppointments: 0,
    appointmentsChange: '0%',
    totalPatients: 0,
    patientsChange: '0%',
    totalStaff: 0,
    staffChange: '0',
  });
  const [recentAppointments, setRecentAppointments] = useState<RecentAppointment[]>([]);
  const [chartData, setChartData] = useState<MonthlyStats[]>([]);
  const [invoiceSummary, setInvoiceSummary] = useState<InvoiceStatusSummary>({ paid: 0, pending: 0, failed: 0, refunded: 0 });
  const [todayRevenue, setTodayRevenue] = useState<{ payos: number; cash: number }>({ payos: 0, cash: 0 });
  const [revenueTrend, setRevenueTrend] = useState<{ date: string; amount: number }[]>([]);
  const [recentPayments, setRecentPayments] = useState<PaymentRecord[]>([]);
  const [webhookEvents, setWebhookEvents] = useState<WebhookEvent[]>([]);
  const [checkInSummary, setCheckInSummary] = useState<{ checkedIn: number; total: number }>({ checkedIn: 0, total: 0 });

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);

      const [
        statsData,
        appointmentsData,
        monthlyData,
        invoiceData,
        revenueTrendData,
        invoiceDistData,
        recentPaymentsData,
        webhookEventsData,
        checkInData
      ] = await Promise.all([
        getAdminDashboardStats(),
        getRecentAppointments(5),
        getMonthlyStats(),
        getInvoiceSummary(),
        getRevenueTrend(14),
        getInvoiceStatusDistribution(),
        getRecentPayments(8),
        getRecentWebhooks(8),
        getTodayCheckInCount()
      ]);

      setStats(statsData);
      setRecentAppointments(appointmentsData);
      setChartData(monthlyData);
      setInvoiceSummary(invoiceData.summary);
      setTodayRevenue(invoiceData.todayRevenue);
      setRevenueTrend(revenueTrendData);
      setRecentPayments(recentPaymentsData);
      setWebhookEvents(webhookEventsData);
      setCheckInSummary(checkInData);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Helper for bar chart height
  const getHeightClass = (height: number) => {
    if (height <= 20) return 'h-[20px]';
    if (height <= 40) return 'h-[40px]';
    if (height <= 60) return 'h-[60px]';
    if (height <= 80) return 'h-[80px]';
    if (height <= 100) return 'h-[100px]';
    if (height <= 120) return 'h-[120px]';
    if (height <= 140) return 'h-[140px]';
    if (height <= 160) return 'h-[160px]';
    if (height <= 180) return 'h-[180px]';
    return 'h-[200px]';
  };

  return (
    <DashboardLayout>
      <div className="space-y-8 pb-10">

        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <WelcomeHeader userName={user?.fullName || user?.email || 'Quản trị viên'} />
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500 bg-white px-3 py-1.5 rounded-full border border-gray-200 shadow-sm flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></div>
              Hệ thống hoạt động bình thường
            </span>
          </div>
        </div>

        {/* Key Metrics Grid - 4 Columns for better focus */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Tổng doanh thu"
            value={formatCurrency(stats.totalRevenue)}
            change={stats.revenueChange}
            trend="up"
            subtitle="tháng này"
            icon={DollarSign}
            color="blue"
            isLoading={isLoading}
          />
          <StatCard
            title="Lịch hẹn hôm nay"
            value={formatNumber(checkInSummary.total)}
            change={stats.appointmentsChange}
            trend="up"
            subtitle={`${checkInSummary.checkedIn} đã check-in`}
            icon={Calendar}
            color="emerald"
            isLoading={isLoading}
          />
          <StatCard
            title="Bệnh nhân mới"
            value={formatNumber(stats.totalPatients)}
            change={stats.patientsChange}
            trend="up"
            subtitle="tổng số bệnh nhân"
            icon={Users}
            color="indigo"
            isLoading={isLoading}
          />
          <StatCard
            title="Cần xử lý"
            value={formatNumber(invoiceSummary.pending + invoiceSummary.failed)}
            change={invoiceSummary.failed > 0 ? '+1' : '0'}
            trend={invoiceSummary.failed > 0 ? 'down' : 'neutral'}
            subtitle="thanh toán lỗi / chờ"
            icon={AlertCircle}
            color="amber"
            isLoading={isLoading}
          />
        </div>

        {/* Charts Section */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Revenue Trend - Takes 2/3 width */}
          <div className="lg:col-span-2 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <Activity className="h-5 w-5 text-blue-500" />
                  Xu hướng doanh thu
                </h3>
                <p className="text-sm text-gray-500 mt-1">Doanh thu 14 ngày gần nhất (Prepaid & Tại quầy)</p>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-blue-50 text-blue-700 font-medium">
                  <div className="h-2 w-2 rounded-full bg-blue-500"></div> PayOS
                </span>
                <span className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-gray-50 text-gray-600">
                  <div className="h-2 w-2 rounded-full bg-gray-400"></div> Tiền mặt
                </span>
              </div>
            </div>

            <div className="mt-4">
              {isLoading ? (
                <div className="flex h-64 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-blue-500" /></div>
              ) : (
                <div className="flex h-64 items-end justify-between gap-2 px-2">
                  {revenueTrend.map((d, i) => {
                    const max = Math.max(...revenueTrend.map(x => x.amount), 1);
                    const h = (d.amount / max) * 200; // max height 200px
                    const label = d.date.slice(5); // MM-DD
                    return (
                      <div key={i} className="flex flex-1 flex-col items-center gap-2 group cursor-pointer">
                        <div className="relative w-full flex items-end justify-center h-[200px]">
                          <div
                            className="w-full max-w-[40px] rounded-t-lg bg-gradient-to-t from-blue-500 to-blue-400 opacity-80 group-hover:opacity-100 transition-all duration-300"
                            style={{ height: `${Math.max(h, 4)}px` }}
                          ></div>
                          {/* Tooltip */}
                          <div className="absolute bottom-full mb-2 hidden group-hover:block z-10">
                            <div className="bg-gray-900 text-white text-xs rounded py-1 px-2 whitespace-nowrap shadow-lg">
                              {formatCurrency(d.amount)}
                            </div>
                          </div>
                        </div>
                        <span className="text-[10px] sm:text-xs text-gray-400 font-medium">{label}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Invoice Status - Takes 1/3 width */}
          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm flex flex-col">
            <div className="mb-6">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-emerald-500" />
                Trạng thái thanh toán
              </h3>
              <p className="text-sm text-gray-500 mt-1">Tỷ lệ thanh toán thành công</p>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center relative">
              {isLoading ? (
                <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
              ) : (
                <>
                  <svg viewBox="0 0 42 42" className="h-48 w-48 transform -rotate-90">
                    <circle cx="21" cy="21" r="15.915" fill="transparent" stroke="#f3f4f6" strokeWidth="4" />
                    {(() => {
                      const total = Math.max(invoiceSummary.paid + invoiceSummary.pending + invoiceSummary.failed + invoiceSummary.refunded, 1);
                      const segments = [
                        { value: invoiceSummary.paid, color: '#10b981' }, // Emerald
                        { value: invoiceSummary.pending, color: '#f59e0b' }, // Amber
                        { value: invoiceSummary.failed, color: '#ef4444' }, // Red
                        { value: invoiceSummary.refunded, color: '#6366f1' }, // Indigo
                      ];
                      let cumulative = 0;
                      return segments.map((s, i) => {
                        const pct = (s.value / total) * 100;
                        const dashArray = `${pct} ${100 - pct}`;
                        const dashOffset = 100 - cumulative; // SVG dashoffset works backwards
                        cumulative += pct;
                        return (
                          <circle
                            key={i}
                            cx="21" cy="21" r="15.915"
                            fill="transparent"
                            stroke={s.color}
                            strokeWidth="4"
                            strokeDasharray={dashArray}
                            strokeDashoffset={dashOffset}
                            className="transition-all duration-1000 ease-out"
                          />
                        );
                      });
                    })()}
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-3xl font-bold text-gray-900">{invoiceSummary.paid}</span>
                    <span className="text-xs text-gray-500 font-medium uppercase tracking-wide">Đã thanh toán</span>
                  </div>
                </>
              )}
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3">
              <div className="flex items-center gap-2 p-2 rounded-lg bg-emerald-50/50">
                <div className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                <div className="flex flex-col">
                  <span className="text-xs text-gray-500">Thành công</span>
                  <span className="text-sm font-bold text-gray-900">{invoiceSummary.paid}</span>
                </div>
              </div>
              <div className="flex items-center gap-2 p-2 rounded-lg bg-amber-50/50">
                <div className="h-2.5 w-2.5 rounded-full bg-amber-500" />
                <div className="flex flex-col">
                  <span className="text-xs text-gray-500">Chờ xử lý</span>
                  <span className="text-sm font-bold text-gray-900">{invoiceSummary.pending}</span>
                </div>
              </div>
              <div className="flex items-center gap-2 p-2 rounded-lg bg-red-50/50">
                <div className="h-2.5 w-2.5 rounded-full bg-red-500" />
                <div className="flex flex-col">
                  <span className="text-xs text-gray-500">Thất bại</span>
                  <span className="text-sm font-bold text-gray-900">{invoiceSummary.failed}</span>
                </div>
              </div>
              <div className="flex items-center gap-2 p-2 rounded-lg bg-indigo-50/50">
                <div className="h-2.5 w-2.5 rounded-full bg-indigo-500" />
                <div className="flex flex-col">
                  <span className="text-xs text-gray-500">Hoàn tiền</span>
                  <span className="text-sm font-bold text-gray-900">{invoiceSummary.refunded}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity Section */}
        <div className="grid gap-6 lg:grid-cols-2">

          {/* Recent Appointments */}
          <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-50 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Lịch hẹn gần đây</h3>
                <p className="text-sm text-gray-500">Các cuộc hẹn sắp tới và vừa qua</p>
              </div>
              <button className="text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-colors">
                Xem tất cả
              </button>
            </div>

            <div className="p-0">
              {isLoading ? (
                <div className="flex h-48 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-gray-400" /></div>
              ) : recentAppointments.length === 0 ? (
                <div className="flex h-48 flex-col items-center justify-center text-gray-500 gap-2">
                  <Calendar className="h-8 w-8 text-gray-300" />
                  <p>Chưa có lịch hẹn nào</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {recentAppointments.map((apt) => (
                    <div key={apt.id} className="p-4 hover:bg-gray-50/50 transition-colors flex items-center justify-between group">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-sm">
                          {apt.patientName.charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{apt.patientName}</p>
                          <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                            <Clock className="h-3 w-3" />
                            {format(new Date(apt.appointmentDateTime), 'HH:mm dd/MM', { locale: vi })}
                            <span className="text-gray-300">•</span>
                            <span>{apt.appointmentType}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${apt.status === 'CONFIRMED' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                          apt.status === 'PENDING' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                            apt.status === 'COMPLETED' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                              'bg-gray-50 text-gray-600 border-gray-100'
                          }`}>
                          {apt.status === 'CONFIRMED' ? 'Đã xác nhận' :
                            apt.status === 'PENDING' ? 'Chờ xác nhận' :
                              apt.status === 'COMPLETED' ? 'Hoàn thành' : apt.status}
                        </span>
                        <button className="text-gray-400 hover:text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity">
                          <MoreHorizontal className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Recent Payments */}
          <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-50 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Giao dịch mới nhất</h3>
                <p className="text-sm text-gray-500">Lịch sử thanh toán PayOS & Tiền mặt</p>
              </div>
              <button className="text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-colors">
                Xem tất cả
              </button>
            </div>

            <div className="p-0">
              {isLoading ? (
                <div className="flex h-48 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-gray-400" /></div>
              ) : recentPayments.length === 0 ? (
                <div className="flex h-48 flex-col items-center justify-center text-gray-500 gap-2">
                  <CreditCard className="h-8 w-8 text-gray-300" />
                  <p>Chưa có giao dịch nào</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {recentPayments.map((p, idx) => (
                    <div key={idx} className="p-4 hover:bg-gray-50/50 transition-colors flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`h-10 w-10 rounded-full flex items-center justify-center ${p.status === 'PAID' ? 'bg-emerald-50 text-emerald-600' :
                          p.status === 'PENDING' ? 'bg-amber-50 text-amber-600' :
                            'bg-red-50 text-red-600'
                          }`}>
                          {p.status === 'PAID' ? <CheckCircle2 className="h-5 w-5" /> :
                            p.status === 'PENDING' ? <Clock className="h-5 w-5" /> :
                              <XCircle className="h-5 w-5" />}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{p.patientName}</p>
                          <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                            {p.description && (
                              <>
                                <span className="font-medium text-blue-600">{p.description}</span>
                                <span className="text-gray-300">•</span>
                              </>
                            )}
                            <span className="font-mono">{p.invoiceId}</span>
                            <span className="text-gray-300">•</span>
                            <span>{format(new Date(p.createdAt), 'HH:mm dd/MM', { locale: vi })}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-gray-900">{formatCurrency(p.amount)}</p>
                        <p className="text-xs text-gray-500">{p.method}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </DashboardLayout>
  );
}

// --- Components ---

interface StatCardProps {
  title: string;
  value: string;
  change: string;
  trend: 'up' | 'down' | 'neutral';
  subtitle: string;
  icon: any;
  color: 'blue' | 'emerald' | 'indigo' | 'amber' | 'red' | 'purple';
  isLoading?: boolean;
}

function StatCard({ title, value, change, trend, subtitle, icon: Icon, color, isLoading = false }: StatCardProps) {
  const colorStyles = {
    blue: 'bg-blue-50 text-blue-600 ring-blue-100',
    emerald: 'bg-emerald-50 text-emerald-600 ring-emerald-100',
    indigo: 'bg-indigo-50 text-indigo-600 ring-indigo-100',
    amber: 'bg-amber-50 text-amber-600 ring-amber-100',
    red: 'bg-red-50 text-red-600 ring-red-100',
    purple: 'bg-purple-50 text-purple-600 ring-purple-100',
  };

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-0.5">
      <div className="flex items-start justify-between">
        <div className="relative z-10">
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <div className="mt-2 flex items-baseline gap-2">
            {isLoading ? (
              <div className="h-8 w-24 animate-pulse rounded bg-gray-100" />
            ) : (
              <h3 className="text-2xl font-bold text-gray-900 tracking-tight">{value}</h3>
            )}
          </div>
        </div>
        <div className={`rounded-xl p-2.5 ring-1 ${colorStyles[color]} transition-colors`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>

      <div className="mt-4 flex items-center gap-2">
        {isLoading ? (
          <div className="h-4 w-16 animate-pulse rounded bg-gray-100" />
        ) : (
          <>
            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${trend === 'up' ? 'bg-emerald-50 text-emerald-700' :
              trend === 'down' ? 'bg-red-50 text-red-700' :
                'bg-gray-50 text-gray-600'
              }`}>
              {trend === 'up' ? <ArrowUpRight className="h-3 w-3" /> :
                trend === 'down' ? <ArrowDownRight className="h-3 w-3" /> : null}
              {change}
            </span>
            <span className="text-xs text-gray-400">{subtitle}</span>
          </>
        )}
      </div>

      {/* Decorative background blob */}
      <div className={`absolute -right-6 -top-6 h-24 w-24 rounded-full opacity-0 transition-opacity group-hover:opacity-10 ${colorStyles[color].split(' ')[0]}`} />
    </div>
  );
}
