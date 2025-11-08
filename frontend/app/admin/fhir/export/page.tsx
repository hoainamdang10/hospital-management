'use client';

import { useState } from 'react';
import { Download, FileJson, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DashboardLayout } from '@/components/layout';

export default function FHIRExportPage() {
  const [dateRange, setDateRange] = useState({ from: '', to: '' });
  const [resourceType, setResourceType] = useState('all');

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">FHIR Export</h1>
          <p className="mt-2 text-gray-600">Xuất dữ liệu theo chuẩn FHIR</p>
        </div>

        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center space-x-3">
            <div className="rounded-full bg-primary-100 p-3">
              <FileJson className="h-6 w-6 text-primary-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Cấu hình xuất dữ liệu</h3>
              <p className="text-sm text-gray-600">Chọn loại tài nguyên và khoảng thời gian</p>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">Loại tài nguyên</label>
              <select
                value={resourceType}
                onChange={(e) => setResourceType(e.target.value)}
                className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="all">Tất cả</option>
                <option value="Patient">Patient</option>
                <option value="Encounter">Encounter</option>
                <option value="Observation">Observation</option>
                <option value="Condition">Condition</option>
                <option value="Procedure">Procedure</option>
                <option value="MedicationRequest">MedicationRequest</option>
              </select>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700">Từ ngày</label>
                <div className="relative mt-2">
                  <Calendar className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                  <input
                    type="date"
                    value={dateRange.from}
                    onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Đến ngày</label>
                <div className="relative mt-2">
                  <Calendar className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                  <input
                    type="date"
                    value={dateRange.to}
                    onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Định dạng xuất</label>
              <select className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary">
                <option>FHIR JSON (Bundle)</option>
                <option>FHIR XML (Bundle)</option>
                <option>NDJSON (Newline Delimited JSON)</option>
              </select>
            </div>

            <Button className="w-full">
              <Download className="mr-2 h-4 w-4" />
              Xuất dữ liệu FHIR
            </Button>
          </div>
        </div>

        <div className="rounded-lg bg-blue-50 p-4">
          <h4 className="mb-2 font-semibold text-blue-900">Lưu ý về FHIR:</h4>
          <ul className="space-y-1 text-sm text-blue-800">
            <li>• Dữ liệu được xuất theo chuẩn FHIR R4</li>
            <li>• Hỗ trợ các resource types phổ biến</li>
            <li>• Dữ liệu được mã hóa và bảo mật</li>
            <li>• Tuân thủ HIPAA và các quy định bảo mật</li>
          </ul>
        </div>

        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-lg font-semibold text-gray-900">Lịch sử xuất dữ liệu</h3>
          <div className="space-y-3">
            <ExportHistoryRow
              date="15/01/2025 10:30"
              type="Patient"
              records="1,234"
              size="45 MB"
            />
            <ExportHistoryRow
              date="14/01/2025 14:20"
              type="All Resources"
              records="5,678"
              size="180 MB"
            />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

function ExportHistoryRow({ date, type, records, size }: any) {
  return (
    <div className="flex items-center justify-between rounded-lg border p-4">
      <div>
        <p className="font-medium text-gray-900">{type}</p>
        <p className="text-sm text-gray-600">
          {date} • {records} records • {size}
        </p>
      </div>
      <Button variant="outline" size="sm">
        <Download className="h-4 w-4" />
      </Button>
    </div>
  );
}
