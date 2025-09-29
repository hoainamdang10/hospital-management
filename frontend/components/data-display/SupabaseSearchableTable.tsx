'use client';

import React, { useState, useMemo } from 'react';
import { Plus, Search, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SupabaseDoctorsTable } from './SupabaseDoctorsTable';
import { SupabasePatientsTable } from './SupabasePatientsTable';
import { SupabaseAppointmentsTable } from './SupabaseAppointmentsTable';
import { SupabaseRoomsTable } from './SupabaseRoomsTable';
import { 
  SupabaseDoctor, 
  SupabasePatient, 
  SupabaseAppointment, 
  SupabaseRoom,
  SupabaseDepartment 
} from '@/lib/types/supabase';

type TableType = 'doctors' | 'patients' | 'appointments' | 'rooms';
type TableData = SupabaseDoctor | SupabasePatient | SupabaseAppointment | SupabaseRoom;

interface SupabaseSearchableTableProps<T extends TableData> {
  type: TableType;
  data: T[];
  departments?: SupabaseDepartment[];
  title: string;
  description?: string;
  isLoading?: boolean;
  onAdd?: () => void;
  addButtonLabel?: string;
  onEdit: (item: T) => void;
  onDelete: (id: string) => void;
  onRowClick?: (item: T) => void;
  searchPlaceholder?: string;
  itemsPerPage?: number;
}

export function SupabaseSearchableTable<T extends TableData>({
  type,
  data,
  departments = [],
  title,
  description,
  isLoading = false,
  onAdd,
  addButtonLabel = 'Thêm mới',
  onEdit,
  onDelete,
  onRowClick,
  searchPlaceholder = 'Tìm kiếm...',
  itemsPerPage = 10,
}: SupabaseSearchableTableProps<T>) {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');

  // Filter and search data
  const filteredData = useMemo(() => {
    let filtered = data;

    // Apply search filter
    if (searchTerm.trim()) {
      filtered = filtered.filter((item) => {
        const searchableFields = getSearchableFields(item, type);
        return searchableFields.some(field => 
          String(field).toLowerCase().includes(searchTerm.toLowerCase())
        );
      });
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter((item) => {
        if ('status' in item) {
          return item.status === statusFilter;
        }
        if ('gender' in item && type === 'doctors') {
          return item.gender === statusFilter;
        }
        return true;
      });
    }

    // Apply department filter
    if (departmentFilter !== 'all' && 'department_id' in filtered[0]) {
      filtered = filtered.filter((item) => {
        if ('department_id' in item) {
          return item.department_id === departmentFilter;
        }
        return true;
      });
    }

    return filtered;
  }, [data, searchTerm, statusFilter, departmentFilter, type]);

  // Pagination
  const totalItems = filteredData.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedData = filteredData.slice(startIndex, endIndex);

  // Reset to first page when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, departmentFilter]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Get filter options based on table type
  const getFilterOptions = () => {
    switch (type) {
      case 'doctors':
        return {
          status: [
            { value: 'all', label: 'Tất cả giới tính' },
            { value: 'Nam', label: 'Nam' },
            { value: 'Nữ', label: 'Nữ' },
          ],
          showDepartmentFilter: true,
        };
      case 'appointments':
        return {
          status: [
            { value: 'all', label: 'Tất cả trạng thái' },
            { value: 'Đã xác nhận', label: 'Đã xác nhận' },
            { value: 'Chờ xác nhận', label: 'Chờ xác nhận' },
            { value: 'Đã hủy', label: 'Đã hủy' },
            { value: 'Hoàn thành', label: 'Hoàn thành' },
          ],
          showDepartmentFilter: false,
        };
      case 'rooms':
        return {
          status: [
            { value: 'all', label: 'Tất cả trạng thái' },
            { value: 'Trống', label: 'Trống' },
            { value: 'Đang sử dụng', label: 'Đang sử dụng' },
            { value: 'Bảo trì', label: 'Bảo trì' },
          ],
          showDepartmentFilter: true,
        };
      default:
        return {
          status: [{ value: 'all', label: 'Tất cả' }],
          showDepartmentFilter: false,
        };
    }
  };

  const filterOptions = getFilterOptions();

  // Render appropriate table based on type
  const renderTable = () => {
    const commonProps = {
      isLoading,
      currentPage,
      totalPages,
      itemsPerPage,
      totalItems,
      onPageChange: handlePageChange,
      onEdit,
      onDelete,
      onRowClick,
    };

    switch (type) {
      case 'doctors':
        return (
          <SupabaseDoctorsTable
            {...commonProps}
            doctors={paginatedData as SupabaseDoctor[]}
            departments={departments}
          />
        );
      case 'patients':
        return (
          <SupabasePatientsTable
            {...commonProps}
            patients={paginatedData as SupabasePatient[]}
          />
        );
      case 'appointments':
        return (
          <SupabaseAppointmentsTable
            {...commonProps}
            appointments={paginatedData as SupabaseAppointment[]}
          />
        );
      case 'rooms':
        return (
          <SupabaseRoomsTable
            {...commonProps}
            rooms={paginatedData as SupabaseRoom[]}
            departments={departments}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
          {description && (
            <p className="text-muted-foreground">{description}</p>
          )}
        </div>
        {onAdd && (
          <Button onClick={onAdd}>
            <Plus className="h-4 w-4 mr-2" />
            {addButtonLabel}
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder={searchPlaceholder}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        
        <div className="flex gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {filterOptions.status.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {filterOptions.showDepartmentFilter && departments.length > 0 && (
            <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Chọn khoa" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả khoa</SelectItem>
                {departments.map((dept) => (
                  <SelectItem key={dept.department_id} value={dept.department_id}>
                    {dept.department_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      {/* Table */}
      {renderTable()}

      {/* Search Results Info */}
      {searchTerm && (
        <div className="text-sm text-muted-foreground">
          {filteredData.length === 0 ? (
            `Không tìm thấy kết quả cho "${searchTerm}"`
          ) : (
            `Tìm thấy ${filteredData.length} kết quả cho "${searchTerm}"`
          )}
        </div>
      )}
    </div>
  );
}

// Helper function to get searchable fields based on data type
function getSearchableFields(item: TableData, type: TableType): string[] {
  switch (type) {
    case 'doctors':
      const doctor = item as SupabaseDoctor;
      return [
        doctor.full_name,
        doctor.doctor_id,
        doctor.specialty,
        doctor.qualification,
        doctor.email,
        doctor.phone_number,
      ];
    case 'patients':
      const patient = item as SupabasePatient;
      return [
        patient.full_name,
        patient.patient_id,
        patient.email,
        patient.phone_number,
        patient.blood_type,
      ];
    case 'appointments':
      const appointment = item as SupabaseAppointment;
      return [
        appointment.appointment_id,
        appointment.patient_name || '',
        appointment.doctor_name || '',
        appointment.treatment_description,
      ];
    case 'rooms':
      const room = item as SupabaseRoom;
      return [
        room.room_id,
        room.room_number,
        room.room_type,
        room.status,
      ];
    default:
      return [];
  }
}

export default SupabaseSearchableTable;
