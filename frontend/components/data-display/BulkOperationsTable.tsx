'use client';

import React, { useState, useMemo } from 'react';
import { Plus, Search, Filter, Download, Trash2, Edit, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { SupabaseDoctorsTable } from './SupabaseDoctorsTable';
import { SupabasePatientsTable } from './SupabasePatientsTable';
import { SupabaseAppointmentsTable } from './SupabaseAppointmentsTable';
import { SupabaseRoomsTable } from './SupabaseRoomsTable';
import { toast } from 'sonner';
import { 
  SupabaseDoctor, 
  SupabasePatient, 
  SupabaseAppointment, 
  SupabaseRoom,
  SupabaseDepartment 
} from '@/lib/types/supabase';

type TableType = 'doctors' | 'patients' | 'appointments' | 'rooms';
type TableData = SupabaseDoctor | SupabasePatient | SupabaseAppointment | SupabaseRoom;

interface BulkOperationsTableProps<T extends TableData> {
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
  onBulkDelete?: (ids: string[]) => void;
  onBulkExport?: (ids: string[]) => void;
  onBulkEdit?: (ids: string[]) => void;
  onRowClick?: (item: T) => void;
  searchPlaceholder?: string;
  itemsPerPage?: number;
}

export function BulkOperationsTable<T extends TableData>({
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
  onBulkDelete,
  onBulkExport,
  onBulkEdit,
  onRowClick,
  searchPlaceholder = 'Tìm kiếm...',
  itemsPerPage = 10,
}: BulkOperationsTableProps<T>) {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [selectAll, setSelectAll] = useState(false);

  // Get the ID field based on table type
  const getIdField = (type: TableType): keyof TableData => {
    switch (type) {
      case 'doctors': return 'doctor_id';
      case 'patients': return 'patient_id';
      case 'appointments': return 'appointment_id';
      case 'rooms': return 'room_id';
      default: return 'id' as keyof TableData;
    }
  };

  const idField = getIdField(type);

  // Filter data based on search term and filters
  const filteredData = useMemo(() => {
    return data.filter((item) => {
      // Search filter
      const searchMatch = !searchTerm || Object.values(item).some(value =>
        String(value).toLowerCase().includes(searchTerm.toLowerCase())
      );

      // Status filter
      const statusMatch = statusFilter === 'all' || 
        (item as any).status === statusFilter ||
        (item as any).availability_status === statusFilter ||
        (item as any).is_active === (statusFilter === 'active');

      // Department filter (for doctors and rooms)
      const departmentMatch = departmentFilter === 'all' || 
        (item as any).department_id === departmentFilter;

      return searchMatch && statusMatch && departmentMatch;
    });
  }, [data, searchTerm, statusFilter, departmentFilter]);

  // Pagination
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = filteredData.slice(startIndex, startIndex + itemsPerPage);

  // Selection handlers
  const handleSelectAll = (checked: boolean) => {
    setSelectAll(checked);
    if (checked) {
      const allIds = paginatedData.map(item => String(item[idField]));
      setSelectedItems(new Set(allIds));
    } else {
      setSelectedItems(new Set());
    }
  };

  const handleSelectItem = (id: string, checked: boolean) => {
    const newSelected = new Set(selectedItems);
    if (checked) {
      newSelected.add(id);
    } else {
      newSelected.delete(id);
    }
    setSelectedItems(newSelected);
    setSelectAll(newSelected.size === paginatedData.length);
  };

  // Bulk operations
  const handleBulkDelete = async () => {
    if (selectedItems.size === 0) {
      toast.error('Vui lòng chọn ít nhất một mục để xóa');
      return;
    }

    if (onBulkDelete) {
      try {
        await onBulkDelete(Array.from(selectedItems));
        setSelectedItems(new Set());
        setSelectAll(false);
        toast.success(`Đã xóa ${selectedItems.size} mục thành công`);
      } catch (error) {
        toast.error('Lỗi khi xóa các mục đã chọn');
      }
    }
  };

  const handleBulkExport = async () => {
    if (selectedItems.size === 0) {
      toast.error('Vui lòng chọn ít nhất một mục để xuất');
      return;
    }

    if (onBulkExport) {
      try {
        await onBulkExport(Array.from(selectedItems));
        toast.success(`Đã xuất ${selectedItems.size} mục thành công`);
      } catch (error) {
        toast.error('Lỗi khi xuất các mục đã chọn');
      }
    } else {
      // Default export functionality
      const selectedData = data.filter(item => selectedItems.has(String(item[idField])));
      const exportContent = generateBulkExportHTML(selectedData, type);
      
      const blob = new Blob([exportContent], { type: 'text/html' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `bulk-export-${type}-${new Date().toISOString().split('T')[0]}.html`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success(`Đã xuất ${selectedItems.size} mục thành công`);
    }
  };

  const generateBulkExportHTML = (items: T[], type: string): string => {
    const currentDate = new Date().toLocaleDateString('vi-VN');
    const currentTime = new Date().toLocaleTimeString('vi-VN');

    const itemsHTML = items.map(item => {
      switch (type) {
        case 'patients':
          const patient = item as SupabasePatient;
          return `
            <tr>
              <td>${patient.patient_id}</td>
              <td>${(patient as any).profiles?.full_name || 'N/A'}</td>
              <td>${(patient as any).profiles?.phone_number || 'N/A'}</td>
              <td>${(patient as any).profiles?.date_of_birth || 'N/A'}</td>
              <td>${patient.status || 'N/A'}</td>
            </tr>
          `;
        case 'doctors':
          const doctor = item as SupabaseDoctor;
          return `
            <tr>
              <td>${doctor.doctor_id}</td>
              <td>${(doctor as any).profiles?.full_name || 'N/A'}</td>
              <td>${doctor.specialty || 'N/A'}</td>
              <td>${doctor.department_name || 'N/A'}</td>
              <td>${doctor.availability_status || 'N/A'}</td>
            </tr>
          `;
        default:
          return `<tr><td colspan="5">Unsupported type</td></tr>`;
      }
    }).join('');

    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Bulk Export - ${type}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { text-align: center; margin-bottom: 20px; }
        table { width: 100%; border-collapse: collapse; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f5f5f5; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Bulk Export - ${type.toUpperCase()}</h1>
        <p>Exported: ${currentDate} ${currentTime}</p>
        <p>Total items: ${items.length}</p>
    </div>
    <table>
        <thead>
          ${type === 'patients' ? `
            <tr>
              <th>Patient ID</th>
              <th>Full Name</th>
              <th>Phone</th>
              <th>Date of Birth</th>
              <th>Status</th>
            </tr>
          ` : type === 'doctors' ? `
            <tr>
              <th>Doctor ID</th>
              <th>Full Name</th>
              <th>Specialty</th>
              <th>Department</th>
              <th>Status</th>
            </tr>
          ` : ''}
        </thead>
        <tbody>
          ${itemsHTML}
        </tbody>
    </table>
</body>
</html>
    `;
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">{title}</h2>
          {description && <p className="text-muted-foreground">{description}</p>}
        </div>
        <div className="flex gap-2">
          {onAdd && (
            <Button onClick={onAdd}>
              <Plus className="h-4 w-4 mr-2" />
              {addButtonLabel}
            </Button>
          )}
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder={searchPlaceholder}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
            {type === 'doctors' && (
              <>
                <SelectItem value="available">Available</SelectItem>
                <SelectItem value="busy">Busy</SelectItem>
                <SelectItem value="offline">Offline</SelectItem>
              </>
            )}
          </SelectContent>
        </Select>

        {(type === 'doctors' || type === 'rooms') && departments.length > 0 && (
          <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by department" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Departments</SelectItem>
              {departments.map((dept) => (
                <SelectItem key={dept.department_id} value={dept.department_id}>
                  {dept.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Bulk Operations */}
      {selectedItems.size > 0 && (
        <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
          <span className="text-sm font-medium">
            {selectedItems.size} mục đã chọn
          </span>
          <div className="flex gap-2 ml-auto">
            <Button variant="outline" size="sm" onClick={handleBulkExport}>
              <Download className="h-4 w-4 mr-1" />
              Xuất
            </Button>
            {onBulkEdit && (
              <Button variant="outline" size="sm" onClick={() => onBulkEdit(Array.from(selectedItems))}>
                <Edit className="h-4 w-4 mr-1" />
                Chỉnh sửa
              </Button>
            )}
            <Button variant="destructive" size="sm" onClick={handleBulkDelete}>
              <Trash2 className="h-4 w-4 mr-1" />
              Xóa
            </Button>
          </div>
        </div>
      )}

      {/* Table with Selection */}
      <div className="border rounded-lg">
        <div className="p-4 border-b flex items-center gap-2">
          <Checkbox
            checked={selectAll}
            onCheckedChange={handleSelectAll}
            aria-label="Select all items"
          />
          <span className="text-sm font-medium">Chọn tất cả</span>
        </div>
        
        {/* Render appropriate table component */}
        {(() => {
          const commonProps = {
            isLoading,
            onEdit,
            onDelete,
            onRowClick,
            selectedItems,
            onSelectItem: handleSelectItem,
            showSelection: true
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
        })()}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredData.length)} of {filteredData.length} results
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            <span className="flex items-center px-3 text-sm">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default BulkOperationsTable;
