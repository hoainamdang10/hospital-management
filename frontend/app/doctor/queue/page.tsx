'use client';

import { Users, Clock, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DashboardLayout } from '@/components/layout';

/**
 * Doctor Queue Management Page
 * Route: /doctor/queue
 */
export default function DoctorQueuePage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Hàng đợi bệnh nhân</h1>
          <p className="mt-2 text-gray-600">Quản lý bệnh nhân đang chờ khám</p>
        </div>

        {/* Stats */}
        <div className="grid gap-6 md:grid-cols-3">
          <StatCard
            title="Đang chờ"
            value="3"
            color="orange"
            icon={Users}
          />
          <StatCard
            title="Đã khám hôm nay"
            value="5"
            color="green"
            icon={Users}
          />
          <StatCard
            title="Thời gian chờ trung bình"
            value="15 phút"
            color="blue"
            icon={Clock}
          />
        </div>

        {/* Current Patient */}
        <div className="rounded-lg border-2 border-primary bg-primary-50 p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-primary-900">
              Bệnh nhân hiện tại
            </h2>
            <span className="rounded-full bg-primary-600 px-3 py-1 text-sm font-medium text-white">
              Đang khám
            </span>
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <p className="text-2xl font-bold text-gray-900">Lê Văn C</p>
              <p className="text-gray-700">Mã BN: BN-2025-003</p>
              <p className="text-gray-700">Lý do: Tái khám</p>
              <p className="text-sm text-gray-600">Bắt đầu: 10:05 • Thời gian: 15 phút</p>
            </div>
            <Button size="lg">
              Hoàn thành khám
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Queue List */}
        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-xl font-semibold text-gray-900">
            Danh sách chờ ({3} bệnh nhân)
          </h2>
          <div className="space-y-4">
            <QueueItem
              position={1}
              patientName="Phạm Thị D"
              patientCode="BN-2025-004"
              reason="Khám tổng quát"
              waitTime="5 phút"
              checkInTime="10:15"
            />
            <QueueItem
              position={2}
              patientName="Hoàng Văn E"
              patientCode="BN-2025-005"
              reason="Đau bụng"
              waitTime="10 phút"
              checkInTime="10:10"
            />
            <QueueItem
              position={3}
              patientName="Ngô Thị F"
              patientCode="BN-2025-006"
              reason="Khám định kỳ"
              waitTime="15 phút"
              checkInTime="10:05"
            />
          </div>
        </div>

        {/* Call Next Button */}
        <div className="flex justify-center">
          <Button size="lg" className="px-8">
            <Users className="mr-2 h-5 w-5" />
            Gọi bệnh nhân tiếp theo
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
}

// Stat Card Component
function StatCard({
  title,
  value,
  color,
  icon: Icon,
}: {
  title: string;
  value: string;
  color: string;
  icon: any;
}) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    orange: 'bg-orange-50 text-orange-600',
  }[color];

  return (
    <div className="rounded-lg border bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600">{title}</p>
          <p className="mt-2 text-3xl font-bold text-gray-900">{value}</p>
        </div>
        <div className={`rounded-full p-3 ${colorClasses}`}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
  );
}

// Queue Item Component
function QueueItem({
  position,
  patientName,
  patientCode,
  reason,
  waitTime,
  checkInTime,
}: {
  position: number;
  patientName: string;
  patientCode: string;
  reason: string;
  waitTime: string;
  checkInTime: string;
}) {
  return (
    <div className="flex items-center justify-between rounded-lg border p-4 hover:bg-gray-50">
      <div className="flex items-center space-x-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-100 text-xl font-bold text-primary-700">
          {position}
        </div>
        <div>
          <p className="font-semibold text-gray-900">{patientName}</p>
          <p className="text-sm text-gray-600">{patientCode}</p>
          <p className="text-sm text-gray-600">{reason}</p>
        </div>
      </div>
      <div className="text-right">
        <p className="text-sm text-gray-600">Check-in: {checkInTime}</p>
        <p className="text-sm font-medium text-orange-600">Chờ: {waitTime}</p>
        <Button variant="outline" size="sm" className="mt-2">
          Gọi vào
        </Button>
      </div>
    </div>
  );
}
