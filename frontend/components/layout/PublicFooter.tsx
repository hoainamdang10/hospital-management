import Link from 'next/link';

export function PublicFooter() {
  return (
    <footer className="border-t bg-gray-50">
      <div className="container mx-auto px-4 py-12">
        <div className="grid gap-8 md:grid-cols-4">
          {/* About */}
          <div>
            <h3 className="mb-4 text-lg font-semibold">Về chúng tôi</h3>
            <p className="text-sm text-gray-600">
              Hệ thống quản lý bệnh viện hiện đại, mang đến dịch vụ y tế chất lượng cao.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="mb-4 text-lg font-semibold">Liên kết</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/about" className="text-gray-600 hover:text-primary">
                  Giới thiệu
                </Link>
              </li>
              <li>
                <Link href="/services" className="text-gray-600 hover:text-primary">
                  Dịch vụ
                </Link>
              </li>
              <li>
                <Link href="/doctors" className="text-gray-600 hover:text-primary">
                  Bác sĩ
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-gray-600 hover:text-primary">
                  Liên hệ
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="mb-4 text-lg font-semibold">Hỗ trợ</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/faq" className="text-gray-600 hover:text-primary">
                  Câu hỏi thường gặp
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-gray-600 hover:text-primary">
                  Chính sách bảo mật
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-gray-600 hover:text-primary">
                  Điều khoản dịch vụ
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="mb-4 text-lg font-semibold">Liên hệ</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>📍 123 Đường ABC, Quận 1, TP.HCM</li>
              <li>📞 (028) 1234 5678</li>
              <li>✉️ info@hospital.com</li>
            </ul>
          </div>
        </div>

        <div className="mt-8 border-t pt-8 text-center text-sm text-gray-600">
          <p>&copy; 2025 Hospital Management System V2. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
