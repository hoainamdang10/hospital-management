'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import {
  Calendar as CalendarIcon,
  Loader2,
  User,
  Stethoscope,
  Clock,
  Search,
  Check,
  ArrowRight,
  ArrowLeft,
  X,
  Phone,
  Mail,
  Hash,
  Cake,
  Building2,
  FileText,
  ClipboardList,
  Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { DashboardLayout } from '@/components/layout';
import { appointmentsService } from '@/lib/api/appointments.service';
import { doctorsService } from '@/lib/api/doctors.service';
import { patientsService } from '@/lib/api/patients.service';
import { departmentsService } from '@/lib/api/departments.service';

interface Doctor {
  id: string;
  userId: string;
  fullName: string;
  specialization: string;
  departmentId: string;
}

interface Patient {
  id: string;
  fullName: string;
  phone: string;
  email: string;
  dateOfBirth: string;
  gender: string;
  patientId: string;
}

interface Department {
  id: string;
  code: string;
  name: string;
}

const steps = [
  {
    id: 1,
    title: 'Chọn bệnh nhân',
    description: 'Tìm và xác nhận hồ sơ bệnh nhân',
    icon: User,
  },
  {
    id: 2,
    title: 'Chọn bác sĩ',
    description: 'Lọc theo chuyên khoa, chọn bác sĩ phù hợp',
    icon: Stethoscope,
  },
  {
    id: 3,
    title: 'Thời gian & xác nhận',
    description: 'Chọn khung giờ, lý do và gửi lịch',
    icon: Clock,
  },
];

// Healthcare-themed avatar gradients
const avatarGradients = [
  'from-cyan-500 to-teal-600',
  'from-teal-500 to-emerald-600',
  'from-sky-500 to-cyan-600',
  'from-emerald-500 to-cyan-600',
];

