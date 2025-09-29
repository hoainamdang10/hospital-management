"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import {
  Calendar,
  Clock,
  User,
  Eye,
  Heart,
  Share2,
  Search,
  Filter,
  Tag,
  ArrowRight,
  TrendingUp,
  Bell,
  BookOpen,
  Activity,
  Shield,
  Stethoscope
} from "lucide-react"
import { PublicLayout } from "@/components/layout/PublicLayout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface NewsArticle {
  id: string
  title: string
  excerpt: string
  content?: string
  author: string
  publishedAt: string
  category: string
  tags: string[]
  imageUrl?: string
  views: number
  featured: boolean
  urgent?: boolean
}

// Mock news data
const mockNews: NewsArticle[] = [
  {
    id: "1",
    title: "Bệnh viện triển khai hệ thống khám bệnh từ xa hiện đại",
    excerpt: "Hệ thống telemedicine mới cho phép bệnh nhân tư vấn với bác sĩ từ xa, giảm thời gian chờ đợi và tăng khả năng tiếp cận dịch vụ y tế.",
    author: "BS. Nguyễn Văn An",
    publishedAt: "2025-01-03",
    category: "Công nghệ Y tế",
    tags: ["Telemedicine", "Công nghệ", "Đổi mới"],
    imageUrl: "/placeholder.svg?height=200&width=400",
    views: 1250,
    featured: true
  },
  {
    id: "2", 
    title: "Thông báo: Lịch nghỉ Tết Nguyên đán 2025",
    excerpt: "Bệnh viện thông báo lịch nghỉ Tết Nguyên đán và các dịch vụ cấp cứu hoạt động 24/7 trong dịp lễ.",
    author: "Ban Giám đốc",
    publishedAt: "2025-01-02",
    category: "Thông báo",
    tags: ["Thông báo", "Lịch nghỉ", "Tết"],
    imageUrl: "/placeholder.svg?height=200&width=400",
    views: 2100,
    featured: true,
    urgent: true
  },
  {
    id: "3",
    title: "Khoa Tim mạch đạt chứng nhận ISO 9001:2015",
    excerpt: "Khoa Tim mạch chính thức nhận chứng nhận ISO 9001:2015, khẳng định chất lượng dịch vụ y tế đạt tiêu chuẩn quốc tế.",
    author: "BS. Trần Thị Bình",
    publishedAt: "2025-01-01",
    category: "Thành tựu",
    tags: ["Chứng nhận", "Chất lượng", "Tim mạch"],
    imageUrl: "/placeholder.svg?height=200&width=400",
    views: 890,
    featured: false
  },
  {
    id: "4",
    title: "Hướng dẫn phòng chống cúm mùa 2025",
    excerpt: "Các biện pháp phòng ngừa cúm mùa hiệu quả, bao gồm tiêm vaccine, vệ sinh cá nhân và chế độ dinh dưỡng hợp lý.",
    author: "BS. Lê Minh Cường",
    publishedAt: "2024-12-30",
    category: "Sức khỏe",
    tags: ["Phòng bệnh", "Cúm mùa", "Vaccine"],
    imageUrl: "/placeholder.svg?height=200&width=400",
    views: 1560,
    featured: false
  },
  {
    id: "5",
    title: "Khai trương Trung tâm Chẩn đoán hình ảnh mới",
    excerpt: "Trung tâm được trang bị máy MRI 3.0 Tesla và CT Scanner 128 lát cắt, nâng cao khả năng chẩn đoán chính xác.",
    author: "BS. Phạm Thị Dung",
    publishedAt: "2024-12-28",
    category: "Cơ sở vật chất",
    tags: ["MRI", "CT Scanner", "Chẩn đoán"],
    imageUrl: "/placeholder.svg?height=200&width=400",
    views: 720,
    featured: false
  },
  {
    id: "6",
    title: "Chương trình khám sức khỏe miễn phí cho người cao tuổi",
    excerpt: "Bệnh viện tổ chức chương trình khám sức khỏe miễn phí dành cho người trên 65 tuổi trong tháng 1/2025.",
    author: "Phòng Công tác Xã hội",
    publishedAt: "2024-12-25",
    category: "Chương trình",
    tags: ["Khám miễn phí", "Người cao tuổi", "Cộng đồng"],
    imageUrl: "/placeholder.svg?height=200&width=400",
    views: 1890,
    featured: false
  }
]

