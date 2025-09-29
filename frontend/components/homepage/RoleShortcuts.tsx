'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Calendar,
  FileText,
  Bell,
  Activity,
  Clock,
  Users,
  Settings,
  BarChart3,
  Stethoscope,
  Heart,
} from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { Role, MockSession, mockStats } from '@/lib/mock';
import Link from 'next/link';

interface RoleShortcutsProps {
  session?: MockSession;
}

export function RoleShortcuts({ session }: RoleShortcutsProps) {
  const { t, language } = useI18n();
  
  if (!session?.user) return null;

  const userRole = session.user.role;

  const getShortcuts = (role: Role) => {
    switch (role) {
      case 'patient':
        return [
          {
            title: t('roleShortcuts.patient.myAppointments'),
            description: language === 'vi' ? 'Xem và quản lý lịch khám của bạn' : 'View and manage your appointments',
            icon: Calendar,
            href: '/patient/appointments',
            color: 'text-medical-cardiology',
            bgColor: 'bg-medical-cardiology/10 dark:bg-medical-cardiology/20',
            count: '3',
          },
          {
            title: t('roleShortcuts.patient.medicalRecords'),
            description: language === 'vi' ? 'Truy cập hồ sơ bệnh án điện tử' : 'Access your electronic medical records',
            icon: FileText,
            href: '/patient/medical-records',
            color: 'text-medical-pediatrics',
            bgColor: 'bg-medical-pediatrics/10 dark:bg-medical-pediatrics/20',
            count: '12',
          },
          {
            title: t('roleShortcuts.patient.reminders'),
            description: language === 'vi' ? 'Nhắc nhở và thông báo quan trọng' : 'Important reminders and notifications',
            icon: Bell,
            href: '/patient/reminders',
            color: 'text-medical-emergency',
            bgColor: 'bg-medical-emergency/10 dark:bg-medical-emergency/20',
            count: '2',
          },
          {
            title: t('roleShortcuts.patient.healthTracking'),
            description: language === 'vi' ? 'Theo dõi chỉ số sức khỏe' : 'Track your health metrics',
            icon: Activity,
            href: '/patient/health-tracking',
            color: 'text-medical-pharmacy',
            bgColor: 'bg-medical-pharmacy/10 dark:bg-medical-pharmacy/20',
          },
        ];

      case 'doctor':
        return [
          {
            title: t('roleShortcuts.doctor.todaySchedule'),
            description: language === 'vi' ? 'Lịch làm việc và bệnh nhân hôm nay' : 'Today\'s schedule and patients',
            icon: Clock,
            href: '/doctors/today',
            color: 'text-medical-cardiology',
            bgColor: 'bg-medical-cardiology/10 dark:bg-medical-cardiology/20',
            count: '8',
          },
          {
            title: t('roleShortcuts.doctor.pendingConsultations'),
            description: language === 'vi' ? 'Yêu cầu tư vấn chờ phản hồi' : 'Pending consultation requests',
            icon: Stethoscope,
            href: '/doctors/consultation',
            color: 'text-medical-emergency',
            bgColor: 'bg-medical-emergency/10 dark:bg-medical-emergency/20',
            count: '5',
          },
          {
            title: t('roleShortcuts.doctor.patientRecords'),
            description: language === 'vi' ? 'Hồ sơ bệnh nhân đang điều trị' : 'Patient records under care',
            icon: FileText,
            href: '/doctors/patients',
            color: 'text-medical-pediatrics',
            bgColor: 'bg-medical-pediatrics/10 dark:bg-medical-pediatrics/20',
            count: '24',
          },
          {
            title: t('roleShortcuts.doctor.myProfile'),
            description: language === 'vi' ? 'Cập nhật thông tin cá nhân' : 'Update your professional profile',
            icon: Settings,
            href: '/doctors/profile',
            color: 'text-medical-neurology',
            bgColor: 'bg-medical-neurology/10 dark:bg-medical-neurology/20',
          },
        ];

      case 'admin':
        return [
          {
            title: t('roleShortcuts.admin.systemAdmin'),
            description: language === 'vi' ? 'Quản trị hệ thống và cấu hình' : 'System administration and configuration',
            icon: Settings,
            href: '/admin/system-status',
            color: 'text-blue-600',
            bgColor: 'bg-blue-50 dark:bg-blue-950/20',
          },
          {
            title: t('roleShortcuts.admin.quickStats'),
            description: language === 'vi' ? 'Thống kê và báo cáo nhanh' : 'Quick statistics and reports',
            icon: BarChart3,
            href: '/admin/analytics',
            color: 'text-green-600',
            bgColor: 'bg-green-50 dark:bg-green-950/20',
          },
          {
            title: t('roleShortcuts.admin.todayAppointments'),
            description: `${mockStats.appointmentsToday} ${language === 'vi' ? 'lịch khám hôm nay' : 'appointments today'}`,
            icon: Calendar,
            href: '/admin/appointments',
            color: 'text-orange-600',
            bgColor: 'bg-orange-50 dark:bg-orange-950/20',
            count: mockStats.appointmentsToday.toString(),
          },
          {
            title: t('roleShortcuts.admin.queueManagement'),
            description: `${mockStats.occupancyRate}% ${t('roleShortcuts.admin.occupancyRate')}`,
            icon: Users,
            href: '/admin/queue',
            color: 'text-purple-600',
            bgColor: 'bg-purple-50 dark:bg-purple-950/20',
            count: `${mockStats.occupancyRate}%`,
          },
        ];

      default:
        return [];
    }
  };

  const shortcuts = getShortcuts(userRole);

  if (shortcuts.length === 0) return null;

  return (
    <section className="py-12 lg:py-16 bg-muted/30">
      <div className="container mx-auto px-4 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Heart className="h-6 w-6 text-primary" />
            <h2 className="text-3xl lg:text-4xl font-bold">
              {language === 'vi' ? 'Truy cập nhanh' : 'Quick Access'}
            </h2>
          </div>
          <p className="text-lg text-muted-foreground">
            {language === 'vi' 
              ? `Chào mừng trở lại, ${session.user.name}` 
              : `Welcome back, ${session.user.name}`
            }
          </p>
        </div>

        {/* Shortcuts Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {shortcuts.map((shortcut, index) => (
            <Card key={index} className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className={`p-3 rounded-lg ${shortcut.bgColor}`}>
                    <shortcut.icon className={`h-6 w-6 ${shortcut.color}`} />
                  </div>
                  {shortcut.count && (
                    <Badge variant="secondary" className="text-xs">
                      {shortcut.count}
                    </Badge>
                  )}
                </div>
                <CardTitle className="text-lg leading-tight">
                  {shortcut.title}
                </CardTitle>
              </CardHeader>

              <CardContent className="pt-0">
                <p className="text-sm text-muted-foreground mb-4">
                  {shortcut.description}
                </p>

                <Button variant="outline" size="sm" className="w-full" asChild>
                  <Link href={shortcut.href}>
                    {language === 'vi' ? 'Truy cập' : 'Access'}
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Additional Info */}
        <div className="mt-8 text-center">
          <p className="text-sm text-muted-foreground">
            {language === 'vi' 
              ? 'Cần hỗ trợ? Liên hệ với chúng tôi qua hotline hoặc chat trực tuyến.'
              : 'Need help? Contact us via hotline or live chat.'
            }
          </p>
        </div>
      </div>
    </section>
  );
}