export default function AddAppointmentPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  // Data states
  const [departments, setDepartments] = useState<Department[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);

  // Search states
  const [patientSearch, setPatientSearch] = useState('');
  const [isSearchingPatient, setIsSearchingPatient] = useState(false);
  const [showPatientDropdown, setShowPatientDropdown] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const patientSearchTimeout = useRef<NodeJS.Timeout | null>(null);
  const nameCollator = useMemo(
    () =>
      new Intl.Collator('vi', {
        sensitivity: 'base',
        usage: 'sort',
      }),
    []
  );

  // Form states
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [selectedDoctor, setSelectedDoctor] = useState('');
  const [showDepartmentDropdown, setShowDepartmentDropdown] = useState(false);
  const [showDoctorDropdown, setShowDoctorDropdown] = useState(false);
  const [date, setDate] = useState<Date>();
  const [time, setTime] = useState('');
  const [type, setType] = useState('CONSULTATION');
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');
  const [currentStep, setCurrentStep] = useState(0);

  // Fetch initial data
  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const res = await departmentsService.getDepartments();
        if (res && res.length > 0) {
          setDepartments(
            res.map((d: any) => ({
              id: d.id,
              code: d.code,
              name: d.nameVi || d.nameEn || d.name,
            }))
          );
        }
      } catch (error) {
        console.error('Failed to fetch departments:', error);
        toast.error('Không thể tải danh sách khoa');
      }
    };
    fetchDepartments();
  }, []);

  // Fetch doctors when department changes
  useEffect(() => {
    if (!selectedDepartment) {
      setDoctors([]);
      return;
    }

    const fetchDoctors = async () => {
      try {
        const res = await doctorsService.getDoctors({ department: selectedDepartment });
        if (res && res.data) {
          setDoctors(
            res.data.map((d: any) => ({
              id: d.id,
              userId: d.userId,
              fullName: d.fullName,
              specialization: d.specialization,
              departmentId: d.departmentId,
            }))
          );
        }
      } catch (error) {
        console.error('Failed to fetch doctors:', error);
      }
    };
    fetchDoctors();
  }, [selectedDepartment]);

  const fetchPatients = async (keyword: string, options?: { allowEmpty?: boolean }) => {
    const sanitized = keyword.trim();
    if (!sanitized && !options?.allowEmpty) {
      return;
    }

    setIsSearchingPatient(true);
    try {
      const res = await patientsService.getPatients({
        search: sanitized || undefined,
        limit: 10,
      });
      if (res && res.data) {
        const normalized = [...res.data]
          .map((p: any) => ({
            id: p.id,
            patientId: p.patientId,
            fullName: p.fullName,
            phone: p.phoneNumber,
            email: p.email,
            dateOfBirth: p.dateOfBirth,
            gender: p.gender,
          }))
          .sort((a, b) => nameCollator.compare(a.fullName || '', b.fullName || ''));

        setPatients(normalized);
        setShowPatientDropdown(true);
      } else {
        setPatients([]);
      }
    } catch (error) {
      console.error('Failed to search patients:', error);
      toast.error('Lỗi tìm kiếm bệnh nhân');
      setPatients([]);
    } finally {
      setIsSearchingPatient(false);
    }
  };

  // Search patients
  const handleSearchPatient = async () => {
    if (patientSearchTimeout.current) {
      clearTimeout(patientSearchTimeout.current);
    }
    await fetchPatients(patientSearch);
  };

  useEffect(() => {
    if (!patientSearch.trim()) {
      if (patientSearchTimeout.current) {
        clearTimeout(patientSearchTimeout.current);
      }
      return;
    }

    setShowPatientDropdown(true);
    if (patientSearchTimeout.current) {
      clearTimeout(patientSearchTimeout.current);
    }

    patientSearchTimeout.current = setTimeout(() => {
      fetchPatients(patientSearch);
    }, 300);

    return () => {
      if (patientSearchTimeout.current) {
        clearTimeout(patientSearchTimeout.current);
      }
    };
  }, [patientSearch]);

  const handleSelectPatient = (patient: Patient) => {
    setSelectedPatient(patient);
    setPatients([]);
    setPatientSearch('');
    setShowPatientDropdown(false);
    setTimeout(() => setCurrentStep(1), 200);
  };

  const handlePatientSearchChange = (value: string) => {
    setPatientSearch(value);
    if (!value.trim()) {
      setPatients([]);
      setShowPatientDropdown(false);
    }
  };

  const handlePatientInputFocus = () => {
    setShowPatientDropdown(true);
    if (!patientSearch.trim() && patients.length === 0) {
      fetchPatients('', { allowEmpty: true });
    }
  };

  const handleSubmit = async () => {
    if (!selectedPatient || !date) return;

    setIsLoading(true);
    try {
      const formattedDate = format(date, 'yyyy-MM-dd');
      const startTime = `${formattedDate}T${time}:00`;

      const [hours, minutes] = time.split(':').map(Number);
      const endDateObj = new Date(date);
      endDateObj.setHours(hours, minutes + 30);
      const endTime = format(endDateObj, "yyyy-MM-dd'T'HH:mm:ss");

      const payload = {
        patient: {
          patientId: selectedPatient.patientId,
          fullName: selectedPatient.fullName,
          phoneNumber: selectedPatient.phone,
          email: selectedPatient.email,
          dateOfBirth: selectedPatient.dateOfBirth,
          gender: selectedPatient.gender,
        },
        provider: {
          providerId: selectedDoctor,
          providerName: doctors.find((d) => d.id === selectedDoctor)?.fullName || '',
        },
        departmentCode: selectedDepartment,
        appointment: {
          startTime: startTime,
          endTime: endTime,
          appointmentType: type,
          reason: reason,
          priority: 'NORMAL',
          notes: notes,
        },
      };

      const res = await appointmentsService.createAppointment(payload);

      if (res.success) {
        toast.success('Tạo lịch hẹn thành công');
        router.push('/admin/appointments');
      } else {
        throw new Error(res.message || 'Có lỗi xảy ra');
      }
    } catch (error: any) {
      console.error('Create appointment error:', error);
      toast.error(error.message || 'Không thể tạo lịch hẹn');
    } finally {
      setIsLoading(false);
    }
  };

  const canContinueStep = (stepIndex: number) => {
    if (stepIndex === 0) return !!selectedPatient;
    if (stepIndex === 1) return !!selectedDepartment && !!selectedDoctor;
    if (stepIndex === 2) {
      return !!selectedPatient && !!selectedDoctor && !!selectedDepartment && !!date && !!time;
    }
    return false;
  };

  const goNext = () => {
    if (!canContinueStep(currentStep)) {
      toast.error('Vui lòng hoàn thành đầy đủ thông tin trước khi tiếp tục');
      return;
    }
    if (currentStep < steps.length - 1) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const goPrev = () => {
    if (currentStep === 0) {
      router.back();
      return;
    }
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  };

  const getAvatarGradient = (index: number) => {
    return avatarGradients[index % avatarGradients.length];
  };

  // ============================================================================
  // RENDER COMPONENTS
  // ============================================================================

  const renderStepper = () => (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1 }}
      className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white/90 p-6 shadow-sm backdrop-blur-sm"
    >
      {/* Background decoration */}
      <div className="absolute top-0 right-0 h-40 w-40 translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-br from-cyan-500/10 to-teal-500/10 blur-3xl" />

      <div className="relative flex items-center justify-between">
        {steps.map((step, index) => {
          const StepIcon = step.icon;
          const isCompleted = index < currentStep;
          const isCurrent = index === currentStep;
          const isUpcoming = index > currentStep;

          return (
            <div key={step.id} className="flex flex-1 items-center">
              {/* Step item */}
              <motion.div
                initial={false}
                animate={{
                  scale: isCurrent ? 1.02 : 1,
                }}
                transition={{ duration: 0.2 }}
                className={cn(
                  'relative flex flex-col items-center text-center',
                  'cursor-pointer transition-all duration-300',
                  isCompleted && 'opacity-80 hover:opacity-100'
                )}
                onClick={() => {
                  if (isCompleted) setCurrentStep(index);
                }}
              >
                {/* Icon container */}
                <motion.div
                  initial={false}
                  animate={{
                    backgroundColor: isCompleted
                      ? 'rgb(20 184 166)' // teal-500
                      : isCurrent
                        ? 'rgb(8 145 178)' // cyan-600
                        : 'rgb(241 245 249)', // slate-100
                    boxShadow: isCurrent
                      ? '0 8px 24px -4px rgba(8, 145, 178, 0.4)'
                      : isCompleted
                        ? '0 4px 12px -2px rgba(20, 184, 166, 0.3)'
                        : 'none',
                  }}
                  className={cn(
                    'relative flex h-14 w-14 items-center justify-center rounded-2xl transition-all duration-300',
                    isCurrent && 'ring-4 ring-cyan-500/20'
                  )}
                >
                  {isCompleted ? (
                    <motion.div
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ type: 'spring', bounce: 0.5 }}
                    >
                      <Check className="h-6 w-6 text-white" strokeWidth={2.5} />
                    </motion.div>
                  ) : (
                    <StepIcon
                      className={cn(
                        'h-6 w-6 transition-colors duration-300',
                        isCurrent ? 'text-white' : 'text-slate-400'
                      )}
                    />
                  )}

                  {/* Pulse effect for current step */}
                  {isCurrent && (
                    <motion.div
                      className="absolute inset-0 rounded-2xl bg-cyan-400/30"
                      animate={{ scale: [1, 1.15, 1], opacity: [0.5, 0, 0.5] }}
                      transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                    />
                  )}
                </motion.div>

                {/* Step text */}
                <div className="mt-3 space-y-0.5">
                  <motion.p
                    initial={false}
                    animate={{
                      color: isCurrent
                        ? 'rgb(8 145 178)' // cyan-600
                        : isCompleted
                          ? 'rgb(20 184 166)' // teal-500
                          : 'rgb(100 116 139)', // slate-500
                    }}
                    className="text-xs font-semibold tracking-wide uppercase"
                  >
                    Bước {index + 1}
                  </motion.p>
                  <h3
                    className={cn(
                      'text-sm font-bold transition-colors duration-300',
                      isCurrent ? 'text-slate-900' : 'text-slate-600'
                    )}
                  >
                    {step.title}
                  </h3>
                  <p className="max-w-[140px] text-xs text-slate-400">{step.description}</p>
                </div>
              </motion.div>

              {/* Connector line */}
              {index < steps.length - 1 && (
                <div className="relative mx-4 hidden flex-1 sm:block">
                  <div className="h-0.5 w-full rounded-full bg-slate-200" />
                  <motion.div
                    initial={{ width: '0%' }}
                    animate={{ width: isCompleted ? '100%' : '0%' }}
                    transition={{ duration: 0.4, ease: 'easeOut' }}
                    className="absolute inset-y-0 left-0 h-0.5 rounded-full bg-gradient-to-r from-teal-500 to-cyan-500"
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </motion.div>
  );

  const renderStepActions = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.3 }}
      className="sticky bottom-0 z-[100] mt-6 flex items-center justify-between rounded-xl border border-slate-200/50 bg-white/95 p-4 shadow-lg backdrop-blur-sm"
    >
      <Button
        variant="outline"
        onClick={goPrev}
        disabled={isLoading}
        className="group relative overflow-hidden rounded-xl border-slate-200 px-6 py-2.5 text-slate-600 transition-all duration-300 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900"
      >
        <ArrowLeft className="mr-2 h-4 w-4 transition-transform duration-300 group-hover:-translate-x-1" />
        {currentStep === 0 ? 'Hủy bỏ' : 'Quay lại'}
      </Button>

      {currentStep < steps.length - 1 ? (
        <Button
          onClick={goNext}
          disabled={!canContinueStep(currentStep)}
          className="group relative overflow-hidden rounded-xl bg-gradient-to-r from-cyan-500 to-teal-600 px-6 py-2.5 font-semibold text-white shadow-lg shadow-cyan-500/25 transition-all duration-300 hover:scale-[1.02] hover:shadow-cyan-500/40 disabled:opacity-50 disabled:hover:scale-100"
        >
          <span className="absolute inset-0 translate-x-[-100%] bg-gradient-to-r from-white/0 via-white/20 to-white/0 transition-transform duration-500 group-hover:translate-x-[100%]" />
          <span className="relative z-10 flex items-center">
            Tiếp tục
            <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
          </span>
        </Button>
      ) : (
        <Button
          onClick={handleSubmit}
          disabled={isLoading || !canContinueStep(currentStep)}
          className="group relative min-w-[180px] overflow-hidden rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 px-6 py-2.5 font-semibold text-white shadow-lg shadow-emerald-500/25 transition-all duration-300 hover:scale-[1.02] hover:shadow-emerald-500/40 disabled:opacity-50 disabled:hover:scale-100"
        >
          <span className="absolute inset-0 translate-x-[-100%] bg-gradient-to-r from-white/0 via-white/20 to-white/0 transition-transform duration-500 group-hover:translate-x-[100%]" />
          {isLoading ? (
            <span className="relative z-10 flex items-center">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Đang xử lý...
            </span>
          ) : (
            <span className="relative z-10 flex items-center">
              <Sparkles className="mr-2 h-4 w-4" />
              Tạo lịch hẹn
            </span>
          )}
        </Button>
      )}
    </motion.div>
  );

  const renderPatientStep = () => (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <div className="relative rounded-2xl border border-slate-200/80 bg-white/90 p-6 shadow-sm backdrop-blur-sm">
        {/* Background decoration - moved inside relative container */}
        <div className="pointer-events-none absolute bottom-0 left-0 h-32 w-32 -translate-x-1/2 translate-y-1/2 rounded-full bg-gradient-to-br from-cyan-500/10 to-teal-500/10 blur-2xl" />

        <div className="relative">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-teal-600 shadow-lg shadow-cyan-500/25">
              <User className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Thông tin bệnh nhân</h2>
              <p className="text-sm text-slate-500">Tìm kiếm và chọn hồ sơ bệnh nhân</p>
            </div>
          </div>

          <div className="space-y-4">
            {/* Search box */}
            <div>
              <div className="flex gap-3">
                <div className="relative flex-1">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                    <Search className="h-4 w-4 text-slate-400" />
                  </div>
                  <Input
                    placeholder="Tìm theo tên, SĐT hoặc mã bệnh nhân..."
                    value={patientSearch}
                    onChange={(e) => handlePatientSearchChange(e.target.value)}
                    onFocus={handlePatientInputFocus}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearchPatient()}
                    className="h-12 rounded-xl border-slate-200 bg-slate-50 pl-11 text-sm transition-all focus:border-cyan-500 focus:bg-white focus:ring-2 focus:ring-cyan-500/20"
                  />
                  {patientSearch && (
                    <button
                      onClick={() => {
                        setPatientSearch('');
                        setPatients([]);
                        setShowPatientDropdown(false);
                      }}
                      className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
                <Button
                  onClick={handleSearchPatient}
                  disabled={isSearchingPatient || !patientSearch.trim()}
                  className="h-12 min-w-[120px] rounded-xl bg-gradient-to-r from-cyan-500 to-teal-600 px-5 font-medium shadow-lg shadow-cyan-500/25 transition-all hover:scale-[1.02] hover:shadow-cyan-500/40 disabled:opacity-50"
                >
                  {isSearchingPatient ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Search className="mr-2 h-4 w-4" />
                      Tìm kiếm
                    </>
                  )}
                </Button>
              </div>

              {/* Patient dropdown - now inline, pushes content down */}
              <AnimatePresence>
                {showPatientDropdown && !selectedPatient && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="mt-3 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg"
                    onMouseDown={(e) => e.preventDefault()}
                  >
                    <div className="max-h-72 overflow-y-auto">
                      {isSearchingPatient && patients.length === 0 ? (
                        <div className="flex items-center justify-center gap-2 p-4 text-sm text-slate-500">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Đang tìm kiếm...
                        </div>
                      ) : patients.length > 0 ? (
                        patients.map((patient, index) => (
                          <button
                            key={`${patient.id || patient.patientId || index}`}
                            className="group flex w-full items-center gap-4 border-b border-slate-100 p-4 text-left transition-all last:border-b-0 hover:bg-gradient-to-r hover:from-cyan-50 hover:to-teal-50"
                            onClick={() => handleSelectPatient(patient)}
                          >
                            <div
                              className={cn(
                                'flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br font-semibold text-white shadow-md transition-transform group-hover:scale-105',
                                getAvatarGradient(index)
                              )}
                            >
                              {patient.fullName?.charAt(0)?.toUpperCase() || 'P'}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="font-semibold text-slate-900 transition-colors group-hover:text-cyan-700">
                                {patient.fullName}
                              </div>
                              <div className="mt-0.5 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                                <span className="flex items-center gap-1">
                                  <Hash className="h-3 w-3" />
                                  {patient.patientId}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Phone className="h-3 w-3" />
                                  {patient.phone}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Cake className="h-3 w-3" />
                                  {format(new Date(patient.dateOfBirth), 'dd/MM/yyyy')}
                                </span>
                              </div>
                            </div>
                            <ArrowRight className="h-4 w-4 text-slate-300 transition-all group-hover:translate-x-1 group-hover:text-cyan-500" />
                          </button>
                        ))
                      ) : (
                        <div className="p-4 text-center text-sm text-slate-500">
                          Không tìm thấy bệnh nhân phù hợp
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Selected patient card */}
            <AnimatePresence>
              {selectedPatient && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 10 }}
                  transition={{ type: 'spring', bounce: 0.3 }}
                  className="relative overflow-hidden rounded-2xl border-2 border-cyan-200 bg-gradient-to-br from-cyan-50 via-teal-50/50 to-white p-5"
                >
                  {/* Success indicator */}
                  <div className="absolute -top-6 -right-6 h-24 w-24 rounded-full bg-gradient-to-br from-cyan-500/20 to-teal-500/20 blur-xl" />

                  <div className="relative flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      {/* Avatar */}
                      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500 to-teal-600 text-xl font-bold text-white shadow-lg shadow-cyan-500/30">
                        {selectedPatient.fullName?.charAt(0)?.toUpperCase() || 'P'}
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-xl font-bold text-slate-900">
                            {selectedPatient.fullName}
                          </h3>
                          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 shadow-md shadow-emerald-500/30">
                            <Check className="h-3 w-3 text-white" strokeWidth={3} />
                          </div>
                        </div>

                        <div className="mt-3 grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
                          <div className="flex items-center gap-2 text-slate-600">
                            <Hash className="h-4 w-4 text-cyan-500" />
                            <span className="text-slate-500">Mã BN:</span>
                            <span className="font-medium text-slate-900">
                              {selectedPatient.patientId}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-slate-600">
                            <Phone className="h-4 w-4 text-cyan-500" />
                            <span className="text-slate-500">SĐT:</span>
                            <span className="font-medium text-slate-900">
                              {selectedPatient.phone}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-slate-600">
                            <Mail className="h-4 w-4 text-cyan-500" />
                            <span className="text-slate-500">Email:</span>
                            <span className="max-w-[150px] truncate font-medium text-slate-900">
                              {selectedPatient.email}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-slate-600">
                            <Cake className="h-4 w-4 text-cyan-500" />
                            <span className="text-slate-500">Ngày sinh:</span>
                            <span className="font-medium text-slate-900">
                              {format(new Date(selectedPatient.dateOfBirth), 'dd/MM/yyyy')}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedPatient(null);
                        setCurrentStep(0);
                      }}
                      className="rounded-lg text-rose-500 hover:bg-rose-50 hover:text-rose-600"
                    >
                      <X className="mr-1 h-4 w-4" />
                      Thay đổi
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Empty state */}
            {!selectedPatient && patients.length === 0 && patientSearch && !isSearchingPatient && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center"
              >
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
                  <User className="h-6 w-6 text-slate-400" />
                </div>
                <p className="mt-3 text-sm text-slate-600">Không tìm thấy bệnh nhân.</p>
                <Button
                  variant="link"
                  className="mt-1 h-auto p-0 text-cyan-600 hover:text-cyan-700"
                  onClick={() => router.push('/admin/patients/add')}
                >
                  Thêm bệnh nhân mới?
                </Button>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );

  const renderDoctorStep = () => (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white/90 p-6 shadow-sm backdrop-blur-sm">
        {/* Background decoration */}
        <div className="absolute top-0 right-0 h-32 w-32 translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-br from-teal-500/10 to-emerald-500/10 blur-2xl" />

        <div className="relative">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 shadow-lg shadow-teal-500/25">
              <Stethoscope className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Thông tin bác sĩ</h2>
              <p className="text-sm text-slate-500">Chọn chuyên khoa và bác sĩ phù hợp</p>
            </div>
          </div>

          <div className="space-y-5">
            {/* Department select - Custom inline dropdown */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                <Building2 className="h-4 w-4 text-cyan-500" />
                Chuyên khoa
              </Label>
              <div>
                <button
                  type="button"
                  onClick={() => setShowDepartmentDropdown(!showDepartmentDropdown)}
                  className={cn(
                    'flex h-12 w-full items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 text-left text-sm transition-all',
                    'hover:border-cyan-300 hover:bg-white',
                    showDepartmentDropdown && 'border-cyan-500 bg-white ring-2 ring-cyan-500/20'
                  )}
                >
                  <span className={selectedDepartment ? 'text-slate-900' : 'text-slate-400'}>
                    {selectedDepartment
                      ? departments.find((d) => d.code === selectedDepartment)?.name
                      : 'Chọn chuyên khoa'}
                  </span>
                  <svg
                    className={cn(
                      'h-4 w-4 text-slate-400 transition-transform duration-200',
                      showDepartmentDropdown && 'rotate-180'
                    )}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                <AnimatePresence>
                  {showDepartmentDropdown && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="mt-2 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg"
                    >
                      <div className="max-h-64 overflow-y-auto">
                        {departments.map((dept, index) => (
                          <button
                            key={dept.id}
                            type="button"
                            onClick={() => {
                              setSelectedDepartment(dept.code);
                              setSelectedDoctor('');
                              setShowDepartmentDropdown(false);
                            }}
                            className={cn(
                              'group flex w-full items-center gap-3 border-b border-slate-100 p-3 text-left transition-all last:border-b-0',
                              'hover:bg-gradient-to-r hover:from-cyan-50 hover:to-teal-50',
                              selectedDepartment === dept.code && 'bg-cyan-50'
                            )}
                          >
                            <div
                              className={cn(
                                'flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br font-semibold text-white shadow-sm',
                                getAvatarGradient(index)
                              )}
                            >
                              {dept.name?.charAt(0)?.toUpperCase()}
                            </div>
                            <span className="font-medium text-slate-700 group-hover:text-cyan-700">
                              {dept.name}
                            </span>
                            {selectedDepartment === dept.code && (
                              <Check className="ml-auto h-4 w-4 text-cyan-600" />
                            )}
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Doctor select - Custom inline dropdown */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                <Stethoscope className="h-4 w-4 text-teal-500" />
                Bác sĩ
              </Label>
              <div>
                <button
                  type="button"
                  onClick={() => selectedDepartment && setShowDoctorDropdown(!showDoctorDropdown)}
                  disabled={!selectedDepartment}
                  className={cn(
                    'flex h-12 w-full items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 text-left text-sm transition-all',
                    selectedDepartment && 'hover:border-teal-300 hover:bg-white',
                    !selectedDepartment && 'cursor-not-allowed opacity-60',
                    showDoctorDropdown && 'border-teal-500 bg-white ring-2 ring-teal-500/20'
                  )}
                >
                  <span className={selectedDoctor ? 'text-slate-900' : 'text-slate-400'}>
                    {selectedDoctor
                      ? doctors.find((d) => d.id === selectedDoctor)?.fullName
                      : selectedDepartment
                        ? 'Chọn bác sĩ'
                        : 'Vui lòng chọn chuyên khoa trước'}
                  </span>
                  <svg
                    className={cn(
                      'h-4 w-4 text-slate-400 transition-transform duration-200',
                      showDoctorDropdown && 'rotate-180'
                    )}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                <AnimatePresence>
                  {showDoctorDropdown && selectedDepartment && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="mt-2 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg"
                    >
                      <div className="max-h-64 overflow-y-auto">
                        {doctors.length > 0 ? (
                          doctors.map((doc, index) => (
                            <button
                              key={doc.id}
                              type="button"
                              onClick={() => {
                                setSelectedDoctor(doc.id);
                                setShowDoctorDropdown(false);
                              }}
                              className={cn(
                                'group flex w-full items-center gap-3 border-b border-slate-100 p-3 text-left transition-all last:border-b-0',
                                'hover:bg-gradient-to-r hover:from-teal-50 hover:to-emerald-50',
                                selectedDoctor === doc.id && 'bg-teal-50'
                              )}
                            >
                              <div
                                className={cn(
                                  'flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-teal-500 to-emerald-600 font-semibold text-white shadow-sm'
                                )}
                              >
                                {doc.fullName?.charAt(0)?.toUpperCase()}
                              </div>
                              <div className="flex-1">
                                <div className="font-medium text-slate-700 group-hover:text-teal-700">
                                  {doc.fullName}
                                </div>
                                <div className="text-xs text-slate-500">{doc.specialization}</div>
                              </div>
                              {selectedDoctor === doc.id && (
                                <Check className="h-4 w-4 text-teal-600" />
                              )}
                            </button>
                          ))
                        ) : (
                          <div className="p-4 text-center text-sm text-slate-500">
                            Không có bác sĩ nào trong khoa này
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Doctor info card */}
            <AnimatePresence>
              {selectedDoctor && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="rounded-xl border border-teal-200 bg-gradient-to-br from-teal-50 via-emerald-50/50 to-white p-4"
                >
                  <div className="mb-3 flex items-center gap-2">
                    <Clock className="h-4 w-4 text-teal-600" />
                    <h3 className="font-semibold text-teal-800">Thông tin lịch làm việc</h3>
                  </div>
                  <div className="space-y-2 text-sm text-slate-600">
                    <p className="flex items-center gap-2">
                      <span className="inline-flex h-1.5 w-1.5 rounded-full bg-teal-500" />
                      Bác sĩ làm việc từ Thứ 2 - Thứ 6
                    </p>
                    <p className="flex items-center gap-2">
                      <span className="inline-flex h-1.5 w-1.5 rounded-full bg-teal-500" />
                      Giờ làm việc: 08:00 - 17:00
                    </p>
                    <p className="flex items-center gap-2">
                      <span className="inline-flex h-1.5 w-1.5 rounded-full bg-teal-500" />
                      Thời lượng khám trung bình: 30 phút
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </motion.div>
  );

  const renderScheduleStep = () => (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* Time & Reason Card */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white/90 p-6 shadow-sm backdrop-blur-sm">
        <div className="absolute right-0 bottom-0 h-32 w-32 translate-x-1/2 translate-y-1/2 rounded-full bg-gradient-to-br from-emerald-500/10 to-cyan-500/10 blur-2xl" />

        <div className="relative">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-cyan-600 shadow-lg shadow-emerald-500/25">
              <Clock className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Thời gian & Lý do</h2>
              <p className="text-sm text-slate-500">Chọn thời gian và nhập lý do khám</p>
            </div>
          </div>

          <div className="space-y-5">
            <div className="grid gap-5 sm:grid-cols-2">
              {/* Date picker */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                  <CalendarIcon className="h-4 w-4 text-cyan-500" />
                  Ngày khám
                </Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={'outline'}
                      className={cn(
                        'h-12 w-full justify-start rounded-xl border-slate-200 bg-slate-50 text-left font-normal transition-all hover:bg-slate-100',
                        !date && 'text-slate-500'
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4 text-cyan-500" />
                      {date ? (
                        format(date, 'EEEE, dd/MM/yyyy', { locale: vi })
                      ) : (
                        <span>Chọn ngày</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto rounded-xl border-slate-200 p-0 shadow-xl">
                    <Calendar
                      mode="single"
                      selected={date}
                      onSelect={setDate}
                      initialFocus
                      disabled={(calendarDate) =>
                        calendarDate < new Date(new Date().setHours(0, 0, 0, 0))
                      }
                      className="rounded-xl"
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Time select */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                  <Clock className="h-4 w-4 text-teal-500" />
                  Giờ khám
                </Label>
                <Select value={time} onValueChange={setTime}>
                  <SelectTrigger className="h-12 rounded-xl border-slate-200 bg-slate-50 transition-all focus:border-cyan-500 focus:bg-white focus:ring-2 focus:ring-cyan-500/20">
                    <SelectValue placeholder="Chọn giờ" />
                  </SelectTrigger>
                  <SelectContent className="max-h-60 rounded-xl border-slate-200 shadow-xl">
                    {Array.from({ length: 20 }).map((_, i) => {
                      const hour = Math.floor(i / 2) + 8;
                      const minute = i % 2 === 0 ? '00' : '30';
                      const timeStr = `${hour.toString().padStart(2, '0')}:${minute}`;
                      if (hour > 17) return null;
                      return (
                        <SelectItem
                          key={timeStr}
                          value={timeStr}
                          className="rounded-lg transition-colors focus:bg-cyan-50 focus:text-cyan-900"
                        >
                          {timeStr}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Appointment type */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                <ClipboardList className="h-4 w-4 text-emerald-500" />
                Loại lịch hẹn
              </Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger className="h-12 rounded-xl border-slate-200 bg-slate-50 transition-all focus:border-cyan-500 focus:bg-white focus:ring-2 focus:ring-cyan-500/20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-slate-200 shadow-xl">
                  <SelectItem value="CONSULTATION">Khám bệnh</SelectItem>
                  <SelectItem value="FOLLOW_UP">Tái khám</SelectItem>
                  <SelectItem value="EMERGENCY">Cấp cứu</SelectItem>
                  <SelectItem value="CHECKUP">Khám sức khỏe</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Reason */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                <FileText className="h-4 w-4 text-cyan-500" />
                Lý do khám
              </Label>
              <Textarea
                placeholder="Mô tả triệu chứng hoặc lý do khám..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="min-h-[100px] resize-none rounded-xl border-slate-200 bg-slate-50 transition-all focus:border-cyan-500 focus:bg-white focus:ring-2 focus:ring-cyan-500/20"
              />
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                <FileText className="h-4 w-4 text-slate-400" />
                Ghi chú (Tùy chọn)
              </Label>
              <Textarea
                placeholder="Ghi chú thêm cho bác sĩ..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="min-h-[80px] resize-none rounded-xl border-slate-200 bg-slate-50 transition-all focus:border-cyan-500 focus:bg-white focus:ring-2 focus:ring-cyan-500/20"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Summary Card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-gradient-to-br from-slate-50 via-white to-slate-50 p-6 shadow-sm"
      >
        <div className="absolute top-0 left-0 h-24 w-24 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-br from-cyan-500/10 to-teal-500/10 blur-2xl" />

        <div className="relative">
          <div className="mb-5 flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-cyan-600" />
            <h2 className="text-lg font-bold text-slate-900">Tóm tắt lịch hẹn</h2>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-lg bg-white p-3 shadow-sm">
              <span className="flex items-center gap-2 text-sm text-slate-500">
                <User className="h-4 w-4" />
                Bệnh nhân
              </span>
              <span className="font-semibold text-slate-900">
                {selectedPatient?.fullName || '--'}
              </span>
            </div>

            <div className="flex items-center justify-between rounded-lg bg-white p-3 shadow-sm">
              <span className="flex items-center gap-2 text-sm text-slate-500">
                <Stethoscope className="h-4 w-4" />
                Bác sĩ
              </span>
              <span className="font-semibold text-slate-900">
                {selectedDoctor ? doctors.find((doc) => doc.id === selectedDoctor)?.fullName : '--'}
              </span>
            </div>

            <div className="flex items-center justify-between rounded-lg bg-white p-3 shadow-sm">
              <span className="flex items-center gap-2 text-sm text-slate-500">
                <Building2 className="h-4 w-4" />
                Chuyên khoa
              </span>
              <span className="font-semibold text-slate-900">
                {departments.find((dept) => dept.code === selectedDepartment)?.name || '--'}
              </span>
            </div>

            <div className="flex items-center justify-between rounded-lg bg-white p-3 shadow-sm">
              <span className="flex items-center gap-2 text-sm text-slate-500">
                <CalendarIcon className="h-4 w-4" />
                Thời gian
              </span>
              <span className="font-semibold text-cyan-600">
                {date && time ? `${format(date, 'dd/MM/yyyy')} • ${time}` : '--'}
              </span>
            </div>

            {reason && (
              <div className="rounded-lg bg-white p-3 shadow-sm">
                <span className="mb-1 flex items-center gap-2 text-sm text-slate-500">
                  <FileText className="h-4 w-4" />
                  Lý do khám
                </span>
                <p className="font-medium text-slate-900">{reason}</p>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );

  const renderStepContent = () => {
    return (
      <AnimatePresence mode="wait">
        {currentStep === 0 && <div key="step-0">{renderPatientStep()}</div>}
        {currentStep === 1 && <div key="step-1">{renderDoctorStep()}</div>}
        {currentStep === 2 && <div key="step-2">{renderScheduleStep()}</div>}
      </AnimatePresence>
    );
  };

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-cyan-50/30 to-teal-50/20">
        <div className="mx-auto max-w-4xl space-y-6 p-6 pb-12">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="flex items-center gap-4"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.1, type: 'spring', bounce: 0.4 }}
              className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500 to-teal-600 shadow-lg shadow-cyan-500/30"
            >
              <CalendarIcon className="h-7 w-7 text-white" />
              <motion.div
                className="absolute inset-0 rounded-2xl bg-cyan-400/20"
                animate={{ scale: [1, 1.1, 1], opacity: [0.5, 0, 0.5] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              />
            </motion.div>
            <div>
              <h1 className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 bg-clip-text text-2xl font-bold text-transparent">
                Tạo lịch hẹn mới
              </h1>
              <p className="text-sm text-slate-500">
                Hướng dẫn từng bước giúp admin đặt lịch chính xác
              </p>
            </div>
          </motion.div>

          {/* Stepper */}
          {renderStepper()}

          {/* Step content */}
          {renderStepContent()}

          {/* Actions */}
          {renderStepActions()}
        </div>
      </div>
    </DashboardLayout>
  );
}
