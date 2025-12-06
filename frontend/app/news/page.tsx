'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import {
  Calendar, User, Clock, ArrowRight,
  Play, TrendingUp, Bell, ExternalLink,
  ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PublicNavbar } from '@/components/layout/PublicNavbar';
import { PublicFooter } from '@/components/layout/PublicFooter';

// Breaking news ticker
const breakingNews = [
  'Khai trương phòng khám tim mạch can thiệp hiện đại nhất khu vực phía Nam',
  'Chương trình khám sức khỏe miễn phí cho người cao tuổi tháng 1/2025',
  'Bệnh viện đạt chứng nhận JCI quốc tế lần thứ 3 liên tiếp',
];

// Featured news
const featuredNews = {
  id: 'news-1',
  title: 'Khai trương Trung tâm Tim mạch can thiệp chuẩn quốc tế',
  excerpt: 'Bệnh viện chính thức đưa vào hoạt động Trung tâm Tim mạch can thiệp với hệ thống DSA thế hệ mới, đáp ứng mọi kỹ thuật can thiệp tim mạch phức tạp nhất.',
  image: 'https://images.unsplash.com/photo-1551190822-a9333d879b1f?auto=format&fit=crop&q=80&w=1200',
  date: '15/01/2025',
  author: 'Ban Truyền thông',
  category: 'Sự kiện',
  isVideo: true,
};

// News grid data
const newsItems = [
  {
    id: '1',
    title: 'Chương trình khám sức khỏe miễn phí cho người cao tuổi',
    excerpt: 'Khám sức khỏe miễn phí cho người cao tuổi và trẻ em dưới 6 tuổi trong tháng 1/2025...',
    image: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&q=80&w=600',
    date: '12/01/2025',
    category: 'Cộng đồng',
    isHot: true,
  },
  {
    id: '2',
    title: 'Hội thảo quốc tế về chăm sóc sức khỏe tim mạch 2025',
    excerpt: 'Hội thảo với sự tham gia của các chuyên gia hàng đầu từ 15 quốc gia...',
    image: 'https://images.unsplash.com/photo-1587825140708-dfaf72ae4b04?auto=format&fit=crop&q=80&w=600',
    date: '10/01/2025',
    category: 'Sự kiện',
    isHot: false,
  },
  {
    id: '3',
    title: 'Bệnh viện đón nhận Huân chương Lao động hạng Nhất',
    excerpt: 'Ghi nhận những đóng góp xuất sắc trong công tác chăm sóc sức khỏe nhân dân...',
    image: 'https://images.unsplash.com/photo-1559523161-0fc0d8b38a7a?auto=format&fit=crop&q=80&w=600',
    date: '08/01/2025',
    category: 'Thành tựu',
    isHot: false,
  },
  {
    id: '4',
    title: 'Ứng dụng AI trong chẩn đoán hình ảnh y khoa',
    excerpt: 'Triển khai hệ thống AI hỗ trợ phân tích hình ảnh X-quang và CT...',
    image: 'https://images.unsplash.com/photo-1584982751601-97dcc096659c?auto=format&fit=crop&q=80&w=600',
    date: '05/01/2025',
    category: 'Công nghệ',
    isHot: true,
  },
  {
    id: '5',
    title: 'Chuyên gia Nhật Bản chia sẻ kinh nghiệm phẫu thuật nội soi',
    excerpt: 'Chương trình đào tạo và chuyển giao công nghệ từ đối tác Nhật Bản...',
    image: 'https://images.unsplash.com/photo-1551076805-e1869033e561?auto=format&fit=crop&q=80&w=600',
    date: '02/01/2025',
    category: 'Đào tạo',
    isHot: false,
  },
  {
    id: '6',
    title: 'Mở rộng dịch vụ khám bệnh từ xa Telehealth',
    excerpt: 'Nâng cấp hệ thống Telehealth phục vụ bệnh nhân trên toàn quốc...',
    image: 'https://images.unsplash.com/photo-1576089073624-b5751a8f4de9?auto=format&fit=crop&q=80&w=600',
    date: '28/12/2024',
    category: 'Dịch vụ',
    isHot: false,
  },
];

