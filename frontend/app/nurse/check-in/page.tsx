'use client';

import { useState } from 'react';
import { Search, UserCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DashboardLayout } from '@/components/layout';

/**
 * Nurse Check-in Page
 * Route: /nurse/check-in
 */
export default function NurseCheckInPage() {
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Check-in bệnh nhân</h1>
          <p className="mt-2 text-gray-600">Đăng ký bệnh nhân đến khám</p>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm kiếm theo tên, mã BN, số điện thoại..."
            className="w-full rounded-lg border border-gray-300 py-3 pl-10 pr-4 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        {/* Appointments List */}
        <div className="space-y-4">
          <AppointmentCard
            patientName="Nguyễn Văn A"
            patientCode="BN-2025-001"
            appointmentTime="09:00"
            doctor="BS. Trần Thị B"
            status="waiting"
          />
          <AppointmentCard
            patientName="Lê Thị C"
            patientCode="BN-2025-002"
            appointmentTime="09:30"
            doctor="BS. Trần Thị B"
            status="waiting"
          />
          <AppointmentCard
            patientName="Phạm Văn D"
            patientCode="BN-2025-003"
            appointmentTime="10:00"
            doctor="BS. Nguyễn Văn E"
            status="checked-in"
          />
        </div>
      </div>
    </DashboardLayout>
  );
}

function AppointmentCard({
  patientName,
  patientCode,
  appointmentTime,
  doctor,
  status,
}: {
  patientName: string;
  patientCode: string;
  appointmentTime: string;
  doctor: string;
  status: string;
}) {
  const isCheckedIn = status === 'checked-in';

  return (
    <div className="rounded-lg border bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-100 text-primary-700">
            {patientName.charAt(0)}
          </div>
          <div>
            <p className="font-semibold text-gray-900">{patientName}</p>
            <p className="text-sm text-gray-600">{patientCode}</p>
            <p className="text-sm text-gray-600">
              {appointmentTime} • {doctor}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          {isCheckedIn ? (
            <span className="flex items-center rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-800">
              <UserCheck className="mr-1 h-4 w-4" />
              Đã check-in
            </span>
          ) : (
            <Button>
              <UserCheck className="mr-2 h-4 w-4" />
              Check-in
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
