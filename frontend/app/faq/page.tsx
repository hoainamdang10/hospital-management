"use client"

import { useState } from "react"
import {
  Search,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  Phone,
  Mail,
  MessageCircle,
  Clock,
  Calendar,
  CreditCard,
  Shield,
  User,
  Stethoscope,
  Building2
} from "lucide-react"
import { PublicLayout } from "@/components/layout/PublicLayout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"

interface FAQItem {
  id: string
  question: string
  answer: string
  category: string
  tags: string[]
  helpful_count: number
}

interface FAQCategory {
  id: string
  name: string
  icon: any
  description: string
  color: string
}

// Mock FAQ data
const faqCategories: FAQCategory[] = [
  {
    id: "appointment",
    name: "Đặt lịch khám",
    icon: Calendar,
    description: "Hướng dẫn đặt lịch và quản lý cuộc hẹn",
    color: "text-blue-600"
  },
  {
    id: "payment",
    name: "Thanh toán",
    icon: CreditCard,
    description: "Thông tin về phí khám và thanh toán",
    color: "text-green-600"
  },
  {
    id: "services",
    name: "Dịch vụ y tế",
    icon: Stethoscope,
    description: "Các dịch vụ và chuyên khoa",
    color: "text-purple-600"
  },
  {
    id: "account",
    name: "Tài khoản",
    icon: User,
    description: "Quản lý tài khoản và thông tin cá nhân",
    color: "text-orange-600"
  },
  {
    id: "insurance",
    name: "Bảo hiểm",
    icon: Shield,
    description: "Bảo hiểm y tế và quyền lợi",
    color: "text-red-600"
  },
  {
    id: "general",
    name: "Thông tin chung",
    icon: Building2,
    description: "Thông tin về bệnh viện và quy định",
    color: "text-gray-600"
  }
]

const faqData: FAQItem[] = [
  {
    id: "1",
    question: "Làm thế nào để đặt lịch khám bệnh?",
    answer: "Bạn có thể đặt lịch khám bệnh theo 3 cách: (1) Trực tuyến qua website hoặc app, (2) Gọi điện thoại đến hotline 1900-xxxx, (3) Trực tiếp tại quầy lễ tân bệnh viện. Khi đặt lịch, bạn cần cung cấp thông tin cá nhân, chọn bác sĩ và thời gian phù hợp.",
    category: "appointment",
    tags: ["đặt lịch", "khám bệnh", "online"],
    helpful_count: 245
  },
  {
    id: "2",
    question: "Tôi có thể hủy hoặc thay đổi lịch hẹn không?",
    answer: "Có, bạn có thể hủy hoặc thay đổi lịch hẹn trước ít nhất 2 giờ so với thời gian đã đặt. Bạn có thể thực hiện qua website, app hoặc gọi điện thoại. Lưu ý: Việc hủy lịch quá muộn có thể bị tính phí.",
    category: "appointment",
    tags: ["hủy lịch", "thay đổi", "lịch hẹn"],
    helpful_count: 189
  },
  {
    id: "3",
    question: "Các hình thức thanh toán nào được chấp nhận?",
    answer: "Bệnh viện chấp nhận các hình thức thanh toán: Tiền mặt, Thẻ ATM/Credit Card (Visa, Mastercard), Chuyển khoản ngân hàng, Ví điện tử (MoMo, ZaloPay, VNPay), và Bảo hiểm y tế.",
    category: "payment",
    tags: ["thanh toán", "phí khám", "bảo hiểm"],
    helpful_count: 156
  },
  {
    id: "4",
    question: "Phí khám bệnh là bao nhiêu?",
    answer: "Phí khám bệnh phụ thuộc vào chuyên khoa và bác sĩ: Khám tổng quát: 200.000 - 300.000 VNĐ, Chuyên khoa: 300.000 - 500.000 VNĐ, Giáo sư/Phó giáo sư: 500.000 - 800.000 VNĐ. Phí có thể thay đổi theo thời gian, vui lòng kiểm tra cập nhật trên website.",
    category: "payment",
    tags: ["phí khám", "giá cả", "chi phí"],
    helpful_count: 298
  },
  {
    id: "5",
    question: "Bệnh viện có những chuyên khoa nào?",
    answer: "Bệnh viện có đầy đủ các chuyên khoa: Tim mạch, Thần kinh, Nhi khoa, Sản phụ khoa, Chấn thương chỉnh hình, Mắt, Tai mũi họng, Da liễu, Tiêu hóa, Hô hấp, Nội tiết, Ung bướu, và nhiều chuyên khoa khác. Mỗi khoa đều có đội ngũ bác sĩ giàu kinh nghiệm.",
    category: "services",
    tags: ["chuyên khoa", "dịch vụ", "bác sĩ"],
    helpful_count: 167
  },
  {
    id: "6",
    question: "Làm thế nào để tạo tài khoản?",
    answer: "Để tạo tài khoản, bạn truy cập website và nhấn 'Đăng ký', sau đó điền đầy đủ thông tin: họ tên, số điện thoại, email, và tạo mật khẩu. Hệ thống sẽ gửi mã xác thực qua SMS hoặc email để kích hoạt tài khoản.",
    category: "account",
    tags: ["đăng ký", "tài khoản", "xác thực"],
    helpful_count: 134
  },
  {
    id: "7",
    question: "Bảo hiểm y tế có được chấp nhận không?",
    answer: "Có, bệnh viện chấp nhận tất cả các loại bảo hiểm y tế: BHYT xã hội, BHYT tự nguyện, và các gói bảo hiểm tư nhân. Khi khám, vui lòng mang theo thẻ BHYT và CMND/CCCD để được hỗ trợ thanh toán.",
    category: "insurance",
    tags: ["bảo hiểm", "BHYT", "thanh toán"],
    helpful_count: 223
  },
  {
    id: "8",
    question: "Giờ làm việc của bệnh viện?",
    answer: "Bệnh viện hoạt động: Thứ 2 - Thứ 6: 7:00 - 17:00, Thứ 7: 7:00 - 12:00, Chủ nhật: Nghỉ (trừ cấp cứu). Khoa Cấp cứu hoạt động 24/7. Một số chuyên khoa có thể có giờ làm việc khác, vui lòng kiểm tra khi đặt lịch.",
    category: "general",
    tags: ["giờ làm việc", "thời gian", "cấp cứu"],
    helpful_count: 178
  },
  {
    id: "9",
    question: "Có dịch vụ khám bệnh từ xa không?",
    answer: "Có, bệnh viện cung cấp dịch vụ telemedicine cho phép bạn tư vấn với bác sĩ từ xa qua video call. Dịch vụ này phù hợp cho tư vấn sức khỏe, theo dõi bệnh mãn tính, và tái khám. Phí tư vấn từ 200.000 - 400.000 VNĐ tùy bác sĩ.",
    category: "services",
    tags: ["telemedicine", "khám từ xa", "video call"],
    helpful_count: 145
  },
  {
    id: "10",
    question: "Làm thế nào để lấy kết quả xét nghiệm?",
    answer: "Kết quả xét nghiệm có thể được lấy theo 3 cách: (1) Trực tiếp tại bệnh viện sau thời gian thông báo, (2) Xem online qua tài khoản cá nhân trên website/app, (3) Nhận qua email nếu đã đăng ký. Thời gian có kết quả thường từ 1-3 ngày tùy loại xét nghiệm.",
    category: "services",
    tags: ["xét nghiệm", "kết quả", "online"],
    helpful_count: 201
  }
]