// Side news
const sideNews = [
  { id: 's1', title: 'Lịch nghỉ Tết Nguyên đán 2025', date: '20/01/2025' },
  { id: 's2', title: 'Thông báo tuyển dụng bác sĩ nội trú', date: '18/01/2025' },
  { id: 's3', title: 'Kết quả khám sức khỏe định kỳ 2024', date: '15/01/2025' },
  { id: 's4', title: 'Hướng dẫn đặt lịch khám online', date: '10/01/2025' },
];

export default function NewsPage() {
  const [tickerIndex, setTickerIndex] = useState(0);

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      <PublicNavbar />

      {/* Breaking News Ticker */}
      <div className="bg-cyan-700 text-white">
        <div className="container mx-auto flex items-center px-4 py-2">
          <span className="mr-4 flex items-center gap-2 rounded bg-red-500 px-3 py-1 text-xs font-bold uppercase tracking-wider">
            <Bell className="h-3 w-3" />
            Tin mới
          </span>
          <div className="flex-1 overflow-hidden">
            <motion.div
              key={tickerIndex}
              initial={{ x: 50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -50, opacity: 0 }}
              className="text-sm font-medium"
            >
              {breakingNews[tickerIndex % breakingNews.length]}
            </motion.div>
          </div>
          <div className="flex gap-1 ml-4">
            {breakingNews.map((_, i) => (
              <button
                key={i}
                onClick={() => setTickerIndex(i)}
                className={`h-2 w-2 rounded-full transition-colors ${i === tickerIndex % breakingNews.length ? 'bg-white' : 'bg-white/40'
                  }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-cyan-900 py-20 lg:py-28">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(6,182,212,0.15),transparent_50%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(20,184,166,0.15),transparent_50%)]" />
        </div>

        <div className="container relative z-10 mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <span className="mb-4 inline-block rounded-full bg-cyan-500/20 px-4 py-1.5 text-sm font-medium text-cyan-300 backdrop-blur-sm">
              Tin tức & Sự kiện
            </span>
            <h1 className="mb-6 text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
              Cập nhật tin tức <br />
              <span className="text-cyan-400">mới nhất</span>
            </h1>
            <p className="mx-auto max-w-2xl text-lg text-slate-300">
              Thông tin hoạt động, sự kiện và những thành tựu mới nhất của bệnh viện
            </p>
          </motion.div>
        </div>
      </section>

      <main className="container mx-auto px-4 py-12">
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-12">
            {/* Featured News */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="group relative cursor-pointer overflow-hidden rounded-3xl shadow-2xl">
                <div className="relative aspect-[16/9]">
                  <Image
                    src={featuredNews.image}
                    alt={featuredNews.title}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

                  {/* Video Play Button */}
                  {featuredNews.isVideo && (
                    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white/90 shadow-2xl backdrop-blur-sm transition-transform group-hover:scale-110">
                        <Play className="h-8 w-8 text-cyan-600 fill-cyan-600 ml-1" />
                      </div>
                    </div>
                  )}

                  <div className="absolute bottom-0 left-0 right-0 p-8">
                    <div className="flex items-center gap-3 mb-4">
                      <span className="rounded-full bg-cyan-500 px-3 py-1 text-xs font-bold text-white">
                        {featuredNews.category}
                      </span>
                      <span className="text-sm text-white/80">
                        <Calendar className="inline h-4 w-4 mr-1" />
                        {featuredNews.date}
                      </span>
                    </div>
                    <h2 className="text-2xl font-bold text-white lg:text-3xl group-hover:text-cyan-300 transition-colors">
                      {featuredNews.title}
                    </h2>
                    <p className="mt-3 text-slate-200 line-clamp-2 lg:text-lg">
                      {featuredNews.excerpt}
                    </p>
                    <div className="mt-4 inline-flex items-center text-cyan-400 font-medium group-hover:text-cyan-300">
                      Đọc chi tiết
                      <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </div>
                  </div>
                </div>
              </div>
            </motion.section>

            {/* News Grid */}
            <section>
              <div className="mb-6 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-slate-900">Tin tức gần đây</h2>
                <Button variant="ghost" className="text-cyan-600 hover:text-cyan-700">
                  Xem tất cả
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <AnimatePresence>
                  {newsItems.map((news, index) => (
                    <motion.article
                      key={news.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="group cursor-pointer overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl"
                    >
                      <div className="relative h-48 overflow-hidden">
                        <Image
                          src={news.image}
                          alt={news.title}
                          fill
                          className="object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                        {news.isHot && (
                          <div className="absolute top-4 left-4">
                            <span className="flex items-center gap-1 rounded-full bg-red-500 px-2.5 py-1 text-xs font-bold text-white">
                              <TrendingUp className="h-3 w-3" />
                              Hot
                            </span>
                          </div>
                        )}
                        <div className="absolute bottom-4 left-4">
                          <span className="rounded-full bg-white/90 px-3 py-1 text-xs font-medium text-slate-700 backdrop-blur-sm">
                            {news.category}
                          </span>
                        </div>
                      </div>
                      <div className="p-5">
                        <h3 className="mb-2 text-lg font-bold text-slate-900 line-clamp-2 group-hover:text-cyan-600 transition-colors">
                          {news.title}
                        </h3>
                        <p className="mb-4 text-sm text-slate-600 line-clamp-2">
                          {news.excerpt}
                        </p>
                        <div className="flex items-center text-xs text-slate-500">
                          <Calendar className="mr-1 h-3.5 w-3.5" />
                          {news.date}
                        </div>
                      </div>
                    </motion.article>
                  ))}
                </AnimatePresence>
              </div>

              {/* Load More */}
              <div className="mt-10 text-center">
                <Button variant="outline" size="lg" className="px-8">
                  Xem thêm tin tức
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </section>
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            {/* Notifications */}
            <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
              <h3 className="mb-4 flex items-center text-lg font-bold text-slate-900">
                <Bell className="mr-2 h-5 w-5 text-cyan-600" />
                Thông báo
              </h3>
              <div className="space-y-4">
                {sideNews.map((item) => (
                  <Link
                    key={item.id}
                    href="#"
                    className="group block border-b border-slate-100 pb-4 last:border-0 last:pb-0"
                  >
                    <h4 className="font-medium text-slate-900 line-clamp-2 group-hover:text-cyan-600 transition-colors">
                      {item.title}
                    </h4>
                    <p className="mt-1 text-xs text-slate-500">{item.date}</p>
                  </Link>
                ))}
              </div>
              <Button variant="ghost" className="mt-4 w-full text-cyan-600">
                Xem tất cả thông báo
              </Button>
            </div>

            {/* Quick Links */}
            <div className="rounded-2xl bg-gradient-to-br from-cyan-600 to-teal-600 p-6 text-white">
              <h3 className="mb-4 text-lg font-bold">Liên kết nhanh</h3>
              <div className="space-y-3">
                {[
                  { label: 'Đặt lịch khám', href: '/patient/appointments/book' },
                  { label: 'Tra cứu kết quả', href: '#' },
                  { label: 'Bảng giá dịch vụ', href: '/pricing' },
                  { label: 'Liên hệ tư vấn', href: '/contact' },
                ].map((link) => (
                  <Link
                    key={link.label}
                    href={link.href}
                    className="flex items-center justify-between rounded-xl bg-white/10 px-4 py-3 text-sm font-medium backdrop-blur-sm transition-colors hover:bg-white/20"
                  >
                    {link.label}
                    <ExternalLink className="h-4 w-4" />
                  </Link>
                ))}
              </div>
            </div>

            {/* Newsletter */}
            <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
              <h3 className="mb-2 text-lg font-bold text-slate-900">Đăng ký nhận tin</h3>
              <p className="mb-4 text-sm text-slate-600">
                Nhận thông tin mới nhất qua email
              </p>
              <div className="space-y-3">
                <input
                  type="email"
                  placeholder="Email của bạn"
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
                />
                <Button className="w-full bg-cyan-600 hover:bg-cyan-700">
                  Đăng ký
                </Button>
              </div>
            </div>
          </div>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
