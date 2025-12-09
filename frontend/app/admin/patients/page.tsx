'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Plus,
  Loader2,
  Users,
  Calendar,
  Phone,
  ChevronLeft,
  ChevronRight,
  X,
  RefreshCw,
  Mail,
  SlidersHorizontal,
  MoreHorizontal,
  Shield,
  CheckCircle2,
  XCircle,
  LockKeyhole,
  Clock,
  LockOpen,
  AlertTriangle,
  Power,
  Trash2,
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout';
import { patientService, Patient } from '@/lib/api/patient.service';
import {
  deactivateAccount,
  reactivateAccount,
  unlockAccount,
  deleteAccount,
} from '@/lib/api/admin-accounts.service';
import { supabase } from '@/lib/supabase-client';
import { useDebounce } from '@/hooks/useDebounce';
import { toast } from 'sonner';
import { parseISO, differenceInYears, differenceInDays } from 'date-fns';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { showErrorToast } from '@/lib/utils/error-toast';

// ============================================================================
// TYPES
// ============================================================================
type GenderFilter = 'all' | 'MALE' | 'FEMALE' | 'OTHER';
type AgeFilterOption = '' | '0-18' | '19-40' | '41-60' | '60+';
type RegistrationFilterOption = '' | 'today' | 'week' | 'month';
type SortOption = 'name' | 'newest' | 'oldest';
type StatusFilterOption = 'all' | 'active' | 'inactive' | 'locked' | 'other';
type PatientStatsState = {
  total: number;
  male: number;
  female: number;
  other: number;
  byAgeRange: Record<'0-18' | '19-40' | '41-60' | '60+', number>;
};

// ============================================================================
// CONSTANTS
// ============================================================================
// Healthcare-themed avatar gradients - consistent with system colors
const avatarGradients = [
  'from-cyan-500 to-teal-600', // Primary healthcare cyan
  'from-teal-500 to-emerald-600', // Health green
  'from-sky-500 to-cyan-600', // Trust blue
  'from-emerald-500 to-cyan-600', // Medical green-cyan
  'from-cyan-600 to-blue-600', // Deep cyan-blue
  'from-teal-400 to-cyan-500', // Light teal
];

const ITEMS_PER_PAGE = 10;

const getAgeFromDOB = (dateOfBirth?: string): number | null => {
  if (!dateOfBirth) {
    return null;
  }
  try {
    return differenceInYears(new Date(), parseISO(dateOfBirth));
  } catch {
    return null;
  }
};

const matchesAgeFilter = (age: number | null, filter: AgeFilterOption): boolean => {
  if (!filter || age === null) {
    return filter === '' ? true : age !== null;
  }
  switch (filter) {
    case '0-18':
      return age <= 18;
    case '19-40':
      return age >= 19 && age <= 40;
    case '41-60':
      return age >= 41 && age <= 60;
    case '60+':
      return age >= 60;
    default:
      return true;
  }
};

const matchesRegistrationFilter = (
  createdAt?: string,
  filter?: RegistrationFilterOption
): boolean => {
  if (!filter || filter === '' || !createdAt) {
    return !filter || filter === '';
  }
  try {
    const createdDate = parseISO(createdAt);
    const days = differenceInDays(new Date(), createdDate);
    if (filter === 'today') {
      return days === 0;
    }
    if (filter === 'week') {
      return days <= 7;
    }
    if (filter === 'month') {
      return days <= 30;
    }
  } catch {
    return false;
  }
  return false;
};

const matchesStatusFilter = (status?: string, filter?: StatusFilterOption): boolean => {
  if (!filter || filter === 'all') {
    return true;
  }
  const normalized = (status || '').toLowerCase();
  if (filter === 'inactive') {
    return normalized === 'inactive' || normalized === 'deactivated';
  }
  if (filter === 'locked') {
    return normalized === 'locked';
  }
  if (filter === 'other') {
    return (
      normalized !== 'active' &&
      normalized !== 'inactive' &&
      normalized !== 'deactivated' &&
      normalized !== 'locked'
    );
  }
  return normalized === filter;
};

/**
 * Admin Patients Management Page - Premium UI
 * Route: /admin/patients
 */
