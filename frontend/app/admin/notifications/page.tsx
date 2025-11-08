'use client';

import { Bell, Plus, Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DashboardLayout } from '@/components/layout';

export default function AdminNotificationsPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Mẫu thông báo</h1>
            <p className="mt-2 text-gray-600">Quản lý các mẫu thông báo hệ thống</p>
          </div>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Tạo mẫu mới
          </Button>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <TemplateCard
            title="Xác nhận đặt lịch"
            description="Thông báo gửi khi bệnh nhân đặt lịch thành công"
            type="Email & SMS"
          />
          <TemplateCard
            title="Nhắc nhở lịch hẹn"
            description="Nhắc nhở bệnh nhân trước 24h"
            type="Email & SMS"
          />
          <TemplateCard
            title="Kết quả xét nghiệm"
            description="Thông báo khi có kết quả xét nghiệm mới"
            type="Email"
          />
          <TemplateCard
            title="Thanh toán thành công"
            description="Xác nhận thanh toán hóa đơn"
            type="Email"
          />
        </div>
      </div>
    </DashboardLayout>
  );
}

function TemplateCard({ title, description, type }: any) {
  return (
    <div className="rounded-lg border bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-start justify-between">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-100">
          <Bell className="h-6 w-6 text-primary-600" />
        </div>
        <button className="text-gray-400 hover:text-gray-600">
          <Edit className="h-5 w-5" />
        </button>
      </div>
      <h3 className="mb-2 font-semibold text-gray-900">{title}</h3>
      <p className="mb-3 text-sm text-gray-600">{description}</p>
      <span className="inline-block rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-800">
        {type}
      </span>
    </div>
  );
}
