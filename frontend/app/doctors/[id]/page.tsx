import Link from 'next/link';
import { Star, Calendar, Award, GraduationCap } from 'lucide-react';

/**
 * Doctor Public Profile Page
 * Route: /doctors/[id]
 */
export default function DoctorProfilePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-primary py-12">
        <div className="container mx-auto px-4">
          <div className="flex items-center space-x-6">
            <div className="flex h-32 w-32 items-center justify-center rounded-full bg-white text-4xl font-bold text-primary">
              NA
            </div>
            <div className="text-white">
              <h1 className="text-4xl font-bold">BS. Nguyễn Văn A</h1>
              <p className="mt-2 text-xl">Chuyên khoa Tim mạch</p>
              <div className="mt-3 flex items-center space-x-4">
                <div className="flex items-center">
                  <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                  <span className="ml-1 font-semibold">4.9</span>
                  <span className="ml-1">(120 đánh giá)</span>
                </div>
                <span>•</span>
                <span>15 năm kinh nghiệm</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* About */}
            <div className="rounded-lg border bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-2xl font-bold text-gray-900">Giới thiệu</h2>
              <p className="text-gray-600">
                Bác sĩ Nguyễn Văn A là chuyên gia hàng đầu trong lĩnh vực tim mạch với hơn 15 năm kinh nghiệm.
                Tốt nghiệp xuất sắc từ Đại học Y Hà Nội và có bằng chuyên khoa II về Tim mạch.
              </p>
              <p className="mt-4 text-gray-600">
                Bác sĩ A đã điều trị thành công hàng nghìn ca bệnh tim mạch phức tạp và được bệnh nhân
                đánh giá cao về chuyên môn và thái độ tận tâm.
              </p>
            </div>

            {/* Education */}
            <div className="rounded-lg border bg-white p-6 shadow-sm">
              <h2 className="mb-4 flex items-center text-2xl font-bold text-gray-900">
                <GraduationCap className="mr-2 h-6 w-6" />
                Học vấn
              </h2>
              <div className="space-y-4">
                <EducationItem
                  degree="Bác sĩ Chuyên khoa II Tim mạch"
                  school="Đại học Y Hà Nội"
                  year="2015"
                />
                <EducationItem
                  degree="Bác sĩ Đa khoa"
                  school="Đại học Y Hà Nội"
                  year="2010"
                />
              </div>
            </div>

            {/* Expertise */}
            <div className="rounded-lg border bg-white p-6 shadow-sm">
              <h2 className="mb-4 flex items-center text-2xl font-bold text-gray-900">
                <Award className="mr-2 h-6 w-6" />
                Chuyên môn
              </h2>
              <div className="grid gap-3 md:grid-cols-2">
                <ExpertiseTag text="Bệnh mạch vành" />
                <ExpertiseTag text="Rối loạn nhịp tim" />
                <ExpertiseTag text="Suy tim" />
                <ExpertiseTag text="Tăng huyết áp" />
                <ExpertiseTag text="Siêu âm tim" />
                <ExpertiseTag text="Điện tâm đồ" />
              </div>
            </div>

            {/* Reviews */}
            <div className="rounded-lg border bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-2xl font-bold text-gray-900">Đánh giá từ bệnh nhân</h2>
              <div className="space-y-4">
                <ReviewCard
                  name="Nguyễn Thị B"
                  rating={5}
                  date="10/01/2025"
                  comment="Bác sĩ rất tận tâm và chuyên môn cao. Giải thích rất kỹ cho bệnh nhân hiểu."
                />
                <ReviewCard
                  name="Trần Văn C"
                  rating={5}
                  date="05/01/2025"
                  comment="Khám rất kỹ, tư vấn chi tiết. Cảm ơn bác sĩ rất nhiều!"
                />
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Booking Card */}
            <div className="rounded-lg border bg-white p-6 shadow-sm">
              <h3 className="mb-4 text-lg font-semibold text-gray-900">Đặt lịch khám</h3>
              <div className="mb-4 space-y-2">
                <InfoRow label="Giá khám" value="500,000 VNĐ" />
                <InfoRow label="Thời gian khám" value="30 phút" />
              </div>
              <Link
                href="/patient/appointments/book"
                className="block w-full rounded-lg bg-primary py-3 text-center font-semibold text-white transition-colors hover:bg-primary/90"
              >
                <Calendar className="mr-2 inline h-5 w-5" />
                Đặt lịch ngay
              </Link>
            </div>

            {/* Schedule */}
            <div className="rounded-lg border bg-white p-6 shadow-sm">
              <h3 className="mb-4 text-lg font-semibold text-gray-900">Lịch làm việc</h3>
              <div className="space-y-2">
                <ScheduleRow day="Thứ 2 - Thứ 6" time="8:00 - 17:00" />
                <ScheduleRow day="Thứ 7" time="8:00 - 12:00" />
                <ScheduleRow day="Chủ nhật" time="Nghỉ" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function EducationItem({ degree, school, year }: { degree: string; school: string; year: string }) {
  return (
    <div className="border-l-4 border-primary pl-4">
      <p className="font-semibold text-gray-900">{degree}</p>
      <p className="text-sm text-gray-600">{school}</p>
      <p className="text-sm text-gray-500">{year}</p>
    </div>
  );
}

function ExpertiseTag({ text }: { text: string }) {
  return (
    <div className="rounded-lg bg-primary-50 px-3 py-2 text-sm font-medium text-primary-700">
      {text}
    </div>
  );
}

function ReviewCard({ name, rating, date, comment }: any) {
  return (
    <div className="border-b pb-4 last:border-0">
      <div className="mb-2 flex items-center justify-between">
        <p className="font-semibold text-gray-900">{name}</p>
        <div className="flex items-center">
          {[...Array(rating)].map((_, i) => (
            <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
          ))}
        </div>
      </div>
      <p className="text-sm text-gray-500">{date}</p>
      <p className="mt-2 text-gray-600">{comment}</p>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-gray-600">{label}:</span>
      <span className="font-semibold text-gray-900">{value}</span>
    </div>
  );
}

function ScheduleRow({ day, time }: { day: string; time: string }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-gray-600">{day}</span>
      <span className="font-medium text-gray-900">{time}</span>
    </div>
  );
}
