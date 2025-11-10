'use client';

import { Calendar, Users, CheckCircle, Clock } from 'lucide-react';
import { DashboardLayout } from '@/components/layout';
import { WelcomeHeader } from '@/components/dashboard/WelcomeHeader';
import { useAuth } from '@/hooks/useAuth';

/**
 * Doctor Dashboard Page
 * Route: /doctor/dashboard
 */
export default function DoctorDashboardPage() {
  const { user } = useAuth();

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Welcome Header */}
        <WelcomeHeader userName={user?.fullName || user?.email || 'Bác sĩ'} />

        {/* Quick Stats */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Lịch hẹn hôm nay"
            value="8"
            icon={Calendar}
            color="blue"
            subtitle="2 đang chờ"
          />
          <StatCard
            title="Bệnh nhân đã khám"
            value="5"
            icon={CheckCircle}
            color="green"
            subtitle="3 còn lại"
          />
          <StatCard
            title="Hàng đợi"
            value="3"
            icon={Users}
            color="orange"
            subtitle="Đang chờ khám"
          />
          <StatCard
            title="Thời gian trung bình"
            value="25 phút"
            icon={Clock}
            color="purple"
            subtitle="Mỗi bệnh nhân"
          />
        </div>

        {/* Today's Schedule */}
        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">
              Lịch làm việc hôm nay
            </h2>
            <span className="text-sm text-gray-600">Thứ Hai, 15/01/2025</span>
          </div>
          <div className="space-y-4">
            <AppointmentCard
              time="09:00 - 09:30"
              patientName="Nguyễn Văn A"
              reason="Khám định kỳ"
              status="completed"
            />
            <AppointmentCard
              time="09:30 - 10:00"
              patientName="Trần Thị B"
              reason="Đau đầu, chóng mặt"
              status="completed"
            />
            <AppointmentCard
              time="10:00 - 10:30"
              patientName="Lê Văn C"
              reason="Tái khám"
              status="in-progress"
            />
            <AppointmentCard
              time="10:30 - 11:00"
              patientName="Phạm Thị D"
              reason="Khám tổng quát"
              status="waiting"
            />
            <AppointmentCard
              time="14:00 - 14:30"
              patientName="Hoàng Văn E"
              reason="Đau bụng"
              status="scheduled"
            />
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid gap-6 md:grid-cols-3">
          <QuickActionCard
            title="Xem hàng đợi"
            description="Quản lý bệnh nhân đang chờ"
            href="/doctor/queue"
            icon={Users}
            count={3}
          />
          <QuickActionCard
            title="Lịch làm việc"
            description="Xem lịch tuần này"
            href="/doctor/schedule"
            icon={Calendar}
          />
          <QuickActionCard
            title="Hồ sơ bệnh án"
            description="Tra cứu hồ sơ bệnh nhân"
            href="/doctor/medical-records"
            icon={CheckCircle}
          />
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
  subtitle?: string;
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
          {subtitle && <p className="mt-1 text-xs text-gray-500">{subtitle}</p>}
        </div>
        <div className={`rounded-full p-3 ${colorClasses}`}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
  );
}

// Appointment Card Component
function AppointmentCard({
  time,
  patientName,
  reason,
  status,
}: {
  time: string;
  patientName: string;
  reason: string;
  status: string;
}) {
  const statusConfig = {
    completed: { label: 'Đã hoàn thành', color: 'bg-green-100 text-green-800' },
    'in-progress': { label: 'Đang khám', color: 'bg-blue-100 text-blue-800' },
    waiting: { label: 'Đang chờ', color: 'bg-yellow-100 text-yellow-800' },
    scheduled: { label: 'Đã đặt lịch', color: 'bg-gray-100 text-gray-800' },
  }[status] || { label: 'Unknown', color: 'bg-gray-100 text-gray-800' };

  return (
    <div className="flex items-center justify-between rounded-lg border p-4 hover:bg-gray-50">
      <div className="flex items-center space-x-4">
        <div className="flex flex-col items-center">
          <Clock className="h-5 w-5 text-gray-400" />
          <span className="mt-1 text-sm font-medium text-gray-900">{time}</span>
        </div>
        <div>
          <p className="font-semibold text-gray-900">{patientName}</p>
          <p className="text-sm text-gray-600">{reason}</p>
        </div>
      </div>
      <span className={`rounded-full px-3 py-1 text-xs font-medium ${statusConfig.color}`}>
        {statusConfig.label}
      </span>
    </div>
  );
}

// Quick Action Card Component
function QuickActionCard({
  title,
  description,
  href,
  icon: Icon,
  count,
}: {
  title: string;
  description: string;
  href: string;
  icon: any;
  count?: number;
}) {
  return (
    <a
      href={href}
      className="relative block rounded-lg border bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
    >
      {count !== undefined && (
        <span className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-red-500 text-sm font-bold text-white">
          {count}
        </span>
      )}
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary-100">
        <Icon className="h-6 w-6 text-primary-600" />
      </div>
      <h3 className="mb-2 font-semibold text-gray-900">{title}</h3>
      <p className="text-sm text-gray-600">{description}</p>
    </a>
  );
}
