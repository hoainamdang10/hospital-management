"use client"

import React from "react"
import {
  BarChart3,
  Calendar,
  UserCog,
  User,
  Building2,
  BedDouble,
  CreditCard,
  Settings2,
  FileBarChart,
  Settings,
  Menu,
  LogOut,
  Stethoscope,
  FileText,
  Clock,
  Heart
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { SidebarItem } from "@/components/shared-components"
import { useAuth } from "@/lib/auth/auth-wrapper"
import { UnifiedUser } from "@/lib/auth/unified-auth-context"

type UserRole = 'admin' | 'doctor' | 'patient' | 'nurse' | 'receptionist'

export interface DashboardLayoutProps {
  children: React.ReactNode
  title: string
  activePage: string
}

// Định nghĩa menu items cho từng vai trò
const getMenuItems = (role: UserRole) => {
  const baseItems = [
    {
      icon: <BarChart3 size={20} />,
      label: "Dashboard",
      href: `/${role}/dashboard`,
      page: "dashboard"
    }
  ]

  switch (role) {
    case 'admin':
      return [
        ...baseItems,
        {
          icon: <Calendar size={20} />,
          label: "Appointments",
          href: "/admin/appointments",
          page: "appointments"
        },
        {
          icon: <UserCog size={20} />,
          label: "Doctors",
          href: "/admin/doctors",
          page: "doctors"
        },
        {
          icon: <User size={20} />,
          label: "Patients",
          href: "/admin/patients",
          page: "patients"
        },
        {
          icon: <Building2 size={20} />,
          label: "Departments",
          href: "/admin/departments",
          page: "departments"
        },
        {
          icon: <BedDouble size={20} />,
          label: "Rooms",
          href: "/admin/rooms",
          page: "rooms"
        },
        {
          icon: <CreditCard size={20} />,
          label: "Payment",
          href: "/admin/payment",
          page: "payment"
        },
        {
          icon: <Settings2 size={20} />,
          label: "Settings",
          href: "/admin/settings",
          page: "settings"
        },
        {
          icon: <FileBarChart size={20} />,
          label: "Reports",
          href: "/admin/reports",
          page: "reports"
        },
        {
          icon: <Clock size={20} />,
          label: "Login History",
          href: "/admin/login-history",
          page: "login-history"
        }
      ]

    case 'doctor':
      return [
        ...baseItems,
        {
          icon: <Calendar size={20} />,
          label: "My Appointments",
          href: "/doctors/appointments",
          page: "appointments"
        },
        {
          icon: <User size={20} />,
          label: "My Patients",
          href: "/doctors/patients",
          page: "patients"
        },
        {
          icon: <FileText size={20} />,
          label: "Medical Records",
          href: "/doctors/records",
          page: "records"
        },
        {
          icon: <Clock size={20} />,
          label: "Schedule",
          href: "/doctors/schedule",
          page: "schedule"
        },
        {
          icon: <Settings2 size={20} />,
          label: "Profile",
          href: "/doctors/profile",
          page: "profile"
        }
      ]

    case 'patient':
      return [
        ...baseItems,
        {
          icon: <Calendar size={20} />,
          label: "My Appointments",
          href: "/patient/appointments",
          page: "appointments"
        },
        {
          icon: <Stethoscope size={20} />,
          label: "Find Doctors",
          href: "/patient/doctors",
          page: "doctors"
        },
        {
          icon: <FileText size={20} />,
          label: "Medical History",
          href: "/patient/history",
          page: "history"
        },
        {
          icon: <Heart size={20} />,
          label: "Health Records",
          href: "/patient/health",
          page: "health"
        },
        {
          icon: <CreditCard size={20} />,
          label: "Billing",
          href: "/patient/billing",
          page: "billing"
        },
        {
          icon: <Settings2 size={20} />,
          label: "Profile",
          href: "/patient/profile",
          page: "profile"
        }
      ]

    default:
      return baseItems
  }
}

export function DashboardLayout({ children, title, activePage }: DashboardLayoutProps) {
  const { user, signOut } = useAuth()
  const logout = () => signOut()

  if (!user) {
    return <div>Loading...</div>
  }

  const menuItems = getMenuItems(user.role)

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r border-gray-200 hidden md:block">
        <div className="p-4 flex items-center space-x-2">
          <div className="w-8 h-8 rounded-full bg-[#0066CC] flex items-center justify-center">
            <span className="text-white font-bold">H</span>
          </div>
          <span className="text-xl font-bold">Hospital</span>
        </div>

        <div className="mt-6">
          {menuItems.map((item) => (
            <SidebarItem
              key={item.page}
              icon={item.icon}
              label={item.label}
              href={item.href}
              active={activePage === item.page}
            />
          ))}
        </div>

        {/* Logout button */}
        <div className="absolute bottom-4 left-4 right-4">
          <Button
            variant="ghost"
            className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
            onClick={logout}
          >
            <LogOut size={20} className="mr-3" />
            Logout
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 p-4 flex justify-between items-center">
          <div className="flex items-center">
            <Button variant="ghost" size="icon" className="md:hidden mr-2">
              <Menu size={20} />
            </Button>
            <h1 className="text-xl font-bold">{title}</h1>
          </div>
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="icon">
              <Settings size={20} />
            </Button>
            <div className="flex items-center space-x-2">
              <Avatar>
                <AvatarImage src="/placeholder.svg?height=32&width=32" alt={user.full_name} />
                <AvatarFallback>
                  {user.full_name ? user.full_name.split(' ').map(n => n[0]).join('').toUpperCase() : 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="hidden md:block">
                <span className="font-medium">{user.full_name}</span>
                <p className="text-xs text-gray-500 capitalize">{user.role}</p>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
