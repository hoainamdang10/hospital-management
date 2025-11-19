'use client';

import { useState, useEffect } from 'react';
import { Users, Calendar, DollarSign, UserCog, TrendingUp, Clock, Loader2 } from 'lucide-react';
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
 */
export default function AdminDashboardPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [isLoading, setIsLoading] = useState(true);
  
  // Helper function to map height to Tailwind class
  const getHeightClass = (height: number) => {
    // Map height values to Tailwind's arbitrary value classes
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
      
      // Fetch all data in parallel
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

  return (
    <DashboardLayout>
      <div className="space-y-6">
        
        <WelcomeHeader userName={user?.fullName || user?.email || 'Quản trị viên'} />

        
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-6">
          <StatCard
            title="Lịch hẹn hôm nay"
            value={formatNumber(checkInSummary.total)}
            change={stats.revenueChange}
            subtitle="tổng số lịch trong ngày"
            icon={Calendar}
            iconColor="text-blue-600"
            iconBg="bg-blue-50"
            isLoading={isLoading}
          />
          <StatCard
            title="Check-in hôm nay"
            value={`${formatNumber(checkInSummary.checkedIn)} / ${formatNumber(checkInSummary.total)}`}
            change={stats.appointmentsChange}
            subtitle="đã check-in / tổng lịch"
            icon={Users}
            iconColor="text-emerald-600"
            iconBg="bg-emerald-50"
            isLoading={isLoading}
          />
          <StatCard
            title="Doanh thu hôm nay"
            value={`${formatCurrency(todayRevenue.payos + todayRevenue.cash)}`}
            change={stats.revenueChange}
            subtitle={`PayOS ${formatCurrency(todayRevenue.payos)} · Tiền mặt ${formatCurrency(todayRevenue.cash)}`}
            icon={DollarSign}
            iconColor="text-amber-600"
            iconBg="bg-amber-50"
            isLoading={isLoading}
          />
          <StatCard
            title="Invoice đã thanh toán"
            value={formatNumber(invoiceSummary.paid)}
            change={'+12%'}
            subtitle="so với hôm qua"
            icon={UserCog}
            iconColor="text-purple-600"
            iconBg="bg-purple-50"
            isLoading={isLoading}
          />
          <StatCard
            title="Đang chờ thanh toán"
            value={formatNumber(invoiceSummary.pending)}
            change={'-5%'}
            subtitle="so với tuần trước"
            icon={TrendingUp}
            iconColor="text-indigo-600"
            iconBg="bg-indigo-50"
            isLoading={isLoading}
          />
          <StatCard
            title="Thanh toán lỗi / webhook lỗi"
            value={formatNumber(invoiceSummary.failed)}
            change={'+2%'}
            subtitle="24h gần nhất"
            icon={Loader2}
            iconColor="text-red-600"
            iconBg="bg-red-50"
            isLoading={isLoading}
          />
        </div>

        
        <div className="grid gap-6 lg:grid-cols-3">
          
          <div className="lg:col-span-2">
            <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
              
              <div className="border-b border-gray-200 px-6 pt-6">
                <div className="flex space-x-8">
                  <button
                    onClick={() => setActiveTab('overview')}
                    className={`pb-4 text-sm font-medium transition-colors ${
                      activeTab === 'overview'
                        ? 'border-b-2 border-primary text-primary'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    Tổng quan
                  </button>
                  <button
                    onClick={() => setActiveTab('analytics')}
                    className={`pb-4 text-sm font-medium transition-colors ${
                      activeTab === 'analytics'
                        ? 'border-b-2 border-primary text-primary'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    Phân tích
                  </button>
                  <button
                    onClick={() => setActiveTab('reports')}
                    className={`pb-4 text-sm font-medium transition-colors ${
                      activeTab === 'reports'
                        ? 'border-b-2 border-primary text-primary'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    Báo cáo
                  </button>
                  <button
                    onClick={() => setActiveTab('notifications')}
                    className={`pb-4 text-sm font-medium transition-colors ${
                      activeTab === 'notifications'
                        ? 'border-b-2 border-primary text-primary'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    Thông báo
                  </button>
                </div>
              </div>

              
              <div className="p-6">
                <div className="grid gap-6 lg:grid-cols-2">
                  
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Doanh thu theo ngày</h3>
                    <p className="text-sm text-gray-500">14 ngày gần nhất</p>
                    <div className="mt-4">
                      {isLoading ? (
                        <div className="flex h-48 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-gray-400" /></div>
                      ) : (
                        <div className="flex h-48 items-end justify-between space-x-2">
                          {revenueTrend.map((d, i) => {
                            const max = Math.max(...revenueTrend.map(x => x.amount), 1);
                            const h = (d.amount / max) * 160;
                            const label = d.date.slice(5);
                            return (
                              <div key={i} className="flex flex-1 flex-col items-center space-y-2">
                                <div className="relative w-full group">
                                  <div className={`w-full rounded-t-lg bg-emerald-500 ${getHeightClass(h)}`} title={`${label}: ${formatCurrency(d.amount)}`} />
                                  <div className="absolute bottom-full left-1/2 mb-2 hidden -translate-x-1/2 rounded bg-gray-900 px-2 py-1 text-xs text-white group-hover:block">
                                    {formatCurrency(d.amount)}
                                  </div>
                                </div>
                                <span className="text-xs text-gray-500">{label}</span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>

                  
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Trạng thái hóa đơn</h3>
                    <p className="text-sm text-gray-500">Tổng quan Paid/Pending/Failed/Refunded</p>
                    <div className="mt-4 flex items-center justify-center">
                      <svg viewBox="0 0 42 42" className="h-40 w-40">
                        <circle cx="21" cy="21" r="15.915" fill="#f3f4f6" />
                        {(() => {
                          const total = Math.max(invoiceSummary.paid + invoiceSummary.pending + invoiceSummary.failed + invoiceSummary.refunded, 1);
                          const segments = [
                            { value: invoiceSummary.paid, color: '#10b981' },
                            { value: invoiceSummary.pending, color: '#f59e0b' },
                            { value: invoiceSummary.failed, color: '#ef4444' },
                            { value: invoiceSummary.refunded, color: '#6366f1' },
                          ];
                          let cumulative = 0;
                          return segments.map((s, i) => {
                            const pct = (s.value / total) * 100;
                            const dashArray = `${pct} ${100 - pct}`;
                            const dashOffset = 25 + (cumulative / 100) * 100;
                            cumulative += pct;
                            return (
                              <circle key={i} cx="21" cy="21" r="15.915" fill="transparent" stroke={s.color} strokeWidth="6" strokeDasharray={dashArray} strokeDashoffset={dashOffset} />
                            );
                          });
                        })()}
                      </svg>
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                      <div className="flex items-center space-x-2"><span className="h-3 w-3 rounded-full bg-emerald-500" /> <span>Paid: {invoiceSummary.paid}</span></div>
                      <div className="flex items-center space-x-2"><span className="h-3 w-3 rounded-full bg-amber-500" /> <span>Pending: {invoiceSummary.pending}</span></div>
                      <div className="flex items-center space-x-2"><span className="h-3 w-3 rounded-full bg-red-500" /> <span>Failed: {invoiceSummary.failed}</span></div>
                      <div className="flex items-center space-x-2"><span className="h-3 w-3 rounded-full bg-indigo-500" /> <span>Refunded: {invoiceSummary.refunded}</span></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          
          <div className="lg:col-span-1">
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Lịch hẹn gần đây</h3>
                <p className="text-sm text-gray-500">Bạn có {recentAppointments.length} lịch hẹn gần đây.</p>
              </div>

              {isLoading ? (
                <div className="flex h-48 items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                </div>
              ) : recentAppointments.length === 0 ? (
                <div className="flex h-48 items-center justify-center text-gray-500">
                  Không có lịch hẹn nào
                </div>
              ) : (
                <div className="space-y-4">
                  {recentAppointments.map((appointment) => (
                    <AppointmentCard key={appointment.id} appointment={appointment} />
                  ))}
                </div>
              )}

              <button className="mt-6 w-full rounded-lg border border-gray-300 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
                Xem tất cả lịch hẹn
              </button>
            </div>
          </div>
        </div>

        {/* Recent Activity Tables */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Recent Payments */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Thanh toán gần nhất</h3>
              <p className="text-sm text-gray-500">Danh sách 8 giao dịch gần đây</p>
            </div>
            {isLoading ? (
              <div className="flex h-40 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-gray-400" /></div>
            ) : recentPayments.length === 0 ? (
              <div className="flex h-40 items-center justify-center text-gray-500">Không có giao dịch gần đây</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b text-xs text-gray-500">
                      <th className="py-2 text-left">Mã hóa đơn</th>
                      <th className="py-2 text-left">Bệnh nhân</th>
                      <th className="py-2 text-left">Số tiền</th>
                      <th className="py-2 text-left">Trạng thái</th>
                      <th className="py-2 text-left">Thời gian</th>
                      <th className="py-2 text-left">Phương thức</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentPayments.map((p, idx) => (
                      <tr key={idx} className="border-b hover:bg-gray-50">
                        <td className="py-2 font-medium text-gray-900">{p.invoiceId}</td>
                        <td className="py-2 text-gray-700">{p.patientName}</td>
                        <td className="py-2 text-gray-700">{formatCurrency(p.amount)}</td>
                        <td className="py-2">
                          <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            p.status === 'PAID' ? 'bg-emerald-100 text-emerald-700' :
                            p.status === 'PENDING' ? 'bg-amber-100 text-amber-700' :
                            p.status === 'FAILED' ? 'bg-red-100 text-red-700' : 'bg-indigo-100 text-indigo-700'
                          }`}>{p.status}</span>
                        </td>
                        <td className="py-2 text-gray-700">{format(new Date(p.createdAt), 'HH:mm dd/MM', { locale: vi })}</td>
                        <td className="py-2 text-gray-700">{p.method}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Recent Webhooks / Errors */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Webhook / Lỗi hệ thống gần nhất</h3>
                <p className="text-sm text-gray-500">Theo dõi PayOS và integration</p>
              </div>
            </div>
            {isLoading ? (
              <div className="flex h-40 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-gray-400" /></div>
            ) : webhookEvents.length === 0 ? (
              <div className="flex h-40 items-center justify-center text-gray-500">Không có sự kiện gần đây</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b text-xs text-gray-500">
                      <th className="py-2 text-left">Thời gian</th>
                      <th className="py-2 text-left">Endpoint</th>
                      <th className="py-2 text-left">HTTP</th>
                      <th className="py-2 text-left">Invoice</th>
                      <th className="py-2 text-left">Trạng thái</th>
                      <th className="py-2 text-left">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {webhookEvents.map((e, idx) => (
                      <tr key={idx} className="border-b hover:bg-gray-50">
                        <td className="py-2 text-gray-700">{format(new Date(e.timestamp), 'HH:mm dd/MM', { locale: vi })}</td>
                        <td className="py-2 text-gray-700">{e.endpoint}</td>
                        <td className="py-2 text-gray-700">{e.statusCode}</td>
                        <td className="py-2 text-gray-700">{e.invoiceId || '-'}</td>
                        <td className="py-2">
                          <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${e.success ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>{e.success ? 'Success' : 'Failed'}</span>
                        </td>
                        <td className="py-2">
                          <div className="flex items-center space-x-2">
                            <button className="rounded-lg border border-gray-300 px-2 py-1 text-xs text-gray-700 hover:bg-gray-50">Xem chi tiết</button>
                            <button className="rounded-lg border border-primary-300 px-2 py-1 text-xs text-primary-700 hover:bg-primary-50">Replay</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

interface StatCardProps {
  title: string;
  value: string;
  change: string;
  subtitle: string;
  icon: any;
  iconColor: string;
  iconBg: string;
  isLoading?: boolean;
}

function StatCard({ title, value, change, subtitle, icon: Icon, iconColor, iconBg, isLoading = false }: StatCardProps) {
  return (
    <div className="group relative overflow-hidden rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition-all hover:shadow-md">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-2">
            <div className={`rounded-lg p-2 ${iconBg}`}>
              <Icon className={`h-5 w-5 ${iconColor}`} />
            </div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
          </div>
          <div className="mt-4">
            {isLoading ? (
              <div className="flex items-center">
                <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
              </div>
            ) : (
              <>
                <p className="text-3xl font-bold text-gray-900">{value}</p>
                <div className="mt-2 flex items-center space-x-2">
                  <span className="inline-flex items-center text-sm font-medium text-emerald-600">
                    <TrendingUp className="mr-1 h-4 w-4" />
                    {change}
                  </span>
                  <span className="text-sm text-gray-500">{subtitle}</span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

interface AppointmentCardProps {
  appointment: RecentAppointment;
}

function AppointmentCard({ appointment }: AppointmentCardProps) {
  const statusConfig = {
    SCHEDULED: { label: 'Đã lên lịch', color: 'bg-blue-100 text-blue-700' },
    CONFIRMED: { label: 'Đã xác nhận', color: 'bg-emerald-100 text-emerald-700' },
    COMPLETED: { label: 'Hoàn thành', color: 'bg-gray-100 text-gray-700' },
    CANCELLED: { label: 'Đã hủy', color: 'bg-red-100 text-red-700' },
  }[appointment.status];

  const formattedTime = format(new Date(appointment.appointmentDateTime), 'HH:mm, dd/MM/yyyy', { locale: vi });

  return (
    <div className="group rounded-lg border border-gray-200 p-4 transition-all hover:border-primary hover:shadow-sm">
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-sm font-semibold text-gray-700">
            {appointment.patientName.charAt(0)}
          </div>
          <div>
            <p className="font-medium text-gray-900">{appointment.patientName}</p>
            <p className="text-sm text-gray-500">{appointment.appointmentType}</p>
            <div className="mt-1 flex items-center text-xs text-gray-400">
              <Clock className="mr-1 h-3 w-3" />
              {formattedTime}
            </div>
          </div>
        </div>
        <button className="text-gray-400 opacity-0 transition-opacity group-hover:opacity-100">
          •••
        </button>
      </div>
      <div className="mt-3">
        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusConfig.color}`}>
          {statusConfig.label}
        </span>
      </div>
    </div>
  );
}
