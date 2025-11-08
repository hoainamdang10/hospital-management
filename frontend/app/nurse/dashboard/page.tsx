'use client';

import { Users, CheckCircle, Clock, Activity } from 'lucide-react';
import { DashboardLayout } from '@/components/layout';

/**
 * Nurse Dashboard Page
 * Route: /nurse/dashboard
 */
export default function NurseDashboardPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard Y tá</h1>
          <p className="mt-2 text-gray-600">Tổng quan công việc hôm nay</p>
        </div>

        {/* Stats */}
        <div className="grid gap-6 md:grid-cols-4">
          <StatCard title="Bệnh nhân chờ" value="8" icon={Users} color="blue" />
          <StatCard title="Đã check-in" value="12" icon={CheckCircle} color="green" />
          <StatCard title="Đo sinh hiệu" value="5" icon={Activity} color="purple" />
          <StatCard title="Thời gian TB" value="15 phút" icon={Clock} color="orange" />
        </div>

        {/* Today's Tasks */}
        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-xl font-semibold text-gray-900">
            Nhiệm vụ hôm nay
          </h2>
          <div className="space-y-3">
            <TaskItem task="Check-in bệnh nhân" count={8} status="pending" />
            <TaskItem task="Đo sinh hiệu" count={5} status="in-progress" />
            <TaskItem task="Chuẩn bị phòng khám" count={3} status="completed" />
          </div>
        </div>

        {/* Waiting Patients */}
        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-xl font-semibold text-gray-900">
            Bệnh nhân chờ check-in
          </h2>
          <div className="space-y-4">
            <PatientCard name="Nguyễn Văn A" time="09:00" doctor="BS. Trần Thị B" />
            <PatientCard name="Lê Thị C" time="09:30" doctor="BS. Trần Thị B" />
            <PatientCard name="Phạm Văn D" time="10:00" doctor="BS. Nguyễn Văn E" />
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

function TaskItem({ task, count, status }: any) {
  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    'in-progress': 'bg-blue-100 text-blue-800',
    completed: 'bg-green-100 text-green-800',
  };

  return (
    <div className="flex items-center justify-between rounded-lg border p-3">
      <span className="font-medium text-gray-900">{task}</span>
      <div className="flex items-center space-x-3">
        <span className="text-sm text-gray-600">{count} bệnh nhân</span>
        <span className={`rounded-full px-2 py-1 text-xs font-medium ${statusColors[status]}`}>
          {status === 'pending' ? 'Chờ' : status === 'in-progress' ? 'Đang làm' : 'Hoàn thành'}
        </span>
      </div>
    </div>
  );
}

function PatientCard({ name, time, doctor }: any) {
  return (
    <div className="flex items-center justify-between rounded-lg border p-4">
      <div>
        <p className="font-semibold text-gray-900">{name}</p>
        <p className="text-sm text-gray-600">{doctor}</p>
      </div>
      <div className="text-right">
        <p className="text-sm font-medium text-gray-900">{time}</p>
        <button className="mt-1 rounded bg-primary px-3 py-1 text-sm text-white hover:bg-primary/90">
          Check-in
        </button>
      </div>
    </div>
  );
}
