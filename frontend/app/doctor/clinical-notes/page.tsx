'use client';

import { useState } from 'react';
import { Search, FileText, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DashboardLayout } from '@/components/layout';

export default function DoctorClinicalNotesPage() {
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Ghi chú lâm sàng</h1>
            <p className="mt-2 text-gray-600">Quản lý ghi chú khám bệnh</p>
          </div>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Tạo ghi chú mới
          </Button>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm kiếm ghi chú..."
            className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        <div className="space-y-4">
          <NoteCard
            patient="Nguyễn Văn A"
            date="15/01/2025"
            title="Khám định kỳ"
            preview="Bệnh nhân đến khám định kỳ, không có triệu chứng bất thường..."
          />
          <NoteCard
            patient="Trần Thị B"
            date="14/01/2025"
            title="Theo dõi sau phẫu thuật"
            preview="Bệnh nhân phục hồi tốt sau phẫu thuật, vết mổ lành..."
          />
        </div>
      </div>
    </DashboardLayout>
  );
}

function NoteCard({ patient, date, title, preview }: any) {
  return (
    <div className="rounded-lg border bg-white p-6 shadow-sm hover:shadow-md">
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-4">
          <FileText className="h-6 w-6 text-primary" />
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900">{title}</h3>
            <p className="text-sm text-gray-600">{patient} • {date}</p>
            <p className="mt-2 text-gray-600">{preview}</p>
          </div>
        </div>
        <Button variant="outline" size="sm">Xem</Button>
      </div>
    </div>
  );
}
