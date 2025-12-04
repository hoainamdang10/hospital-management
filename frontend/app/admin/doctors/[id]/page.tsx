'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/layout';
import { ArrowLeft, Mail, Phone, MapPin, Users, Calendar, Star, Loader2, MessageSquare, CalendarPlus, Globe, Clock } from 'lucide-react';
import { getStaffById, type Staff } from '@/lib/api/staff.service';
import { appointmentsService } from '@/lib/api/appointments.service';
import type { AppointmentReadModel } from '@/lib/types/appointments';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

/**
 * Admin Doctor Profile Page - Redesigned with Soft UI Evolution
 * Design System: Be Vietnam Pro + Inter, Medical Blue (#3B82F6), Cyan (#0891B2)
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
    rating: 4.8,
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
        const appointmentsData = await appointmentsService.list({
          doctorId: doctorData.staffId,
          limit: 100,
        });

        setAppointments(appointmentsData.appointments);

        // 3. Extract Unique Patients from Appointments
        const uniquePatientsMap = new Map();
        appointmentsData.appointments.forEach((apt: any) => {
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
              status: 'Đang điều trị',
            });
          }
        });
        setPatients(Array.from(uniquePatientsMap.values()));

        // 4. Calculate Stats
        const completed = appointmentsData.appointments.filter(
          (a) => a.status === 'completed'
        ).length;
        const total = appointmentsData.appointments.length;

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

  // Helper functions
  const getInitials = (name: string) => {
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return parts[0][0] + parts[parts.length - 1][0];
    }
    return name.substring(0, 2);
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'dd/MM/yyyy', { locale: vi });
    } catch {
      return dateString;
    }
  };

  const calculateAge = (dob?: string) => {
    if (!dob) return 'N/A';
    const birthDate = new Date(dob);
    const ageDifMs = Date.now() - birthDate.getTime();
    const ageDate = new Date(ageDifMs);
    return Math.abs(ageDate.getUTCFullYear() - 1970);
  };

  const getStatusBadge = (status: string) => {
    const statusMap: { [key: string]: { label: string; className: string } } = {
      active: { label: 'Đang hoạt động', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
      suspended: { label: 'Tạm nghỉ', className: 'bg-amber-50 text-amber-700 border-amber-200' },
      on_leave: { label: 'Nghỉ phép', className: 'bg-blue-50 text-blue-700 border-blue-200' },
      inactive: { label: 'Đã nghỉ', className: 'bg-slate-50 text-slate-700 border-slate-200' },
    };
    const { label, className } = statusMap[status] || statusMap.inactive;
    return <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${className}`}>{label}</span>;
  };

  const getAppointmentStatusBadge = (status: string) => {
    const statusMap: { [key: string]: { label: string; className: string } } = {
      completed: { label: 'Hoàn thành', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
      confirmed: { label: 'Đã xác nhận', className: 'bg-blue-50 text-blue-700 border-blue-200' },
      pending: { label: 'Chờ xác nhận', className: 'bg-amber-50 text-amber-700 border-amber-200' },
      cancelled: { label: 'Đã hủy', className: 'bg-red-50 text-red-700 border-red-200' },
    };
    const { label, className } = statusMap[status] || { label: status, className: 'bg-slate-50 text-slate-700 border-slate-200' };
    return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${className}`}>{label}</span>;
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex h-screen items-center justify-center bg-slate-50">
          <div className="text-center">
            <Loader2 className="mx-auto h-12 w-12 animate-spin text-blue-600" />
            <p className="mt-4 text-sm text-slate-600">Đang tải thông tin bác sĩ...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !doctor) {
    return (
      <DashboardLayout>
        <div className="flex h-screen flex-col items-center justify-center bg-slate-50">
          <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center">
            <p className="mb-4 text-lg font-medium text-red-700">{error || 'Không tìm thấy bác sĩ'}</p>
            <button
              onClick={() => router.back()}
              className="rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-medium text-white transition-all hover:bg-blue-700 hover:shadow-lg"
            >
              Quay lại
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const dayNames = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ nhật'];
  const dayKeys = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

  const todayAppointments = appointments.filter((apt) => {
    const today = new Date().toISOString().split('T')[0];
    return apt.appointment_date === today;
  });

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-slate-50">
        {/* Header */}
        <div className="border-b border-slate-200 bg-white">
          <div className="mx-auto max-w-7xl px-6 py-4">
            <button
              onClick={() => router.back()}
              className="group flex items-center gap-2 text-slate-600 transition-colors hover:text-slate-900"
            >
              <ArrowLeft className="h-5 w-5 transition-transform group-hover:-translate-x-1" />
              <span className="text-lg font-semibold">Hồ sơ bác sĩ</span>
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="mx-auto max-w-7xl p-6">
          <div className="grid gap-6 lg:grid-cols-12">
            {/* Left Sidebar - Doctor Profile Card */}
            <div className="lg:col-span-4 xl:col-span-3">
              <div className="sticky top-6">
                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                  {/* Avatar & Basic Info */}
                  <div className="border-b border-slate-100 bg-gradient-to-br from-blue-50 to-cyan-50 p-6 text-center">
                    <div className="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 text-3xl font-bold text-white shadow-lg">
                      {getInitials(doctor.personalInfo.fullName)}
                    </div>
                    <h2 className="text-xl font-bold text-slate-900">{doctor.personalInfo.fullName}</h2>
                    <p className="mt-1 text-sm text-slate-600">
                      {doctor.specializations?.[0]?.name || doctor.professionalInfo.department}
                    </p>
                    <div className="mt-3">
                      {getStatusBadge(doctor.status)}
                    </div>
                    {/* Rating */}
                    <div className="mt-4 flex items-center justify-center gap-1.5">
                      <Star className="h-5 w-5 fill-amber-400 text-amber-400" />
                      <span className="font-semibold text-slate-900">{stats.rating}</span>
                      <span className="text-sm text-slate-500">• {stats.reviewCount} đánh giá</span>
                    </div>
                  </div>

                  <div className="p-6">
                    {/* Contact Section */}
                    <div className="mb-6">
                      <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Liên hệ</h3>
                      <div className="space-y-3">
                        <div className="flex items-start gap-3">
                          <Mail className="mt-0.5 h-4 w-4 flex-shrink-0 text-slate-400" />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm text-slate-700">
                              {doctor.personalInfo.email || 'Chưa cập nhật'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <Phone className="mt-0.5 h-4 w-4 flex-shrink-0 text-slate-400" />
                          <div className="min-w-0 flex-1">
                            <p className="text-sm text-slate-700">{doctor.personalInfo.phoneNumber}</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <MapPin className="mt-0.5 h-4 w-4 flex-shrink-0 text-slate-400" />
                          <div className="min-w-0 flex-1">
                            <p className="text-sm leading-relaxed text-slate-700">
                              {doctor.personalInfo.address
                                ? `${doctor.personalInfo.address.street}, ${doctor.personalInfo.address.ward || ''}, ${doctor.personalInfo.address.district}, ${doctor.personalInfo.address.city}`.replace(', ,', ',')
                                : 'Chưa cập nhật địa chỉ'}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Professional Info */}
                    <div className="mb-6 border-t border-slate-100 pt-6">
                      <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Thông tin nghề nghiệp</h3>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-slate-600">Tổng bệnh nhân</span>
                          <span className="font-semibold text-slate-900">{stats.totalPatients}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-slate-600">Kinh nghiệm</span>
                          <span className="font-semibold text-slate-900">{doctor.yearsOfExperience || 0} năm</span>
                        </div>
                      </div>
                    </div>

                    {/* Languages */}
                    {doctor.professionalInfo.languages && doctor.professionalInfo.languages.length > 0 && (
                      <div className="mb-6 border-t border-slate-100 pt-6">
                        <h3 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
                          <Globe className="h-3.5 w-3.5" />
                          Ngôn ngữ
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          {doctor.professionalInfo.languages.map((lang, idx) => (
                            <span
                              key={idx}
                              className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700"
                            >
                              {lang}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Weekly Schedule */}
                    <div className="mb-6 border-t border-slate-100 pt-6">
                      <h3 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
                        <Clock className="h-3.5 w-3.5" />
                        Lịch làm việc
                      </h3>
                      <div className="space-y-2 text-sm">
                        {doctor.workSchedule && doctor.workSchedule.workingDays ? (
                          dayKeys.map((day, idx) => {
                            const isWorking = doctor.workSchedule.workingDays.includes(day);
                            const daily = doctor.workSchedule.dailySchedules?.find(
                              (d: any) => d.day?.toLowerCase?.() === day
                            );
                            return (
                              <div key={day} className="flex items-center justify-between">
                                <span className="text-slate-600">{dayNames[idx]}</span>
                                {isWorking ? (
                                  <span className="font-medium text-slate-900">
                                    {daily?.start || doctor.workSchedule.workingHours.start} -{' '}
                                    {daily?.end || doctor.workSchedule.workingHours.end}
                                  </span>
                                ) : (
                                  <span className="font-medium text-red-600">Nghỉ</span>
                                )}
                              </div>
                            );
                          })
                        ) : (
                          <p className="text-sm text-slate-500">Chưa cập nhật lịch làm việc</p>
                        )}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="space-y-2 border-t border-slate-100 pt-6">
                      <button className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition-all hover:bg-blue-700 hover:shadow-lg">
                        <MessageSquare className="h-4 w-4" />
                        Nhắn tin
                      </button>
                      <button className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition-all hover:bg-slate-50 hover:shadow">
                        <CalendarPlus className="h-4 w-4" />
                        Đặt lịch
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Content - Tabs */}
            <div className="lg:col-span-8 xl:col-span-9">
              {/* Sticky Tab Navigation */}
              <div className="sticky top-6 z-10 mb-6">
                <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                  <nav className="flex">
                    {[
                      { id: 'overview', label: 'Tổng quan' },
                      { id: 'appointments', label: 'Lịch hẹn', count: appointments.length },
                      { id: 'patients', label: 'Bệnh nhân', count: patients.length },
                      { id: 'performance', label: 'Hiệu suất' },
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`relative flex-1 border-b-2 px-4 py-3 text-sm font-medium transition-colors ${activeTab === tab.id
                            ? 'border-blue-600 text-blue-600'
                            : 'border-transparent text-slate-600 hover:text-slate-900'
                          }`}
                      >
                        {tab.label}
                        {tab.count !== undefined && (
                          <span
                            className={`ml-2 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${activeTab === tab.id
                                ? 'bg-blue-50 text-blue-700'
                                : 'bg-slate-100 text-slate-600'
                              }`}
                          >
                            {tab.count}
                          </span>
                        )}
                      </button>
                    ))}
                  </nav>
                </div>
              </div>

              {/* Tab Content */}
              <div className="min-h-[600px]">
                {/* Overview Tab */}
                {activeTab === 'overview' && (
                  <div className="space-y-6">
                    {/* About Section */}
                    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                      <h3 className="mb-4 text-lg font-semibold text-slate-900">Giới thiệu</h3>
                      <p className="leading-relaxed text-slate-600">
                        {doctor.professionalInfo.bio ||
                          `${doctor.personalInfo.fullName} là ${doctor.professionalInfo.title} với ${doctor.yearsOfExperience || 0} năm kinh nghiệm tại khoa ${doctor.professionalInfo.department}.
                          ${doctor.specializations && doctor.specializations.length > 0 ? ` Chuyên về ${doctor.specializations.map((s) => s.name).join(', ')}.` : ''}`}
                      </p>
                    </div>

                    {/* Education & Certifications */}
                    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                      <h3 className="mb-6 text-lg font-semibold text-slate-900">Học vấn & Chứng chỉ</h3>

                      <div className="space-y-6">
                        {/* Education */}
                        <div>
                          <h4 className="mb-3 text-sm font-semibold text-slate-700">Học vấn</h4>
                          {doctor.professionalInfo.education && doctor.professionalInfo.education.length > 0 ? (
                            <div className="space-y-3">
                              {doctor.professionalInfo.education.map((edu, idx) => (
                                <div key={idx} className="flex items-start gap-3 rounded-lg bg-slate-50 p-3">
                                  <div className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-blue-100">
                                    <Calendar className="h-4 w-4 text-blue-600" />
                                  </div>
                                  <div>
                                    <p className="font-medium text-slate-900">{edu}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-sm text-slate-500">Chưa cập nhật thông tin học vấn</p>
                          )}
                        </div>

                        {/* Certifications */}
                        <div className="border-t border-slate-100 pt-6">
                          <h4 className="mb-3 text-sm font-semibold text-slate-700">Chứng chỉ</h4>
                          {doctor.certifications && doctor.certifications.length > 0 ? (
                            <div className="space-y-3">
                              {doctor.certifications.map((cert, idx) => (
                                <div key={idx} className="flex items-start justify-between rounded-lg bg-slate-50 p-3">
                                  <div>
                                    <p className="font-medium text-slate-900">{cert.certificationName}</p>
                                    <p className="text-sm text-slate-600">{cert.issuingOrganization}</p>
                                  </div>
                                  {cert.issueDate && (
                                    <span className="text-sm font-medium text-slate-500">
                                      {new Date(cert.issueDate).getFullYear()}
                                    </span>
                                  )}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-sm text-slate-500">Chưa có chứng chỉ</p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Today's Schedule */}
                    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                      <div className="mb-4 flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-slate-900">Lịch hôm nay</h3>
                        <button
                          onClick={() => setActiveTab('appointments')}
                          className="text-sm font-medium text-blue-600 transition-colors hover:text-blue-700"
                        >
                          Xem lịch đầy đủ →
                        </button>
                      </div>

                      <div className="space-y-3">
                        {todayAppointments.length > 0 ? (
                          todayAppointments.slice(0, 5).map((apt, idx) => (
                            <div
                              key={idx}
                              className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 p-4 transition-all hover:border-blue-200 hover:bg-blue-50/50"
                            >
                              <div className="flex items-center gap-4">
                                <div className="text-center">
                                  <p className="text-lg font-bold text-slate-900">
                                    {apt.appointment_time?.substring(0, 5) || 'N/A'}
                                  </p>
                                  <p className="text-xs text-slate-500">{apt.type}</p>
                                </div>
                                <div>
                                  <p className="font-medium text-slate-900">{apt.patient_full_name}</p>
                                  <p className="text-sm text-slate-600">{apt.reason || apt.type}</p>
                                </div>
                              </div>
                              {getAppointmentStatusBadge(apt.status)}
                            </div>
                          ))
                        ) : (
                          <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
                            <Calendar className="mx-auto h-12 w-12 text-slate-400" />
                            <p className="mt-3 text-sm font-medium text-slate-600">Không có lịch hẹn hôm nay</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Appointments Tab */}
                {activeTab === 'appointments' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                      <h3 className="text-lg font-semibold text-slate-900">Danh sách lịch hẹn</h3>
                      <select className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20">
                        <option>Tất cả</option>
                        <option>Hôm nay</option>
                        <option>Tuần này</option>
                        <option>Tháng này</option>
                      </select>
                    </div>

                    <div className="space-y-3">
                      {appointments.length > 0 ? (
                        appointments.map((apt: any, i) => {
                          const patientName = apt.patientName || apt.patient_full_name || 'Bệnh nhân';
                          const appointmentTime = apt.appointmentTime || apt.appointment_time;
                          const appointmentDate = apt.appointmentDate || apt.appointment_date;

                          return (
                            <div
                              key={i}
                              className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-all hover:border-blue-200 hover:shadow-md"
                            >
                              <div className="flex items-center gap-4">
                                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 font-semibold text-white">
                                  {getInitials(patientName)}
                                </div>
                                <div>
                                  <p className="font-medium text-slate-900">{patientName}</p>
                                  <p className="text-sm text-slate-600">{apt.reason || apt.type}</p>
                                  <p className="mt-1 flex items-center gap-2 text-xs text-slate-500">
                                    <Clock className="h-3.5 w-3.5" />
                                    {appointmentTime?.substring(0, 5) || 'N/A'} • {formatDate(appointmentDate)}
                                  </p>
                                </div>
                              </div>
                              {getAppointmentStatusBadge(apt.status)}
                            </div>
                          );
                        })
                      ) : (
                        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-12 text-center">
                          <CalendarPlus className="mx-auto h-16 w-16 text-slate-400" />
                          <p className="mt-4 text-lg font-medium text-slate-600">Chưa có lịch hẹn nào</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Patients Tab */}
                {activeTab === 'patients' && (
                  <div className="space-y-4">
                    <div className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
                      <h3 className="text-lg font-semibold text-slate-900">Danh sách bệnh nhân</h3>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Tìm kiếm bệnh nhân..."
                          className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                        />
                        <select className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20">
                          <option>Tất cả</option>
                          <option>Đang điều trị</option>
                          <option>Hoàn thành</option>
                        </select>
                      </div>
                    </div>

                    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead className="border-b border-slate-200 bg-slate-50">
                            <tr>
                              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">
                                Bệnh nhân
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">
                                Tuổi
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">
                                Giới tính
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">
                                Lần khám cuối
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">
                                Trạng thái
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-200">
                            {patients.length > 0 ? (
                              patients.map((patient, i) => (
                                <tr key={i} className="transition-colors hover:bg-slate-50">
                                  <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-200 font-medium text-slate-600">
                                        {getInitials(patient.name)}
                                      </div>
                                      <div>
                                        <p className="font-medium text-slate-900">{patient.name}</p>
                                        <p className="text-sm text-slate-500">ID: {patient.id}</p>
                                      </div>
                                    </div>
                                  </td>
                                  <td className="px-6 py-4 text-sm text-slate-700">{calculateAge(patient.dob)} tuổi</td>
                                  <td className="px-6 py-4 text-sm text-slate-700">
                                    {patient.gender === 'male' ? 'Nam' : patient.gender === 'female' ? 'Nữ' : 'Khác'}
                                  </td>
                                  <td className="px-6 py-4 text-sm text-slate-700">{formatDate(patient.lastVisit)}</td>
                                  <td className="px-6 py-4">
                                    <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
                                      {patient.status}
                                    </span>
                                  </td>
                                </tr>
                              ))
                            ) : (
                              <tr>
                                <td colSpan={5} className="px-6 py-12 text-center">
                                  <Users className="mx-auto h-16 w-16 text-slate-400" />
                                  <p className="mt-4 text-lg font-medium text-slate-600">Chưa có bệnh nhân nào</p>
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}

                {/* Performance Tab */}
                {activeTab === 'performance' && (
                  <div className="space-y-6">
                    {/* KPI Cards */}
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                      <div className="rounded-xl border border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100 p-6 shadow-sm">
                        <p className="text-sm font-medium text-blue-700">Tổng bệnh nhân</p>
                        <p className="mt-2 text-3xl font-bold text-blue-900">{stats.totalPatients}</p>
                        <p className="mt-1 text-xs text-blue-600">Tích lũy</p>
                      </div>
                      <div className="rounded-xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-emerald-100 p-6 shadow-sm">
                        <p className="text-sm font-medium text-emerald-700">Tỉ lệ hoàn thành</p>
                        <p className="mt-2 text-3xl font-bold text-emerald-900">{stats.completedAppointments}%</p>
                        <p className="mt-1 text-xs text-emerald-600">Trên tổng lịch hẹn</p>
                      </div>
                      <div className="rounded-xl border border-amber-200 bg-gradient-to-br from-amber-50 to-amber-100 p-6 shadow-sm">
                        <p className="text-sm font-medium text-amber-700">Đánh giá trung bình</p>
                        <p className="mt-2 text-3xl font-bold text-amber-900">{stats.rating}/5</p>
                        <p className="mt-1 text-xs text-amber-600">{stats.reviewCount} đánh giá</p>
                      </div>
                      <div className="rounded-xl border border-purple-200 bg-gradient-to-br from-purple-50 to-purple-100 p-6 shadow-sm">
                        <p className="text-sm font-medium text-purple-700">Giờ làm việc</p>
                        <p className="mt-2 text-3xl font-bold text-purple-900">{stats.workingHours}h</p>
                        <p className="mt-1 text-xs text-purple-600">Mỗi tuần</p>
                      </div>
                    </div>

                    {/* Recent Reviews */}
                    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                      <h4 className="mb-4 text-lg font-semibold text-slate-900">Đánh giá gần đây</h4>
                      <div className="space-y-4">
                        {[1, 2, 3].map((i) => (
                          <div key={i} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                            <div className="flex items-start justify-between">
                              <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-slate-400 to-slate-500 font-medium text-white">
                                  BN
                                </div>
                                <div>
                                  <p className="font-medium text-slate-900">Bệnh nhân ẩn danh</p>
                                  <div className="mt-1 flex items-center gap-1">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                      <Star key={star} className="h-4 w-4 fill-amber-400 text-amber-400" />
                                    ))}
                                  </div>
                                </div>
                              </div>
                              <span className="text-xs text-slate-500">Gần đây</span>
                            </div>
                            <p className="mt-3 text-sm leading-relaxed text-slate-600">
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
