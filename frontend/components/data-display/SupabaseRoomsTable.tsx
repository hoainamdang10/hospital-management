'use client';

import React from 'react';
import { Edit, Trash2, Home, Users, Building } from 'lucide-react';
import { DataTable, Column } from './DataTable';
import { StatusBadge } from './StatusBadge';
import { Badge } from '@/components/ui/badge';
import { SupabaseRoom } from '@/lib/types/supabase';

interface SupabaseRoomsTableProps {
  rooms: SupabaseRoom[];
  departments: Array<{ department_id: string; department_name: string }>;
  isLoading?: boolean;
  currentPage: number;
  totalPages: number;
  itemsPerPage: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  onEdit: (room: SupabaseRoom) => void;
  onDelete: (roomId: string) => void;
  onRowClick?: (room: SupabaseRoom) => void;
}

// Helper function to get room type icon
const getRoomTypeIcon = (roomType: string) => {
  switch (roomType.toLowerCase()) {
    case 'phòng khám':
    case 'consultation':
      return <Home className="h-4 w-4" />;
    case 'phòng mổ':
    case 'surgery':
      return <Building className="h-4 w-4" />;
    default:
      return <Home className="h-4 w-4" />;
  }
};

// Helper function to get status variant
const getStatusVariant = (status: string) => {
  switch (status.toLowerCase()) {
    case 'available':
    case 'trống':
      return 'default';
    case 'occupied':
    case 'đang sử dụng':
      return 'destructive';
    case 'maintenance':
    case 'bảo trì':
      return 'secondary';
    case 'out_of_service':
    case 'ngừng hoạt động':
      return 'outline';
    default:
      return 'outline';
  }
};

export function SupabaseRoomsTable({
  rooms,
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
}: SupabaseRoomsTableProps) {
  // Define columns for the rooms table
  const columns: Column<SupabaseRoom>[] = [
    {
      key: 'room_info',
      header: 'Phòng',
      accessor: (room) => (
        <div className="flex items-center">
          <div className="flex items-center justify-center h-10 w-10 bg-blue-100 rounded-lg mr-3">
            {getRoomTypeIcon(room.room_type)}
          </div>
          <div>
            <div className="text-sm font-medium text-gray-900">
              Phòng {room.room_number}
            </div>
            <div className="text-xs text-gray-500">{room.room_id}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'room_type',
      header: 'Loại phòng',
      accessor: (room) => (
        <Badge variant="outline" className="text-xs">
          {room.room_type}
        </Badge>
      ),
    },
    {
      key: 'department',
      header: 'Khoa',
      accessor: (room) => (
        <div className="text-sm text-gray-600">
          {room.department_name ||
           room.departments?.name ||
           departments.find(dept => dept.department_id === room.department_id)?.department_name ||
           'Chưa phân khoa'}
        </div>
      ),
      responsive: 'md',
    },
    {
      key: 'capacity',
      header: 'Sức chứa',
      accessor: (room) => (
        <div className="flex items-center text-sm text-gray-600">
          <Users className="h-4 w-4 mr-1" />
          {room.capacity} người
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Trạng thái',
      accessor: (room) => (
        <Badge variant={getStatusVariant(room.status)}>
          {room.status}
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
      onClick: (room: SupabaseRoom) => onDelete(room.room_id),
      variant: 'ghost' as const,
      size: 'sm' as const,
    },
  ];

  return (
    <DataTable
      data={rooms}
      columns={columns}
      actions={actions}
      isLoading={isLoading}
      loadingMessage="Đang tải danh sách phòng..."
      emptyTitle="Không tìm thấy phòng"
      emptyDescription="Hiện tại chưa có phòng nào trong hệ thống."
      keyExtractor={(room) => room.room_id}
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

export default SupabaseRoomsTable;
