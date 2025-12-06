'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Plus,
  Shield,
  UserCog,
  Loader2,
  MoreHorizontal,
  CheckCircle2,
  AlertTriangle,
  Lock,
  RefreshCw,
  Users,
  Mail,
  Phone,
  Calendar,
  Eye,
  Trash2,
  Activity,
  Sparkles,
} from 'lucide-react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useDebounce } from '@/hooks/useDebounce';
import { cn } from '@/lib/utils';
import { listAdminUsers, type AdminUser } from '@/lib/api/admin-users.service';
import {
  deactivateAccount,
  reactivateAccount,
  unlockAccount,
} from '@/lib/api/admin-accounts.service';
import { toast } from 'sonner';
import { DashboardLayout } from '@/components/layout';

type StatusFilter = 'all' | 'active' | 'inactive';
type AccentVariant = 'cyan' | 'emerald' | 'amber';

const STATUS_OPTIONS: Array<{ value: StatusFilter; label: string }> = [
  { value: 'all', label: 'Tất cả trạng thái' },
  { value: 'active', label: 'Đang hoạt động' },
  { value: 'inactive', label: 'Đã vô hiệu hóa' },
];

const ITEMS_PER_PAGE = 10;

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: 'spring' as const,
      stiffness: 300,
      damping: 30,
    },
  },
};