export default function AdminPatientsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 500);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [genderFilter, setGenderFilter] = useState<GenderFilter>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilterOption>('all');
  const [ageGroupFilter, setAgeGroupFilter] = useState<AgeFilterOption>('');
  const [registrationFilter, setRegistrationFilter] = useState<RegistrationFilterOption>('');
  const [sortOption, setSortOption] = useState<SortOption>('name');
  const [showFilters, setShowFilters] = useState(false);
  const [openActionMenu, setOpenActionMenu] = useState<string | null>(null);

  // Modal states for account actions
  const [deactivateModal, setDeactivateModal] = useState<{
    open: boolean;
    patient: Patient | null;
  }>({ open: false, patient: null });
  const [deactivationReason, setDeactivationReason] = useState('');
  const [isSubmittingDeactivation, setIsSubmittingDeactivation] = useState(false);

  const [activateModal, setActivateModal] = useState<{
    open: boolean;
    patient: Patient | null;
  }>({ open: false, patient: null });
  const [activationNote, setActivationNote] = useState('');
  const [isSubmittingActivation, setIsSubmittingActivation] = useState(false);

  const [unlockModal, setUnlockModal] = useState<{
    open: boolean;
    patient: Patient | null;
  }>({ open: false, patient: null });
  const [unlockReason, setUnlockReason] = useState('');
  const [isSubmittingUnlock, setIsSubmittingUnlock] = useState(false);

  const [deleteModal, setDeleteModal] = useState<{
    open: boolean;
    patient: Patient | null;
  }>({ open: false, patient: null });
  const [deleteReason, setDeleteReason] = useState('');
  const [deleteForce, setDeleteForce] = useState(false);
  const [isSubmittingDelete, setIsSubmittingDelete] = useState(false);

  // Stats - fetched from API for accurate counts
  const [stats, setStats] = useState<PatientStatsState>({
    total: 0,
    male: 0,
    female: 0,
    other: 0,
    byAgeRange: {
      '0-18': 0,
      '19-40': 0,
      '41-60': 0,
      '60+': 0,
    },
  });
  const [statusCounts, setStatusCounts] = useState({
    active: 0,
    inactive: 0,
    deceased: 0,
    merged: 0,
  });

  // Fetch stats using dedicated API endpoint for accurate counts
  const fetchStats = useCallback(async () => {
    try {
      const statsResponse = await patientService.getStatistics();
      setStats({
        total: statsResponse.total || 0,
        male: statsResponse.byGender?.male || 0,
        female: statsResponse.byGender?.female || 0,
        other: (statsResponse.byGender?.other || 0) + (statsResponse.byGender?.unknown || 0),
        byAgeRange: {
          '0-18': statsResponse.byAgeRange?.['0-18'] || 0,
          '19-40': statsResponse.byAgeRange?.['19-40'] || 0,
          '41-60': statsResponse.byAgeRange?.['41-60'] || 0,
          '60+': statsResponse.byAgeRange?.['60+'] || 0,
        },
      });
      setStatusCounts({
        active: statsResponse.byStatus?.active || 0,
        inactive: statsResponse.byStatus?.inactive || 0,
        deceased: statsResponse.byStatus?.deceased || 0,
        merged: statsResponse.byStatus?.merged || 0,
      });
    } catch (err) {
      console.error('❌ Error fetching stats:', err);
      showErrorToast(err, {
        title: 'Không thể tải thống kê bệnh nhân',
        fallbackMessage: 'Không thể tải thống kê bệnh nhân. Vui lòng thử lại sau.',
        context: 'Admin/Patients:stats',
      });
    }
  }, []);

  // Fetch stats on mount
  useEffect(() => {
    // Don't call fetchStats here - it runs too early before auth is ready
    // Instead, call it from fetchPatients after first success
  }, []);

  const fetchPatients = useCallback(
    async (options?: { refresh?: boolean; silent?: boolean }) => {
      const refresh = options?.refresh ?? false;
      const silent = options?.silent ?? false;
      const manageRefreshing = refresh && !silent;
      const manageLoading = !refresh && !silent;

      if (manageRefreshing) {
        setIsRefreshing(true);
      } else if (manageLoading) {
        setIsLoading(true);
      }
      try {
        // Note: API doesn't support gender filter, so we fetch all and filter locally
        const res = await patientService.searchPatients({
          keyword: debouncedSearch,
          page: currentPage,
          limit: ITEMS_PER_PAGE,
        });
        if (res) {
          let filteredPatients = res.patients || [];

          // Apply gender filter locally
          if (genderFilter !== 'all') {
            filteredPatients = filteredPatients.filter(
              (p) => (p.gender || '').toUpperCase() === genderFilter
            );
          }

          if (statusFilter !== 'all') {
            filteredPatients = filteredPatients.filter((p) =>
              matchesStatusFilter(p.accountStatus, statusFilter)
            );
          }

          if (ageGroupFilter) {
            filteredPatients = filteredPatients.filter((p) =>
              matchesAgeFilter(getAgeFromDOB(p.dateOfBirth), ageGroupFilter)
            );
          }

          if (registrationFilter) {
            filteredPatients = filteredPatients.filter((p) =>
              matchesRegistrationFilter(p.createdAt, registrationFilter)
            );
          }

          if (sortOption) {
            const sorted = [...filteredPatients].sort((a, b) => {
              if (sortOption === 'name') {
                return (a.fullName || '').localeCompare(b.fullName || '');
              }
              const createdA = a.createdAt ? Date.parse(a.createdAt) : 0;
              const createdB = b.createdAt ? Date.parse(b.createdAt) : 0;
              if (sortOption === 'newest') {
                return createdB - createdA;
              }
              if (sortOption === 'oldest') {
                return createdA - createdB;
              }
              return 0;
            });
            filteredPatients = sorted;
          }

          setPatients(filteredPatients);
          setTotal(res.total || 0);

          // Fetch stats after first successful data load (only if no search/filter)
          if (
            !debouncedSearch &&
            genderFilter === 'all' &&
            currentPage === 1 &&
            stats.total === 0
          ) {
            fetchStats();
          }
        }
        if (refresh && !silent) {
          toast.success('Đã làm mới dữ liệu');
        }
      } catch (error) {
        console.error('Failed to fetch patients:', error);
        showErrorToast(error, {
          title: 'Không thể tải danh sách bệnh nhân',
          fallbackMessage: 'Không thể tải danh sách bệnh nhân. Vui lòng thử lại.',
          context: 'Admin/Patients:list',
        });
      } finally {
        if (manageLoading) {
          setIsLoading(false);
        }
        if (manageRefreshing) {
          setIsRefreshing(false);
        }
      }
    },
    [
      debouncedSearch,
      currentPage,
      genderFilter,
      statusFilter,
      ageGroupFilter,
      registrationFilter,
      sortOption,
      fetchStats,
      stats.total,
    ]
  );

  // Total pages
  const totalPages = Math.ceil(total / ITEMS_PER_PAGE);

  useEffect(() => {
    void fetchPatients();
  }, [fetchPatients]);

  useEffect(() => {
    if (!supabase) {
      return;
    }

    const channel = supabase
      .channel('admin-patient-status')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'patient_schema',
          table: 'patients',
        },
        (payload) => {
          const previousStatus = (payload.old as any)?.status;
          const nextStatus = (payload.new as any)?.status;
          if (payload.eventType === 'UPDATE' && previousStatus === nextStatus) {
            return;
          }
          void fetchPatients({ silent: true });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchPatients]);

  useEffect(() => {
    const handleClickOutside = (): void => setOpenActionMenu(null);
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, []);

  type PatientAction = 'activate' | 'deactivate' | 'unlock' | 'delete';

  const handlePatientAction = (action: PatientAction, patient: Patient) => {
    setOpenActionMenu(null);

    switch (action) {
      case 'deactivate':
        setDeactivateModal({ open: true, patient });
        setDeactivationReason('');
        break;
      case 'activate':
        setActivateModal({ open: true, patient });
        setActivationNote('');
        break;
      case 'unlock':
        setUnlockModal({ open: true, patient });
        setUnlockReason('');
        break;
      case 'delete':
        setDeleteModal({ open: true, patient });
        setDeleteReason('');
        setDeleteForce(false);
        break;
    }
  };

  const executePatientAction = async (
    action: PatientAction,
    patient: Patient,
    providedReason?: string,
    options?: { force?: boolean }
  ): Promise<boolean> => {
    if (!patient.userId) {
      toast.error('Không tìm thấy userId của bệnh nhân để thao tác');
      return false;
    }

    const displayName =
      patient.fullName || `${patient.firstName || ''} ${patient.lastName || ''}`.trim();
    const actionLabels: Record<PatientAction, string> = {
      activate: 'kích hoạt lại tài khoản',
      deactivate: 'vô hiệu hóa tài khoản',
      unlock: 'mở khóa tài khoản',
      delete: 'xóa tài khoản',
    };

    try {
      let requestPromise: Promise<any>;

      switch (action) {
        case 'deactivate': {
          const finalReason = (providedReason || '').trim();
          if (!finalReason) {
            toast.error('Vui lòng nhập lý do vô hiệu hóa');
            return false;
          }
          requestPromise = deactivateAccount({
            userId: patient.userId,
            reason: finalReason,
            terminateSessions: true,
          });
          break;
        }
        case 'unlock': {
          const unlockReason = (providedReason || '').trim();
          if (!unlockReason) {
            toast.error('Vui lòng nhập lý do mở khóa');
            return false;
          }
          requestPromise = unlockAccount({
            userId: patient.userId,
            reason: unlockReason,
          });
          break;
        }
        case 'activate': {
          requestPromise = reactivateAccount({
            userId: patient.userId,
            reason: providedReason?.trim() || undefined,
          });
          break;
        }
        case 'delete': {
          const finalReason = (providedReason || '').trim();
          if (!finalReason) {
            toast.error('Vui lòng nhập lý do xóa tài khoản');
            return false;
          }
          requestPromise = deleteAccount({
            userId: patient.userId,
            reason: finalReason,
            force: options?.force ?? false,
          });
          break;
        }
        default:
          return false;
      }

      await toast.promise(requestPromise, {
        loading: `${actionLabels[action]}...`,
        success: (res) => res?.message || `${actionLabels[action]} thành công`,
        error: (err) =>
          err?.response?.data?.message ||
          err?.response?.data?.error ||
          `Không thể ${actionLabels[action]}`,
      });

      await fetchPatients();
      return true;
    } catch (error) {
      console.error('[PatientsPage] Account action failed', error);
      showErrorToast(error, {
        title: `Không thể ${actionLabels[action]}`,
        fallbackMessage: `Không thể ${actionLabels[action]} cho ${displayName || patient.patientId}.`,
        context: `Admin/Patients:${action} – ${patient.patientId}`,
      });
      return false;
    }
  };

  const closeDeactivateModal = () => {
    setDeactivateModal({ open: false, patient: null });
    setDeactivationReason('');
  };

  const handleConfirmDeactivate = async () => {
    if (!deactivateModal.patient) {
      return;
    }

    const trimmedReason = deactivationReason.trim();
    if (!trimmedReason) {
      toast.error('Vui lòng nhập lý do vô hiệu hóa');
      return;
    }

    setIsSubmittingDeactivation(true);
    const success = await executePatientAction(
      'deactivate',
      deactivateModal.patient,
      trimmedReason
    );
    setIsSubmittingDeactivation(false);
    if (success) {
      closeDeactivateModal();
    }
  };

  // Activate modal handlers
  const closeActivateModal = () => {
    setActivateModal({ open: false, patient: null });
    setActivationNote('');
  };

  const handleConfirmActivate = async () => {
    if (!activateModal.patient) {
      return;
    }

    setIsSubmittingActivation(true);
    const success = await executePatientAction(
      'activate',
      activateModal.patient,
      activationNote.trim() || undefined
    );
    setIsSubmittingActivation(false);
    if (success) {
      closeActivateModal();
    }
  };

  // Unlock modal handlers
  const closeUnlockModal = () => {
    setUnlockModal({ open: false, patient: null });
    setUnlockReason('');
  };

  const handleConfirmUnlock = async () => {
    if (!unlockModal.patient) {
      return;
    }

    const trimmedReason = unlockReason.trim();
    if (!trimmedReason) {
      toast.error('Vui lòng nhập lý do mở khóa');
      return;
    }

    setIsSubmittingUnlock(true);
    const success = await executePatientAction('unlock', unlockModal.patient, trimmedReason);
    setIsSubmittingUnlock(false);
    if (success) {
      closeUnlockModal();
    }
  };

  const closeDeleteModal = () => {
    setDeleteModal({ open: false, patient: null });
    setDeleteReason('');
    setDeleteForce(false);
  };

  const handleConfirmDelete = async () => {
    if (!deleteModal.patient) {
      return;
    }
    const trimmedReason = deleteReason.trim();
    if (!trimmedReason) {
      toast.error('Vui lòng nhập lý do xóa tài khoản');
      return;
    }
    if (trimmedReason.length < 5) {
      toast.error('Lý do xóa phải có ít nhất 5 ký tự');
      return;
    }

    setIsSubmittingDelete(true);
    const success = await executePatientAction('delete', deleteModal.patient, trimmedReason, {
      force: deleteForce,
    });
    setIsSubmittingDelete(false);
    if (success) {
      closeDeleteModal();
    }
  };

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handleGenderChange = (gender: GenderFilter) => {
    setGenderFilter(gender);
    setCurrentPage(1);
  };

  const handleStatusChange = (status: StatusFilterOption) => {
    setStatusFilter(status);
    setCurrentPage(1);
  };

  const handleAgeGroupChange = (value: AgeFilterOption) => {
    setAgeGroupFilter(value);
    setCurrentPage(1);
  };

  const handleRegistrationChange = (value: RegistrationFilterOption) => {
    setRegistrationFilter(value);
    setCurrentPage(1);
  };

  const handleSortChange = (value: SortOption) => {
    setSortOption(value);
  };

  const getAvatarGradient = (index: number) => {
    return avatarGradients[index % avatarGradients.length];
  };

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-cyan-50/30 to-teal-50/20">
        <div className="mx-auto max-w-7xl space-y-6 p-6">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="flex items-center gap-4">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.4, delay: 0.1, type: 'spring', bounce: 0.4 }}
                className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500 to-teal-600 shadow-lg shadow-cyan-500/30"
              >
                <Users className="h-7 w-7 text-white" />
                {/* Subtle pulse effect */}
                <motion.div
                  className="absolute inset-0 rounded-2xl bg-cyan-400/20"
                  animate={{ scale: [1, 1.1, 1], opacity: [0.5, 0, 0.5] }}
                  transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                />
              </motion.div>
              <div>
                <h1 className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 bg-clip-text text-2xl font-bold text-transparent">
                  Quản lý Bệnh nhân
                </h1>
                <p className="text-sm text-slate-500">Quản lý thông tin và hồ sơ bệnh nhân</p>
              </div>
            </div>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
              className="flex items-center gap-3"
            >
              <button
                onClick={() => fetchPatients({ refresh: true })}
                disabled={isRefreshing}
                className="group flex items-center gap-2 rounded-xl border border-slate-200/80 bg-white/80 px-4 py-2.5 text-sm font-medium text-slate-600 shadow-sm backdrop-blur-sm transition-all duration-200 hover:border-cyan-300 hover:bg-white hover:text-cyan-600 hover:shadow-md disabled:opacity-50"
              >
                <RefreshCw
                  className={`h-4 w-4 transition-transform duration-300 ${isRefreshing ? 'animate-spin' : 'group-hover:rotate-90'}`}
                />
                <span className="hidden sm:inline">Làm mới</span>
              </button>
              <Link
                href="/admin/patients/add"
                className="group relative flex items-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-cyan-500 to-teal-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-cyan-500/25 transition-all duration-300 hover:scale-[1.02] hover:shadow-cyan-500/40"
              >
                <span className="absolute inset-0 translate-x-[-100%] bg-gradient-to-r from-white/0 via-white/20 to-white/0 transition-transform duration-500 group-hover:translate-x-[100%]" />
                <Plus className="relative z-10 h-5 w-5" />
                <span className="relative z-10">Thêm bệnh nhân</span>
              </Link>
            </motion.div>
          </motion.div>

          {/* Stats Overview */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15, ease: 'easeOut' }}
          >
            <div className="grid gap-6 lg:grid-cols-2">
              <DemographicChartCard stats={stats} />
              <AccountStatusOverview total={stats.total} statusCounts={statusCounts} />
            </div>
          </motion.div>

          {/* Main Content Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.25, ease: 'easeOut' }}
            className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white/90 shadow-sm backdrop-blur-sm"
          >
            {/* Toolbar */}
            <div className="flex flex-col gap-4 border-b border-slate-100 bg-white p-5 sm:flex-row sm:items-center sm:justify-between">
              {/* Search */}
              <div className="relative flex-1 sm:max-w-md">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                  <Search className="h-4 w-4 text-slate-400" />
                </div>
                <input
                  type="text"
                  placeholder="Tìm kiếm theo tên, mã BN, SĐT..."
                  value={searchTerm}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="block w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pr-4 pl-11 text-sm placeholder-slate-400 transition-all focus:border-cyan-500 focus:bg-white focus:ring-2 focus:ring-cyan-500/20 focus:outline-none"
                />
                {searchTerm && (
                  <button
                    onClick={() => handleSearchChange('')}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              {/* Filters */}
              <div className="flex items-center gap-3">
                {/* Gender Tabs */}
                <div className="flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 p-1">
                  {[
                    { value: 'all', label: 'Tất cả' },
                    { value: 'MALE', label: 'Nam' },
                    { value: 'FEMALE', label: 'Nữ' },
                  ].map((option) => (
                    <button
                      key={option.value}
                      onClick={() => handleGenderChange(option.value as GenderFilter)}
                      className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                        genderFilter === option.value
                          ? 'bg-white text-slate-900 shadow-sm'
                          : 'text-slate-500 hover:text-slate-700'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>

                <div className="hidden h-6 w-px bg-slate-200 sm:block" />

                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition-all ${
                    showFilters
                      ? 'border-cyan-500 bg-cyan-50 text-cyan-700'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <SlidersHorizontal className="h-4 w-4" />
                  <span className="hidden sm:inline">Bộ lọc</span>
                </button>
              </div>
            </div>

            {/* Advanced Filters Panel */}
            <AnimatePresence>
              {showFilters && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden border-b border-slate-100 bg-slate-50/50"
                >
                  <div className="grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-4">
                    <div>
                      <label className="mb-1.5 block text-xs font-medium text-slate-600">
                        Nhóm tuổi
                      </label>
                      <select
                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 focus:outline-none"
                        value={ageGroupFilter}
                        onChange={(e) => handleAgeGroupChange(e.target.value as AgeFilterOption)}
                      >
                        <option value="">Tất cả</option>
                        <option value="0-18">0 - 18 tuổi</option>
                        <option value="19-40">19 - 40 tuổi</option>
                        <option value="41-60">41 - 60 tuổi</option>
                        <option value="60+">Trên 60 tuổi</option>
                      </select>
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs font-medium text-slate-600">
                        Ngày đăng ký
                      </label>
                      <select
                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 focus:outline-none"
                        value={registrationFilter}
                        onChange={(e) =>
                          handleRegistrationChange(e.target.value as RegistrationFilterOption)
                        }
                      >
                        <option value="">Tất cả</option>
                        <option value="today">Hôm nay</option>
                        <option value="week">Tuần này</option>
                        <option value="month">Tháng này</option>
                      </select>
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs font-medium text-slate-600">
                        Sắp xếp theo
                      </label>
                      <select
                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 focus:outline-none"
                        value={sortOption}
                        onChange={(e) => handleSortChange(e.target.value as SortOption)}
                      >
                        <option value="name">Tên A-Z</option>
                        <option value="newest">Mới nhất</option>
                        <option value="oldest">Cũ nhất</option>
                      </select>
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs font-medium text-slate-600">
                        Trạng thái tài khoản
                      </label>
                      <select
                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 focus:outline-none"
                        value={statusFilter}
                        onChange={(e) => handleStatusChange(e.target.value as StatusFilterOption)}
                      >
                        <option value="all">Tất cả</option>
                        <option value="active">Hoạt động</option>
                        <option value="inactive">Vô hiệu</option>
                        <option value="locked">Đã khóa</option>
                        <option value="other">Trạng thái khác</option>
                      </select>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-slate-100 bg-slate-50/80">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold tracking-wider text-slate-500 uppercase">
                      Bệnh nhân
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold tracking-wider text-slate-500 uppercase">
                      Mã BN
                    </th>
                    <th className="hidden px-6 py-4 text-left text-xs font-semibold tracking-wider text-slate-500 uppercase md:table-cell">
                      Liên hệ
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold tracking-wider text-slate-500 uppercase">
                      Tuổi
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold tracking-wider text-slate-500 uppercase">
                      Giới tính
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold tracking-wider text-slate-500 uppercase">
                      Trạng thái
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-semibold tracking-wider text-slate-500 uppercase">
                      Thao tác
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {isLoading ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-20 text-center">
                        <div className="flex flex-col items-center justify-center">
                          <Loader2 className="mb-4 h-10 w-10 animate-spin text-cyan-600" />
                          <p className="font-medium text-slate-500">Đang tải dữ liệu...</p>
                        </div>
                      </td>
                    </tr>
                  ) : patients.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-20 text-center">
                        <div className="mx-auto flex max-w-sm flex-col items-center justify-center">
                          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
                            <Search className="h-8 w-8 text-slate-400" />
                          </div>
                          <h3 className="mb-1 text-lg font-semibold text-slate-900">
                            Không tìm thấy bệnh nhân
                          </h3>
                          <p className="text-center text-sm text-slate-500">
                            {searchTerm
                              ? `Không tìm thấy kết quả nào cho "${searchTerm}".`
                              : 'Chưa có bệnh nhân nào trong hệ thống.'}
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    patients.map((patient, index) => (
                      <PatientRow
                        key={patient.patientId}
                        patient={patient}
                        index={index}
                        avatarGradient={getAvatarGradient(index)}
                        actionMenuOpen={openActionMenu}
                        onToggleActionMenu={(id) =>
                          setOpenActionMenu((prev) => (prev === id ? null : id))
                        }
                        onActionSelect={handlePatientAction}
                      />
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {!isLoading && patients.length > 0 && totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/50 px-6 py-4">
                <div className="text-sm text-slate-500">
                  Hiển thị{' '}
                  <span className="font-semibold text-slate-900">
                    {(currentPage - 1) * ITEMS_PER_PAGE + 1}
                  </span>{' '}
                  -{' '}
                  <span className="font-semibold text-slate-900">
                    {Math.min(currentPage * ITEMS_PER_PAGE, total)}
                  </span>{' '}
                  trong <span className="font-semibold text-slate-900">{total}</span> bệnh nhân
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="rounded-lg border border-slate-200 bg-white p-2 text-slate-600 shadow-sm transition-all hover:bg-slate-50 hover:text-cyan-600 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>

                  <div className="flex items-center gap-1">
                    {generatePageNumbers(currentPage, totalPages).map((page, idx) =>
                      page === '...' ? (
                        <span key={`ellipsis-${idx}`} className="px-2 text-slate-400">
                          ...
                        </span>
                      ) : (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page as number)}
                          className={`h-8 w-8 rounded-lg text-sm font-medium transition-all ${
                            currentPage === page
                              ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-md'
                              : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-cyan-600'
                          }`}
                        >
                          {page}
                        </button>
                      )
                    )}
                  </div>

                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="rounded-lg border border-slate-200 bg-white p-2 text-slate-600 shadow-sm transition-all hover:bg-slate-50 hover:text-cyan-600 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </div>

      {/* Deactivate Modal */}
      {deactivateModal.open && deactivateModal.patient && (
        <AccountActionModal
          type="deactivate"
          patient={deactivateModal.patient}
          inputValue={deactivationReason}
          isSubmitting={isSubmittingDeactivation}
          onInputChange={setDeactivationReason}
          onClose={closeDeactivateModal}
          onSubmit={handleConfirmDeactivate}
        />
      )}

      {/* Activate Modal */}
      {activateModal.open && activateModal.patient && (
        <AccountActionModal
          type="activate"
          patient={activateModal.patient}
          inputValue={activationNote}
          isSubmitting={isSubmittingActivation}
          onInputChange={setActivationNote}
          onClose={closeActivateModal}
          onSubmit={handleConfirmActivate}
        />
      )}

      {/* Unlock Modal */}
      {unlockModal.open && unlockModal.patient && (
        <AccountActionModal
          type="unlock"
          patient={unlockModal.patient}
          inputValue={unlockReason}
          isSubmitting={isSubmittingUnlock}
          onInputChange={setUnlockReason}
          onClose={closeUnlockModal}
          onSubmit={handleConfirmUnlock}
        />
      )}

      {deleteModal.open && deleteModal.patient && (
        <DeleteAccountModal
          patient={deleteModal.patient}
          reason={deleteReason}
          force={deleteForce}
          isSubmitting={isSubmittingDelete}
          onReasonChange={setDeleteReason}
          onForceChange={setDeleteForce}
          onClose={closeDeleteModal}
          onConfirm={handleConfirmDelete}
        />
      )}
    </DashboardLayout>
  );
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function generatePageNumbers(current: number, total: number): (number | string)[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  if (current <= 3) {
    return [1, 2, 3, 4, 5, '...', total];
  }

  if (current >= total - 2) {
    return [1, '...', total - 4, total - 3, total - 2, total - 1, total];
  }

  return [1, '...', current - 1, current, current + 1, '...', total];
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

interface DemographicChartCardProps {
  stats: any;
}

interface DonutLegendItem {
  label: string;
  value: number;
  color: string;
}

function DemographicChartCard({ stats }: DemographicChartCardProps) {
  const [tab, setTab] = useState<'gender' | 'age'>('gender');
  const total = stats.total || 0;

  // Healthcare-themed color palette
  const genderLegend: DonutLegendItem[] = [
    { label: 'Nam', value: stats.male || 0, color: '#0891B2' }, // cyan-600
    { label: 'Nữ', value: stats.female || 0, color: '#14B8A6' }, // teal-500
    { label: 'Khác', value: stats.other || 0, color: '#64748B' }, // slate-500
  ];

  const ageEntries = stats.byAgeRange || {
    '0-18': 0,
    '19-40': 0,
    '41-60': 0,
    '60+': 0,
  };
  const ageLegend: DonutLegendItem[] = [
    { label: '0 - 18 tuổi', value: ageEntries['0-18'], color: '#22D3EE' }, // cyan-400
    { label: '19 - 40 tuổi', value: ageEntries['19-40'], color: '#0D9488' }, // teal-600
    { label: '41 - 60 tuổi', value: ageEntries['41-60'], color: '#0E7490' }, // cyan-700
    { label: 'Trên 60 tuổi', value: ageEntries['60+'], color: '#115E59' }, // teal-800
  ];

  const legendItems = tab === 'gender' ? genderLegend : ageLegend;
  const topLegend = legendItems.reduce(
    (prev, curr) => (curr.value > prev.value ? curr : prev),
    legendItems[0]
  );

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
      className="group rounded-2xl border border-slate-200/80 bg-gradient-to-br from-white via-white to-cyan-50/30 p-6 shadow-sm transition-all duration-300 hover:shadow-md hover:shadow-cyan-100/50"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">
            {tab === 'gender' ? 'Phân bố giới tính' : 'Phân bố độ tuổi'}
          </p>
          <motion.p
            key={total}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-3xl font-bold text-transparent"
          >
            {total}
          </motion.p>
          <p className="text-xs text-slate-400">Tổng số bệnh nhân</p>
        </div>
        <div className="rounded-full border border-slate-200/80 bg-slate-50/80 p-1 text-xs font-semibold text-slate-600 backdrop-blur-sm">
          <div className="flex rounded-full bg-white shadow-sm">
            {['gender', 'age'].map((key) => (
              <motion.button
                key={key}
                onClick={() => setTab(key as 'gender' | 'age')}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`relative px-3 py-1.5 transition-all duration-200 ${
                  tab === key
                    ? 'rounded-full bg-gradient-to-r from-cyan-500 to-teal-500 text-white shadow-md shadow-cyan-500/30'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {key === 'gender' ? 'Giới tính' : 'Độ tuổi'}
              </motion.button>
            ))}
          </div>
        </div>
      </div>
      <p className="mt-2 text-xs text-slate-500">
        Nhóm chiếm ưu thế: {topLegend.label} ({topLegend.value} bệnh nhân)
      </p>
      <div className="mt-6 flex flex-col gap-6 md:flex-row">
        <div className="relative flex items-center justify-center">
          <DonutVisualization items={legendItems} total={total} />
          <div className="absolute text-center">
            <p className="text-3xl font-bold text-slate-900">{total}</p>
            <p className="text-xs text-slate-500">Bệnh nhân</p>
          </div>
        </div>
        <div className="flex-1 space-y-3">
          {legendItems.map((item) => {
            const percent = total > 0 ? (item.value / total) * 100 : 0;
            return (
              <div key={item.label} className="flex items-center gap-3">
                <span className="h-3 w-3 rounded-full" style={{ backgroundColor: item.color }} />
                <div className="flex flex-1 items-center justify-between text-sm">
                  <span className="font-medium text-slate-700">{item.label}</span>
                  <span className="text-slate-500">
                    <span className="font-semibold text-slate-900">{item.value}</span> (
                    {percent.toFixed(1)}%)
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}

function DonutVisualization({ items, total }: { items: DonutLegendItem[]; total: number }) {
  const size = 160;
  const strokeWidth = 24;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="#E2E8F0"
        strokeWidth={strokeWidth}
      />
      {items.map((item) => {
        const segment = total > 0 ? (item.value / total) * circumference : 0;
        const element = (
          <circle
            key={item.label}
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={item.color}
            strokeWidth={strokeWidth}
            strokeDasharray={`${segment} ${circumference - segment}`}
            strokeDashoffset={-offset}
            strokeLinecap="round"
            className="transition-all duration-500"
          />
        );
        offset += segment;
        return element;
      })}
    </svg>
  );
}

interface AccountStatusOverviewProps {
  total: number;
  statusCounts: {
    active: number;
    inactive: number;
    deceased: number;
    merged: number;
  };
}

function AccountStatusOverview({ total, statusCounts }: AccountStatusOverviewProps) {
  const chartItems = [
    {
      key: 'active',
      label: 'Đang hoạt động',
      value: statusCounts.active,
      color: 'from-cyan-500 to-teal-500', // healthcare cyan-teal
      bar: 'bg-gradient-to-r from-cyan-500 to-teal-500',
      icon: CheckCircle2,
    },
    {
      key: 'inactive',
      label: 'Đã vô hiệu',
      value: statusCounts.inactive,
      color: 'from-rose-500 to-red-500',
      bar: 'bg-gradient-to-r from-rose-500 to-red-500',
      icon: XCircle,
    },
    {
      key: 'other',
      label: 'Trạng thái khác',
      value: statusCounts.deceased + statusCounts.merged,
      color: 'from-amber-400 to-orange-500',
      bar: 'bg-gradient-to-r from-amber-400 to-orange-500',
      icon: AlertTriangle,
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, delay: 0.1 }}
      className="group rounded-2xl border border-slate-200/80 bg-gradient-to-br from-white via-white to-teal-50/30 p-6 shadow-sm transition-all duration-300 hover:shadow-md hover:shadow-teal-100/50"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">Trạng thái tài khoản</p>
          <motion.p
            key={total}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-3xl font-bold text-transparent"
          >
            {total}
          </motion.p>
          <p className="text-xs text-slate-400">Tổng số bệnh nhân</p>
        </div>
        <div className="flex items-center gap-2 rounded-full bg-gradient-to-r from-cyan-50 to-teal-50 px-3 py-1.5 text-xs font-semibold text-cyan-700 shadow-sm">
          <span className="h-2 w-2 animate-pulse rounded-full bg-cyan-500" />
          {chartItems[0].value} đang hoạt động
        </div>
      </div>
      <div className="mt-6 space-y-4">
        {chartItems.map((item, index) => {
          const percent = total > 0 ? (item.value / total) * 100 : 0;
          const Icon = item.icon;
          return (
            <motion.div
              key={item.key}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 + index * 0.1, duration: 0.3 }}
            >
              <div className="mb-1 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <motion.div
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    transition={{ duration: 0.2 }}
                    className={`flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br ${item.color} text-white shadow-md`}
                  >
                    <Icon className="h-4 w-4" />
                  </motion.div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{item.label}</p>
                    <p className="text-xs text-slate-500">{item.value} bệnh nhân</p>
                  </div>
                </div>
                <span className="text-sm font-bold text-slate-700">{percent.toFixed(1)}%</span>
              </div>
              <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(percent, 100)}%` }}
                  transition={{ duration: 0.6, delay: 0.2 + index * 0.1, ease: 'easeOut' }}
                  className={`h-full rounded-full ${item.bar}`}
                />
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}

interface PatientRowProps {
  patient: Patient;
  index: number;
  avatarGradient: string;
  actionMenuOpen: string | null;
  onToggleActionMenu: (patientId: string) => void;
  onActionSelect: (
    action: 'activate' | 'deactivate' | 'unlock' | 'delete',
    patient: Patient
  ) => void;
}

function PatientRow({
  patient,
  index,
  avatarGradient,
  actionMenuOpen,
  onToggleActionMenu,
  onActionSelect,
}: PatientRowProps) {
  const router = useRouter();
  const firstName = patient.firstName || '';
  const lastName = patient.lastName || '';
  const fullName = `${firstName} ${lastName}`.trim() || 'Bệnh nhân';
  const initial = lastName ? lastName.charAt(0) : firstName ? firstName.charAt(0) : '?';

  // Calculate age
  const age = getAgeFromDOB(patient.dateOfBirth);

  // Gender badge color
  const genderConfig = {
    MALE: { label: 'Nam', bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
    FEMALE: { label: 'Nữ', bg: 'bg-pink-50', text: 'text-pink-700', border: 'border-pink-200' },
    OTHER: { label: 'Khác', bg: 'bg-slate-50', text: 'text-slate-700', border: 'border-slate-200' },
  };
  const gender = genderConfig[patient.gender as keyof typeof genderConfig] || genderConfig.OTHER;

  // Account status badge config
  const inactiveState = {
    label: 'Vô hiệu',
    bg: 'bg-rose-50',
    text: 'text-rose-700',
    border: 'border-rose-200',
    icon: XCircle,
  };
  const statusConfig = {
    active: {
      label: 'Hoạt động',
      bg: 'bg-emerald-50',
      text: 'text-emerald-700',
      border: 'border-emerald-200',
      icon: CheckCircle2,
    },
    inactive: inactiveState,
    deactivated: inactiveState,
    locked: {
      label: 'Đã khóa',
      bg: 'bg-amber-50',
      text: 'text-amber-700',
      border: 'border-amber-200',
      icon: LockKeyhole,
    },
    pending_verification: {
      label: 'Chờ xác minh',
      bg: 'bg-sky-50',
      text: 'text-sky-700',
      border: 'border-sky-200',
      icon: Clock,
    },
    suspended: {
      label: 'Tạm ngưng',
      bg: 'bg-orange-50',
      text: 'text-orange-700',
      border: 'border-orange-200',
      icon: Shield,
    },
  };
  const accountStatus = patient.accountStatus || 'active';
  const status = statusConfig[accountStatus as keyof typeof statusConfig] || statusConfig.active;
  const StatusIcon = status.icon;

  const menuOpenForRow = actionMenuOpen === patient.patientId;

  return (
    <motion.tr
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.3, ease: 'easeOut' }}
      className="group cursor-pointer transition-all duration-200 hover:bg-gradient-to-r hover:from-cyan-50/50 hover:to-teal-50/30"
      onClick={() => {
        if (!patient.patientId) {
          return;
        }
        router.push(`/admin/patients/${patient.patientId}`);
      }}
      onKeyDown={(event) => {
        if (event.key !== 'Enter' && event.key !== ' ') {
          return;
        }
        event.preventDefault();
        if (!patient.patientId) {
          return;
        }
        router.push(`/admin/patients/${patient.patientId}`);
      }}
      role="button"
      tabIndex={0}
    >
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center">
          <motion.div
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.2 }}
            className={`relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${avatarGradient} text-base font-bold text-white shadow-md ring-2 shadow-cyan-500/20 ring-white`}
          >
            {initial}
            {/* Online indicator for active status */}
            {accountStatus === 'active' && (
              <span className="absolute -right-0.5 -bottom-0.5 h-3 w-3 rounded-full border-2 border-white bg-emerald-500" />
            )}
          </motion.div>
          <div className="ml-4">
            <div className="text-sm font-semibold text-slate-900 transition-colors duration-200 group-hover:text-cyan-700">
              {fullName}
            </div>
            <div className="mt-0.5 flex items-center gap-1.5 text-xs text-slate-500">
              <Mail className="h-3 w-3" />
              <span className="max-w-[180px] truncate">{patient.email || 'Chưa có email'}</span>
            </div>
          </div>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span className="rounded-lg bg-gradient-to-r from-slate-100 to-slate-50 px-2.5 py-1 font-mono text-xs font-medium text-slate-700 shadow-sm">
          {patient.patientId}
        </span>
      </td>
      <td className="hidden px-6 py-4 whitespace-nowrap md:table-cell">
        <div className="flex items-center gap-1.5 text-sm text-slate-600">
          <Phone className="h-3.5 w-3.5 text-cyan-500" />
          <span className="transition-colors duration-200 group-hover:text-slate-900">
            {patient.phoneNumber || 'Chưa cập nhật'}
          </span>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center gap-1.5">
          <Calendar className="h-3.5 w-3.5 text-teal-500" />
          <span className="text-sm text-slate-600 transition-colors duration-200 group-hover:text-slate-900">
            {age !== null ? `${age} tuổi` : '-'}
          </span>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span
          className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium transition-all duration-200 ${gender.bg} ${gender.text} ${gender.border} group-hover:shadow-sm`}
        >
          {gender.label}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <motion.span
          whileHover={{ scale: 1.02 }}
          className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-all duration-200 ${status.bg} ${status.text} ${status.border} group-hover:shadow-sm`}
        >
          <StatusIcon className="h-3 w-3" />
          {status.label}
        </motion.span>
      </td>
      <td className="px-6 py-4 text-right text-sm font-medium whitespace-nowrap">
        <div className="relative flex justify-end">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={(e) => {
              e.stopPropagation();
              onToggleActionMenu(patient.patientId);
            }}
            className="rounded-lg p-2 text-slate-400 transition-all duration-200 hover:bg-cyan-100 hover:text-cyan-600 hover:shadow-sm"
            title="Thao tác"
          >
            <MoreHorizontal className="h-4 w-4" />
          </motion.button>
          {menuOpenForRow && (
            <div className="absolute top-full right-0 z-10 mt-2 w-48 rounded-xl border border-slate-200 bg-white text-left shadow-lg">
              {[
                { key: 'activate', label: 'Kích hoạt lại', className: 'text-emerald-600' },
                { key: 'deactivate', label: 'Vô hiệu hóa', className: 'text-amber-600' },
                { key: 'unlock', label: 'Mở khóa tài khoản', className: 'text-slate-700' },
                { key: 'delete', label: 'Xóa vĩnh viễn', className: 'text-rose-600' },
              ].map((action) => (
                <button
                  key={action.key}
                  onClick={(e) => {
                    e.stopPropagation();
                    void onActionSelect(
                      action.key as 'activate' | 'deactivate' | 'unlock' | 'delete',
                      patient
                    );
                  }}
                  className="flex w-full items-center justify-between px-4 py-2 text-sm font-medium text-slate-600 transition-all hover:bg-cyan-50 hover:text-cyan-700"
                >
                  <span className={action.className}>{action.label}</span>
                  <ChevronRight className="h-3.5 w-3.5 text-slate-300" />
                </button>
              ))}
            </div>
          )}
        </div>
      </td>
    </motion.tr>
  );
}

// ============================================================================
// UNIFIED ACCOUNT ACTION MODAL
// ============================================================================

type AccountActionType = 'activate' | 'deactivate' | 'unlock';

interface AccountActionModalProps {
  type: AccountActionType;
  patient: Patient;
  inputValue: string;
  isSubmitting: boolean;
  onInputChange: (value: string) => void;
  onClose: () => void;
  onSubmit: () => void | Promise<void>;
}

const actionConfig = {
  deactivate: {
    title: 'Vô hiệu hóa tài khoản',
    description: 'Tài khoản sẽ không thể đăng nhập sau khi vô hiệu hóa.',
    inputLabel: 'Lý do vô hiệu hóa',
    inputRequired: true,
    inputPlaceholder: 'Ví dụ: Vi phạm điều khoản sử dụng, yêu cầu từ người dùng...',
    confirmText: 'Vô hiệu hóa',
    icon: XCircle,
    iconBg: 'bg-gradient-to-br from-rose-100 to-red-100',
    iconColor: 'text-rose-600',
    buttonGradient: 'from-rose-500 to-red-600',
    buttonShadow: 'shadow-rose-500/25',
    focusRing: 'focus:border-rose-500 focus:ring-rose-500/20',
  },
  activate: {
    title: 'Kích hoạt lại tài khoản',
    description: 'Tài khoản sẽ có thể đăng nhập và sử dụng bình thường.',
    inputLabel: 'Ghi chú (tùy chọn)',
    inputRequired: false,
    inputPlaceholder: 'Ví dụ: Đã xác minh thông tin, khôi phục theo yêu cầu...',
    confirmText: 'Kích hoạt lại',
    icon: Power,
    iconBg: 'bg-gradient-to-br from-emerald-100 to-green-100',
    iconColor: 'text-emerald-600',
    buttonGradient: 'from-emerald-500 to-green-600',
    buttonShadow: 'shadow-emerald-500/25',
    focusRing: 'focus:border-emerald-500 focus:ring-emerald-500/20',
  },
  unlock: {
    title: 'Mở khóa tài khoản',
    description: 'Tài khoản đang bị khóa do đăng nhập sai nhiều lần.',
    inputLabel: 'Lý do mở khóa',
    inputRequired: true,
    inputPlaceholder: 'Ví dụ: Đã xác minh danh tính chủ tài khoản...',
    confirmText: 'Mở khóa',
    icon: LockOpen,
    iconBg: 'bg-gradient-to-br from-blue-100 to-cyan-100',
    iconColor: 'text-blue-600',
    buttonGradient: 'from-blue-500 to-cyan-600',
    buttonShadow: 'shadow-blue-500/25',
    focusRing: 'focus:border-blue-500 focus:ring-blue-500/20',
  },
};

function AccountActionModal({
  type,
  patient,
  inputValue,
  isSubmitting,
  onInputChange,
  onClose,
  onSubmit,
}: AccountActionModalProps) {
  const config = actionConfig[type];
  const IconComponent = config.icon;

  const fullName =
    patient.fullName ||
    `${patient.firstName || ''} ${patient.lastName || ''}`.trim() ||
    'Bệnh nhân';

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 px-4 py-8 backdrop-blur-sm"
        onClick={(e) => {
          if (e.target === e.currentTarget && !isSubmitting) {
            onClose();
          }
        }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: 'spring', duration: 0.5, bounce: 0.3 }}
          className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl"
          role="dialog"
          aria-modal
        >
          {/* Header */}
          <div className="relative border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white px-6 py-5">
            <div className="flex items-start gap-4">
              <div
                className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${config.iconBg} ${config.iconColor} shadow-sm`}
              >
                <IconComponent className="h-6 w-6" />
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-lg font-semibold text-slate-900">{config.title}</h2>
                <p className="mt-0.5 text-sm text-slate-500">{config.description}</p>
              </div>
              <button
                onClick={onClose}
                disabled={isSubmitting}
                className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 disabled:opacity-50"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="px-6 py-5">
            {/* Patient Info Card */}
            <div className="mb-5 flex items-center gap-3 rounded-xl bg-slate-50 p-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 text-sm font-bold text-white shadow-md">
                {fullName.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-slate-900">{fullName}</p>
                <p className="text-xs text-slate-500">{patient.patientId}</p>
              </div>
              {patient.accountStatus && patient.accountStatus !== 'active' && (
                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                  {['deactivated', 'inactive'].includes(patient.accountStatus ?? '') && 'Vô hiệu'}
                  {patient.accountStatus === 'locked' && 'Đã khóa'}
                  {patient.accountStatus === 'pending_verification' && 'Chờ xác minh'}
                  {patient.accountStatus === 'suspended' && 'Tạm ngưng'}
                </span>
              )}
            </div>

            {/* Input Field */}
            <div>
              <label className="mb-2 flex items-center gap-1 text-sm font-medium text-slate-700">
                {config.inputLabel}
                {config.inputRequired && <span className="text-rose-500">*</span>}
              </label>
              <textarea
                value={inputValue}
                onChange={(e) => onInputChange(e.target.value)}
                rows={3}
                disabled={isSubmitting}
                className={`w-full resize-none rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm text-slate-700 transition-all placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:outline-none disabled:opacity-50 ${config.focusRing}`}
                placeholder={config.inputPlaceholder}
                autoFocus
              />
            </div>

            {/* Warning for deactivate */}
            {type === 'deactivate' && (
              <div className="mt-4 flex items-start gap-2 rounded-lg bg-amber-50 p-3 text-xs text-amber-800">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                <p>
                  Tất cả phiên đăng nhập của người dùng sẽ bị hủy bỏ và họ sẽ không thể truy cập hệ
                  thống cho đến khi được kích hoạt lại.
                </p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 border-t border-slate-100 bg-slate-50/50 px-6 py-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-600 shadow-sm transition-all hover:bg-slate-50 hover:shadow disabled:opacity-50"
            >
              Hủy bỏ
            </button>
            <button
              type="button"
              onClick={() => void onSubmit()}
              disabled={isSubmitting}
              className={`flex items-center gap-2 rounded-xl bg-gradient-to-r ${config.buttonGradient} px-5 py-2.5 text-sm font-semibold text-white shadow-lg ${config.buttonShadow} transition-all hover:shadow-xl hover:brightness-110 disabled:opacity-60`}
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <IconComponent className="h-4 w-4" />
              )}
              {config.confirmText}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

interface DeleteAccountModalProps {
  patient: Patient;
  reason: string;
  force: boolean;
  isSubmitting: boolean;
  onReasonChange: (value: string) => void;
  onForceChange: (value: boolean) => void;
  onClose: () => void;
  onConfirm: () => void;
}

function DeleteAccountModal({
  patient,
  reason,
  force,
  isSubmitting,
  onReasonChange,
  onForceChange,
  onClose,
  onConfirm,
}: DeleteAccountModalProps) {
  const fullName =
    patient.fullName ||
    `${patient.firstName || ''} ${patient.lastName || ''}`.trim() ||
    'Bệnh nhân';

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 px-4 py-8 backdrop-blur"
        onClick={(e) => {
          if (e.target === e.currentTarget && !isSubmitting) {
            onClose();
          }
        }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: 'spring', duration: 0.5, bounce: 0.25 }}
          className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl"
        >
          <div className="relative border-b border-rose-100 bg-gradient-to-r from-rose-50 to-white px-6 py-5">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-rose-500 to-red-600 text-white shadow-lg shadow-rose-500/30">
                <Trash2 className="h-6 w-6" />
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-lg font-semibold text-slate-900">Xóa tài khoản vĩnh viễn</h2>
                <p className="mt-0.5 text-sm text-slate-600">
                  Hành động này sẽ loại bỏ hoàn toàn tài khoản khỏi hệ thống Identity & Patient
                  Registry.
                </p>
              </div>
              <button
                onClick={onClose}
                disabled={isSubmitting}
                className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 disabled:opacity-50"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          <div className="space-y-5 px-6 py-5">
            <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 text-sm font-bold text-white shadow-md">
                {fullName.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-slate-900">{fullName}</p>
                <p className="text-xs text-slate-500">{patient.patientId || patient.userId}</p>
              </div>
              <span className="rounded-full bg-rose-100 px-2 py-0.5 text-xs font-medium text-rose-700">
                {patient.accountStatus || 'unknown'}
              </span>
            </div>

            <div className="rounded-xl border border-rose-200 bg-rose-50/70 p-4 text-sm text-rose-700">
              <p className="flex items-center gap-2 font-semibold">
                <AlertTriangle className="h-4 w-4" />
                Không thể hoàn tác
              </p>
              <p className="mt-1 text-xs text-rose-600">
                Tài khoản Supabase Auth, vai trò, phân quyền và toàn bộ thông tin liên quan sẽ bị
                xóa. Vui lòng chắc chắn rằng bạn đã xuất/backup dữ liệu cần thiết trước khi tiếp
                tục.
              </p>
            </div>

            <div>
              <label className="mb-2 flex items-center gap-1 text-sm font-medium text-slate-700">
                Lý do xóa tài khoản<span className="text-rose-500">*</span>
              </label>
              <textarea
                value={reason}
                onChange={(e) => onReasonChange(e.target.value)}
                rows={3}
                disabled={isSubmitting}
                className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm text-slate-700 transition-all placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-rose-500/30 focus:outline-none disabled:opacity-50"
                placeholder="Ví dụ: Yêu cầu xóa theo GDPR từ bệnh nhân..."
                autoFocus
              />
            </div>

            <label className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50/80 p-4 text-sm text-slate-700">
              <input
                type="checkbox"
                className="mt-1 h-4 w-4 rounded border-slate-300 text-rose-600 focus:ring-rose-500"
                checked={force}
                onChange={(e) => onForceChange(e.target.checked)}
                disabled={isSubmitting}
              />
              <div>
                <p className="font-semibold text-slate-900">Cho phép xóa khi chưa deactivate</p>
                <p className="text-xs text-slate-500">
                  Chỉ bật nếu bạn đã xác minh yêu cầu xóa hợp lệ (ví dụ: GDPR). Khi bật, hệ thống sẽ
                  bỏ qua bước deactivate bắt buộc và xóa ngay lập tức.
                </p>
              </div>
            </label>
          </div>

          <div className="flex items-center justify-end gap-3 border-t border-slate-100 bg-slate-50/60 px-6 py-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-600 shadow-sm transition-all hover:bg-slate-50 hover:shadow disabled:opacity-50"
            >
              Hủy bỏ
            </button>
            <button
              type="button"
              onClick={() => void onConfirm()}
              disabled={isSubmitting}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-rose-500/40 transition-all hover:shadow-xl hover:brightness-110 disabled:opacity-60"
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
              Xóa vĩnh viễn
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
