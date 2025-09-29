"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  Calendar,
  Heart,
  FileText,
  Clock,
  Activity,
  AlertTriangle,
  CheckCircle,
  Pill,
  Thermometer,
  AlertCircle,
  MessageCircle,
  Phone,
  TrendingUp,
  Users,
  Shield,
  Zap
} from "lucide-react"
import { PatientLayout } from "@/components/layout/UniversalLayout"
import { StatCard } from "@/components/dashboard/StatCard"
import { EnhancedStatCard } from "@/components/dashboard/EnhancedStatCard"
import { ChartCard, BarChartGroup, ProgressChart, MetricComparison } from "@/components/dashboard/ChartCard"
import { ActivityTimeline } from "@/components/dashboard/ActivityTimeline"
import { NotificationCenter } from "@/components/dashboard/NotificationCenter"
import { InteractiveCalendar } from "@/components/dashboard/InteractiveCalendar"
import { RecentActivity } from "@/components/dashboard/RecentActivity"
import { StatCardSkeleton, ChartCardSkeleton, PulseWrapper } from "@/components/dashboard/SkeletonLoaders"
import { useDashboardLoading } from "@/hooks/useProgressiveLoading"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { useEnhancedAuth } from "@/lib/auth/auth-wrapper"
import { appointmentsApi, patientsApi, medicalRecordsApi, prescriptionsApi } from "@/lib/api"
import { toast } from "sonner"

