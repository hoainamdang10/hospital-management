'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  UserPlus,
  Search,
  MoreVertical,
  Loader2,
  Eye,
  Shield,
  Trash2,
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout';
import {
  getDepartmentById,
  getDepartmentStaff,
  setDepartmentHead,
  type Department,
} from '@/lib/api/departments.service';

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

  const normalizeStaff = (staff: any) => {
    const personalInfo = staff.personalInfo || staff.personal_info || {};
    const professionalInfo = staff.professionalInfo || staff.professional_info || {};

    const fullName =
      personalInfo.fullName || personalInfo.full_name || personalInfo.name || 'Không rõ';

    const email =
      personalInfo.email ||
      personalInfo.contact?.email ||
      staff.email ||
      professionalInfo.contact?.email ||
      '';

    return {
      ...staff,
      staffId: staff.staffId || staff.staff_id,
      personalInfo: {
        ...personalInfo,
        fullName,
        email,
      },
      professionalInfo: {
        ...professionalInfo,
      },
      isActive: typeof staff.isActive === 'boolean' ? staff.isActive : staff.status === 'active',
      registrationDate: staff.registrationDate || staff.registration_date,
    };
  };

  const fetchStaff = async (departmentId: string) => {
    try {
      setIsLoadingStaff(true);
      const response = await getDepartmentStaff(departmentId);
      if (response.success) {
        const normalized = (response.data || []).map(normalizeStaff);
        setStaffList(normalized);
      }
    } catch (error) {
      console.error('Error fetching staff:', error);
    } finally {
      setIsLoadingStaff(false);
    }
  };

  // Filter staff
  const filteredStaff = staffList.filter((staff) => {
    const search = searchQuery.toLowerCase();
    const name = staff.personalInfo?.fullName?.toLowerCase() || '';
    const email = staff.personalInfo?.email?.toLowerCase() || '';
    const matchesSearch = name.includes(search) || email.includes(search);
    const matchesRole =
      roleFilter === 'all' ||
      (staff.professionalInfo?.title || staff.professionalInfo?.position || '')
        .toLowerCase()
        .includes(roleFilter.toLowerCase());
    return matchesSearch && matchesRole;
  });

  const getStaffInitials = (staff: any) => {
    const name = staff.personalInfo?.fullName;
    if (name) {
      return name
        .split(' ')
        .map((n: string) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase();
    }
    return 'DS';
  };

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
        <div className="py-12 text-center">
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
              className="rounded-lg p-2 transition-colors hover:bg-gray-100"
            >
              <ArrowLeft className="h-5 w-5 text-gray-600" />
            </button>
            <div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-bold text-gray-900">Quản lý nhân viên</h1>
                  <span className="rounded bg-green-100 px-2 py-1 text-xs font-medium text-green-700">
                    {department.nameVi}
                  </span>
                </div>
                <p className="mt-1 text-sm text-gray-500">
                  Quản lý nhân viên được phân công vào khoa {department.nameVi}
                </p>
              </div>
            </div>
          </div>
          <button className="flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800">
            <UserPlus className="h-4 w-4" />
            Thêm nhân viên
          </button>
        </div>

        {/* Staff List Card */}
        <div className="rounded-lg border border-gray-200 bg-white">
          {/* Header */}
          <div className="border-b border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900">Nhân viên khoa</h2>
            <p className="mt-1 text-sm text-gray-500">
              Quản lý nhân viên được phân công vào khoa {department.nameVi}
            </p>
          </div>

          {/* Search and Filter */}
          <div className="flex items-center gap-4 border-b border-gray-200 p-6">
            <div className="relative flex-1">
              <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Tìm kiếm nhân viên..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-lg border border-gray-300 py-2 pr-4 pl-9 text-sm focus:border-transparent focus:ring-2 focus:ring-gray-900"
              />
            </div>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-gray-900"
            >
              <option value="all">Tất cả vai trò</option>
              <option value="cardiologist">Bác sĩ tim mạch</option>
              <option value="technician">Kỹ thuật viên</option>
            </select>
          </div>

          {/* Table */}
          {isLoadingStaff ? (
            <div className="py-12 text-center">
              <Loader2 className="mx-auto mb-2 h-8 w-8 animate-spin text-gray-400" />
              <p className="text-gray-500">Đang tải danh sách nhân viên...</p>
            </div>
          ) : filteredStaff.length === 0 ? (
            <div className="py-12 text-center">
              <UserPlus className="mx-auto mb-3 h-12 w-12 text-gray-400" />
              <p className="font-medium text-gray-900">Không tìm thấy nhân viên</p>
              <p className="mt-1 text-sm text-gray-500">
                {searchQuery
                  ? `Không có nhân viên nào khớp với "${searchQuery}"`
                  : 'Thêm nhân viên vào khoa này'}
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
                    <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                      Tên
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                      Vai trò
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                      Trạng thái
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                      Ngày tham gia
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium tracking-wider text-gray-500 uppercase">
                      Thao tác
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {filteredStaff.map((staff, index) => (
                    <tr key={staff.id || index} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <input type="checkbox" className="rounded border-gray-300" />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-200">
                            <span className="text-sm font-semibold text-gray-600">
                              {staff.personalInfo?.fullName
                                ?.split(' ')
                                .map((n: string) => n[0])
                                .join('')
                                .slice(0, 2) || 'DS'}
                            </span>
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {staff.personalInfo?.fullName || 'Không rõ'}
                            </div>
                            <div className="text-xs text-gray-500">{staff.staffId || 'N/A'}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm whitespace-nowrap text-gray-900">
                        {staff.professionalInfo?.title ||
                          staff.professionalInfo?.position ||
                          'Nhân viên'}
                      </td>
                      <td className="px-6 py-4 text-sm whitespace-nowrap text-gray-500">
                        {staff.personalInfo?.email || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            staff.isActive
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {staff.isActive ? 'Hoạt động' : 'Ngừng hoạt động'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm whitespace-nowrap text-gray-500">
                        {staff.registrationDate
                          ? new Date(staff.registrationDate).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })
                          : 'N/A'}
                      </td>
                      <td className="px-6 py-4 text-right text-sm font-medium whitespace-nowrap">
                        <div className="relative">
                          <button
                            onClick={() =>
                              setOpenDropdown(openDropdown === staff.id ? null : staff.id)
                            }
                            className="rounded-full p-2 transition-colors hover:bg-gray-100"
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

                              <div className="absolute right-0 z-20 mt-2 w-56 rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
                                <button
                                  onClick={() => {
                                    setOpenDropdown(null);
                                    router.push(`/admin/staff/${staff.staffId}`);
                                  }}
                                  className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
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
                                  className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                                >
                                  <Shield className="h-4 w-4" />
                                  Thay đổi vai trò
                                </button>
                                <button
                                  onClick={() => {
                                    setOpenDropdown(null);
                                    if (
                                      confirm(`Xóa ${staff.personalInfo?.fullName} khỏi khoa này?`)
                                    ) {
                                      // TODO: Call API to remove staff from department
                                      console.log('Remove staff:', staff.id);
                                    }
                                  }}
                                  className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50"
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
          <div
            className="bg-opacity-20 fixed inset-0 z-50 flex items-center justify-center bg-black"
            onClick={() => {
              setShowChangeRoleModal(false);
              setSelectedStaff(null);
            }}
          >
            <div
              className="mx-4 w-full max-w-md rounded-lg bg-white p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="mb-4 text-lg font-semibold text-gray-900">Thay đổi vai trò</h3>
              <p className="mb-4 text-sm text-gray-600">
                Thay đổi vai trò cho{' '}
                <span className="font-medium">{selectedStaff.personalInfo?.fullName}</span>
              </p>

              <div className="mb-6 space-y-3">
                <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-gray-200 p-3 hover:bg-gray-50">
                  <input
                    type="radio"
                    name="role"
                    value="head"
                    checked={selectedRole === 'head'}
                    onChange={(e) => setSelectedRole(e.target.value as 'head' | 'staff')}
                    className="h-4 w-4"
                  />
                  <div>
                    <div className="text-sm font-medium text-gray-900">Trưởng khoa</div>
                    <div className="text-xs text-gray-500">Đặt làm trưởng khoa</div>
                  </div>
                </label>

                <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-gray-200 p-3 hover:bg-gray-50">
                  <input
                    type="radio"
                    name="role"
                    value="staff"
                    checked={selectedRole === 'staff'}
                    onChange={(e) => setSelectedRole(e.target.value as 'head' | 'staff')}
                    className="h-4 w-4"
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
                  className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-50 disabled:opacity-50"
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
                  className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
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