export default function FAQPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [expandedItems, setExpandedItems] = useState<string[]>([])

  const filteredFAQs = faqData.filter(faq => {
    const matchesSearch = searchTerm === "" || 
      faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      faq.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
    
    const matchesCategory = selectedCategory === "all" || faq.category === selectedCategory

    return matchesSearch && matchesCategory
  })

  const toggleExpanded = (id: string) => {
    setExpandedItems(prev => 
      prev.includes(id) 
        ? prev.filter(item => item !== id)
        : [...prev, id]
    )
  }

  const handleHelpful = (id: string) => {
    // In real app, send to API
    console.log(`Marked FAQ ${id} as helpful`)
  }

  return (
    <PublicLayout currentPage="faq">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-[#003087] to-[#0066CC] text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Câu hỏi thường gặp
          </h1>
          <p className="text-xl mb-8 max-w-3xl mx-auto">
            Tìm câu trả lời nhanh chóng cho các thắc mắc về dịch vụ y tế và quy trình khám bệnh
          </p>
          
          {/* Search Bar */}
          <div className="max-w-2xl mx-auto">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                placeholder="Tìm kiếm câu hỏi..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-12 h-14 text-lg bg-white text-gray-900"
              />
            </div>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-8">
        {/* Category Filter */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-[#003087] mb-6">Danh mục câu hỏi</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <Button
              variant={selectedCategory === "all" ? "default" : "outline"}
              onClick={() => setSelectedCategory("all")}
              className={`h-auto p-4 flex flex-col gap-2 ${
                selectedCategory === "all" 
                  ? "bg-[#003087] text-white" 
                  : "border-[#003087] text-[#003087] hover:bg-[#003087] hover:text-white"
              }`}
            >
              <HelpCircle className="w-6 h-6" />
              <span className="text-sm">Tất cả</span>
              <Badge variant="secondary" className="text-xs">
                {faqData.length}
              </Badge>
            </Button>
            {faqCategories.map((category) => {
              const IconComponent = category.icon
              const categoryCount = faqData.filter(faq => faq.category === category.id).length
              return (
                <Button
                  key={category.id}
                  variant={selectedCategory === category.id ? "default" : "outline"}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`h-auto p-4 flex flex-col gap-2 ${
                    selectedCategory === category.id 
                      ? "bg-[#003087] text-white" 
                      : "border-[#003087] text-[#003087] hover:bg-[#003087] hover:text-white"
                  }`}
                >
                  <IconComponent className="w-6 h-6" />
                  <span className="text-sm text-center">{category.name}</span>
                  <Badge variant="secondary" className="text-xs">
                    {categoryCount}
                  </Badge>
                </Button>
              )
            })}
          </div>
        </div>

        {/* FAQ List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-[#003087]">
              {selectedCategory === "all" 
                ? "Tất cả câu hỏi" 
                : faqCategories.find(c => c.id === selectedCategory)?.name
              }
            </h3>
            <span className="text-gray-600">
              {filteredFAQs.length} câu hỏi
            </span>
          </div>

          {filteredFAQs.length > 0 ? (
            <div className="space-y-4">
              {filteredFAQs.map((faq) => {
                const isExpanded = expandedItems.includes(faq.id)
                const category = faqCategories.find(c => c.id === faq.category)
                return (
                  <Card key={faq.id} className="hover:shadow-md transition-shadow">
                    <CardHeader 
                      className="cursor-pointer"
                      onClick={() => toggleExpanded(faq.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="outline" className={`${category?.color} border-current`}>
                              {category?.name}
                            </Badge>
                            <Badge variant="secondary" className="text-xs">
                              {faq.helpful_count} người thấy hữu ích
                            </Badge>
                          </div>
                          <CardTitle className="text-lg text-left">
                            {faq.question}
                          </CardTitle>
                        </div>
                        {isExpanded ? (
                          <ChevronUp className="w-5 h-5 text-gray-500" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-gray-500" />
                        )}
                      </div>
                    </CardHeader>
                    {isExpanded && (
                      <CardContent>
                        <div className="space-y-4">
                          <p className="text-gray-700 leading-relaxed">
                            {faq.answer}
                          </p>
                          
                          {/* Tags */}
                          <div className="flex flex-wrap gap-2">
                            {faq.tags.map((tag, index) => (
                              <Badge key={index} variant="secondary" className="text-xs">
                                #{tag}
                              </Badge>
                            ))}
                          </div>

                          {/* Helpful Actions */}
                          <div className="flex items-center justify-between pt-4 border-t">
                            <p className="text-sm text-gray-600">
                              Câu trả lời này có hữu ích không?
                            </p>
                            <div className="flex gap-2">
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => handleHelpful(faq.id)}
                              >
                                👍 Có
                              </Button>
                              <Button size="sm" variant="outline">
                                👎 Không
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    )}
                  </Card>
                )
              })}
            </div>
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <Search className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-medium text-gray-600 mb-2">
                  Không tìm thấy câu hỏi nào
                </h3>
                <p className="text-gray-500 mb-6">
                  Thử thay đổi từ khóa tìm kiếm hoặc danh mục
                </p>
                <Button variant="outline">
                  Xóa bộ lọc
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Contact Support */}
        <Card className="mt-12">
          <CardHeader>
            <CardTitle className="text-center">Không tìm thấy câu trả lời?</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center text-gray-600 mb-6">
              Đội ngũ hỗ trợ của chúng tôi sẵn sàng giúp đỡ bạn 24/7
            </p>
            <div className="grid md:grid-cols-3 gap-4">
              <Button variant="outline" className="h-auto p-4 flex flex-col gap-2">
                <Phone className="w-6 h-6 text-green-600" />
                <span className="font-medium">Hotline</span>
                <span className="text-sm text-gray-600">1900-xxxx</span>
              </Button>
              <Button variant="outline" className="h-auto p-4 flex flex-col gap-2">
                <Mail className="w-6 h-6 text-blue-600" />
                <span className="font-medium">Email</span>
                <span className="text-sm text-gray-600">support@hospital.vn</span>
              </Button>
              <Button variant="outline" className="h-auto p-4 flex flex-col gap-2">
                <MessageCircle className="w-6 h-6 text-purple-600" />
                <span className="font-medium">Live Chat</span>
                <span className="text-sm text-gray-600">Trò chuyện trực tuyến</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Popular Questions */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Câu hỏi phổ biến nhất</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {faqData
                .sort((a, b) => b.helpful_count - a.helpful_count)
                .slice(0, 5)
                .map((faq, index) => (
                  <div key={faq.id} className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg cursor-pointer"
                       onClick={() => toggleExpanded(faq.id)}>
                    <div className="w-6 h-6 bg-[#003087] text-white rounded-full flex items-center justify-center text-sm font-bold">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{faq.question}</p>
                      <p className="text-sm text-gray-600">{faq.helpful_count} người thấy hữu ích</p>
                    </div>
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </PublicLayout>
  )
}
