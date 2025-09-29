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
  Plus
} from 'lucide-react'
import { useEnhancedAuth } from '@/lib/auth/auth-wrapper'
import { DoctorLayout } from '@/components/layout'
import { toast } from 'sonner'

interface DashboardStats {
  totalInvoice: number
  totalPatients: number
  appointments: number
}





export default function DoctorDashboard() {
  const { user, loading } = useEnhancedAuth()
  const router = useRouter()
  const [currentDate, setCurrentDate] = useState("")
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [isInitialized, setIsInitialized] = useState(false)
  
  const [dashboardStats] = useState<DashboardStats>({
    totalInvoice: 1287,
    totalPatients: 965,
    appointments: 128
  })





  const [isLoadingStats, setIsLoadingStats] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)

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
    if (!loading && !isInitialized) {
      setIsInitialized(true)
      if (user) {
        setIsLoadingStats(false)
      }
    }
  }, [user, loading, isInitialized])

  const handleRefresh = async () => {
    setIsRefreshing(true)
    // Simulate refresh
    setTimeout(() => {
      setIsRefreshing(false)
      toast.success('Dữ liệu đã được cập nhật')
    }, 1000)
  }

  const generateCalendar = () => {
    const year = selectedDate.getFullYear()
    const month = selectedDate.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const startDate = new Date(firstDay)
    startDate.setDate(startDate.getDate() - firstDay.getDay())

    const days = []
    const current = new Date(startDate)

    for (let i = 0; i < 42; i++) {
      days.push(new Date(current))
      current.setDate(current.getDate() + 1)
    }

    return days
  }

  const isToday = (date: Date) => {
    const today = new Date()
    return date.toDateString() === today.toDateString()
  }

  const isCurrentMonth = (date: Date) => {
    return date.getMonth() === selectedDate.getMonth()
  }

  if (loading || !isInitialized) {
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

  return (
    <DoctorLayout
      title="Hospital Dashboard"
      activePage="dashboard"
      subtitle={`Welcome back, ${user?.full_name || 'Doctor'} - ${currentDate}`}
      headerActions={
        <div className="flex gap-2 items-center">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
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
          {/* Total Invoice */}
          <Card className="bg-white border border-gray-200 hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Total Invoice</p>
                  <p className="text-3xl font-bold text-gray-900">{dashboardStats.totalInvoice.toLocaleString()}</p>
                  <div className="flex items-center mt-2">
                    <ArrowUpRight className="h-4 w-4 text-teal-500 mr-1" />
                    <span className="text-sm text-teal-600 font-medium">+2.14%</span>
                  </div>
                </div>
                <div className="p-3 bg-teal-100 rounded-full">
                  <DollarSign className="h-6 w-6 text-teal-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Total Patients */}
          <Card className="bg-white border border-gray-200 hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Total Patients</p>
                  <p className="text-3xl font-bold text-gray-900">{dashboardStats.totalPatients}</p>
                  <div className="flex items-center mt-2">
                    <ArrowUpRight className="h-4 w-4 text-teal-500 mr-1" />
                    <span className="text-sm text-teal-600 font-medium">+3.78%</span>
                  </div>
                </div>
                <div className="p-3 bg-teal-100 rounded-full">
                  <Users className="h-6 w-6 text-teal-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Appointments */}
          <Card className="bg-white border border-gray-200 hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Appointments</p>
                  <p className="text-3xl font-bold text-gray-900">{dashboardStats.appointments}</p>
                  <div className="flex items-center mt-2">
                    <ArrowDownRight className="h-4 w-4 text-red-500 mr-1" />
                    <span className="text-sm text-red-600 font-medium">-1.5%</span>
                  </div>
                </div>
                <div className="p-3 bg-red-100 rounded-full">
                  <Calendar className="h-6 w-6 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>


          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Patient Overview by Age Stages */}
          <Card className="shadow-lg border-0 bg-white">
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <div>
                <CardTitle className="text-xl font-bold text-gray-900 tracking-tight">Patient Overview</CardTitle>
                <p className="text-sm text-gray-500 mt-1">by Age Stages</p>
              </div>
              <Button variant="outline" size="sm" className="bg-slate-700 text-white hover:bg-slate-800 px-4 py-2 rounded-lg">
                Last 8 Days
                <ChevronRight className="h-4 w-4 ml-1 rotate-90" />
              </Button>
            </CardHeader>
            <CardContent className="pt-0">
              {/* Legend */}
              <div className="flex items-center gap-6 mb-6">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-slate-700 rounded-full"></div>
                  <span className="text-sm text-gray-600 font-medium">Child</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-teal-400 rounded-full"></div>
                  <span className="text-sm text-gray-600 font-medium">Adult</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-teal-200 rounded-full"></div>
                  <span className="text-sm text-gray-600 font-medium">Elderly</span>
                </div>
              </div>

              {/* Summary Cards */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-teal-50 rounded-lg p-4 text-center">
                  <div className="text-xs text-gray-500 mb-1">Child</div>
                  <div className="text-2xl font-bold text-gray-900">105</div>
                </div>
                <div className="bg-teal-50 rounded-lg p-4 text-center">
                  <div className="text-xs text-gray-500 mb-1">Adult</div>
                  <div className="text-2xl font-bold text-gray-900">132</div>
                </div>
                <div className="bg-teal-50 rounded-lg p-4 text-center">
                  <div className="text-xs text-gray-500 mb-1">Elderly</div>
                  <div className="text-2xl font-bold text-gray-900">38</div>
                </div>
              </div>

              {/* Bar Chart */}
              <div className="relative">
                {/* Y-axis labels */}
                <div className="absolute left-0 top-0 h-64 flex flex-col justify-between text-xs text-gray-400 pr-4">
                  <span>160</span>
                  <span>120</span>
                  <span>80</span>
                  <span>40</span>
                  <span>0</span>
                </div>

                {/* Chart area */}
                <div className="ml-8 h-64 flex items-end justify-between gap-3 border-l border-b border-gray-200 pl-4 pb-4">
                  {[
                    { day: '4 Jul', child: 80, adult: 45, elderly: 25 },
                    { day: '5 Jul', child: 130, adult: 65, elderly: 30 },
                    { day: '6 Jul', child: 110, adult: 80, elderly: 35 },
                    { day: '7 Jul', child: 125, adult: 90, elderly: 40 },
                    { day: '8 Jul', child: 85, adult: 70, elderly: 28 },
                    { day: '9 Jul', child: 115, adult: 35, elderly: 45 },
                    { day: '10 Jul', child: 140, adult: 60, elderly: 50 },
                    { day: '11 Jul', child: 135, adult: 80, elderly: 45 }
                  ].map((data, index) => {
                    const maxValue = 160
                    const chartHeight = 240

                    return (
                      <div key={index} className="flex flex-col items-center gap-3">
                        <div className="flex items-end gap-1">
                          {/* Child bar */}
                          <div
                            className="bg-slate-700 rounded-t-sm w-6"
                            style={{ height: `${(data.child / maxValue) * chartHeight}px` }}
                          ></div>
                          {/* Adult bar */}
                          <div
                            className="bg-teal-400 rounded-t-sm w-6"
                            style={{ height: `${(data.adult / maxValue) * chartHeight}px` }}
                          ></div>
                          {/* Elderly bar */}
                          <div
                            className="bg-teal-200 rounded-t-sm w-6"
                            style={{ height: `${(data.elderly / maxValue) * chartHeight}px` }}
                          ></div>
                        </div>
                        <span className="text-xs text-gray-500 font-medium">{data.day}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Revenue Chart */}
          <Card className="shadow-lg border-0 bg-white">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xl font-bold text-gray-900 tracking-tight">Revenue</CardTitle>
              <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="bg-gradient-to-r from-teal-600 to-teal-700 text-white hover:from-teal-700 hover:to-teal-800 shadow-sm transition-all duration-200 px-4 py-2 rounded-md"
                >
                  Week
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-gray-600 hover:bg-white hover:text-teal-600 transition-all duration-200 px-4 py-2 rounded-md"
                >
                  Month
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-gray-600 hover:bg-white hover:text-teal-600 transition-all duration-200 px-4 py-2 rounded-md"
                >
                  Year
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              {/* Legend and Revenue Display */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-slate-700"></div>
                    <span className="text-sm font-medium text-gray-600">Income</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-teal-400"></div>
                    <span className="text-sm font-medium text-gray-600">Expense</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-teal-600">$1,495</div>
                  <div className="text-xs text-gray-500">Net Revenue</div>
                </div>
              </div>

              {/* Enhanced Chart */}
              <div className="h-64 relative bg-white rounded-lg border border-gray-200 p-6">
                <svg className="w-full h-full" viewBox="0 0 500 240">
                  <defs>
                    {/* Clear Gradients with Better Contrast */}
                    <linearGradient id="incomeAreaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#1e293b" stopOpacity="0.2"/>
                      <stop offset="100%" stopColor="#1e293b" stopOpacity="0.05"/>
                    </linearGradient>
                    <linearGradient id="expenseAreaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#14b8a6" stopOpacity="0.3"/>
                      <stop offset="100%" stopColor="#14b8a6" stopOpacity="0.08"/>
                    </linearGradient>
                  </defs>

                  {/* Horizontal Grid Lines - Đậm hơn */}
                  <line x1="60" y1="50" x2="460" y2="50" stroke="#d1d5db" strokeWidth="1"/>
                  <line x1="60" y1="90" x2="460" y2="90" stroke="#d1d5db" strokeWidth="1"/>
                  <line x1="60" y1="130" x2="460" y2="130" stroke="#d1d5db" strokeWidth="1"/>
                  <line x1="60" y1="170" x2="460" y2="170" stroke="#d1d5db" strokeWidth="1"/>
                  <line x1="60" y1="210" x2="460" y2="210" stroke="#9ca3af" strokeWidth="1.5"/>

                  {/* Vertical Grid Lines - Thêm đường dọc */}
                  <line x1="120" y1="50" x2="120" y2="210" stroke="#e5e7eb" strokeWidth="1"/>
                  <line x1="180" y1="50" x2="180" y2="210" stroke="#e5e7eb" strokeWidth="1"/>
                  <line x1="240" y1="50" x2="240" y2="210" stroke="#e5e7eb" strokeWidth="1"/>
                  <line x1="300" y1="50" x2="300" y2="210" stroke="#e5e7eb" strokeWidth="1"/>
                  <line x1="360" y1="50" x2="360" y2="210" stroke="#e5e7eb" strokeWidth="1"/>
                  <line x1="420" y1="50" x2="420" y2="210" stroke="#e5e7eb" strokeWidth="1"/>

                  {/* Y-axis labels - Đậm hơn */}
                  <text x="45" y="55" className="text-xs fill-gray-600" fontSize="12" textAnchor="end" fontWeight="500">1.6K</text>
                  <text x="45" y="95" className="text-xs fill-gray-600" fontSize="12" textAnchor="end" fontWeight="500">1.2K</text>
                  <text x="45" y="135" className="text-xs fill-gray-600" fontSize="12" textAnchor="end" fontWeight="500">800</text>
                  <text x="45" y="175" className="text-xs fill-gray-600" fontSize="12" textAnchor="end" fontWeight="500">400</text>
                  <text x="45" y="215" className="text-xs fill-gray-600" fontSize="12" textAnchor="end" fontWeight="500">0</text>

                  {/* Expense Area (Bottom Layer) - Điều chỉnh theo hình mẫu */}
                  <polygon
                    fill="url(#expenseAreaGradient)"
                    points="60,175 120,155 180,185 240,170 300,170 360,165 420,170 420,210 60,210"
                  />

                  {/* Income Area (Top Layer) - Điều chỉnh theo hình mẫu */}
                  <polygon
                    fill="url(#incomeAreaGradient)"
                    points="60,130 120,105 180,120 240,70 300,95 360,110 420,100 420,210 60,210"
                  />

                  {/* Expense Line - Khớp với hình mẫu */}
                  <polyline
                    fill="none"
                    stroke="#14b8a6"
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    points="60,175 120,155 180,185 240,170 300,170 360,165 420,170"
                  />

                  {/* Income Line - Khớp với hình mẫu */}
                  <polyline
                    fill="none"
                    stroke="#1e293b"
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    points="60,130 120,105 180,120 240,70 300,95 360,110 420,100"
                  />

                  {/* Data Points for Income Line - Khớp với hình mẫu */}
                  <circle cx="60" cy="130" r="5" fill="#1e293b"/>
                  <circle cx="120" cy="105" r="5" fill="#1e293b"/>
                  <circle cx="180" cy="120" r="5" fill="#1e293b"/>
                  <circle cx="240" cy="70" r="6" fill="#1e293b" stroke="white" strokeWidth="2"/>
                  <circle cx="300" cy="95" r="5" fill="#1e293b"/>
                  <circle cx="360" cy="110" r="5" fill="#1e293b"/>
                  <circle cx="420" cy="100" r="5" fill="#1e293b"/>

                  {/* Data Points for Expense Line - Khớp với hình mẫu */}
                  <circle cx="60" cy="175" r="5" fill="#14b8a6"/>
                  <circle cx="120" cy="155" r="5" fill="#14b8a6"/>
                  <circle cx="180" cy="185" r="5" fill="#14b8a6"/>
                  <circle cx="240" cy="170" r="5" fill="#14b8a6"/>
                  <circle cx="300" cy="170" r="5" fill="#14b8a6"/>
                  <circle cx="360" cy="165" r="5" fill="#14b8a6"/>
                  <circle cx="420" cy="170" r="5" fill="#14b8a6"/>
                </svg>

                {/* X-axis labels - Đậm hơn */}
                <div className="absolute bottom-4 left-0 right-0 flex justify-between px-16 text-sm text-gray-700">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                    <span key={day} className="font-semibold">{day}</span>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
          </div>

          {/* Bottom Section - Patient Appointment Table */}
          <div>
            {/* Patient Appointment Table */}
            <Card className="shadow-lg border-0 bg-white">
              <CardHeader className="flex flex-row items-center justify-between pb-4">
                <CardTitle className="text-xl font-bold text-gray-900 tracking-tight">Patient Appointment</CardTitle>
                <Button variant="ghost" className="text-teal-600 hover:text-teal-700 hover:bg-teal-50 font-medium">
                  View All
                </Button>
              </CardHeader>
              <CardContent className="p-0">
                {/* Date Navigation */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <div className="flex items-center gap-1">
                    {[
                      { day: 'Wed', date: '12', active: false },
                      { day: 'Thu', date: '13', active: false },
                      { day: 'Fri', date: '14', active: false },
                      { day: 'Sat', date: '15', active: false },
                      { day: 'Sun', date: '16', active: false },
                      { day: 'Mon', date: '17', active: false },
                      { day: 'Tue', date: '18', active: false },
                      { day: 'Wed', date: '19', active: false },
                      { day: 'Thu', date: '20', active: true },
                      { day: 'Fri', date: '21', active: false },
                      { day: 'Sat', date: '22', active: false },
                      { day: 'Sun', date: '23', active: false },
                      { day: 'Mon', date: '24', active: false },
                      { day: 'Tue', date: '25', active: false }
                    ].map((item, index) => (
                      <div
                        key={index}
                        className={`flex flex-col items-center p-2 rounded-lg cursor-pointer transition-colors ${
                          item.active
                            ? 'bg-slate-800 text-white'
                            : 'hover:bg-gray-100 text-gray-600'
                        }`}
                      >
                        <span className="text-xs font-medium">{item.day}</span>
                        <span className="text-sm font-semibold">{item.date}</span>
                      </div>
                    ))}
                  </div>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>

                {/* Table Header */}
                <div className="grid grid-cols-6 gap-4 px-6 py-3 bg-gray-50 text-xs font-semibold text-gray-600 uppercase tracking-wide">
                  <div className="flex items-center gap-1">
                    Name
                    <ChevronRight className="h-3 w-3 rotate-90" />
                  </div>
                  <div className="flex items-center gap-1">
                    Date
                    <ChevronRight className="h-3 w-3 rotate-90" />
                  </div>
                  <div className="flex items-center gap-1">
                    Time
                    <ChevronRight className="h-3 w-3 rotate-90" />
                  </div>
                  <div className="flex items-center gap-1">
                    Doctor
                    <ChevronRight className="h-3 w-3 rotate-90" />
                  </div>
                  <div className="flex items-center gap-1">
                    Treatment
                    <ChevronRight className="h-3 w-3 rotate-90" />
                  </div>
                  <div className="flex items-center gap-1">
                    Status
                    <ChevronRight className="h-3 w-3 rotate-90" />
                  </div>
                </div>

                {/* Table Rows */}
                <div className="divide-y divide-gray-100">
                  {[
                    {
                      name: 'Caren G. Simpson',
                      date: '20-07-28',
                      time: '09:00 AM',
                      doctor: 'Dr. Petra Winsbury',
                      treatment: 'Routine Check-Up',
                      status: 'Confirmed',
                      statusColor: 'bg-teal-100 text-teal-800'
                    },
                    {
                      name: 'Edgar Warrow',
                      date: '20-07-28',
                      time: '10:30 AM',
                      doctor: 'Dr. Olivia Martinez',
                      treatment: 'Cardiac Consultation',
                      status: 'Confirmed',
                      statusColor: 'bg-teal-100 text-teal-800'
                    },
                    {
                      name: 'Ocean Jane Lupre',
                      date: '20-07-28',
                      time: '11:00 AM',
                      doctor: 'Dr. Damian Sanchez',
                      treatment: 'Pediatric Check-Up',
                      status: 'Pending',
                      statusColor: 'bg-orange-100 text-orange-800'
                    },
                    {
                      name: 'Shane Riddick',
                      date: '20-07-28',
                      time: '01:00 PM',
                      doctor: 'Dr. Chloe Harrington',
                      treatment: 'Skin Allergy',
                      status: 'Cancelled',
                      statusColor: 'bg-gray-100 text-gray-800'
                    },
                    {
                      name: 'Queen Lawnston',
                      date: '20-07-28',
                      time: '02:30 PM',
                      doctor: 'Dr. Petra Winsbury',
                      treatment: 'Follow-Up Visit',
                      status: 'Confirmed',
                      statusColor: 'bg-teal-100 text-teal-800'
                    }
                  ].map((appointment, index) => (
                    <div key={index} className="grid grid-cols-6 gap-4 px-6 py-4 hover:bg-gray-50 transition-colors">
                      <div className="font-medium text-gray-900">{appointment.name}</div>
                      <div className="text-gray-600">{appointment.date}</div>
                      <div className="text-gray-600">{appointment.time}</div>
                      <div className="text-gray-600">{appointment.doctor}</div>
                      <div className="text-gray-600">{appointment.treatment}</div>
                      <div className="flex items-center justify-between">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${appointment.statusColor}`}>
                          {appointment.status}
                        </span>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Right Calendar Column - Full Height */}
        <div className="lg:col-span-1">
          <Card className="h-full shadow-lg border-0 bg-white">
            <CardContent className="p-6">
              {/* Calendar Header */}
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-xl font-bold text-gray-900 tracking-tight">
                  {selectedDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </h2>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-9 w-9 p-0 hover:bg-teal-50 hover:text-teal-600 transition-colors duration-200 rounded-lg"
                    onClick={() => {
                      const newDate = new Date(selectedDate)
                      newDate.setMonth(newDate.getMonth() - 1)
                      setSelectedDate(newDate)
                    }}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-9 w-9 p-0 hover:bg-teal-50 hover:text-teal-600 transition-colors duration-200 rounded-lg"
                    onClick={() => {
                      const newDate = new Date(selectedDate)
                      newDate.setMonth(newDate.getMonth() + 1)
                      setSelectedDate(newDate)
                    }}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              {/* Calendar Grid */}
              <div className="mb-8">
                {/* Day Headers */}
                <div className="grid grid-cols-7 mb-3 bg-gray-50 rounded-lg p-2">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                    <div key={day} className="text-center text-xs font-semibold text-gray-600 py-2">
                      {day}
                    </div>
                  ))}
                </div>

                {/* Calendar Dates */}
                <div className="grid grid-cols-7 gap-2">
                  {generateCalendar().map((date, index) => {
                    const isCurrentDate = isToday(date)
                    const isCurrentMonthDate = isCurrentMonth(date)

                    return (
                      <div
                        key={index}
                        className={`
                          text-center text-sm p-3 cursor-pointer rounded-xl transition-all duration-200 border
                          ${isCurrentDate
                            ? 'bg-gradient-to-br from-teal-600 to-teal-700 text-white font-bold shadow-lg shadow-teal-200 border-teal-600 transform scale-105'
                            : isCurrentMonthDate
                              ? 'text-gray-900 hover:bg-teal-50 hover:text-teal-700 hover:border-teal-200 hover:shadow-md font-semibold border-gray-200 bg-white'
                              : 'text-gray-400 font-normal border-transparent bg-gray-50/50 hover:bg-gray-100'
                          }
                        `}
                      >
                        {date.getDate()}
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Today's Schedule */}
              <div className="border-t-2 border-gray-100 pt-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-base font-bold text-gray-900">Wednesday, 12 July</h3>
                  <Button
                    size="sm"
                    className="h-9 w-9 p-0 bg-gradient-to-br from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 shadow-lg shadow-teal-200 transition-all duration-200 transform hover:scale-105"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>

                {/* Timeline Schedule */}
                <div className="space-y-0 relative">
                  {/* Timeline line */}
                  <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-gray-200 via-teal-200 to-gray-200"></div>

                  {/* 08:00 - Morning Staff Meeting */}
                  <div className="flex relative bg-white">
                    <div className="w-12 text-xs font-semibold text-gray-600 pt-3 pb-3 bg-white z-10">08:00</div>
                    <div className="flex-1 ml-4 py-2">
                      <div className="bg-gradient-to-r from-teal-100 to-teal-200 border border-teal-300 rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-200 hover:scale-[1.02]">
                        <div className="text-sm font-bold text-teal-900">Morning Staff Meeting</div>
                        <div className="text-xs text-teal-700 font-medium mt-1">08:00 AM - 09:00 AM</div>
                      </div>
                    </div>
                  </div>

                  {/* 09:00 - Empty slot with gray background */}
                  <div className="flex relative bg-gray-50">
                    <div className="w-12 text-xs font-medium text-gray-400 pt-3 pb-3 bg-gray-50 z-10">09:00</div>
                    <div className="flex-1 ml-4 py-3 min-h-[3rem] flex items-center">
                      <div className="w-full border-l-2 border-dashed border-gray-300 ml-2 h-6"></div>
                    </div>
                  </div>

                  {/* 10:00 - Patient Consultation */}
                  <div className="flex relative bg-white">
                    <div className="w-12 text-xs font-semibold text-gray-600 pt-3 pb-3 bg-white z-10">10:00</div>
                    <div className="flex-1 ml-4 py-2">
                      <div className="bg-gradient-to-r from-teal-100 to-teal-200 border border-teal-300 rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-200 hover:scale-[1.02]">
                        <div className="text-sm font-bold text-teal-900">Patient Consultation - General Medicine</div>
                        <div className="text-xs text-teal-700 font-medium mt-1">10:00 AM - 12:00 PM</div>
                      </div>
                    </div>
                  </div>

                  {/* 11:00 - Continues from above (part of 10:00 consultation) */}
                  <div className="flex relative bg-gray-50">
                    <div className="w-12 text-xs font-medium text-gray-400 pt-3 pb-3 bg-gray-50 z-10">11:00</div>
                    <div className="flex-1 ml-4 py-3 min-h-[3rem] flex items-center">
                      <div className="w-full border-l-2 border-dashed border-gray-300 ml-2 h-6"></div>
                    </div>
                  </div>

                  {/* 12:00 - Empty slot with white background */}
                  <div className="flex relative bg-white">
                    <div className="w-12 text-xs font-medium text-gray-400 pt-3 pb-3 bg-white z-10">12:00</div>
                    <div className="flex-1 ml-4 py-3 min-h-[3rem] flex items-center">
                      <div className="w-full border-l-2 border-dashed border-gray-300 ml-2 h-6"></div>
                    </div>
                  </div>

                  {/* 01:00 - Surgery */}
                  <div className="flex relative bg-gray-50">
                    <div className="w-12 text-xs font-semibold text-gray-600 pt-3 pb-3 bg-gray-50 z-10">01:00</div>
                    <div className="flex-1 ml-4 py-2">
                      <div className="bg-gradient-to-r from-emerald-100 to-emerald-200 border border-emerald-300 rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-200 hover:scale-[1.02]">
                        <div className="text-sm font-bold text-emerald-900">Surgery - Orthopedics</div>
                        <div className="text-xs text-emerald-700 font-medium mt-1">01:00 PM - 03:00 PM</div>
                      </div>
                    </div>
                  </div>

                  {/* 02:00 - Continues from surgery (part of 01:00 surgery) */}
                  <div className="flex relative bg-white">
                    <div className="w-12 text-xs font-medium text-gray-400 pt-3 pb-3 bg-white z-10">02:00</div>
                    <div className="flex-1 ml-4 py-3 min-h-[3rem] flex items-center">
                      <div className="w-full border-l-2 border-dashed border-gray-300 ml-2 h-6"></div>
                    </div>
                  </div>

                  {/* 03:00 - Empty slot with gray background */}
                  <div className="flex relative bg-gray-50">
                    <div className="w-12 text-xs font-medium text-gray-400 pt-3 pb-3 bg-gray-50 z-10">03:00</div>
                    <div className="flex-1 ml-4 py-3 min-h-[3rem] flex items-center">
                      <div className="w-full border-l-2 border-dashed border-gray-300 ml-2 h-6"></div>
                    </div>
                  </div>

                  {/* 04:00 - Training Session */}
                  <div className="flex relative bg-white">
                    <div className="w-12 text-xs font-semibold text-gray-600 pt-3 pb-3 bg-white z-10">04:00</div>
                    <div className="flex-1 ml-4 py-2">
                      <div className="bg-gradient-to-r from-blue-100 to-blue-200 border border-blue-300 rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-200 hover:scale-[1.02]">
                        <div className="text-sm font-bold text-blue-900">Training Session</div>
                        <div className="text-xs text-blue-700 font-medium mt-1">04:00 PM - 05:00 PM</div>
                      </div>
                    </div>
                  </div>

                  {/* 05:00 - End with gray background */}
                  <div className="flex relative bg-gray-50">
                    <div className="w-12 text-xs font-medium text-gray-400 pt-3 pb-3 bg-gray-50 z-10">05:00</div>
                    <div className="flex-1 ml-4 py-3 min-h-[3rem] flex items-center">
                      <div className="w-full h-6"></div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DoctorLayout>
  )
}