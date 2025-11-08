'use client';

import { Loader2 } from 'lucide-react';
import { Department, getDepartmentIcon } from '@/lib/api/departments.service';

interface DepartmentSelectorProps {
  departments: Department[];
  selectedDepartment: Department | null;
  onSelect: (department: Department) => void;
  loading?: boolean;
}

export function DepartmentSelector({
  departments,
  selectedDepartment,
  onSelect,
  loading = false,
}: DepartmentSelectorProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-3 text-gray-600">Đang tải danh sách khoa...</span>
      </div>
    );
  }

  if (departments.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Không có khoa nào khả dụng</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Chọn chuyên khoa</h2>
      <p className="text-gray-600">Bạn muốn khám chuyên khoa nào?</p>
      
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {departments.map((dept) => (
          <button
            key={dept.id}
            onClick={() => onSelect(dept)}
            className={`group p-6 rounded-xl border-2 transition-all hover:shadow-lg hover:scale-105 ${
              selectedDepartment?.id === dept.id
                ? 'border-primary bg-primary-50 shadow-md'
                : 'border-gray-200 hover:border-primary-200'
            }`}
          >
            <div className="text-5xl mb-3 transition-transform group-hover:scale-110">
              {getDepartmentIcon(dept.code)}
            </div>
            <h3 className="font-semibold text-gray-900 mb-1">{dept.nameVi}</h3>
            <p className="text-sm text-gray-500">{dept.nameEn}</p>
            
            {selectedDepartment?.id === dept.id && (
              <div className="mt-3 flex items-center justify-center">
                <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                <span className="ml-2 text-xs font-medium text-primary">Đã chọn</span>
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
