'use client';

import React from 'react';
import { Edit, Trash2, Calendar, Clock, User, UserCheck } from 'lucide-react';
import { DataTable, Column } from './DataTable';
import { StatusBadge } from './StatusBadge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { SupabaseAppointment } from '@/lib/types/supabase';

interface SupabaseAppointmentsTableProps {
  appointments: SupabaseAppointment[];
  isLoading?: boolean;
  currentPage: number;
  totalPages: number;
  itemsPerPage: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  onEdit: (appointment: SupabaseAppointment) => void;
  onDelete: (appointmentId: string) => void;
  onRowClick?: (appointment: SupabaseAppointment) => void;
}

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

// Helper function to format time
const formatTime = (timeString: string): string => {
  if (!timeString) return 'Chưa xác định';
  try {
    // Handle both HH:MM and HH:MM:SS formats
    return timeString.slice(0, 5); // Remove seconds if present
  } catch (error) {
    return 'Giờ không hợp lệ';
  }
};

// Helper function to get status variant
const getStatusVariant = (status: string) => {
  switch (status) {
    case 'Đã xác nhận':
      return 'default';
    case 'Chờ xác nhận':
      return 'secondary';
    case 'Đã hủy':
      return 'destructive';
    case 'Hoàn thành':
      return 'outline';
    default:
      return 'secondary';
  }
};

export function SupabaseAppointmentsTable({
  appointments,
  isLoading = false,
  currentPage,
  totalPages,
  itemsPerPage,
  totalItems,
  onPageChange,
  onEdit,
  onDelete,
  onRowClick,
}: SupabaseAppointmentsTableProps) {
  // Define columns for the appointments table
  const columns: Column<SupabaseAppointment>[] = [
    {
      key: 'appointment_info',
      header: 'Cuộc hẹn',
      accessor: (appointment) => (
        <div className="flex flex-col space-y-1">
          <div className="text-sm font-medium text-gray-900">
            {appointment.appointment_id}
          </div>
          <div className="flex items-center text-xs text-gray-500">
            <Calendar className="h-3 w-3 mr-1" />
            {formatDate(appointment.appointment_date)}
          </div>
          <div className="flex items-center text-xs text-gray-500">
            <Clock className="h-3 w-3 mr-1" />
            {formatTime(appointment.appointment_time)}
          </div>
        </div>
      ),
    },
    {
      key: 'patient',
      header: 'Bệnh nhân',
      accessor: (appointment) => (
        <div className="flex items-center">
          <Avatar className="h-8 w-8 mr-3">
            <AvatarImage
              src="/placeholder.svg"
              alt={appointment.patient_name || appointment.patients?.full_name || 'Patient'}
            />
            <AvatarFallback>
              <User className="h-4 w-4" />
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="text-sm font-medium text-gray-900">
              {appointment.patient_name || appointment.patients?.full_name || 'Chưa xác định'}
            </div>
            <div className="text-xs text-gray-500">
              {appointment.patients?.phone_number}
            </div>
          </div>
        </div>
      ),
    },
    {
      key: 'doctor',
      header: 'Bác sĩ',
      accessor: (appointment) => (
        <div className="flex items-center">
          <Avatar className="h-8 w-8 mr-3">
            <AvatarImage
              src="/placeholder.svg"
              alt={appointment.doctor_name || appointment.doctors?.full_name || 'Doctor'}
            />
            <AvatarFallback>
              <UserCheck className="h-4 w-4" />
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="text-sm font-medium text-gray-900">
              {appointment.doctor_name || appointment.doctors?.full_name || 'Chưa xác định'}
            </div>
            <div className="text-xs text-gray-500">
              {appointment.doctors?.specialty}
            </div>
          </div>
        </div>
      ),
    },
    {
      key: 'treatment',
      header: 'Mô tả điều trị',
      accessor: (appointment) => (
        <div className="text-sm text-gray-600 max-w-48">
          {appointment.treatment_description}
        </div>
      ),
      responsive: 'lg',
    },
    {
      key: 'status',
      header: 'Trạng thái',
      accessor: (appointment) => (
        <Badge variant={getStatusVariant(appointment.status)}>
          {appointment.status}
        </Badge>
      ),
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
      onClick: (appointment: SupabaseAppointment) => onDelete(appointment.appointment_id),
      variant: 'ghost' as const,
      size: 'sm' as const,
    },
  ];

  return (
    <DataTable
      data={appointments}
      columns={columns}
      actions={actions}
      isLoading={isLoading}
      loadingMessage="Đang tải danh sách cuộc hẹn..."
      emptyTitle="Không tìm thấy cuộc hẹn"
      emptyDescription="Hiện tại chưa có cuộc hẹn nào trong hệ thống."
      keyExtractor={(appointment) => appointment.appointment_id}
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

export default SupabaseAppointmentsTable;
