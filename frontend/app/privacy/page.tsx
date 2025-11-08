export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-primary py-20">
        <div className="container mx-auto px-4">
          <h1 className="text-center text-4xl font-bold text-white md:text-5xl">
            Chính sách bảo mật
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-center text-lg text-white/90">
            Cam kết bảo vệ thông tin cá nhân của bạn
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-16">
        <div className="mx-auto max-w-4xl space-y-8 rounded-lg bg-white p-8 shadow-sm">
          <Section title="1. Thu thập thông tin">
            <p>
              Chúng tôi thu thập thông tin cá nhân khi bạn đăng ký tài khoản, đặt lịch khám, hoặc sử dụng
              các dịch vụ của chúng tôi. Thông tin có thể bao gồm: họ tên, ngày sinh, địa chỉ, số điện thoại,
              email, và thông tin y tế liên quan.
            </p>
          </Section>

          <Section title="2. Sử dụng thông tin">
            <p>Thông tin của bạn được sử dụng để:</p>
            <ul className="ml-6 mt-2 list-disc space-y-1">
              <li>Cung cấp dịch vụ y tế và chăm sóc sức khỏe</li>
              <li>Quản lý lịch hẹn và hồ sơ bệnh án</li>
              <li>Liên lạc về các dịch vụ y tế</li>
              <li>Cải thiện chất lượng dịch vụ</li>
              <li>Tuân thủ các quy định pháp luật</li>
            </ul>
          </Section>

          <Section title="3. Bảo mật thông tin">
            <p>
              Chúng tôi áp dụng các biện pháp bảo mật kỹ thuật và tổ chức phù hợp để bảo vệ thông tin
              cá nhân của bạn khỏi truy cập trái phép, mất mát, hoặc tiết lộ.
            </p>
          </Section>

          <Section title="4. Chia sẻ thông tin">
            <p>
              Chúng tôi không bán hoặc cho thuê thông tin cá nhân của bạn. Thông tin chỉ được chia sẻ với:
            </p>
            <ul className="ml-6 mt-2 list-disc space-y-1">
              <li>Các bác sĩ và nhân viên y tế liên quan đến việc điều trị</li>
              <li>Các đối tác cung cấp dịch vụ hỗ trợ (với thỏa thuận bảo mật)</li>
              <li>Cơ quan có thẩm quyền khi có yêu cầu pháp lý</li>
            </ul>
          </Section>

          <Section title="5. Quyền của bạn">
            <p>Bạn có quyền:</p>
            <ul className="ml-6 mt-2 list-disc space-y-1">
              <li>Truy cập và xem thông tin cá nhân của mình</li>
              <li>Yêu cầu sửa đổi thông tin không chính xác</li>
              <li>Yêu cầu xóa thông tin (trong phạm vi pháp luật cho phép)</li>
              <li>Rút lại sự đồng ý sử dụng thông tin</li>
            </ul>
          </Section>

          <Section title="6. Cookies">
            <p>
              Website của chúng tôi sử dụng cookies để cải thiện trải nghiệm người dùng. Bạn có thể
              tắt cookies trong trình duyệt, nhưng một số tính năng có thể không hoạt động đầy đủ.
            </p>
          </Section>

          <Section title="7. Liên hệ">
            <p>
              Nếu bạn có câu hỏi về chính sách bảo mật, vui lòng liên hệ:
            </p>
            <div className="mt-2 space-y-1">
              <p>Email: privacy@hospital.com</p>
              <p>Điện thoại: (028) 1234 5678</p>
              <p>Địa chỉ: 123 Đường ABC, Quận 1, TP.HCM</p>
            </div>
          </Section>

          <div className="border-t pt-6">
            <p className="text-sm text-gray-600">
              Chính sách này có hiệu lực từ ngày 01/01/2025 và có thể được cập nhật định kỳ.
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
