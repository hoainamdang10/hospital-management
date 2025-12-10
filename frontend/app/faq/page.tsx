'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronDown, Search, HelpCircle, Calendar, CreditCard,
  FileText, Ambulance, Phone, MessageCircle, ArrowRight
} from 'lucide-react';
import { PublicNavbar } from '@/components/layout/PublicNavbar';
import { PublicFooter } from '@/components/layout/PublicFooter';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

// FAQ Categories with icons
const faqCategories = [
  { id: 'booking', label: 'Đặt lịch khám', icon: Calendar, color: 'bg-blue-100 text-blue-600' },
  { id: 'payment', label: 'Thanh toán & Bảo hiểm', icon: CreditCard, color: 'bg-green-100 text-green-600' },
  { id: 'records', label: 'Hồ sơ bệnh án', icon: FileText, color: 'bg-purple-100 text-purple-600' },
  { id: 'emergency', label: 'Cấp cứu', icon: Ambulance, color: 'bg-red-100 text-red-600' },
];

// FAQ Data
const faqData = [
  {
    category: 'booking',
    questions: [
      {
        question: 'Làm thế nào để đặt lịch khám?',
        answer: 'Bạn có thể đặt lịch khám trực tuyến qua website hoặc ứng dụng di động của chúng tôi. Chỉ cần đăng ký tài khoản, chọn bác sĩ và khung giờ phù hợp. Hệ thống sẽ gửi xác nhận qua SMS và email ngay sau khi đặt lịch thành công.',
      },
      {
        question: 'Tôi có thể hủy hoặc thay đổi lịch hẹn không?',
        answer: 'Có, bạn có thể hủy hoặc thay đổi lịch hẹn trước 24 giờ mà không mất phí. Vui lòng đăng nhập vào tài khoản và quản lý lịch hẹn của bạn trong mục "Lịch hẹn của tôi".',
      },
      {
        question: 'Thời gian chờ khám trung bình là bao lâu?',
        answer: 'Thời gian chờ trung bình là 15-30 phút tùy thuộc vào chuyên khoa. Chúng tôi luôn cố gắng đúng giờ hẹn và sẽ thông báo nếu có thay đổi.',
      },
      {
        question: 'Tôi có thể đặt lịch khám cho người thân không?',
        answer: 'Có, bạn hoàn toàn có thể đặt lịch khám cho người thân. Chỉ cần chọn "Đặt cho người khác" khi đặt lịch và điền đầy đủ thông tin của họ.',
      },
    ],
  },
  {
    category: 'payment',
    questions: [
      {
        question: 'Các hình thức thanh toán nào được chấp nhận?',
        answer: 'Chúng tôi chấp nhận đa dạng hình thức thanh toán: tiền mặt, thẻ ATM/Visa/Master, chuyển khoản ngân hàng, VNPay, MoMo, ZaloPay và các ví điện tử phổ biến khác.',
      },
      {
        question: 'Bệnh viện có chấp nhận bảo hiểm y tế không?',
        answer: 'Có, chúng tôi chấp nhận bảo hiểm y tế bắt buộc (BHYT nhà nước) và hầu hết các loại bảo hiểm thương mại như Bảo Việt, Prudential, Manulife, AIA... Vui lòng mang theo thẻ bảo hiểm khi đến khám.',
      },
      {
        question: 'Làm thế nào để thanh toán trực tuyến?',
        answer: 'Sau khi khám, bạn sẽ nhận được hóa đơn điện tử qua email. Bạn có thể thanh toán trực tuyến qua cổng thanh toán an toàn VNPay hoặc sử dụng ví điện tử trong ứng dụng.',
      },
      {
        question: 'Tôi có được hoàn tiền nếu hủy lịch không?',
        answer: 'Nếu bạn đã thanh toán trước và hủy lịch trước 24 giờ, bạn sẽ được hoàn 100% vào ví điện tử hoặc tài khoản ngân hàng trong vòng 3-5 ngày làm việc.',
      },
    ],
  },
  {
    category: 'records',
    questions: [
      {
        question: 'Làm thế nào để xem hồ sơ bệnh án của tôi?',
        answer: 'Đăng nhập vào tài khoản và truy cập mục "Hồ sơ bệnh án". Tất cả lịch sử khám bệnh, kết quả xét nghiệm và đơn thuốc đều được lưu trữ điện tử và có thể xem bất cứ lúc nào.',
      },
      {
        question: 'Tôi có thể tải xuống kết quả xét nghiệm không?',
        answer: 'Có, bạn có thể tải xuống tất cả kết quả xét nghiệm, hình ảnh chẩn đoán và hồ sơ khám bệnh dưới dạng PDF để in hoặc chia sẻ với bác sĩ khác.',
      },
      {
        question: 'Hồ sơ bệnh án có được bảo mật không?',
        answer: 'Chúng tôi áp dụng các tiêu chuẩn bảo mật cao nhất để bảo vệ thông tin y tế của bạn. Dữ liệu được mã hóa và chỉ bạn hoặc người được ủy quyền mới có thể truy cập.',
      },
    ],
  },
  {
    category: 'emergency',
    questions: [
      {
        question: 'Khoa cấp cứu có hoạt động 24/7 không?',
        answer: 'Có, khoa cấp cứu của chúng tôi hoạt động 24/7, 365 ngày trong năm với đội ngũ bác sĩ và y tá chuyên trách trực suốt ngày đêm.',
      },
      {
        question: 'Số điện thoại cấp cứu là gì?',
        answer: 'Vui lòng gọi 115 (đường dây nóng quốc gia) hoặc hotline cấp cứu của bệnh viện: (028) 1234 5678. Đội ngũ sẵn sàng hỗ trợ bạn bất cứ lúc nào.',
      },
      {
        question: 'Bệnh viện có dịch vụ xe cấp cứu không?',
        answer: 'Có, chúng tôi có đội xe cấp cứu 24/7 được trang bị đầy đủ thiết bị y tế hiện đại. Gọi hotline để được hỗ trợ ngay lập tức.',
      },
    ],
  },
];

