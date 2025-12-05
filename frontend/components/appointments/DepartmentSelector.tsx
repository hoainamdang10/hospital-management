'use client';

import { useState } from 'react';
import { Loader2, Heart, Ambulance, Stethoscope, Bone, Baby, Sparkles, Eye, Ear, Search, Check } from 'lucide-react';
import { Department } from '@/lib/api/departments.service';

interface DepartmentSelectorProps {
  departments: Department[];
  selectedDepartment: Department | null;
  onSelect: (department: Department) => void;
  loading?: boolean;
}

const getDepartmentIcon = (code: string) => {
  const icons: Record<string, React.ComponentType<{ className?: string }>> = {
    CARD: Heart,           // Tim mạch
    ORTH: Bone,            // Chấn thương chỉnh hình
    PEDI: Baby,            // Nhi khoa
    INTE: Stethoscope,     // Nội tổng quát
    EMER: Ambulance,       // Cấp cứu
    DERM: Sparkles,        // Da liễu
    OPHT: Eye,             // Mắt
    ENT: Ear,              // Tai Mũi Họng
  };
  return icons[code] || Stethoscope;
};

export function DepartmentSelector({
  departments,
  selectedDepartment,
  onSelect,
  loading = false,
}: DepartmentSelectorProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredDepartments = departments.filter(dept =>
    dept.nameVi.toLowerCase().includes(searchTerm.toLowerCase()) ||
    dept.nameEn.toLowerCase().includes(searchTerm.toLowerCase()) ||
    dept.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
        <span className="ml-3 text-slate-600">Đang tải danh sách khoa...</span>
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
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1 space-y-2">
          <h2 className="text-2xl font-bold text-slate-900">Chọn chuyên khoa</h2>
          <p className="text-slate-600">Vui lòng chọn chuyên khoa phù hợp với tình trạng sức khỏe của bạn</p>
        </div>

        <div className="relative w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm kiếm khoa..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
          />
        </div>
      </div>

      {filteredDepartments.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">Không tìm thấy khoa phù hợp với &quot;{searchTerm}&quot;</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDepartments.map((dept) => {
            const Icon = getDepartmentIcon(dept.code);
            const isSelected = selectedDepartment?.id === dept.id;

            return (
              <button
                key={dept.id}
                onClick={() => onSelect(dept)}
                className={`group relative flex flex-col items-center text-center p-6 rounded-2xl border-2 transition-all duration-200 ${isSelected
                  ? 'border-emerald-600 bg-emerald-50/50 shadow-md scale-[1.02]'
                  : 'border-slate-100 hover:border-emerald-200 hover:shadow-lg hover:-translate-y-1 bg-white'
                  }`}
              >
                <div className={`mb-4 p-4 rounded-full transition-colors ${isSelected
                  ? 'bg-gradient-to-br from-emerald-100 to-teal-100 text-emerald-600'
                  : 'bg-slate-50 text-slate-500 group-hover:bg-emerald-50 group-hover:text-emerald-600'
                  }`}>
                  <Icon className="h-8 w-8" />
                </div>

                <h3 className={`font-bold text-lg mb-1 ${isSelected ? 'text-emerald-700' : 'text-slate-900'}`}>
                  {dept.nameVi}
                </h3>
                <p className="text-sm text-slate-500 mb-2 font-medium">
                  {dept.nameEn}
                </p>

                {isSelected && (
                  <div className="absolute top-4 right-4">
                    <div className="h-6 w-6 rounded-full bg-emerald-600 flex items-center justify-center shadow-sm">
                      <Check className="h-3.5 w-3.5 text-white" />
                    </div>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
