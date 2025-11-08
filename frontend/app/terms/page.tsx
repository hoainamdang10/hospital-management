export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-primary py-20">
        <div className="container mx-auto px-4">
          <h1 className="text-center text-4xl font-bold text-white md:text-5xl">
            Điều khoản dịch vụ
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-center text-lg text-white/90">
            Quy định sử dụng dịch vụ tại bệnh viện
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-16">
        <div className="mx-auto max-w-4xl space-y-8 rounded-lg bg-white p-8 shadow-sm">
          <Section title="1. Chấp nhận điều khoản">
            <p>
              Bằng việc sử dụng dịch vụ của bệnh viện, bạn đồng ý tuân thủ các điều khoản được nêu trong tài liệu này.
            </p>
          </Section>

          <Section title="2. Đăng ký tài khoản">
            <p>Khi đăng ký, bạn cam kết cung cấp thông tin chính xác và bảo mật thông tin đăng nhập.</p>
          </Section>

          <Section title="3. Sử dụng dịch vụ">
            <p>Bạn được phép đặt lịch khám, xem hồ sơ y tế và thanh toán qua hệ thống.</p>
          </Section>

          <Section title="4. Thanh toán">
            <p>Mọi khoản phí phải được thanh toán theo giá niêm yết. Hoàn tiền theo chính sách bệnh viện.</p>
          </Section>

          <Section title="5. Hủy lịch hẹn">
            <p>Có thể hủy lịch trước 24 giờ mà không mất phí.</p>
          </Section>

          <Section title="6. Liên hệ">
            <p>Mọi thắc mắc vui lòng liên hệ: support@hospital.com hoặc (028) 1234 5678</p>
          </Section>

          <div className="border-t pt-6">
            <p className="text-sm text-gray-600">
              Điều khoản có hiệu lực từ 01/01/2025. Cập nhật lần cuối: 11/01/2025
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="mb-3 text-xl font-bold text-gray-900">{title}</h2>
      <div className="text-gray-700">{children}</div>
    </div>
  );
}
