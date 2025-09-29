'use client';

import React from 'react';
import { Edit, Trash2, Phone, Mail, Calendar, Heart } from 'lucide-react';
import { DataTable, Column } from './DataTable';
import { StatusBadge } from './StatusBadge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { SupabasePatient } from '@/lib/types/supabase';

interface SupabasePatientsTableProps {
  patients: SupabasePatient[];
  isLoading?: boolean;
  currentPage: number;
  totalPages: number;
  itemsPerPage: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  onEdit: (patient: SupabasePatient) => void;
  onDelete: (patientId: string) => void;
  onRowClick?: (patient: SupabasePatient) => void;
}

// Helper function to calculate age
const calculateAge = (dateOfBirth: string): number => {
  if (!dateOfBirth) return 0;

  try {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    return age >= 0 ? age : 0;
  } catch (error) {
    return 0;
  }
};

// Helper function to format date
const formatDate = (dateString: string): string => {
  if (!dateString) return 'Chưa xác định';
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN');
  } catch (error) {
    return 'Ngày không hợp lệ';
  }
};

// Helper function to format insurance info
const formatInsuranceInfo = (insuranceInfo: any): string => {
  if (!insuranceInfo) return 'Chưa có';

  // If it's a string, return it directly
  if (typeof insuranceInfo === 'string') {
    return insuranceInfo || 'Chưa có';
  }

  // If it's an object, extract provider or return a formatted string
  if (typeof insuranceInfo === 'object') {
    if (insuranceInfo.provider) {
      return insuranceInfo.provider;
    }
    if (insuranceInfo.policy_number) {
      return `Số thẻ: ${insuranceInfo.policy_number}`;
    }
    return 'Có bảo hiểm';
  }

  return 'Chưa có';
};

// Helper function to format allergies
const formatAllergies = (allergies: any): string => {
  if (!allergies) return 'Không';

  // If it's a string, return it directly
  if (typeof allergies === 'string') {
    return allergies || 'Không';
  }

  // If it's an array, join the items
  if (Array.isArray(allergies)) {
    return allergies.length > 0 ? allergies.join(', ') : 'Không';
  }

  return 'Không';
};

// Helper function to format chronic diseases
const formatChronicDiseases = (chronicDiseases: any): string => {
  if (!chronicDiseases) return 'Không';

  // If it's a string, return it directly
  if (typeof chronicDiseases === 'string') {
    return chronicDiseases || 'Không';
  }

  // If it's an array, join the items
  if (Array.isArray(chronicDiseases)) {
    return chronicDiseases.length > 0 ? chronicDiseases.join(', ') : 'Không';
  }

  return 'Không';
};

export function SupabasePatientsTable({
  patients,
  isLoading = false,
  currentPage,
  totalPages,
  itemsPerPage,
  totalItems,
  onPageChange,
  onEdit,
  onDelete,
  onRowClick,
}: SupabasePatientsTableProps) {
  // Define columns for the patients table
  const columns: Column<SupabasePatient>[] = [
    {
      key: 'patient_info',
      header: 'Bệnh nhân',
      accessor: (patient) => (
        <div className="flex items-center">
          <Avatar className="h-10 w-10 mr-3">
            <AvatarImage
              src="/placeholder.svg"
              alt={patient.full_name}
            />
            <AvatarFallback>
              {patient.full_name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'BN'}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="text-sm font-medium text-gray-900">{patient.full_name || 'Chưa xác định'}</div>
            <div className="text-xs text-gray-500">{patient.patient_id || 'N/A'}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'age_gender',
      header: 'Tuổi/Giới tính',
      accessor: (patient) => (
        <div className="flex flex-col space-y-1">
          <div className="text-sm font-medium">
            {calculateAge(patient.dateofbirth)} tuổi
          </div>
          <StatusBadge
            status={patient.gender}
            type="gender"
            variant={patient.gender === 'Nam' ? 'default' : patient.gender === 'Nữ' ? 'secondary' : 'outline'}
          />
        </div>
      ),
    },
    {
      key: 'blood_type',
      header: 'Nhóm máu',
      accessor: (patient) => (
        <Badge variant="outline" className="text-xs">
          <Heart className="h-3 w-3 mr-1" />
          {patient.blood_type || 'Chưa xác định'}
        </Badge>
      ),
      responsive: 'md',
    },
    {
      key: 'registration_date',
      header: 'Ngày đăng ký',
      accessor: (patient) => (
        <div className="flex items-center text-sm text-gray-600">
          <Calendar className="h-3 w-3 mr-1" />
          {formatDate(patient.registration_date)}
        </div>
      ),
      responsive: 'lg',
    },
    {
      key: 'contact',
      header: 'Liên hệ',
      accessor: (patient) => (
        <div className="flex flex-col space-y-1">
          <div className="flex items-center text-xs text-gray-600">
            <Phone className="h-3 w-3 mr-1" />
            {patient.phone_number || 'Chưa có'}
          </div>
          <div className="flex items-center text-xs text-gray-600">
            <Mail className="h-3 w-3 mr-1" />
            {patient.email || 'Chưa có'}
          </div>
        </div>
      ),
      responsive: 'xl',
    },
    {
      key: 'insurance',
      header: 'Bảo hiểm',
      accessor: (patient) => (
        <Badge variant="secondary" className="text-xs">
          {formatInsuranceInfo(patient.insurance_info)}
        </Badge>
      ),
      responsive: 'lg',
    },
    {
      key: 'medical_info',
      header: 'Thông tin y tế',
      accessor: (patient) => {
        const allergies = formatAllergies(patient.allergies);
        const chronicDiseases = formatChronicDiseases(patient.chronic_diseases);

        return (
          <div className="text-xs text-gray-600 max-w-32">
            {allergies !== 'Không' && (
              <div className="mb-1">
                <span className="font-medium">Dị ứng:</span> {allergies}
              </div>
            )}
            {chronicDiseases !== 'Không' && (
              <div>
                <span className="font-medium">Bệnh mãn tính:</span> {chronicDiseases}
              </div>
            )}
            {allergies === 'Không' && chronicDiseases === 'Không' && (
              <span className="text-green-600">Khỏe mạnh</span>
            )}
          </div>
        );
      },
      responsive: 'xl',
    },
  ];

  // Define actions for each row
  const actions = [
    {
      label: '',
      icon: <Edit className="h-4 w-4" />,
      onClick: onEdit,
      variant: 'ghost' as const,
      size: 'sm' as const,
    },
    {
      label: '',
      icon: <Trash2 className="h-4 w-4 text-red-500" />,
      onClick: (patient: SupabasePatient) => onDelete(patient.patient_id),
      variant: 'ghost' as const,
      size: 'sm' as const,
    },
  ];

  return (
    <DataTable
      data={patients}
      columns={columns}
      actions={actions}
      isLoading={isLoading}
      loadingMessage="Đang tải danh sách bệnh nhân..."
      emptyTitle="Không tìm thấy bệnh nhân"
      emptyDescription="Hiện tại chưa có bệnh nhân nào trong hệ thống."
      keyExtractor={(patient) => patient.patient_id}
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

export default SupabasePatientsTable;