export default function FAQPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [openItems, setOpenItems] = useState<string[]>([]);

  const toggleItem = (id: string) => {
    setOpenItems((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Filter FAQs based on search and category
  const filteredFAQs = faqData
    .filter((cat) => activeCategory === 'all' || cat.category === activeCategory)
    .map((cat) => ({
      ...cat,
      questions: cat.questions.filter(
        (q) =>
          q.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
          q.answer.toLowerCase().includes(searchQuery.toLowerCase())
      ),
    }))
    .filter((cat) => cat.questions.length > 0);

  const totalQuestions = filteredFAQs.reduce((acc, cat) => acc + cat.questions.length, 0);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <PublicNavbar />

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-cyan-600 via-blue-600 to-indigo-700 pt-32 pb-20">
        {/* Background decorations */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:32px_32px]" />
        <div className="absolute -left-20 top-0 h-96 w-96 rounded-full bg-cyan-400/20 blur-3xl" />
        <div className="absolute -right-20 bottom-0 h-96 w-96 rounded-full bg-indigo-400/20 blur-3xl" />

        <div className="container relative mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mx-auto max-w-3xl text-center"
          >
            <span className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-medium text-white backdrop-blur-sm">
              <HelpCircle className="h-4 w-4" />
              Trung tâm hỗ trợ
            </span>
            <h1 className="mb-6 text-4xl font-bold tracking-tight text-white md:text-5xl lg:text-6xl">
              Câu hỏi thường gặp
            </h1>
            <p className="mb-8 text-lg text-cyan-100/90 md:text-xl">
              Tìm câu trả lời nhanh cho các thắc mắc phổ biến về dịch vụ y tế của chúng tôi
            </p>

            {/* Search Box */}
            <div className="relative mx-auto max-w-xl">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
              <Input
                type="text"
                placeholder="Tìm kiếm câu hỏi..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-14 rounded-2xl border-0 bg-white pl-12 pr-4 text-slate-900 shadow-xl placeholder:text-slate-400 focus:ring-2 focus:ring-cyan-400"
              />
            </div>
          </motion.div>
        </div>
      </section>

      {/* Category Tabs */}
      <section className="container mx-auto -mt-8 px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex flex-wrap justify-center gap-3"
        >
          <button
            onClick={() => setActiveCategory('all')}
            className={`cursor-pointer rounded-full px-6 py-3 text-sm font-medium shadow-lg transition-all duration-200 ${activeCategory === 'all'
                ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-cyan-200'
                : 'bg-white text-slate-600 hover:bg-slate-50 hover:shadow-xl'
              }`}
          >
            Tất cả ({faqData.reduce((acc, cat) => acc + cat.questions.length, 0)})
          </button>
          {faqCategories.map((cat) => {
            const Icon = cat.icon;
            const count = faqData.find((f) => f.category === cat.id)?.questions.length || 0;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`cursor-pointer flex items-center gap-2 rounded-full px-6 py-3 text-sm font-medium shadow-lg transition-all duration-200 ${activeCategory === cat.id
                    ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-cyan-200'
                    : 'bg-white text-slate-600 hover:bg-slate-50 hover:shadow-xl'
                  }`}
              >
                <Icon className="h-4 w-4" />
                {cat.label} ({count})
              </button>
            );
          })}
        </motion.div>
      </section>

      {/* FAQ Content */}
      <section className="container mx-auto px-4 py-16">
        <div className="mx-auto max-w-4xl">
          {/* Results count */}
          {searchQuery && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mb-6 text-center text-slate-500"
            >
              Tìm thấy <span className="font-semibold text-cyan-600">{totalQuestions}</span> kết quả cho "{searchQuery}"
            </motion.p>
          )}

          {/* FAQ Sections */}
          <div className="space-y-8">
            {filteredFAQs.map((section, sectionIndex) => {
              const category = faqCategories.find((c) => c.id === section.category);
              const Icon = category?.icon || HelpCircle;

              return (
                <motion.div
                  key={section.category}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: sectionIndex * 0.1 }}
                >
                  {/* Section Header */}
                  <div className="mb-4 flex items-center gap-3">
                    <div className={`rounded-xl p-2.5 ${category?.color || 'bg-slate-100 text-slate-600'}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <h2 className="text-xl font-bold text-slate-900">{category?.label}</h2>
                  </div>

                  {/* Questions */}
                  <div className="space-y-3">
                    {section.questions.map((item, index) => {
                      const itemId = `${section.category}-${index}`;
                      const isOpen = openItems.includes(itemId);

                      return (
                        <motion.div
                          key={itemId}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all duration-200 hover:shadow-md"
                        >
                          <button
                            onClick={() => toggleItem(itemId)}
                            className="flex w-full cursor-pointer items-center justify-between p-5 text-left transition-colors hover:bg-slate-50"
                          >
                            <span className="pr-4 font-semibold text-slate-900">{item.question}</span>
                            <motion.div
                              animate={{ rotate: isOpen ? 180 : 0 }}
                              transition={{ duration: 0.2 }}
                              className="flex-shrink-0 rounded-full bg-slate-100 p-2"
                            >
                              <ChevronDown className="h-4 w-4 text-slate-500" />
                            </motion.div>
                          </button>
                          <AnimatePresence>
                            {isOpen && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.2 }}
                              >
                                <div className="border-t border-slate-100 bg-slate-50/50 px-5 py-4">
                                  <p className="leading-relaxed text-slate-600">{item.answer}</p>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </motion.div>
                      );
                    })}
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* No Results */}
          {filteredFAQs.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="py-16 text-center"
            >
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100">
                <Search className="h-8 w-8 text-slate-400" />
              </div>
              <h3 className="mb-2 text-lg font-semibold text-slate-900">Không tìm thấy kết quả</h3>
              <p className="text-slate-500">Thử tìm kiếm với từ khóa khác hoặc liên hệ với chúng tôi</p>
            </motion.div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 pb-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mx-auto max-w-4xl"
        >
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-cyan-600 via-blue-600 to-indigo-700 p-8 md:p-12">
            <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
            <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-cyan-400/20 blur-3xl" />

            <div className="relative grid items-center gap-8 md:grid-cols-2">
              <div>
                <h3 className="mb-4 text-2xl font-bold text-white md:text-3xl">
                  Không tìm thấy câu trả lời?
                </h3>
                <p className="text-cyan-100/90">
                  Đội ngũ hỗ trợ của chúng tôi sẵn sàng giải đáp mọi thắc mắc của bạn 24/7.
                </p>
              </div>
              <div className="flex flex-col gap-4 sm:flex-row md:justify-end">
                <Link href="/contact">
                  <Button className="w-full cursor-pointer gap-2 bg-white text-cyan-700 hover:bg-cyan-50 sm:w-auto">
                    <MessageCircle className="h-4 w-4" />
                    Liên hệ hỗ trợ
                  </Button>
                </Link>
                <Button variant="outline" className="w-full cursor-pointer gap-2 border-white/30 bg-white/10 text-white backdrop-blur-sm hover:bg-white/20 sm:w-auto">
                  <Phone className="h-4 w-4" />
                  (028) 1234 5678
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      <PublicFooter />
    </div>
  );
}
