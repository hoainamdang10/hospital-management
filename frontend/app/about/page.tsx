import { Building2, Users, Award, Heart } from 'lucide-react';

/**
 * About Page
 * Route: /about
 */
export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-primary py-20">
        <div className="container mx-auto px-4">
          <h1 className="text-center text-4xl font-bold text-white md:text-5xl">
            Về chúng tôi
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-center text-lg text-white/90">
            Hệ thống quản lý bệnh viện hiện đại, mang đến dịch vụ chăm sóc sức khỏe tốt nhất
          </p>
        </div>
      </div>

      {/* Mission Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="grid gap-12 lg:grid-cols-2">
          <div>
            <h2 className="mb-4 text-3xl font-bold text-gray-900">Sứ mệnh của chúng tôi</h2>
            <p className="mb-4 text-gray-600">
              Chúng tôi cam kết cung cấp dịch vụ chăm sóc sức khỏe chất lượng cao, với đội ngũ y bác sĩ
              giàu kinh nghiệm và trang thiết bị y tế hiện đại.
            </p>
            <p className="text-gray-600">
              Sứ mệnh của chúng tôi là mang lại sự chăm sóc tận tâm, an toàn và hiệu quả cho mọi bệnh nhân,
              đồng thời không ngừng cải tiến và phát triển để đáp ứng nhu cầu ngày càng cao của cộng đồng.
            </p>
          </div>
          <div>
            <h2 className="mb-4 text-3xl font-bold text-gray-900">Tầm nhìn</h2>
            <p className="mb-4 text-gray-600">
              Trở thành hệ thống bệnh viện hàng đầu tại Việt Nam, được tin tưởng bởi chất lượng dịch vụ
              và sự chăm sóc tận tâm.
            </p>
            <p className="text-gray-600">
              Chúng tôi hướng tới việc ứng dụng công nghệ số hóa toàn diện trong quản lý và điều trị,
              mang đến trải nghiệm tốt nhất cho bệnh nhân và đội ngũ y tế.
            </p>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="bg-white py-16">
        <div className="container mx-auto px-4">
          <div className="grid gap-8 md:grid-cols-4">
            <StatCard icon={Building2} value="15+" label="Năm kinh nghiệm" />
            <StatCard icon={Users} value="100+" label="Bác sĩ chuyên khoa" />
            <StatCard icon={Award} value="50+" label="Giải thưởng" />
            <StatCard icon={Heart} value="10,000+" label="Bệnh nhân hài lòng" />
          </div>
        </div>
      </div>

      {/* Values Section */}
      <div className="container mx-auto px-4 py-16">
        <h2 className="mb-12 text-center text-3xl font-bold text-gray-900">Giá trị cốt lõi</h2>
        <div className="grid gap-8 md:grid-cols-3">
          <ValueCard
            title="Chất lượng"
            description="Cam kết cung cấp dịch vụ y tế chất lượng cao nhất với đội ngũ chuyên môn giỏi và trang thiết bị hiện đại."
          />
          <ValueCard
            title="Tận tâm"
            description="Luôn đặt lợi ích và sức khỏe của bệnh nhân lên hàng đầu, chăm sóc với sự tận tâm và trách nhiệm."
          />
          <ValueCard
            title="Đổi mới"
            description="Không ngừng cải tiến và ứng dụng công nghệ mới để nâng cao chất lượng dịch vụ và trải nghiệm bệnh nhân."
          />
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, value, label }: { icon: any; value: string; label: string }) {
  return (
    <div className="text-center">
      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary-100">
        <Icon className="h-8 w-8 text-primary-600" />
      </div>
      <div className="text-3xl font-bold text-gray-900">{value}</div>
      <div className="mt-2 text-gray-600">{label}</div>
    </div>
  );
}

function ValueCard({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-lg border bg-white p-6 shadow-sm">
      <h3 className="mb-3 text-xl font-semibold text-gray-900">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  );
}
