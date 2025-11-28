'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Filter, MapPin, Star, Calendar, ArrowRight, Stethoscope, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PublicNavbar } from '@/components/layout/PublicNavbar';
import { PublicFooter } from '@/components/layout/PublicFooter';
import { DoctorCard } from '@/components/landing/DoctorCard';
import { BookingModal } from '@/components/landing/BookingModal';
import { useFeaturedDoctors } from '@/lib/hooks/useDoctors';
import { useDepartments } from '@/lib/hooks/useDepartments';
import { Skeleton } from '@/components/ui/skeleton';
import doctorsData from '@/data/doctors.json';

export default function DoctorsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState('all');
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState<any>(null);

  // Fetch real data
  const { data: apiDoctors, isLoading: isLoadingDoctors } = useFeaturedDoctors();
  const { data: departments, isLoading: isLoadingDepartments } = useDepartments();

  // Combine/Filter Logic
  const allDoctors = (apiDoctors && apiDoctors.length > 0) ? apiDoctors : doctorsData;

  const filteredDoctors = allDoctors.filter((doctor: any) => {
    const matchesSearch = doctor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doctor.specialty.toLowerCase().includes(searchQuery.toLowerCase());

    // Note: API might return specialtyId or specialty name. Adjust matching logic as needed.
    // Here we assume simple string matching or ID matching if available.
    const matchesSpecialty = selectedSpecialty === 'all' ||
      doctor.specialtyId === selectedSpecialty ||
      doctor.specialty === selectedSpecialty;

    return matchesSearch && matchesSpecialty;
  });

  const handleBookDoctor = (doctor: any) => {
    setSelectedDoctor(doctor);
    setIsBookingModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-slate-900">
      <PublicNavbar />

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-slate-900 pt-32 pb-20 lg:pt-40 lg:pb-32">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&q=80&w=2000')] bg-cover bg-center opacity-20" />
          <div className="absolute inset-0 bg-gradient-to-b from-slate-900/80 via-slate-900/60 to-slate-900" />
        </div>

        <div className="container relative z-10 mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="mb-6 text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
              Đội ngũ <span className="text-primary-400">Chuyên gia</span>
            </h1>
            <p className="mx-auto max-w-2xl text-lg text-slate-300">
              Hội tụ những bác sĩ đầu ngành, giàu kinh nghiệm và tận tâm với nghề.
              Chúng tôi cam kết mang lại chất lượng điều trị tốt nhất cho bạn.
            </p>
          </motion.div>

          {/* Search Bar - Floating */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mx-auto mt-10 max-w-4xl"
          >
            <div className="flex flex-col gap-4 rounded-2xl bg-white p-4 shadow-xl md:flex-row md:items-center">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                <Input
                  placeholder="Tìm kiếm theo tên bác sĩ, chuyên khoa..."
                  className="h-12 border-0 bg-slate-50 pl-12 text-base focus-visible:ring-0"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <div className="w-full md:w-64">
                <Select value={selectedSpecialty} onValueChange={setSelectedSpecialty}>
                  <SelectTrigger className="h-12 border-0 bg-slate-50 text-base focus:ring-0">
                    <SelectValue placeholder="Chọn chuyên khoa" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả chuyên khoa</SelectItem>
                    {departments?.map((dept) => (
                      <SelectItem key={dept.id} value={dept.code || dept.id}>
                        {dept.nameVi}
                      </SelectItem>
                    ))}
                    {/* Fallback static options if API fails */}
                    {!departments && (
                      <>
                        <SelectItem value="cardiology">Tim mạch</SelectItem>
                        <SelectItem value="pediatrics">Nhi khoa</SelectItem>
                        <SelectItem value="dermatology">Da liễu</SelectItem>
                        <SelectItem value="neurology">Thần kinh</SelectItem>
                      </>
                    )}
                  </SelectContent>
                </Select>
              </div>

              <Button size="lg" className="h-12 px-8 text-base font-semibold">
                Tìm kiếm
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Results Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="mb-8 flex items-center justify-between">
            <h2 className="text-2xl font-bold text-slate-900">
              Danh sách bác sĩ ({filteredDoctors.length})
            </h2>
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <span>Sắp xếp theo:</span>
              <select className="border-none bg-transparent font-semibold text-slate-900 focus:ring-0">
                <option>Phổ biến nhất</option>
                <option>Đánh giá cao</option>
                <option>Kinh nghiệm</option>
              </select>
            </div>
          </div>

          {isLoadingDoctors ? (
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="rounded-2xl border bg-white p-6 shadow-sm">
                  <div className="flex gap-4">
                    <Skeleton className="h-20 w-20 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-5 w-3/4" />
                      <Skeleton className="h-4 w-1/2" />
                    </div>
                  </div>
                  <div className="mt-6 space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredDoctors.length > 0 ? (
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              <AnimatePresence>
                {filteredDoctors.map((doctor: any, index: number) => (
                  <motion.div
                    key={doctor.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <DoctorCard doctor={doctor} onBookClick={handleBookDoctor} />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="mb-4 rounded-full bg-slate-100 p-6">
                <Search className="h-10 w-10 text-slate-400" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900">Không tìm thấy bác sĩ nào</h3>
              <p className="mt-2 text-slate-500">
                Vui lòng thử lại với từ khóa hoặc bộ lọc khác
              </p>
              <Button
                variant="outline"
                className="mt-6"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedSpecialty('all');
                }}
              >
                Xóa bộ lọc
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* CTA / Why Choose Us */}
      <section className="bg-white py-20">
        <div className="container mx-auto px-4">
          <div className="rounded-3xl bg-slate-50 p-8 md:p-12 lg:p-16">
            <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
              <div>
                <h2 className="text-3xl font-bold text-slate-900 sm:text-4xl">
                  Tại sao nên chọn đội ngũ của chúng tôi?
                </h2>
                <div className="mt-8 space-y-6">
                  {[
                    { title: 'Chuyên môn cao', desc: '100% bác sĩ có bằng sau đại học và chứng chỉ hành nghề quốc tế.' },
                    { title: 'Tận tâm & Chu đáo', desc: 'Luôn lắng nghe và giải thích cặn kẽ tình trạng bệnh cho bệnh nhân.' },
                    { title: 'Công nghệ hỗ trợ', desc: 'Ứng dụng AI và công nghệ mới nhất trong chẩn đoán và điều trị.' }
                  ].map((item, idx) => (
                    <div key={idx} className="flex gap-4">
                      <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <CheckCircle2 className="h-6 w-6" />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900">{item.title}</h3>
                        <p className="text-slate-600">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="relative h-[400px] overflow-hidden rounded-2xl">
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1622253639032-481f514c23e1?auto=format&fit=crop&q=80&w=1000')] bg-cover bg-center" />
              </div>
            </div>
          </div>
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
    </div>
  );
}
