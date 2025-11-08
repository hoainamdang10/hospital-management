'use client';

import { useState, useEffect } from 'react';
import { Users, Calendar, DollarSign, UserCog, TrendingUp, Clock, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { DashboardLayout } from '@/components/layout';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { 
  getAdminDashboardStats, 
  getRecentAppointments, 
  getMonthlyStats,
  formatCurrency,
  formatNumber,
  type AdminDashboardStats,
  type RecentAppointment,
  type MonthlyStats
} from '@/lib/api/admin-dashboard.service';

/**
 * Admin Dashboard Page
 * Route: /admin/dashboard
 */
export default function AdminDashboardPage() {
  const [dateRange, setDateRange] = useState('Nov 01, 2025 - Nov 07, 2025');
  const [activeTab, setActiveTab] = useState('overview');
  const [isLoading, setIsLoading] = useState(true);
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

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      
      // Fetch all data in parallel
      const [statsData, appointmentsData, monthlyData] = await Promise.all([
        getAdminDashboardStats(),
        getRecentAppointments(3),
        getMonthlyStats(),
      ]);

      setStats(statsData);
      setRecentAppointments(appointmentsData);
      setChartData(monthlyData);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Bảng điều khiển</h1>
            <p className="mt-1 text-sm text-gray-600">
              Chào mừng trở lại, Quản trị viên! Đây là những gì đang diễn ra hôm nay.
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <button className="flex items-center space-x-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
              <Calendar className="h-4 w-4" />
              <span>{dateRange}</span>
            </button>
            <button className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-600">
              Xuất báo cáo
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Tổng doanh thu"
            value={formatCurrency(stats.totalRevenue)}
            change={stats.revenueChange}
            subtitle="so với tháng trước"
            icon={DollarSign}
            iconColor="text-emerald-600"
            iconBg="bg-emerald-50"
            isLoading={isLoading}
          />
          <StatCard
            title="Lịch hẹn"
            value={formatNumber(stats.totalAppointments)}
            change={stats.appointmentsChange}
            subtitle="so với tháng trước"
            icon={Calendar}
            iconColor="text-blue-600"
            iconBg="bg-blue-50"
            isLoading={isLoading}
          />
          <StatCard
            title="Bệnh nhân"
            value={formatNumber(stats.totalPatients)}
            change={stats.patientsChange}
            subtitle="so với tháng trước"
            icon={Users}
            iconColor="text-amber-600"
            iconBg="bg-amber-50"
            isLoading={isLoading}
          />
          <StatCard
            title="Nhân viên"
            value={formatNumber(stats.totalStaff)}
            change={stats.staffChange}
            subtitle="nhân viên mới tháng này"
            icon={UserCog}
            iconColor="text-purple-600"
            iconBg="bg-purple-50"
            isLoading={isLoading}
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Chart Section */}
          <div className="lg:col-span-2">
            <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
              {/* Tabs */}
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

              {/* Chart Content */}
              <div className="p-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Tổng quan</h3>
                  <p className="text-sm text-gray-500">Số lượng bệnh nhân và doanh thu trong kỳ hiện tại.</p>
                </div>

                {/* Simple Bar Chart */}
                <div className="mt-8">
                  {isLoading ? (
                    <div className="flex h-64 items-center justify-center">
                      <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                    </div>
                  ) : (
                    <div className="flex h-64 items-end justify-between space-x-2">
                      {chartData.map((data, index) => {
                        const maxPatients = Math.max(...chartData.map(d => d.patients), 1);
                        const height = (data.patients / maxPatients) * 200;
                        
                        return (
                          <div key={index} className="flex flex-1 flex-col items-center space-y-2">
                            <div className="relative w-full group">
                              <div
                                className="w-full rounded-t-lg bg-blue-500 transition-all hover:bg-blue-600"
                                style={{ height: `${height}px` }}
                                title={`${data.month}: ${data.patients} bệnh nhân`}
                              />
                              {/* Tooltip on hover */}
                              <div className="absolute bottom-full left-1/2 mb-2 hidden -translate-x-1/2 rounded bg-gray-900 px-2 py-1 text-xs text-white group-hover:block">
                                {data.patients} BN
                              </div>
                            </div>
                            <span className="text-xs text-gray-500">{data.month}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                  <div className="mt-4 flex items-center justify-center space-x-6 text-sm">
                    <div className="flex items-center space-x-2">
                      <div className="h-3 w-3 rounded-full bg-blue-500" />
                      <span className="text-gray-600">Bệnh nhân</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="h-3 w-3 rounded-full bg-emerald-500" />
                      <span className="text-gray-600">Doanh thu</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Appointments */}
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
