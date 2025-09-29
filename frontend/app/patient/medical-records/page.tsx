"use client"

import { useState, useEffect } from "react"
import {
  FileText,
  Download,
  Eye,
  Calendar,
  User,
  Stethoscope,
  TestTube,
  Pill,
  Heart,
  Activity,
  AlertCircle,
  Search,
  Filter
} from "lucide-react"
import { RoleBasedLayout } from "@/components/layout/RoleBasedLayout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { useEnhancedAuth } from "@/lib/auth/auth-wrapper"
import { medicalRecordsApi, patientsApi } from "@/lib/api"
import { toast } from "sonner"

export default function PatientMedicalRecords() {
  const { user, loading } = useEnhancedAuth()
  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState("all")
  const [medicalRecords, setMedicalRecords] = useState<any[]>([])
  const [isLoadingRecords, setIsLoadingRecords] = useState(true)
  const [patientId, setPatientId] = useState<string | null>(null)

  // Get patient ID when user is loaded
  useEffect(() => {
    if (user && user.role === 'patient' && user.profile_id) {
      loadPatientProfile()
    }
  }, [user])

  const loadPatientProfile = async () => {
    try {
      if (!user?.profile_id) return

      const response = await patientsApi.getByProfileId(user.profile_id)
      if (response.success && response.data) {
        setPatientId(response.data.patient_id)
        loadMedicalRecords(response.data.patient_id)
      } else {
        toast.error('Không thể tải thông tin bệnh nhân')
      }
    } catch (error) {
      console.error('Error loading patient profile:', error)
      toast.error('Lỗi khi tải thông tin bệnh nhân')
    }
  }

  const loadMedicalRecords = async (patientIdParam: string) => {
    try {
      setIsLoadingRecords(true)
      const response = await medicalRecordsApi.getMedicalRecordsByPatientId(patientIdParam)

      if (response.success && response.data) {
        setMedicalRecords(response.data)
      } else {
        toast.error('Không thể tải hồ sơ y tế')
        setMedicalRecords([])
      }
    } catch (error) {
      console.error('Error loading medical records:', error)
      toast.error('Lỗi khi tải hồ sơ y tế')
      setMedicalRecords([])
    } finally {
      setIsLoadingRecords(false)
    }
  }

  // Mock data removed - now using real API data

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'consultation':
        return <Stethoscope className="h-4 w-4" />
      case 'lab_result':
        return <TestTube className="h-4 w-4" />
      case 'imaging':
        return <Activity className="h-4 w-4" />
      case 'prescription':
        return <Pill className="h-4 w-4" />
      default:
        return <FileText className="h-4 w-4" />
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'consultation':
        return 'bg-blue-100 text-blue-800'
      case 'lab_result':
        return 'bg-green-100 text-green-800'
      case 'imaging':
        return 'bg-purple-100 text-purple-800'
      case 'prescription':
        return 'bg-orange-100 text-orange-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'consultation':
        return 'Consultation'
      case 'lab_result':
        return 'Lab Result'
      case 'imaging':
        return 'Imaging'
      case 'prescription':
        return 'Prescription'
      default:
        return 'Other'
    }
  }

  const filteredRecords = medicalRecords.filter(record => {
    const matchesSearch = (record.diagnosis && record.diagnosis.toLowerCase().includes(searchTerm.toLowerCase())) ||
                         (record.chief_complaint && record.chief_complaint.toLowerCase().includes(searchTerm.toLowerCase())) ||
                         (record.treatment_plan && record.treatment_plan.toLowerCase().includes(searchTerm.toLowerCase()))
    // For now, we'll show all records since we don't have type classification in the API
    const matchesFilter = filterType === "all" || true
    return matchesSearch && matchesFilter
  })

  // Sort records by date (newest first)
  const sortedRecords = filteredRecords.sort((a, b) => {
    return new Date(b.visit_date).getTime() - new Date(a.visit_date).getTime()
  })

  if (loading || isLoadingRecords) {
    return (
      <RoleBasedLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </RoleBasedLayout>
    )
  }

  const handleViewRecord = (record: MedicalRecord) => {
    // TODO: Implement view record modal or navigate to detail page
    toast.info('Tính năng xem chi tiết đang được phát triển')
  }

  const handleDownloadRecord = async (record: MedicalRecord) => {
    try {
      const recordContent = generateMedicalRecordHTML(record)
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

  const handleDownloadAll = async () => {
    try {
      if (!records || records.length === 0) {
        toast.error('Không có hồ sơ y tế để tải xuống')
        return
      }

      const allRecordsContent = generateAllRecordsHTML(records)
      const blob = new Blob([allRecordsContent], { type: 'text/html' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `all-medical-records-${new Date().toISOString().split('T')[0]}.html`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      toast.success(`Đã tải xuống ${records.length} hồ sơ y tế thành công`)
    } catch (error) {
      console.error('Error downloading all medical records:', error)
      toast.error('Lỗi khi tải xuống tất cả hồ sơ y tế')
    }
  }

  if (!user || user.role !== 'patient') {
    return (
      <RoleBasedLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <p className="text-gray-600">Access denied. Patient role required.</p>
          </div>
        </div>
      </RoleBasedLayout>
    )
  }

  const generateMedicalRecordHTML = (record: MedicalRecord): string => {
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

  const generateAllRecordsHTML = (records: MedicalRecord[]): string => {
    const recordsHTML = records.map(record => `
      <div class="record">
        <h3>Hồ sơ: ${record.record_id}</h3>
        <p><strong>Ngày khám:</strong> ${record.visit_date ? new Date(record.visit_date).toLocaleDateString('vi-VN') : 'Chưa xác định'}</p>
        <p><strong>Bác sĩ:</strong> ${record.doctor_id}</p>
        <div class="diagnosis"><strong>Chẩn đoán:</strong> ${record.diagnosis || 'Chưa có chẩn đoán'}</div>
        <div class="treatment"><strong>Điều trị:</strong> ${record.treatment || 'Chưa có phương pháp điều trị'}</div>
        <p><strong>Ghi chú:</strong> ${record.notes || 'Không có ghi chú'}</p>
        <p><strong>Hướng dẫn tái khám:</strong> ${record.follow_up_instructions || 'Không có hướng dẫn'}</p>
      </div>
    `).join('')

    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Tất cả Hồ sơ Y tế</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
        .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 20px; }
        .record { border: 1px solid #ddd; padding: 15px; margin-bottom: 20px; border-radius: 5px; }
        .diagnosis { background-color: #f0f8ff; padding: 8px; border-left: 4px solid #0066cc; margin: 8px 0; }
        .treatment { background-color: #f0fff0; padding: 8px; border-left: 4px solid #00cc66; margin: 8px 0; }
        .footer { margin-top: 30px; text-align: center; font-size: 12px; color: #666; border-top: 1px solid #ccc; padding-top: 10px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>TẤT CẢ HỒ SƠ Y TẾ</h1>
        <p><strong>Tổng số hồ sơ:</strong> ${records.length}</p>
        <p><strong>Ngày xuất:</strong> ${new Date().toLocaleDateString('vi-VN')}</p>
    </div>

    ${recordsHTML}

    <div class="footer">
        <p>Hồ sơ được tạo tự động từ Hệ thống Quản lý Bệnh viện</p>
        <p>Ngày xuất: ${new Date().toLocaleDateString('vi-VN')} ${new Date().toLocaleTimeString('vi-VN')}</p>
    </div>
</body>
</html>
    `
  }

  return (
    <RoleBasedLayout>
      {/* Header */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Medical Records</h2>
            <p className="text-gray-600">View your complete medical history and documents</p>
          </div>
          <Button
            className="bg-blue-600 hover:bg-blue-700"
            onClick={handleDownloadAll}
          >
            <Download className="h-4 w-4 mr-2" />
            Download All
          </Button>
        </div>

        {/* Search and Filter */}
        <div className="flex gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search records, doctors, or diagnoses..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Filter records by type"
          >
            <option value="all">All Types</option>
            <option value="consultation">Consultations</option>
            <option value="lab_result">Lab Results</option>
            <option value="imaging">Imaging</option>
            <option value="prescription">Prescriptions</option>
          </select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Stethoscope className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Consultations</p>
                <p className="text-xl font-bold">
                  {medicalRecords.filter(r => r.type === 'consultation').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <TestTube className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Lab Results</p>
                <p className="text-xl font-bold">
                  {medicalRecords.filter(r => r.type === 'lab_result').length}
                </p>
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
                <p className="text-sm text-gray-600">Imaging</p>
                <p className="text-xl font-bold">
                  {medicalRecords.filter(r => r.type === 'imaging').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Pill className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Prescriptions</p>
                <p className="text-xl font-bold">
                  {medicalRecords.filter(r => r.type === 'prescription').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Medical Records List */}
      <div className="space-y-4">
        {sortedRecords.map((record) => (
          <Card key={record.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-4 mb-4">
                    <Badge className="bg-blue-100 text-blue-800">
                      <Stethoscope className="h-4 w-4" />
                      <span className="ml-1">Medical Record</span>
                    </Badge>
                    <h3 className="text-lg font-semibold">
                      {record.chief_complaint || 'Khám bệnh'}
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-500" />
                      <span className="text-sm">{record.visit_date}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-gray-500" />
                      <span className="text-sm">Bác sĩ điều trị</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Heart className="h-4 w-4 text-gray-500" />
                      <span className="text-sm">Khoa khám bệnh</span>
                    </div>
                  </div>

                  <div className="space-y-2 mb-4">
                    {record.diagnosis && (
                      <div>
                        <span className="text-sm font-medium text-gray-700">Chẩn đoán: </span>
                        <span className="text-sm text-gray-900">{record.diagnosis}</span>
                      </div>
                    )}
                    {record.treatment_plan && (
                      <div>
                        <span className="text-sm font-medium text-gray-700">Kế hoạch điều trị: </span>
                        <span className="text-sm text-gray-900">{record.treatment_plan}</span>
                      </div>
                    )}
                    {record.medications && (
                      <div>
                        <span className="text-sm font-medium text-gray-700">Thuốc: </span>
                        <span className="text-sm text-gray-900">{record.medications}</span>
                      </div>
                    )}
                    {record.notes && (
                      <div>
                        <span className="text-sm font-medium text-gray-700">Ghi chú: </span>
                        <span className="text-sm text-gray-900">{record.notes}</span>
                      </div>
                    )}
                    {record.follow_up_instructions && (
                      <div>
                        <span className="text-sm font-medium text-gray-700">Hướng dẫn tái khám: </span>
                        <span className="text-sm text-gray-900">{record.follow_up_instructions}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex gap-2 ml-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleViewRecord(record)}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    View
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDownloadRecord(record)}
                  >
                    <Download className="h-4 w-4 mr-1" />
                    Download
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {sortedRecords.length === 0 && (
          <Card>
            <CardContent className="p-12 text-center">
              <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No medical records found</h3>
              <p className="text-gray-600 mb-4">
                {searchTerm || filterType !== "all"
                  ? "Try adjusting your search or filter criteria"
                  : "Your medical records will appear here after your first appointment"
                }
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </RoleBasedLayout>
  )
}
