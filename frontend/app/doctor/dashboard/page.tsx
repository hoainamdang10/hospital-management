'use client';

import { useState, useEffect } from 'react';
import { Calendar, Users, CheckCircle, Clock } from 'lucide-react';
import { DashboardLayout } from '@/components/layout';
import { DoctorWelcomeHeader } from '@/components/dashboard/DoctorWelcomeHeader';
import { useAuth } from '@/hooks/useAuth';
import { getDoctorDashboardStats, DoctorDashboardStats } from '@/lib/api/doctor-dashboard.service';
import { Skeleton } from '@/components/ui/skeleton';
import { DoctorAppointmentsCalendar } from '@/components/dashboard/DoctorAppointmentsCalendar';

/**
 * Doctor Dashboard Page
 * Route: /doctor/dashboard
 */
export default function DoctorDashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DoctorDashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const effectiveUserId = user.userId || user.id;
    if (!effectiveUserId) return;

    let canceled = false;
    setLoading(true);
    getDoctorDashboardStats(effectiveUserId)
      .then((data) => {
        if (!canceled) {
          setStats(data);
        }
      })
      .catch((error) => {
        console.error('Failed to load dashboard stats:', error);
      })
      .finally(() => {
        if (!canceled) {
          setLoading(false);
        }
      });

    return () => {
      canceled = true;
    };
  }, [user]);

  const getCurrentDate = () => {
    return new Date().toLocaleDateString('vi-VN', {
      weekday: 'long',
      day: 'numeric',
      month: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Welcome Header */}
        <DoctorWelcomeHeader userName={user?.fullName || user?.email || 'Bác sĩ'} />

        {/* Quick Stats */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {loading ? (
            <>
              <Skeleton className="h-32 rounded-lg" />
              <Skeleton className="h-32 rounded-lg" />
              <Skeleton className="h-32 rounded-lg" />
              <Skeleton className="h-32 rounded-lg" />
            </>
          ) : (
            <>
              <StatCard
                title="Lịch hẹn hôm nay"
                value={stats?.todayAppointmentsCount.toString() || '0'}
                icon={Calendar}
                color="blue"
                subtitle={
                  <span className="flex items-center gap-2 text-xs">
                    <span className="font-medium text-green-600">
                      {stats?.paidCount || 0} Đã thanh toán
                    </span>
                    <span className="text-gray-300">|</span>
                    <span className="font-medium text-red-500">
                      {stats?.unpaidCount || 0} Chưa thanh toán
                    </span>
                  </span>
                }
              />
              <StatCard
                title="Bệnh nhân đã khám"
                value={stats?.completedCount.toString() || '0'}
                icon={CheckCircle}
                color="green"
                subtitle={`${stats?.remainingCount || 0} còn lại`}
              />
              <StatCard
                title="Tỉ lệ thanh toán"
                value={`${stats?.paymentRate || 0}%`}
                icon={CheckCircle}
                color="green"
                subtitle={`${stats?.paidCount || 0}/${stats?.todayAppointmentsCount || 0} đã thanh toán`}
              />
              <StatCard
                title="Thời gian trung bình"
                value={`${stats?.averageTimeMinutes || 0} phút`}
                icon={Clock}
                color="purple"
                subtitle="Mỗi bệnh nhân"
              />
            </>
          )}
        </div>

        {/* Main Content Grid - Similar to Patient Dashboard */}
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Left Column (Calendar View) */}
          <div className="space-y-8 lg:col-span-2">
            <DoctorAppointmentsCalendar
              appointments={stats?.todayAppointments || []}
              loading={loading}
            />
          </div>

          {/* Right Column (Quick Info) */}
          <div className="space-y-6">
            <div className="rounded-3xl border border-white/50 bg-white/60 p-6 shadow-xl backdrop-blur-xl">
              <h3 className="mb-4 text-lg font-bold text-gray-900">Hành động nhanh</h3>
              <div className="space-y-3">
                <a
                  href="/doctor/appointments"
                  className="flex items-center gap-3 rounded-xl bg-white/50 p-4 transition-all hover:bg-white hover:shadow-md"
                >
                  <Calendar className="h-5 w-5 text-blue-600" />
                  <div>
                    <div className="font-semibold text-gray-900">Danh sách khám</div>
                    <div className="text-xs text-gray-500">Xem tất cả lịch hẹn</div>
                  </div>
                </a>
                <a
                  href="/doctor/schedule"
                  className="flex items-center gap-3 rounded-xl bg-white/50 p-4 transition-all hover:bg-white hover:shadow-md"
                >
                  <Clock className="h-5 w-5 text-purple-600" />
                  <div>
                    <div className="font-semibold text-gray-900">Lịch làm việc</div>
                    <div className="text-xs text-gray-500">Quản lý lịch tuần</div>
                  </div>
                </a>
                <a
                  href="/doctor/profile"
                  className="flex items-center gap-3 rounded-xl bg-white/50 p-4 transition-all hover:bg-white hover:shadow-md"
                >
                  <Users className="h-5 w-5 text-green-600" />
                  <div>
                    <div className="font-semibold text-gray-900">Hồ sơ cá nhân</div>
                    <div className="text-xs text-gray-500">Thông tin & cài đặt</div>
                  </div>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

// Stat Card Component
function StatCard({
  title,
  value,
  icon: Icon,
  color,
  subtitle,
}: {
  title: string;
  value: string;
  icon: any;
  color: string;
  subtitle?: React.ReactNode;
}) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    orange: 'bg-orange-50 text-orange-600',
    purple: 'bg-purple-50 text-purple-600',
  }[color];

  return (
    <div className="rounded-lg border bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600">{title}</p>
          <p className="mt-2 text-3xl font-bold text-gray-900">{value}</p>
          {subtitle && <div className="mt-1">{subtitle}</div>}
        </div>
        <div className={`rounded-full p-3 ${colorClasses}`}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
  );
}
