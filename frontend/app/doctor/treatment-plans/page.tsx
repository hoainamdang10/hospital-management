'use client';

import { useState } from 'react';
import { Search, ClipboardList, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DashboardLayout } from '@/components/layout';

export default function DoctorTreatmentPlansPage() {
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Kế hoạch điều trị</h1>
            <p className="mt-2 text-gray-600">Quản lý kế hoạch điều trị bệnh nhân</p>
          </div>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Tạo kế hoạch mới
          </Button>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm kiếm kế hoạch..."
            className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        <div className="space-y-4">
          <TreatmentCard
            patient="Nguyễn Văn A"
            diagnosis="Tăng huyết áp"
            startDate="01/01/2025"
            duration="3 tháng"
            status="active"
          />
          <TreatmentCard
            patient="Trần Thị B"
            diagnosis="Đái tháo đường type 2"
            startDate="15/12/2024"
            duration="6 tháng"
            status="active"
          />
          <TreatmentCard
            patient="Lê Văn C"
            diagnosis="Viêm khớp"
            startDate="10/11/2024"
            duration="2 tháng"
            status="completed"
          />
        </div>
      </div>
    </DashboardLayout>
  );
}

function TreatmentCard({ patient, diagnosis, startDate, duration, status }: any) {
  return (
    <div className="rounded-lg border bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-4">
          <ClipboardList className="h-6 w-6 text-primary" />
          <div>
            <h3 className="font-semibold text-gray-900">{patient}</h3>
            <p className="text-sm text-gray-600">Chẩn đoán: {diagnosis}</p>
            <p className="text-sm text-gray-600">Bắt đầu: {startDate} • Thời gian: {duration}</p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <span className={`rounded-full px-3 py-1 text-sm font-medium ${
            status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
          }`}>
            {status === 'active' ? 'Đang điều trị' : 'Hoàn thành'}
          </span>
          <Button variant="outline" size="sm">Xem</Button>
        </div>
      </div>
    </div>
  );
}
