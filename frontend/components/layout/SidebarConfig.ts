import {
  Activity,
  BarChart3,
  BedDouble,
  Briefcase,
  Building2,
  Calendar,
  ClipboardList,
  CreditCard,
  FileBarChart,
  FileText,
  GitBranch,
  Heart,
  LayoutDashboard,
  MessageCircle,
  Monitor,
  Phone,
  Pill,
  Receipt,
  Server,
  Settings,
  Shield,
  Stethoscope,
  User,
  UserCog,
  Users,
  Workflow,
  Zap,
  type LucideIcon,
} from "lucide-react";
import React from "react";

export interface MenuItem {
  icon: LucideIcon;
  label: string;
  href: string;
  page: string;
  badge?: string;
  badgeVariant?: "default" | "secondary" | "destructive" | "outline";
}

export interface MenuSection {
  title?: string;
  items: MenuItem[];
}

export interface SidebarBranding {
  logo: React.ReactNode;
  title: string;
  subtitle: string;
  bgColor: string;
  iconColor: string;
}

export interface SidebarConfig {
  branding: SidebarBranding;
  sections: MenuSection[];
}

// Admin Sidebar Configuration
export const adminSidebarConfig: SidebarConfig = {
  branding: {
    logo: React.createElement(
      "div",
      {
        className:
          "w-8 h-8 rounded-full bg-red-600 flex items-center justify-center",
      },
      React.createElement(
        "span",
        {
          className: "text-white font-bold",
        },
        "A"
      )
    ),
    title: "Admin Portal",
    subtitle: "Hospital Management",
    bgColor: "bg-red-50",
    iconColor: "text-red-600",
  },
  sections: [
    {
      items: [
        {
          icon: BarChart3,
          label: "Dashboard",
          href: "/admin/dashboard",
          page: "dashboard",
        },
      ],
    },
    {
      title: "Core Management",
      items: [
        {
          icon: Users,
          label: "Users",
          href: "/admin/users",
          page: "users",
        },
        {
          icon: Briefcase,
          label: "Staff",
          href: "/admin/staff",
          page: "staff",
        },
        {
          icon: Calendar,
          label: "Appointments",
          href: "/admin/appointments",
          page: "appointments",
        },
        {
          icon: UserCog,
          label: "Doctors",
          href: "/admin/doctors",
          page: "doctors",
        },
        {
          icon: User,
          label: "Patients",
          href: "/admin/patients",
          page: "patients",
        },
        {
          icon: Building2,
          label: "Departments",
          href: "/admin/departments",
          page: "departments",
        },
        {
          icon: BedDouble,
          label: "Rooms",
          href: "/admin/rooms",
          page: "rooms",
        },
      ],
    },
    {
      title: "Financial",
      items: [
        {
          icon: CreditCard,
          label: "Billing",
          href: "/admin/billing",
          page: "billing",
        },
        {
          icon: Receipt,
          label: "Payments",
          href: "/admin/payments",
          page: "payments",
        },
      ],
    },
    {
      title: "Microservices",
      items: [
        {
          icon: FileText,
          label: "Medical Records",
          href: "/admin/medical-records",
          page: "medical-records",
        },
        {
          icon: Pill,
          label: "Prescriptions",
          href: "/admin/prescriptions",
          page: "prescriptions",
        },
        {
          icon: FileBarChart,
          label: "Analytics Dashboard",
          href: "/admin/microservices-dashboard",
          page: "microservices-dashboard",
        },
      ],
    },
    {
      title: "Enhanced Management",
      items: [
        {
          icon: Workflow,
          label: "Workflow Orchestration",
          href: "/admin/dashboard?tab=workflows",
          page: "workflows",
          badge: "New",
          badgeVariant: "secondary",
        },
        {
          icon: GitBranch,
          label: "Saga Management",
          href: "/admin/dashboard?tab=sagas",
          page: "sagas",
          badge: "New",
          badgeVariant: "secondary",
        },
        {
          icon: Monitor,
          label: "Real-time Monitoring",
          href: "/admin/dashboard?tab=monitoring",
          page: "monitoring",
          badge: "Live",
          badgeVariant: "destructive",
        },
        {
          icon: Zap,
          label: "Advanced Analytics",
          href: "/admin/dashboard?tab=advanced-analytics",
          page: "advanced-analytics",
        },
      ],
    },
    {
      title: "System",
      items: [
        {
          icon: BarChart3,
          label: "Analytics",
          href: "/admin/analytics",
          page: "analytics",
        },
        {
          icon: FileText,
          label: "System Logs",
          href: "/admin/system-logs",
          page: "system-logs",
        },
        {
          icon: Settings,
          label: "Settings",
          href: "/admin/settings",
          page: "settings",
        },
        {
          icon: Server,
          label: "System Status",
          href: "/admin/system-status",
          page: "system-status",
        },
      ],
    },
  ],
};

