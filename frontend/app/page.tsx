'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Calendar, Users, Shield, Clock, Search, MapPin, ArrowRight, CheckCircle2,
  Heart, Brain, Eye, Smile, Stethoscope, Activity, Sparkles, Baby, Flower2, Ear, Bone
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { PublicNavbar } from '@/components/layout/PublicNavbar';
import { PublicFooter } from '@/components/layout/PublicFooter';
import { DoctorCard } from '@/components/landing/DoctorCard';
import { BookingModal } from '@/components/landing/BookingModal';
import { useDepartments } from '@/lib/hooks/useDepartments';
import { useFeaturedDoctors } from '@/lib/hooks/useDoctors';
import doctorsData from '@/data/doctors.json';
import specialtiesData from '@/data/specialties.json';

// Icon mapping
const iconMap: Record<string, any> = {
  // Standard codes
  CARD: Heart,       // Tim mạch
  PEDI: Baby,        // Nhi khoa
  DERM: Sparkles,    // Da liễu
  ORTH: Bone,        // Cơ xương khớp
  DENT: Smile,       // Nha khoa
  OPHT: Eye,         // Mắt
  ENT: Ear,          // Tai Mũi Họng
  OBGY: Flower2,     // Sản phụ khoa
  NEUR: Brain,       // Thần kinh
  GENE: Stethoscope, // Đa khoa
  EMER: Activity,    // Cấp cứu
  // Fallbacks for IDs if codes aren't used
  general: Stethoscope,
  pediatrics: Baby,
  dermatology: Sparkles,
  cardiology: Heart,
  orthopedics: Bone,
  dental: Smile,
  ophthalmology: Eye,
  ent: Ear,
  gynecology: Flower2,
  neurology: Brain,
};

