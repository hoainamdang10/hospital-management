'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  Star, Calendar, Award, GraduationCap, Clock, MapPin,
  Phone, Mail, Heart, Share2, ChevronRight, Check,
  MessageCircle, Video, FileText, Shield, Users, ArrowLeft
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PublicNavbar } from '@/components/layout/PublicNavbar';
import { PublicFooter } from '@/components/layout/PublicFooter';

// Mock doctor data (in real app, fetch from API using params.id)
const doctorData = {
  id: '1',
  name: 'BS. CKI Nguyễn Văn An',
  title: 'Trưởng khoa Tim mạch',
  specialty: 'Chuyên khoa Tim mạch',
  avatar: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=400',
  coverImage: 'https://images.unsplash.com/photo-1631217868264-e5b90bb7e133?auto=format&fit=crop&q=80&w=1200',
  rating: 4.9,
  reviewCount: 128,
  experience: 15,
  patients: 5000,
  consultationFee: 500000,
  duration: '30 phút',
  bio: 'Bác sĩ Nguyễn Văn An là chuyên gia hàng đầu trong lĩnh vực tim mạch với hơn 15 năm kinh nghiệm. Tốt nghiệp xuất sắc từ Đại học Y Hà Nội và có bằng chuyên khoa II về Tim mạch. Bác sĩ đã điều trị thành công hàng nghìn ca bệnh tim mạch phức tạp và được bệnh nhân đánh giá cao về chuyên môn và thái độ tận tâm.',
  education: [
    { degree: 'Bác sĩ Chuyên khoa II Tim mạch', school: 'Đại học Y Hà Nội', year: '2015' },
    { degree: 'Bác sĩ Chuyên khoa I Tim mạch', school: 'Đại học Y Hà Nội', year: '2012' },
    { degree: 'Bác sĩ Đa khoa', school: 'Đại học Y Hà Nội', year: '2008' },
  ],
  expertise: ['Bệnh mạch vành', 'Rối loạn nhịp tim', 'Suy tim', 'Tăng huyết áp', 'Siêu âm tim', 'Điện tâm đồ', 'Can thiệp mạch vành'],
  awards: [
    { title: 'Thầy thuốc Ưu tú', year: '2023' },
    { title: 'Giải thưởng Nghiên cứu Y khoa', year: '2021' },
  ],
  schedule: [
    { day: 'Thứ 2', time: '08:00 - 12:00, 14:00 - 17:00' },
    { day: 'Thứ 3', time: '08:00 - 12:00' },
    { day: 'Thứ 4', time: '08:00 - 12:00, 14:00 - 17:00' },
    { day: 'Thứ 5', time: '14:00 - 17:00' },
    { day: 'Thứ 6', time: '08:00 - 12:00, 14:00 - 17:00' },
    { day: 'Thứ 7', time: '08:00 - 12:00' },
    { day: 'Chủ nhật', time: 'Nghỉ' },
  ],
  reviews: [
    { id: 1, name: 'Nguyễn Thị Hương', rating: 5, date: '10/01/2025', comment: 'Bác sĩ rất tận tâm và chuyên môn cao. Giải thích rất kỹ cho bệnh nhân hiểu.' },
    { id: 2, name: 'Trần Văn Minh', rating: 5, date: '05/01/2025', comment: 'Khám rất kỹ, tư vấn chi tiết về bệnh lý và cách điều trị. Cảm ơn bác sĩ!' },
    { id: 3, name: 'Lê Thu Hà', rating: 4, date: '28/12/2024', comment: 'Bác sĩ giỏi và nhiệt tình. Thời gian chờ hơi lâu do đông bệnh nhân.' },
  ],
};

