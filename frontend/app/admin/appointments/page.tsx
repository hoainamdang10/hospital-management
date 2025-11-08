'use client';

import { DashboardLayout } from '@/components/layout';
import { Calendar, Plus } from 'lucide-react';
import Link from 'next/link';

export default function AppointmentsPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Tất cả lịch hẹn</h1>
            <p className="text-gray-600 mt-1">Quản lý lịch hẹn khám bệnh</p>
          </div>
          <Link
            href="/admin/appointments/add"
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            <Plus className="h-5 w-5" />
            Tạo lịch hẹn
          </Link>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-8">
          <div className="text-center py-12">
            <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Quản lý lịch hẹn</h3>
            <p className="text-gray-600">Tính năng đang được phát triển</p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
