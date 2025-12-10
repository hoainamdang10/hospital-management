'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  User,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Heart,
  Shield,
  AlertCircle,
  Edit,
  Loader2,
  Users,
  FileText,
  Clock,
  ChevronRight,
  ChevronLeft,
  Droplet,
  UserCheck,
  ClipboardList,
  RefreshCw,
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout';
import {
  getPatientById,
  patientService,
  Patient,
  EmergencyContact,
  Insurance,
} from '@/lib/api/patient.service';
import { appointmentsService } from '@/lib/api/appointments.service';
import { format, parseISO, differenceInYears } from 'date-fns';
import { vi } from 'date-fns/locale';
import Link from 'next/link';
import { toast } from 'sonner';

// ============================================================================
// TYPES
// ============================================================================
type ActiveTab = 'overview' | 'appointments' | 'medical' | 'settings';

interface AppointmentSummary {
  id: string;
  date: string;
  time: string;
  doctorName: string;
  status: string;
  reason?: string;
}

const APPOINTMENTS_PAGE_SIZE = 10;

// ============================================================================
// MAIN COMPONENT
// ============================================================================
export default function PatientDetailPage() {
  const params = useParams();
  const router = useRouter();
  const patientId = params.id as string;

  const [patient, setPatient] = useState<Patient | null>(null);
  const [emergencyContacts, setEmergencyContacts] = useState<EmergencyContact[]>([]);
  const [insurance, setInsurance] = useState<Insurance | null>(null);
  const [appointments, setAppointments] = useState<AppointmentSummary[]>([]);
  const [appointmentsTotal, setAppointmentsTotal] = useState(0);
  const [appointmentsPage, setAppointmentsPage] = useState(1);
  const [appointmentsHasMore, setAppointmentsHasMore] = useState(false);
  const [isAppointmentsLoading, setIsAppointmentsLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);
  const [activeTab, setActiveTab] = useState<ActiveTab>('overview');

  useEffect(() => {
    fetchPatientData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patientId]);

  const mapAppointments = (items: any[]): AppointmentSummary[] =>
    items.map((apt: any) => ({
      id: apt.id || apt.appointmentId,
      date: apt.appointmentDate || apt.date,
      time: apt.appointmentTime || apt.time,
      doctorName:
        apt.doctorName || apt.doctorFullName || apt.doctor?.fullName || apt.doctor_name || 'Bác sĩ',
      status: apt.status,
      reason: apt.reason,
    }));

  const fetchAppointments = async (page = 1) => {
    if (!patientId) {
      return;
    }
    setIsAppointmentsLoading(true);
    try {
      const response = await appointmentsService.getPatientAppointments(patientId, {
        page,
        pageSize: APPOINTMENTS_PAGE_SIZE,
      });
      const mapped = mapAppointments(response.appointments || []);
      setAppointments(mapped);
      setAppointmentsTotal(response.totalCount || mapped.length);
      setAppointmentsHasMore(response.hasMore ?? false);
      setAppointmentsPage(page);
    } catch (error) {
      console.error('Failed to fetch appointments:', error);
      toast.error('Không thể tải danh sách lịch hẹn');
    } finally {
      setIsAppointmentsLoading(false);
    }
  };

  const fetchPatientData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Fetch patient basic info
      const patientData = await getPatientById(patientId);
      setPatient(patientData);

      // Fetch emergency contacts
      try {
        const contactsRes = await patientService.getEmergencyContacts(patientId);
        setEmergencyContacts(contactsRes.contacts || []);
      } catch (e) {
        console.error('Failed to fetch emergency contacts:', e);
      }

      // Fetch insurance
      try {
        const insuranceRes = await patientService.getInsurance(patientId);
        setInsurance(insuranceRes.insuranceInfo);
      } catch (e) {
        console.error('Failed to fetch insurance:', e);
      }

      await fetchAppointments(1);
    } catch (err: any) {
      console.error('Error fetching patient:', err);
      setError(err.message || 'Không thể tải thông tin bệnh nhân');
      const isUserMissing =
        err?.message?.toUpperCase?.()?.includes?.('USER_NOT_FOUND') ||
        err?.message?.toLowerCase?.()?.includes?.('không tồn tại');
      toast.error(
        isUserMissing
          ? 'Tài khoản đăng nhập đã bị xóa, hồ sơ không còn truy cập được.'
          : 'Không thể tải thông tin bệnh nhân'
      );
    } finally {
      setIsLoading(false);
      setIsRetrying(false);
    }
  };

  // Calculate age
  const age = patient?.dateOfBirth
    ? differenceInYears(new Date(), parseISO(patient.dateOfBirth))
    : null;

  // Format date of birth
  const formattedDob = patient?.dateOfBirth
    ? format(parseISO(patient.dateOfBirth), 'dd/MM/yyyy')
    : 'Chưa cập nhật';

  // Gender display
  const genderDisplay =
    patient?.gender === 'MALE' ? 'Nam' : patient?.gender === 'FEMALE' ? 'Nữ' : 'Khác';

  // Full name
  const fullName =
    patient?.fullName ||
    `${patient?.firstName || ''} ${patient?.lastName || ''}`.trim() ||
    'Bệnh nhân';

  // Avatar initial
  const initial = patient?.lastName?.charAt(0) || patient?.firstName?.charAt(0) || '?';
  const totalAppointmentPages =
    appointmentsTotal > 0 ? Math.ceil(appointmentsTotal / APPOINTMENTS_PAGE_SIZE) : 1;
  const appointmentRangeStart =
    appointmentsTotal === 0 ? 0 : (appointmentsPage - 1) * APPOINTMENTS_PAGE_SIZE + 1;
  const appointmentRangeEnd =
    appointmentsTotal === 0
      ? 0
      : Math.min(appointmentsPage * APPOINTMENTS_PAGE_SIZE, appointmentsTotal);

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-12 w-12 animate-spin text-cyan-600" />
            <p className="text-lg font-medium text-slate-600">Đang tải thông tin...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !patient) {
    const isUserMissing =
      error?.toUpperCase?.()?.includes?.('USER_NOT_FOUND') ||
      error?.toLowerCase?.()?.includes?.('không tồn tại');
    const friendlyMessage = isUserMissing
      ? 'Tài khoản đăng nhập đã bị xóa. Hồ sơ bệnh nhân không còn khả dụng.'
      : 'Bệnh nhân này không tồn tại hoặc đã bị xóa.';

    return (
      <DashboardLayout>
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
              <AlertCircle className="h-8 w-8 text-red-600" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">Không tìm thấy hồ sơ</h2>
            <p className="text-slate-500">{friendlyMessage}</p>
            <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
              <button
                onClick={() => router.push('/admin/patients')}
                className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-2 text-sm font-semibold text-slate-700 transition-all hover:bg-slate-50"
              >
                <ArrowLeft className="h-4 w-4" />
                Về danh sách
              </button>
              <button
                onClick={() => {
                  setIsRetrying(true);
                  fetchPatientData();
                }}
                className="flex items-center gap-2 rounded-xl bg-cyan-600 px-5 py-2 text-sm font-semibold text-white transition-all hover:bg-cyan-700 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={isRetrying}
              >
                {isRetrying ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
                Thử lại
              </button>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-cyan-50/20 to-white">
        <div className="mx-auto max-w-7xl space-y-6 p-6">
          {/* Header with Back Button */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.back()}
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm transition-all hover:border-slate-300 hover:bg-slate-50"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">Chi tiết bệnh nhân</h1>
                <p className="text-sm text-slate-500">Mã: {patientId}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href={`/admin/patients/${patientId}/edit`}
                className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/25 transition-all hover:shadow-blue-500/40 hover:brightness-110"
              >
                <Edit className="h-4 w-4" />
                Chỉnh sửa
              </Link>
            </div>
          </motion.div>

          {/* Patient Hero Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
          >
            <div className="bg-gradient-to-r from-cyan-500 to-blue-600 p-6">
              <div className="flex flex-col items-start gap-6 sm:flex-row sm:items-center">
                {/* Avatar */}
                <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-2xl bg-white/20 text-4xl font-bold text-white shadow-lg backdrop-blur-sm">
                  {initial}
                </div>
                {/* Info */}
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-white">{fullName}</h2>
                  <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-white/80">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="h-4 w-4" />
                      {age !== null ? `${age} tuổi` : 'Chưa rõ tuổi'} • {formattedDob}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <User className="h-4 w-4" />
                      {genderDisplay}
                    </span>
                    {patient.bloodType && (
                      <span className="flex items-center gap-1.5">
                        <Droplet className="h-4 w-4" />
                        Nhóm máu: {patient.bloodType}
                      </span>
                    )}
                  </div>
                </div>
                {/* Quick Stats */}
                <div className="flex gap-4">
                  <div className="rounded-xl bg-white/20 px-4 py-3 text-center backdrop-blur-sm">
                    <p className="text-2xl font-bold text-white">{appointmentsTotal}</p>
                    <p className="text-xs text-white/80">Lịch hẹn</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Info Bar */}
            <div className="grid gap-4 border-b border-slate-100 bg-slate-50/50 p-4 sm:grid-cols-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-100">
                  <Phone className="h-5 w-5 text-cyan-600" />
                </div>
                <div>
                  <p className="text-xs text-slate-500">Số điện thoại</p>
                  <p className="font-medium text-slate-900">
                    {patient.phoneNumber || 'Chưa cập nhật'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
                  <Mail className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-slate-500">Email</p>
                  <p className="truncate font-medium text-slate-900">
                    {patient.email || 'Chưa cập nhật'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100">
                  <MapPin className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-xs text-slate-500">Địa chỉ</p>
                  <p className="truncate font-medium text-slate-900">
                    {patient.address || 'Chưa cập nhật'}
                  </p>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 border-b border-slate-100 px-4">
              {[
                { key: 'overview', label: 'Tổng quan', icon: User },
                { key: 'appointments', label: 'Lịch hẹn', icon: Calendar },
                { key: 'medical', label: 'Hồ sơ y tế', icon: FileText },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as ActiveTab)}
                  className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-all ${
                    activeTab === tab.key
                      ? 'border-cyan-600 text-cyan-600'
                      : 'border-transparent text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <tab.icon className="h-4 w-4" />
                  {tab.label}
                </button>
              ))}
            </div>
          </motion.div>

          {/* Tab Content */}
          <AnimatePresence mode="wait">
            {activeTab === 'overview' && (
              <motion.div
                key="overview"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="grid gap-6 lg:grid-cols-2"
              >
                {/* Emergency Contacts */}
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="mb-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-rose-500 to-pink-600 shadow-lg shadow-rose-500/30">
                        <Heart className="h-5 w-5 text-white" />
                      </div>
                      <h3 className="text-lg font-semibold text-slate-900">Liên hệ khẩn cấp</h3>
                    </div>
                  </div>
                  {emergencyContacts.length > 0 ? (
                    <div className="space-y-3">
                      {emergencyContacts.map((contact, idx) => (
                        <div
                          key={contact.contactId || idx}
                          className="flex items-center gap-4 rounded-xl border border-slate-100 bg-slate-50/50 p-4 transition-all hover:border-slate-200"
                        >
                          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-rose-500 to-pink-600 text-lg font-bold text-white">
                            {contact.name?.charAt(0) || '?'}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <p className="font-semibold text-slate-900">{contact.name}</p>
                              {contact.isPrimary && (
                                <span className="rounded-full bg-cyan-100 px-2 py-0.5 text-xs font-medium text-cyan-700">
                                  Chính
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-slate-500">{contact.relationship}</p>
                            <p className="mt-1 text-sm text-slate-600">{contact.phoneNumber}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                      <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-slate-100">
                        <Users className="h-7 w-7 text-slate-400" />
                      </div>
                      <p className="text-slate-500">Chưa có liên hệ khẩn cấp</p>
                    </div>
                  )}
                </div>

                {/* Insurance */}
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="mb-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg shadow-emerald-500/30">
                        <Shield className="h-5 w-5 text-white" />
                      </div>
                      <h3 className="text-lg font-semibold text-slate-900">Bảo hiểm</h3>
                    </div>
                  </div>
                  {insurance ? (
                    <div className="space-y-4">
                      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                        <div className="flex items-center justify-between">
                          <p className="text-sm text-emerald-700">Nhà cung cấp</p>
                          <p className="font-semibold text-emerald-800">{insurance.provider}</p>
                        </div>
                        <div className="mt-2 flex items-center justify-between">
                          <p className="text-sm text-emerald-700">Số hợp đồng</p>
                          <p className="font-semibold text-emerald-800">{insurance.policyNumber}</p>
                        </div>
                        <div className="mt-2 flex items-center justify-between">
                          <p className="text-sm text-emerald-700">Loại bảo hiểm</p>
                          <span className="rounded-full bg-emerald-200 px-3 py-1 text-xs font-medium text-emerald-800">
                            {insurance.coverageType}
                          </span>
                        </div>
                        <div className="mt-3 border-t border-emerald-200 pt-3">
                          <p className="text-xs text-emerald-600">
                            Hiệu lực: {format(parseISO(insurance.validFrom), 'dd/MM/yyyy')} -{' '}
                            {format(parseISO(insurance.validTo), 'dd/MM/yyyy')}
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                      <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-slate-100">
                        <Shield className="h-7 w-7 text-slate-400" />
                      </div>
                      <p className="text-slate-500">Chưa có thông tin bảo hiểm</p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {activeTab === 'appointments' && (
              <motion.div
                key="appointments"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="rounded-2xl border border-slate-200 bg-white shadow-sm"
              >
                <div className="flex items-center justify-between border-b border-slate-100 p-6">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/30">
                      <Calendar className="h-5 w-5 text-white" />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-900">Lịch hẹn gần đây</h3>
                  </div>
                </div>
                <div className="divide-y divide-slate-100">
                  {isAppointmentsLoading ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <Loader2 className="mb-3 h-8 w-8 animate-spin text-cyan-600" />
                      <p className="text-sm text-slate-500">Đang tải lịch hẹn...</p>
                    </div>
                  ) : appointments.length > 0 ? (
                    appointments.map((apt, idx) => (
                      <motion.div
                        key={apt.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className="flex items-center gap-4 p-4 transition-colors hover:bg-slate-50"
                      >
                        <div className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-xl bg-blue-100">
                          <span className="text-xs font-semibold text-blue-700">
                            {apt.date ? format(parseISO(apt.date), 'dd', { locale: vi }) : '--'}
                          </span>
                          <span className="text-[10px] text-blue-600 uppercase">
                            {apt.date ? format(parseISO(apt.date), 'MMM', { locale: vi }) : ''}
                          </span>
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-slate-900">{apt.doctorName}</p>
                          <div className="flex items-center gap-2 text-sm text-slate-500">
                            <Clock className="h-3.5 w-3.5" />
                            {apt.time || '-'}
                            {apt.reason && <span>• {apt.reason}</span>}
                          </div>
                        </div>
                        <StatusBadge status={apt.status} />
                        <ChevronRight className="h-5 w-5 text-slate-300" />
                      </motion.div>
                    ))
                  ) : (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-slate-100">
                        <Calendar className="h-7 w-7 text-slate-400" />
                      </div>
                      <p className="font-medium text-slate-900">Chưa có lịch hẹn</p>
                      <p className="text-sm text-slate-500">Bệnh nhân chưa có lịch hẹn nào</p>
                    </div>
                  )}
                </div>
                {appointmentsTotal > APPOINTMENTS_PAGE_SIZE && (
                  <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/50 px-4 py-3">
                    <div className="text-sm text-slate-500">
                      Hiển thị{' '}
                      <span className="font-semibold text-slate-900">{appointmentRangeStart}</span>{' '}
                      - <span className="font-semibold text-slate-900">{appointmentRangeEnd}</span>{' '}
                      trong{' '}
                      <span className="font-semibold text-slate-900">{appointmentsTotal}</span> lịch
                      hẹn
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => fetchAppointments(appointmentsPage - 1)}
                        disabled={appointmentsPage === 1 || isAppointmentsLoading}
                        className="rounded-lg border border-slate-200 bg-white p-2 text-slate-600 shadow-sm transition-all hover:bg-slate-50 hover:text-cyan-600 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </button>
                      <span className="text-sm text-slate-600">
                        Trang {appointmentsPage}/{totalAppointmentPages}
                      </span>
                      <button
                        onClick={() => fetchAppointments(appointmentsPage + 1)}
                        disabled={
                          isAppointmentsLoading ||
                          (!appointmentsHasMore && appointmentsPage >= totalAppointmentPages)
                        }
                        className="rounded-lg border border-slate-200 bg-white p-2 text-slate-600 shadow-sm transition-all hover:bg-slate-50 hover:text-cyan-600 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === 'medical' && (
              <motion.div
                key="medical"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="rounded-2xl border border-slate-200 bg-white shadow-sm"
              >
                <div className="flex items-center justify-between border-b border-slate-100 p-6">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 shadow-lg shadow-violet-500/30">
                      <ClipboardList className="h-5 w-5 text-white" />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-900">Hồ sơ y tế</h3>
                  </div>
                </div>
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-violet-100">
                    <FileText className="h-8 w-8 text-violet-500" />
                  </div>
                  <h4 className="text-lg font-semibold text-slate-900">
                    Tính năng đang phát triển
                  </h4>
                  <p className="mt-1 max-w-sm text-slate-500">
                    Hồ sơ y tế chi tiết sẽ được cập nhật trong phiên bản tiếp theo
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </DashboardLayout>
  );
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { bg: string; text: string; label: string }> = {
    COMPLETED: { bg: 'bg-emerald-100', text: 'text-emerald-700', label: 'Hoàn thành' },
    CONFIRMED: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Đã xác nhận' },
    SCHEDULED: { bg: 'bg-cyan-100', text: 'text-cyan-700', label: 'Đã đặt' },
    PENDING: { bg: 'bg-amber-100', text: 'text-amber-700', label: 'Chờ xác nhận' },
    CANCELLED: { bg: 'bg-red-100', text: 'text-red-700', label: 'Đã hủy' },
    NO_SHOW: { bg: 'bg-slate-100', text: 'text-slate-700', label: 'Vắng mặt' },
  };

  const normalized = status?.toUpperCase() || '';
  const { bg, text, label } = config[normalized] || {
    bg: 'bg-slate-100',
    text: 'text-slate-600',
    label: status,
  };

  return (
    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${bg} ${text}`}>{label}</span>
  );
}
