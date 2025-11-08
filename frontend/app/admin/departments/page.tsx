'use client';

import { useState, useEffect } from 'react';
import { Plus, Search, MoreVertical, Building2, Users, Loader2, Eye, Edit, UserPlus, XCircle } from 'lucide-react';
import { DashboardLayout } from '@/components/layout';
import { getDepartments, getDepartmentHead, getDepartmentStaff, type Department } from '@/lib/api/departments.service';
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
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'active' | 'inactive'>('all');
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await getDepartments();
      
      // Fetch head and staff count for each department with delay to avoid rate limiting
      const departmentsWithDetails: DepartmentWithDetails[] = [];
      
      for (const dept of data) {
        try {
          // Fetch department head
          const headResponse = await getDepartmentHead(dept.id);
          const headName = headResponse.data?.personalInfo?.fullName || 
                         headResponse.data?.personal_info?.fullName || 
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
          await new Promise(resolve => setTimeout(resolve, 100));
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
      setError('Không thể tải danh sách khoa');
    } finally {
      setIsLoading(false);
    }
  };

  // Filter departments
  const filteredDepartments = departments.filter(dept => {
    const matchesSearch = 
      dept.nameVi.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dept.nameEn.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dept.code.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesTab = 
      activeTab === 'all' ? true :
      activeTab === 'active' ? dept.isActive :
      !dept.isActive;
    
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
            <p className="mt-1 text-gray-500">Quản lý các khoa phòng và phân công nhân viên trong phòng khám của bạn.</p>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 font-medium">
            <Plus className="h-4 w-4" />
            Thêm khoa
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-6 md:grid-cols-2">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-gray-600">Tổng số khoa</span>
              <Building2 className="h-5 w-5 text-gray-400" />
            </div>
            <div className="text-3xl font-bold text-gray-900">{totalDepartments}</div>
            <p className="text-xs text-green-600 mt-2">+2 so với tháng trước</p>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-gray-600">Tổng nhân viên</span>
              <Users className="h-5 w-5 text-gray-400" />
            </div>
            <div className="text-3xl font-bold text-gray-900">{totalStaff}</div>
            <p className="text-xs text-green-600 mt-2">+5 so với tháng trước</p>
          </div>
        </div>

        {/* Department List Card */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          {/* Card Header */}
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Danh sách khoa</h2>
            <p className="text-sm text-gray-500 mt-1">Xem và quản lý tất cả các khoa trong phòng khám của bạn</p>
          </div>

          {/* Search and Tabs */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between gap-4">
              {/* Tabs */}
              <div className="flex gap-2">
                <button
                  onClick={() => setActiveTab('all')}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                    activeTab === 'all'
                      ? 'bg-gray-900 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Tất cả khoa
                </button>
                <button
                  onClick={() => setActiveTab('active')}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                    activeTab === 'active'
                      ? 'bg-gray-900 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Đang hoạt động
                </button>
                <button
                  onClick={() => setActiveTab('inactive')}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
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
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Tìm kiếm khoa..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tên khoa
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Trưởng khoa
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Số nhân viên
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Trạng thái
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <Loader2 className="h-8 w-8 text-gray-400 animate-spin mb-2" />
                        <p className="text-gray-500">Đang tải danh sách khoa...</p>
                      </div>
                    </td>
                  </tr>
                ) : filteredDepartments.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <Building2 className="h-12 w-12 text-gray-300 mb-3" />
                        <p className="text-gray-900 font-medium mb-1">Không tìm thấy khoa nào</p>
                        <p className="text-gray-500 text-sm">
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
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {dept.headName || 'Chưa có'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {dept.staffCount || 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          dept.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {dept.isActive ? 'Hoạt động' : 'Ngừng hoạt động'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="relative">
                          <button
                            onClick={() => setOpenDropdown(openDropdown === dept.id ? null : dept.id)}
                            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
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
                              
                              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
                                <Link
                                  href={`/admin/departments/${dept.id}`}
                                  onClick={() => setOpenDropdown(null)}
                                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                                >
                                  <Eye className="h-4 w-4" />
                                  Xem chi tiết
                                </Link>
                                <Link
                                  href={`/admin/departments/${dept.id}/edit`}
                                  onClick={() => setOpenDropdown(null)}
                                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                                >
                                  <Edit className="h-4 w-4" />
                                  Chỉnh sửa khoa
                                </Link>
                                <Link
                                  href={`/admin/departments/${dept.id}/staff`}
                                  onClick={() => setOpenDropdown(null)}
                                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                                >
                                  <UserPlus className="h-4 w-4" />
                                  Quản lý nhân viên
                                </Link>
                                <button
                                  onClick={() => {
                                    setOpenDropdown(null);
                                    // Handle deactivate
                                  }}
                                  className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
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
