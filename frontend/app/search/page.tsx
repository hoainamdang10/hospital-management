"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import {
  Search,
  Filter,
  User,
  Building2,
  Stethoscope,
  Calendar,
  MapPin,
  Phone,
  Star,
  Clock,
  ArrowRight,
  BookOpen,
  Activity,
  Heart,
  Eye,
  X
} from "lucide-react"
import { PublicLayout } from "@/components/layout/PublicLayout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { doctorsApi, departmentsApi } from "@/lib/api"
import { toast } from "sonner"

interface SearchResult {
  id: string
  type: 'doctor' | 'department' | 'service' | 'news'
  title: string
  subtitle?: string
  description: string
  imageUrl?: string
  metadata?: {
    specialization?: string
    experience?: number
    rating?: number
    location?: string
    phone?: string
    availability?: string
    category?: string
    publishedAt?: string
    views?: number
  }
}

// Mock search results
const mockResults: SearchResult[] = [
  {
    id: "1",
    type: "doctor",
    title: "BS. Nguyễn Văn An",
    subtitle: "Bác sĩ Tim mạch",
    description: "Chuyên gia tim mạch với 15 năm kinh nghiệm, chuyên điều trị các bệnh lý tim mạch phức tạp.",
    metadata: {
      specialization: "Tim mạch",
      experience: 15,
      rating: 4.8,
      location: "Tầng 3, Tòa nhà A",
      phone: "(028) 3123-4567",
      availability: "Thứ 2-6: 8:00-17:00"
    }
  },
  {
    id: "2",
    type: "department",
    title: "Khoa Tim mạch",
    subtitle: "Chuyên khoa Tim mạch",
    description: "Khoa chuyên điều trị các bệnh lý về tim mạch với trang thiết bị hiện đại và đội ngũ bác sĩ giàu kinh nghiệm.",
    metadata: {
      location: "Tầng 3, Tòa nhà A",
      phone: "(028) 3123-4567"
    }
  },
  {
    id: "3",
    type: "service",
    title: "Siêu âm tim",
    subtitle: "Dịch vụ chẩn đoán",
    description: "Siêu âm tim 2D, 3D với máy siêu âm hiện đại, giúp chẩn đoán chính xác các bệnh lý tim mạch.",
    metadata: {
      category: "Chẩn đoán hình ảnh",
      location: "Tầng 2, Tòa nhà B"
    }
  },
  {
    id: "4",
    type: "news",
    title: "Bệnh viện triển khai hệ thống khám bệnh từ xa",
    subtitle: "Tin tức y tế",
    description: "Hệ thống telemedicine mới cho phép bệnh nhân tư vấn với bác sĩ từ xa, giảm thời gian chờ đợi.",
    metadata: {
      category: "Công nghệ Y tế",
      publishedAt: "2025-01-03",
      views: 1250
    }
  }
]

const searchTypes = [
  { id: "all", name: "Tất cả", icon: Search },
  { id: "doctor", name: "Bác sĩ", icon: User },
  { id: "department", name: "Khoa", icon: Building2 },
  { id: "service", name: "Dịch vụ", icon: Stethoscope },
  { id: "news", name: "Tin tức", icon: BookOpen }
]

const popularSearches = [
  "Tim mạch", "Nhi khoa", "Thần kinh", "Chấn thương chỉnh hình",
  "Siêu âm", "MRI", "CT scan", "Xét nghiệm máu",
  "Khám tổng quát", "Tiêm chủng", "Phẫu thuật", "Cấp cứu"
]

