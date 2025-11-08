'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { Save, FileText, Pill, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DashboardLayout } from '@/components/layout';

/**
 * Doctor Examination Page
 * Route: /doctor/examination/[id]
 */
export default function DoctorExaminationPage() {
  const params = useParams();
  const patientId = params?.id;

  const [diagnosis, setDiagnosis] = useState('');
  const [prescription, setPrescription] = useState('');
  const [notes, setNotes] = useState('');

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Khám bệnh</h1>
            <p className="mt-2 text-gray-600">Mã BN: {patientId}</p>
          </div>
          <Button>
            <Save className="mr-2 h-4 w-4" />
            Lưu hồ sơ
          </Button>
        </div>

        {/* Patient Info */}
        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-xl font-semibold text-gray-900">Thông tin bệnh nhân</h2>
          <div className="grid gap-4 md:grid-cols-3">
            <InfoItem label="Họ tên" value="Lê Văn C" />
            <InfoItem label="Tuổi" value="35 tuổi" />
            <InfoItem label="Giới tính" value="Nam" />
            <InfoItem label="Số điện thoại" value="0912345678" />
            <InfoItem label="Địa chỉ" value="123 Đường ABC, Quận 1, TP.HCM" />
            <InfoItem label="Lý do khám" value="Tái khám" />
          </div>
        </div>

        {/* Vitals */}
        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <h2 className="mb-4 flex items-center text-xl font-semibold text-gray-900">
            <Activity className="mr-2 h-5 w-5" />
            Sinh hiệu
          </h2>
          <div className="grid gap-4 md:grid-cols-4">
            <VitalItem label="Huyết áp" value="120/80 mmHg" status="normal" />
            <VitalItem label="Nhịp tim" value="75 bpm" status="normal" />
            <VitalItem label="Nhiệt độ" value="36.5°C" status="normal" />
            <VitalItem label="Cân nặng" value="70 kg" status="normal" />
          </div>
        </div>

        {/* Medical History */}
        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <h2 className="mb-4 flex items-center text-xl font-semibold text-gray-900">
            <FileText className="mr-2 h-5 w-5" />
            Lịch sử khám bệnh
          </h2>
          <div className="space-y-3">
            <HistoryItem
              date="10/12/2024"
              diagnosis="Viêm họng"
              doctor="BS. Nguyễn Văn A"
            />
            <HistoryItem
              date="15/11/2024"
              diagnosis="Cảm cúm"
              doctor="BS. Trần Thị B"
            />
          </div>
        </div>

        {/* Examination Form */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Diagnosis */}
          <div className="rounded-lg border bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-xl font-semibold text-gray-900">Chẩn đoán</h2>
            <textarea
              value={diagnosis}
              onChange={(e) => setDiagnosis(e.target.value)}
              rows={6}
              className="w-full rounded-lg border border-gray-300 p-3 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              placeholder="Nhập chẩn đoán bệnh..."
            />
          </div>

          {/* Prescription */}
          <div className="rounded-lg border bg-white p-6 shadow-sm">
            <h2 className="mb-4 flex items-center text-xl font-semibold text-gray-900">
              <Pill className="mr-2 h-5 w-5" />
              Đơn thuốc
            </h2>
            <textarea
              value={prescription}
              onChange={(e) => setPrescription(e.target.value)}
              rows={6}
              className="w-full rounded-lg border border-gray-300 p-3 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              placeholder="Nhập đơn thuốc..."
            />
          </div>
        </div>

        {/* Notes */}
        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-xl font-semibold text-gray-900">Ghi chú</h2>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={4}
            className="w-full rounded-lg border border-gray-300 p-3 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            placeholder="Ghi chú thêm..."
          />
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-4">
          <Button variant="outline">Hủy</Button>
          <Button>
            <Save className="mr-2 h-4 w-4" />
            Hoàn thành khám
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-sm text-gray-600">{label}</p>
      <p className="mt-1 font-medium text-gray-900">{value}</p>
    </div>
  );
}

function VitalItem({ label, value, status }: { label: string; value: string; status: string }) {
  const statusColor = status === 'normal' ? 'text-green-600' : 'text-red-600';
  return (
    <div className="rounded-lg border p-4">
      <p className="text-sm text-gray-600">{label}</p>
      <p className={`mt-1 text-xl font-bold ${statusColor}`}>{value}</p>
    </div>
  );
}

function HistoryItem({ date, diagnosis, doctor }: { date: string; diagnosis: string; doctor: string }) {
  return (
    <div className="flex items-center justify-between rounded-lg border p-3">
      <div>
        <p className="font-medium text-gray-900">{diagnosis}</p>
        <p className="text-sm text-gray-600">{doctor}</p>
      </div>
      <span className="text-sm text-gray-500">{date}</span>
    </div>
  );
}
