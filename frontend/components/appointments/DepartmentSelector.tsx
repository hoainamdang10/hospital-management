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
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1 space-y-2">
          <h2 className="text-2xl font-bold text-gray-900">Chọn chuyên khoa</h2>
          <p className="text-gray-600">Vui lòng chọn chuyên khoa phù hợp với tình trạng sức khỏe của bạn</p>
        </div>
        
        <div className="relative w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Tìm kiếm khoa..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          />
        </div>
      </div>
      
      {filteredDepartments.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">Không tìm thấy khoa phù hợp với &quot;{searchTerm}&quot;</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredDepartments.map((dept) => {
            const Icon = getDepartmentIcon(dept.code);
            const isSelected = selectedDepartment?.id === dept.id;
            
            return (
              <button
                key={dept.id}
                onClick={() => onSelect(dept)}
                className={`group relative w-full p-6 rounded-lg border-2 transition-all text-left ${
                  isSelected
                    ? 'border-blue-600 bg-blue-50 shadow-md'
                    : 'border-gray-200 hover:border-blue-300 hover:shadow-sm bg-white'
                }`}
              >
                <div className="flex items-start space-x-4">
                  <div className={`shrink-0 p-3 rounded-lg ${
                    isSelected 
                      ? 'bg-blue-100 text-blue-600' 
                      : 'bg-gray-100 text-gray-600 group-hover:bg-blue-50 group-hover:text-blue-600'
                  } transition-colors`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 mb-1 text-lg">
                      {dept.nameVi}
                    </h3>
                    <p className="text-sm text-gray-500 mb-2">
                      {dept.nameEn}
                    </p>
                    {dept.description && (
                      <p className="text-sm text-gray-500">
                        {dept.description}
                      </p>
                    )}
                  </div>
                </div>
                
                {isSelected && (
                  <div className="absolute top-6 right-6">
                    <div className="h-6 w-6 rounded-full bg-blue-600 flex items-center justify-center">
                      <Check className="h-4 w-4 text-white" />
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
