'use client';

import { useState } from 'react';
import { Search, Calendar, Clock } from 'lucide-react';
import { DashboardLayout } from '@/components/layout';

export default function NurseAppointmentsPage() {
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Quản lý lịch hẹn</h1>
          <p className="mt-2 text-gray-600">Xem và quản lý lịch hẹn</p>
        </div>

        <div className="flex items-center space-x-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm kiếm lịch hẹn..."
              className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <select className="rounded-lg border border-gray-300 px-4 py-2">
            <option>Hôm nay</option>
            <option>Ngày mai</option>
            <option>Tuần này</option>
          </select>
        </div>

        <div className="space-y-4">
          <AppointmentCard
            time="09:00"
            patient="Nguyễn Văn A"
            doctor="BS. Trần Thị B"
            status="confirmed"
          />
          <AppointmentCard
            time="09:30"
            patient="Lê Thị C"
            doctor="BS. Trần Thị B"
            status="waiting"
          />
          <AppointmentCard
            time="10:00"
            patient="Phạm Văn D"
            doctor="BS. Nguyễn Văn E"
            status="completed"
          />
        </div>
      </div>
    </DashboardLayout>
  );
}

function AppointmentCard({ time, patient, doctor, status }: any) {
  const statusColors: Record<string, string> = {
    confirmed: 'bg-blue-100 text-blue-800',
    waiting: 'bg-yellow-100 text-yellow-800',
    completed: 'bg-green-100 text-green-800',
  };

  return (
    <div className="rounded-lg border bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-100">
            <Clock className="h-6 w-6 text-primary-600" />
          </div>
          <div>
            <p className="font-semibold text-gray-900">{time}</p>
            <p className="text-sm text-gray-600">{patient}</p>
            <p className="text-sm text-gray-600">{doctor}</p>
          </div>
        </div>
        <span className={`rounded-full px-3 py-1 text-sm font-medium ${statusColors[status]}`}>
          {status === 'confirmed' && 'Đã xác nhận'}
          {status === 'waiting' && 'Đang chờ'}
          {status === 'completed' && 'Hoàn thành'}
        </span>
      </div>
    </div>
  );
}
