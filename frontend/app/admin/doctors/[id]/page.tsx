'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/layout';
import { ArrowLeft, Mail, Phone, MapPin, Users, Calendar, Star, Loader2 } from 'lucide-react';
import { getStaffById, type Staff } from '@/lib/api/staff.service';
import { appointmentsService } from '@/lib/api/appointments.service';
import type { AppointmentReadModel } from '@/lib/types/appointments';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

/**
 * Doctor Profile Page
 */
export default function DoctorProfilePage() {
  const params = useParams();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('overview');
  const [doctor, setDoctor] = useState<Staff | null>(null);
  const [appointments, setAppointments] = useState<AppointmentReadModel[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({
    totalPatients: 0,
    completedAppointments: 0,
    rating: 4.8, // Hardcoded for now as we don't have a ratings API yet
    reviewCount: 87,
    workingHours: 0,
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // 1. Fetch Doctor Info
        const doctorData = await getStaffById(params.id as string);
        setDoctor(doctorData);

        // 2. Fetch Doctor's Appointments
        // Note: We might need to implement pagination here if there are too many
        const appointmentsData = await appointmentsService.list({
          doctorId: doctorData.staffId,
          limit: 100, // Fetch enough to get a good list of patients
        });

        setAppointments(appointmentsData.appointments);

        // 3. Extract Unique Patients from Appointments
        const uniquePatientsMap = new Map();
        appointmentsData.appointments.forEach((apt: any) => {
          // API returns camelCase fields
          const patientId = apt.patientId || apt.patient_id;
          const patientName = apt.patientName || apt.patient_full_name;
          const patientPhone = apt.patientPhone || apt.patient_phone;
          const patientGender = apt.patientGender || apt.patient_gender;
          const patientDob = apt.patientDateOfBirth || apt.patient_date_of_birth;
          const appointmentDate = apt.appointmentDate || apt.appointment_date;

          if (patientId && !uniquePatientsMap.has(patientId)) {
            uniquePatientsMap.set(patientId, {
              id: patientId,
              name: patientName,
              phone: patientPhone,
              dob: patientDob,
              gender: patientGender,
              lastVisit: appointmentDate,
              status: 'Đang điều trị', // Logic to determine status could be improved
            });
          }
        });
        setPatients(Array.from(uniquePatientsMap.values()));

        // 4. Calculate Stats
        const completed = appointmentsData.appointments.filter(
          (a) => a.status === 'completed'
        ).length;
        const total = appointmentsData.appointments.length;

        // Calculate working hours (simple estimation based on schedule)
        let weeklyHours = 0;
        if (doctorData.workSchedule?.workingHours) {
          const start = parseInt(doctorData.workSchedule.workingHours.start.split(':')[0]);
          const end = parseInt(doctorData.workSchedule.workingHours.end.split(':')[0]);
          const days = doctorData.workSchedule.workingDays?.length || 0;
          weeklyHours = (end - start) * days;
        }

        setStats((prev) => ({
          ...prev,
          totalPatients: uniquePatientsMap.size,
          completedAppointments: total > 0 ? Math.round((completed / total) * 100) : 0,
          workingHours: weeklyHours,
        }));
      } catch (err: any) {
        console.error('Error fetching doctor data:', err);
        setError(err.response?.data?.message || 'Không thể tải thông tin bác sĩ');
      } finally {
        setIsLoading(false);
      }
    };

    if (params.id) {
      fetchData();
    }
  }, [params.id]);

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex h-screen items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      </DashboardLayout>
    );
  }

  if (error || !doctor) {
    return (
      <DashboardLayout>
        <div className="flex h-screen flex-col items-center justify-center">
          <p className="mb-4 text-red-600">{error || 'Không tìm thấy bác sĩ'}</p>
          <button
            onClick={() => router.back()}
            className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
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

  // Helper to format date
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'dd/MM/yyyy', { locale: vi });
    } catch {
      return dateString;
    }
  };

  // Helper to calculate age
  const calculateAge = (dob?: string) => {
    if (!dob) return 'N/A';
    const birthDate = new Date(dob);
    const ageDifMs = Date.now() - birthDate.getTime();
    const ageDate = new Date(ageDifMs);
    return Math.abs(ageDate.getUTCFullYear() - 1970);
  };

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="border-b border-gray-200 bg-white px-6 py-4">
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
            <div className="rounded-lg border border-gray-200 bg-white p-6">
              {/* Avatar & Basic Info */}
              <div className="text-center">
                <div className="mx-auto mb-4 flex h-32 w-32 items-center justify-center rounded-full bg-gradient-to-br from-blue-400 to-blue-600 text-4xl font-bold text-white">
                  {getInitials(doctor.personalInfo.fullName)}
                </div>
                <h2 className="text-xl font-bold text-gray-900">{doctor.personalInfo.fullName}</h2>
                <p className="mt-1 text-gray-600">
                  {doctor.specializations?.[0]?.name || doctor.professionalInfo.department}
                </p>
                <span
                  className={`mt-2 inline-block rounded-full px-3 py-1 text-sm font-medium ${
                    doctor.status === 'active'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {doctor.status === 'active'
                    ? 'Đang hoạt động'
                    : doctor.status === 'suspended'
                      ? 'Tạm nghỉ'
                      : doctor.status === 'on_leave'
                        ? 'Nghỉ phép'
                        : 'Đã nghỉ'}
                </span>

                {/* Rating */}
                <div className="mt-3 flex items-center justify-center gap-1">
                  <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                  <span className="font-semibold">{stats.rating}</span>
                  <span className="text-sm text-gray-500">• {stats.reviewCount} đánh giá</span>
                </div>
              </div>

              {/* Contact Info */}
              <div className="mt-6 space-y-4">
                <div className="flex items-start gap-3">
                  <Mail className="mt-0.5 h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Email</p>
                    <p className="text-sm break-all text-gray-600">
                      {doctor.personalInfo.email || 'Chưa cập nhật'}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Phone className="mt-0.5 h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Điện thoại</p>
                    <p className="text-sm text-gray-600">{doctor.personalInfo.phoneNumber}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <MapPin className="mt-0.5 h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Địa chỉ</p>
                    <p className="text-sm text-gray-600">
                      {doctor.personalInfo.address
                        ? `${doctor.personalInfo.address.street}, ${doctor.personalInfo.address.ward || ''}, ${doctor.personalInfo.address.district}, ${doctor.personalInfo.address.city}`.replace(
                            ', ,',
                            ','
                          )
                        : 'Chưa cập nhật địa chỉ'}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Users className="mt-0.5 h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Bệnh nhân</p>
                    <p className="text-sm text-gray-600">{stats.totalPatients}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Calendar className="mt-0.5 h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Kinh nghiệm</p>
                    <p className="text-sm text-gray-600">{doctor.yearsOfExperience || 0} năm</p>
                  </div>
                </div>
              </div>

              {/* Languages */}
              <div className="mt-6 border-t border-gray-200 pt-6">
                <h3 className="mb-3 text-sm font-semibold text-gray-900">Ngôn ngữ</h3>
                <div className="flex flex-wrap gap-2">
                  {doctor.professionalInfo.languages &&
                  doctor.professionalInfo.languages.length > 0 ? (
                    doctor.professionalInfo.languages.map((lang, idx) => (
                      <span
                        key={idx}
                        className="rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-700"
                      >
                        {lang}
                      </span>
                    ))
                  ) : (
                    <span className="text-sm text-gray-500">Chưa cập nhật</span>
                  )}
                </div>
              </div>

              {/* Weekly Schedule */}
              <div className="mt-6 border-t border-gray-200 pt-6">
                <h3 className="mb-3 text-sm font-semibold text-gray-900">
                  Lịch làm việc hàng tuần
                </h3>
                <div className="space-y-2 text-sm">
                  {doctor.workSchedule && doctor.workSchedule.workingDays ? (
                    <>
                      {[
                        'monday',
                        'tuesday',
                        'wednesday',
                        'thursday',
                        'friday',
                        'saturday',
                        'sunday',
                      ].map((day, idx) => {
                        const dayNames = [
                          'Thứ 2',
                          'Thứ 3',
                          'Thứ 4',
                          'Thứ 5',
                          'Thứ 6',
                          'Thứ 7',
                          'Chủ nhật',
                        ];
                        const isWorking = doctor.workSchedule.workingDays.includes(day);
                        const daily = doctor.workSchedule.dailySchedules?.find(
                          (d: any) => d.day?.toLowerCase?.() === day
                        );
                        return (
                          <div key={day} className="flex justify-between">
                            <span className="text-gray-600">{dayNames[idx]}:</span>
                            {isWorking ? (
                              <span className="text-gray-900">
                                {daily?.start || doctor.workSchedule.workingHours.start} -{' '}
                                {daily?.end || doctor.workSchedule.workingHours.end}
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
              <div className="mt-6 space-y-2 border-t border-gray-200 pt-6">
                <button className="w-full rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700">
                  Nhắn tin
                </button>
                <button className="w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-700 transition-colors hover:bg-gray-50">
                  Đặt lịch
                </button>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            <div className="rounded-lg border border-gray-200 bg-white">
              {/* Tabs */}
              <div className="border-b border-gray-200">
                <nav className="flex gap-8 px-6">
                  {['overview', 'appointments', 'patients', 'performance'].map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`border-b-2 py-4 text-sm font-medium transition-colors ${
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
                      <h3 className="mb-4 text-lg font-semibold text-gray-900">Giới thiệu</h3>
                      <p className="leading-relaxed text-gray-600">
                        {doctor.professionalInfo.bio ||
                          `${doctor.personalInfo.fullName} là ${doctor.professionalInfo.title} với ${doctor.yearsOfExperience || 0} năm kinh nghiệm tại khoa ${doctor.professionalInfo.department}.
                          ${doctor.specializations && doctor.specializations.length > 0 ? ` Chuyên về ${doctor.specializations.map((s) => s.name).join(', ')}.` : ''}`}
                      </p>
                    </section>

                    {/* Education & Certifications */}
                    <section>
                      <h3 className="mb-4 text-lg font-semibold text-gray-900">
                        Học vấn & Chứng chỉ
                      </h3>

                      <div className="space-y-6">
                        <div>
                          <h4 className="mb-3 text-sm font-semibold text-gray-900">Học vấn</h4>
                          {doctor.professionalInfo.education &&
                          doctor.professionalInfo.education.length > 0 ? (
                            <div className="space-y-4">
                              {doctor.professionalInfo.education.map((edu, idx) => (
                                <div key={idx} className="flex items-start justify-between">
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

                        <div className="border-t border-gray-200 pt-6">
                          <h4 className="mb-3 text-sm font-semibold text-gray-900">Chứng chỉ</h4>
                          {doctor.certifications && doctor.certifications.length > 0 ? (
                            <div className="space-y-4">
                              {doctor.certifications.map((cert, idx) => (
                                <div key={idx} className="flex items-start justify-between">
                                  <div>
                                    <p className="font-medium text-gray-900">
                                      {cert.certificationName}
                                    </p>
                                    <p className="text-sm text-gray-600">
                                      {cert.issuingOrganization}
                                    </p>
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
                      <div className="mb-4 flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-gray-900">Lịch hôm nay</h3>
                        <button className="text-sm font-medium text-blue-600 hover:text-blue-700">
                          Xem lịch đầy đủ
                        </button>
                      </div>

                      <div className="space-y-3">
                        {appointments.filter((apt) => {
                          const today = new Date().toISOString().split('T')[0];
                          return apt.appointment_date === today;
                        }).length > 0 ? (
                          appointments
                            .filter((apt) => {
                              const today = new Date().toISOString().split('T')[0];
                              return apt.appointment_date === today;
                            })
                            .slice(0, 3)
                            .map((apt, idx) => (
                              <div
                                key={idx}
                                className="flex items-center justify-between rounded-lg border border-gray-200 p-4 hover:bg-gray-50"
                              >
                                <div className="flex items-center gap-4">
                                  <div className="text-center">
                                    <p className="text-lg font-semibold text-gray-900">
                                      {apt.appointment_time?.substring(0, 5) || 'N/A'}
                                    </p>
                                    <p className="text-xs text-gray-500">{apt.type}</p>
                                  </div>
                                  <div>
                                    <p className="font-medium text-gray-900">
                                      {apt.patient_full_name}
                                    </p>
                                    <p className="text-sm text-gray-600">{apt.status}</p>
                                  </div>
                                </div>
                                <span
                                  className={`rounded-full px-3 py-1 text-xs font-medium ${
                                    apt.status === 'completed'
                                      ? 'bg-green-100 text-green-800'
                                      : apt.status === 'confirmed'
                                        ? 'bg-blue-100 text-blue-800'
                                        : 'bg-gray-100 text-gray-800'
                                  }`}
                                >
                                  {apt.status}
                                </span>
                              </div>
                            ))
                        ) : (
                          <p className="text-sm text-gray-500">Không có lịch hẹn hôm nay</p>
                        )}
                      </div>
                    </section>
                  </div>
                )}

                {activeTab === 'appointments' && (
                  <div className="space-y-4">
                    <div className="mb-6 flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-gray-900">Danh sách lịch hẹn</h3>
                      <select className="rounded-lg border border-gray-300 px-3 py-2 text-sm">
                        <option>Tất cả</option>
                        <option>Hôm nay</option>
                        <option>Tuần này</option>
                        <option>Tháng này</option>
                      </select>
                    </div>

                    <div className="space-y-3">
                      {appointments.length > 0 ? (
                        appointments.map((apt: any, i) => {
                          // API returns camelCase: patientName, doctorName (not snake_case)
                          const patientName =
                            apt.patientName || apt.patient_full_name || 'Bệnh nhân';
                          const appointmentTime = apt.appointmentTime || apt.appointment_time;
                          const appointmentDate = apt.appointmentDate || apt.appointment_date;

                          return (
                            <div
                              key={i}
                              className="flex items-center justify-between rounded-lg border border-gray-200 p-4 hover:bg-gray-50"
                            >
                              <div className="flex items-center gap-4">
                                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 font-semibold text-blue-600">
                                  {getInitials(patientName)}
                                </div>
                                <div>
                                  <p className="font-medium text-gray-900">{patientName}</p>
                                  <p className="text-sm text-gray-600">{apt.reason || apt.type}</p>
                                  <p className="mt-1 text-xs text-gray-500">
                                    {appointmentTime?.substring(0, 5) || 'N/A'} •{' '}
                                    {formatDate(appointmentDate)}
                                  </p>
                                </div>
                              </div>
                              <span
                                className={`rounded-full px-3 py-1 text-xs font-medium ${
                                  apt.status === 'completed'
                                    ? 'bg-green-100 text-green-800'
                                    : apt.status === 'confirmed'
                                      ? 'bg-blue-100 text-blue-800'
                                      : apt.status === 'cancelled'
                                        ? 'bg-red-100 text-red-800'
                                        : 'bg-gray-100 text-gray-800'
                                }`}
                              >
                                {apt.status}
                              </span>
                            </div>
                          );
                        })
                      ) : (
                        <p className="py-4 text-center text-gray-500">Chưa có lịch hẹn nào</p>
                      )}
                    </div>
                  </div>
                )}

                {activeTab === 'patients' && (
                  <div className="space-y-4">
                    <div className="mb-6 flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-gray-900">Danh sách bệnh nhân</h3>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Tìm kiếm bệnh nhân..."
                          className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
                        />
                        <select className="rounded-lg border border-gray-300 px-3 py-2 text-sm">
                          <option>Tất cả</option>
                          <option>Đang điều trị</option>
                          <option>Hoàn thành</option>
                        </select>
                      </div>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="border-b border-gray-200 bg-gray-50">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                              Bệnh nhân
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                              Tuổi
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                              Giới tính
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                              Lần khám cuối
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                              Trạng thái
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {patients.length > 0 ? (
                            patients.map((patient, i) => (
                              <tr key={i} className="hover:bg-gray-50">
                                <td className="px-4 py-3">
                                  <div className="flex items-center gap-3">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-200 font-medium text-gray-600">
                                      {getInitials(patient.name)}
                                    </div>
                                    <div>
                                      <p className="font-medium text-gray-900">{patient.name}</p>
                                      <p className="text-sm text-gray-500">ID: {patient.id}</p>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-600">
                                  {calculateAge(patient.dob)} tuổi
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-600">
                                  {patient.gender === 'male'
                                    ? 'Nam'
                                    : patient.gender === 'female'
                                      ? 'Nữ'
                                      : 'Khác'}
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-600">
                                  {formatDate(patient.lastVisit)}
                                </td>
                                <td className="px-4 py-3">
                                  <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800">
                                    {patient.status}
                                  </span>
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                                Chưa có bệnh nhân nào
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {activeTab === 'performance' && (
                  <div className="space-y-6">
                    <h3 className="text-lg font-semibold text-gray-900">Hiệu suất làm việc</h3>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                      <div className="rounded-lg bg-blue-50 p-4">
                        <p className="text-sm font-medium text-blue-600">Tổng bệnh nhân</p>
                        <p className="mt-2 text-2xl font-bold text-blue-900">
                          {stats.totalPatients}
                        </p>
                        <p className="mt-1 text-xs text-blue-600">Tích lũy</p>
                      </div>
                      <div className="rounded-lg bg-green-50 p-4">
                        <p className="text-sm font-medium text-green-600">Tỉ lệ hoàn thành</p>
                        <p className="mt-2 text-2xl font-bold text-green-900">
                          {stats.completedAppointments}%
                        </p>
                        <p className="mt-1 text-xs text-green-600">Trên tổng lịch hẹn</p>
                      </div>
                      <div className="rounded-lg bg-yellow-50 p-4">
                        <p className="text-sm font-medium text-yellow-600">Đánh giá trung bình</p>
                        <p className="mt-2 text-2xl font-bold text-yellow-900">{stats.rating}/5</p>
                        <p className="mt-1 text-xs text-yellow-600">{stats.reviewCount} đánh giá</p>
                      </div>
                      <div className="rounded-lg bg-purple-50 p-4">
                        <p className="text-sm font-medium text-purple-600">Giờ làm việc</p>
                        <p className="mt-2 text-2xl font-bold text-purple-900">
                          {stats.workingHours}h
                        </p>
                        <p className="mt-1 text-xs text-purple-600">Mỗi tuần</p>
                      </div>
                    </div>

                    {/* Recent Reviews */}
                    <div>
                      <h4 className="text-md mb-4 font-semibold text-gray-900">Đánh giá gần đây</h4>
                      <div className="space-y-4">
                        {/* Mock reviews for now as we don't have reviews API */}
                        {[1, 2, 3].map((i) => (
                          <div key={i} className="rounded-lg border border-gray-200 p-4">
                            <div className="flex items-start justify-between">
                              <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-200 font-medium text-gray-600">
                                  BN
                                </div>
                                <div>
                                  <p className="font-medium text-gray-900">Bệnh nhân ẩn danh</p>
                                  <div className="mt-1 flex items-center gap-1">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                      <Star
                                        key={star}
                                        className="h-4 w-4 fill-yellow-400 text-yellow-400"
                                      />
                                    ))}
                                  </div>
                                </div>
                              </div>
                              <span className="text-xs text-gray-500">Gần đây</span>
                            </div>
                            <p className="mt-3 text-sm text-gray-600">
                              Bác sĩ rất tận tâm và chuyên nghiệp.
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