export default function DoctorProfilePage() {
  const params = useParams();
  const [activeTab, setActiveTab] = useState('about');

  const tabs = [
    { id: 'about', label: 'Giới thiệu' },
    { id: 'reviews', label: `Đánh giá (${doctorData.reviewCount})` },
    { id: 'schedule', label: 'Lịch làm việc' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      <PublicNavbar />

      {/* Cover Image */}
      <div className="relative h-64 lg:h-80">
        <Image
          src={doctorData.coverImage}
          alt="Cover"
          fill
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent" />

        {/* Back Button */}
        <Link href="/doctors" className="absolute top-24 left-4 lg:left-8 z-10 flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-medium text-white backdrop-blur-sm hover:bg-white/20 transition-colors">
          <ArrowLeft className="h-4 w-4" />
          Quay lại
        </Link>
      </div>

      {/* Doctor Info Header */}
      <div className="container mx-auto px-4">
        <div className="relative -mt-24 mb-8 rounded-3xl border border-slate-100 bg-white p-6 shadow-lg lg:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end">
            {/* Avatar */}
            <div className="relative mx-auto lg:mx-0">
              <div className="relative h-32 w-32 overflow-hidden rounded-2xl ring-4 ring-white shadow-xl lg:h-40 lg:w-40">
                <Image src={doctorData.avatar} alt={doctorData.name} fill className="object-cover" />
              </div>
              <div className="absolute -bottom-2 -right-2 rounded-full bg-green-500 p-2 ring-4 ring-white">
                <Check className="h-4 w-4 text-white" />
              </div>
            </div>

            {/* Info */}
            <div className="flex-1 text-center lg:text-left">
              <div className="mb-2 flex flex-wrap items-center justify-center gap-2 lg:justify-start">
                <span className="rounded-full bg-cyan-100 px-3 py-1 text-xs font-medium text-cyan-700">
                  {doctorData.specialty}
                </span>
                <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-700">
                  {doctorData.title}
                </span>
              </div>
              <h1 className="mb-2 text-2xl font-bold text-slate-900 lg:text-3xl">{doctorData.name}</h1>

              <div className="mb-4 flex flex-wrap items-center justify-center gap-4 text-sm text-slate-600 lg:justify-start">
                <div className="flex items-center gap-1">
                  <Star className="h-5 w-5 fill-amber-400 text-amber-400" />
                  <span className="font-bold text-slate-900">{doctorData.rating}</span>
                  <span>({doctorData.reviewCount} đánh giá)</span>
                </div>
                <div className="flex items-center gap-1">
                  <Award className="h-4 w-4" />
                  {doctorData.experience} năm kinh nghiệm
                </div>
                <div className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  {doctorData.patients.toLocaleString()}+ bệnh nhân
                </div>
              </div>

              {/* Action Buttons - Mobile */}
              <div className="flex flex-wrap justify-center gap-2 lg:hidden">
                <Button className="flex-1 bg-cyan-600 hover:bg-cyan-700">
                  <Calendar className="mr-2 h-4 w-4" />
                  Đặt lịch
                </Button>
                <Button variant="outline" size="icon"><Heart className="h-4 w-4" /></Button>
                <Button variant="outline" size="icon"><Share2 className="h-4 w-4" /></Button>
              </div>
            </div>

            {/* CTA - Desktop */}
            <div className="hidden lg:flex flex-col gap-3 text-right">
              <div className="text-sm text-slate-600">Phí tư vấn</div>
              <div className="text-2xl font-bold text-cyan-600">{doctorData.consultationFee.toLocaleString()} VNĐ</div>
              <div className="flex gap-2">
                <Button variant="outline" size="icon"><Heart className="h-4 w-4" /></Button>
                <Button variant="outline" size="icon"><Share2 className="h-4 w-4" /></Button>
                <Button className="bg-cyan-600 hover:bg-cyan-700 px-8">
                  <Calendar className="mr-2 h-4 w-4" />
                  Đặt lịch khám
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs & Content */}
      <div className="container mx-auto px-4 pb-12">
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Tabs */}
            <div className="flex gap-2 overflow-x-auto rounded-xl bg-white p-2 shadow-sm">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 whitespace-nowrap rounded-lg px-4 py-3 text-sm font-medium transition-all ${activeTab === tab.id
                      ? 'bg-cyan-600 text-white shadow-md'
                      : 'text-slate-600 hover:bg-slate-100'
                    }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            {activeTab === 'about' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                {/* Bio */}
                <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
                  <h2 className="mb-4 text-xl font-bold text-slate-900">Giới thiệu</h2>
                  <p className="text-slate-600 leading-relaxed">{doctorData.bio}</p>
                </div>

                {/* Education */}
                <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
                  <h2 className="mb-4 flex items-center text-xl font-bold text-slate-900">
                    <GraduationCap className="mr-2 h-5 w-5 text-cyan-600" />
                    Học vấn
                  </h2>
                  <div className="space-y-4">
                    {doctorData.education.map((edu, i) => (
                      <div key={i} className="flex gap-4 border-l-4 border-cyan-500 pl-4">
                        <div className="flex-1">
                          <p className="font-semibold text-slate-900">{edu.degree}</p>
                          <p className="text-sm text-slate-600">{edu.school}</p>
                        </div>
                        <span className="text-sm text-slate-500">{edu.year}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Expertise */}
                <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
                  <h2 className="mb-4 flex items-center text-xl font-bold text-slate-900">
                    <Award className="mr-2 h-5 w-5 text-cyan-600" />
                    Chuyên môn
                  </h2>
                  <div className="flex flex-wrap gap-2">
                    {doctorData.expertise.map((exp, i) => (
                      <span key={i} className="rounded-full bg-cyan-50 px-4 py-2 text-sm font-medium text-cyan-700">
                        {exp}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Awards */}
                <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
                  <h2 className="mb-4 flex items-center text-xl font-bold text-slate-900">
                    <Shield className="mr-2 h-5 w-5 text-cyan-600" />
                    Giải thưởng & Chứng nhận
                  </h2>
                  <div className="space-y-3">
                    {doctorData.awards.map((award, i) => (
                      <div key={i} className="flex items-center gap-3 rounded-xl bg-amber-50 p-4">
                        <Award className="h-6 w-6 text-amber-600" />
                        <div className="flex-1">
                          <p className="font-medium text-slate-900">{award.title}</p>
                        </div>
                        <span className="text-sm text-slate-500">{award.year}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'reviews' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                {doctorData.reviews.map((review) => (
                  <div key={review.id} className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
                    <div className="mb-3 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-cyan-100 font-bold text-cyan-700">
                          {review.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900">{review.name}</p>
                          <p className="text-xs text-slate-500">{review.date}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        {[...Array(review.rating)].map((_, i) => (
                          <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                        ))}
                      </div>
                    </div>
                    <p className="text-slate-600">{review.comment}</p>
                  </div>
                ))}
              </motion.div>
            )}

            {activeTab === 'schedule' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
                <h2 className="mb-4 flex items-center text-xl font-bold text-slate-900">
                  <Clock className="mr-2 h-5 w-5 text-cyan-600" />
                  Lịch làm việc
                </h2>
                <div className="space-y-3">
                  {doctorData.schedule.map((s, i) => (
                    <div key={i} className={`flex items-center justify-between rounded-xl p-4 ${s.time === 'Nghỉ' ? 'bg-slate-100' : 'bg-cyan-50'}`}>
                      <span className="font-medium text-slate-900">{s.day}</span>
                      <span className={s.time === 'Nghỉ' ? 'text-slate-500' : 'text-cyan-700'}>{s.time}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Booking Card */}
            <div className="sticky top-24 rounded-2xl border border-slate-100 bg-white p-6 shadow-lg">
              <h3 className="mb-4 text-lg font-bold text-slate-900">Đặt lịch khám</h3>
              <div className="mb-4 space-y-3">
                <div className="flex items-center justify-between rounded-xl bg-slate-50 p-3">
                  <span className="text-slate-600">Phí khám</span>
                  <span className="font-bold text-cyan-600">{doctorData.consultationFee.toLocaleString()} VNĐ</span>
                </div>
                <div className="flex items-center justify-between rounded-xl bg-slate-50 p-3">
                  <span className="text-slate-600">Thời gian</span>
                  <span className="font-medium">{doctorData.duration}</span>
                </div>
              </div>

              <Link href="/patient/appointments/book" className="block">
                <Button className="w-full bg-cyan-600 hover:bg-cyan-700 h-12 text-base">
                  <Calendar className="mr-2 h-5 w-5" />
                  Đặt lịch ngay
                </Button>
              </Link>

              <div className="mt-4 flex gap-2">
                <Button variant="outline" className="flex-1">
                  <Video className="mr-2 h-4 w-4" />
                  Tư vấn online
                </Button>
                <Button variant="outline" className="flex-1">
                  <MessageCircle className="mr-2 h-4 w-4" />
                  Nhắn tin
                </Button>
              </div>

              <div className="mt-6 border-t pt-4">
                <p className="text-center text-xs text-slate-500">Miễn phí đổi lịch trước 24 giờ</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <PublicFooter />
    </div>
  );
}
