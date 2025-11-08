import { Stethoscope, Heart, Baby, Brain, Bone, Eye } from 'lucide-react';

/**
 * Services Page
 * Route: /services
 */
export default function ServicesPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-primary py-20">
        <div className="container mx-auto px-4">
          <h1 className="text-center text-4xl font-bold text-white md:text-5xl">
            Dịch vụ y tế
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-center text-lg text-white/90">
            Chúng tôi cung cấp đầy đủ các dịch vụ y tế chuyên sâu với đội ngũ bác sĩ giàu kinh nghiệm
          </p>
        </div>
      </div>

      {/* Services Grid */}
      <div className="container mx-auto px-4 py-16">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          <ServiceCard
            icon={Stethoscope}
            title="Khoa Nội"
            description="Khám và điều trị các bệnh lý nội khoa: tim mạch, tiêu hóa, hô hấp, thận, gan..."
            features={['Khám tổng quát', 'Điều trị nội trú', 'Tư vấn dinh dưỡng']}
          />
          <ServiceCard
            icon={Heart}
            title="Khoa Tim mạch"
            description="Chuyên khoa tim mạch với trang thiết bị hiện đại và đội ngũ chuyên gia hàng đầu"
            features={['Siêu âm tim', 'Điện tâm đồ', 'Can thiệp tim mạch']}
          />
          <ServiceCard
            icon={Baby}
            title="Khoa Nhi"
            description="Chăm sóc sức khỏe toàn diện cho trẻ em từ sơ sinh đến 16 tuổi"
            features={['Khám nhi tổng quát', 'Tiêm chủng', 'Dinh dưỡng trẻ em']}
          />
          <ServiceCard
            icon={Brain}
            title="Khoa Thần kinh"
            description="Chẩn đoán và điều trị các bệnh lý thần kinh, đau đầu, đột quỵ..."
            features={['Chụp CT não', 'Điện não đồ', 'Vật lý trị liệu']}
          />
          <ServiceCard
            icon={Bone}
            title="Khoa Chỉnh hình"
            description="Điều trị các bệnh lý về xương khớp, cột sống, chấn thương..."
            features={['Phẫu thuật xương khớp', 'Vật lý trị liệu', 'Phục hồi chức năng']}
          />
          <ServiceCard
            icon={Eye}
            title="Khoa Mắt"
            description="Khám và điều trị các bệnh lý về mắt, phẫu thuật mắt chuyên sâu"
            features={['Khám mắt tổng quát', 'Phẫu thuật mắt', 'Kính áp tròng']}
          />
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-primary py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="mb-4 text-3xl font-bold text-white">Đặt lịch khám ngay hôm nay</h2>
          <p className="mb-8 text-lg text-white/90">
            Liên hệ với chúng tôi để được tư vấn và đặt lịch khám
          </p>
          <div className="flex justify-center space-x-4">
            <a
              href="/register"
              className="rounded-lg bg-white px-8 py-3 font-semibold text-primary transition-colors hover:bg-gray-100"
            >
              Đăng ký ngay
            </a>
            <a
              href="/login"
              className="rounded-lg border-2 border-white px-8 py-3 font-semibold text-white transition-colors hover:bg-white/10"
            >
              Đăng nhập
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

function ServiceCard({
  icon: Icon,
  title,
  description,
  features,
}: {
  icon: any;
  title: string;
  description: string;
  features: string[];
}) {
  return (
    <div className="rounded-lg border bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary-100">
        <Icon className="h-6 w-6 text-primary-600" />
      </div>
      <h3 className="mb-3 text-xl font-semibold text-gray-900">{title}</h3>
      <p className="mb-4 text-gray-600">{description}</p>
      <ul className="space-y-2">
        {features.map((feature, index) => (
          <li key={index} className="flex items-center text-sm text-gray-600">
            <span className="mr-2 h-1.5 w-1.5 rounded-full bg-primary"></span>
            {feature}
          </li>
        ))}
      </ul>
    </div>
  );
}