export default function AdminStaffPage() {
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [stats, setStats] = useState({ total: 0, active: 0, inactive: 0 });
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: ITEMS_PER_PAGE,
    total: 0,
    totalPages: 1,
  });

  const debouncedSearch = useDebounce(searchTerm, 400);

  const fetchAdmins = useCallback(
    async (options: { refresh?: boolean } = {}) => {
      setError(null);
      if (options.refresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }

      try {
        const response = await listAdminUsers({
          page: currentPage,
          limit: ITEMS_PER_PAGE,
          search: debouncedSearch,
          status: statusFilter,
        });

        setAdmins(response.users || []);
        setPagination({
          page: response.pagination.page,
          limit: response.pagination.limit,
          total: response.pagination.total,
          totalPages: Math.max(1, response.pagination.totalPages),
        });
      } catch (err) {
        console.error('Failed to fetch admins', err);
        setError('Không thể tải danh sách admin');
        toast.error('Không thể tải danh sách admin');
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [currentPage, debouncedSearch, statusFilter]
  );

  const fetchStats = useCallback(async () => {
    try {
      const [totalRes, activeRes] = await Promise.all([
        listAdminUsers({ page: 1, limit: 1, status: 'all' }),
        listAdminUsers({ page: 1, limit: 1, status: 'active' }),
      ]);

      const total = totalRes.pagination.total;
      const active = activeRes.pagination.total;
      setStats({
        total,
        active,
        inactive: Math.max(0, total - active),
      });
    } catch (err) {
      console.error('Failed to fetch admin stats', err);
    }
  }, []);

  useEffect(() => {
    fetchAdmins();
  }, [fetchAdmins]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const handleDeactivate = async (admin: AdminUser) => {
    if (!window.confirm(`Vô hiệu hóa quyền truy cập của ${admin.fullName}?`)) {
      return;
    }
    setActionLoading(admin.id);
    try {
      await deactivateAccount({
        userId: admin.id,
        reason: 'Deactivated from admin management page',
        terminateSessions: true,
      });
      toast.success('Đã vô hiệu hóa tài khoản admin');
      await Promise.all([fetchAdmins({ refresh: true }), fetchStats()]);
    } catch (err) {
      console.error('Deactivate admin failed', err);
      toast.error('Không thể vô hiệu hóa admin');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReactivate = async (admin: AdminUser) => {
    setActionLoading(admin.id);
    try {
      await reactivateAccount({
        userId: admin.id,
        reason: 'Reactivated from admin management page',
      });
      toast.success('Đã kích hoạt lại admin');
      await Promise.all([fetchAdmins({ refresh: true }), fetchStats()]);
    } catch (err) {
      console.error('Reactivate admin failed', err);
      toast.error('Không thể kích hoạt lại admin');
    } finally {
      setActionLoading(null);
    }
  };

  const handleUnlock = async (admin: AdminUser) => {
    setActionLoading(admin.id);
    try {
      await unlockAccount({
        userId: admin.id,
        reason: 'Unlock from admin management page',
      });
      toast.success('Đã mở khóa tài khoản admin');
      await fetchAdmins({ refresh: true });
    } catch (err) {
      console.error('Unlock admin failed', err);
      toast.error('Không thể mở khóa admin');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRefresh = () => {
    fetchAdmins({ refresh: true });
    fetchStats();
  };

  const paginationInfo = useMemo(() => {
    const start = (pagination.page - 1) * pagination.limit + 1;
    const end = Math.min(pagination.page * pagination.limit, pagination.total);
    return {
      start: pagination.total === 0 ? 0 : start,
      end: pagination.total === 0 ? 0 : end,
    };
  }, [pagination]);

  return (
    <DashboardLayout>
      <motion.div
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className="space-y-8"
      >
        {/* Header Section */}
        <motion.div
          variants={itemVariants}
          className="flex flex-wrap items-start justify-between gap-4"
        >
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-gradient-to-br from-cyan-500 to-teal-600 shadow-lg shadow-cyan-500/25">
                <Users className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-slate-900">
                  Quản lý quản trị viên
                </h1>
                <p className="text-slate-500">
                  Theo dõi và quản trị các tài khoản admin hệ thống
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button
                variant="outline"
                onClick={handleRefresh}
                disabled={isLoading || isRefreshing}
                className="gap-2 border-slate-200 hover:bg-slate-50 hover:border-slate-300"
              >
                {isRefreshing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
                Làm mới
              </Button>
            </motion.div>
            <Link href="/admin/staff/add?role=admin">
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button className="gap-2 bg-gradient-to-r from-cyan-500 to-teal-600 hover:from-cyan-600 hover:to-teal-700 shadow-lg shadow-cyan-500/25">
                  <Plus className="h-4 w-4" />
                  Thêm admin
                </Button>
              </motion.div>
            </Link>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <motion.div variants={containerVariants} className="grid gap-6 md:grid-cols-3">
          <StatCard
            title="Tổng quản trị viên"
            value={stats.total}
            subtitle="Tất cả tài khoản admin"
            icon={<Shield className="h-5 w-5" />}
            accent="cyan"
            index={0}
          />
          <StatCard
            title="Đang hoạt động"
            value={stats.active}
            subtitle="Có quyền đăng nhập"
            icon={<CheckCircle2 className="h-5 w-5" />}
            accent="emerald"
            index={1}
          />
          <StatCard
            title="Đã vô hiệu hóa"
            value={stats.inactive}
            subtitle="Cần kích hoạt lại"
            icon={<AlertTriangle className="h-5 w-5" />}
            accent="amber"
            index={2}
          />
        </motion.div>

        {/* Search and Filter Section */}
        <motion.div
          variants={itemVariants}
          className="flex flex-wrap items-center gap-4"
        >
          <div className="relative flex-1 min-w-[280px]">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Tìm kiếm theo tên, email, số điện thoại..."
              className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-12 pr-4 text-slate-700 placeholder:text-slate-400 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 transition-all"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value as StatusFilter);
              setCurrentPage(1);
            }}
            className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 cursor-pointer transition-all"
          >
            {STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </motion.div>

        {/* Admin Table Card */}
        <motion.div
          variants={itemVariants}
          className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white/80 backdrop-blur-sm shadow-xl shadow-slate-200/40"
        >
          {/* Gradient accent line */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-500 via-teal-500 to-emerald-500" />

          {/* Card Header */}
          <div className="border-b border-slate-100 px-6 py-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gradient-to-br from-cyan-500 to-teal-600 shadow-lg shadow-cyan-500/20">
                  <UserCog className="h-4 w-4 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">
                    Danh sách quản trị viên
                  </h2>
                  <p className="text-sm text-slate-500">
                    {pagination.total} tài khoản quản trị trong hệ thống
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-cyan-50 text-cyan-700 text-xs font-medium border border-cyan-100">
                  <Activity className="h-3 w-3" />
                  Real-time
                </span>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100">
              <thead className="bg-slate-50/80">
                <tr>
                  <TableHead>Quản trị viên</TableHead>
                  <TableHead>Liên hệ</TableHead>
                  <TableHead>Trạng thái & Vai trò</TableHead>
                  <TableHead>Hoạt động</TableHead>
                  <TableHead className="text-right">Thao tác</TableHead>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                <AnimatePresence mode="wait">
                  {isLoading ? (
                    <motion.tr
                      key="loading"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      <td colSpan={5} className="py-20 text-center">
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                          className="inline-block"
                        >
                          <Loader2 className="h-8 w-8 text-cyan-500" />
                        </motion.div>
                        <p className="mt-3 text-sm text-slate-500">
                          Đang tải danh sách quản trị viên...
                        </p>
                      </td>
                    </motion.tr>
                  ) : admins.length === 0 ? (
                    <motion.tr
                      key="empty"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      <td colSpan={5} className="py-20 text-center">
                        <div className="flex flex-col items-center gap-3">
                          <div className="p-4 rounded-full bg-slate-100">
                            <UserCog className="h-10 w-10 text-slate-400" />
                          </div>
                          <div>
                            <p className="font-medium text-slate-900">
                              {error ?? 'Không tìm thấy quản trị viên nào'}
                            </p>
                            <p className="text-sm text-slate-500 mt-1">
                              Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm
                            </p>
                          </div>
                        </div>
                      </td>
                    </motion.tr>
                  ) : (
                    admins.map((admin, index) => (
                      <AdminRow
                        key={admin.id}
                        admin={admin}
                        index={index}
                        actionLoading={actionLoading === admin.id}
                        onDeactivate={() => handleDeactivate(admin)}
                        onReactivate={() => handleReactivate(admin)}
                        onUnlock={() => handleUnlock(admin)}
                      />
                    ))
                  )}
                </AnimatePresence>
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex flex-col gap-4 border-t border-slate-100 px-6 py-4 text-sm text-slate-600 md:flex-row md:items-center md:justify-between bg-slate-50/50">
            <p>
              Hiển thị{' '}
              <span className="font-semibold text-slate-900">
                {paginationInfo.start} - {paginationInfo.end}
              </span>{' '}
              trên tổng số{' '}
              <span className="font-semibold text-slate-900">{pagination.total}</span>{' '}
              quản trị viên
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.page <= 1}
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                className="hover:bg-slate-100"
              >
                Trước
              </Button>
              <div className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white border border-slate-200">
                <span className="text-slate-900 font-medium">{pagination.page}</span>
                <span className="text-slate-400">/</span>
                <span className="text-slate-600">{pagination.totalPages}</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.page >= pagination.totalPages}
                onClick={() =>
                  setCurrentPage((prev) => Math.min(pagination.totalPages, prev + 1))
                }
                className="hover:bg-slate-100"
              >
                Tiếp
              </Button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </DashboardLayout>
  );
}

function StatCard({
  title,
  value,
  subtitle,
  icon,
  accent,
  index,
}: {
  title: string;
  value: number;
  subtitle: string;
  icon: React.ReactNode;
  accent: AccentVariant;
  index: number;
}) {
  const gradientMap: Record<AccentVariant, string> = {
    cyan: 'from-cyan-500 to-teal-600',
    emerald: 'from-emerald-500 to-teal-500',
    amber: 'from-amber-500 to-orange-500',
  };

  const glowMap: Record<AccentVariant, string> = {
    cyan: 'shadow-cyan-500/25',
    emerald: 'shadow-emerald-500/25',
    amber: 'shadow-amber-500/25',
  };

  const bgGlowMap: Record<AccentVariant, string> = {
    cyan: 'bg-cyan-500/5',
    emerald: 'bg-emerald-500/5',
    amber: 'bg-amber-500/5',
  };

  return (
    <motion.div
      variants={itemVariants}
      whileHover={{ y: -4, scale: 1.02 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      className={cn(
        'relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white/80 backdrop-blur-sm p-6 cursor-pointer',
        'shadow-lg hover:shadow-xl transition-shadow duration-300',
        bgGlowMap[accent]
      )}
    >
      {/* Accent line */}
      <div
        className={cn(
          'absolute top-0 left-0 right-0 h-1 bg-gradient-to-r',
          gradientMap[accent]
        )}
      />

      {/* Decorative background circle */}
      <div
        className={cn(
          'absolute -right-6 -bottom-6 h-28 w-28 rounded-full opacity-10',
          `bg-gradient-to-br ${gradientMap[accent]}`
        )}
      />

      <div className="relative flex items-center justify-between">
        <div className="space-y-3">
          <p className="text-sm text-slate-500 font-medium">{subtitle}</p>
          <p className="text-4xl font-bold text-slate-900">{value}</p>
          <p className="text-sm font-semibold text-slate-700">{title}</p>
        </div>
        <motion.div
          whileHover={{ scale: 1.1, rotate: 5 }}
          className={cn(
            'rounded-2xl p-4 text-white shadow-lg',
            `bg-gradient-to-br ${gradientMap[accent]}`,
            glowMap[accent]
          )}
        >
          {icon}
        </motion.div>
      </div>
    </motion.div>
  );
}

function AdminRow({
  admin,
  index,
  actionLoading,
  onDeactivate,
  onReactivate,
  onUnlock,
}: {
  admin: AdminUser;
  index: number;
  actionLoading: boolean;
  onDeactivate: () => void;
  onReactivate: () => void;
  onUnlock: () => void;
}) {
  const statusStyles = admin.isActive
    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
    : 'bg-rose-50 text-rose-700 border border-rose-200';

  const formattedLastLogin = admin.lastLoginAt
    ? format(new Date(admin.lastLoginAt), 'HH:mm dd/MM/yyyy', { locale: vi })
    : 'Chưa đăng nhập';

  const createdAt = format(new Date(admin.createdAt), 'dd/MM/yyyy', { locale: vi });

  return (
    <motion.tr
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, type: 'spring', stiffness: 300 }}
      className="group hover:bg-slate-50/80 transition-colors cursor-pointer"
    >
      <td className="px-6 py-5">
        <div className="flex items-center gap-4">
          <motion.div
            whileHover={{ scale: 1.1, rotate: 5 }}
            className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-teal-600 text-lg font-semibold text-white shadow-lg shadow-cyan-500/25"
          >
            {admin.fullName?.charAt(0) ?? admin.email.charAt(0)}
          </motion.div>
          <div>
            <p className="font-semibold text-slate-900 group-hover:text-cyan-700 transition-colors">
              {admin.fullName || 'Chưa cập nhật'}
            </p>
            <div className="flex items-center gap-1.5 text-sm text-slate-500">
              <Mail className="h-3.5 w-3.5" />
              <span>{admin.email}</span>
            </div>
          </div>
        </div>
      </td>
      <td className="px-6 py-5">
        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5 text-sm text-slate-600">
            <Phone className="h-3.5 w-3.5 text-slate-400" />
            <span>{admin.phoneNumber || 'Chưa cập nhật'}</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <Calendar className="h-3 w-3" />
            <span>Tạo: {createdAt}</span>
          </div>
        </div>
      </td>
      <td className="px-6 py-5">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${statusStyles}`}
          >
            {admin.isActive ? (
              <CheckCircle2 className="h-3 w-3" />
            ) : (
              <AlertTriangle className="h-3 w-3" />
            )}
            {admin.isActive ? 'Đang hoạt động' : 'Đã vô hiệu hóa'}
          </span>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600 border border-slate-200">
            {admin.roles.join(', ').toUpperCase()}
          </span>
          <span
            className={cn(
              'rounded-full px-3 py-1 text-xs font-medium border',
              admin.isEmailVerified
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-amber-50 text-amber-700 border-amber-200'
            )}
          >
            {admin.isEmailVerified ? '✓ Email xác minh' : '! Chưa xác minh'}
          </span>
        </div>
      </td>
      <td className="px-6 py-5">
        <div className="flex items-center gap-1.5 text-sm text-slate-600">
          <Activity className="h-3.5 w-3.5 text-slate-400" />
          <span>{formattedLastLogin}</span>
        </div>
      </td>
      <td className="px-6 py-5 text-right">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 hover:bg-slate-100 rounded-lg"
            >
              {actionLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <MoreHorizontal className="h-4 w-4" />
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel className="text-xs text-slate-500">
              Thao tác
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="gap-2 cursor-pointer">
              <Eye className="h-4 w-4" />
              Xem chi tiết
            </DropdownMenuItem>
            {admin.isActive ? (
              <DropdownMenuItem
                onClick={onDeactivate}
                className="gap-2 cursor-pointer text-amber-600 focus:text-amber-700 focus:bg-amber-50"
              >
                <AlertTriangle className="h-4 w-4" />
                Vô hiệu hóa
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem
                onClick={onReactivate}
                className="gap-2 cursor-pointer text-emerald-600 focus:text-emerald-700 focus:bg-emerald-50"
              >
                <CheckCircle2 className="h-4 w-4" />
                Kích hoạt lại
              </DropdownMenuItem>
            )}
            <DropdownMenuItem
              onClick={onUnlock}
              className="gap-2 cursor-pointer"
            >
              <Lock className="h-4 w-4" />
              Mở khóa đăng nhập
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </td>
    </motion.tr>
  );
}

function TableHead({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <th
      className={cn(
        'px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500',
        className
      )}
    >
      {children}
    </th>
  );
}