export default function SearchPage() {
  const searchParams = useSearchParams()
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || "")
  const [searchType, setSearchType] = useState("all")
  const [results, setResults] = useState<SearchResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)
  const [recentSearches, setRecentSearches] = useState<string[]>([])

  useEffect(() => {
    // Load recent searches from localStorage
    const saved = localStorage.getItem('recentSearches')
    if (saved) {
      setRecentSearches(JSON.parse(saved))
    }

    // Auto search if query param exists
    const query = searchParams.get('q')
    if (query) {
      setSearchQuery(query)
      handleSearch(query)
    }
  }, [searchParams])

  const handleSearch = async (query: string = searchQuery) => {
    if (!query.trim()) return

    setIsLoading(true)
    setHasSearched(true)

    try {
      // Call actual search API
      const searchResults = await performGlobalSearch(query, searchType)
      setResults(searchResults)

      // Save to recent searches
      const newRecentSearches = [query, ...recentSearches.filter(s => s !== query)].slice(0, 5)
      setRecentSearches(newRecentSearches)
      localStorage.setItem('recentSearches', JSON.stringify(newRecentSearches))

    } catch (error) {
      console.error('Search error:', error)
      toast.error('Lỗi khi tìm kiếm. Vui lòng thử lại.')
      setResults([])
    } finally {
      setIsLoading(false)
    }
  }

  const performGlobalSearch = async (query: string, type: string): Promise<SearchResult[]> => {
    const results: SearchResult[] = []

    try {
      // Search patients if type is 'all' or 'patients'
      if (type === 'all' || type === 'patients') {
        const patientResults = await searchPatients(query)
        results.push(...patientResults)
      }

      // Search doctors if type is 'all' or 'doctors'
      if (type === 'all' || type === 'doctors') {
        const doctorResults = await searchDoctors(query)
        results.push(...doctorResults)
      }

      // Search appointments if type is 'all' or 'appointments'
      if (type === 'all' || type === 'appointments') {
        const appointmentResults = await searchAppointments(query)
        results.push(...appointmentResults)
      }

      // Search medical records if type is 'all' or 'medical-records'
      if (type === 'all' || type === 'medical-records') {
        const medicalRecordResults = await searchMedicalRecords(query)
        results.push(...medicalRecordResults)
      }

      return results
    } catch (error) {
      console.error('Global search error:', error)
      return []
    }
  }

  const searchPatients = async (query: string): Promise<SearchResult[]> => {
    try {
      // Mock API call - replace with actual API
      const response = await fetch(`/api/patients/search?q=${encodeURIComponent(query)}`)
      if (!response.ok) throw new Error('Search failed')

      const patients = await response.json()
      return patients.map((patient: any) => ({
        id: patient.patient_id,
        type: 'patients' as const,
        title: patient.profiles?.full_name || 'Unknown Patient',
        subtitle: `ID: ${patient.patient_id}`,
        description: `Phone: ${patient.profiles?.phone_number || 'N/A'} | DOB: ${patient.profiles?.date_of_birth || 'N/A'}`,
        url: `/admin/patients/${patient.patient_id}`,
        metadata: {
          status: patient.status,
          created_at: patient.created_at
        }
      }))
    } catch (error) {
      console.error('Patient search error:', error)
      return []
    }
  }

  const searchDoctors = async (query: string): Promise<SearchResult[]> => {
    try {
      // Mock API call - replace with actual API
      const response = await fetch(`/api/doctors/search?q=${encodeURIComponent(query)}`)
      if (!response.ok) throw new Error('Search failed')

      const doctors = await response.json()
      return doctors.map((doctor: any) => ({
        id: doctor.doctor_id,
        type: 'doctors' as const,
        title: doctor.profiles?.full_name || 'Unknown Doctor',
        subtitle: `${doctor.specialty} | ${doctor.department_name}`,
        description: `License: ${doctor.license_number} | Experience: ${doctor.experience_years} years`,
        url: `/admin/doctors/${doctor.doctor_id}`,
        metadata: {
          status: doctor.availability_status,
          rating: doctor.rating
        }
      }))
    } catch (error) {
      console.error('Doctor search error:', error)
      return []
    }
  }

  const searchAppointments = async (query: string): Promise<SearchResult[]> => {
    try {
      // Mock API call - replace with actual API
      const response = await fetch(`/api/appointments/search?q=${encodeURIComponent(query)}`)
      if (!response.ok) throw new Error('Search failed')

      const appointments = await response.json()
      return appointments.map((appointment: any) => ({
        id: appointment.appointment_id,
        type: 'appointments' as const,
        title: `Appointment ${appointment.appointment_id}`,
        subtitle: `${appointment.patient_name} with ${appointment.doctor_name}`,
        description: `Date: ${appointment.appointment_date} | Time: ${appointment.start_time} | Status: ${appointment.status}`,
        url: `/admin/appointments/${appointment.appointment_id}`,
        metadata: {
          status: appointment.status,
          date: appointment.appointment_date
        }
      }))
    } catch (error) {
      console.error('Appointment search error:', error)
      return []
    }
  }

  const searchMedicalRecords = async (query: string): Promise<SearchResult[]> => {
    try {
      // Mock API call - replace with actual API
      const response = await fetch(`/api/medical-records/search?q=${encodeURIComponent(query)}`)
      if (!response.ok) throw new Error('Search failed')

      const records = await response.json()
      return records.map((record: any) => ({
        id: record.record_id,
        type: 'medical-records' as const,
        title: `Medical Record ${record.record_id}`,
        subtitle: `Patient: ${record.patient_id} | Doctor: ${record.doctor_id}`,
        description: `Diagnosis: ${record.diagnosis || 'N/A'} | Visit: ${record.visit_date || 'N/A'}`,
        url: `/doctors/medical-records/${record.record_id}`,
        metadata: {
          visit_date: record.visit_date,
          diagnosis: record.diagnosis
        }
      }))
    } catch (error) {
      console.error('Medical record search error:', error)
      return []
    }
  }

  const handlePopularSearch = (term: string) => {
    setSearchQuery(term)
    handleSearch(term)
  }

  const clearRecentSearches = () => {
    setRecentSearches([])
    localStorage.removeItem('recentSearches')
  }

  const getResultIcon = (type: string) => {
    switch (type) {
      case 'doctor': return User
      case 'department': return Building2
      case 'service': return Stethoscope
      case 'news': return BookOpen
      default: return Search
    }
  }

  const getResultLink = (result: SearchResult) => {
    switch (result.type) {
      case 'doctor': return `/doctors/${result.id}`
      case 'department': return `/departments/${result.id}`
      case 'service': return `/services/${result.id}`
      case 'news': return `/news/${result.id}`
      default: return '#'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
  }

  return (
    <PublicLayout currentPage="search">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-[#003087] to-[#0066CC] text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Tìm kiếm
          </h1>
          <p className="text-xl mb-8 max-w-3xl mx-auto">
            Tìm kiếm bác sĩ, khoa, dịch vụ y tế và thông tin sức khỏe
          </p>
          
          {/* Search Bar */}
          <div className="max-w-2xl mx-auto">
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  placeholder="Nhập từ khóa tìm kiếm..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  className="pl-12 h-14 text-lg bg-white text-gray-900"
                />
              </div>
              <Button 
                onClick={() => handleSearch()}
                disabled={isLoading}
                className="h-14 px-8 bg-white text-[#003087] hover:bg-gray-100"
              >
                {isLoading ? "Đang tìm..." : "Tìm kiếm"}
              </Button>
            </div>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-8">
        {/* Search Filters */}
        <div className="mb-8">
          <div className="flex flex-wrap gap-2 mb-6">
            {searchTypes.map((type) => {
              const IconComponent = type.icon
              return (
                <Button
                  key={type.id}
                  variant={searchType === type.id ? "default" : "outline"}
                  onClick={() => setSearchType(type.id)}
                  className={`flex items-center gap-2 ${
                    searchType === type.id 
                      ? "bg-[#003087] text-white" 
                      : "border-[#003087] text-[#003087] hover:bg-[#003087] hover:text-white"
                  }`}
                >
                  <IconComponent className="w-4 h-4" />
                  {type.name}
                </Button>
              )
            })}
          </div>
        </div>

        {/* Search Results */}
        {hasSearched ? (
          <div>
            {isLoading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-32 bg-gray-200 rounded-lg"></div>
                  </div>
                ))}
              </div>
            ) : (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-[#003087]">
                    Kết quả tìm kiếm "{searchQuery}"
                  </h2>
                  <span className="text-gray-600">
                    {results.length} kết quả
                  </span>
                </div>

                {results.length > 0 ? (
                  <div className="space-y-6">
                    {results.map((result) => {
                      const IconComponent = getResultIcon(result.type)
                      return (
                        <Card key={result.id} className="hover:shadow-lg transition-shadow">
                          <CardContent className="p-6">
                            <div className="flex items-start gap-4">
                              <div className="p-3 bg-[#003087]/10 rounded-lg">
                                <IconComponent className="w-6 h-6 text-[#003087]" />
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <Badge variant="secondary" className="text-xs">
                                    {searchTypes.find(t => t.id === result.type)?.name}
                                  </Badge>
                                  {result.type === 'doctor' && result.metadata?.rating && (
                                    <div className="flex items-center gap-1">
                                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                                      <span className="text-sm">{result.metadata.rating}</span>
                                    </div>
                                  )}
                                </div>
                                
                                <h3 className="text-xl font-bold mb-2">
                                  <Link href={getResultLink(result)} className="hover:text-[#003087]">
                                    {result.title}
                                  </Link>
                                </h3>
                                
                                {result.subtitle && (
                                  <p className="text-[#003087] font-medium mb-2">
                                    {result.subtitle}
                                  </p>
                                )}
                                
                                <p className="text-gray-600 mb-4">
                                  {result.description}
                                </p>

                                {/* Metadata */}
                                <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-4">
                                  {result.metadata?.location && (
                                    <div className="flex items-center gap-1">
                                      <MapPin className="w-4 h-4" />
                                      <span>{result.metadata.location}</span>
                                    </div>
                                  )}
                                  {result.metadata?.phone && (
                                    <div className="flex items-center gap-1">
                                      <Phone className="w-4 h-4" />
                                      <span>{result.metadata.phone}</span>
                                    </div>
                                  )}
                                  {result.metadata?.experience && (
                                    <div className="flex items-center gap-1">
                                      <Stethoscope className="w-4 h-4" />
                                      <span>{result.metadata.experience} năm kinh nghiệm</span>
                                    </div>
                                  )}
                                  {result.metadata?.availability && (
                                    <div className="flex items-center gap-1">
                                      <Clock className="w-4 h-4" />
                                      <span>{result.metadata.availability}</span>
                                    </div>
                                  )}
                                  {result.metadata?.publishedAt && (
                                    <div className="flex items-center gap-1">
                                      <Calendar className="w-4 h-4" />
                                      <span>{formatDate(result.metadata.publishedAt)}</span>
                                    </div>
                                  )}
                                  {result.metadata?.views && (
                                    <div className="flex items-center gap-1">
                                      <Eye className="w-4 h-4" />
                                      <span>{result.metadata.views} lượt xem</span>
                                    </div>
                                  )}
                                </div>

                                <div className="flex gap-2">
                                  <Link href={getResultLink(result)}>
                                    <Button variant="outline" className="border-[#003087] text-[#003087] hover:bg-[#003087] hover:text-white">
                                      Xem chi tiết
                                      <ArrowRight className="w-4 h-4 ml-2" />
                                    </Button>
                                  </Link>
                                  {result.type === 'doctor' && (
                                    <Link href="/patient/appointments">
                                      <Button className="bg-[#003087] hover:bg-[#002266]">
                                        Đặt lịch khám
                                      </Button>
                                    </Link>
                                  )}
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      )
                    })}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Search className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-xl font-medium text-gray-600 mb-2">
                      Không tìm thấy kết quả nào
                    </h3>
                    <p className="text-gray-500 mb-6">
                      Thử tìm kiếm với từ khóa khác hoặc kiểm tra chính tả
                    </p>
                    <div className="flex flex-wrap justify-center gap-2">
                      {popularSearches.slice(0, 6).map((term) => (
                        <Button
                          key={term}
                          variant="outline"
                          size="sm"
                          onClick={() => handlePopularSearch(term)}
                          className="border-[#003087] text-[#003087] hover:bg-[#003087] hover:text-white"
                        >
                          {term}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          /* Search Suggestions */
          <div className="max-w-4xl mx-auto">
            {/* Recent Searches */}
            {recentSearches.length > 0 && (
              <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-[#003087]">Tìm kiếm gần đây</h3>
                  <Button variant="ghost" size="sm" onClick={clearRecentSearches}>
                    <X className="w-4 h-4 mr-1" />
                    Xóa tất cả
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {recentSearches.map((term, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      size="sm"
                      onClick={() => handlePopularSearch(term)}
                      className="border-gray-300 text-gray-700 hover:border-[#003087] hover:text-[#003087]"
                    >
                      <Clock className="w-3 h-3 mr-1" />
                      {term}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Popular Searches */}
            <div className="mb-8">
              <h3 className="text-lg font-medium text-[#003087] mb-4">Tìm kiếm phổ biến</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {popularSearches.map((term) => (
                  <Button
                    key={term}
                    variant="outline"
                    onClick={() => handlePopularSearch(term)}
                    className="justify-start border-[#003087] text-[#003087] hover:bg-[#003087] hover:text-white"
                  >
                    <Search className="w-4 h-4 mr-2" />
                    {term}
                  </Button>
                ))}
              </div>
            </div>

            {/* Quick Access */}
            <div>
              <h3 className="text-lg font-medium text-[#003087] mb-4">Truy cập nhanh</h3>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Link href="/departments">
                  <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                    <CardContent className="p-6 text-center">
                      <Building2 className="w-12 h-12 text-[#003087] mx-auto mb-3" />
                      <h4 className="font-medium mb-2">Các khoa</h4>
                      <p className="text-sm text-gray-600">Xem tất cả khoa chuyên môn</p>
                    </CardContent>
                  </Card>
                </Link>
                <Link href="/doctors">
                  <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                    <CardContent className="p-6 text-center">
                      <User className="w-12 h-12 text-[#003087] mx-auto mb-3" />
                      <h4 className="font-medium mb-2">Bác sĩ</h4>
                      <p className="text-sm text-gray-600">Tìm bác sĩ chuyên khoa</p>
                    </CardContent>
                  </Card>
                </Link>
                <Link href="/services">
                  <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                    <CardContent className="p-6 text-center">
                      <Stethoscope className="w-12 h-12 text-[#003087] mx-auto mb-3" />
                      <h4 className="font-medium mb-2">Dịch vụ</h4>
                      <p className="text-sm text-gray-600">Các dịch vụ y tế</p>
                    </CardContent>
                  </Card>
                </Link>
                <Link href="/book-appointment">
                  <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                    <CardContent className="p-6 text-center">
                      <Calendar className="w-12 h-12 text-[#003087] mx-auto mb-3" />
                      <h4 className="font-medium mb-2">Đặt lịch</h4>
                      <p className="text-sm text-gray-600">Đặt lịch khám bệnh</p>
                    </CardContent>
                  </Card>
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </PublicLayout>
  )
}