// Doctor Sidebar Configuration - Updated for new structure
export const doctorSidebarConfig: SidebarConfig = {
  branding: {
    logo: React.createElement(
      "div",
      {
        className: "p-2 bg-blue-100 rounded-lg",
      },
      React.createElement(Stethoscope, {
        className: "h-6 w-6 text-blue-600",
      })
    ),
    title: "Doctor Portal",
    subtitle: "Hospital Management",
    bgColor: "bg-blue-50",
    iconColor: "text-blue-600",
  },
  sections: [
    {
      items: [
        {
          icon: LayoutDashboard,
          label: "Dashboard",
          href: "/doctors/dashboard",
          page: "dashboard",
        },
      ],
    },
    {
      title: "Core Functions",
      items: [
        {
          icon: User,
          label: "Hồ sơ cá nhân",
          href: "/doctors/profile",
          page: "profile",
        },
        {
          icon: Users,
          label: "Quản lý bệnh nhân",
          href: "/doctors/patients",
          page: "patients",
        },
        {
          icon: Calendar,
          label: "Lịch làm việc",
          href: "/doctors/schedule",
          page: "schedule",
        },
        {
          icon: Pill,
          label: "Kê đơn thuốc",
          href: "/doctors/prescriptions",
          page: "prescriptions",
        },
      ],
    },
    {
      title: "Analytics & Management",
      items: [
        {
          icon: BarChart3,
          label: "Thống kê",
          href: "/doctors/analytics",
          page: "analytics",
        },
        {
          icon: FileText,
          label: "Chứng chỉ",
          href: "/doctors/certificates",
          page: "certificates",
        },
      ],
    },
    {
      title: "System",
      items: [
        {
          icon: Settings,
          label: "Cài đặt",
          href: "/doctors/settings",
          page: "settings",
        },
      ],
    },
  ],
};

// Patient Sidebar Configuration
export const patientSidebarConfig: SidebarConfig = {
  branding: {
    logo: React.createElement(
      "div",
      {
        className: "p-2 bg-blue-100 rounded-lg",
      },
      React.createElement(Heart, {
        className: "h-6 w-6 text-blue-600",
      })
    ),
    title: "Patient Portal",
    subtitle: "Hospital Management",
    bgColor: "bg-blue-50",
    iconColor: "text-blue-600",
  },
  sections: [
    {
      items: [
        {
          icon: LayoutDashboard,
          label: "Dashboard",
          href: "/patient/dashboard",
          page: "dashboard",
        },
      ],
    },
    {
      title: "My Care",
      items: [
        {
          icon: Calendar,
          label: "Appointments",
          href: "/patient/appointments",
          page: "appointments",
        },
        {
          icon: FileText,
          label: "Medical Records",
          href: "/patient/medical-records",
          page: "medical-records",
        },
        {
          icon: Pill,
          label: "Prescriptions",
          href: "/patient/prescriptions",
          page: "prescriptions",
        },
        {
          icon: Activity,
          label: "Lab Results",
          href: "/patient/lab-results",
          page: "lab-results",
        },
      ],
    },
    {
      title: "Health Management",
      items: [
        {
          icon: Heart,
          label: "Health Metrics",
          href: "/patient/health-metrics",
          page: "health-metrics",
        },
        {
          icon: ClipboardList,
          label: "Health History",
          href: "/patient/health-history",
          page: "health-history",
        },
      ],
    },
    {
      title: "Communication",
      items: [
        {
          icon: MessageCircle,
          label: "Messages",
          href: "/patient/messages",
          page: "messages",
          badge: "1",
          badgeVariant: "secondary",
        },
        {
          icon: Phone,
          label: "Telemedicine",
          href: "/patient/telemedicine",
          page: "telemedicine",
        },
      ],
    },
    {
      title: "Financial",
      items: [
        {
          icon: CreditCard,
          label: "Payment History",
          href: "/patient/payment/history",
          page: "payment",
        },
        {
          icon: Receipt,
          label: "Billing",
          href: "/patient/billing",
          page: "billing",
        },
        {
          icon: Shield,
          label: "Insurance",
          href: "/patient/insurance",
          page: "insurance",
        },
      ],
    },
    {
      items: [
        {
          icon: Settings,
          label: "Settings",
          href: "/patient/settings",
          page: "settings",
        },
      ],
    },
  ],
};

// Helper function to get sidebar config by role
export function getSidebarConfig(role: string): SidebarConfig {
  switch (role.toLowerCase()) {
    case "admin":
      return adminSidebarConfig;
    case "doctor":
      return doctorSidebarConfig;
    case "patient":
      return patientSidebarConfig;
    default:
      return patientSidebarConfig; // Default fallback
  }
}
