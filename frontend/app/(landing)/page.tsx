'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Users, Shield, Clock, Search, MapPin, Stethoscope } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PublicNavbar } from '@/components/layout/PublicNavbar';
import { PublicFooter } from '@/components/layout/PublicFooter';
import { DoctorCard } from '@/components/landing/DoctorCard';
import { BookingModal } from '@/components/landing/BookingModal';
import { getDepartments, type Department } from '@/lib/api/departments.service';
import { searchStaff, type Staff } from '@/lib/api/staff.service';

export default function LandingPage() {
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState<any>(null);
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>('');
  const [departments, setDepartments] = useState<Department[]>([]);
  const [featuredDoctors, setFeaturedDoctors] = useState<Staff[]>([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const deptList = await getDepartments();
        setDepartments(deptList);
      } catch (e) {
        console.error('Load departments failed', e);
      }
      try {
        const res = await searchStaff({
          staffType: 'doctor',
          status: 'active',
          isActive: true,
          page: 1,
          limit: 9,
        });
        setFeaturedDoctors(res?.data?.items || []);
      } catch (e) {
        console.error('Load doctors failed', e);
        setFeaturedDoctors([]);
      }
    };
    loadData();
  }, []);

  const filteredDoctors = featuredDoctors
    .filter((d) => {
      if (!selectedSpecialty) return true;
      const spec = d.specializations?.[0]?.code || d.professionalInfo?.department || '';
      return spec.toUpperCase().includes(selectedSpecialty.toUpperCase());
    })
    .slice(0, 6);

  const handleBookDoctor = (doctor: any) => {
    setSelectedDoctor(doctor);
    setIsBookingModalOpen(true);
  };

  const handleQuickBook = () => {
    setSelectedDoctor(null);
    setIsBookingModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      <PublicNavbar />

      {/* Hero Section */}
      <section className="from-primary via-primary-600 to-primary-800 relative overflow-hidden bg-gradient-to-br py-20 text-white">
        <div className="absolute inset-0 opacity-10">
          <div className="animate-blob absolute -top-20 -left-20 h-96 w-96 rounded-full bg-white mix-blend-overlay blur-3xl" />
          <div className="animation-delay-2000 animate-blob bg-accent absolute top-20 -right-20 h-96 w-96 rounded-full mix-blend-overlay blur-3xl" />
          <div className="animation-delay-4000 animate-blob bg-secondary absolute bottom-20 left-1/2 h-96 w-96 rounded-full mix-blend-overlay blur-3xl" />
        </div>

        <div className="relative container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mx-auto max-w-4xl text-center"
          >
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="mb-6 text-4xl leading-tight font-bold md:text-6xl"
            >
              Đặt lịch khám nhanh
              <br />
              <span className="from-accent-200 to-accent-400 bg-gradient-to-r bg-clip-text text-transparent">
                Chọn bác sĩ, chọn giờ, xác nhận ngay
              </span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-primary-100 mb-10 text-lg md:text-xl"
            >
              Minh bạch, hỗ trợ BHYT, bảo mật dữ liệu. Đặt lịch chỉ trong 60 giây.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="mx-auto max-w-3xl"
            >
              <div className="overflow-hidden rounded-2xl bg-white p-2 shadow-2xl">
                <div className="flex flex-col gap-2 md:flex-row">
                  <div className="relative flex-1">
                    <Stethoscope className="absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Bác sĩ, chuyên khoa, triệu chứng..."
                      className="focus:ring-primary w-full rounded-lg border-0 py-3 pr-4 pl-10 text-gray-900 placeholder-gray-500 focus:ring-2 focus:outline-none"
                    />
                  </div>
                  <div className="relative flex-1">
                    <MapPin className="absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Thành phố, khu vực..."
                      className="focus:ring-primary w-full rounded-lg border-0 py-3 pr-4 pl-10 text-gray-900 placeholder-gray-500 focus:ring-2 focus:outline-none"
                    />
                  </div>
                  <Button
                    onClick={handleQuickBook}
                    size="lg"
                    className="animate-glow-slow bg-accent hover:bg-accent-600"
                  >
                    <Search className="mr-2 h-5 w-5" />
                    Tìm lịch trống
                  </Button>
                </div>
              </div>

              {/* Quick Filters */}
              <div className="mt-6 flex flex-wrap justify-center gap-2">
                {['Khám tổng quát', 'Nhi khoa', 'Da liễu', 'Tim mạch'].map((item) => (
                  <button
                    key={item}
                    className="rounded-full border-2 border-white/30 bg-white/10 px-4 py-2 text-sm font-medium text-white backdrop-blur-sm transition-all hover:border-white/60 hover:bg-white/20"
                  >
                    {item}
                  </button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Popular Specialties */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-12 text-center"
          >
            <h2 className="mb-4 text-3xl font-bold text-gray-900 md:text-4xl">
              Chuyên khoa phổ biến
            </h2>
            <p className="text-lg text-gray-600">Tìm bác sĩ chuyên khoa phù hợp với bạn</p>
          </motion.div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
            {departments.slice(0, 10).map((specialty, index) => (
              <motion.button
                key={specialty.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ y: -4, scale: 1.05 }}
                onClick={() => setSelectedSpecialty(specialty.code)}
                className={`rounded-2xl border-2 p-6 text-center transition-all ${selectedSpecialty === specialty.id
                    ? 'border-primary bg-primary-50 shadow-lg'
                    : 'hover:border-primary/50 border-gray-200 bg-white hover:shadow-md'
                  }`}
              >
                <div className="mb-3 text-4xl">🏥</div>
                <h3 className="mb-1 font-semibold text-gray-900">{specialty.nameVi}</h3>
                <p className="text-sm text-gray-500">{specialty.nameEn}</p>
              </motion.button>
            ))}
          </div>

          {selectedSpecialty && (
            <div className="mt-6 text-center">
              <Button variant="outline" onClick={() => setSelectedSpecialty('')}>
                Xem tất cả chuyên khoa
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* Featured Doctors */}
      <section className="bg-gray-50 py-16">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-12 text-center"
          >
            <h2 className="mb-4 text-3xl font-bold text-gray-900 md:text-4xl">Bác sĩ nổi bật</h2>
            <p className="text-lg text-gray-600">
              Đội ngũ bác sĩ giàu kinh nghiệm, tận tâm với bệnh nhân
            </p>
          </motion.div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredDoctors.map((doctor, index) => (
              <motion.div
                key={doctor.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <DoctorCard
                  doctor={{
                    id: doctor.id,
                    name: doctor.personalInfo?.fullName || 'Chưa cập nhật',
                    degree: 'MD',
                    specialtyId: doctor.specializations?.[0]?.code || 'GENMED',
                    hospital: doctor.professionalInfo?.department || 'Chưa cập nhật',
                    rating: 4.8,
                    reviewCount: 0,
                    priceFrom: doctor.consultationFee || 0,
                    avatar: '/avatar-placeholder.png',
                    experience: doctor.yearsOfExperience || 0,
                    locations: [],
                  }}
                  onBookClick={handleBookDoctor}
                />
              </motion.div>
            ))}
          </div>

          <div className="mt-12 text-center">
            <Button size="lg" variant="outline">
              Xem tất cả bác sĩ
            </Button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="text-center"
              >
                <div className="bg-primary-100 text-primary mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl">
                  {feature.icon}
                </div>
                <h3 className="mb-2 text-xl font-semibold text-gray-900">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="from-primary to-primary-700 bg-gradient-to-r py-16 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="mb-4 text-3xl font-bold md:text-4xl">Sẵn sàng đặt lịch khám?</h2>
          <p className="text-primary-100 mb-8 text-lg">
            Hàng nghìn bệnh nhân đã tin tưởng. Bắt đầu ngay hôm nay!
          </p>
          <Button
            size="lg"
            onClick={handleQuickBook}
            className="animate-breathe bg-accent hover:bg-accent-600 text-white"
          >
            Đặt lịch ngay
          </Button>
        </div>
      </section>

      <PublicFooter />

      {/* Booking Modal */}
      <BookingModal
        isOpen={isBookingModalOpen}
        onClose={() => {
          setIsBookingModalOpen(false);
          setSelectedDoctor(null);
        }}
        selectedDoctor={selectedDoctor}
      />

      {/* Sticky CTA Button */}
      <motion.button
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        whileHover={{ scale: 1.1 }}
        onClick={handleQuickBook}
        className="animate-breathe bg-accent hover:bg-accent-600 focus:ring-accent/50 fixed right-6 bottom-6 z-40 rounded-full p-4 text-white shadow-2xl focus:ring-4 focus:outline-none"
        aria-label="Đặt lịch nhanh"
      >
        <Calendar className="h-6 w-6" />
      </motion.button>
    </div>
  );
}

const features = [
  {
    icon: <Clock className="h-8 w-8" />,
    title: 'Xác nhận tức thì',
    description: 'Nhận xác nhận lịch hẹn qua email và SMS ngay lập tức',
  },
  {
    icon: <Users className="h-8 w-8" />,
    title: 'Bác sĩ uy tín',
    description: 'Đội ngũ bác sĩ giàu kinh nghiệm, được kiểm chứng',
  },
  {
    icon: <Shield className="h-8 w-8" />,
    title: 'Bảo mật tuyệt đối',
    description: 'Thông tin cá nhân được mã hóa và bảo vệ an toàn',
  },
  {
    icon: <Calendar className="h-8 w-8" />,
    title: 'Giá rõ ràng',
    description: 'Không phát sinh chi phí ẩn, hỗ trợ BHYT',
  },
];
