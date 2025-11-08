'use client';

import { TrendingUp, Users, Calendar, Activity } from 'lucide-react';
import { DashboardLayout } from '@/components/layout';

/**
 * Admin Analytics Page
 * Route: /admin/analytics
 */
export default function AdminAnalyticsPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Phân tích & Thống kê</h1>
          <p className="mt-2 text-gray-600">Tổng quan hoạt động và xu hướng</p>
        </div>

        {/* Date Filter */}
        <div className="flex items-center space-x-4">
          <select className="rounded-lg border border-gray-300 px-4 py-2">
            <option>7 ngày qua</option>
            <option>30 ngày qua</option>
            <option>3 tháng qua</option>
            <option>6 tháng qua</option>
            <option>1 năm qua</option>
          </select>
        </div>

        {/* Key Metrics */}
        <div className="grid gap-6 md:grid-cols-4">
          <MetricCard
            title="Tổng lượt khám"
            value="1,234"
            change="+12%"
            trend="up"
            icon={Activity}
          />
          <MetricCard
            title="Bệnh nhân mới"
            value="156"
            change="+8%"
            trend="up"
            icon={Users}
          />
          <MetricCard
            title="Lịch hẹn"
            value="890"
            change="+15%"
            trend="up"
            icon={Calendar}
          />
          <MetricCard
            title="Tỷ lệ hoàn thành"
            value="94%"
            change="+2%"
            trend="up"
            icon={TrendingUp}
          />
        </div>

        {/* Charts Grid */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Appointments Trend */}
          <div className="rounded-lg border bg-white p-6 shadow-sm">
            <h3 className="mb-4 text-lg font-semibold text-gray-900">
              Xu hướng lịch hẹn
            </h3>
            <div className="flex h-64 items-end justify-around space-x-2">
              <Bar height="40%" label="T2" />
              <Bar height="55%" label="T3" />
              <Bar height="45%" label="T4" />
              <Bar height="70%" label="T5" />
              <Bar height="60%" label="T6" />
              <Bar height="80%" label="T7" />
              <Bar height="75%" label="CN" />
            </div>
          </div>

          {/* Specialization Distribution */}
          <div className="rounded-lg border bg-white p-6 shadow-sm">
            <h3 className="mb-4 text-lg font-semibold text-gray-900">
              Phân bố theo chuyên khoa
            </h3>
            <div className="space-y-3">
              <ProgressBar label="Nội khoa" value={35} color="blue" />
              <ProgressBar label="Ngoại khoa" value={25} color="green" />
              <ProgressBar label="Tim mạch" value={20} color="red" />
              <ProgressBar label="Nhi khoa" value={15} color="purple" />
              <ProgressBar label="Khác" value={5} color="gray" />
            </div>
          </div>

          {/* Patient Demographics */}
          <div className="rounded-lg border bg-white p-6 shadow-sm">
            <h3 className="mb-4 text-lg font-semibold text-gray-900">
              Nhân khẩu học bệnh nhân
            </h3>
            <div className="space-y-4">
              <DemoRow label="0-18 tuổi" value="15%" />
              <DemoRow label="19-35 tuổi" value="30%" />
              <DemoRow label="36-50 tuổi" value="35%" />
              <DemoRow label="51-65 tuổi" value="15%" />
              <DemoRow label="65+ tuổi" value="5%" />
            </div>
          </div>

          {/* Top Doctors */}
          <div className="rounded-lg border bg-white p-6 shadow-sm">
            <h3 className="mb-4 text-lg font-semibold text-gray-900">
              Bác sĩ nổi bật
            </h3>
            <div className="space-y-3">
              <DoctorRow name="BS. Nguyễn Văn A" patients={145} rating={4.9} />
              <DoctorRow name="BS. Trần Thị B" patients={132} rating={4.8} />
              <DoctorRow name="BS. Lê Văn C" patients={128} rating={4.7} />
              <DoctorRow name="BS. Phạm Thị D" patients={115} rating={4.9} />
            </div>
          </div>
        </div>

        {/* Appointment Status */}
        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-lg font-semibold text-gray-900">
            Trạng thái lịch hẹn
          </h3>
          <div className="grid gap-4 md:grid-cols-4">
            <StatusCard label="Đã hoàn thành" value="756" percentage="85%" color="green" />
            <StatusCard label="Đã hủy" value="89" percentage="10%" color="red" />
            <StatusCard label="Không đến" value="34" percentage="4%" color="orange" />
            <StatusCard label="Đang chờ" value="11" percentage="1%" color="blue" />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

function MetricCard({ title, value, change, trend, icon: Icon }: any) {
  return (
    <div className="rounded-lg border bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600">{title}</p>
          <p className="mt-2 text-3xl font-bold text-gray-900">{value}</p>
          <p className={`mt-1 text-sm ${trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
            {change} so với kỳ trước
          </p>
        </div>
        <div className="rounded-full bg-primary-100 p-3">
          <Icon className="h-6 w-6 text-primary-600" />
        </div>
      </div>
    </div>
  );
}

function Bar({ height, label }: { height: string; label: string }) {
  return (
    <div className="flex flex-1 flex-col items-center">
      <div className="w-full rounded-t bg-primary" style={{ height }}></div>
      <span className="mt-2 text-xs text-gray-600">{label}</span>
    </div>
  );
}

function ProgressBar({ label, value, color }: { label: string; value: number; color: string }) {
  const colors: Record<string, string> = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    red: 'bg-red-500',
    purple: 'bg-purple-500',
    gray: 'bg-gray-500',
  };

  return (
    <div>
      <div className="mb-1 flex justify-between text-sm">
        <span className="text-gray-700">{label}</span>
        <span className="font-medium text-gray-900">{value}%</span>
      </div>
      <div className="h-2 w-full rounded-full bg-gray-200">
        <div className={`h-2 rounded-full ${colors[color]}`} style={{ width: `${value}%` }}></div>
      </div>
    </div>
  );
}

function DemoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-gray-600">{label}</span>
      <span className="font-semibold text-gray-900">{value}</span>
    </div>
  );
}

function DoctorRow({ name, patients, rating }: { name: string; patients: number; rating: number }) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <p className="font-medium text-gray-900">{name}</p>
        <p className="text-sm text-gray-600">{patients} bệnh nhân</p>
      </div>
      <div className="flex items-center">
        <span className="text-yellow-500">★</span>
        <span className="ml-1 font-semibold text-gray-900">{rating}</span>
      </div>
    </div>
  );
}

function StatusCard({ label, value, percentage, color }: any) {
  const colors: Record<string, string> = {
    green: 'bg-green-50 text-green-600',
    red: 'bg-red-50 text-red-600',
    orange: 'bg-orange-50 text-orange-600',
    blue: 'bg-blue-50 text-blue-600',
  };

  return (
    <div className={`rounded-lg p-4 ${colors[color]}`}>
      <p className="text-sm font-medium">{label}</p>
      <p className="mt-2 text-2xl font-bold">{value}</p>
      <p className="text-sm">{percentage}</p>
    </div>
  );
}
