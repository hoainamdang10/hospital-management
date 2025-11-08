'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

/**
 * FAQ Page
 * Route: /faq
 */
export default function FAQPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-primary py-20">
        <div className="container mx-auto px-4">
          <h1 className="text-center text-4xl font-bold text-white md:text-5xl">
            Câu hỏi thường gặp
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-center text-lg text-white/90">
            Tìm câu trả lời cho các câu hỏi phổ biến
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-16">
        <div className="mx-auto max-w-3xl space-y-8">
          {/* Đặt lịch khám */}
          <FAQSection title="Đặt lịch khám">
            <FAQItem
              question="Làm thế nào để đặt lịch khám?"
              answer="Bạn có thể đặt lịch khám trực tuyến qua website hoặc ứng dụng di động của chúng tôi. Chỉ cần đăng ký tài khoản, chọn bác sĩ và khung giờ phù hợp."
            />
            <FAQItem
              question="Tôi có thể hủy hoặc thay đổi lịch hẹn không?"
              answer="Có, bạn có thể hủy hoặc thay đổi lịch hẹn trước 24 giờ. Vui lòng đăng nhập vào tài khoản và quản lý lịch hẹn của bạn."
            />
            <FAQItem
              question="Thời gian chờ khám trung bình là bao lâu?"
              answer="Thời gian chờ trung bình là 15-30 phút tùy thuộc vào chuyên khoa. Chúng tôi luôn cố gắng đúng giờ hẹn."
            />
          </FAQSection>

          {/* Thanh toán */}
          <FAQSection title="Thanh toán & Bảo hiểm">
            <FAQItem
              question="Các hình thức thanh toán nào được chấp nhận?"
              answer="Chúng tôi chấp nhận tiền mặt, thẻ ATM, thẻ tín dụng, chuyển khoản và các ví điện tử phổ biến."
            />
            <FAQItem
              question="Bệnh viện có chấp nhận bảo hiểm y tế không?"
              answer="Có, chúng tôi chấp nhận bảo hiểm y tế bắt buộc và hầu hết các loại bảo hiểm thương mại. Vui lòng mang theo thẻ bảo hiểm khi đến khám."
            />
            <FAQItem
              question="Làm thế nào để thanh toán trực tuyến?"
              answer="Sau khi khám, bạn sẽ nhận được hóa đơn điện tử qua email. Bạn có thể thanh toán trực tuyến qua cổng thanh toán an toàn của chúng tôi."
            />
          </FAQSection>

          {/* Hồ sơ bệnh án */}
          <FAQSection title="Hồ sơ bệnh án">
            <FAQItem
              question="Làm thế nào để xem hồ sơ bệnh án của tôi?"
              answer="Đăng nhập vào tài khoản và truy cập mục 'Hồ sơ bệnh án'. Tất cả lịch sử khám bệnh, kết quả xét nghiệm và đơn thuốc đều được lưu trữ điện tử."
            />
            <FAQItem
              question="Tôi có thể tải xuống kết quả xét nghiệm không?"
              answer="Có, bạn có thể tải xuống tất cả kết quả xét nghiệm và hồ sơ khám bệnh dưới dạng PDF."
            />
          </FAQSection>

          {/* Cấp cứu */}
          <FAQSection title="Cấp cứu">
            <FAQItem
              question="Khoa cấp cứu có hoạt động 24/7 không?"
              answer="Có, khoa cấp cứu của chúng tôi hoạt động 24/7 với đội ngũ bác sĩ và y tá trực suốt ngày đêm."
            />
            <FAQItem
              question="Số điện thoại cấp cứu là gì?"
              answer="Vui lòng gọi 115 hoặc hotline cấp cứu của bệnh viện: (028) 1234 5678."
            />
          </FAQSection>
        </div>
      </div>
    </div>
  );
}

function FAQSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="mb-4 text-2xl font-bold text-gray-900">{title}</h2>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="rounded-lg border bg-white shadow-sm">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between p-6 text-left"
      >
        <span className="font-semibold text-gray-900">{question}</span>
        {isOpen ? (
          <ChevronUp className="h-5 w-5 text-gray-500" />
        ) : (
          <ChevronDown className="h-5 w-5 text-gray-500" />
        )}
      </button>
      {isOpen && (
        <div className="border-t px-6 py-4">
          <p className="text-gray-600">{answer}</p>
        </div>
      )}
    </div>
  );
}
