'use client';

import { motion } from 'framer-motion';
import { FileText, Calendar, Users, CreditCard, Clock, Phone, ChevronRight, Check, AlertTriangle, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PublicNavbar } from '@/components/layout/PublicNavbar';
import { PublicFooter } from '@/components/layout/PublicFooter';

const tableOfContents = [
  { id: 'acceptance', title: 'Chấp nhận điều khoản', icon: FileText },
  { id: 'registration', title: 'Đăng ký tài khoản', icon: Users },
  { id: 'services', title: 'Sử dụng dịch vụ', icon: Calendar },
  { id: 'payment', title: 'Thanh toán', icon: CreditCard },
  { id: 'cancellation', title: 'Hủy lịch hẹn', icon: Clock },
  { id: 'contact', title: 'Liên hệ', icon: Phone },
];

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      <PublicNavbar />

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-cyan-900 pt-32 pb-20">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_20%,rgba(6,182,212,0.15),transparent_50%)]" />
        <div className="container relative z-10 mx-auto px-4 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-cyan-500/20 text-cyan-400">
              <FileText className="h-8 w-8" />
            </div>
            <h1 className="mb-4 text-4xl font-bold tracking-tight text-white sm:text-5xl">Điều khoản Dịch vụ</h1>
            <p className="mx-auto max-w-2xl text-lg text-slate-300">Quy định sử dụng dịch vụ tại bệnh viện và nền tảng trực tuyến</p>
            <div className="mt-6 flex items-center justify-center gap-4 text-sm text-slate-400">
              <span className="flex items-center gap-1"><FileText className="h-4 w-4" />Cập nhật: 11/01/2025</span>
            </div>
          </motion.div>
        </div>
      </section>

      <main className="container mx-auto px-4 py-12">
        <div className="grid gap-8 lg:grid-cols-4">
          {/* Sidebar */}
          <aside className="lg:col-span-1">
            <div className="sticky top-24 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
              <h3 className="mb-4 font-bold text-slate-900">Mục lục</h3>
              <nav className="space-y-1">
                {tableOfContents.map((item) => (
                  <a key={item.id} href={`#${item.id}`} className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-cyan-50 hover:text-cyan-600">
                    <item.icon className="h-4 w-4" />{item.title}<ChevronRight className="ml-auto h-4 w-4" />
                  </a>
                ))}
              </nav>
              <div className="mt-6 rounded-xl bg-amber-50 p-4">
                <div className="flex items-start gap-2">
                  <HelpCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-amber-900">Cần hỗ trợ?</p>
                    <p className="text-xs text-amber-700 mt-1">Liên hệ hotline: (028) 1234 5678</p>
                  </div>
                </div>
              </div>
            </div>
          </aside>

          {/* Content */}
          <div className="lg:col-span-3 space-y-8">
            {/* Important Notice */}
            <div className="flex gap-4 rounded-2xl border border-amber-200 bg-amber-50 p-6">
              <AlertTriangle className="h-6 w-6 text-amber-600 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-amber-900">Lưu ý quan trọng</h3>
                <p className="mt-1 text-amber-800">Bằng việc sử dụng dịch vụ, bạn đồng ý tuân thủ các điều khoản dưới đây. Vui lòng đọc kỹ trước khi sử dụng.</p>
              </div>
            </div>

            {/* Section 1 */}
            <section id="acceptance" className="scroll-mt-24 rounded-2xl border border-slate-100 bg-white p-8 shadow-sm">
              <div className="mb-6 flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-100 text-cyan-600"><FileText className="h-6 w-6" /></div>
                <h2 className="text-2xl font-bold text-slate-900">1. Chấp nhận điều khoản</h2>
              </div>
              <p className="text-slate-600 mb-4">Bằng việc truy cập, đăng ký tài khoản hoặc sử dụng bất kỳ dịch vụ nào của bệnh viện (bao gồm website, ứng dụng di động và dịch vụ khám chữa bệnh trực tiếp), bạn xác nhận rằng:</p>
              <ul className="space-y-2">
                {['Bạn đã đọc và hiểu các điều khoản này', 'Bạn đồng ý tuân thủ tất cả các quy định', 'Bạn đủ 18 tuổi hoặc có sự đồng ý của phụ huynh/người giám hộ', 'Thông tin bạn cung cấp là chính xác và đầy đủ'].map((item, i) => (
                  <li key={i} className="flex items-start gap-3"><Check className="mt-0.5 h-5 w-5 text-cyan-600" /><span className="text-slate-700">{item}</span></li>
                ))}
              </ul>
            </section>

            {/* Section 2 */}
            <section id="registration" className="scroll-mt-24 rounded-2xl border border-slate-100 bg-white p-8 shadow-sm">
              <div className="mb-6 flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-100 text-cyan-600"><Users className="h-6 w-6" /></div>
                <h2 className="text-2xl font-bold text-slate-900">2. Đăng ký tài khoản</h2>
              </div>
              <p className="text-slate-600 mb-4">Khi đăng ký tài khoản, bạn cam kết:</p>
              <ul className="space-y-2">
                {['Cung cấp thông tin cá nhân chính xác, đầy đủ', 'Cập nhật thông tin khi có thay đổi', 'Bảo mật thông tin đăng nhập (mật khẩu, OTP)', 'Không chia sẻ tài khoản cho người khác', 'Thông báo ngay khi phát hiện truy cập trái phép'].map((item, i) => (
                  <li key={i} className="flex items-start gap-3"><Check className="mt-0.5 h-5 w-5 text-cyan-600" /><span className="text-slate-700">{item}</span></li>
                ))}
              </ul>
            </section>

            {/* Section 3 */}
            <section id="services" className="scroll-mt-24 rounded-2xl border border-slate-100 bg-white p-8 shadow-sm">
              <div className="mb-6 flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-100 text-cyan-600"><Calendar className="h-6 w-6" /></div>
                <h2 className="text-2xl font-bold text-slate-900">3. Sử dụng dịch vụ</h2>
              </div>
              <p className="text-slate-600 mb-4">Bạn được phép sử dụng các dịch vụ sau:</p>
              <ul className="space-y-2">
                {['Đặt lịch khám bệnh trực tuyến', 'Xem và quản lý hồ sơ y tế cá nhân', 'Tra cứu kết quả xét nghiệm', 'Thanh toán viện phí trực tuyến', 'Tư vấn sức khỏe từ xa (Telehealth)', 'Nhận thông báo về lịch khám và kết quả'].map((item, i) => (
                  <li key={i} className="flex items-start gap-3"><Check className="mt-0.5 h-5 w-5 text-cyan-600" /><span className="text-slate-700">{item}</span></li>
                ))}
              </ul>
              <div className="mt-6 rounded-xl bg-red-50 p-4">
                <p className="text-sm text-red-800"><strong>Nghiêm cấm:</strong> Sử dụng dịch vụ cho mục đích bất hợp pháp, can thiệp hệ thống, hoặc làm giả thông tin y tế.</p>
              </div>
            </section>

            {/* Section 4 */}
            <section id="payment" className="scroll-mt-24 rounded-2xl border border-slate-100 bg-white p-8 shadow-sm">
              <div className="mb-6 flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-100 text-cyan-600"><CreditCard className="h-6 w-6" /></div>
                <h2 className="text-2xl font-bold text-slate-900">4. Thanh toán</h2>
              </div>
              <ul className="space-y-2">
                {['Chi phí dịch vụ theo bảng giá niêm yết của bệnh viện', 'Chấp nhận thanh toán: Tiền mặt, thẻ ATM/Visa/Master, chuyển khoản, ví điện tử', 'Hóa đơn điện tử được gửi qua email sau thanh toán', 'Hỗ trợ thanh toán bảo hiểm y tế theo quy định', 'Hoàn tiền theo chính sách của bệnh viện (xem mục Hủy lịch)'].map((item, i) => (
                  <li key={i} className="flex items-start gap-3"><Check className="mt-0.5 h-5 w-5 text-cyan-600" /><span className="text-slate-700">{item}</span></li>
                ))}
              </ul>
            </section>

            {/* Section 5 */}
            <section id="cancellation" className="scroll-mt-24 rounded-2xl border border-slate-100 bg-white p-8 shadow-sm">
              <div className="mb-6 flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-100 text-cyan-600"><Clock className="h-6 w-6" /></div>
                <h2 className="text-2xl font-bold text-slate-900">5. Hủy lịch hẹn</h2>
              </div>
              <div className="space-y-4">
                <div className="rounded-xl bg-green-50 p-4">
                  <p className="font-medium text-green-900">Hủy trước 24 giờ</p>
                  <p className="text-sm text-green-800 mt-1">Hoàn tiền 100% hoặc đổi lịch miễn phí</p>
                </div>
                <div className="rounded-xl bg-amber-50 p-4">
                  <p className="font-medium text-amber-900">Hủy trong vòng 24 giờ</p>
                  <p className="text-sm text-amber-800 mt-1">Hoàn tiền 50% chi phí đặt lịch</p>
                </div>
                <div className="rounded-xl bg-red-50 p-4">
                  <p className="font-medium text-red-900">Không đến khám (No-show)</p>
                  <p className="text-sm text-red-800 mt-1">Không hoàn tiền. 3 lần no-show có thể bị hạn chế đặt lịch</p>
                </div>
              </div>
            </section>

            {/* Section 6 */}
            <section id="contact" className="scroll-mt-24 rounded-2xl border border-slate-100 bg-white p-8 shadow-sm">
              <div className="mb-6 flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-100 text-cyan-600"><Phone className="h-6 w-6" /></div>
                <h2 className="text-2xl font-bold text-slate-900">6. Liên hệ hỗ trợ</h2>
              </div>
              <p className="text-slate-600 mb-4">Mọi thắc mắc về điều khoản dịch vụ, vui lòng liên hệ:</p>
              <div className="space-y-3 rounded-xl bg-slate-50 p-4">
                <div className="flex items-center gap-3"><Phone className="h-5 w-5 text-cyan-600" /><span>Hotline: (028) 1234 5678</span></div>
                <div className="flex items-center gap-3"><FileText className="h-5 w-5 text-cyan-600" /><span>Email: support@hospital.com</span></div>
              </div>
            </section>

            {/* Footer */}
            <div className="rounded-2xl bg-slate-100 p-6 text-center">
              <p className="text-sm text-slate-600">Điều khoản có hiệu lực từ <strong>01/01/2025</strong>. Cập nhật lần cuối: <strong>11/01/2025</strong></p>
            </div>
          </div>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
