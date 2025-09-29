"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  Camera, 
  Edit, 
  Smartphone, 
  Star, 
  Shield, 
  Zap,
  Users,
  FileText,
  Settings
} from "lucide-react"

const features = [
  {
    icon: Camera,
    title: "Avatar Upload",
    description: "Tải lên và preview avatar với validation file",
    color: "text-blue-600",
    bgColor: "bg-blue-100"
  },
  {
    icon: Edit,
    title: "Inline Editing",
    description: "Chỉnh sửa thông tin trực tiếp với validation",
    color: "text-green-600", 
    bgColor: "bg-green-100"
  },
  {
    icon: Smartphone,
    title: "Responsive Design",
    description: "Tối ưu cho desktop, tablet và mobile",
    color: "text-purple-600",
    bgColor: "bg-purple-100"
  },
  {
    icon: Star,
    title: "Role-based UI",
    description: "Giao diện khác nhau cho bác sĩ và bệnh nhân",
    color: "text-yellow-600",
    bgColor: "bg-yellow-100"
  },
  {
    icon: Shield,
    title: "Data Validation",
    description: "Kiểm tra và xác thực dữ liệu đầu vào",
    color: "text-red-600",
    bgColor: "bg-red-100"
  },
  {
    icon: Zap,
    title: "Fast Performance",
    description: "Tối ưu hiệu suất với lazy loading",
    color: "text-orange-600",
    bgColor: "bg-orange-100"
  }
]

const technicalSpecs = [
  {
    category: "Frontend",
    items: ["React 18", "TypeScript", "Tailwind CSS", "Radix UI"]
  },
  {
    category: "Features", 
    items: ["File Upload", "Form Validation", "Real-time Preview", "Error Handling"]
  },
  {
    category: "Responsive",
    items: ["Mobile First", "Tablet Optimized", "Desktop Enhanced", "Touch Friendly"]
  }
]

export function ProfileFeatures() {
  return (
    <div className="space-y-8">
      {/* Main Features */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Tính năng chính
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map((feature, index) => {
              const Icon = feature.icon
              return (
                <div key={index} className="flex items-start gap-3 p-4 rounded-lg border hover:shadow-md transition-shadow">
                  <div className={`p-2 rounded-lg ${feature.bgColor}`}>
                    <Icon className={`h-5 w-5 ${feature.color}`} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{feature.title}</h3>
                    <p className="text-sm text-gray-600 mt-1">{feature.description}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Technical Specifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Thông số kỹ thuật
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {technicalSpecs.map((spec, index) => (
              <div key={index}>
                <h3 className="font-semibold text-gray-900 mb-3">{spec.category}</h3>
                <div className="space-y-2">
                  {spec.items.map((item, itemIndex) => (
                    <Badge key={itemIndex} variant="outline" className="mr-2 mb-2">
                      {item}
                    </Badge>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Usage Examples */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Cách sử dụng
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold mb-2">1. Import Component</h3>
              <code className="text-sm bg-white p-2 rounded border block">
                import {`{ ProfessionalProfile }`} from "@/components/profile/ProfessionalProfile"
              </code>
            </div>
            
            <div className="p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold mb-2">2. Sử dụng trong trang</h3>
              <code className="text-sm bg-white p-2 rounded border block whitespace-pre">
{`<ProfessionalProfile
  profileData={profileData}
  onSave={handleSave}
  onAvatarUpload={handleAvatarUpload}
  isLoading={loading}
/>`}
              </code>
            </div>

            <div className="p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold mb-2">3. Xử lý sự kiện</h3>
              <code className="text-sm bg-white p-2 rounded border block whitespace-pre">
{`const handleSave = async (formData) => {
  // Gọi API để lưu dữ liệu
  await updateProfile(formData)
}

const handleAvatarUpload = async (file) => {
  // Upload file và trả về URL
  return await uploadAvatar(file)
}`}
              </code>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
