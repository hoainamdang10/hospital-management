'use client';

import { useState, useEffect } from 'react';
import { Search, Plus, Eye, FileText, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DashboardLayout } from '@/components/layout';
import { patientService, Patient } from '@/lib/api/patient.service';
import { useDebounce } from '@/hooks/useDebounce';
import { toast } from 'sonner';
import { format } from 'date-fns';

/**
 * Admin Patients Management Page
 * Route: /admin/patients
 */
export default function AdminPatientsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 500);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    fetchPatients();
  }, [debouncedSearch]);

  const fetchPatients = async () => {
    setIsLoading(true);
    try {
      const res = await patientService.searchPatients({
        keyword: debouncedSearch,
        page: 1,
        limit: 20
      });
      if (res) {
        setPatients(res.patients || []);
        setTotal(res.total || 0);
      }
    } catch (error) {
      console.error('Failed to fetch patients:', error);
      toast.error('Không thể tải danh sách bệnh nhân');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Quản lý bệnh nhân</h1>
            <p className="mt-2 text-gray-600">Danh sách tất cả bệnh nhân ({total})</p>
          </div>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Thêm bệnh nhân
          </Button>
        </div>

        {/* Search & Filters */}
        <div className="flex items-center space-x-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm kiếm theo tên, mã BN, SĐT..."
              className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <select className="rounded-lg border border-gray-300 px-4 py-2">
            <option>Tất cả trạng thái</option>
            <option>Đang điều trị</option>
            <option>Đã xuất viện</option>
          </select>
        </div>

        {/* Patients Table */}
        <div className="overflow-hidden rounded-lg border bg-white shadow-sm">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Bệnh nhân
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Mã BN
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Số điện thoại
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Ngày sinh
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Giới tính
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <div className="flex justify-center">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  </td>
                </tr>
              ) : patients.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    Không tìm thấy bệnh nhân nào
                  </td>
                </tr>
              ) : (
                patients.map((patient) => (
                  <PatientRow
                    key={patient.patientId}
                    patient={patient}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
}

function PatientRow({ patient }: { patient: Patient }) {
  const fullName = `${patient.firstName} ${patient.lastName}`;

  return (
    <tr className="hover:bg-gray-50">
      <td className="whitespace-nowrap px-6 py-4">
        <div className="flex items-center">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-100 text-primary-700 font-semibold">
            {patient.firstName.charAt(0)}
          </div>
          <div className="ml-4">
            <div className="font-medium text-gray-900">{fullName}</div>
            <div className="text-xs text-gray-500">{patient.email}</div>
          </div>
        </div>
      </td>
      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{patient.patientId}</td>
      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{patient.phoneNumber}</td>
      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
        {patient.dateOfBirth ? format(new Date(patient.dateOfBirth), 'dd/MM/yyyy') : '-'}
      </td>
      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
        {patient.gender === 'MALE' ? 'Nam' : patient.gender === 'FEMALE' ? 'Nữ' : 'Khác'}
      </td>
      <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
        <button className="mr-3 text-primary hover:text-primary/80" title="Xem chi tiết">
          <Eye className="h-4 w-4" />
        </button>
        <button className="text-primary hover:text-primary/80" title="Hồ sơ bệnh án">
          <FileText className="h-4 w-4" />
        </button>
      </td>
    </tr>
  );
}
