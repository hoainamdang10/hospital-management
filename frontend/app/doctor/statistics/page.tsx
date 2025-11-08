'use client';

import { Users, Calendar, TrendingUp, Clock } from 'lucide-react';
import { DashboardLayout } from '@/components/layout';

export default function DoctorStatisticsPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Thống kê cá nhân</h1>
          <p className="mt-2 text-gray-600">Tổng quan hoạt động của bạn</p>
        </div>

        <div className="grid gap-6 md:grid-cols-4">
          <StatCard title="Tổng bệnh nhân" value="1,234" icon={Users} color="blue" />
          <StatCard title="Lịch hẹn tháng này" value="156" icon={Calendar} color="green" />
          <StatCard title="Tỷ lệ hoàn thành" value="94%" icon={TrendingUp} color="purple" />
          <StatCard title="Thời gian TB/bệnh nhân" value="25 phút" icon={Clock} color="orange" />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-lg border bg-white p-6 shadow-sm">
            <h3 className="mb-4 text-lg font-semibold text-gray-900">Xu hướng bệnh nhân</h3>
            <div className="flex h-64 items-end justify-around space-x-2">
              <Bar height="40%" label="T1" />
              <Bar height="55%" label="T2" />
              <Bar height="45%" label="T3" />
              <Bar height="70%" label="T4" />
              <Bar height="60%" label="T5" />
              <Bar height="80%" label="T6" />
            </div>
          </div>

          <div className="rounded-lg border bg-white p-6 shadow-sm">
            <h3 className="mb-4 text-lg font-semibold text-gray-900">Đánh giá từ bệnh nhân</h3>
            <div className="space-y-4">
              <RatingRow label="Chuyên môn" rating={4.9} />
              <RatingRow label="Thái độ" rating={4.8} />
              <RatingRow label="Giải thích rõ ràng" rating={4.7} />
              <RatingRow label="Thời gian khám" rating={4.6} />
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

function StatCard({ title, value, icon: Icon, color }: any) {
  const colors: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    purple: 'bg-purple-50 text-purple-600',
    orange: 'bg-orange-50 text-orange-600',
  };

  return (
    <div className="rounded-lg border bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600">{title}</p>
          <p className="mt-2 text-3xl font-bold text-gray-900">{value}</p>
        </div>
        <div className={`rounded-full p-3 ${colors[color]}`}>
          <Icon className="h-6 w-6" />
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

function RatingRow({ label, rating }: { label: string; rating: number }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-gray-700">{label}</span>
      <div className="flex items-center">
        <span className="mr-2 text-yellow-500">★</span>
        <span className="font-semibold text-gray-900">{rating}</span>
      </div>
    </div>
  );
}
