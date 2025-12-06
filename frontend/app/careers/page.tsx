'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import {
  Briefcase, MapPin, Clock, Users, Heart,
  Award, TrendingUp, ChevronRight, Send,
  Building2, GraduationCap, Coffee, Dumbbell,
  Plane, Baby, HeartPulse, Check, ArrowRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PublicNavbar } from '@/components/layout/PublicNavbar';
import { PublicFooter } from '@/components/layout/PublicFooter';

// Company stats
const stats = [
  { value: '500+', label: 'Nhân viên', icon: Users },
  { value: '15+', label: 'Năm hoạt động', icon: Building2 },
  { value: '50+', label: 'Giải thưởng', icon: Award },
  { value: '95%', label: 'Nhân viên hài lòng', icon: Heart },
];

// Benefits
const benefits = [
  {
    icon: HeartPulse,
    title: 'Bảo hiểm toàn diện',
    description: 'Bảo hiểm sức khỏe cao cấp cho bản thân và gia đình',
  },
  {
    icon: GraduationCap,
    title: 'Đào tạo & Phát triển',
    description: 'Cơ hội học hỏi liên tục với các chương trình đào tạo chuyên sâu',
  },
  {
    icon: TrendingUp,
    title: 'Thăng tiến rõ ràng',
    description: 'Lộ trình công danh minh bạch với đánh giá công bằng',
  },
  {
    icon: Coffee,
    title: 'Môi trường thân thiện',
    description: 'Văn phòng hiện đại, không gian làm việc thoải mái',
  },
  {
    icon: Plane,
    title: 'Nghỉ phép linh hoạt',
    description: '20+ ngày phép năm và chính sách nghỉ linh hoạt',
  },
  {
    icon: Baby,
    title: 'Hỗ trợ gia đình',
    description: 'Chế độ thai sản và hỗ trợ nuôi con nhỏ hấp dẫn',
  },
];

// Job categories
const jobCategories = [
  { id: 'all', name: 'Tất cả', count: 12 },
  { id: 'doctor', name: 'Bác sĩ', count: 5 },
  { id: 'nurse', name: 'Điều dưỡng', count: 4 },
  { id: 'tech', name: 'Kỹ thuật viên', count: 2 },
  { id: 'admin', name: 'Hành chính', count: 1 },
];

// Job listings
const jobListings = [
  {
    id: '1',
    title: 'Bác sĩ Chuyên khoa Tim mạch',
    department: 'Khoa Tim mạch',
    location: 'TP. Hồ Chí Minh',
    type: 'Full-time',
    salary: 'Thỏa thuận',
    experience: '5+ năm',
    posted: '2 ngày trước',
    isHot: true,
    isUrgent: true,
    description: 'Tìm kiếm bác sĩ chuyên khoa tim mạch có kinh nghiệm, đam mê và tận tụy với nghề nghiệp.',
    requirements: ['Bằng chuyên khoa II Tim mạch', 'Kinh nghiệm 5+ năm', 'Kỹ năng giao tiếp tốt'],
    category: 'doctor',
  },
  {
    id: '2',
    title: 'Điều dưỡng Phòng mổ',
    department: 'Khoa Phẫu thuật',
    location: 'TP. Hồ Chí Minh',
    type: 'Full-time',
    salary: '15-25 triệu',
    experience: '2+ năm',
    posted: '3 ngày trước',
    isHot: true,
    isUrgent: false,
    description: 'Cần tuyển điều dưỡng phòng mổ có kinh nghiệm, chịu áp lực cao.',
    requirements: ['Bằng Điều dưỡng', 'Kinh nghiệm OR 2+ năm', 'Có chứng chỉ hành nghề'],
    category: 'nurse',
  },
  {
    id: '3',
    title: 'Kỹ thuật viên X-quang',
    department: 'Khoa Chẩn đoán hình ảnh',
    location: 'TP. Hồ Chí Minh',
    type: 'Full-time',
    salary: '12-18 triệu',
    experience: '1+ năm',
    posted: '5 ngày trước',
    isHot: false,
    isUrgent: false,
    description: 'Tuyển kỹ thuật viên X-quang có chứng chỉ hành nghề, nhiệt tình và trách nhiệm.',
    requirements: ['Bằng Kỹ thuật hình ảnh', 'Có chứng chỉ hành nghề', 'Sử dụng thành thạo máy X-quang'],
    category: 'tech',
  },
  {
    id: '4',
    title: 'Bác sĩ Nhi khoa',
    department: 'Khoa Nhi',
    location: 'TP. Hồ Chí Minh',
    type: 'Full-time',
    salary: 'Thỏa thuận',
    experience: '3+ năm',
    posted: '1 tuần trước',
    isHot: true,
    isUrgent: false,
    description: 'Tìm kiếm bác sĩ Nhi khoa yêu trẻ, tận tâm với công việc.',
    requirements: ['Bằng Bác sĩ Đa khoa / CK1 Nhi', 'Kinh nghiệm 3+ năm', 'Yêu thích trẻ em'],
    category: 'doctor',
  },
  {
    id: '5',
    title: 'Điều dưỡng Khoa Nội',
    department: 'Khoa Nội Tổng quát',
    location: 'TP. Hồ Chí Minh',
    type: 'Full-time',
    salary: '10-15 triệu',
    experience: 'Fresher OK',
    posted: '1 tuần trước',
    isHot: false,
    isUrgent: false,
    description: 'Cơ hội cho điều dưỡng mới ra trường, được đào tạo bài bản.',
    requirements: ['Bằng Điều dưỡng', 'Có thể làm ca', 'Nhiệt tình, cầu tiến'],
    category: 'nurse',
  },
];

