import Link from 'next/link';
import { Facebook, Twitter, Instagram, Linkedin, Mail, Phone, MapPin, Heart } from 'lucide-react';

export function PublicFooter() {
  return (
    <footer className="bg-slate-900 text-slate-300">
      <div className="container mx-auto px-4 py-16">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div>
            <Link href="/" className="mb-6 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 via-teal-500 to-emerald-500 shadow-lg">
                <Heart className="h-6 w-6 text-white" fill="white" fillOpacity={0.3} />
              </div>
              <div>
                <span className="bg-gradient-to-r from-cyan-400 via-teal-400 to-emerald-400 bg-clip-text text-2xl font-bold text-transparent">
                  Medigo
                </span>
                <p className="text-[10px] font-medium uppercase tracking-widest text-slate-500">
                  Healthcare Platform
                </p>
              </div>
            </Link>
            <p className="mb-6 text-sm leading-relaxed text-slate-400">
              Nền tảng chăm sóc sức khỏe thông minh, mang đến trải nghiệm đặt lịch khám, tư vấn trực tuyến
              và quản lý hồ sơ y tế toàn diện.
            </p>
            <div className="flex gap-3">
              {[Facebook, Twitter, Instagram, Linkedin].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-white/5 transition-all hover:bg-gradient-to-br hover:from-cyan-500 hover:to-teal-500 hover:text-white hover:shadow-lg"
                >
                  <Icon className="h-5 w-5" />
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="mb-6 text-lg font-semibold text-white">Liên kết nhanh</h3>
            <ul className="space-y-4 text-sm">
              {[
                { label: 'Về chúng tôi', href: '/about' },
                { label: 'Dịch vụ y tế', href: '/services' },
                { label: 'Đội ngũ bác sĩ', href: '/doctors' },
                { label: 'Tin tức & Sự kiện', href: '/news' },
                { label: 'Liên hệ', href: '/contact' },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="transition-colors hover:text-cyan-400"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Services */}
          <div>
            <h3 className="mb-6 text-lg font-semibold text-white">Chuyên khoa</h3>
            <ul className="space-y-4 text-sm">
              {[
                'Khoa Nội tổng quát',
                'Khoa Ngoại',
                'Khoa Nhi',
                'Khoa Sản phụ khoa',
                'Khoa Tim mạch',
              ].map((item) => (
                <li key={item}>
                  <a href="#" className="transition-colors hover:text-cyan-400">
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="mb-6 text-lg font-semibold text-white">Thông tin liên hệ</h3>
            <ul className="space-y-4 text-sm">
              <li className="flex items-start gap-3">
                <MapPin className="h-5 w-5 flex-shrink-0 text-cyan-400" />
                <span>123 Đường Nguyễn Văn Linh, Quận 7, TP. Hồ Chí Minh</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="h-5 w-5 flex-shrink-0 text-cyan-400" />
                <span>(028) 1234 5678</span>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="h-5 w-5 flex-shrink-0 text-cyan-400" />
                <span>contact@medigo.vn</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-16 border-t border-white/10 pt-8 text-center text-sm text-slate-500">
          <p>&copy; {new Date().getFullYear()} Medigo. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
