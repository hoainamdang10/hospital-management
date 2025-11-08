import { Briefcase, MapPin, Clock } from 'lucide-react';

export default function CareersPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-primary py-20">
        <div className="container mx-auto px-4">
          <h1 className="text-center text-4xl font-bold text-white md:text-5xl">Tuyển dụng</h1>
          <p className="mx-auto mt-4 max-w-2xl text-center text-lg text-white/90">
            Gia nhập đội ngũ chuyên nghiệp của chúng tôi
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-16">
        <div className="mb-12 rounded-lg bg-white p-8 shadow-sm">
          <h2 className="mb-4 text-2xl font-bold text-gray-900">Tại sao làm việc với chúng tôi?</h2>
          <div className="grid gap-6 md:grid-cols-3">
            <BenefitCard
              title="Môi trường chuyên nghiệp"
              description="Làm việc với đội ngũ y bác sĩ giàu kinh nghiệm"
            />
            <BenefitCard
              title="Phúc lợi hấp dẫn"
              description="Lương thưởng cạnh tranh, bảo hiểm đầy đủ"
            />
            <BenefitCard
              title="Phát triển nghề nghiệp"
              description="Cơ hội đào tạo và thăng tiến rõ ràng"
            />
          </div>
        </div>

        <h2 className="mb-6 text-2xl font-bold text-gray-900">Vị trí đang tuyển</h2>
        <div className="space-y-4">
          <JobCard
            title="Bác sĩ Tim mạch"
            department="Khoa Tim mạch"
            location="TP.HCM"
            type="Full-time"
            description="Tìm kiếm bác sĩ chuyên khoa tim mạch có kinh nghiệm..."
          />
          <JobCard
            title="Y tá"
            department="Khoa Nội"
            location="TP.HCM"
            type="Full-time"
            description="Cần tuyển y tá có bằng cấp và kinh nghiệm làm việc..."
          />
          <JobCard
            title="Kỹ thuật viên X-quang"
            department="Khoa Chẩn đoán hình ảnh"
            location="TP.HCM"
            type="Full-time"
            description="Tuyển kỹ thuật viên X-quang có chứng chỉ hành nghề..."
          />
        </div>
      </div>
    </div>
  );
}

function BenefitCard({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-lg border p-6">
      <h3 className="mb-2 font-semibold text-gray-900">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  );
}

function JobCard({ title, department, location, type, description }: any) {
  return (
    <div className="rounded-lg border bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="mb-2 text-xl font-semibold text-gray-900">{title}</h3>
          <div className="mb-3 flex flex-wrap gap-3 text-sm text-gray-600">
            <div className="flex items-center">
              <Briefcase className="mr-1 h-4 w-4" />
              {department}
            </div>
            <div className="flex items-center">
              <MapPin className="mr-1 h-4 w-4" />
              {location}
            </div>
            <div className="flex items-center">
              <Clock className="mr-1 h-4 w-4" />
              {type}
            </div>
          </div>
          <p className="text-gray-600">{description}</p>
        </div>
        <button className="ml-4 rounded-lg bg-primary px-6 py-2 font-semibold text-white hover:bg-primary/90">
          Ứng tuyển
        </button>
      </div>
    </div>
  );
}
