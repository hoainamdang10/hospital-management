'use client';

import { DashboardLayout } from '@/components/layout';
import { BarChart3 } from 'lucide-react';

/**
 * Admin - Báo cáo bệnh nhân
 */
export default function PatientReportsPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Báo cáo bệnh nhân</h1>
          <p className="text-gray-600 mt-1">Thống kê và báo cáo về bệnh nhân</p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-8">
          <div className="text-center py-12">
            <BarChart3 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Báo cáo bệnh nhân</h3>
            <p className="text-gray-600">Tính năng đang được phát triển</p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
