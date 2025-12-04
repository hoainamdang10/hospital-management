'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

const faqs = [
    {
        question: 'Làm thế nào để đặt lịch khám?',
        answer: 'Rất đơn giản! Bạn chỉ cần: (1) Tìm kiếm bác sĩ theo chuyên khoa hoặc tên, (2) Chọn khung giờ phù hợp, (3) Điền thông tin và thanh toán. Bạn sẽ nhận được xác nhận ngay qua email và SMS.',
    },
    {
        question: 'Tôi có thể thanh toán bằng cách nào?',
        answer: 'Chúng tôi hỗ trợ đa dạng phương thức thanh toán: Thẻ ATM nội địa, Visa/Mastercard, ví điện tử (Momo, ZaloPay, VNPay), và chuyển khoản ngân hàng. Tất cả đều được mã hóa bảo mật 256-bit SSL.',
    },
    {
        question: 'Phí đặt lịch bao gồm những gì?',
        answer: 'Phí khám đã bao gồm: chi phí khám bệnh với bác sĩ, hồ sơ bệnh án điện tử, và dịch vụ nhắc lịch. Chúng tôi minh bạch 100% về giá cả, không phát sinh thêm bất kỳ chi phí ẩn nào.',
    },
    {
        question: 'Tôi có thể hủy hoặc đổi lịch hẹn không?',
        answer: 'Có. Bạn có thể hủy hoặc đổi lịch hẹn miễn phí trước 24 giờ. Nếu hủy trong vòng 24 giờ trước lịch hẹn, phí đặt lịch sẽ không được hoàn lại. Để đổi lịch, vui lòng truy cập mục "Lịch hẹn của tôi" trong tài khoản.',
    },
    {
        question: 'Làm sao biết bác sĩ có uy tín không?',
        answer: 'Tất cả bác sĩ trên nền tảng đều được xác minh chứng chỉ hành nghề từ Bộ Y Tế. Bạn có thể xem hồ sơ chi tiết: học vấn, kinh nghiệm, chuyên môn, và đánh giá từ bệnh nhân khác trước khi đặt lịch.',
    },
    {
        question: 'Dữ liệu y tế của tôi có được bảo mật không?',
        answer: 'Tuyệt đối an toàn. Chúng tôi tuân thủ tiêu chuẩn bảo mật y tế quốc tế (HIPAA) và sử dụng mã hóa SSL 256-bit. Thông tin của bạn chỉ được chia sẻ với bác sĩ điều trị và không bao giờ được tiết lộ cho bên thứ ba.',
    },
    {
        question: 'Tôi có nhận được nhắc nhở về lịch hẹn không?',
        answer: 'Có. Hệ thống tự động gửi nhắc nhở qua SMS và Email trước 24 giờ và 2 giờ trước lịch hẹn. Bạn cũng có thể bật thông báo trên ứng dụng di động để không bỏ lỡ bất kỳ lịch hẹn nào.',
    },
    {
        question: 'Nếu tôi cần hỗ trợ thì liên hệ ai?',
        answer: 'Đội ngũ CSKH của chúng tôi sẵn sàng hỗ trợ 24/7 qua: Hotline 1900-xxxx, Email support@medicare.vn, hoặc Live Chat trên website. Chúng tôi cam kết phản hồi trong vòng 15 phút.',
    },
];

export function FAQSection() {
    const [openIndex, setOpenIndex] = useState<number | null>(0);

    const toggleFAQ = (index: number) => {
        setOpenIndex(openIndex === index ? null : index);
    };

    return (
        <section id="faq" className="bg-slate-50 py-24">
            <div className="container mx-auto px-4">
                <div className="mx-auto max-w-4xl">
                    {/* Section Header */}
                    <div className="mb-16 text-center">
                        <span className="inline-block rounded-full border border-blue-200 bg-blue-50 px-4 py-1.5 text-sm font-semibold text-blue-700">
                            Câu hỏi thường gặp
                        </span>
                        <h2 className="mt-4 font-heading text-3xl font-bold text-slate-900 sm:text-4xl">
                            Giải đáp mọi thắc mắc của bạn
                        </h2>
                        <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-600">
                            Tìm câu trả lời nhanh chóng cho các câu hỏi phổ biến
                        </p>
                    </div>

                    {/* FAQ List */}
                    <div className="space-y-4">
                        {faqs.map((faq, index) => (
                            <div
                                key={index}
                                className="overflow-hidden rounded-2xl border border-slate-200 bg-white transition-all duration-200 hover:border-slate-300 hover:shadow-lg"
                            >
                                <button
                                    onClick={() => toggleFAQ(index)}
                                    className="flex w-full cursor-pointer items-center justify-between p-6 text-left transition-colors hover:bg-slate-50"
                                >
                                    <span className="font-heading text-lg font-semibold text-slate-900 pr-4">
                                        {faq.question}
                                    </span>
                                    <ChevronDown
                                        className={`h-5 w-5 flex-shrink-0 text-slate-400 transition-transform duration-200 ${openIndex === index ? 'rotate-180' : ''
                                            }`}
                                    />
                                </button>

                                {/* Answer */}
                                <div
                                    className={`overflow-hidden transition-all duration-200 ${openIndex === index ? 'max-h-96' : 'max-h-0'
                                        }`}
                                >
                                    <div className="border-t border-slate-100 px-6 py-4">
                                        <p className="leading-relaxed text-slate-600">
                                            {faq.answer}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Contact Support */}
                    <div className="mt-12 rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50 to-cyan-50 p-8 text-center">
                        <h3 className="font-heading text-xl font-bold text-slate-900">
                            Vẫn còn thắc mắc?
                        </h3>
                        <p className="mt-2 text-slate-600">
                            Đội ngũ hỗ trợ của chúng tôi sẵn sàng giúp bạn 24/7
                        </p>
                        <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
                            <a
                                href="tel:1900xxxx"
                                className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-blue-600 bg-white px-6 py-3 font-semibold text-blue-600 transition-all hover:bg-blue-50 sm:w-auto"
                            >
                                <svg
                                    className="h-5 w-5"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                                    />
                                </svg>
                                Gọi hotline
                            </a>
                            <a
                                href="mailto:support@medicare.vn"
                                className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 px-6 py-3 font-semibold text-white shadow-lg shadow-blue-600/30 transition-all hover:shadow-xl sm:w-auto"
                            >
                                <svg
                                    className="h-5 w-5"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                                    />
                                </svg>
                                Gửi email
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
