'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Calendar,
  Users,
  RefreshCw,
  DollarSign,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  Clock,
  User,
  Star
} from 'lucide-react'
import { useEnhancedAuth } from '@/lib/auth/auth-wrapper'
import { DoctorLayout } from '@/components/layout'
import { toast } from 'sonner'
import { useDoctorDashboard } from '@/lib/apollo/hooks/useDoctorDashboard'
import { useAppointmentMutations } from '@/lib/apollo/hooks/useAppointmentMutations'
import { useRealtimeSubscriptions } from '@/lib/apollo/hooks/useRealtimeSubscriptions'
import { AppointmentStatus } from '@/lib/apollo/types/generated'

export default function GraphQLDoctorDashboard() {
  const { user, loading: authLoading } = useEnhancedAuth()
  const router = useRouter()
  const [currentDate, setCurrentDate] = useState("")
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [isInitialized, setIsInitialized] = useState(false)

  // Get doctor ID from user profile
  const doctorId = user?.doctor_id || user?.id

  // GraphQL hooks
  const {
    dashboard,
    loading: dashboardLoading,
    error: dashboardError,
    refetch: refetchDashboard
  } = useDoctorDashboard({
    doctorId: doctorId || "",
    skip: !doctorId,
  })

  const {
    confirmAppointment,
    cancelAppointment,
    loading: mutationLoading
  } = useAppointmentMutations({
    doctorId: doctorId || "",
  })

  // Real-time subscriptions
  const {
    appointmentData,
    newAppointmentData,
    queueData,
    doctorStatusData,
    notificationData
  } = useRealtimeSubscriptions({
    doctorId: doctorId || "",
    onAppointmentUpdate: (appointment) => {
      // Refetch dashboard when appointments are updated
      refetchDashboard()
    },
    onDoctorStatusChange: (doctor) => {
      // Handle doctor status changes
      console.log('Doctor status changed:', doctor)
    },
    onNotification: (notification) => {
      // Handle new notifications
      console.log('New notification:', notification)
    },
    enableToasts: true
  })

  useEffect(() => {
    const now = new Date()
    setCurrentDate(now.toLocaleDateString('vi-VN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }))
  }, [])

  useEffect(() => {
    if (!authLoading && !isInitialized) {
      setIsInitialized(true)
    }
  }, [user, authLoading, isInitialized])

  const handleRefresh = async () => {
    try {
      await refetchDashboard()
      toast.success('Dữ liệu đã được cập nhật')
    } catch (error) {
      toast.error('Lỗi khi cập nhật dữ liệu')
    }
  }

  const handleConfirmAppointment = async (appointmentId: string) => {
    try {
      await confirmAppointment(appointmentId)
    } catch (error) {
      console.error('Error confirming appointment:', error)
    }
  }

  const handleCancelAppointment = async (appointmentId: string, reason?: string) => {
    try {
      await cancelAppointment(appointmentId, reason)
    } catch (error) {
      console.error('Error cancelling appointment:', error)
    }
  }

  const getStatusColor = (status: AppointmentStatus) => {
    switch (status) {
      case AppointmentStatus.CONFIRMED:
        return 'bg-teal-100 text-teal-800'
      case AppointmentStatus.SCHEDULED:
        return 'bg-blue-100 text-blue-800'
      case AppointmentStatus.IN_PROGRESS:
        return 'bg-yellow-100 text-yellow-800'
      case AppointmentStatus.COMPLETED:
        return 'bg-green-100 text-green-800'
      case AppointmentStatus.CANCELLED:
        return 'bg-gray-100 text-gray-800'
      case AppointmentStatus.NO_SHOW:
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status: AppointmentStatus) => {
    switch (status) {
      case AppointmentStatus.CONFIRMED:
        return 'Đã xác nhận'
      case AppointmentStatus.SCHEDULED:
        return 'Đã lên lịch'
      case AppointmentStatus.IN_PROGRESS:
        return 'Đang diễn ra'
      case AppointmentStatus.COMPLETED:
        return 'Hoàn thành'
      case AppointmentStatus.CANCELLED:
        return 'Đã hủy'
      case AppointmentStatus.NO_SHOW:
        return 'Không đến'
      default:
        return status
    }
  }

  if (authLoading || !isInitialized) {
    return (
      <DoctorLayout title="Dashboard" activePage="dashboard">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
        </div>
      </DoctorLayout>
    )
  }

  if (!user) {
    router.push('/auth/login')
    return null
  }

  if (dashboardError) {
    return (
      <DoctorLayout title="Dashboard" activePage="dashboard">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-red-600 mb-4">Lỗi khi tải dữ liệu dashboard</p>
            <Button onClick={handleRefresh} variant="outline">
              Thử lại
            </Button>
          </div>
        </div>
      </DoctorLayout>
    )
  }

  const stats = dashboard?.appointmentStats
  const todayAppointments = dashboard?.todayAppointments || []
  const upcomingAppointments = dashboard?.upcomingAppointments || []
  const recentPatients = dashboard?.recentPatients || []

  return (
    <DoctorLayout
      title="Hospital Dashboard"
      activePage="dashboard"
      subtitle={`Chào mừng trở lại, ${dashboard?.doctor?.fullName || user?.full_name || 'Bác sĩ'} - ${currentDate}`}
      headerActions={
        <div className="flex gap-2 items-center">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={dashboardLoading || mutationLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${dashboardLoading ? 'animate-spin' : ''}`} />
            {dashboardLoading ? 'Đang tải...' : 'Làm mới'}
          </Button>
        </div>
      }
    >
      {/* Main Layout: Left Content + Right Calendar */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-full">
        {/* Left Content Area */}
        <div className="lg:col-span-3 space-y-6">
          {/* Top Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Total Appointments */}
            <Card className="bg-white border border-gray-200 hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">Tổng cuộc hẹn</p>
                    <p className="text-3xl font-bold text-gray-900">
                      {dashboardLoading ? '...' : (stats?.total || 0).toLocaleString()}
                    </p>
                    <div className="flex items-center mt-2">
                      <ArrowUpRight className="h-4 w-4 text-teal-500 mr-1" />
                      <span className="text-sm text-teal-600 font-medium">Tháng này</span>
                    </div>
                  </div>
                  <div className="p-3 bg-teal-100 rounded-full">
                    <Calendar className="h-6 w-6 text-teal-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Total Patients */}
            <Card className="bg-white border border-gray-200 hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">Tổng bệnh nhân</p>
                    <p className="text-3xl font-bold text-gray-900">
                      {dashboardLoading ? '...' : (dashboard?.doctor?.totalPatients || 0)}
                    </p>
                    <div className="flex items-center mt-2">
                      <ArrowUpRight className="h-4 w-4 text-teal-500 mr-1" />
                      <span className="text-sm text-teal-600 font-medium">Đang theo dõi</span>
                    </div>
                  </div>
                  <div className="p-3 bg-teal-100 rounded-full">
                    <Users className="h-6 w-6 text-teal-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Average Rating */}
            <Card className="bg-white border border-gray-200 hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">Đánh giá trung bình</p>
                    <p className="text-3xl font-bold text-gray-900">
                      {dashboardLoading ? '...' : (dashboard?.doctor?.averageRating?.toFixed(1) || '0.0')}
                    </p>
                    <div className="flex items-center mt-2">
                      <Star className="h-4 w-4 text-yellow-500 mr-1 fill-current" />
                      <span className="text-sm text-yellow-600 font-medium">5 sao</span>
                    </div>
                  </div>
                  <div className="p-3 bg-yellow-100 rounded-full">
                    <Star className="h-6 w-6 text-yellow-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Today's Appointments */}
          <Card className="shadow-lg border-0 bg-white">
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <CardTitle className="text-xl font-bold text-gray-900 tracking-tight">
                Cuộc hẹn hôm nay ({todayAppointments.length})
              </CardTitle>
              <Button variant="ghost" className="text-teal-600 hover:text-teal-700 hover:bg-teal-50 font-medium">
                Xem tất cả
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              {dashboardLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-teal-600"></div>
                </div>
              ) : todayAppointments.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Clock className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>Không có cuộc hẹn nào hôm nay</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {todayAppointments.slice(0, 5).map((appointment) => (
                    <div key={appointment.id} className="flex items-center justify-between p-6 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center space-x-4">
                        <div className="p-2 bg-teal-100 rounded-full">
                          <User className="h-5 w-5 text-teal-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{appointment.patient.fullName}</p>
                          <p className="text-sm text-gray-600">{appointment.scheduledTime}</p>
                          {appointment.notes && (
                            <p className="text-xs text-gray-500 mt-1">{appointment.notes}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(appointment.status)}`}>
                          {getStatusText(appointment.status)}
                        </span>
                        {appointment.status === AppointmentStatus.SCHEDULED && (
                          <Button
                            size="sm"
                            onClick={() => handleConfirmAppointment(appointment.id)}
                            disabled={mutationLoading}
                          >
                            Xác nhận
                          </Button>
                        )}
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Sidebar - Quick Stats & Schedule */}
        <div className="lg:col-span-1 space-y-6">
          {/* Quick Stats */}
          <Card className="bg-white border border-gray-200">
            <CardHeader>
              <CardTitle className="text-lg font-bold text-gray-900">Thống kê nhanh</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Hôm nay</span>
                <span className="font-semibold">{stats?.today || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Tuần này</span>
                <span className="font-semibold">{stats?.thisWeek || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Tháng này</span>
                <span className="font-semibold">{stats?.thisMonth || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Hoàn thành</span>
                <span className="font-semibold text-green-600">{stats?.completed || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Đã hủy</span>
                <span className="font-semibold text-red-600">{stats?.cancelled || 0}</span>
              </div>
            </CardContent>
          </Card>

          {/* Recent Patients */}
          <Card className="bg-white border border-gray-200">
            <CardHeader>
              <CardTitle className="text-lg font-bold text-gray-900">Bệnh nhân gần đây</CardTitle>
            </CardHeader>
            <CardContent>
              {dashboardLoading ? (
                <div className="flex items-center justify-center py-4">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-teal-600"></div>
                </div>
              ) : recentPatients.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">Chưa có bệnh nhân nào</p>
              ) : (
                <div className="space-y-3">
                  {recentPatients.slice(0, 5).map((patient) => (
                    <div key={patient.id} className="flex items-center space-x-3">
                      <div className="p-1 bg-gray-100 rounded-full">
                        <User className="h-4 w-4 text-gray-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {patient.fullName}
                        </p>
                        <p className="text-xs text-gray-500">
                          {patient.totalAppointments} cuộc hẹn
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DoctorLayout>
  )
}