export default function LandingPage() {
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState<any>(null);
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>('');

  const { data: apiDoctors, isLoading: isLoadingDoctors } = useFeaturedDoctors();
  const { data: departments, isLoading: isLoadingDepartments } = useDepartments();

  // Use API data if available, otherwise fallback to local JSON
  // If loading, create an array of nulls to render skeletons
  const displayDoctors = isLoadingDoctors
    ? Array(3).fill(null)
    : (apiDoctors && apiDoctors.length > 0 ? apiDoctors : doctorsData)
      .filter((d: any) => !selectedSpecialty || d.specialtyId === selectedSpecialty)
      .slice(0, 3);

  // Prepare specialties to display (API or local fallback)
  const displaySpecialties = isLoadingDepartments
    ? Array(8).fill(null) // Skeletons
    : (departments && departments.length > 0
      ? departments.map(d => ({
        id: d.id,
        code: d.code,
        name: d.nameVi,
        count: d.doctorCount || Math.floor(Math.random() * 20) + 5, // Mock count if missing
        icon: iconMap[d.code] || iconMap[d.code?.substring(0, 4).toUpperCase()] || Activity
      }))
      : specialtiesData.slice(0, 8).map(s => ({
        ...s,
        code: s.id,
        icon: iconMap[s.id] || Activity
      }))
    );

  const handleBookDoctor = (doctor: any) => {
    setSelectedDoctor(doctor);
    setIsBookingModalOpen(true);
  };

  const handleQuickBook = () => {
    setSelectedDoctor(null);
    setIsBookingModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-white font-sans text-slate-900 selection:bg-primary/20">
      <PublicNavbar />

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-32 pb-20 lg:pt-40 lg:pb-32">
        {/* Background Elements */}
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-100 via-white to-white" />
        <div className="absolute -top-24 -right-24 h-96 w-96 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute top-1/2 -left-24 h-96 w-96 rounded-full bg-blue-100/50 blur-3xl" />

        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-5xl text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <span className="inline-flex items-center rounded-full border border-blue-100 bg-blue-50 px-4 py-1.5 text-sm font-medium text-primary">
                <span className="mr-2 h-2 w-2 rounded-full bg-primary animate-pulse" />
                Hệ thống y tế thông minh 4.0
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="mt-8 text-5xl font-bold tracking-tight text-slate-900 sm:text-6xl lg:text-7xl"
            >
              Chăm sóc sức khỏe <br />
              <span className="text-primary">Toàn diện & Hiện đại</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="mx-auto mt-6 max-w-2xl text-lg text-slate-600"
            >
              Kết nối với các bác sĩ hàng đầu, đặt lịch khám nhanh chóng và quản lý hồ sơ sức khỏe
              của bạn một cách dễ dàng.
            </motion.p>

            {/* Search Box */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="mx-auto mt-10 max-w-4xl"
            >
              <div className="relative rounded-2xl border border-white/20 bg-white/80 p-2 shadow-2xl backdrop-blur-xl ring-1 ring-black/5">
                <div className="flex flex-col gap-2 md:flex-row">
                  <div className="relative flex-1">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                      <Search className="h-5 w-5 text-slate-400" />
                    </div>
                    <input
                      type="text"
                      placeholder="Tìm bác sĩ, chuyên khoa..."
                      className="block w-full rounded-xl border-0 bg-transparent py-4 pl-11 pr-4 text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6"
                    />
                  </div>
                  <div className="relative flex-1 border-t md:border-l md:border-t-0 border-slate-100">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                      <MapPin className="h-5 w-5 text-slate-400" />
                    </div>
                    <input
                      type="text"
                      placeholder="Địa điểm, thành phố..."
                      className="block w-full rounded-xl border-0 bg-transparent py-4 pl-11 pr-4 text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6"
                    />
                  </div>
                  <Button
                    onClick={handleQuickBook}
                    size="lg"
                    className="h-auto rounded-xl bg-primary px-8 py-4 text-base font-semibold shadow-lg shadow-primary/25 hover:bg-primary-600"
                  >
                    Đặt lịch ngay
                  </Button>
                </div>
              </div>
            </motion.div>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="mt-12 flex flex-wrap justify-center gap-8 text-center sm:gap-16"
            >
              {[
                { label: 'Bác sĩ chuyên khoa', value: '500+' },
                { label: 'Lượt khám mỗi tháng', value: '10k+' },
                { label: 'Hài lòng tuyệt đối', value: '98%' },
              ].map((stat) => (
                <div key={stat.label} className="flex flex-col items-center">
                  <dt className="text-3xl font-bold text-slate-900">{stat.value}</dt>
                  <dd className="text-sm font-medium text-slate-500">{stat.label}</dd>
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* Specialties Section - Redesigned "Floating Islands" */}
      <section className="py-24 bg-slate-50 relative overflow-hidden">
        {/* Decorative background blobs */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-64 h-64 bg-blue-200/20 rounded-full blur-3xl mix-blend-multiply animate-blob" />
          <div className="absolute top-20 right-10 w-64 h-64 bg-purple-200/20 rounded-full blur-3xl mix-blend-multiply animate-blob animation-delay-2000" />
          <div className="absolute -bottom-32 left-1/2 w-64 h-64 bg-pink-200/20 rounded-full blur-3xl mix-blend-multiply animate-blob animation-delay-4000" />
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="mb-16 text-center">
            <motion.span
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-primary font-semibold tracking-wider uppercase text-sm"
            >
              Danh mục khám
            </motion.span>
            <motion.h2
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl"
            >
              Chuyên khoa phổ biến
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="mt-4 max-w-2xl mx-auto text-lg text-slate-600"
            >
              Hệ thống y tế đa khoa với đầy đủ các trang thiết bị hiện đại nhất
            </motion.p>
          </div>

          <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-4">
            {displaySpecialties.map((specialty: any, index: number) => {
              if (!specialty) {
                return (
                  <div key={`skeleton-${index}`} className="h-48 rounded-3xl bg-white p-6 shadow-sm">
                    <Skeleton className="h-12 w-12 rounded-xl" />
                    <Skeleton className="mt-4 h-6 w-3/4" />
                    <Skeleton className="mt-2 h-4 w-1/2" />
                  </div>
                );
              }

              const Icon = specialty.icon;

              return (
                <motion.button
                  key={specialty.id || index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ y: -8, scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSelectedSpecialty(specialty.code)}
                  className={`group relative flex h-full flex-col items-start justify-between overflow-hidden rounded-3xl bg-white p-8 text-left shadow-sm transition-all hover:shadow-xl hover:shadow-primary/10 ${selectedSpecialty === specialty.code ? 'ring-2 ring-primary' : ''
                    }`}
                >
                  {/* Hover Gradient Background */}
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-primary/0 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

                  <div className="relative z-10">
                    <div className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-50 text-primary transition-colors duration-300 group-hover:bg-primary group-hover:text-white shadow-sm group-hover:shadow-md">
                      <Icon className="h-7 w-7" />
                    </div>

                    <h3 className="text-xl font-bold text-slate-900 group-hover:text-primary transition-colors">
                      {specialty.name}
                    </h3>
                    <p className="mt-2 text-sm font-medium text-slate-500 group-hover:text-slate-600">
                      {specialty.count} bác sĩ
                    </p>
                  </div>

                  <div className="relative z-10 mt-6 flex w-full items-center justify-between border-t border-slate-100 pt-4 opacity-0 transition-all duration-300 group-hover:opacity-100">
                    <span className="text-sm font-semibold text-primary">Xem chi tiết</span>
                    <ArrowRight className="h-4 w-4 text-primary transition-transform group-hover:translate-x-1" />
                  </div>
                </motion.button>
              );
            })}
          </div>

          <div className="mt-16 text-center">
            <Button variant="outline" size="lg" className="rounded-full px-8 border-slate-200 hover:bg-slate-50 hover:text-primary" onClick={() => setSelectedSpecialty('')}>
              Xem tất cả chuyên khoa
            </Button>
          </div>
        </div>
      </section>

      {/* Featured Doctors */}
      <section className="bg-white py-24">
        <div className="container mx-auto px-4">
          <div className="mb-12 flex items-end justify-between">
            <div>
              <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                Bác sĩ nổi bật
              </h2>
              <p className="mt-2 text-lg text-slate-600">
                Đội ngũ bác sĩ giàu kinh nghiệm, tận tâm với nghề
              </p>
            </div>
            <Button variant="outline" className="hidden sm:flex">
              Xem danh sách bác sĩ <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {displayDoctors.map((doctor: any, index: number) => (
              doctor ? (
                <DoctorCard
                  key={doctor.id}
                  doctor={doctor}
                  onBookClick={handleBookDoctor}
                />
              ) : (
                <div key={`skeleton-${index}`} className="rounded-2xl border bg-white p-6 shadow-sm">
                  <div className="flex gap-4">
                    <Skeleton className="h-20 w-20 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-5 w-3/4" />
                      <Skeleton className="h-4 w-1/2" />
                      <Skeleton className="h-4 w-1/4" />
                    </div>
                  </div>
                  <div className="mt-6 space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                  </div>
                  <div className="mt-6">
                    <Skeleton className="h-10 w-full rounded-full" />
                  </div>
                </div>
              )
            ))}
          </div>

          <div className="mt-8 text-center sm:hidden">
            <Button variant="outline" className="w-full">
              Xem danh sách bác sĩ
            </Button>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24 bg-slate-900 text-white">
        <div className="container mx-auto px-4">
          <div className="grid gap-12 lg:grid-cols-3">
            <div className="lg:col-span-1">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Tại sao chọn Hospital V2?
              </h2>
              <p className="mt-4 text-lg text-slate-300">
                Chúng tôi cam kết mang đến trải nghiệm chăm sóc sức khỏe tốt nhất với công nghệ hiện đại
                và quy trình tối ưu.
              </p>
              <div className="mt-8 flex flex-col gap-4">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-6 w-6 text-primary-400" />
                  <span className="text-slate-200">Đặt lịch 24/7, không cần chờ đợi</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-6 w-6 text-primary-400" />
                  <span className="text-slate-200">Hồ sơ bệnh án điện tử bảo mật</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-6 w-6 text-primary-400" />
                  <span className="text-slate-200">Thanh toán không tiền mặt tiện lợi</span>
                </div>
              </div>
            </div>
            <div className="grid gap-8 sm:grid-cols-2 lg:col-span-2">
              {features.map((feature) => (
                <div
                  key={feature.title}
                  className="rounded-2xl bg-white/5 p-8 backdrop-blur-sm transition-colors hover:bg-white/10"
                >
                  <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/20 text-primary-400">
                    {feature.icon}
                  </div>
                  <h3 className="mb-2 text-xl font-semibold text-white">{feature.title}</h3>
                  <p className="text-slate-400">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative overflow-hidden py-24">
        <div className="absolute inset-0 -z-10 bg-primary/5" />
        <div className="container mx-auto px-4 text-center">
          <h2 className="mx-auto max-w-2xl text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Sẵn sàng trải nghiệm dịch vụ y tế tốt nhất?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-slate-600">
            Đăng ký ngay hôm nay để nhận được sự chăm sóc tận tình từ đội ngũ y bác sĩ của chúng tôi.
          </p>
          <div className="mt-10 flex justify-center gap-4">
            <Button size="lg" className="rounded-full px-8 shadow-lg shadow-primary/25" onClick={handleQuickBook}>
              Đặt lịch khám ngay
            </Button>
            <Button size="lg" variant="outline" className="rounded-full px-8">
              Tư vấn trực tuyến
            </Button>
          </div>
        </div>
      </section>

      <PublicFooter />

      <BookingModal
        isOpen={isBookingModalOpen}
        onClose={() => {
          setIsBookingModalOpen(false);
          setSelectedDoctor(null);
        }}
        selectedDoctor={selectedDoctor}
      />
    </div>
  );
}

const features = [
  {
    icon: <Clock className="h-6 w-6" />,
    title: 'Tiết kiệm thời gian',
    description: 'Quy trình đặt lịch và khám bệnh được tối ưu hóa để bạn không phải chờ đợi.',
  },
  {
    icon: <Users className="h-6 w-6" />,
    title: 'Đội ngũ chuyên gia',
    description: 'Hợp tác với các bác sĩ đầu ngành từ các bệnh viện lớn trên cả nước.',
  },
  {
    icon: <Shield className="h-6 w-6" />,
    title: 'An toàn & Bảo mật',
    description: 'Tuân thủ các tiêu chuẩn bảo mật y tế quốc tế (HIPAA) để bảo vệ dữ liệu của bạn.',
  },
  {
    icon: <Calendar className="h-6 w-6" />,
    title: 'Linh hoạt & Tiện lợi',
    description: 'Dễ dàng thay đổi lịch hẹn và nhận nhắc nhở tự động qua tin nhắn.',
  },
];
