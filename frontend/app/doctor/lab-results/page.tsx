'use client';

import { useState } from 'react';
import { Search, FileText, Download, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DashboardLayout } from '@/components/layout';

/**
 * Doctor Lab Results Page
 * Route: /doctor/lab-results
 */
export default function DoctorLabResultsPage() {
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Kết quả xét nghiệm</h1>
          <p className="mt-2 text-gray-600">Xem và quản lý kết quả xét nghiệm</p>
        </div>

        {/* Search & Filters */}
        <div className="flex items-center space-x-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm kiếm bệnh nhân hoặc loại xét nghiệm..."
              className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <select className="rounded-lg border border-gray-300 px-4 py-2">
            <option>Tất cả</option>
            <option>Hôm nay</option>
            <option>Tuần này</option>
            <option>Tháng này</option>
          </select>
          <select className="rounded-lg border border-gray-300 px-4 py-2">
            <option>Tất cả loại</option>
            <option>Xét nghiệm máu</option>
            <option>Xét nghiệm nước tiểu</option>
            <option>X-quang</option>
            <option>CT Scan</option>
            <option>MRI</option>
          </select>
        </div>

        {/* Lab Results List */}
        <div className="space-y-4">
          <LabResultCard
            patientName="Nguyễn Văn A"
            patientCode="BN-2025-001"
            testType="Xét nghiệm máu tổng quát"
            date="15/01/2025"
            status="completed"
            result="Bình thường"
          />
          <LabResultCard
            patientName="Trần Thị B"
            patientCode="BN-2025-002"
            testType="X-quang phổi"
            date="14/01/2025"
            status="completed"
            result="Không phát hiện bất thường"
          />
          <LabResultCard
            patientName="Lê Văn C"
            patientCode="BN-2025-003"
            testType="Xét nghiệm đường huyết"
            date="13/01/2025"
            status="pending"
            result="Đang chờ kết quả"
          />
        </div>
      </div>
    </DashboardLayout>
  );
}

function LabResultCard({
  patientName,
  patientCode,
  testType,
  date,
  status,
  result,
}: {
  patientName: string;
  patientCode: string;
  testType: string;
  date: string;
  status: string;
  result: string;
}) {
  const statusColors: Record<string, string> = {
    completed: 'bg-green-100 text-green-800',
    pending: 'bg-yellow-100 text-yellow-800',
    abnormal: 'bg-red-100 text-red-800',
  };

  return (
    <div className="rounded-lg border bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-100">
            <FileText className="h-6 w-6 text-primary-600" />
          </div>
          <div>
            <div className="flex items-center space-x-3">
              <p className="font-semibold text-gray-900">{testType}</p>
              <span className={`rounded-full px-2 py-1 text-xs font-medium ${statusColors[status]}`}>
                {status === 'completed' ? 'Hoàn thành' : status === 'pending' ? 'Đang chờ' : 'Bất thường'}
              </span>
            </div>
            <p className="text-sm text-gray-600">
              {patientName} ({patientCode})
            </p>
            <p className="text-sm text-gray-600">{date}</p>
            <p className="mt-1 text-sm">
              <span className="font-medium text-gray-700">Kết quả: </span>
              <span className="text-gray-600">{result}</span>
            </p>
          </div>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" size="sm">
            <Eye className="mr-2 h-4 w-4" />
            Xem
          </Button>
          {status === 'completed' && (
            <Button variant="outline" size="sm">
              <Download className="mr-2 h-4 w-4" />
              Tải
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
