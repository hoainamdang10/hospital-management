'use client';

import React from 'react';
import { Edit, Trash2, Phone, Mail, Eye } from 'lucide-react';
import { DataTable, Column } from './DataTable';
import { StatusBadge } from './StatusBadge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { SupabaseDoctor } from '@/lib/types/supabase';
import { useRouter } from 'next/navigation';

interface SupabaseDoctorsTableProps {
  doctors: SupabaseDoctor[];
  departments: Array<{ department_id: string; department_name: string }>;
  isLoading?: boolean;
  currentPage: number;
  totalPages: number;
  itemsPerPage: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  onEdit: (doctor: SupabaseDoctor) => void;
  onDelete: (doctorId: string) => void;
  onRowClick?: (doctor: SupabaseDoctor) => void;
}

export function SupabaseDoctorsTable({
  doctors,
  departments,
  isLoading = false,
  currentPage,
  totalPages,
  itemsPerPage,
  totalItems,
  onPageChange,
  onEdit,
  onDelete,
  onRowClick,
}: SupabaseDoctorsTableProps) {
  const router = useRouter();
  // Define columns for the doctors table
  const columns: Column<SupabaseDoctor>[] = [
    {
      key: 'doctor_info',
      header: 'Bác sĩ',
      accessor: (doctor) => (
        <div className="flex items-center">
          <Avatar className="h-10 w-10 mr-3">
            <AvatarImage 
              src={doctor.photo_url || "/placeholder.svg"} 
              alt={doctor.full_name} 
            />
            <AvatarFallback>
              {doctor.full_name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'BS'}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="text-sm font-medium text-gray-900">{doctor.full_name}</div>
            <div className="text-xs text-gray-500">{doctor.doctor_id}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'specialty',
      header: 'Chuyên khoa',
      accessor: (doctor) => (
        <Badge variant="secondary" className="text-xs">
          {doctor.specialty}
        </Badge>
      ),
    },
    {
      key: 'qualification',
      header: 'Trình độ',
      accessor: 'qualification',
      className: 'text-sm text-gray-600',
      responsive: 'md',
    },
    {
      key: 'department',
      header: 'Khoa',
      accessor: (doctor) => (
        doctor.department_name ||
        doctor.departments?.department_name ||
        departments.find(dept => dept.department_id === doctor.department_id)?.department_name ||
        'Chưa phân khoa'
      ),
      className: 'text-sm text-gray-600',
      responsive: 'lg',
    },
    {
      key: 'schedule',
      header: 'Lịch làm việc',
      accessor: 'schedule',
      className: 'text-sm text-gray-600',
      responsive: 'lg',
    },
    {
      key: 'gender',
      header: 'Giới tính',
      accessor: (doctor) => (
        <StatusBadge 
          status={doctor.gender} 
          type="gender"
          variant={doctor.gender === 'Nam' ? 'default' : doctor.gender === 'Nữ' ? 'secondary' : 'outline'}
        />
      ),
      responsive: 'md',
    },
    {
      key: 'contact',
      header: 'Liên hệ',
      accessor: (doctor) => (
        <div className="flex flex-col space-y-1">
          <div className="flex items-center text-xs text-gray-600">
            <Phone className="h-3 w-3 mr-1" />
            {doctor.phone_number}
          </div>
          <div className="flex items-center text-xs text-gray-600">
            <Mail className="h-3 w-3 mr-1" />
            {doctor.email}
          </div>
        </div>
      ),
      responsive: 'xl',
    },
  ];

  // Define actions for each row
  const actions = [
    {
      label: 'Xem hồ sơ',
      icon: <Eye className="h-4 w-4" />,
      onClick: (doctor: SupabaseDoctor) => router.push(`/admin/doctors/${doctor.doctor_id}`),
      variant: 'ghost' as const,
      size: 'sm' as const,
    },
    {
      label: 'Chỉnh sửa',
      icon: <Edit className="h-4 w-4" />,
      onClick: onEdit,
      variant: 'ghost' as const,
      size: 'sm' as const,
    },
    {
      label: 'Xóa',
      icon: <Trash2 className="h-4 w-4 text-red-500" />,
      onClick: (doctor: SupabaseDoctor) => onDelete(doctor.doctor_id),
      variant: 'ghost' as const,
      size: 'sm' as const,
    },
  ];

  return (
    <DataTable
      data={doctors}
      columns={columns}
      actions={actions}
      isLoading={isLoading}
      loadingMessage="Đang tải danh sách bác sĩ..."
      emptyTitle="Không tìm thấy bác sĩ"
      emptyDescription="Hiện tại chưa có bác sĩ nào trong hệ thống."
      keyExtractor={(doctor) => doctor.doctor_id}
      onRowClick={onRowClick}
      pagination={{
        currentPage,
        totalPages,
        itemsPerPage,
        totalItems,
        onPageChange,
        showInfo: true,
        showControls: true,
      }}
      className="w-full"
    />
  );
}

export default SupabaseDoctorsTable;