export default function CareersPage() {
  const [activeCategory, setActiveCategory] = useState('all');
  const [expandedJob, setExpandedJob] = useState<string | null>(null);

  const filteredJobs = activeCategory === 'all'
    ? jobListings
    : jobListings.filter(job => job.category === activeCategory);

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      <PublicNavbar />

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-cyan-700 via-cyan-800 to-teal-900 pt-32 pb-24">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1631217868264-e5b90bb7e133?auto=format&fit=crop&q=80&w=2000')] bg-cover bg-center opacity-10" />
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-800/90 to-transparent" />
        </div>

        <div className="container relative z-10 mx-auto px-4">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              <span className="mb-4 inline-block rounded-full bg-cyan-500/20 px-4 py-1.5 text-sm font-medium text-cyan-200 backdrop-blur-sm">
                Gia nhập đội ngũ chuyên nghiệp
              </span>
              <h1 className="mb-6 text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
                Xây dựng sự nghiệp <br />
                <span className="text-cyan-300">cùng chúng tôi</span>
              </h1>
              <p className="mb-8 text-lg text-cyan-100 leading-relaxed">
                Tham gia đội ngũ y tế hàng đầu, nơi bạn không chỉ làm việc mà còn được phát triển
                và đóng góp cho sứ mệnh chăm sóc sức khỏe cộng đồng.
              </p>
              <div className="flex flex-wrap gap-4">
                <Button size="lg" className="bg-white text-cyan-700 hover:bg-cyan-50">
                  Xem vị trí tuyển dụng
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
                  Tìm hiểu về chúng tôi
                </Button>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="hidden lg:block"
            >
              <div className="relative h-[400px] w-full overflow-hidden rounded-3xl shadow-2xl">
                <Image
                  src="https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&q=80&w=800"
                  alt="Medical Team"
                  fill
                  className="object-cover"
                />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="relative z-10 -mt-12">
        <div className="container mx-auto px-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="group rounded-2xl border border-slate-100 bg-white p-6 shadow-lg transition-all hover:-translate-y-1 hover:shadow-xl"
              >
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-100 text-cyan-600 transition-colors group-hover:bg-cyan-600 group-hover:text-white">
                  <stat.icon className="h-6 w-6" />
                </div>
                <div className="text-3xl font-bold text-slate-900">{stat.value}</div>
                <div className="text-slate-600">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Join Us */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold text-slate-900 sm:text-4xl">
              Tại sao nên gia nhập chúng tôi?
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-600">
              Chúng tôi cam kết mang đến môi trường làm việc tốt nhất và phúc lợi hấp dẫn cho nhân viên
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {benefits.map((benefit, index) => (
              <motion.div
                key={benefit.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="group rounded-2xl border border-slate-100 bg-white p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg hover:border-cyan-200"
              >
                <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-50 text-cyan-600 transition-colors group-hover:bg-cyan-600 group-hover:text-white">
                  <benefit.icon className="h-7 w-7" />
                </div>
                <h3 className="mb-2 text-xl font-bold text-slate-900">{benefit.title}</h3>
                <p className="text-slate-600">{benefit.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Job Listings */}
      <section className="bg-white py-20">
        <div className="container mx-auto px-4">
          <div className="mb-8 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-3xl font-bold text-slate-900">Vị trí đang tuyển</h2>
              <p className="mt-2 text-slate-600">{filteredJobs.length} vị trí phù hợp</p>
            </div>

            {/* Category Filter */}
            <div className="flex flex-wrap gap-2">
              {jobCategories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setActiveCategory(category.id)}
                  className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${activeCategory === category.id
                      ? 'bg-cyan-600 text-white shadow-md'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                >
                  {category.name} ({category.count})
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <AnimatePresence mode="wait">
              {filteredJobs.map((job, index) => (
                <motion.div
                  key={job.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: index * 0.05 }}
                  className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm transition-all hover:border-cyan-200 hover:shadow-md"
                >
                  <div
                    className="cursor-pointer p-6"
                    onClick={() => setExpandedJob(expandedJob === job.id ? null : job.id)}
                  >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                      <div className="flex-1">
                        <div className="mb-2 flex flex-wrap items-center gap-2">
                          {job.isHot && (
                            <span className="rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-bold text-red-600">
                              HOT
                            </span>
                          )}
                          {job.isUrgent && (
                            <span className="rounded-full bg-orange-100 px-2.5 py-0.5 text-xs font-bold text-orange-600">
                              Gấp
                            </span>
                          )}
                        </div>
                        <h3 className="text-xl font-bold text-slate-900">{job.title}</h3>
                        <p className="mt-1 text-slate-600">{job.department}</p>

                        <div className="mt-4 flex flex-wrap gap-4 text-sm text-slate-500">
                          <span className="flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            {job.location}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {job.type}
                          </span>
                          <span className="flex items-center gap-1">
                            <Briefcase className="h-4 w-4" />
                            {job.experience}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="text-lg font-bold text-cyan-600">{job.salary}</div>
                          <div className="text-xs text-slate-500">{job.posted}</div>
                        </div>
                        <ChevronRight className={`h-5 w-5 text-slate-400 transition-transform ${expandedJob === job.id ? 'rotate-90' : ''}`} />
                      </div>
                    </div>
                  </div>

                  {/* Expanded Content */}
                  <AnimatePresence>
                    {expandedJob === job.id && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="border-t border-slate-100"
                      >
                        <div className="p-6">
                          <p className="mb-4 text-slate-600">{job.description}</p>

                          <h4 className="mb-3 font-semibold text-slate-900">Yêu cầu:</h4>
                          <ul className="mb-6 space-y-2">
                            {job.requirements.map((req, i) => (
                              <li key={i} className="flex items-start gap-2 text-slate-600">
                                <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-cyan-600" />
                                {req}
                              </li>
                            ))}
                          </ul>

                          <div className="flex flex-col gap-3 sm:flex-row">
                            <Button className="bg-cyan-600 hover:bg-cyan-700">
                              <Send className="mr-2 h-4 w-4" />
                              Ứng tuyển ngay
                            </Button>
                            <Button variant="outline">
                              Xem chi tiết
                            </Button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      </section>

      {/* Apply CTA */}
      <section className="bg-gradient-to-r from-cyan-600 to-teal-600 py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="mb-4 text-3xl font-bold text-white">
            Không tìm thấy vị trí phù hợp?
          </h2>
          <p className="mx-auto mb-8 max-w-xl text-lg text-cyan-100">
            Gửi CV của bạn cho chúng tôi và chúng tôi sẽ liên hệ khi có vị trí phù hợp
          </p>
          <div className="mx-auto flex max-w-md flex-col gap-3 sm:flex-row">
            <Input
              placeholder="Email của bạn"
              className="h-12 flex-1 rounded-xl border-0 bg-white/90 text-slate-900 placeholder-slate-500"
            />
            <Button className="h-12 bg-white px-6 text-cyan-700 hover:bg-cyan-50">
              Gửi CV
            </Button>
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
