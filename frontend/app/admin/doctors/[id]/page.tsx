'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/layout';
import { ArrowLeft, Mail, Phone, MapPin, Users, Calendar, Star, Loader2 } from 'lucide-react';
import { getStaffById, type Staff } from '@/lib/api/staff.service';

/**
 * Doctor Profile Page
 */
export default function DoctorProfilePage() {
  const params = useParams();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('overview');
  const [doctor, setDoctor] = useState<Staff | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDoctor = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await getStaffById(params.id as string);
        setDoctor(data);
      } catch (err: any) {
        console.error('Error fetching doctor:', err);
        setError(err.response?.data?.message || 'Không thể tải thông tin bác sĩ');
      } finally {
        setIsLoading(false);
      }
    };

    if (params.id) {
      fetchDoctor();
    }
  }, [params.id]);

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      </DashboardLayout>
    );
  }

  if (error || !doctor) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-screen">
          <p className="text-red-600 mb-4">{error || 'Không tìm thấy bác sĩ'}</p>
          <button
            onClick={() => router.back()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Quay lại
          </button>
        </div>
      </DashboardLayout>
    );
  }

  // Get initials for avatar
  const getInitials = (name: string) => {
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return parts[0][0] + parts[parts.length - 1][0];
    }
    return name.substring(0, 2);
  };

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-5 w-5" />
            <span className="text-lg font-semibold">Hồ sơ bác sĩ</span>
          </button>
        </div>

        <div className="flex gap-6 p-6">
          {/* Left Sidebar */}
          <div className="w-80 flex-shrink-0">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              {/* Avatar & Basic Info */}
              <div className="text-center">
                <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 mx-auto mb-4 flex items-center justify-center text-white text-4xl font-bold">
                  {getInitials(doctor.personalInfo.fullName)}
                </div>
                <h2 className="text-xl font-bold text-gray-900">{doctor.personalInfo.fullName}</h2>
                <p className="text-gray-600 mt-1">{doctor.specializations?.[0]?.name || doctor.professionalInfo.department}</p>
                <span className={`inline-block mt-2 px-3 py-1 text-sm font-medium rounded-full ${
                  doctor.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {doctor.status === 'active' ? 'Đang hoạt động' : doctor.status === 'suspended' ? 'Tạm nghỉ' : doctor.status === 'on_leave' ? 'Nghỉ phép' : 'Đã nghỉ'}
                </span>
                
                {/* Rating */}
                <div className="flex items-center justify-center gap-1 mt-3">
                  <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                  <span className="font-semibold">4.8</span>
                  <span className="text-gray-500 text-sm">• 87 đánh giá</span>
                </div>
              </div>

              {/* Contact Info */}
              <div className="mt-6 space-y-4">
                <div className="flex items-start gap-3">
                  <Mail className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Email</p>
                    <p className="text-sm text-gray-600">{doctor.personalInfo.email || 'Chưa cập nhật'}</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <Phone className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Điện thoại</p>
                    <p className="text-sm text-gray-600">{doctor.personalInfo.phoneNumber}</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Địa chỉ</p>
                    <p className="text-sm text-gray-600">
                      {doctor.personalInfo.address ? 
                        `${doctor.personalInfo.address.street}, ${doctor.personalInfo.address.ward}, ${doctor.personalInfo.address.district}, ${doctor.personalInfo.address.city}` : 
                        `Bệnh viện ${doctor.professionalInfo.department}`
                      }
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <Users className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Bệnh nhân</p>
                    <p className="text-sm text-gray-600">Đang cập nhật</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Kinh nghiệm</p>
                    <p className="text-sm text-gray-600">{doctor.yearsOfExperience} năm</p>
                  </div>
                </div>
              </div>

              {/* Languages */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Ngôn ngữ</h3>
                <div className="flex flex-wrap gap-2">
                  {doctor.professionalInfo.languages && doctor.professionalInfo.languages.length > 0 ? (
                    doctor.professionalInfo.languages.map((lang, idx) => (
                      <span key={idx} className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full">{lang}</span>
                    ))
                  ) : (
                    <span className="text-sm text-gray-500">Chưa cập nhật</span>
                  )}
                </div>
              </div>

              {/* Weekly Schedule */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Lịch làm việc hàng tuần</h3>
                <div className="space-y-2 text-sm">
                  {doctor.workSchedule && doctor.workSchedule.workingDays ? (
                    <>
                      {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map((day, idx) => {
                        const dayNames = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ nhật'];
                        const isWorking = doctor.workSchedule.workingDays.includes(day);
                        return (
                          <div key={day} className="flex justify-between">
                            <span className="text-gray-600">{dayNames[idx]}:</span>
                            {isWorking ? (
                              <span className="text-gray-900">
                                {doctor.workSchedule.workingHours.start} - {doctor.workSchedule.workingHours.end}
                              </span>
                            ) : (
                              <span className="text-red-600">Nghỉ</span>
                            )}
                          </div>
                        );
                      })}
                    </>
                  ) : (
                    <p className="text-sm text-gray-500">Chưa cập nhật lịch làm việc</p>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-6 pt-6 border-t border-gray-200 space-y-2">
                <button className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                  Nhắn tin
                </button>
                <button className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                  Đặt lịch
                </button>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            <div className="bg-white rounded-lg border border-gray-200">
              {/* Tabs */}
              <div className="border-b border-gray-200">
                <nav className="flex gap-8 px-6">
                  {['overview', 'appointments', 'patients', 'performance'].map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`py-4 text-sm font-medium border-b-2 transition-colors ${
                        activeTab === tab
                          ? 'border-blue-600 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      {tab === 'overview' && 'Tổng quan'}
                      {tab === 'appointments' && 'Lịch hẹn'}
                      {tab === 'patients' && 'Bệnh nhân'}
                      {tab === 'performance' && 'Hiệu suất'}
                    </button>
                  ))}
                </nav>
              </div>

              {/* Tab Content */}
              <div className="p-6">
                {activeTab === 'overview' && (
                  <div className="space-y-8">
                    {/* About */}
                    <section>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Giới thiệu</h3>
                      <p className="text-gray-600 leading-relaxed">
                        {doctor.professionalInfo.bio || (
                          `${doctor.personalInfo.fullName} là ${doctor.professionalInfo.title} với ${doctor.yearsOfExperience} năm kinh nghiệm tại khoa ${doctor.professionalInfo.department}.
                          ${doctor.specializations && doctor.specializations.length > 0 ? ` Chuyên về ${doctor.specializations.map(s => s.name).join(', ')}.` : ''}`
                        )}
                      </p>
                    </section>

                    {/* Education & Certifications */}
                    <section>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Học vấn & Chứng chỉ</h3>
                      
                      <div className="space-y-6">
                        <div>
                          <h4 className="text-sm font-semibold text-gray-900 mb-3">Học vấn</h4>
                          {doctor.professionalInfo.education && doctor.professionalInfo.education.length > 0 ? (
                            <div className="space-y-4">
                              {doctor.professionalInfo.education.map((edu, idx) => (
                                <div key={idx} className="flex justify-between items-start">
                                  <div>
                                    <p className="font-medium text-gray-900">{edu}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-sm text-gray-500">Chưa cập nhật thông tin học vấn</p>
                          )}
                        </div>

                        <div className="pt-6 border-t border-gray-200">
                          <h4 className="text-sm font-semibold text-gray-900 mb-3">Chứng chỉ</h4>
                          {doctor.certifications && doctor.certifications.length > 0 ? (
                            <div className="space-y-4">
                              {doctor.certifications.map((cert, idx) => (
                                <div key={idx} className="flex justify-between items-start">
                                  <div>
                                    <p className="font-medium text-gray-900">{cert.certificationName}</p>
                                    <p className="text-sm text-gray-600">{cert.issuingOrganization}</p>
                                  </div>
                                  {cert.issueDate && (
                                    <span className="text-sm text-gray-500">
                                      {new Date(cert.issueDate).getFullYear()}
                                    </span>
                                  )}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-sm text-gray-500">Chưa có chứng chỉ</p>
                          )}
                        </div>
                      </div>
                    </section>

                    {/* Today's Schedule */}
                    <section>
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-900">Lịch hôm nay</h3>
                        <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                          Xem lịch đầy đủ
                        </button>
                      </div>
                      
                      <div className="space-y-3">
                        <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                          <div className="flex items-center gap-4">
                            <div className="text-center">
                              <p className="text-lg font-semibold text-gray-900">09:00</p>
                              <p className="text-xs text-gray-500">Khám</p>
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">John Smith</p>
                              <p className="text-sm text-gray-600">Hoàn thành</p>
                            </div>
                          </div>
                          <span className="px-3 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                            Hoàn thành
                          </span>
                        </div>

                        <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                          <div className="flex items-center gap-4">
                            <div className="text-center">
                              <p className="text-lg font-semibold text-gray-900">10:30</p>
                              <p className="text-xs text-gray-500">Tư vấn</p>
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">Emily Davis</p>
                              <p className="text-sm text-gray-600">Tư vấn</p>
                            </div>
                          </div>
                          <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                            Đang diễn ra
                          </span>
                        </div>

                        <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                          <div className="flex items-center gap-4">
                            <div className="text-center">
                              <p className="text-lg font-semibold text-gray-900">01:00</p>
                              <p className="text-xs text-gray-500">Khám</p>
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">Michael Brown</p>
                              <p className="text-sm text-gray-600">Khám định kỳ</p>
                            </div>
                          </div>
                          <span className="px-3 py-1 bg-gray-100 text-gray-800 text-xs font-medium rounded-full">
                            Sắp tới
                          </span>
                        </div>
                      </div>
                    </section>
                  </div>
                )}

                {activeTab === 'appointments' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-lg font-semibold text-gray-900">Lịch hẹn sắp tới</h3>
                      <select className="px-3 py-2 border border-gray-300 rounded-lg text-sm">
                        <option>Tất cả</option>
                        <option>Hôm nay</option>
                        <option>Tuần này</option>
                        <option>Tháng này</option>
                      </select>
                    </div>
                    
                    <div className="space-y-3">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold">
                              BN
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">Bệnh nhân #{i}</p>
                              <p className="text-sm text-gray-600">Khám định kỳ</p>
                              <p className="text-xs text-gray-500 mt-1">09:00 - 09:30 • 15/11/2025</p>
                            </div>
                          </div>
                          <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                            Đã xác nhận
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {activeTab === 'patients' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-lg font-semibold text-gray-900">Danh sách bệnh nhân</h3>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Tìm kiếm bệnh nhân..."
                          className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        />
                        <select className="px-3 py-2 border border-gray-300 rounded-lg text-sm">
                          <option>Tất cả</option>
                          <option>Đang điều trị</option>
                          <option>Hoàn thành</option>
                        </select>
                      </div>
                    </div>
                    
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Bệnh nhân</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tuổi</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Chẩn đoán</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Lần khám cuối</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trạng thái</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {[1, 2, 3, 4, 5].map((i) => (
                            <tr key={i} className="hover:bg-gray-50">
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-medium">
                                    BN
                                  </div>
                                  <div>
                                    <p className="font-medium text-gray-900">Bệnh nhân #{i}</p>
                                    <p className="text-sm text-gray-500">ID: PT{1000 + i}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-600">{30 + i} tuổi</td>
                              <td className="px-4 py-3 text-sm text-gray-600">Bệnh tim mạch</td>
                              <td className="px-4 py-3 text-sm text-gray-600">10/11/2025</td>
                              <td className="px-4 py-3">
                                <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                                  Đang điều trị
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {activeTab === 'performance' && (
                  <div className="space-y-6">
                    <h3 className="text-lg font-semibold text-gray-900">Hiệu suất làm việc</h3>
                    
                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="bg-blue-50 rounded-lg p-4">
                        <p className="text-sm text-blue-600 font-medium">Tổng bệnh nhân</p>
                        <p className="text-2xl font-bold text-blue-900 mt-2">120</p>
                        <p className="text-xs text-blue-600 mt-1">+12% so với tháng trước</p>
                      </div>
                      <div className="bg-green-50 rounded-lg p-4">
                        <p className="text-sm text-green-600 font-medium">Lịch hẹn hoàn thành</p>
                        <p className="text-2xl font-bold text-green-900 mt-2">95%</p>
                        <p className="text-xs text-green-600 mt-1">+3% so với tháng trước</p>
                      </div>
                      <div className="bg-yellow-50 rounded-lg p-4">
                        <p className="text-sm text-yellow-600 font-medium">Đánh giá trung bình</p>
                        <p className="text-2xl font-bold text-yellow-900 mt-2">4.8/5</p>
                        <p className="text-xs text-yellow-600 mt-1">87 đánh giá</p>
                      </div>
                      <div className="bg-purple-50 rounded-lg p-4">
                        <p className="text-sm text-purple-600 font-medium">Giờ làm việc</p>
                        <p className="text-2xl font-bold text-purple-900 mt-2">42h</p>
                        <p className="text-xs text-purple-600 mt-1">Tuần này</p>
                      </div>
                    </div>

                    {/* Recent Reviews */}
                    <div>
                      <h4 className="text-md font-semibold text-gray-900 mb-4">Đánh giá gần đây</h4>
                      <div className="space-y-4">
                        {[1, 2, 3].map((i) => (
                          <div key={i} className="border border-gray-200 rounded-lg p-4">
                            <div className="flex items-start justify-between">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-medium">
                                  BN
                                </div>
                                <div>
                                  <p className="font-medium text-gray-900">Bệnh nhân #{i}</p>
                                  <div className="flex items-center gap-1 mt-1">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                      <Star key={star} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                    ))}
                                  </div>
                                </div>
                              </div>
                              <span className="text-xs text-gray-500">2 ngày trước</span>
                            </div>
                            <p className="text-sm text-gray-600 mt-3">
                              Bác sĩ rất tận tâm và chuyên nghiệp. Giải thích rõ ràng về tình trạng bệnh và phương pháp điều trị.
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
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
