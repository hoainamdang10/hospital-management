"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import {
  Building2,
  Users,
  Stethoscope,
  Clock,
  MapPin,
  Phone,
  Mail,
  Star,
  ArrowRight,
  Heart,
  Brain,
  Baby,
  Bone,
  Eye,
  Scissors,
  Activity,
  Shield
} from "lucide-react"
import { PublicLayout } from "@/components/layout/PublicLayout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { departmentsApi } from "@/lib/api"

interface Department {
  department_id: string
  name: string
  description: string
  head_doctor_id?: string
  location?: string
  phone?: string
  email?: string
  specialties?: string[]
  doctor_count?: number
  services?: string[]
  working_hours?: string
  emergency_available?: boolean
}

// Mock data for departments with Vietnamese content
const mockDepartments: Department[] = [
  {
    department_id: "1",
    name: "Khoa Tim mạch",
    description: "Chuyên điều trị các bệnh lý về tim mạch, mạch máu và huyết áp. Trang bị đầy đủ thiết bị hiện đại cho chẩn đoán và điều trị.",
    location: "Tầng 3, Tòa nhà A",
    phone: "(028) 3123-4567",
    email: "timmach@hospital.vn",
    specialties: ["Tim mạch can thiệp", "Phẫu thuật tim", "Siêu âm tim"],
    doctor_count: 12,
    services: ["Khám tổng quát", "Siêu âm tim", "Điện tâm đồ", "Phẫu thuật tim"],
    working_hours: "7:00 - 17:00 (T2-T6), 7:00 - 12:00 (T7)",
    emergency_available: true
  },
  {
    department_id: "2",
    name: "Khoa Nhi",
    description: "Chăm sóc sức khỏe toàn diện cho trẻ em từ sơ sinh đến 16 tuổi với đội ngũ bác sĩ chuyên khoa nhi giàu kinh nghiệm.",
    location: "Tầng 2, Tòa nhà B",
    phone: "(028) 3123-4568",
    email: "nhi@hospital.vn",
    specialties: ["Nhi tổng quát", "Nhi tim mạch", "Nhi tiêu hóa"],
    doctor_count: 15,
    services: ["Khám sơ sinh", "Tiêm chủng", "Dinh dưỡng", "Phát triển"],
    working_hours: "6:00 - 18:00 (T2-CN)",
    emergency_available: true
  },
  {
    department_id: "3",
    name: "Khoa Thần kinh",
    description: "Chẩn đoán và điều trị các bệnh lý về hệ thần kinh trung ương và ngoại biên, bao gồm đột quỵ, động kinh, Parkinson.",
    location: "Tầng 4, Tòa nhà A",
    phone: "(028) 3123-4569",
    email: "thankinh@hospital.vn",
    specialties: ["Thần kinh can thiệp", "Phẫu thuật thần kinh", "Điện não đồ"],
    doctor_count: 8,
    services: ["MRI não", "CT scan", "Điện não đồ", "Phẫu thuật não"],
    working_hours: "7:00 - 17:00 (T2-T6)",
    emergency_available: true
  },
  {
    department_id: "4",
    name: "Khoa Chấn thương Chỉnh hình",
    description: "Điều trị các chấn thương xương khớp, phẫu thuật chỉnh hình và phục hồi chức năng vận động.",
    location: "Tầng 1, Tòa nhà C",
    phone: "(028) 3123-4570",
    email: "chinhhinh@hospital.vn",
    specialties: ["Phẫu thuật xương khớp", "Thay khớp", "Chấn thương thể thao"],
    doctor_count: 10,
    services: ["X-quang", "MRI khớp", "Phẫu thuật", "Vật lý trị liệu"],
    working_hours: "7:00 - 17:00 (T2-T6), 7:00 - 12:00 (T7)",
    emergency_available: true
  },
  {
    department_id: "5",
    name: "Khoa Mắt",
    description: "Chuyên khoa về mắt với các dịch vụ khám, điều trị và phẫu thuật mắt hiện đại nhất.",
    location: "Tầng 2, Tòa nhà A",
    phone: "(028) 3123-4571",
    email: "mat@hospital.vn",
    specialties: ["Phẫu thuật mắt", "Điều trị tật khúc xạ", "Bệnh võng mạc"],
    doctor_count: 6,
    services: ["Khám mắt tổng quát", "Phẫu thuật cận thị", "Điều trị glaucoma"],
    working_hours: "7:00 - 17:00 (T2-T6)",
    emergency_available: false
  },
  {
    department_id: "6",
    name: "Khoa Phẫu thuật Tổng quát",
    description: "Thực hiện các ca phẫu thuật tổng quát và chuyên sâu với trang thiết bị hiện đại.",
    location: "Tầng 5, Tòa nhà A",
    phone: "(028) 3123-4572",
    email: "phauthuattq@hospital.vn",
    specialties: ["Phẫu thuật ổ bụng", "Phẫu thuật nội soi", "Phẫu thuật cấp cứu"],
    doctor_count: 14,
    services: ["Phẫu thuật nội soi", "Phẫu thuật robot", "Phẫu thuật cấp cứu"],
    working_hours: "24/7",
    emergency_available: true
  }
]

