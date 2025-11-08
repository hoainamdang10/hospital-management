'use client';

import { DashboardLayout } from '@/components/layout';
import { FileText, Search } from 'lucide-react';

/**
 * Admin - Hồ sơ bệnh án
 */
export default function MedicalRecordsPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Hồ sơ bệnh án</h1>
          <p className="text-gray-600 mt-1">Quản lý hồ sơ bệnh án của bệnh nhân</p>
        </div>

        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm kiếm hồ sơ bệnh án..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-8">
          <div className="text-center py-12">
            <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Hồ sơ bệnh án</h3>
            <p className="text-gray-600">Tính năng đang được phát triển</p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
