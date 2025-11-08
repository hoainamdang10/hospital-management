'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Calendar, Mail, Phone, MapPin, Edit, Users, Loader2 } from 'lucide-react';
import { DashboardLayout } from '@/components/layout';
import { getDepartmentById, getDepartmentStaff, type Department } from '@/lib/api/departments.service';

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
  const [isLoadingStaff, setIsLoadingStaff] = useState(false);

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
        setStaffList(response.data.slice(0, 4)); // Only show first 4 staff
      }
    } catch (error) {
      console.error('Error fetching staff:', error);
    } finally {
      setIsLoadingStaff(false);
    }
  };

  // Load staff when switching to staff tab
  useEffect(() => {
    if (activeTab === 'staff' && params.id && staffList.length === 0) {
      fetchStaff(params.id as string);
    }
  }, [activeTab, params.id]);

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
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="Quay lại"
          >
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{department.nameVi}</h1>
            <p className="text-gray-500 mt-1">{department.nameEn}</p>
          </div>
        </div>

        {/* Two Column Layout */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column - Department Information */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg border border-gray-200 p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Thông tin khoa</h2>
              <p className="text-gray-500 mb-8">Chi tiết về khoa {department.nameVi}</p>

              <div className="space-y-4 mb-8">
                {/* Established */}
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-gray-400" />
                  <p className="text-sm text-gray-900">
                    <span className="font-medium">Established:</span>{' '}
                    {department.createdAt 
                      ? new Date(department.createdAt).toLocaleDateString('en-US', { 
                          month: 'long',
                          year: 'numeric'
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
                  className="flex items-center justify-center gap-2 w-full px-4 py-3 border border-gray-300 rounded-full hover:bg-gray-50 text-sm font-medium transition-colors"
                >
                  <Edit className="h-4 w-4" />
                  Chỉnh sửa khoa
                </Link>
                <Link
                  href={`/admin/departments/${department.id}/staff`}
                  className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-gray-900 text-white rounded-full hover:bg-gray-800 text-sm font-medium transition-colors"
                >
                  <Users className="h-4 w-4" />
                  Quản lý nhân viên
                </Link>
              </div>
            </div>
          </div>

          {/* Right Column - Department Overview */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900 mb-1">Tổng quan khoa</h2>
                <p className="text-sm text-gray-500">Thông tin chính và số liệu thống kê</p>
              </div>

              {/* Tabs */}
              <div className="border-b border-gray-200">
                <div className="flex gap-6 px-6">
                  <button
                    onClick={() => setActiveTab('about')}
                    className={`py-3 text-sm font-medium border-b-2 transition-colors ${
                      activeTab === 'about'
                        ? 'border-gray-900 text-gray-900'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    Giới thiệu
                  </button>
                  <button
                    onClick={() => setActiveTab('staff')}
                    className={`py-3 text-sm font-medium border-b-2 transition-colors ${
                      activeTab === 'staff'
                        ? 'border-gray-900 text-gray-900'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    Nhân viên chính
                  </button>
                  <button
                    onClick={() => setActiveTab('services')}
                    className={`py-3 text-sm font-medium border-b-2 transition-colors ${
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
                      <p className="text-gray-700 leading-relaxed">
                        Khoa {department.nameVi} tại phòng khám của chúng tôi cam kết cung cấp dịch vụ chăm sóc đặc biệt trong lĩnh vực y học. 
                        Đội ngũ chuyên gia của chúng tôi làm việc cộng tác để cung cấp các kế hoạch điều trị toàn diện phù hợp với nhu cầu riêng của từng bệnh nhân.
                      </p>
                    </div>

                    <div>
                      <p className="text-gray-700 leading-relaxed">
                        Được thành lập vào năm {department.createdAt ? new Date(department.createdAt).getFullYear() : 'N/A'}, khoa đã phát triển để trở thành trung tâm xuất sắc, 
                        được trang bị công nghệ hiện đại và cơ sở vật chất tiên tiến. Chúng tôi tự hào về việc luôn đi đầu trong những tiến bộ y học 
                        và thực hiện các phương pháp dựa trên bằng chứng.
                      </p>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">Mục tiêu của khoa</h3>
                      <ul className="space-y-2">
                        <li className="flex items-start gap-2">
                          <span className="text-blue-600 mt-1">•</span>
                          <span className="text-gray-700">Cung cấp dịch vụ chăm sóc bệnh nhân đặc biệt với sự tận tâm và chuyên môn</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-blue-600 mt-1">•</span>
                          <span className="text-gray-700">Nâng cao kiến thức y học thông qua nghiên cứu và đổi mới</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-blue-600 mt-1">•</span>
                          <span className="text-gray-700">Đào tạo thế hệ chuyên gia y tế tiếp theo</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-blue-600 mt-1">•</span>
                          <span className="text-gray-700">Tham gia với cộng đồng để thúc đẩy sức khỏe và hạnh phúc</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                )}

                {activeTab === 'staff' && (
                  <div>
                    {isLoadingStaff ? (
                      <div className="text-center py-12">
                        <Loader2 className="h-8 w-8 text-gray-400 animate-spin mx-auto mb-2" />
                        <p className="text-gray-500">Đang tải danh sách nhân viên...</p>
                      </div>
                    ) : staffList.length === 0 ? (
                      <div className="text-center py-12">
                        <Users className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                        <p className="text-gray-900 font-medium">Chưa có thông tin nhân viên</p>
                        <p className="text-gray-500 text-sm mt-1">Thông tin nhân viên chính sẽ được hiển thị ở đây</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {staffList.map((staff, index) => (
                          <div key={staff.id || index} className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                            <div className="flex-shrink-0 w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                              <span className="text-sm font-semibold text-gray-600">
                                {staff.personalInfo?.fullName?.split(' ').map((n: string) => n[0]).join('').slice(0, 2) || 'S' + (index + 1)}
                              </span>
                            </div>
                            <div className="flex-1">
                              <h3 className="text-sm font-semibold text-gray-900">
                                {staff.personalInfo?.fullName || 'Không có tên'}
                              </h3>
                              <p className="text-sm text-gray-500">
                                {staff.professionalInfo?.title || staff.professionalInfo?.position || 'Nhân viên'}
                              </p>
                            </div>
                          </div>
                        ))}
                        
                        {/* View All Staff Button */}
                        <Link
                          href={`/admin/departments/${department?.id}/staff`}
                          className="flex items-center justify-center gap-2 w-full px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-medium transition-colors mt-4"
                        >
                          <Users className="h-4 w-4" />
                          Xem tất cả nhân viên
                        </Link>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'services' && (
                  <div className="text-center py-12">
                    <p className="text-gray-900 font-medium">Chưa có thông tin dịch vụ</p>
                    <p className="text-gray-500 text-sm mt-1">Danh sách dịch vụ của khoa sẽ được hiển thị ở đây</p>
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
