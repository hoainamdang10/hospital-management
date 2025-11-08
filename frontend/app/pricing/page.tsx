import { Check } from 'lucide-react';

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-primary py-20">
        <div className="container mx-auto px-4">
          <h1 className="text-center text-4xl font-bold text-white md:text-5xl">Bảng giá dịch vụ</h1>
          <p className="mx-auto mt-4 max-w-2xl text-center text-lg text-white/90">
            Minh bạch về chi phí khám chữa bệnh
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-16">
        <div className="mb-12 grid gap-8 md:grid-cols-3">
          <PricingCard
            title="Khám bệnh"
            price="200,000"
            features={[
              'Khám tổng quát',
              'Tư vấn bác sĩ',
              'Đơn thuốc',
              'Theo dõi sau khám',
            ]}
          />
          <PricingCard
            title="Khám chuyên khoa"
            price="500,000"
            features={[
              'Khám chuyên khoa',
              'Bác sĩ chuyên môn cao',
              'Tư vấn chi tiết',
              'Đơn thuốc chuyên biệt',
            ]}
            featured
          />
          <PricingCard
            title="Gói khám sức khỏe"
            price="2,000,000"
            features={[
              'Khám tổng quát toàn diện',
              'Xét nghiệm đầy đủ',
              'Chụp X-quang',
              'Siêu âm',
              'Tư vấn dinh dưỡng',
            ]}
          />
        </div>

        <div className="rounded-lg border bg-white p-8 shadow-sm">
          <h2 className="mb-6 text-2xl font-bold text-gray-900">Dịch vụ khác</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <ServiceRow service="Xét nghiệm máu" price="150,000 - 500,000" />
            <ServiceRow service="X-quang" price="200,000 - 800,000" />
            <ServiceRow service="Siêu âm" price="300,000 - 1,000,000" />
            <ServiceRow service="CT Scan" price="2,000,000 - 5,000,000" />
            <ServiceRow service="MRI" price="3,000,000 - 8,000,000" />
            <ServiceRow service="Nội soi" price="1,000,000 - 3,000,000" />
          </div>
        </div>

        <div className="mt-8 rounded-lg bg-blue-50 p-6">
          <p className="text-center text-gray-700">
            <strong>Lưu ý:</strong> Giá có thể thay đổi tùy theo tình trạng bệnh và yêu cầu điều trị.
            Vui lòng liên hệ để được tư vấn chi tiết.
          </p>
        </div>
      </div>
    </div>
  );
}

function PricingCard({ title, price, features, featured = false }: any) {
  return (
    <div className={`rounded-lg border p-8 ${featured ? 'border-primary bg-primary-50' : 'bg-white'} shadow-sm`}>
      {featured && (
        <span className="mb-4 inline-block rounded-full bg-primary px-3 py-1 text-sm font-medium text-white">
          Phổ biến nhất
        </span>
      )}
      <h3 className="mb-2 text-2xl font-bold text-gray-900">{title}</h3>
      <div className="mb-6">
        <span className="text-4xl font-bold text-primary">{price}</span>
        <span className="text-gray-600"> VNĐ</span>
      </div>
      <ul className="space-y-3">
        {features.map((feature: string, i: number) => (
          <li key={i} className="flex items-center">
            <Check className="mr-2 h-5 w-5 text-green-600" />
            <span className="text-gray-700">{feature}</span>
          </li>
        ))}
      </ul>
      <button className="mt-6 w-full rounded-lg bg-primary py-3 font-semibold text-white hover:bg-primary/90">
        Đặt lịch ngay
      </button>
    </div>
  );
}

function ServiceRow({ service, price }: { service: string; price: string }) {
  return (
    <div className="flex justify-between border-b py-3">
      <span className="text-gray-700">{service}</span>
      <span className="font-semibold text-gray-900">{price} VNĐ</span>
    </div>
  );
}
