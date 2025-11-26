'use client';

import { useState } from 'react';
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
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DashboardLayout } from '@/components/layout';
import { motion, AnimatePresence } from 'framer-motion';

export default function DoctorProfilePage() {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setIsSaving(false);
    setIsEditing(false);
  };

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
                className="flex h-24 w-24 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-xl shadow-2xl"
              >
                <Stethoscope className="h-12 w-12 text-white" />
              </motion.div>
              <div>
                <h1 className="mb-2 text-4xl font-bold">Hồ sơ & Lịch làm việc</h1>
                <p className="text-blue-100">Quản lý thông tin cá nhân và lịch làm việc của bạn</p>
              </div>
            </div>
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
        </motion.div>

        {/* Personal Information Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-2xl border border-gray-200 bg-white/80 backdrop-blur-xl p-8 shadow-xl"
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
              value="BS. Nguyễn Văn A"
              disabled={!isEditing}
              icon={User}
            />
            <FormField
              label="Chuyên khoa"
              value="Tim mạch"
              disabled={!isEditing}
              icon={Stethoscope}
            />
            <FormField
              label="Email"
              value="doctor@hospital.com"
              disabled={!isEditing}
              icon={Mail}
              type="email"
            />
            <FormField
              label="Số điện thoại"
              value="0912345678"
              disabled={!isEditing}
              icon={Phone}
              type="tel"
            />
            <FormField
              label="Địa chỉ"
              value="123 Đường ABC, Quận 1, TP.HCM"
              disabled={!isEditing}
              icon={MapPin}
            />
            <FormField
              label="Trình độ"
              value="Tiến sĩ Y Khoa"
              disabled={!isEditing}
              icon={GraduationCap}
            />
          </div>
        </motion.div>

        {/* Professional Info Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-2xl border border-gray-200 bg-white/80 backdrop-blur-xl p-8 shadow-xl"
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
              value="Bác sĩ chuyên khoa II"
              disabled={!isEditing}
              icon={Briefcase}
            />
            <FormField
              label="Kinh nghiệm"
              value="15 năm"
              disabled={!isEditing}
              icon={Clock}
            />
            <FormField
              label="Ngôn ngữ"
              value="Tiếng Việt, English"
              disabled={!isEditing}
              icon={Languages}
            />
            <FormField
              label="Số chứng chỉ"
              value="BS-12345"
              disabled={!isEditing}
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
              defaultValue="Bác sĩ chuyên khoa Tim mạch với hơn 15 năm kinh nghiệm trong điều trị các bệnh lý về tim mạch. Tốt nghiệp Tiến sĩ Y khoa tại Đại học Y Hà Nội."
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
          className="rounded-2xl border border-gray-200 bg-white/80 backdrop-blur-xl p-8 shadow-xl"
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
              <div className="text-sm font-bold uppercase text-gray-500">Ngày</div>
              <div className="text-sm font-bold uppercase text-gray-500">Buổi sáng</div>
              <div className="text-sm font-bold uppercase text-gray-500">Buổi chiều</div>
            </div>

            {/* Schedule Rows */}
            <ScheduleRow day="Thứ 2" morning="8:00 - 12:00" afternoon="13:00 - 17:00" />
            <ScheduleRow day="Thứ 3" morning="8:00 - 12:00" afternoon="13:00 - 17:00" />
            <ScheduleRow day="Thứ 4" morning="8:00 - 12:00" afternoon="13:00 - 17:00" />
            <ScheduleRow day="Thứ 5" morning="8:00 - 12:00" afternoon="13:00 - 17:00" />
            <ScheduleRow day="Thứ 6" morning="8:00 - 12:00" afternoon="13:00 - 17:00" />
            <ScheduleRow day="Thứ 7" morning="8:00 - 12:00" afternoon="Nghỉ" isOff={true} />
            <ScheduleRow day="Chủ nhật" morning="Nghỉ" afternoon="Nghỉ" isOff={true} />
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
}: {
  label: string;
  value: string;
  disabled: boolean;
  icon: any;
  type?: string;
}) {
  return (
    <div>
      <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-700">
        <Icon className="h-4 w-4 text-gray-500" />
        {label}
      </label>
      <input
        type={type}
        defaultValue={value}
        disabled={disabled}
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
        <div
          className={`h-2 w-2 rounded-full ${isOff ? 'bg-red-400' : 'bg-green-400'}`}
        />
        {day}
      </div>
      <div
        className={`flex items-center gap-2 ${morning === 'Nghỉ' ? 'text-red-600 font-medium' : 'text-gray-700'
          }`}
      >
        {morning !== 'Nghỉ' && <Clock className="h-4 w-4 text-gray-400" />}
        {morning}
      </div>
      <div
        className={`flex items-center gap-2 ${afternoon === 'Nghỉ' ? 'text-red-600 font-medium' : 'text-gray-700'
          }`}
      >
        {afternoon !== 'Nghỉ' && <Clock className="h-4 w-4 text-gray-400" />}
        {afternoon}
      </div>
    </motion.div>
  );
}
