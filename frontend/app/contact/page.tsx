import { MapPin, Phone, Mail, Clock } from 'lucide-react';

/**
 * Contact Page
 * Route: /contact
 */
export default function ContactPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-primary py-20">
        <div className="container mx-auto px-4">
          <h1 className="text-center text-4xl font-bold text-white md:text-5xl">
            Liên hệ
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-center text-lg text-white/90">
            Chúng tôi luôn sẵn sàng hỗ trợ bạn
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-16">
        <div className="grid gap-12 lg:grid-cols-2">
          {/* Contact Form */}
          <div className="rounded-lg border bg-white p-8 shadow-sm">
            <h2 className="mb-6 text-2xl font-bold text-gray-900">Gửi tin nhắn</h2>
            <form className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Họ và tên
                </label>
                <input
                  type="text"
                  className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder="Nhập họ tên của bạn"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Email
                </label>
                <input
                  type="email"
                  className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder="email@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Số điện thoại
                </label>
                <input
                  type="tel"
                  className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder="0912345678"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Nội dung
                </label>
                <textarea
                  rows={5}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder="Nhập nội dung tin nhắn..."
                />
              </div>
              <button
                type="submit"
                className="w-full rounded-lg bg-primary py-3 font-semibold text-white transition-colors hover:bg-primary/90"
              >
                Gửi tin nhắn
              </button>
            </form>
          </div>

          {/* Contact Info */}
          <div className="space-y-8">
            <div className="rounded-lg border bg-white p-8 shadow-sm">
              <h2 className="mb-6 text-2xl font-bold text-gray-900">Thông tin liên hệ</h2>
              <div className="space-y-6">
                <ContactItem
                  icon={MapPin}
                  title="Địa chỉ"
                  content="123 Đường ABC, Quận 1, TP.HCM"
                />
                <ContactItem
                  icon={Phone}
                  title="Điện thoại"
                  content="(028) 1234 5678"
                />
                <ContactItem
                  icon={Mail}
                  title="Email"
                  content="info@hospital.com"
                />
                <ContactItem
                  icon={Clock}
                  title="Giờ làm việc"
                  content="Thứ 2 - Chủ nhật: 7:00 - 20:00"
                />
              </div>
            </div>

            {/* Emergency */}
            <div className="rounded-lg border border-red-200 bg-red-50 p-8">
              <h3 className="mb-4 text-xl font-bold text-red-900">Cấp cứu 24/7</h3>
              <p className="mb-4 text-red-800">
                Đường dây nóng cấp cứu hoạt động 24/7
              </p>
              <a
                href="tel:115"
                className="block w-full rounded-lg bg-red-600 py-3 text-center font-bold text-white transition-colors hover:bg-red-700"
              >
                <Phone className="mr-2 inline h-5 w-5" />
                Gọi 115
              </a>
            </div>
          </div>
        </div>

        {/* Map */}
        <div className="mt-12 rounded-lg border bg-white p-4 shadow-sm">
          <div className="h-96 rounded-lg bg-gray-200 flex items-center justify-center">
            <p className="text-gray-500">Google Maps sẽ được tích hợp tại đây</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function ContactItem({
  icon: Icon,
  title,
  content,
}: {
  icon: any;
  title: string;
  content: string;
}) {
  return (
    <div className="flex items-start space-x-4">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-100">
        <Icon className="h-6 w-6 text-primary-600" />
      </div>
      <div>
        <h3 className="font-semibold text-gray-900">{title}</h3>
        <p className="text-gray-600">{content}</p>
      </div>
    </div>
  );
}
