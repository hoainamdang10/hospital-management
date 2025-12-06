'use client';

import { motion } from 'framer-motion';
import { Shield, Eye, Database, Users, Lock, Cookie, Mail, Phone, MapPin, ChevronRight, Check, AlertCircle, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PublicNavbar } from '@/components/layout/PublicNavbar';
import { PublicFooter } from '@/components/layout/PublicFooter';

const tableOfContents = [
  { id: 'collection', title: 'Thu thập thông tin', icon: Database },
  { id: 'usage', title: 'Sử dụng thông tin', icon: Users },
  { id: 'security', title: 'Bảo mật thông tin', icon: Lock },
  { id: 'sharing', title: 'Chia sẻ thông tin', icon: Shield },
  { id: 'rights', title: 'Quyền của bạn', icon: Eye },
  { id: 'cookies', title: 'Cookies', icon: Cookie },
  { id: 'contact', title: 'Liên hệ', icon: Mail },
];

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      <PublicNavbar />

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-cyan-900 pt-32 pb-20">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(6,182,212,0.15),transparent_50%)]" />
        <div className="container relative z-10 mx-auto px-4 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-cyan-500/20 text-cyan-400">
              <Shield className="h-8 w-8" />
            </div>
            <h1 className="mb-4 text-4xl font-bold tracking-tight text-white sm:text-5xl">Chính sách Bảo mật</h1>
            <p className="mx-auto max-w-2xl text-lg text-slate-300">Cam kết bảo vệ thông tin cá nhân và quyền riêng tư của bạn</p>
            <div className="mt-6 flex items-center justify-center gap-4 text-sm text-slate-400">
              <span className="flex items-center gap-1"><FileText className="h-4 w-4" />Cập nhật: 01/01/2025</span>
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
            </div>
          </aside>

          {/* Content */}
          <div className="lg:col-span-3 space-y-8">
            <div className="flex gap-4 rounded-2xl border border-cyan-200 bg-cyan-50 p-6">
              <AlertCircle className="h-6 w-6 text-cyan-600 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-cyan-900">Cam kết của chúng tôi</h3>
                <p className="mt-1 text-cyan-800">Bảo vệ thông tin theo Nghị định 13/2023/NĐ-CP và tiêu chuẩn quốc tế.</p>
              </div>
            </div>

            {/* Section 1 */}
            <section id="collection" className="scroll-mt-24 rounded-2xl border border-slate-100 bg-white p-8 shadow-sm">
              <div className="mb-6 flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-100 text-cyan-600"><Database className="h-6 w-6" /></div>
                <h2 className="text-2xl font-bold text-slate-900">1. Thu thập thông tin</h2>
              </div>
              <p className="mb-4 text-slate-600">Chúng tôi thu thập thông tin khi bạn đăng ký, đặt lịch khám hoặc sử dụng dịch vụ:</p>
              <ul className="space-y-2">
                {['Họ tên, ngày sinh, giới tính', 'Địa chỉ, số điện thoại, email', 'Số CMND/CCCD, số thẻ BHYT', 'Thông tin y tế liên quan'].map((item, i) => (
                  <li key={i} className="flex items-start gap-3"><Check className="mt-0.5 h-5 w-5 text-cyan-600" /><span className="text-slate-700">{item}</span></li>
                ))}
              </ul>
            </section>

            {/* Section 2 */}
            <section id="usage" className="scroll-mt-24 rounded-2xl border border-slate-100 bg-white p-8 shadow-sm">
              <div className="mb-6 flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-100 text-cyan-600"><Users className="h-6 w-6" /></div>
                <h2 className="text-2xl font-bold text-slate-900">2. Sử dụng thông tin</h2>
              </div>
              <ul className="space-y-2">
                {['Cung cấp dịch vụ y tế và chăm sóc sức khỏe', 'Quản lý lịch hẹn và hồ sơ bệnh án', 'Gửi thông báo về lịch khám, kết quả', 'Xử lý thanh toán và bảo hiểm', 'Tuân thủ quy định pháp luật'].map((item, i) => (
                  <li key={i} className="flex items-start gap-3"><Check className="mt-0.5 h-5 w-5 text-cyan-600" /><span className="text-slate-700">{item}</span></li>
                ))}
              </ul>
            </section>

            {/* Section 3 */}
            <section id="security" className="scroll-mt-24 rounded-2xl border border-slate-100 bg-white p-8 shadow-sm">
              <div className="mb-6 flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-100 text-cyan-600"><Lock className="h-6 w-6" /></div>
                <h2 className="text-2xl font-bold text-slate-900">3. Bảo mật thông tin</h2>
              </div>
              <ul className="space-y-2">
                {['Mã hóa SSL/TLS cho dữ liệu truyền tải', 'Mã hóa AES-256 cho dữ liệu lưu trữ', 'Kiểm soát truy cập theo vai trò', 'Sao lưu định kỳ và kế hoạch khôi phục', 'Tuân thủ ISO 27001 và Nghị định 13/2023'].map((item, i) => (
                  <li key={i} className="flex items-start gap-3"><Check className="mt-0.5 h-5 w-5 text-cyan-600" /><span className="text-slate-700">{item}</span></li>
                ))}
              </ul>
            </section>

            {/* Section 4 */}
            <section id="sharing" className="scroll-mt-24 rounded-2xl border border-slate-100 bg-white p-8 shadow-sm">
              <div className="mb-6 flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-100 text-cyan-600"><Shield className="h-6 w-6" /></div>
                <h2 className="text-2xl font-bold text-slate-900">4. Chia sẻ thông tin</h2>
              </div>
              <p className="mb-4 text-slate-600">Chúng tôi không bán thông tin. Chỉ chia sẻ với:</p>
              <ul className="space-y-2">
                {['Bác sĩ và nhân viên y tế điều trị', 'Phòng xét nghiệm được ủy quyền', 'Công ty bảo hiểm (khi thanh toán)', 'Cơ quan có thẩm quyền (theo pháp luật)'].map((item, i) => (
                  <li key={i} className="flex items-start gap-3"><Check className="mt-0.5 h-5 w-5 text-cyan-600" /><span className="text-slate-700">{item}</span></li>
                ))}
              </ul>
            </section>

            {/* Section 5 */}
            <section id="rights" className="scroll-mt-24 rounded-2xl border border-slate-100 bg-white p-8 shadow-sm">
              <div className="mb-6 flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-100 text-cyan-600"><Eye className="h-6 w-6" /></div>
                <h2 className="text-2xl font-bold text-slate-900">5. Quyền của bạn</h2>
              </div>
              <ul className="space-y-2">
                {['Quyền được biết thông tin đang thu thập', 'Quyền truy cập và tải xuống thông tin', 'Quyền chỉnh sửa thông tin không chính xác', 'Quyền xóa thông tin (theo pháp luật)', 'Quyền rút lại sự đồng ý', 'Quyền khiếu nại đến cơ quan bảo vệ dữ liệu'].map((item, i) => (
                  <li key={i} className="flex items-start gap-3"><Check className="mt-0.5 h-5 w-5 text-cyan-600" /><span className="text-slate-700">{item}</span></li>
                ))}
              </ul>
            </section>

            {/* Section 6 */}
            <section id="cookies" className="scroll-mt-24 rounded-2xl border border-slate-100 bg-white p-8 shadow-sm">
              <div className="mb-6 flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-100 text-cyan-600"><Cookie className="h-6 w-6" /></div>
                <h2 className="text-2xl font-bold text-slate-900">6. Cookies</h2>
              </div>
              <p className="text-slate-600">Website sử dụng cookies để cải thiện trải nghiệm. Bạn có thể tắt cookies trong trình duyệt.</p>
            </section>

            {/* Section 7 */}
            <section id="contact" className="scroll-mt-24 rounded-2xl border border-slate-100 bg-white p-8 shadow-sm">
              <div className="mb-6 flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-100 text-cyan-600"><Mail className="h-6 w-6" /></div>
                <h2 className="text-2xl font-bold text-slate-900">7. Liên hệ</h2>
              </div>
              <div className="space-y-3 rounded-xl bg-slate-50 p-4">
                <div className="flex items-center gap-3"><Mail className="h-5 w-5 text-cyan-600" /><span>privacy@hospital.com</span></div>
                <div className="flex items-center gap-3"><Phone className="h-5 w-5 text-cyan-600" /><span>(028) 1234 5678</span></div>
                <div className="flex items-center gap-3"><MapPin className="h-5 w-5 text-cyan-600" /><span>123 Đường ABC, Quận 1, TP.HCM</span></div>
              </div>
            </section>

            <div className="rounded-2xl bg-slate-100 p-6 text-center">
              <p className="text-sm text-slate-600">Có hiệu lực từ <strong>01/01/2025</strong>. Sẽ thông báo khi có cập nhật.</p>
            </div>
          </div>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