export default function PatientDashboard() {
  const { user, loading } = useEnhancedAuth()
  const router = useRouter()
  const [currentDate, setCurrentDate] = useState("")

  // Progressive loading
  const {
    isStatsLoading,
    isChartsLoading,
    isCalendarLoading,
    isActivitiesLoading,
    isNotificationsLoading,
    progress
  } = useDashboardLoading()

  // State for dashboard data
  const [upcomingAppointments, setUpcomingAppointments] = useState<any[]>([])
  const [medications, setMedications] = useState<any[]>([])
  const [recentActivities, setRecentActivities] = useState<any[]>([])
  const [notifications, setNotifications] = useState<any[]>([])
  const [calendarEvents, setCalendarEvents] = useState<any[]>([])
  const [healthMetrics, setHealthMetrics] = useState<any>({
    bloodPressure: "120/80",
    heartRate: "72",
    temperature: "36.5",
    weight: "70",
    height: "170",
    bmi: "24.2",
    lastUpdated: new Date().toLocaleDateString('vi-VN')
  })
  const [isLoadingData, setIsLoadingData] = useState(true)

  // Handle authentication and redirect
  useEffect(() => {
    console.log('🏥 [PatientDashboard] Auth state changed:', {
      loading,
      user,
      isAuthenticated: !!user,
      role: user?.role
    })

    // Handle redirect when auth state is determined
    if (!loading) {
      if (!user) {
        console.log('🏥 [PatientDashboard] No user found, redirecting to login')
        router.replace('/auth/login')
      } else if (user.role !== 'patient') {
        console.log(`🏥 [PatientDashboard] Wrong role (${user.role}), redirecting to appropriate dashboard`)
        // Redirect to appropriate dashboard based on role
        switch (user.role) {
          case 'admin':
            router.replace('/admin/dashboard')
            break
          case 'doctor':
            router.replace('/doctors/dashboard')
            break
          default:
            router.replace('/auth/login')
        }
      }
    }
  }, [user, loading, router])

  useEffect(() => {
    const today = new Date()
    setCurrentDate(today.toLocaleDateString('vi-VN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }))
  }, [])

  // Load dashboard data
  useEffect(() => {
    const loadDashboardData = async () => {
      console.log('🏥 [PatientDashboard] Loading dashboard data for user:', {
        user,
        patient_id: user?.patient_id,
        hasPatientId: !!user?.patient_id
      })

      if (!user?.patient_id) {
        console.log('🏥 [PatientDashboard] No patient_id found, trying to fetch from API...')

        // Try to get patient_id via API
        try {
          const patientResponse = await patientsApi.getByProfileId(user.id)
          if (patientResponse.success && patientResponse.data?.patient_id) {
            console.log('🏥 [PatientDashboard] Found patient via API:', patientResponse.data.patient_id)
            // Update user object with patient_id (temporary fix)
            user.patient_id = patientResponse.data.patient_id
          } else {
            console.log('🏥 [PatientDashboard] No patient record found for profile_id:', user.id)
            setIsLoadingData(false)
            return
          }
        } catch (error) {
          console.error('🏥 [PatientDashboard] Error fetching patient by profile_id:', error)
          setIsLoadingData(false)
          return
        }
      }

      try {
        setIsLoadingData(true)

        // Load upcoming appointments
        console.log('🏥 [PatientDashboard] Loading appointments for patient:', user.patient_id)
        const appointmentsResponse = await appointmentsApi.getByPatientId(user.patient_id)
        console.log('🏥 [PatientDashboard] Appointments response:', appointmentsResponse)
        if (appointmentsResponse.success && appointmentsResponse.data) {
          // Filter upcoming appointments and sort by date
          const upcoming = appointmentsResponse.data
            .filter((apt: any) => {
              const appointmentDate = new Date(apt.appointment_date)
              return appointmentDate >= new Date() && apt.status !== 'cancelled'
            })
            .sort((a: any, b: any) => new Date(a.appointment_date).getTime() - new Date(b.appointment_date).getTime())
            .slice(0, 3) // Get next 3 appointments

          setUpcomingAppointments(upcoming)
        }

        // Load current medications (prescriptions)
        console.log('🏥 [PatientDashboard] Loading prescriptions for patient:', user.patient_id)
        const prescriptionsResponse = await prescriptionsApi.getByPatientId(user.patient_id)
        console.log('🏥 [PatientDashboard] Prescriptions response:', prescriptionsResponse)
        if (prescriptionsResponse.success && prescriptionsResponse.data) {
          // Filter active prescriptions
          const activeMeds = prescriptionsResponse.data
            .filter((prescription: any) => prescription.status === 'active')
            .map((prescription: any) => ({
              id: prescription.prescription_id,
              name: prescription.medication_name,
              dosage: prescription.dosage,
              timeLeft: prescription.duration || "N/A",
              progress: 70 // This would be calculated based on start date and duration
            }))

          setMedications(activeMeds)
        }

        // Load patient health metrics (from patient profile)
        console.log('🏥 [PatientDashboard] Loading patient profile for:', user.patient_id)
        const patientResponse = await patientsApi.getById(user.patient_id)
        console.log('🏥 [PatientDashboard] Patient profile response:', patientResponse)
        if (patientResponse.success && patientResponse.data) {
          const patient = patientResponse.data
          setHealthMetrics({
            bloodPressure: patient.blood_pressure || "120/80",
            heartRate: patient.heart_rate || "72 bpm",
            temperature: patient.temperature || "36.5°C",
            weight: patient.weight || "N/A",
            height: patient.height || "N/A",
            bmi: patient.bmi || "N/A",
            lastUpdated: patient.updated_at ? new Date(patient.updated_at).toLocaleDateString('vi-VN') : "N/A"
          })
        }

        // Create recent activities from appointments and medical records
        const recentAppointments = appointmentsResponse.data?.slice(0, 2).map((apt: any) => ({
          id: apt.appointment_id,
          type: "appointment" as const,
          title: apt.status === 'completed' ? "Appointment completed" : "Appointment scheduled",
          description: `${apt.appointment_type} với ${apt.doctor_name || 'Doctor'}`,
          time: new Date(apt.appointment_date).toLocaleDateString('vi-VN'),
          status: apt.status as const,
          initials: apt.doctor_name?.split(' ').map((n: string) => n[0]).join('') || "DR"
        })) || []

        setRecentActivities(recentAppointments)

        // Load mock notifications
        setNotifications([
          {
            id: '1',
            type: 'appointment' as const,
            title: 'Lịch hẹn sắp tới',
            message: 'Bạn có lịch hẹn với BS. Nguyễn Văn A vào ngày mai lúc 14:00',
            timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
            isRead: false,
            priority: 'medium' as const,
            sender: { name: 'Hệ thống', role: 'System', avatar: '' }
          },
          {
            id: '2',
            type: 'info' as const,
            title: 'Kết quả xét nghiệm',
            message: 'Kết quả xét nghiệm máu của bạn đã có. Vui lòng xem chi tiết.',
            timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
            isRead: false,
            priority: 'high' as const,
            sender: { name: 'Phòng xét nghiệm', role: 'Lab', avatar: '' }
          }
        ])

        // Load mock calendar events
        setCalendarEvents([
          {
            id: '1',
            title: 'Khám định kỳ',
            date: new Date(Date.now() + 24 * 60 * 60 * 1000),
            time: '14:00',
            type: 'appointment' as const,
            doctor: 'BS. Nguyễn Văn A',
            location: 'Phòng 101',
            status: 'confirmed' as const
          },
          {
            id: '2',
            title: 'Tái khám',
            date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            time: '09:00',
            type: 'appointment' as const,
            doctor: 'BS. Trần Thị B',
            location: 'Phòng 205',
            status: 'pending' as const
          }
        ])

      } catch (error) {
        console.error('🏥 [PatientDashboard] Error loading dashboard data:', error)
        toast.error('Không thể tải dữ liệu dashboard')
      } finally {
        console.log('🏥 [PatientDashboard] Dashboard data loading completed')
        setIsLoadingData(false)
      }
    }

    loadDashboardData()
  }, [user?.patient_id])

  // Show loading state while user data is being fetched
  if (loading) {
    return (
      <PatientLayout title="Patient Dashboard" activePage="dashboard">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </PatientLayout>
    )
  }

  // Enhanced debug and redirect logic
  console.log('🏥 [PatientDashboard] Access check:', {
    hasUser: !!user,
    userRole: user?.role,
    isPatient: user?.role === 'patient',
    loading
  })

  // Don't render anything if redirecting or wrong role
  if (!user || user.role !== 'patient') {
    return (
      <PatientLayout title="Patient Dashboard" activePage="dashboard">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </PatientLayout>
    )
  }

  // Show loading state while data is being fetched
  if (isLoadingData) {
    return (
      <PatientLayout title="Patient Dashboard" activePage="dashboard">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2">Loading dashboard data...</span>
        </div>
      </PatientLayout>
    )
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'cancelled':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <PatientLayout
      title="Patient Dashboard"
      activePage="dashboard"
      subtitle="Your personal health management portal"
      headerActions={
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Calendar className="h-4 w-4 mr-2" />
            Book Appointment
          </Button>
          <Button size="sm">
            <Heart className="h-4 w-4 mr-2" />
            Health Tracking
          </Button>
        </div>
      }
    >
      <div className="p-6 space-y-6">
        {/* Welcome Section */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl shadow-lg">
              <Heart className="h-8 w-8 text-white" />
            </div>
            <div>
              <h2 className="text-3xl font-bold text-gray-900">
                Welcome back, {user.full_name}!
              </h2>
              <p className="text-sm text-gray-600 flex items-center gap-2">
                <Shield className="h-4 w-4" />
                {user.email} • {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
              </p>
              {/* Debug info */}
              <p className="text-xs text-gray-500 mt-1">
                Patient ID: {user.patient_id || 'Not found'} | Profile ID: {user.id}
              </p>
            </div>
          </div>
          <p className="text-gray-600 text-lg">{currentDate}</p>

          {/* Health Status Alert */}
          <div className="mt-6 p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-green-800">Health Status: Excellent</h3>
                <p className="text-sm text-green-700">
                  Your health metrics are looking great. Keep up the good work!
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <PulseWrapper isLoading={isStatsLoading} fallback={<StatCardSkeleton />}>
            <EnhancedStatCard
              title="Lịch hẹn sắp tới"
              value={upcomingAppointments.length}
              change={upcomingAppointments.length > 0 ? 1 : 0}
              changeLabel="lịch hẹn mới"
              icon={<Calendar className="h-6 w-6" />}
              description={
                upcomingAppointments.length > 0
                  ? `Tiếp theo: ${new Date(upcomingAppointments[0].appointment_date).toLocaleDateString('vi-VN')}`
                  : "Không có lịch hẹn"
              }
              color="blue"
              variant="gradient"
              showTrend={true}
              onViewDetails={() => window.location.href = '/patient/appointments'}
            />
          </PulseWrapper>

          <PulseWrapper isLoading={isStatsLoading} fallback={<StatCardSkeleton />}>
            <EnhancedStatCard
              title="Điểm sức khỏe"
              value="85%"
              change={5}
              changeLabel="cải thiện từ tháng trước"
              icon={<Heart className="h-6 w-6" />}
              description="Tình trạng sức khỏe tốt"
              color="red"
              variant="gradient"
              showTrend={true}
              status="success"
              onViewDetails={() => window.location.href = '/patient/health'}
            />
          </PulseWrapper>

          <PulseWrapper isLoading={isStatsLoading} fallback={<StatCardSkeleton />}>
            <EnhancedStatCard
              title="Thuốc đang dùng"
              value={medications.length}
              change={0}
              changeLabel="không thay đổi"
              icon={<Pill className="h-6 w-6" />}
              description="Đang điều trị"
              color="green"
              variant="gradient"
              showTrend={true}
              showProgress={true}
              progressValue={medications.length}
              progressMax={5}
              onViewDetails={() => window.location.href = '/patient/medications'}
            />
          </PulseWrapper>

          <PulseWrapper isLoading={isStatsLoading} fallback={<StatCardSkeleton />}>
            <EnhancedStatCard
              title="Khám gần nhất"
              value="3 ngày"
              change={-2}
              changeLabel="trước"
              icon={<Activity className="h-6 w-6" />}
              description="Kết quả tốt"
              color="purple"
              variant="gradient"
              showTrend={true}
              status="normal"
              onViewDetails={() => window.location.href = '/patient/medical-records'}
            />
          </PulseWrapper>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Upcoming Appointments */}
          <Card className="lg:col-span-2 shadow-lg border-0 bg-white">
            <CardHeader className="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-t-lg">
              <div className="flex justify-between items-center">
                <CardTitle className="text-xl font-semibold flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Upcoming Appointments
                </CardTitle>
                <Button variant="secondary" size="sm" className="bg-white/20 hover:bg-white/30 text-white border-white/30">
                  Book New
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                {upcomingAppointments.map((appointment) => (
                  <div key={appointment.appointment_id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                    <div className="flex items-center space-x-4">
                      <div className="text-center bg-white p-3 rounded-lg shadow-sm">
                        <div className="text-sm font-semibold text-gray-900">
                          {new Date(appointment.appointment_date).toLocaleDateString('vi-VN')}
                        </div>
                        <div className="text-xs text-gray-500">{appointment.start_time}</div>
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{appointment.doctor_name || 'Doctor'}</p>
                        <p className="text-sm text-blue-600">{appointment.department || 'Department'}</p>
                        <p className="text-xs text-gray-500">{appointment.appointment_type}</p>
                      </div>
                    </div>
                    <Badge className={`${getStatusColor(appointment.status)} font-medium`}>
                      {appointment.status}
                    </Badge>
                  </div>
                ))}
                {upcomingAppointments.length === 0 && (
                  <div className="text-center py-12 text-gray-500">
                    <div className="p-4 bg-gray-100 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                      <Calendar className="h-10 w-10 text-gray-400" />
                    </div>
                    <p className="text-lg font-medium mb-2">No upcoming appointments</p>
                    <p className="text-sm text-gray-400 mb-4">Schedule your next visit with your healthcare provider</p>
                    <Button className="bg-blue-600 hover:bg-blue-700">Book Appointment</Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Health Summary */}
          <Card className="shadow-lg border-0 bg-white">
            <CardHeader className="bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-t-lg">
              <CardTitle className="text-xl font-semibold flex items-center gap-2">
                <Heart className="h-5 w-5" />
                Health Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-6">
                <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-red-100 rounded-full">
                      <Heart className="h-4 w-4 text-red-600" />
                    </div>
                    <span className="text-sm font-medium text-gray-700">Blood Pressure</span>
                  </div>
                  <span className="text-lg font-bold text-red-600">{healthMetrics.bloodPressure}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-blue-100 rounded-full">
                      <Thermometer className="h-4 w-4 text-blue-600" />
                    </div>
                    <span className="text-sm font-medium text-gray-700">Temperature</span>
                  </div>
                  <span className="text-lg font-bold text-blue-600">{healthMetrics.temperature}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-green-100 rounded-full">
                      <Activity className="h-4 w-4 text-green-600" />
                    </div>
                    <span className="text-sm font-medium text-gray-700">Heart Rate</span>
                  </div>
                  <span className="text-lg font-bold text-green-600">{healthMetrics.heartRate}</span>
                </div>
                <div className="pt-4">
                  <Button className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-medium">
                    View Full Report
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Current Medications */}
          <Card className="shadow-lg border-0 bg-white">
            <CardHeader className="bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-t-lg">
              <CardTitle className="text-xl font-semibold flex items-center gap-2">
                <Pill className="h-5 w-5" />
                Current Medications
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                {medications.map((med) => (
                  <div key={med.id} className="p-4 bg-gray-50 rounded-xl">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <p className="font-semibold text-gray-900">{med.name}</p>
                        <p className="text-sm text-gray-600">{med.dosage}</p>
                      </div>
                      <span className="text-sm font-medium text-orange-600 bg-orange-100 px-2 py-1 rounded-full">
                        {med.timeLeft}
                      </span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Progress</span>
                        <span className="font-medium text-gray-900">{med.progress}%</span>
                      </div>
                      <Progress value={med.progress} className="h-3 bg-gray-200" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card className="shadow-lg border-0 bg-white">
            <CardHeader className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-t-lg">
              <CardTitle className="text-xl font-semibold flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <RecentActivity
                activities={recentActivities}
                title=""
                maxItems={4}
              />
            </CardContent>
          </Card>
        </div>

        {/* Enhanced Dashboard Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Activity Timeline */}
          <PulseWrapper isLoading={isActivitiesLoading} fallback={<div className="h-96 bg-gray-100 rounded-lg animate-pulse" />}>
            <ActivityTimeline
              activities={recentActivities.map(activity => ({
                id: activity.id,
                type: activity.type,
                title: activity.title,
                description: activity.description,
                timestamp: new Date(activity.time),
                user: { name: 'Hệ thống', role: 'System', avatar: '' },
                patient: { name: user.full_name, id: user.patient_id },
                status: activity.status,
                priority: 'medium' as const
              }))}
              onActivityClick={(activity) => console.log('Activity clicked:', activity)}
              showFilters={false}
              showSearch={false}
              groupByDate={false}
              maxItems={5}
            />
          </PulseWrapper>

          {/* Notification Center */}
          <PulseWrapper isLoading={isNotificationsLoading} fallback={<div className="h-96 bg-gray-100 rounded-lg animate-pulse" />}>
            <NotificationCenter
              notifications={notifications}
              onNotificationClick={(notification) => console.log('Notification clicked:', notification)}
              onMarkAsRead={(id) => console.log('Mark as read:', id)}
              onMarkAllAsRead={() => console.log('Mark all as read')}
              onDeleteNotification={(id) => console.log('Delete notification:', id)}
              showFilters={false}
              showSearch={false}
              maxItems={5}
            />
          </PulseWrapper>
        </div>

        {/* Enhanced Charts and Calendar */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Health Metrics Chart */}
          <PulseWrapper isLoading={isChartsLoading} fallback={<ChartCardSkeleton />}>
            <ChartCard
              title="Chỉ số sức khỏe"
              subtitle="Theo dõi hàng tuần"
              chartType="line"
              showExport={false}
              onRefresh={() => console.log('Refreshing health metrics...')}
              trend={{
                value: 5.2,
                label: 'cải thiện',
                direction: 'up'
              }}
            >
              <ProgressChart data={[
                { label: 'Huyết áp', value: 85, color: 'green', target: 100 },
                { label: 'Nhịp tim', value: 92, color: 'blue', target: 100 },
                { label: 'Cân nặng', value: 78, color: 'purple', target: 100 },
                { label: 'Đường huyết', value: 88, color: 'orange', target: 100 }
              ]} />
            </ChartCard>
          </PulseWrapper>

          {/* Calendar */}
          <PulseWrapper isLoading={isCalendarLoading} fallback={<div className="h-96 bg-gray-100 rounded-lg animate-pulse" />}>
            <InteractiveCalendar
              events={calendarEvents}
              onDateSelect={(date) => console.log('Date selected:', date)}
              onEventClick={(event) => console.log('Event clicked:', event)}
              onAddEvent={(date) => console.log('Add event for:', date)}
              showMiniCalendar={true}
              showEventList={false}
            />
          </PulseWrapper>
        </div>

        {/* Health Metrics Comparison */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <Card>
            <CardContent className="p-6">
              <MetricComparison
                title="Huyết áp"
                current={120}
                previous={125}
                unit=" mmHg"
              />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <MetricComparison
                title="Cân nặng"
                current={70}
                previous={72}
                unit=" kg"
              />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <MetricComparison
                title="BMI"
                current={24.2}
                previous={24.8}
                format="number"
              />
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="shadow-lg border-0 bg-white">
          <CardHeader className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-t-lg">
            <CardTitle className="text-xl font-semibold flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <Button className="h-24 flex-col space-y-2 bg-gradient-to-br from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 text-blue-700 border-blue-200" variant="outline">
                <Calendar className="h-8 w-8" />
                <span className="text-xs font-medium">Book Appointment</span>
              </Button>
              <Button className="h-24 flex-col space-y-2 bg-gradient-to-br from-green-50 to-green-100 hover:from-green-100 hover:to-green-200 text-green-700 border-green-200" variant="outline">
                <FileText className="h-8 w-8" />
                <span className="text-xs font-medium">Medical Records</span>
              </Button>
              <Button className="h-24 flex-col space-y-2 bg-gradient-to-br from-red-50 to-red-100 hover:from-red-100 hover:to-red-200 text-red-700 border-red-200" variant="outline">
                <Heart className="h-8 w-8" />
                <span className="text-xs font-medium">Health Tracking</span>
              </Button>
              <Button className="h-24 flex-col space-y-2 bg-gradient-to-br from-orange-50 to-orange-100 hover:from-orange-100 hover:to-orange-200 text-orange-700 border-orange-200" variant="outline">
                <Pill className="h-8 w-8" />
                <span className="text-xs font-medium">Medications</span>
              </Button>
              <Button className="h-24 flex-col space-y-2 bg-gradient-to-br from-purple-50 to-purple-100 hover:from-purple-100 hover:to-purple-200 text-purple-700 border-purple-200" variant="outline">
                <MessageCircle className="h-8 w-8" />
                <span className="text-xs font-medium">Contact Doctor</span>
              </Button>
              <Button className="h-24 flex-col space-y-2 bg-gradient-to-br from-red-50 to-red-100 hover:from-red-100 hover:to-red-200 text-red-700 border-red-200" variant="outline">
                <Phone className="h-8 w-8" />
                <span className="text-xs font-medium">Emergency</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </PatientLayout>
  )
}
