'use client';

import { useState, useEffect } from 'react';
import {
  Plus,
  Search,
  MoreVertical,
  Building2,
  Users,
  Loader2,
  Eye,
  Edit,
  UserPlus,
  XCircle,
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout';
import {
  getDepartments,
  getDepartmentHead,
  getDepartmentStaff,
  type Department,
} from '@/lib/api/departments.service';
import Link from 'next/link';

interface DepartmentWithDetails extends Department {
  headName?: string;
  staffCount?: number;
}

/**
 * Admin Departments Management Page
 * Route: /admin/departments
 */
export default function AdminDepartmentsPage() {
  const [departments, setDepartments] = useState<DepartmentWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'active' | 'inactive'>('all');
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    try {
      setIsLoading(true);
      const data = await getDepartments();

      // Fetch head and staff count for each department with delay to avoid rate limiting
      const departmentsWithDetails: DepartmentWithDetails[] = [];

      for (const dept of data) {
        try {
          // Fetch department head
          const headResponse = await getDepartmentHead(dept.id);
          const headName =
            headResponse.data?.personalInfo?.fullName ||
            headResponse.data?.personalInfo?.full_name ||
            headResponse.data?.personal_info?.fullName ||
            headResponse.data?.personal_info?.full_name ||
            'Chưa có';

          // Fetch staff count
          const staffResponse = await getDepartmentStaff(dept.id);
          const staffCount = staffResponse.total || 0;

          departmentsWithDetails.push({
            ...dept,
            headName,
            staffCount,
          });

          // Small delay to avoid overwhelming the API
          await new Promise((resolve) => setTimeout(resolve, 100));
        } catch (error) {
          console.error(`Error fetching details for department ${dept.id}:`, error);
          departmentsWithDetails.push({
            ...dept,
            headName: 'Chưa có',
            staffCount: 0,
          });
        }
      }

      setDepartments(departmentsWithDetails);
    } catch (err: any) {
      console.error('Error fetching departments:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Filter departments
  const filteredDepartments = departments.filter((dept) => {
    const matchesSearch =
      dept.nameVi.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dept.nameEn.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dept.code.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesTab =
      activeTab === 'all' ? true : activeTab === 'active' ? dept.isActive : !dept.isActive;

    return matchesSearch && matchesTab;
  });

  // Calculate stats
  const totalDepartments = departments.length;
  const totalStaff = departments.reduce((sum, dept) => sum + (dept.staffCount || 0), 0);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Quản lý khoa</h1>
            <p className="mt-1 text-gray-500">
              Quản lý các khoa phòng và phân công nhân viên trong phòng khám của bạn.
            </p>
          </div>
          <button className="flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2 font-medium text-white hover:bg-gray-800">
            <Plus className="h-4 w-4" />
            Thêm khoa
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-sm text-gray-600">Tổng số khoa</span>
              <Building2 className="h-5 w-5 text-gray-400" />
            </div>
            <div className="text-3xl font-bold text-gray-900">{totalDepartments}</div>
            <p className="mt-2 text-xs text-green-600">+2 so với tháng trước</p>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-sm text-gray-600">Tổng nhân viên</span>
              <Users className="h-5 w-5 text-gray-400" />
            </div>
            <div className="text-3xl font-bold text-gray-900">{totalStaff}</div>
            <p className="mt-2 text-xs text-green-600">+5 so với tháng trước</p>
          </div>
        </div>

        {/* Department List Card */}
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
          {/* Card Header */}
          <div className="border-b border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900">Danh sách khoa</h2>
            <p className="mt-1 text-sm text-gray-500">
              Xem và quản lý tất cả các khoa trong phòng khám của bạn
            </p>
          </div>

          {/* Search and Tabs */}
          <div className="border-b border-gray-200 p-6">
            <div className="flex items-center justify-between gap-4">
              {/* Tabs */}
              <div className="flex gap-2">
                <button
                  onClick={() => setActiveTab('all')}
                  className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                    activeTab === 'all'
                      ? 'bg-gray-900 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Tất cả khoa
                </button>
                <button
                  onClick={() => setActiveTab('active')}
                  className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                    activeTab === 'active'
                      ? 'bg-gray-900 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Đang hoạt động
                </button>
                <button
                  onClick={() => setActiveTab('inactive')}
                  className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                    activeTab === 'inactive'
                      ? 'bg-gray-900 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Ngừng hoạt động
                </button>
              </div>

              {/* Search */}
              <div className="relative w-80">
                <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Tìm kiếm khoa..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 py-2 pr-4 pl-10 focus:border-transparent focus:ring-2 focus:ring-gray-900 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                    Tên khoa
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                    Trưởng khoa
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                    Số nhân viên
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                    Trạng thái
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium tracking-wider text-gray-500 uppercase">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <Loader2 className="mb-2 h-8 w-8 animate-spin text-gray-400" />
                        <p className="text-gray-500">Đang tải danh sách khoa...</p>
                      </div>
                    </td>
                  </tr>
                ) : filteredDepartments.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <Building2 className="mb-3 h-12 w-12 text-gray-300" />
                        <p className="mb-1 font-medium text-gray-900">Không tìm thấy khoa nào</p>
                        <p className="text-sm text-gray-500">
                          {searchQuery
                            ? `Không có khoa nào khớp với "${searchQuery}"`
                            : 'Chưa có khoa nào trong hệ thống'}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredDepartments.map((dept) => (
                    <tr key={dept.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{dept.nameVi}</div>
                      </td>
                      <td className="px-6 py-4 text-sm whitespace-nowrap text-gray-500">
                        {dept.headName || 'Chưa có'}
                      </td>
                      <td className="px-6 py-4 text-sm whitespace-nowrap text-gray-900">
                        {dept.staffCount || 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            dept.isActive
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {dept.isActive ? 'Hoạt động' : 'Ngừng hoạt động'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right text-sm font-medium whitespace-nowrap">
                        <div className="relative">
                          <button
                            onClick={() =>
                              setOpenDropdown(openDropdown === dept.id ? null : dept.id)
                            }
                            className="rounded-full p-2 transition-colors hover:bg-gray-100"
                            title="Actions"
                          >
                            <MoreVertical className="h-5 w-5 text-gray-600" />
                          </button>

                          {openDropdown === dept.id && (
                            <>
                              <div
                                className="fixed inset-0 z-10"
                                onClick={() => setOpenDropdown(null)}
                              />

                              <div className="absolute right-0 z-20 mt-2 w-48 rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
                                <Link
                                  href={`/admin/departments/${dept.id}`}
                                  onClick={() => setOpenDropdown(null)}
                                  className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                                >
                                  <Eye className="h-4 w-4" />
                                  Xem chi tiết
                                </Link>
                                <Link
                                  href={`/admin/departments/${dept.id}/edit`}
                                  onClick={() => setOpenDropdown(null)}
                                  className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                                >
                                  <Edit className="h-4 w-4" />
                                  Chỉnh sửa khoa
                                </Link>
                                <Link
                                  href={`/admin/departments/${dept.id}/staff`}
                                  onClick={() => setOpenDropdown(null)}
                                  className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                                >
                                  <UserPlus className="h-4 w-4" />
                                  Quản lý nhân viên
                                </Link>
                                <button
                                  onClick={() => {
                                    setOpenDropdown(null);
                                    // Handle deactivate
                                  }}
                                  className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                                >
                                  <XCircle className="h-4 w-4" />
                                  Vô hiệu hóa
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
