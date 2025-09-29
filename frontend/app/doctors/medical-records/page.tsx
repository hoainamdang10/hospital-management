"use client"

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  FileText,
  Search,
  Filter,
  Plus,
  Eye,
  Edit,
  Calendar,
  User,
  Stethoscope,
  Activity,
  TrendingUp,
  Clock,
  AlertCircle,
  Download,
  RefreshCw
} from "lucide-react"
import { DoctorLayout } from "@/components/layout/UniversalLayout"
import { useEnhancedAuth } from "@/lib/auth/auth-wrapper"
import { medicalRecordsApi } from "@/lib/api/medical-records"
import { patientsApi } from "@/lib/api/patients"
import { toast } from "sonner"

interface MedicalRecord {
  record_id: string
  patient_id: string
  doctor_id: string
  appointment_id?: string
  visit_date: string
  chief_complaint: string
  present_illness?: string
  past_medical_history?: string
  physical_examination?: string
  vital_signs?: any
  diagnosis: string
  treatment_plan?: string
  medications?: string
  follow_up_instructions?: string
  notes?: string
  created_at: string
  updated_at: string
  // Joined data
  patient_name?: string
  patient_phone?: string
  patient_age?: number
}

interface MedicalRecordStats {
  totalRecords: number
  thisMonth: number
  thisWeek: number
  today: number
  commonDiagnoses: Array<{ diagnosis: string; count: number }>
  recentActivity: Array<{ date: string; count: number }>
}

export default function DoctorMedicalRecordsPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useEnhancedAuth()
  
  // State management
  const [medicalRecords, setMedicalRecords] = useState<MedicalRecord[]>([])
  const [filteredRecords, setFilteredRecords] = useState<MedicalRecord[]>([])
  const [stats, setStats] = useState<MedicalRecordStats>({
    totalRecords: 0,
    thisMonth: 0,
    thisWeek: 0,
    today: 0,
    commonDiagnoses: [],
    recentActivity: []
  })
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('')
  const [dateFilter, setDateFilter] = useState('all') // all, today, week, month
  const [diagnosisFilter, setDiagnosisFilter] = useState('all')
  const [activeTab, setActiveTab] = useState('all')

  // Load medical records
  useEffect(() => {
    if (user && user.role === 'doctor') {
      loadMedicalRecords()
    }
  }, [user])

  // Apply filters
  useEffect(() => {
    applyFilters()
  }, [medicalRecords, searchTerm, dateFilter, diagnosisFilter, activeTab])

  const loadMedicalRecords = async () => {
    try {
      setLoading(true)
      
      // Get medical records for this doctor
      const response = await medicalRecordsApi.getMedicalRecordsByDoctorId(user?.doctor_id || user?.id)
      
      if (response.success && response.data) {
        const records = response.data
        setMedicalRecords(records)
        
        // Calculate stats
        calculateStats(records)
      } else {
        toast.error('Không thể tải danh sách hồ sơ bệnh án')
      }
    } catch (error) {
      console.error('Error loading medical records:', error)
      toast.error('Có lỗi xảy ra khi tải dữ liệu')
    } finally {
      setLoading(false)
    }
  }

  const calculateStats = (records: MedicalRecord[]) => {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
    const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)

    const todayRecords = records.filter(r => new Date(r.visit_date) >= today)
    const weekRecords = records.filter(r => new Date(r.visit_date) >= weekAgo)
    const monthRecords = records.filter(r => new Date(r.visit_date) >= monthAgo)

    // Common diagnoses
    const diagnosisCount: { [key: string]: number } = {}
    records.forEach(record => {
      if (record.diagnosis) {
        const diagnosis = record.diagnosis.toLowerCase().trim()
        diagnosisCount[diagnosis] = (diagnosisCount[diagnosis] || 0) + 1
      }
    })

    const commonDiagnoses = Object.entries(diagnosisCount)
      .map(([diagnosis, count]) => ({ diagnosis, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)

    // Recent activity (last 7 days)
    const recentActivity = []
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today.getTime() - i * 24 * 60 * 60 * 1000)
      const dateStr = date.toISOString().split('T')[0]
      const count = records.filter(r => r.visit_date.startsWith(dateStr)).length
      recentActivity.push({
        date: date.toLocaleDateString('vi-VN', { weekday: 'short', day: 'numeric' }),
        count
      })
    }

    setStats({
      totalRecords: records.length,
      thisMonth: monthRecords.length,
      thisWeek: weekRecords.length,
      today: todayRecords.length,
      commonDiagnoses,
      recentActivity
    })
  }

  const applyFilters = () => {
    let filtered = [...medicalRecords]

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(record =>
        record.patient_name?.toLowerCase().includes(term) ||
        record.patient_id.toLowerCase().includes(term) ||
        record.chief_complaint.toLowerCase().includes(term) ||
        record.diagnosis.toLowerCase().includes(term)
      )
    }

    // Date filter
    if (dateFilter !== 'all') {
      const now = new Date()
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      
      switch (dateFilter) {
        case 'today':
          filtered = filtered.filter(r => new Date(r.visit_date) >= today)
          break
        case 'week':
          const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
          filtered = filtered.filter(r => new Date(r.visit_date) >= weekAgo)
          break
        case 'month':
          const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)
          filtered = filtered.filter(r => new Date(r.visit_date) >= monthAgo)
          break
      }
    }

    // Diagnosis filter
    if (diagnosisFilter !== 'all') {
      filtered = filtered.filter(record =>
        record.diagnosis.toLowerCase().includes(diagnosisFilter.toLowerCase())
      )
    }

    // Tab filter
    if (activeTab !== 'all') {
      const now = new Date()
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      
      switch (activeTab) {
        case 'recent':
          const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
          filtered = filtered.filter(r => new Date(r.visit_date) >= weekAgo)
          break
        case 'follow-up':
          filtered = filtered.filter(r => r.follow_up_instructions && r.follow_up_instructions.trim() !== '')
          break
      }
    }

    // Sort by visit date (newest first)
    filtered.sort((a, b) => new Date(b.visit_date).getTime() - new Date(a.visit_date).getTime())

    setFilteredRecords(filtered)
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await loadMedicalRecords()
    setRefreshing(false)
    toast.success('Đã cập nhật danh sách hồ sơ bệnh án')
  }

  const handleViewRecord = (record: MedicalRecord) => {
    // Navigate to patient detail page with medical records tab
    router.push(`/doctors/patients/${record.patient_id}?tab=medical-records&record=${record.record_id}`)
  }

  const handleEditRecord = (record: MedicalRecord) => {
    // Navigate to edit medical record page (if exists) or patient page
    router.push(`/doctors/patients/${record.patient_id}?tab=medical-records&edit=${record.record_id}`)
  }

  const handleDownloadRecord = async (record: MedicalRecord) => {
    try {
      // Generate PDF content for the medical record
      const recordContent = generateMedicalRecordPDF(record)

      // Create blob and download
      const blob = new Blob([recordContent], { type: 'text/html' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `medical-record-${record.record_id}-${new Date().toISOString().split('T')[0]}.html`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      toast.success('Hồ sơ y tế đã được tải xuống thành công')
    } catch (error) {
      console.error('Error downloading medical record:', error)
      toast.error('Lỗi khi tải xuống hồ sơ y tế')
    }
  }

  const handleCreateNew = () => {
    // Navigate to patients page to select patient first
    router.push('/doctors/patients?action=create-record')
  }

  const generateMedicalRecordPDF = (record: MedicalRecord): string => {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Hồ sơ Y tế - ${record.record_id}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
        .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 20px; }
        .section { margin-bottom: 15px; }
        .label { font-weight: bold; color: #333; }
        .value { margin-left: 10px; }
        .diagnosis { background-color: #f0f8ff; padding: 10px; border-left: 4px solid #0066cc; margin: 10px 0; }
        .treatment { background-color: #f0fff0; padding: 10px; border-left: 4px solid #00cc66; margin: 10px 0; }
        .footer { margin-top: 30px; text-align: center; font-size: 12px; color: #666; border-top: 1px solid #ccc; padding-top: 10px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>HỒ SƠ Y TẾ</h1>
        <p><strong>Mã hồ sơ:</strong> ${record.record_id}</p>
        <p><strong>Ngày tạo:</strong> ${new Date(record.created_at).toLocaleDateString('vi-VN')}</p>
    </div>

    <div class="section">
        <div class="label">Bệnh nhân:</div>
        <div class="value">${record.patient_id}</div>
    </div>

    <div class="section">
        <div class="label">Bác sĩ:</div>
        <div class="value">${record.doctor_id}</div>
    </div>

    <div class="section">
        <div class="label">Ngày khám:</div>
        <div class="value">${record.visit_date ? new Date(record.visit_date).toLocaleDateString('vi-VN') : 'Chưa xác định'}</div>
    </div>

    <div class="diagnosis">
        <div class="label">Chẩn đoán:</div>
        <div class="value">${record.diagnosis || 'Chưa có chẩn đoán'}</div>
    </div>

    <div class="treatment">
        <div class="label">Điều trị:</div>
        <div class="value">${record.treatment || 'Chưa có phương pháp điều trị'}</div>
    </div>

    <div class="section">
        <div class="label">Ghi chú:</div>
        <div class="value">${record.notes || 'Không có ghi chú'}</div>
    </div>

    <div class="section">
        <div class="label">Hướng dẫn tái khám:</div>
        <div class="value">${record.follow_up_instructions || 'Không có hướng dẫn'}</div>
    </div>

    <div class="footer">
        <p>Hồ sơ được tạo tự động từ Hệ thống Quản lý Bệnh viện</p>
        <p>Ngày xuất: ${new Date().toLocaleDateString('vi-VN')} ${new Date().toLocaleTimeString('vi-VN')}</p>
    </div>
</body>
</html>
    `
  }

  // Loading state
  if (authLoading || loading) {
    return (
      <DoctorLayout title="Hồ sơ bệnh án" activePage="medical-records">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
        </div>
      </DoctorLayout>
    )
  }

  // Access control
  if (!user || user.role !== 'doctor') {
    return (
      <DoctorLayout title="Hồ sơ bệnh án" activePage="medical-records">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <p className="text-gray-600">Không có quyền truy cập. Chỉ dành cho bác sĩ.</p>
          </div>
        </div>
      </DoctorLayout>
    )
  }

  return (
    <DoctorLayout
      title="Hồ sơ bệnh án"
      activePage="medical-records"
      subtitle={`Quản lý ${stats.totalRecords} hồ sơ bệnh án`}
      headerActions={
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Đang tải...' : 'Làm mới'}
          </Button>
          <Button onClick={handleCreateNew} className="bg-teal-600 hover:bg-teal-700">
            <Plus className="h-4 w-4 mr-2" />
            Tạo hồ sơ mới
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <FileText className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Tổng hồ sơ</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalRecords}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Calendar className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Tháng này</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.thisMonth}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Activity className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Tuần này</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.thisWeek}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Clock className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Hôm nay</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.today}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Tìm kiếm theo tên bệnh nhân, mã bệnh nhân, triệu chứng, chẩn đoán..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <Select value={dateFilter} onValueChange={setDateFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Lọc theo ngày" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả</SelectItem>
                    <SelectItem value="today">Hôm nay</SelectItem>
                    <SelectItem value="week">Tuần này</SelectItem>
                    <SelectItem value="month">Tháng này</SelectItem>
                  </SelectContent>
                </Select>

                {stats.commonDiagnoses.length > 0 && (
                  <Select value={diagnosisFilter} onValueChange={setDiagnosisFilter}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Lọc theo chẩn đoán" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tất cả chẩn đoán</SelectItem>
                      {stats.commonDiagnoses.map((item, index) => (
                        <SelectItem key={index} value={item.diagnosis}>
                          {item.diagnosis} ({item.count})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="all">Tất cả ({medicalRecords.length})</TabsTrigger>
            <TabsTrigger value="recent">Gần đây ({stats.thisWeek})</TabsTrigger>
            <TabsTrigger value="follow-up">
              Cần tái khám ({medicalRecords.filter(r => r.follow_up_instructions && r.follow_up_instructions.trim() !== '').length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-6">
            {/* Medical Records List */}
            <div className="space-y-4">
              {filteredRecords.length > 0 ? (
                filteredRecords.map((record) => (
                  <Card key={record.record_id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-4 flex-1">
                          <Avatar className="h-12 w-12">
                            <AvatarImage src="" />
                            <AvatarFallback className="bg-blue-100 text-blue-600">
                              {record.patient_name ?
                                record.patient_name.split(' ').map(n => n[0]).join('').toUpperCase() :
                                'BN'
                              }
                            </AvatarFallback>
                          </Avatar>

                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold text-gray-900">
                                {record.patient_name || 'Không có tên'}
                              </h3>
                              <Badge variant="outline" className="text-xs">
                                {record.patient_id}
                              </Badge>
                              {record.patient_age && (
                                <Badge variant="secondary" className="text-xs">
                                  {record.patient_age} tuổi
                                </Badge>
                              )}
                            </div>

                            <div className="space-y-1">
                              <div className="flex items-center gap-4 text-sm text-gray-600">
                                <div className="flex items-center gap-1">
                                  <Calendar className="h-4 w-4" />
                                  <span>{new Date(record.visit_date).toLocaleDateString('vi-VN')}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Stethoscope className="h-4 w-4" />
                                  <span className="font-medium">{record.chief_complaint}</span>
                                </div>
                              </div>

                              {record.diagnosis && (
                                <div className="text-sm">
                                  <span className="text-gray-500">Chẩn đoán: </span>
                                  <span className="text-gray-900 font-medium">{record.diagnosis}</span>
                                </div>
                              )}

                              {record.follow_up_instructions && (
                                <div className="flex items-center gap-1 text-xs text-orange-600">
                                  <AlertCircle className="h-3 w-3" />
                                  <span>Cần tái khám</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewRecord(record)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditRecord(record)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDownloadRecord(record)}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <Card>
                  <CardContent className="p-12 text-center">
                    <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      {searchTerm || dateFilter !== 'all' || diagnosisFilter !== 'all' ?
                        'Không tìm thấy hồ sơ bệnh án' :
                        'Chưa có hồ sơ bệnh án'
                      }
                    </h3>
                    <p className="text-gray-600 mb-4">
                      {searchTerm || dateFilter !== 'all' || diagnosisFilter !== 'all' ?
                        'Thử điều chỉnh bộ lọc hoặc từ khóa tìm kiếm' :
                        'Hồ sơ bệnh án sẽ xuất hiện ở đây sau khi bạn khám bệnh nhân'
                      }
                    </p>
                    {!searchTerm && dateFilter === 'all' && diagnosisFilter === 'all' && (
                      <Button onClick={handleCreateNew} className="bg-teal-600 hover:bg-teal-700">
                        <Plus className="h-4 w-4 mr-2" />
                        Tạo hồ sơ bệnh án đầu tiên
                      </Button>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DoctorLayout>
  )
}
