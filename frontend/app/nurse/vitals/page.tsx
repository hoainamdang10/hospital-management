'use client';

import { useState } from 'react';
import { Activity, Save, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DashboardLayout } from '@/components/layout';

/**
 * Nurse Vitals Recording Page
 * Route: /nurse/vitals
 */
export default function NurseVitalsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<string | null>(null);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Đo sinh hiệu</h1>
          <p className="mt-2 text-gray-600">Ghi nhận các chỉ số sinh hiệu của bệnh nhân</p>
        </div>

        {/* Patient Search */}
        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Chọn bệnh nhân</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm kiếm bệnh nhân..."
              className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <div className="mt-4 space-y-2">
            <PatientOption
              name="Nguyễn Văn A"
              code="BN-2025-001"
              selected={selectedPatient === '1'}
              onClick={() => setSelectedPatient('1')}
            />
            <PatientOption
              name="Trần Thị B"
              code="BN-2025-002"
              selected={selectedPatient === '2'}
              onClick={() => setSelectedPatient('2')}
            />
          </div>
        </div>

        {/* Vitals Form */}
        {selectedPatient && (
          <div className="rounded-lg border bg-white p-6 shadow-sm">
            <h2 className="mb-6 flex items-center text-lg font-semibold text-gray-900">
              <Activity className="mr-2 h-5 w-5" />
              Ghi nhận sinh hiệu - Nguyễn Văn A (BN-2025-001)
            </h2>

            <div className="grid gap-6 md:grid-cols-2">
              <VitalInput
                label="Huyết áp (mmHg)"
                placeholder="120/80"
                unit="mmHg"
              />
              <VitalInput
                label="Nhịp tim (bpm)"
                placeholder="75"
                unit="bpm"
              />
              <VitalInput
                label="Nhiệt độ (°C)"
                placeholder="36.5"
                unit="°C"
              />
              <VitalInput
                label="Nhịp thở (lần/phút)"
                placeholder="18"
                unit="lần/phút"
              />
              <VitalInput
                label="SpO2 (%)"
                placeholder="98"
                unit="%"
              />
              <VitalInput
                label="Cân nặng (kg)"
                placeholder="70"
                unit="kg"
              />
              <VitalInput
                label="Chiều cao (cm)"
                placeholder="170"
                unit="cm"
              />
              <VitalInput
                label="BMI"
                placeholder="24.2"
                unit="kg/m²"
                disabled
              />
            </div>

            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700">
                Ghi chú
              </label>
              <textarea
                rows={3}
                className="mt-1 w-full rounded-lg border border-gray-300 p-3 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="Ghi chú thêm về tình trạng bệnh nhân..."
              />
            </div>

            <div className="mt-6 flex justify-end space-x-4">
              <Button variant="outline">Hủy</Button>
              <Button>
                <Save className="mr-2 h-4 w-4" />
                Lưu sinh hiệu
              </Button>
            </div>
          </div>
        )}

        {/* Recent Vitals */}
        {selectedPatient && (
          <div className="rounded-lg border bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">
              Lịch sử sinh hiệu
            </h2>
            <div className="space-y-3">
              <VitalHistoryItem
                date="15/01/2025 09:00"
                bp="120/80"
                hr="75"
                temp="36.5"
                spo2="98"
              />
              <VitalHistoryItem
                date="14/01/2025 14:30"
                bp="118/78"
                hr="72"
                temp="36.6"
                spo2="99"
              />
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

function PatientOption({
  name,
  code,
  selected,
  onClick,
}: {
  name: string;
  code: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full rounded-lg border p-3 text-left transition-colors ${
        selected ? 'border-primary bg-primary-50' : 'border-gray-200 hover:border-gray-300'
      }`}
    >
      <p className="font-medium text-gray-900">{name}</p>
      <p className="text-sm text-gray-600">{code}</p>
    </button>
  );
}

function VitalInput({
  label,
  placeholder,
  unit,
  disabled = false,
}: {
  label: string;
  placeholder: string;
  unit: string;
  disabled?: boolean;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      <div className="relative mt-1">
        <input
          type="text"
          disabled={disabled}
          placeholder={placeholder}
          className="w-full rounded-lg border border-gray-300 py-2 pl-3 pr-16 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary disabled:bg-gray-50"
        />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">
          {unit}
        </span>
      </div>
    </div>
  );
}

function VitalHistoryItem({
  date,
  bp,
  hr,
  temp,
  spo2,
}: {
  date: string;
  bp: string;
  hr: string;
  temp: string;
  spo2: string;
}) {
  return (
    <div className="rounded-lg border p-4">
      <p className="mb-2 text-sm font-medium text-gray-900">{date}</p>
      <div className="grid grid-cols-4 gap-4 text-sm">
        <div>
          <span className="text-gray-600">Huyết áp:</span>
          <span className="ml-1 font-medium text-gray-900">{bp}</span>
        </div>
        <div>
          <span className="text-gray-600">Nhịp tim:</span>
          <span className="ml-1 font-medium text-gray-900">{hr}</span>
        </div>
        <div>
          <span className="text-gray-600">Nhiệt độ:</span>
          <span className="ml-1 font-medium text-gray-900">{temp}</span>
        </div>
        <div>
          <span className="text-gray-600">SpO2:</span>
          <span className="ml-1 font-medium text-gray-900">{spo2}</span>
        </div>
      </div>
    </div>
  );
}
