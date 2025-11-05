import { useState } from "react";
import { cn } from "../ui/utils";
import { Button } from "../ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { useAuth } from "../auth/AuthContext";
import { ThemeToggle } from "../common/ThemeToggle";
import { NotificationDropdown } from "../communication/NotificationSystem";
import {
  Heart,
  LayoutDashboard,
  Users,
  UserPlus,
  Calendar,
  FileText,
  Pill,
  CreditCard,
  Settings,
  BarChart3,
  LogOut,
  ChevronLeft,
  Shield,
  UserCheck,
  Stethoscope,
  Database,
  Activity,
  Clock,
  Wrench,
} from "lucide-react";

interface SidebarProps {
  currentPage: string;
  onPageChange: (page: string) => void;
}

export function Sidebar({ currentPage, onPageChange }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const { user, logout } = useAuth();

  const getMenuItems = () => {
    const baseItems = [
      { id: "dashboard", label: "Tổng quan", icon: LayoutDashboard },
    ];

    switch (user?.role) {
      case "SUPERADMIN":
        return [
          ...baseItems,
          { id: "users", label: "Quản lý người dùng", icon: Users },
          { id: "doctors", label: "Quản lý bác sĩ", icon: Stethoscope },
          { id: "patients", label: "Quản lý bệnh nhân", icon: UserPlus },
          { id: "appointments", label: "Lịch hẹn", icon: Calendar },
          { id: "medical-records", label: "Hồ sơ bệnh án", icon: FileText },
          { id: "prescriptions", label: "Đơn thuốc", icon: Pill },
          { id: "billing", label: "Thanh toán", icon: CreditCard },
          { id: "staff-schedule", label: "Lịch nhân viên", icon: Clock },
          { id: "equipment", label: "Thiết bị y tế", icon: Wrench },
          { id: "reports", label: "Báo cáo", icon: BarChart3 },
          { id: "database", label: "Cơ sở dữ liệu", icon: Database },
          { id: "settings", label: "Cài đặt", icon: Settings },
        ];

      case "ADMIN":
        return [
          ...baseItems,
          { id: "users", label: "Quản lý người dùng", icon: Users },
          { id: "doctors", label: "Quản lý bác sĩ", icon: Stethoscope },
          { id: "patients", label: "Quản lý bệnh nhân", icon: UserPlus },
          { id: "appointments", label: "Lịch hẹn", icon: Calendar },
          { id: "medical-records", label: "Hồ sơ bệnh án", icon: FileText },
          { id: "prescriptions", label: "Đơn thuốc", icon: Pill },
          { id: "billing", label: "Thanh toán", icon: CreditCard },
          { id: "staff-schedule", label: "Lịch nhân viên", icon: Clock },
          { id: "equipment", label: "Thiết bị y tế", icon: Wrench },
          { id: "reports", label: "Báo cáo", icon: BarChart3 },
          { id: "settings", label: "Cài đặt", icon: Settings },
        ];

      case "DOCTOR":
        return [
          ...baseItems,
          { id: "patients", label: "Bệnh nhân của tôi", icon: UserPlus },
          { id: "appointments", label: "Lịch khám", icon: Calendar },
          { id: "medical-records", label: "Hồ sơ bệnh án", icon: FileText },
          { id: "prescriptions", label: "Đơn thuốc", icon: Pill },
          { id: "schedule", label: "Lịch làm việc", icon: Activity },
          { id: "settings", label: "Cài đặt", icon: Settings },
        ];

      case "PATIENT":
        return [
          ...baseItems,
          { id: "appointments", label: "Lịch hẹn", icon: Calendar },
          { id: "medical-records", label: "Hồ sơ khám", icon: FileText },
          { id: "prescriptions", label: "Đơn thuốc", icon: Pill },
          { id: "billing", label: "Thanh toán", icon: CreditCard },
          { id: "doctors", label: "Tìm bác sĩ", icon: Stethoscope },
          { id: "settings", label: "Cài đặt", icon: Settings },
        ];

      case "RECEPTIONIST":
        return [
          ...baseItems,
          { id: "appointments", label: "Quản lý lịch hẹn", icon: Calendar },
          { id: "patients", label: "Check-in bệnh nhân", icon: UserCheck },
          { id: "queue", label: "Hàng đợi", icon: Users },
          { id: "billing", label: "Thanh toán", icon: CreditCard },
          { id: "reports", label: "Báo cáo", icon: BarChart3 },
          { id: "settings", label: "Cài đặt", icon: Settings },
        ];

      case "STAFF":
        return [
          ...baseItems,
          { id: "patients", label: "Thông tin bệnh nhân", icon: UserPlus },
          { id: "appointments", label: "Lịch hẹn", icon: Calendar },
          { id: "reports", label: "Báo cáo", icon: BarChart3 },
          { id: "settings", label: "Cài đặt", icon: Settings },
        ];

      default:
        return baseItems;
    }
  };

  const menuItems = getMenuItems();

  return (
    <div
      className={cn(
        "bg-white/90 dark:bg-gray-800/90 backdrop-blur-md border-r border-blue-200 dark:border-gray-700 flex flex-col h-full transition-all duration-300 shadow-lg",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Header */}
      <div className="p-4 border-b border-blue-200 dark:border-gray-700 bg-gradient-to-r from-blue-600 to-cyan-600 dark:from-blue-700 dark:to-cyan-700">
        <div className="flex items-center justify-between">
          {!collapsed && (
            <div className="flex items-center space-x-2">
              <Heart className="h-8 w-8 text-white" />
              <div>
                <h2 className="font-semibold text-white">Bệnh viện</h2>
                <p className="text-xs text-blue-100">Hệ thống quản lý</p>
              </div>
            </div>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCollapsed(!collapsed)}
            className="p-2 text-white hover:bg-white/20"
          >
            <ChevronLeft
              className={cn(
                "h-4 w-4 transition-transform",
                collapsed && "rotate-180"
              )}
            />
          </Button>
        </div>
      </div>

      {/* User Info */}
      <div className="p-4 border-b border-blue-200 bg-blue-50/50 dark:bg-gray-800/50 dark:border-gray-700">
        <div className="flex items-center space-x-2">
          <Avatar className="h-8 w-8">
            <AvatarImage src={user?.avatar} />
            <AvatarFallback className="bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
              {user?.name
                ?.split(" ")
                .map((n: string) => n[0])
                .join("")}
            </AvatarFallback>
          </Avatar>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                {user?.name}
              </p>
              <p className="text-xs text-blue-600 dark:text-blue-400 capitalize">
                {user?.role?.toLowerCase()}
              </p>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        {!collapsed && (
          <div className="flex items-center gap-2 mt-3">
            <ThemeToggle />
            <NotificationDropdown />
          </div>
        )}

        {/* Quick Actions for Collapsed State */}
        {collapsed && (
          <div className="flex flex-col items-center gap-1 mt-3">
            <ThemeToggle />
            <NotificationDropdown />
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <Button
              key={item.id}
              variant={currentPage === item.id ? "secondary" : "ghost"}
              className={cn(
                "w-full justify-start transition-all duration-200",
                collapsed && "px-2",
                currentPage === item.id
                  ? "bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-300 dark:hover:bg-blue-800"
                  : "text-gray-700 hover:bg-blue-50 hover:text-blue-700 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-blue-400"
              )}
              onClick={() => onPageChange(item.id)}
            >
              <Icon className="h-4 w-4" />
              {!collapsed && <span className="ml-2">{item.label}</span>}
            </Button>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-blue-200 bg-blue-50/30 dark:border-gray-700 dark:bg-gray-800/30">
        <Button
          variant="ghost"
          className={cn(
            "w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/20 transition-colors",
            collapsed && "px-2"
          )}
          onClick={logout}
        >
          <LogOut className="h-4 w-4" />
          {!collapsed && <span className="ml-2">Đăng xuất</span>}
        </Button>
      </div>
    </div>
  );
}
