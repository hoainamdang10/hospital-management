import { Search, Star, Calendar } from 'lucide-react';

/**
 * Doctors List Page
 * Route: /doctors
 */
export default function DoctorsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-primary py-20">
        <div className="container mx-auto px-4">
          <h1 className="text-center text-4xl font-bold text-white md:text-5xl">
            Đội ngũ bác sĩ
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-center text-lg text-white/90">
            Đội ngũ bác sĩ giàu kinh nghiệm, tận tâm với nghề
          </p>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center space-x-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm kiếm bác sĩ..."
              className="w-full rounded-lg border border-gray-300 py-3 pl-10 pr-4 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <select className="rounded-lg border border-gray-300 px-4 py-3">
            <option>Tất cả chuyên khoa</option>
            <option>Nội khoa</option>
            <option>Ngoại khoa</option>
            <option>Tim mạch</option>
            <option>Nhi khoa</option>
          </select>
        </div>
      </div>

      {/* Doctors Grid */}
      <div className="container mx-auto px-4 pb-16">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <DoctorCard
            name="BS. Nguyễn Văn A"
            specialty="Nội khoa"
            experience="15 năm kinh nghiệm"
            rating={4.8}
            reviews={120}
          />
          <DoctorCard
            name="BS. Trần Thị B"
            specialty="Tim mạch"
            experience="12 năm kinh nghiệm"
            rating={4.9}
            reviews={95}
          />
          <DoctorCard
            name="BS. Lê Văn C"
            specialty="Ngoại khoa"
            experience="10 năm kinh nghiệm"
            rating={4.7}
            reviews={88}
          />
          <DoctorCard
            name="BS. Phạm Thị D"
            specialty="Nhi khoa"
            experience="8 năm kinh nghiệm"
            rating={4.9}
            reviews={110}
          />
          <DoctorCard
            name="BS. Hoàng Văn E"
            specialty="Chỉnh hình"
            experience="14 năm kinh nghiệm"
            rating={4.6}
            reviews={75}
          />
          <DoctorCard
            name="BS. Ngô Thị F"
            specialty="Da liễu"
            experience="9 năm kinh nghiệm"
            rating={4.8}
            reviews={92}
          />
        </div>
      </div>
    </div>
  );
}

function DoctorCard({
  name,
  specialty,
  experience,
  rating,
  reviews,
}: {
  name: string;
  specialty: string;
  experience: string;
  rating: number;
  reviews: number;
}) {
  return (
    <div className="rounded-lg border bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
      <div className="mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-primary-100 text-3xl font-bold text-primary-700">
        {name.split(' ').pop()?.charAt(0)}
      </div>
      <h3 className="mb-2 text-xl font-semibold text-gray-900">{name}</h3>
      <p className="mb-1 text-primary-600">{specialty}</p>
      <p className="mb-3 text-sm text-gray-600">{experience}</p>
      <div className="mb-4 flex items-center">
        <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
        <span className="ml-1 font-semibold text-gray-900">{rating}</span>
        <span className="ml-1 text-sm text-gray-600">({reviews} đánh giá)</span>
      </div>
      <a
        href="/patient/appointments/book"
        className="block w-full rounded-lg bg-primary py-2 text-center font-semibold text-white transition-colors hover:bg-primary/90"
      >
        <Calendar className="mr-2 inline h-4 w-4" />
        Đặt lịch khám
      </a>
    </div>
  );
}
