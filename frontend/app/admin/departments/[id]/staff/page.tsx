'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, UserPlus, Search, MoreVertical, Loader2, Eye, Shield, Trash2 } from 'lucide-react';
import { DashboardLayout } from '@/components/layout';
import { getDepartmentById, getDepartmentStaff, setDepartmentHead, type Department } from '@/lib/api/departments.service';

/**
 * Manage Department Staff Page
 * Route: /admin/departments/[id]/staff
 */
export default function ManageDepartmentStaffPage() {
  const params = useParams();
  const router = useRouter();
  const [department, setDepartment] = useState<Department | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [staffList, setStaffList] = useState<any[]>([]);
  const [isLoadingStaff, setIsLoadingStaff] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [showChangeRoleModal, setShowChangeRoleModal] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<any>(null);
  const [selectedRole, setSelectedRole] = useState<'head' | 'staff'>('staff');
  const [isSavingRole, setIsSavingRole] = useState(false);

  useEffect(() => {
    if (params.id) {
      fetchDepartment(params.id as string);
    }
  }, [params.id]);

  const fetchDepartment = async (id: string) => {
    try {
      setIsLoading(true);
      const response = await getDepartmentById(id);
      if (response.success) {
        setDepartment(response.data);
        // Load staff after department is loaded
        fetchStaff(id);
      }
    } catch (error) {
      console.error('Error fetching department:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStaff = async (departmentId: string) => {
    try {
      setIsLoadingStaff(true);
      const response = await getDepartmentStaff(departmentId);
      if (response.success) {
        setStaffList(response.data);
      }
    } catch (error) {
      console.error('Error fetching staff:', error);
    } finally {
      setIsLoadingStaff(false);
    }
  };

  // Filter staff
  const filteredStaff = staffList.filter(staff => {
    const matchesSearch = staff.personalInfo?.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         staff.personalInfo?.email?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === 'all' || staff.professionalInfo?.position?.toLowerCase() === roleFilter.toLowerCase();
    return matchesSearch && matchesRole;
  });

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-12">
          <p>Đang tải...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (!department) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <p>Không tìm thấy khoa</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="h-5 w-5 text-gray-600" />
            </button>
            <div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-bold text-gray-900">Quản lý nhân viên</h1>
                  <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded">{department.nameVi}</span>
                </div>
                <p className="text-sm text-gray-500 mt-1">Quản lý nhân viên được phân công vào khoa {department.nameVi}</p>
              </div>
            </div>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 font-medium text-sm">
            <UserPlus className="h-4 w-4" />
            Thêm nhân viên
          </button>
        </div>

        {/* Staff List Card */}
        <div className="bg-white rounded-lg border border-gray-200">
          {/* Header */}
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Nhân viên khoa</h2>
            <p className="text-sm text-gray-500 mt-1">Quản lý nhân viên được phân công vào khoa {department.nameVi}</p>
          </div>

          {/* Search and Filter */}
          <div className="p-6 border-b border-gray-200 flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Tìm kiếm nhân viên..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              />
            </div>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
            >
              <option value="all">Tất cả vai trò</option>
              <option value="cardiologist">Bác sĩ tim mạch</option>
              <option value="nurse">Y tá</option>
              <option value="technician">Kỹ thuật viên</option>
            </select>
          </div>

          {/* Table */}
          {isLoadingStaff ? (
            <div className="text-center py-12">
              <Loader2 className="h-8 w-8 text-gray-400 animate-spin mx-auto mb-2" />
              <p className="text-gray-500">Đang tải danh sách nhân viên...</p>
            </div>
          ) : filteredStaff.length === 0 ? (
            <div className="text-center py-12">
              <UserPlus className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-900 font-medium">Không tìm thấy nhân viên</p>
              <p className="text-gray-500 text-sm mt-1">
                {searchQuery ? `Không có nhân viên nào khớp với "${searchQuery}"` : 'Thêm nhân viên vào khoa này'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="w-12 px-6 py-3">
                      <input type="checkbox" className="rounded border-gray-300" />
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tên
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Vai trò
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Trạng thái
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ngày tham gia
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Thao tác
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredStaff.map((staff, index) => (
                    <tr key={staff.id || index} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <input type="checkbox" className="rounded border-gray-300" />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                            <span className="text-sm font-semibold text-gray-600">
                              {staff.personalInfo?.fullName?.split(' ').map((n: string) => n[0]).join('').slice(0, 2) || 'DS'}
                            </span>
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {staff.personalInfo?.fullName || 'Không rõ'}
                            </div>
                            <div className="text-xs text-gray-500">
                              {staff.staffId || 'N/A'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {staff.professionalInfo?.title || staff.professionalInfo?.position || 'Nhân viên'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {staff.personalInfo?.email || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          staff.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {staff.isActive ? 'Hoạt động' : 'Ngừng hoạt động'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {staff.registrationDate ? new Date(staff.registrationDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="relative">
                          <button
                            onClick={() => setOpenDropdown(openDropdown === staff.id ? null : staff.id)}
                            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                            title="Actions"
                          >
                            <MoreVertical className="h-4 w-4 text-gray-600" />
                          </button>

                          {openDropdown === staff.id && (
                            <>
                              <div 
                                className="fixed inset-0 z-10" 
                                onClick={() => setOpenDropdown(null)}
                              />
                              
                              <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
                                <button
                                  onClick={() => {
                                    setOpenDropdown(null);
                                    router.push(`/admin/staff/${staff.staffId}`);
                                  }}
                                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                                >
                                  <Eye className="h-4 w-4" />
                                  Xem hồ sơ
                                </button>
                                <button
                                  onClick={() => {
                                    setOpenDropdown(null);
                                    setSelectedStaff(staff);
                                    setShowChangeRoleModal(true);
                                  }}
                                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                                >
                                  <Shield className="h-4 w-4" />
                                  Thay đổi vai trò
                                </button>
                                <button
                                  onClick={() => {
                                    setOpenDropdown(null);
                                    if (confirm(`Xóa ${staff.personalInfo?.fullName} khỏi khoa này?`)) {
                                      // TODO: Call API to remove staff from department
                                      console.log('Remove staff:', staff.id);
                                    }
                                  }}
                                  className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                                >
                                  <Trash2 className="h-4 w-4" />
                                  Xóa khỏi khoa
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Change Role Modal */}
        {showChangeRoleModal && selectedStaff && (
          <div className="fixed inset-0 bg-black bg-opacity-20 flex items-center justify-center z-50" onClick={() => {
            setShowChangeRoleModal(false);
            setSelectedStaff(null);
          }}>
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Thay đổi vai trò</h3>
              <p className="text-sm text-gray-600 mb-4">
                Thay đổi vai trò cho <span className="font-medium">{selectedStaff.personalInfo?.fullName}</span>
              </p>
              
              <div className="space-y-3 mb-6">
                <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                  <input
                    type="radio"
                    name="role"
                    value="head"
                    checked={selectedRole === 'head'}
                    onChange={(e) => setSelectedRole(e.target.value as 'head' | 'staff')}
                    className="w-4 h-4"
                  />
                  <div>
                    <div className="text-sm font-medium text-gray-900">Trưởng khoa</div>
                    <div className="text-xs text-gray-500">Đặt làm trưởng khoa</div>
                  </div>
                </label>
                
                <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                  <input
                    type="radio"
                    name="role"
                    value="staff"
                    checked={selectedRole === 'staff'}
                    onChange={(e) => setSelectedRole(e.target.value as 'head' | 'staff')}
                    className="w-4 h-4"
                  />
                  <div>
                    <div className="text-sm font-medium text-gray-900">Nhân viên thường</div>
                    <div className="text-xs text-gray-500">Nhân viên thường trong khoa</div>
                  </div>
                </label>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowChangeRoleModal(false);
                    setSelectedStaff(null);
                    setSelectedRole('staff');
                  }}
                  disabled={isSavingRole}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-medium disabled:opacity-50"
                >
                  Hủy
                </button>
                <button
                  onClick={async () => {
                    if (!department?.id || !selectedStaff?.staffId) return;
                    
                    try {
                      setIsSavingRole(true);
                      
                      if (selectedRole === 'head') {
                        // Set as department head - use staffId not id (UUID)
                        await setDepartmentHead(department.id, selectedStaff.staffId);
                        alert('Đã đặt làm trưởng khoa thành công!');
                      } else {
                        // TODO: Remove department head status
                        alert('Tính năng xóa trưởng khoa đang phát triển!');
                      }
                      
                      // Reload staff list
                      await fetchStaff(department.id);
                      
                      setShowChangeRoleModal(false);
                      setSelectedStaff(null);
                      setSelectedRole('staff');
                    } catch (error) {
                      console.error('Error changing role:', error);
                      alert('Không thể thay đổi vai trò. Vui lòng thử lại.');
                    } finally {
                      setIsSavingRole(false);
                    }
                  }}
                  disabled={isSavingRole}
                  className="flex-1 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSavingRole ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Đang lưu...
                    </>
                  ) : (
                    'Lưu thay đổi'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
