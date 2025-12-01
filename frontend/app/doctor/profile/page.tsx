'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Calendar,
  Save,
  User,
  Mail,
  Phone,
  Briefcase,
  Clock,
  Award,
  Edit,
  CheckCircle2,
  Stethoscope,
  MapPin,
  GraduationCap,
  Languages,
  FileText,
  Lock,
  KeyRound,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DashboardLayout } from '@/components/layout';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { Staff, getStaffByUserId, updateMyStaffProfile } from '@/lib/api/staff.service';
import { Skeleton } from '@/components/ui/skeleton';
import { ChangePasswordDialog } from '@/components/profile/ChangePasswordDialog';

type FormState = {
  fullName: string;
  specialization: string;
  email: string;
  phone: string;
  address: string;
  education: string;
  title: string;
  experience: string;
  languages: string;
  license: string;
  bio: string;
};

export default function DoctorProfilePage() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const [staff, setStaff] = useState<Staff | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState<FormState>({
    fullName: '',
    specialization: '',
    email: '',
    phone: '',
    address: '',
    education: '',
    title: '',
    experience: '',
    languages: '',
    license: '',
    bio: '',
  });

  useEffect(() => {
    const load = async () => {
      if (!user?.userId) return;
      setLoading(true);
      try {
        const data = await getStaffByUserId(user.userId);
        if (data) {
          setStaff(data);
          const addr = data.personalInfo?.address;
          const education = data.professionalInfo?.education || [];
          const languageList = data.professionalInfo?.languages || [];
          const specialization =
            data.specializations?.[0]?.name || data.professionalInfo?.department || 'Chưa cập nhật';
          const years =
            (data as any).yearsOfExperience ?? (data as any).employmentInfo?.yearsOfExperience ?? 0;
          const licenseOrCert =
            (data as any).licenseNumber ||
            (data.credentials && data.credentials.length > 0
              ? `${data.credentials.length} chứng chỉ`
              : null) ||
            'Chưa cập nhật';
          setForm({
            fullName: data.personalInfo?.fullName || '',
            specialization,
            email: data.personalInfo?.email || '',
            phone: data.personalInfo?.phoneNumber || '',
            address: addr
              ? `${addr.street || ''}, ${addr.ward || ''}, ${addr.district || ''}, ${addr.city || ''}`
                  .replace(/, ,/g, ',')
                  .replace(/^,|,$/g, '')
                  .trim()
              : 'Chưa cập nhật',
            education: education.join(', '),
            title: data.professionalInfo?.title || '',
            experience: `${years} năm`,
            languages: languageList.join(', ') || 'Tiếng Việt',
            license: licenseOrCert,
            bio:
              data.professionalInfo?.bio ||
              `${data.personalInfo?.fullName || 'Bác sĩ'} với ${
                years || 0
              } năm kinh nghiệm tại khoa ${data.professionalInfo?.department || 'Chưa cập nhật'}.`,
          });
        }
      } catch (err) {
        console.error('Load doctor profile failed', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user?.userId]);

  const scheduleRows = useMemo(() => {
    const daysOrder = [
      { key: 'monday', label: 'Thứ 2' },
      { key: 'tuesday', label: 'Thứ 3' },
      { key: 'wednesday', label: 'Thứ 4' },
      { key: 'thursday', label: 'Thứ 5' },
      { key: 'friday', label: 'Thứ 6' },
      { key: 'saturday', label: 'Thứ 7' },
      { key: 'sunday', label: 'Chủ nhật' },
    ] as const;
    const workingDays = new Set(
      staff?.workSchedule?.workingDays?.map((d) => d.toLowerCase()) || []
    );
    const start = staff?.workSchedule?.workingHours?.start || '08:00';
    const end = staff?.workSchedule?.workingHours?.end || '17:00';
    const daily = staff?.workSchedule?.dailySchedules;
    return daysOrder.map((d) => ({
      day: d.label,
      working: workingDays.has(d.key),
      morning: workingDays.has(d.key)
        ? `${daily?.find((x: any) => x.day?.toLowerCase() === d.key)?.start || start} - ${
            daily?.find((x: any) => x.day?.toLowerCase() === d.key)?.end || end
          }`
        : 'Nghỉ',
      afternoon: workingDays.has(d.key)
        ? `${daily?.find((x: any) => x.day?.toLowerCase() === d.key)?.start || start} - ${
            daily?.find((x: any) => x.day?.toLowerCase() === d.key)?.end || end
          }`
        : 'Nghỉ',
    }));
  }, [staff]);

  const handleSave = async () => {
    if (!staff) return;
    setIsSaving(true);
    try {
      const educationArray = form.education
        ? form.education
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean)
        : [];
      const languageArray = form.languages
        ? form.languages
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean)
        : [];
      const currentAddr = staff.personalInfo?.address || {};
      const addressObj =
        form.address && form.address.trim().length > 0
          ? {
              ...currentAddr,
              street: form.address.trim(),
            }
          : currentAddr && Object.keys(currentAddr).length > 0
            ? currentAddr
            : undefined;

      await updateMyStaffProfile({
        staffId: staff.staffId,
        personalInfo: {
          fullName: form.fullName || undefined,
          phoneNumber: form.phone || undefined,
          address: addressObj,
        },
        professionalInfo: {
          title: form.title || undefined,
          position: staff.professionalInfo?.position || undefined,
          education: educationArray.length ? educationArray : undefined,
          languages: languageArray.length ? languageArray : undefined,
          bio: form.bio || undefined,
        },
      });

      // Refresh data from API to reflect latest state
      if (user?.userId) {
        const fresh = await getStaffByUserId(user.userId);
        if (fresh) {
          setStaff(fresh);
          const addr = fresh.personalInfo?.address;
          const education = fresh.professionalInfo?.education || [];
          const languageList = fresh.professionalInfo?.languages || [];
          const specialization =
            fresh.specializations?.[0]?.name ||
            fresh.professionalInfo?.department ||
            'Chưa cập nhật';
          const years =
            (fresh as any).yearsOfExperience ??
            (fresh as any).employmentInfo?.yearsOfExperience ??
            0;
          const licenseOrCert =
            (fresh as any).licenseNumber ||
            (fresh.credentials && fresh.credentials.length > 0
              ? `${fresh.credentials.length} chứng chỉ`
              : null) ||
            'Chưa cập nhật';
          setForm({
            fullName: fresh.personalInfo?.fullName || '',
            specialization,
            email: fresh.personalInfo?.email || '',
            phone: fresh.personalInfo?.phoneNumber || '',
            address: addr
              ? `${addr.street || ''}, ${addr.ward || ''}, ${addr.district || ''}, ${addr.city || ''}`
                  .replace(/, ,/g, ',')
                  .replace(/^,|,$/g, '')
                  .trim()
              : 'Chưa cập nhật',
            education: education.join(', '),
            title: fresh.professionalInfo?.title || '',
            experience: `${years} năm`,
            languages: languageList.join(', ') || 'Tiếng Việt',
            license: licenseOrCert,
            bio:
              fresh.professionalInfo?.bio ||
              `${fresh.personalInfo?.fullName || 'Bác sĩ'} với ${
                years || 0
              } năm kinh nghiệm tại khoa ${fresh.professionalInfo?.department || 'Chưa cập nhật'}.`,
          });
        }
      }
      setIsEditing(false);
    } catch (err) {
      console.error('Save doctor profile failed', err);
    } finally {
      setIsSaving(false);
    }
  };

  if (isAuthLoading || loading) {
    return (
      <DashboardLayout>
        <div className="space-y-4">
          <Skeleton className="h-40 w-full rounded-2xl" />
          <Skeleton className="h-64 w-full rounded-2xl" />
          <Skeleton className="h-64 w-full rounded-2xl" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Premium Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 p-8 text-white shadow-xl"
        >
          {/* Animated background orbs */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            {[...Array(3)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute rounded-full bg-white/10 blur-3xl"
                style={{
                  width: `${200 + i * 100}px`,
                  height: `${200 + i * 100}px`,
                  left: `${10 + i * 30}%`,
                  top: `${-20 + i * 20}%`,
                }}
                animate={{
                  x: [0, 20, 0],
                  y: [0, 30, 0],
                  scale: [1, 1.1, 1],
                }}
                transition={{
                  duration: 8 + i * 2,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              />
            ))}
          </div>

          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center gap-6">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                className="flex h-24 w-24 items-center justify-center rounded-2xl bg-white/20 shadow-2xl backdrop-blur-xl"
              >
                <Stethoscope className="h-12 w-12 text-white" />
              </motion.div>
              <div>
                <h1 className="mb-2 text-4xl font-bold">Hồ sơ & Lịch làm việc</h1>
                <p className="text-blue-100">
                  {staff?.personalInfo?.fullName ||
                    'Quản lý thông tin cá nhân và lịch làm việc của bạn'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <ChangePasswordDialog
                userId={user?.userId}
                trigger={
                  <Button
                    type="button"
                    disabled={!user?.userId}
                    className="rounded-xl border border-white/40 bg-white/20 px-4 py-2 text-sm font-semibold text-white shadow-lg backdrop-blur hover:bg-white/30 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <KeyRound className="mr-2 h-4 w-4" />
                    Đổi mật khẩu
                  </Button>
                }
              />
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  onClick={isEditing ? handleSave : () => setIsEditing(true)}
                  disabled={isSaving}
                  className="rounded-xl bg-white px-6 py-3 font-semibold text-blue-600 shadow-lg hover:bg-blue-50"
                >
                  {isSaving ? (
                    <>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                        className="mr-2 h-4 w-4 rounded-full border-2 border-blue-600 border-t-transparent"
                      />
                      Đang lưu...
                    </>
                  ) : isEditing ? (
                    <>
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      Lưu
                    </>
                  ) : (
                    <>
                      <Edit className="mr-2 h-4 w-4" />
                      Chỉnh sửa
                    </>
                  )}
                </Button>
              </motion.div>
            </div>
          </div>
        </motion.div>

        {/* Personal Information Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-2xl border border-gray-200 bg-white/80 p-8 shadow-xl backdrop-blur-xl"
        >
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 shadow-lg">
              <User className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Thông tin cá nhân</h2>
              <p className="text-sm text-gray-600">Thông tin chi tiết về bác sĩ</p>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <FormField
              label="Họ và tên"
              value={form.fullName}
              disabled={!isEditing}
              editableHint="Có thể tự cập nhật"
              icon={User}
              onChange={(v) => setForm((f) => ({ ...f, fullName: v }))}
            />
            <FormField
              label="Chuyên khoa"
              value={form.specialization}
              disabled
              readOnlyHint="Chỉ admin chỉnh sửa"
              icon={Stethoscope}
            />
            <FormField
              label="Email"
              value={form.email}
              disabled
              readOnlyHint="Không đổi email tại đây"
              icon={Mail}
              type="email"
            />
            <FormField
              label="Số điện thoại"
              value={form.phone}
              disabled={!isEditing}
              editableHint="Có thể tự cập nhật"
              icon={Phone}
              type="tel"
              onChange={(v) => setForm((f) => ({ ...f, phone: v }))}
            />
            <FormField
              label="Địa chỉ"
              value={form.address}
              disabled={!isEditing}
              editableHint="Có thể tự cập nhật"
              icon={MapPin}
              onChange={(v) => setForm((f) => ({ ...f, address: v }))}
            />
            <FormField
              label="Trình độ"
              value={form.education}
              disabled={!isEditing}
              editableHint="Có thể tự cập nhật"
              icon={GraduationCap}
              onChange={(v) => setForm((f) => ({ ...f, education: v }))}
            />
          </div>
        </motion.div>

        {/* Professional Info Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-2xl border border-gray-200 bg-white/80 p-8 shadow-xl backdrop-blur-xl"
        >
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 shadow-lg">
              <Award className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Thông tin nghề nghiệp</h2>
              <p className="text-sm text-gray-600">Kinh nghiệm và chứng chỉ</p>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <FormField
              label="Chức danh"
              value={form.title}
              disabled={!isEditing}
              editableHint="Có thể tự cập nhật"
              icon={Briefcase}
              onChange={(v) => setForm((f) => ({ ...f, title: v }))}
            />
            <FormField
              label="Kinh nghiệm"
              value={form.experience}
              disabled
              readOnlyHint="Không chỉnh sửa tại đây"
              icon={Clock}
            />
            <FormField
              label="Ngôn ngữ"
              value={form.languages}
              disabled={!isEditing}
              editableHint="Có thể tự cập nhật"
              icon={Languages}
              onChange={(v) => setForm((f) => ({ ...f, languages: v }))}
            />
            <FormField
              label="Số chứng chỉ"
              value={form.license}
              disabled
              readOnlyHint="Chỉ admin cập nhật"
              icon={FileText}
            />
          </div>

          <div className="mt-6">
            <label className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-700">
              <FileText className="h-4 w-4" />
              Giới thiệu
            </label>
            <textarea
              disabled={!isEditing}
              value={form.bio}
              onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
              className="w-full resize-none rounded-xl border-2 border-gray-200 px-4 py-3 transition-all outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 disabled:bg-gray-50 disabled:text-gray-600"
              rows={4}
            />
          </div>
        </motion.div>

        {/* Schedule Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="rounded-2xl border border-gray-200 bg-white/80 p-8 shadow-xl backdrop-blur-xl"
        >
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 shadow-lg">
              <Calendar className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Lịch làm việc</h2>
              <p className="text-sm text-gray-600">Thời gian làm việc trong tuần</p>
            </div>
          </div>

          <div className="space-y-3">
            {/* Header */}
            <div className="grid grid-cols-3 gap-4 border-b-2 border-gray-200 pb-3">
              <div className="text-sm font-bold text-gray-500 uppercase">Ngày</div>
              <div className="text-sm font-bold text-gray-500 uppercase">Buổi sáng</div>
              <div className="text-sm font-bold text-gray-500 uppercase">Buổi chiều</div>
            </div>

            {/* Schedule Rows */}
            {scheduleRows.map((row) => (
              <ScheduleRow
                key={row.day}
                day={row.day}
                morning={row.morning}
                afternoon={row.afternoon}
                isOff={!row.working}
              />
            ))}
          </div>
        </motion.div>
      </div>
    </DashboardLayout>
  );
}

function FormField({
  label,
  value,
  disabled,
  icon: Icon,
  type = 'text',
  onChange,
  readOnlyHint,
  editableHint,
}: {
  label: string;
  value: string;
  disabled: boolean;
  icon: any;
  type?: string;
  onChange?: (value: string) => void;
  readOnlyHint?: string;
  editableHint?: string;
}) {
  const isReadOnly = Boolean(readOnlyHint);
  const finalDisabled = disabled || isReadOnly;

  return (
    <div>
      <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-700">
        <Icon className="h-4 w-4 text-gray-500" />
        {label}
        {isReadOnly ? (
          <span className="flex items-center gap-1 rounded-full border border-red-200 bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700">
            <Lock className="h-3 w-3" />
            {readOnlyHint}
          </span>
        ) : editableHint ? (
          <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
            {editableHint}
          </span>
        ) : null}
      </label>
      <input
        type={type}
        value={value}
        disabled={finalDisabled}
        onChange={(e) => onChange?.(e.target.value)}
        className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 transition-all outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 disabled:bg-gray-50 disabled:text-gray-600"
      />
    </div>
  );
}

function ScheduleRow({
  day,
  morning,
  afternoon,
  isOff = false,
}: {
  day: string;
  morning: string;
  afternoon: string;
  isOff?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      whileHover={{ scale: 1.01, backgroundColor: 'rgba(59, 130, 246, 0.05)' }}
      className="grid grid-cols-3 gap-4 rounded-xl border-b border-gray-100 px-4 py-4 transition-all"
    >
      <div className="flex items-center gap-2 font-semibold text-gray-900">
        <div className={`h-2 w-2 rounded-full ${isOff ? 'bg-red-400' : 'bg-green-400'}`} />
        {day}
      </div>
      <div
        className={`flex items-center gap-2 ${
          morning === 'Nghỉ' ? 'font-medium text-red-600' : 'text-gray-700'
        }`}
      >
        {morning !== 'Nghỉ' && <Clock className="h-4 w-4 text-gray-400" />}
        {morning}
      </div>
      <div
        className={`flex items-center gap-2 ${
          afternoon === 'Nghỉ' ? 'font-medium text-red-600' : 'text-gray-700'
        }`}
      >
        {afternoon !== 'Nghỉ' && <Clock className="h-4 w-4 text-gray-400" />}
        {afternoon}
      </div>
    </motion.div>
  );
}
