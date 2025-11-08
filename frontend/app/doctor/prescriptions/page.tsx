'use client';

import { useState } from 'react';
import { Search, Plus, Pill, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DashboardLayout } from '@/components/layout';

/**
 * Doctor Prescriptions Page
 * Route: /doctor/prescriptions
 */
export default function DoctorPrescriptionsPage() {
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Đơn thuốc</h1>
            <p className="mt-2 text-gray-600">Quản lý đơn thuốc đã kê</p>
          </div>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Kê đơn mới
          </Button>
        </div>

        {/* Search & Filters */}
        <div className="flex items-center space-x-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm kiếm đơn thuốc..."
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

        {/* Prescriptions List */}
        <div className="space-y-4">
          <PrescriptionCard
            prescriptionId="RX-2025-001"
            patientName="Nguyễn Văn A"
            patientCode="BN-2025-001"
            date="15/01/2025"
            diagnosis="Viêm họng cấp"
            medicationCount={3}
          />
          <PrescriptionCard
            prescriptionId="RX-2025-002"
            patientName="Trần Thị B"
            patientCode="BN-2025-002"
            date="14/01/2025"
            diagnosis="Cảm cúm"
            medicationCount={2}
          />
          <PrescriptionCard
            prescriptionId="RX-2025-003"
            patientName="Lê Văn C"
            patientCode="BN-2025-003"
            date="13/01/2025"
            diagnosis="Đau đầu"
            medicationCount={4}
          />
        </div>
      </div>
    </DashboardLayout>
  );
}

function PrescriptionCard({
  prescriptionId,
  patientName,
  patientCode,
  date,
  diagnosis,
  medicationCount,
}: {
  prescriptionId: string;
  patientName: string;
  patientCode: string;
  date: string;
  diagnosis: string;
  medicationCount: number;
}) {
  return (
    <div className="rounded-lg border bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-100">
            <Pill className="h-6 w-6 text-primary-600" />
          </div>
          <div>
            <div className="flex items-center space-x-3">
              <p className="font-semibold text-gray-900">{prescriptionId}</p>
              <span className="rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-800">
                {medicationCount} thuốc
              </span>
            </div>
            <p className="text-sm text-gray-600">
              {patientName} ({patientCode})
            </p>
            <p className="text-sm text-gray-600">{date}</p>
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