const categories = [
  { id: "all", name: "Tất cả", icon: BookOpen },
  { id: "Thông báo", name: "Thông báo", icon: Bell },
  { id: "Sức khỏe", name: "Sức khỏe", icon: Heart },
  { id: "Công nghệ Y tế", name: "Công nghệ Y tế", icon: Activity },
  { id: "Thành tựu", name: "Thành tựu", icon: TrendingUp },
  { id: "Cơ sở vật chất", name: "Cơ sở vật chất", icon: Shield },
  { id: "Chương trình", name: "Chương trình", icon: Stethoscope }
]

export default function NewsPage() {
  const [news, setNews] = useState<NewsArticle[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [sortBy, setSortBy] = useState("newest")

  useEffect(() => {
    // Simulate API call
    const fetchNews = async () => {
      setIsLoading(true)
      try {
        // In real app, fetch from API
        await new Promise(resolve => setTimeout(resolve, 1000))
        setNews(mockNews)
      } catch (error) {
        console.error('Error fetching news:', error)
        setNews(mockNews)
      } finally {
        setIsLoading(false)
      }
    }

    fetchNews()
  }, [])

  const filteredNews = news
    .filter(article => {
      const matchesSearch = searchTerm === "" || 
        article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        article.excerpt.toLowerCase().includes(searchTerm.toLowerCase()) ||
        article.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      
      const matchesCategory = selectedCategory === "all" || article.category === selectedCategory

      return matchesSearch && matchesCategory
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
        case "oldest":
          return new Date(a.publishedAt).getTime() - new Date(b.publishedAt).getTime()
        case "popular":
          return b.views - a.views
        default:
          return 0
      }
    })

  const featuredNews = news.filter(article => article.featured)
  const urgentNews = news.filter(article => article.urgent)

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
  }

  const formatViews = (views: number) => {
    if (views >= 1000) {
      return `${(views / 1000).toFixed(1)}k`
    }
    return views.toString()
  }

  if (isLoading) {
    return (
      <PublicLayout currentPage="news">
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
    <PublicLayout currentPage="news">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-[#003087] to-[#0066CC] text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Tin tức Y tế
          </h1>
          <p className="text-xl mb-8 max-w-3xl mx-auto">
            Cập nhật những thông tin mới nhất về y tế, sức khỏe và các hoạt động của bệnh viện
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <div className="flex items-center gap-2 bg-white/20 px-4 py-2 rounded-full">
              <BookOpen className="w-5 h-5" />
              <span>{news.length} Bài viết</span>
            </div>
            <div className="flex items-center gap-2 bg-white/20 px-4 py-2 rounded-full">
              <TrendingUp className="w-5 h-5" />
              <span>Cập nhật hàng ngày</span>
            </div>
          </div>
        </div>
      </section>

      {/* Urgent News Banner */}
      {urgentNews.length > 0 && (
        <section className="bg-red-50 border-l-4 border-red-500 py-4">
          <div className="container mx-auto px-4">
            <div className="flex items-center gap-3">
              <Bell className="w-6 h-6 text-red-500" />
              <div>
                <h3 className="font-bold text-red-800">Thông báo khẩn cấp</h3>
                <div className="flex flex-wrap gap-4">
                  {urgentNews.map((article) => (
                    <Link key={article.id} href={`/news/${article.id}`} 
                          className="text-red-700 hover:text-red-900 underline">
                      {article.title}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      <div className="container mx-auto px-4 py-8">
        {/* Search and Filter */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Tìm kiếm tin tức..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full md:w-48">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Chọn danh mục" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Sắp xếp" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Mới nhất</SelectItem>
                <SelectItem value="oldest">Cũ nhất</SelectItem>
                <SelectItem value="popular">Phổ biến</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Category Filters */}
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => {
              const IconComponent = category.icon
              return (
                <Button
                  key={category.id}
                  variant={selectedCategory === category.id ? "default" : "outline"}
                  size="sm"
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

        {/* Featured News */}
        {featuredNews.length > 0 && selectedCategory === "all" && (
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-[#003087] mb-6">Tin nổi bật</h2>
            <div className="grid md:grid-cols-2 gap-6">
              {featuredNews.slice(0, 2).map((article) => (
                <Card key={article.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="relative h-48">
                    <Image
                      src={article.imageUrl || "/placeholder.svg"}
                      alt={article.title}
                      fill
                      className="object-cover"
                    />
                    <Badge className="absolute top-4 left-4 bg-[#003087]">
                      Nổi bật
                    </Badge>
                    {article.urgent && (
                      <Badge className="absolute top-4 right-4 bg-red-500">
                        Khẩn cấp
                      </Badge>
                    )}
                  </div>
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>{formatDate(article.publishedAt)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Eye className="w-4 h-4" />
                        <span>{formatViews(article.views)} lượt xem</span>
                      </div>
                    </div>
                    <h3 className="text-xl font-bold mb-3 line-clamp-2">
                      <Link href={`/news/${article.id}`} className="hover:text-[#003087]">
                        {article.title}
                      </Link>
                    </h3>
                    <p className="text-gray-600 mb-4 line-clamp-3">
                      {article.excerpt}
                    </p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-600">{article.author}</span>
                      </div>
                      <Link href={`/news/${article.id}`}>
                        <Button variant="ghost" size="sm" className="text-[#003087]">
                          Đọc thêm
                          <ArrowRight className="w-4 h-4 ml-1" />
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* All News */}
        <section>
          <h2 className="text-2xl font-bold text-[#003087] mb-6">
            {selectedCategory === "all" ? "Tất cả tin tức" : `Tin tức: ${selectedCategory}`}
          </h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredNews.map((article) => (
              <Card key={article.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <div className="relative h-48">
                  <Image
                    src={article.imageUrl || "/placeholder.svg"}
                    alt={article.title}
                    fill
                    className="object-cover"
                  />
                  <Badge className="absolute top-4 left-4 bg-[#003087]/80">
                    {article.category}
                  </Badge>
                  {article.urgent && (
                    <Badge className="absolute top-4 right-4 bg-red-500">
                      Khẩn cấp
                    </Badge>
                  )}
                </div>
                <CardContent className="p-4">
                  <div className="flex items-center gap-4 text-xs text-gray-600 mb-2">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      <span>{formatDate(article.publishedAt)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Eye className="w-3 h-3" />
                      <span>{formatViews(article.views)}</span>
                    </div>
                  </div>
                  <h3 className="font-bold mb-2 line-clamp-2 text-sm">
                    <Link href={`/news/${article.id}`} className="hover:text-[#003087]">
                      {article.title}
                    </Link>
                  </h3>
                  <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                    {article.excerpt}
                  </p>
                  
                  {/* Tags */}
                  <div className="flex flex-wrap gap-1 mb-3">
                    {article.tags.slice(0, 2).map((tag, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                    {article.tags.length > 2 && (
                      <Badge variant="secondary" className="text-xs">
                        +{article.tags.length - 2}
                      </Badge>
                    )}
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-600">{article.author}</span>
                    <Link href={`/news/${article.id}`}>
                      <Button variant="ghost" size="sm" className="text-[#003087] text-xs">
                        Đọc thêm
                        <ArrowRight className="w-3 h-3 ml-1" />
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredNews.length === 0 && (
            <div className="text-center py-12">
              <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-medium text-gray-600 mb-2">
                Không tìm thấy tin tức nào
              </h3>
              <p className="text-gray-500">
                Thử thay đổi từ khóa tìm kiếm hoặc danh mục
              </p>
            </div>
          )}
        </section>
      </div>

      {/* Newsletter Subscription */}
      <section className="bg-[#003087] text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Đăng ký nhận tin tức
          </h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto">
            Nhận thông tin y tế mới nhất và các thông báo quan trọng từ bệnh viện
          </p>
          <div className="flex flex-col md:flex-row gap-4 max-w-md mx-auto">
            <Input
              placeholder="Nhập địa chỉ email của bạn"
              className="bg-white text-gray-900"
            />
            <Button variant="secondary" className="bg-white text-[#003087] hover:bg-gray-100">
              <Bell className="w-4 h-4 mr-2" />
              Đăng ký
            </Button>
          </div>
        </div>
      </section>
    </PublicLayout>
  )
}
