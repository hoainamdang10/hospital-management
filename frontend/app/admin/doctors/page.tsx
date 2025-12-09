'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { DashboardLayout } from '@/components/layout';
import {
  Search,
  Plus,
  Edit,
  Trash2,
  Eye,
  Loader2,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  Star,
  Mail,
  Phone,
  Stethoscope,
  Calendar,
  X,
  SlidersHorizontal,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';
import Link from 'next/link';
import { searchStaff, type Staff } from '@/lib/api/staff.service';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';

// ============================================================================
// TYPES
// ============================================================================
type StatusFilter = 'all' | 'active' | 'on_leave' | 'suspended';

// ============================================================================
// CONSTANTS
// ============================================================================
const statusOptions: { value: StatusFilter; label: string; color: string }[] = [
  { value: 'all', label: 'Tất cả', color: 'bg-slate-100 text-slate-700' },
  { value: 'active', label: 'Sẵn sàng', color: 'bg-emerald-100 text-emerald-700' },
  { value: 'on_leave', label: 'Nghỉ phép', color: 'bg-amber-100 text-amber-700' },
  { value: 'suspended', label: 'Tạm ngưng', color: 'bg-orange-100 text-orange-700' },
];

// Healthcare-themed avatar gradients - consistent with system colors
const avatarGradients = [
  'from-cyan-500 to-teal-600',      // Primary healthcare cyan
  'from-teal-500 to-emerald-600',   // Health green
  'from-sky-500 to-cyan-600',       // Trust blue
  'from-emerald-500 to-cyan-600',   // Medical green-cyan
  'from-cyan-600 to-blue-600',      // Deep cyan-blue
  'from-teal-400 to-cyan-500',      // Light teal
];

/**
 * Admin - Danh sách bác sĩ (Premium UI)
 */
export default function DoctorsListPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [doctors, setDoctors] = useState<Staff[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [showFilters, setShowFilters] = useState(false);

  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0,
  });

  // Stats - fetched separately to get accurate totals
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    onLeave: 0,
    suspended: 0,
    avgExperience: 0,
    specialtyDistribution: {} as Record<string, number>,
    experienceDistribution: {
      '0-5': 0,
      '6-10': 0,
      '11-20': 0,
      '20+': 0,
    },
  });

  // Fetch stats (separate from main doctor list)
  const fetchStats = async () => {
    try {
      // Make parallel calls to get total counts for each status
      // Also fetch more doctors for accurate avgExperience calculation
      const [allRes, activeRes, suspendedRes, onLeaveRes, expRes] = await Promise.allSettled([
        searchStaff({ staffType: 'doctor', limit: 1 }),
        searchStaff({ staffType: 'doctor', status: 'active', limit: 1 }),
        searchStaff({ staffType: 'doctor', status: 'suspended', limit: 1 }),
        searchStaff({ staffType: 'doctor', status: 'on_leave', limit: 1 }),
        searchStaff({ staffType: 'doctor', limit: 100 }), // For avgExperience calculation
      ]);

      const total = allRes.status === 'fulfilled' ? allRes.value?.data?.pagination?.total || 0 : 0;
      const active =
        activeRes.status === 'fulfilled' ? activeRes.value?.data?.pagination?.total || 0 : 0;
      const suspended =
        suspendedRes.status === 'fulfilled' ? suspendedRes.value?.data?.pagination?.total || 0 : 0;
      const onLeave =
        onLeaveRes.status === 'fulfilled' ? onLeaveRes.value?.data?.pagination?.total || 0 : 0;

      // Calculate average experience from larger sample
      let avgExperience = 0;
      const specialtyCounts: Record<string, number> = {};
      const experienceGroups = {
        '0-5': 0,
        '6-10': 0,
        '11-20': 0,
        '20+': 0,
      };

      if (expRes.status === 'fulfilled' && expRes.value?.data?.items?.length > 0) {
        const items = expRes.value.data.items;
        avgExperience = Math.round(
          items.reduce((sum: number, d: any) => sum + (d.yearsOfExperience || 0), 0) / items.length
        );

        items.forEach((doc: any) => {
          const specialization =
            doc.professionalInfo?.department ||
            doc.professionalInfo?.title ||
            'Khác';
          specialtyCounts[specialization] = (specialtyCounts[specialization] || 0) + 1;

          const years = doc.yearsOfExperience ?? 0;
          if (years <= 5) {
            experienceGroups['0-5'] += 1;
          } else if (years <= 10) {
            experienceGroups['6-10'] += 1;
          } else if (years <= 20) {
            experienceGroups['11-20'] += 1;
          } else {
            experienceGroups['20+'] += 1;
          }
        });
      }

      setStats({
        total,
        active,
        onLeave,
        suspended,
        avgExperience,
        specialtyDistribution: specialtyCounts,
        experienceDistribution: experienceGroups,
      });
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  // Fetch stats on mount
  useEffect(() => {
    fetchStats();
  }, []);

  // Fetch doctors
  const fetchDoctors = async (refresh = false) => {
    try {
      if (refresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      setError(null);

      // Don't search if only 1 character (backend validation)
      if (searchQuery.length === 1) {
        return;
      }

      const response = await searchStaff({
        staffType: 'doctor',
        searchTerm: searchQuery || undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        page: pagination.page,
        limit: pagination.limit,
      });

      if (response && response.success) {
        if (response.data && response.data.items) {
          setDoctors(response.data.items);
          setPagination(response.data.pagination);
          setError(null);
        } else if (response.data && Array.isArray(response.data.items)) {
          setDoctors([]);
          setPagination(
            response.data.pagination || { total: 0, page: 1, limit: 10, totalPages: 0 }
          );
          setError(null);
        } else {
          setError('Cấu trúc dữ liệu không hợp lệ');
        }
      } else {
        setError('Phản hồi từ server không hợp lệ');
      }

      if (refresh) {
        toast.success('Đã làm mới dữ liệu');
      }
    } catch (err: any) {
      console.error('Error fetching doctors:', err);
      if (err.response?.status !== 404) {
        setError(err.response?.data?.message || 'Không thể tải danh sách bác sĩ');
      } else {
        setError(null);
        setDoctors([]);
      }
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDoctors();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination.page, statusFilter]);

  // Debounced search effect
  useEffect(() => {
    if (searchQuery.length === 1) return;
    const timer = setTimeout(() => {
      if (searchQuery.length === 0 || searchQuery.length >= 2) {
        setPagination((prev) => ({ ...prev, page: 1 }));
        fetchDoctors();
      }
    }, 500);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery]);

  const handleSearchInput = (value: string) => {
    setSearchQuery(value);
  };

  const getAvatarGradient = (index: number) => {
    return avatarGradients[index % avatarGradients.length];
  };

  const getInitials = (name: string) => {
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return parts[parts.length - 1].charAt(0);
    }
    return name.charAt(0);
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
                <Stethoscope className="h-7 w-7 text-white" />
                {/* Subtle pulse effect */}
                <motion.div
                  className="absolute inset-0 rounded-2xl bg-cyan-400/20"
                  animate={{ scale: [1, 1.1, 1], opacity: [0.5, 0, 0.5] }}
                  transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                />
              </motion.div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 bg-clip-text text-transparent">
                  Quản lý Bác sĩ
                </h1>
                <p className="text-sm text-slate-500">
                  Quản lý đội ngũ y bác sĩ và thông tin chuyên môn
                </p>
              </div>
            </div>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
              className="flex items-center gap-3"
            >
              <button
                onClick={() => fetchDoctors(true)}
                disabled={isRefreshing}
                className="group flex items-center gap-2 rounded-xl border border-slate-200/80 bg-white/80 px-4 py-2.5 text-sm font-medium text-slate-600 shadow-sm backdrop-blur-sm transition-all duration-200 hover:border-cyan-300 hover:bg-white hover:text-cyan-600 hover:shadow-md disabled:opacity-50"
              >
                <RefreshCw className={`h-4 w-4 transition-transform duration-300 ${isRefreshing ? 'animate-spin' : 'group-hover:rotate-90'}`} />
                <span className="hidden sm:inline">Làm mới</span>
              </button>
              <Link
                href="/admin/doctors/add"
                className="group relative flex items-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-cyan-500 to-teal-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-cyan-500/25 transition-all duration-300 hover:shadow-cyan-500/40 hover:scale-[1.02]"
              >
                <span className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-500" />
                <Plus className="h-5 w-5 relative z-10" />
                <span className="relative z-10">Thêm bác sĩ</span>
              </Link>
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15, ease: 'easeOut' }}
          >
            <DoctorAnalyticsCard stats={stats} />
          </motion.div>

          {/* Error Message */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex items-center justify-between rounded-xl border border-red-200 bg-red-50 p-4"
              >
                <p className="text-sm font-medium text-red-800">{error}</p>
                <button
                  onClick={() => fetchDoctors()}
                  className="text-sm font-semibold text-red-600 hover:text-red-700 hover:underline"
                >
                  Thử lại
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Main Content Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, duration: 0.4, ease: 'easeOut' }}
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
                  placeholder="Tìm kiếm theo tên, email, SĐT..."
                  value={searchQuery}
                  onChange={(e) => handleSearchInput(e.target.value)}
                  className="block w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pr-4 pl-11 text-sm placeholder-slate-400 transition-all focus:border-cyan-500 focus:bg-white focus:ring-2 focus:ring-cyan-500/20 focus:outline-none"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              {/* Filters */}
              <div className="flex items-center gap-3">
                {/* Status Tabs */}
                <div className="flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 p-1">
                  {statusOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => {
                        setStatusFilter(option.value);
                        setPagination((prev) => ({ ...prev, page: 1 }));
                      }}
                      className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${statusFilter === option.value
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
                  className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition-all ${showFilters
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
                  <div className="grid gap-4 p-5 sm:grid-cols-3">
                    <div>
                      <label className="mb-1.5 block text-xs font-medium text-slate-600">
                        Chuyên khoa
                      </label>
                      <select className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 focus:outline-none">
                        <option value="">Tất cả chuyên khoa</option>
                        <option value="internal">Nội khoa</option>
                        <option value="surgery">Ngoại khoa</option>
                        <option value="pediatrics">Nhi khoa</option>
                        <option value="cardiology">Tim mạch</option>
                        <option value="dermatology">Da liễu</option>
                      </select>
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs font-medium text-slate-600">
                        Kinh nghiệm
                      </label>
                      <select className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 focus:outline-none">
                        <option value="">Tất cả</option>
                        <option value="0-5">0 - 5 năm</option>
                        <option value="5-10">5 - 10 năm</option>
                        <option value="10-20">10 - 20 năm</option>
                        <option value="20+">Trên 20 năm</option>
                      </select>
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs font-medium text-slate-600">
                        Sắp xếp theo
                      </label>
                      <select className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 focus:outline-none">
                        <option value="name">Tên A-Z</option>
                        <option value="experience">Kinh nghiệm</option>
                        <option value="rating">Đánh giá cao nhất</option>
                        <option value="fee">Giá khám</option>
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
                      Bác sĩ
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold tracking-wider text-slate-500 uppercase">
                      Chuyên khoa
                    </th>
                    <th className="hidden px-6 py-4 text-left text-xs font-semibold tracking-wider text-slate-500 uppercase md:table-cell">
                      Liên hệ
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold tracking-wider text-slate-500 uppercase">
                      Giá khám
                    </th>
                    <th className="hidden px-6 py-4 text-left text-xs font-semibold tracking-wider text-slate-500 uppercase lg:table-cell">
                      Đánh giá
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold tracking-wider text-slate-500 uppercase">
                      Trạng thái
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-semibold tracking-wider text-slate-500 uppercase" />
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
                  ) : !doctors || doctors.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-20 text-center">
                        <div className="mx-auto flex max-w-sm flex-col items-center justify-center">
                          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
                            <Search className="h-8 w-8 text-slate-400" />
                          </div>
                          <h3 className="mb-1 text-lg font-semibold text-slate-900">
                            Không tìm thấy bác sĩ
                          </h3>
                          <p className="text-center text-sm text-slate-500">
                            {searchQuery
                              ? `Không tìm thấy kết quả nào cho "${searchQuery}".`
                              : 'Chưa có bác sĩ nào trong hệ thống. Hãy thêm bác sĩ mới.'}
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    doctors.map((doctor, index) => (
                      <motion.tr
                        key={doctor.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.04, duration: 0.3, ease: 'easeOut' }}
                        onClick={() => router.push(`/admin/doctors/${doctor.staffId}`)}
                        className="group cursor-pointer transition-all duration-200 hover:bg-gradient-to-r hover:from-cyan-50/50 hover:to-teal-50/30"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <motion.div
                              whileHover={{ scale: 1.05 }}
                              transition={{ duration: 0.2 }}
                              className={`relative flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${getAvatarGradient(
                                index
                              )} text-lg font-bold text-white shadow-md shadow-cyan-500/20 ring-2 ring-white`}
                            >
                              {getInitials(doctor.personalInfo.fullName)}
                              {/* Online indicator for active status */}
                              {doctor.status === 'active' && (
                                <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white bg-emerald-500" />
                              )}
                            </motion.div>
                            <div className="ml-4">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-semibold text-slate-900 transition-colors duration-200 group-hover:text-cyan-700">
                                  {doctor.personalInfo.fullName}
                                </span>
                                <ExternalLink className="h-3 w-3 text-slate-300 opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
                              </div>
                              <div className="mt-0.5 flex items-center gap-1.5 text-xs text-slate-500">
                                <Calendar className="h-3 w-3 text-teal-500" />
                                <span className="transition-colors duration-200 group-hover:text-slate-700">
                                  {doctor.yearsOfExperience || 0} năm kinh nghiệm
                                </span>
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-wrap gap-1.5">
                            {doctor.professionalInfo?.department ? (
                              <span
                                className="inline-flex items-center rounded-lg border border-cyan-200/80 bg-gradient-to-r from-cyan-50 to-teal-50 px-2.5 py-1 text-xs font-medium text-cyan-700 transition-all duration-200 group-hover:shadow-sm"
                              >
                                {doctor.professionalInfo.department}
                              </span>
                            ) : (
                              <span className="text-xs text-slate-400 italic">Chưa cập nhật</span>
                            )}
                          </div>
                        </td>
                        <td className="hidden px-6 py-4 whitespace-nowrap md:table-cell">
                          <div className="flex flex-col gap-1.5">
                            <div className="flex items-center gap-2 text-sm text-slate-600">
                              <Mail className="h-3.5 w-3.5 text-cyan-500" />
                              <span
                                className="max-w-[160px] truncate transition-colors duration-200 group-hover:text-slate-900"
                                title={doctor.personalInfo.email}
                              >
                                {doctor.personalInfo.email || 'N/A'}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-slate-600">
                              <Phone className="h-3.5 w-3.5 text-teal-500" />
                              <span className="transition-colors duration-200 group-hover:text-slate-900">
                                {doctor.personalInfo.phoneNumber}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {doctor.consultationFee ? (
                            <span className="rounded-lg bg-gradient-to-r from-slate-100 to-slate-50 px-3 py-1.5 text-sm font-semibold text-slate-900 shadow-sm">
                              {new Intl.NumberFormat('vi-VN', {
                                style: 'currency',
                                currency: 'VND',
                              }).format(doctor.consultationFee)}
                            </span>
                          ) : (
                            <span className="rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700">
                              Chưa thiết lập
                            </span>
                          )}
                        </td>
                        <td className="hidden px-6 py-4 whitespace-nowrap lg:table-cell">
                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 transition-all duration-200 group-hover:shadow-sm">
                              <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                              <span className="text-xs font-bold text-amber-700">
                                {(4 + (doctor.id.charCodeAt(0) % 10) / 10).toFixed(1)}
                              </span>
                            </div>
                            <span className="text-xs text-slate-400">
                              ({((doctor.id.length * 15) % 100) + 20})
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <StatusBadge status={doctor.status} />
                        </td>
                        <td className="px-6 py-4 text-right text-sm font-medium whitespace-nowrap">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={(e) => e.stopPropagation()}
                                className="rounded-lg p-2 text-slate-400 transition-all duration-200 hover:bg-cyan-100 hover:text-cyan-600 hover:shadow-sm focus:ring-2 focus:ring-cyan-500/20 focus:outline-none"
                              >
                                <MoreVertical className="h-5 w-5" />
                              </motion.button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                              align="end"
                              className="w-48 rounded-xl border-slate-200 p-1 shadow-lg"
                            >
                              <DropdownMenuItem
                                asChild
                                className="cursor-pointer rounded-lg focus:bg-cyan-50 focus:text-cyan-700"
                              >
                                <Link
                                  href={`/admin/doctors/${doctor.staffId}`}
                                  className="flex items-center gap-2 px-3 py-2"
                                >
                                  <Eye className="h-4 w-4" />
                                  <span>Xem chi tiết</span>
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                asChild
                                className="cursor-pointer rounded-lg focus:bg-cyan-50 focus:text-cyan-700"
                              >
                                <Link
                                  href={`/admin/doctors/${doctor.staffId}?edit=true`}
                                  className="flex items-center gap-2 px-3 py-2"
                                >
                                  <Edit className="h-4 w-4" />
                                  <span>Chỉnh sửa</span>
                                </Link>
                              </DropdownMenuItem>
                              <div className="my-1 h-px bg-slate-100" />
                              <DropdownMenuItem className="flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-red-600 focus:bg-red-50 focus:text-red-700">
                                <Trash2 className="h-4 w-4" />
                                <span>Xóa bác sĩ</span>
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </motion.tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {!isLoading && doctors && doctors.length > 0 && (
              <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/50 px-6 py-4">
                <div className="text-sm text-slate-500">
                  Hiển thị{' '}
                  <span className="font-semibold text-slate-900">
                    {(pagination.page - 1) * pagination.limit + 1}
                  </span>{' '}
                  -{' '}
                  <span className="font-semibold text-slate-900">
                    {Math.min(pagination.page * pagination.limit, pagination.total)}
                  </span>{' '}
                  trong <span className="font-semibold text-slate-900">{pagination.total}</span> bác
                  sĩ
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
                    disabled={pagination.page === 1}
                    className="rounded-lg border border-slate-200 bg-white p-2 text-slate-600 shadow-sm transition-all hover:bg-slate-50 hover:text-cyan-600 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>

                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                      let pageNum = i + 1;
                      if (pagination.totalPages > 5 && pagination.page > 3) {
                        pageNum = pagination.page - 2 + i;
                        if (pageNum > pagination.totalPages)
                          pageNum -= pageNum - pagination.totalPages;
                      }

                      return (
                        <button
                          key={pageNum}
                          onClick={() => setPagination({ ...pagination, page: pageNum })}
                          className={`h-8 w-8 rounded-lg text-sm font-medium transition-all ${pageNum === pagination.page
                            ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-md'
                            : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-cyan-600'
                            }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>

                  <button
                    onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
                    disabled={pagination.page === pagination.totalPages}
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
    </DashboardLayout>
  );
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

interface DoctorAnalyticsCardProps {
  stats: {
    total: number;
    active: number;
    onLeave: number;
    suspended: number;
    avgExperience: number;
    specialtyDistribution: Record<string, number>;
    experienceDistribution: Record<'0-5' | '6-10' | '11-20' | '20+', number>;
  };
}

interface DonutLegendItem {
  label: string;
  value: number;
  color: string;
}

// Healthcare-themed color palette
const specialtyColors = ['#0891B2', '#14B8A6', '#0D9488', '#0EA5E9', '#0E7490'];  // cyan, teal
const experienceColors = ['#22D3EE', '#14B8A6', '#0891B2', '#0E7490'];  // light to dark cyan-teal

type DoctorAnalyticsTab = 'status' | 'specialty' | 'experience';

function DoctorAnalyticsCard({ stats }: DoctorAnalyticsCardProps) {
  const [tab, setTab] = useState<DoctorAnalyticsTab>('status');
  const specialtyEntries = Object.entries(stats.specialtyDistribution || {});
  const sortedSpecialties = specialtyEntries.sort((a, b) => b[1] - a[1]);
  const topSpecialties = sortedSpecialties.slice(0, 4);
  const otherCount = sortedSpecialties.slice(4).reduce((sum, [, value]) => sum + value, 0);
  if (otherCount > 0) {
    topSpecialties.push(['Khác', otherCount]);
  }
  const specialtyLegend: DonutLegendItem[] = (
    topSpecialties.length > 0 ? topSpecialties : [['Chưa có dữ liệu', 0] as [string, number]]
  ).map(([label, value], index) => ({
    label: String(label),
    value: Number(value),
    color: specialtyColors[index % specialtyColors.length],
  }));

  const experienceLegend: DonutLegendItem[] = [
    {
      label: '0 - 5 năm',
      value: stats.experienceDistribution['0-5'] || 0,
      color: experienceColors[0],
    },
    {
      label: '6 - 10 năm',
      value: stats.experienceDistribution['6-10'] || 0,
      color: experienceColors[1],
    },
    {
      label: '11 - 20 năm',
      value: stats.experienceDistribution['11-20'] || 0,
      color: experienceColors[2],
    },
    {
      label: 'Trên 20 năm',
      value: stats.experienceDistribution['20+'] || 0,
      color: experienceColors[3],
    },
  ];

  const accountedStatus = stats.active + stats.onLeave + stats.suspended;
  const remainingStatus = Math.max(stats.total - accountedStatus, 0);
  const statusLegend: DonutLegendItem[] = [
    { label: 'Đang hoạt động', value: stats.active, color: '#0891B2' },  // cyan-600
    { label: 'Tạm nghỉ', value: stats.onLeave, color: '#F59E0B' },
    { label: 'Đã khóa', value: stats.suspended, color: '#EF4444' },
  ];
  if (remainingStatus > 0) {
    statusLegend.push({ label: 'Khác', value: remainingStatus, color: '#94A3B8' });
  }

  const legendByTab: Record<DoctorAnalyticsTab, DonutLegendItem[]> = {
    status: statusLegend,
    specialty: specialtyLegend,
    experience: experienceLegend,
  };

  const titleByTab: Record<DoctorAnalyticsTab, { title: string; subtitle: string }> = {
    status: {
      title: 'Trạng thái đội ngũ',
      subtitle: 'Theo trạng thái hiện tại',
    },
    specialty: {
      title: 'Phân bố chuyên khoa',
      subtitle: 'Mẫu chuyên khoa nổi bật',
    },
    experience: {
      title: 'Thâm niên bác sĩ',
      subtitle: 'Mẫu kinh nghiệm (tối đa 100 bác sĩ)',
    },
  };

  const tabs: { key: DoctorAnalyticsTab; label: string }[] = [
    { key: 'status', label: 'Trạng thái' },
    { key: 'specialty', label: 'Chuyên khoa' },
    { key: 'experience', label: 'Kinh nghiệm' },
  ];

  const activeLegend = legendByTab[tab];
  const distributionTotal =
    tab === 'status' ? stats.total : activeLegend.reduce((sum, item) => sum + item.value, 0);
  const hasData = tab === 'status' ? stats.total > 0 : activeLegend.some((item) => item.value > 0);
  const highlight = hasData
    ? activeLegend.reduce(
      (prev, curr) => (curr.value > prev.value ? curr : prev),
      activeLegend[0] || { label: 'Chưa có dữ liệu', value: 0, color: '#94A3B8' }
    )
    : { label: 'Chưa có dữ liệu', value: 0, color: '#94A3B8' };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
      className="group rounded-2xl border border-slate-200/80 bg-gradient-to-br from-white via-white to-cyan-50/30 p-6 shadow-sm transition-all duration-300 hover:shadow-md hover:shadow-cyan-100/50"
    >
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">{titleByTab[tab].title}</p>
          <motion.p
            key={distributionTotal}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-3xl font-bold text-transparent"
          >
            {distributionTotal || 0}
          </motion.p>
          <p className="text-xs text-slate-400">{titleByTab[tab].subtitle}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {tab === 'experience' && (
            <span className="flex items-center gap-2 rounded-full bg-gradient-to-r from-cyan-50 to-teal-50 px-3 py-1.5 text-xs font-semibold text-cyan-700 shadow-sm">
              <span className="h-2 w-2 rounded-full bg-cyan-500 animate-pulse" />
              Kinh nghiệm TB: {stats.avgExperience || 0} năm
            </span>
          )}
          <div className="rounded-full border border-slate-200/80 bg-slate-50/80 p-1 text-xs font-semibold text-slate-600 backdrop-blur-sm">
            <div className="flex rounded-full bg-white shadow-sm">
              {tabs.map((item) => (
                <motion.button
                  key={item.key}
                  onClick={() => setTab(item.key)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`relative px-3 py-1.5 transition-all duration-200 ${tab === item.key
                    ? 'rounded-full bg-gradient-to-r from-cyan-500 to-teal-500 text-white shadow-md shadow-cyan-500/30'
                    : 'text-slate-500 hover:text-slate-700'
                    }`}
                >
                  {item.label}
                </motion.button>
              ))}
            </div>
          </div>
        </div>
      </div>
      <p className="mt-2 text-xs text-slate-500">
        Nhóm chiếm ưu thế: {highlight.label} ({highlight.value}{' '}
        {tab === 'status' ? 'bác sĩ' : 'mẫu'})
      </p>
      <div className="mt-6 flex flex-col gap-6 md:flex-row">
        <div className="relative flex items-center justify-center">
          <DoctorDonutVisualization
            items={hasData ? activeLegend : []}
            total={tab === 'status' ? stats.total : distributionTotal}
          />
          <div className="absolute text-center">
            <p className="text-3xl font-bold text-slate-900">{distributionTotal || 0}</p>
            <p className="text-xs text-slate-500">
              {tab === 'status' ? 'Tổng số bác sĩ' : 'Bác sĩ trong mẫu'}
            </p>
          </div>
        </div>
        <div className="flex-1 space-y-3">
          {hasData ? (
            activeLegend.map((item) => {
              const baseTotal = tab === 'status' ? stats.total : distributionTotal;
              const percent = baseTotal > 0 ? (item.value / baseTotal) * 100 : 0;
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
            })
          ) : (
            <p className="text-sm text-slate-500">Chưa có đủ dữ liệu để thống kê.</p>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function DoctorDonutVisualization({ items, total }: { items: DonutLegendItem[]; total: number }) {
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
      {total > 0 &&
        items.map((item) => {
          const segment = (item.value / total) * circumference;
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

interface StatusBadgeProps {
  status: string;
}

function StatusBadge({ status }: StatusBadgeProps) {
  const config = {
    active: {
      bg: 'bg-emerald-50',
      text: 'text-emerald-700',
      border: 'border-emerald-200',
      dot: 'bg-emerald-500',
      label: 'Sẵn sàng',
    },
    suspended: {
      bg: 'bg-orange-50',
      text: 'text-orange-700',
      border: 'border-orange-200',
      dot: 'bg-orange-500',
      label: 'Tạm ngưng',
    },
    on_leave: {
      bg: 'bg-amber-50',
      text: 'text-amber-700',
      border: 'border-amber-200',
      dot: 'bg-amber-500',
      label: 'Nghỉ phép',
    },
    locked: {
      bg: 'bg-red-50',
      text: 'text-red-700',
      border: 'border-red-200',
      dot: 'bg-red-500',
      label: 'Đã khóa',
    },
    inactive: {
      bg: 'bg-slate-100',
      text: 'text-slate-700',
      border: 'border-slate-200',
      dot: 'bg-slate-500',
      label: 'Ngừng hoạt động',
    },
  };

  const cfg = config[status as keyof typeof config] || config.inactive;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${cfg.bg} ${cfg.text} ${cfg.border}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}
