'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Calendar, Mail, Phone, MapPin, Edit, Users, Loader2 } from 'lucide-react';
import { DashboardLayout } from '@/components/layout';
import {
  getDepartmentById,
  getDepartmentHead,
  getDepartmentStaff,
  type Department,
} from '@/lib/api/departments.service';

/**
 * Department Details Page
 * Route: /admin/departments/[id]
 */
export default function DepartmentDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const [department, setDepartment] = useState<Department | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'about' | 'staff' | 'services'>('about');
  const [staffList, setStaffList] = useState<any[]>([]);
  const [departmentHead, setDepartmentHead] = useState<any | null>(null);
  const [isLoadingStaff, setIsLoadingStaff] = useState(false);
  const [isLoadingHead, setIsLoadingHead] = useState(false);

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
        fetchHead(id);
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
      personalInfo.fullName || personalInfo.full_name || personalInfo.name || 'Không có tên';

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

  const fetchHead = async (departmentId: string) => {
    try {
      setIsLoadingHead(true);
      const response = await getDepartmentHead(departmentId);
      if (response.success && response.data) {
        setDepartmentHead(normalizeStaff(response.data));
      } else {
        setDepartmentHead(null);
      }
    } catch (error) {
      console.error('Error fetching department head:', error);
      setDepartmentHead(null);
    } finally {
      setIsLoadingHead(false);
    }
  };

  // Load staff when switching to staff tab
  useEffect(() => {
    if (activeTab === 'staff' && params.id && staffList.length === 0) {
      fetchStaff(params.id as string);
    }
  }, [activeTab, params.id]);

  const getStaffInitials = (staff: any, fallback: string) => {
    const name = staff.personalInfo?.fullName;
    if (name) {
      return name
        .split(' ')
        .map((n: string) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase();
    }
    return fallback;
  };

  const getFormattedDescription = () => {
    if (department?.description && department.description.trim().length > 0) {
      return department.description;
    }
    return `Khoa ${department?.nameVi} cung cấp dịch vụ chuyên môn cho bệnh nhân.`;
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
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="rounded-lg p-2 transition-colors hover:bg-gray-100"
            title="Quay lại"
          >
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{department.nameVi}</h1>
            <p className="mt-1 text-gray-500">{department.nameEn}</p>
          </div>
        </div>

        {/* Two Column Layout */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left Column - Department Information */}
          <div className="lg:col-span-1">
            <div className="rounded-lg border border-gray-200 bg-white p-8">
              <h2 className="mb-2 text-2xl font-bold text-gray-900">Thông tin khoa</h2>
              <p className="mb-8 text-gray-500">Chi tiết về khoa {department.nameVi}</p>

              <div className="mb-8 space-y-4">
                <div className="flex items-center gap-3">
                  <Users className="h-5 w-5 text-gray-400" />
                  <p className="text-sm text-gray-900">
                    <span className="font-medium">Trưởng khoa:</span>{' '}
                    {isLoadingHead
                      ? 'Đang tải...'
                      : departmentHead?.personalInfo?.fullName || 'Chưa có'}
                  </p>
                </div>
                {/* Established */}
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-gray-400" />
                  <p className="text-sm text-gray-900">
                    <span className="font-medium">Established:</span>{' '}
                    {department.createdAt
                      ? new Date(department.createdAt).toLocaleDateString('en-US', {
                          month: 'long',
                          year: 'numeric',
                        })
                      : 'N/A'}
                  </p>
                </div>

                {/* Location */}
                {department.location && (
                  <div className="flex items-center gap-3">
                    <MapPin className="h-5 w-5 text-gray-400" />
                    <p className="text-sm text-gray-900">
                      <span className="font-medium">Location:</span> {department.location}
                    </p>
                  </div>
                )}

                {/* Contact */}
                {department.phone && (
                  <div className="flex items-center gap-3">
                    <Phone className="h-5 w-5 text-gray-400" />
                    <p className="text-sm text-gray-900">
                      <span className="font-medium">Contact:</span> {department.phone}
                    </p>
                  </div>
                )}

                {/* Email */}
                {department.email && (
                  <div className="flex items-center gap-3">
                    <Mail className="h-5 w-5 text-gray-400" />
                    <p className="text-sm text-gray-900">
                      <span className="font-medium">Email:</span>{' '}
                      <span className="text-blue-600">{department.email}</span>
                    </p>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                <Link
                  href={`/admin/departments/${department.id}/edit`}
                  className="flex w-full items-center justify-center gap-2 rounded-full border border-gray-300 px-4 py-3 text-sm font-medium transition-colors hover:bg-gray-50"
                >
                  <Edit className="h-4 w-4" />
                  Chỉnh sửa khoa
                </Link>
                <Link
                  href={`/admin/departments/${department.id}/staff`}
                  className="flex w-full items-center justify-center gap-2 rounded-full bg-gray-900 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-gray-800"
                >
                  <Users className="h-4 w-4" />
                  Quản lý nhân viên
                </Link>
              </div>
            </div>
          </div>

          {/* Right Column - Department Overview */}
          <div className="lg:col-span-2">
            <div className="rounded-lg border border-gray-200 bg-white">
              <div className="border-b border-gray-200 p-6">
                <h2 className="mb-1 text-xl font-semibold text-gray-900">Tổng quan khoa</h2>
                <p className="text-sm text-gray-500">Thông tin chính và số liệu thống kê</p>
              </div>

              {/* Tabs */}
              <div className="border-b border-gray-200">
                <div className="flex gap-6 px-6">
                  <button
                    onClick={() => setActiveTab('about')}
                    className={`border-b-2 py-3 text-sm font-medium transition-colors ${
                      activeTab === 'about'
                        ? 'border-gray-900 text-gray-900'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    Giới thiệu
                  </button>
                  <button
                    onClick={() => setActiveTab('staff')}
                    className={`border-b-2 py-3 text-sm font-medium transition-colors ${
                      activeTab === 'staff'
                        ? 'border-gray-900 text-gray-900'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    Nhân viên chính
                  </button>
                  <button
                    onClick={() => setActiveTab('services')}
                    className={`border-b-2 py-3 text-sm font-medium transition-colors ${
                      activeTab === 'services'
                        ? 'border-gray-900 text-gray-900'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    Dịch vụ
                  </button>
                </div>
              </div>

              {/* Tab Content */}
              <div className="p-6">
                {activeTab === 'about' && (
                  <div className="space-y-6">
                    <div>
                      <p className="leading-relaxed text-gray-700">{getFormattedDescription()}</p>
                    </div>

                    <div>
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="rounded-lg bg-gray-50 p-4">
                          <p className="text-xs font-medium text-gray-500 uppercase">Mã khoa</p>
                          <p className="text-lg font-semibold text-gray-900">{department.code}</p>
                        </div>
                        <div className="rounded-lg bg-gray-50 p-4">
                          <p className="text-xs font-medium text-gray-500 uppercase">Trạng thái</p>
                          <p className="text-lg font-semibold text-gray-900">
                            {department.isActive ? 'Đang hoạt động' : 'Ngừng hoạt động'}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="mb-3 text-lg font-semibold text-gray-900">
                        Mục tiêu của khoa
                      </h3>
                      <ul className="space-y-2">
                        <li className="flex items-start gap-2">
                          <span className="mt-1 text-blue-600">•</span>
                          <span className="text-gray-700">
                            Cung cấp dịch vụ chăm sóc bệnh nhân đặc biệt với sự tận tâm và chuyên
                            môn
                          </span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="mt-1 text-blue-600">•</span>
                          <span className="text-gray-700">
                            Nâng cao kiến thức y học thông qua nghiên cứu và đổi mới
                          </span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="mt-1 text-blue-600">•</span>
                          <span className="text-gray-700">
                            Đào tạo thế hệ chuyên gia y tế tiếp theo
                          </span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="mt-1 text-blue-600">•</span>
                          <span className="text-gray-700">
                            Tham gia với cộng đồng để thúc đẩy sức khỏe và hạnh phúc
                          </span>
                        </li>
                      </ul>
                    </div>
                  </div>
                )}

                {activeTab === 'staff' && (
                  <div>
                    {isLoadingStaff ? (
                      <div className="py-12 text-center">
                        <Loader2 className="mx-auto mb-2 h-8 w-8 animate-spin text-gray-400" />
                        <p className="text-gray-500">Đang tải danh sách nhân viên...</p>
                      </div>
                    ) : staffList.length === 0 ? (
                      <div className="py-12 text-center">
                        <Users className="mx-auto mb-3 h-12 w-12 text-gray-400" />
                        <p className="font-medium text-gray-900">Chưa có thông tin nhân viên</p>
                        <p className="mt-1 text-sm text-gray-500">
                          Thông tin nhân viên chính sẽ được hiển thị ở đây
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {staffList.slice(0, 4).map((staff, index) => (
                          <div
                            key={staff.staffId || index}
                            className="flex items-center gap-4 rounded-lg border border-gray-200 p-4 transition-colors hover:bg-gray-50"
                          >
                            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-gray-200">
                              <span className="text-sm font-semibold text-gray-600">
                                {getStaffInitials(staff, `S${index + 1}`)}
                              </span>
                            </div>
                            <div className="flex-1">
                              <h3 className="text-sm font-semibold text-gray-900">
                                {staff.personalInfo?.fullName || 'Không có tên'}
                              </h3>
                              <p className="text-sm text-gray-500">
                                {staff.professionalInfo?.title ||
                                  staff.professionalInfo?.position ||
                                  'Nhân viên'}
                              </p>
                            </div>
                          </div>
                        ))}

                        {/* View All Staff Button */}
                        <Link
                          href={`/admin/departments/${department?.id}/staff`}
                          className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border border-gray-300 px-4 py-3 text-sm font-medium transition-colors hover:bg-gray-50"
                        >
                          <Users className="h-4 w-4" />
                          Xem tất cả nhân viên
                        </Link>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'services' && (
                  <div className="py-12 text-center">
                    <p className="font-medium text-gray-900">Chưa có thông tin dịch vụ</p>
                    <p className="mt-1 text-sm text-gray-500">
                      Danh sách dịch vụ của khoa sẽ được hiển thị ở đây
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
