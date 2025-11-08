'use client';

import { useState } from 'react';
import { Search, FileText, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DashboardLayout } from '@/components/layout';

/**
 * Doctor Medical Records Page
 * Route: /doctor/medical-records
 */
export default function DoctorMedicalRecordsPage() {
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Hồ sơ bệnh án</h1>
          <p className="mt-2 text-gray-600">Tra cứu và quản lý hồ sơ bệnh nhân</p>
        </div>

        {/* Search & Filters */}
        <div className="flex items-center space-x-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm kiếm bệnh nhân..."
              className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <select className="rounded-lg border border-gray-300 px-4 py-2">
            <option>Tất cả</option>
            <option>Hôm nay</option>
            <option>Tuần này</option>
            <option>Tháng này</option>
          </select>
        </div>

        {/* Records List */}
        <div className="space-y-4">
          <RecordCard
            patientName="Nguyễn Văn A"
            patientCode="BN-2025-001"
            lastVisit="15/01/2025"
            diagnosis="Viêm họng cấp"
            totalVisits={5}
          />
          <RecordCard
            patientName="Trần Thị B"
            patientCode="BN-2025-002"
            lastVisit="14/01/2025"
            diagnosis="Cảm cúm"
            totalVisits={3}
          />
          <RecordCard
            patientName="Lê Văn C"
            patientCode="BN-2025-003"
            lastVisit="13/01/2025"
            diagnosis="Đau đầu, chóng mặt"
            totalVisits={8}
          />
        </div>
      </div>
    </DashboardLayout>
  );
}

function RecordCard({
  patientName,
  patientCode,
  lastVisit,
  diagnosis,
  totalVisits,
}: {
  patientName: string;
  patientCode: string;
  lastVisit: string;
  diagnosis: string;
  totalVisits: number;
}) {
  return (
    <div className="rounded-lg border bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-100">
            <FileText className="h-6 w-6 text-primary-600" />
          </div>
          <div>
            <p className="font-semibold text-gray-900">{patientName}</p>
            <p className="text-sm text-gray-600">{patientCode}</p>
            <p className="text-sm text-gray-600">
              Khám gần nhất: {lastVisit} • {totalVisits} lần khám
            </p>
            <p className="mt-1 text-sm">
              <span className="font-medium text-gray-700">Chẩn đoán: </span>
              <span className="text-gray-600">{diagnosis}</span>
            </p>
          </div>
        </div>
        <Button variant="outline">
          <Eye className="mr-2 h-4 w-4" />
          Xem chi tiết
        </Button>
      </div>
    </div>
  );
}