const departmentIcons: { [key: string]: any } = {
  "Khoa Tim mạch": Heart,
  "Khoa Nhi": Baby,
  "Khoa Thần kinh": Brain,
  "Khoa Chấn thương Chỉnh hình": Bone,
  "Khoa Mắt": Eye,
  "Khoa Phẫu thuật Tổng quát": Scissors,
  "default": Building2
}

export default function DepartmentsPage() {
  const [departments, setDepartments] = useState<Department[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState("all")

  useEffect(() => {
    const fetchDepartments = async () => {
      setIsLoading(true)
      try {
        // Try to fetch from API first
        const apiDepartments = await departmentsApi.getAllDepartments()
        if (apiDepartments && apiDepartments.length > 0) {
          setDepartments(apiDepartments)
        } else {
          // Fallback to mock data
          setDepartments(mockDepartments)
        }
      } catch (error) {
        console.error('Error fetching departments:', error)
        // Use mock data as fallback
        setDepartments(mockDepartments)
      } finally {
        setIsLoading(false)
      }
    }

    fetchDepartments()
  }, [])

  const categories = [
    { id: "all", name: "Tất cả khoa", icon: Building2 },
    { id: "emergency", name: "Cấp cứu 24/7", icon: Activity },
    { id: "surgery", name: "Phẫu thuật", icon: Scissors },
    { id: "specialty", name: "Chuyên khoa", icon: Stethoscope }
  ]

  const filteredDepartments = departments.filter(dept => {
    if (selectedCategory === "all") return true
    if (selectedCategory === "emergency") return dept.emergency_available
    if (selectedCategory === "surgery") return dept.name.includes("Phẫu thuật")
    if (selectedCategory === "specialty") return !dept.name.includes("Phẫu thuật")
    return true
  })

  const getDepartmentIcon = (name: string) => {
    return departmentIcons[name] || departmentIcons.default
  }

  if (isLoading) {
    return (
      <PublicLayout currentPage="departments">
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-64 bg-gray-200 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </PublicLayout>
    )
  }

  return (
    <PublicLayout currentPage="departments">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-[#003087] to-[#0066CC] text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Các Khoa Chuyên môn
          </h1>
          <p className="text-xl mb-8 max-w-3xl mx-auto">
            Hệ thống các khoa chuyên môn với đội ngũ bác sĩ giàu kinh nghiệm và trang thiết bị hiện đại
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <div className="flex items-center gap-2 bg-white/20 px-4 py-2 rounded-full">
              <Building2 className="w-5 h-5" />
              <span>{departments.length} Khoa chuyên môn</span>
            </div>
            <div className="flex items-center gap-2 bg-white/20 px-4 py-2 rounded-full">
              <Users className="w-5 h-5" />
              <span>{departments.reduce((sum, dept) => sum + (dept.doctor_count || 0), 0)} Bác sĩ</span>
            </div>
            <div className="flex items-center gap-2 bg-white/20 px-4 py-2 rounded-full">
              <Activity className="w-5 h-5" />
              <span>Cấp cứu 24/7</span>
            </div>
          </div>
        </div>
      </section>

      {/* Filter Categories */}
      <section className="py-8 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap justify-center gap-4">
            {categories.map((category) => {
              const IconComponent = category.icon
              return (
                <Button
                  key={category.id}
                  variant={selectedCategory === category.id ? "default" : "outline"}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`flex items-center gap-2 ${
                    selectedCategory === category.id 
                      ? "bg-[#003087] text-white" 
                      : "border-[#003087] text-[#003087] hover:bg-[#003087] hover:text-white"
                  }`}
                >
                  <IconComponent className="w-4 h-4" />
                  {category.name}
                </Button>
              )
            })}
          </div>
        </div>
      </section>

      {/* Departments Grid */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredDepartments.map((department) => {
              const IconComponent = getDepartmentIcon(department.name)
              return (
                <Card key={department.department_id} className="hover:shadow-lg transition-shadow duration-300">
                  <CardHeader>
                    <div className="flex items-center gap-4 mb-4">
                      <div className="p-3 bg-[#003087]/10 rounded-lg">
                        <IconComponent className="w-8 h-8 text-[#003087]" />
                      </div>
                      <div className="flex-1">
                        <CardTitle className="text-xl text-[#003087]">
                          {department.name}
                        </CardTitle>
                        {department.emergency_available && (
                          <Badge variant="destructive" className="mt-1">
                            <Activity className="w-3 h-3 mr-1" />
                            Cấp cứu 24/7
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-gray-600 text-sm leading-relaxed">
                      {department.description}
                    </p>

                    {/* Department Info */}
                    <div className="space-y-2 text-sm">
                      {department.location && (
                        <div className="flex items-center gap-2 text-gray-600">
                          <MapPin className="w-4 h-4" />
                          <span>{department.location}</span>
                        </div>
                      )}
                      {department.phone && (
                        <div className="flex items-center gap-2 text-gray-600">
                          <Phone className="w-4 h-4" />
                          <span>{department.phone}</span>
                        </div>
                      )}
                      {department.working_hours && (
                        <div className="flex items-center gap-2 text-gray-600">
                          <Clock className="w-4 h-4" />
                          <span>{department.working_hours}</span>
                        </div>
                      )}
                      {department.doctor_count && (
                        <div className="flex items-center gap-2 text-gray-600">
                          <Users className="w-4 h-4" />
                          <span>{department.doctor_count} bác sĩ</span>
                        </div>
                      )}
                    </div>

                    {/* Specialties */}
                    {department.specialties && department.specialties.length > 0 && (
                      <div>
                        <h4 className="font-medium text-sm mb-2">Chuyên khoa:</h4>
                        <div className="flex flex-wrap gap-1">
                          {department.specialties.slice(0, 3).map((specialty, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {specialty}
                            </Badge>
                          ))}
                          {department.specialties.length > 3 && (
                            <Badge variant="secondary" className="text-xs">
                              +{department.specialties.length - 3} khác
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-2 pt-4">
                      <Link href={`/departments/${department.department_id}`} className="flex-1">
                        <Button variant="outline" className="w-full text-[#003087] border-[#003087] hover:bg-[#003087] hover:text-white">
                          Xem chi tiết
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                      </Link>
                      <Link href="/patient/appointments">
                        <Button className="bg-[#003087] hover:bg-[#002266]">
                          Đặt lịch
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {filteredDepartments.length === 0 && (
            <div className="text-center py-12">
              <Building2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-medium text-gray-600 mb-2">
                Không tìm thấy khoa nào
              </h3>
              <p className="text-gray-500">
                Thử thay đổi bộ lọc để xem các khoa khác
              </p>
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-[#003087] text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Cần tư vấn về dịch vụ y tế?
          </h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto">
            Đội ngũ chuyên viên của chúng tôi sẵn sàng hỗ trợ bạn 24/7
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/contact">
              <Button variant="secondary" size="lg" className="bg-white text-[#003087] hover:bg-gray-100">
                <Phone className="w-5 h-5 mr-2" />
                Liên hệ ngay
              </Button>
            </Link>
            <Link href="/patient/appointments">
              <Button variant="outline" size="lg" className="border-white text-white hover:bg-white hover:text-[#003087]">
                <Calendar className="w-5 h-5 mr-2" />
                Đặt lịch khám
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </PublicLayout>
  )
}
