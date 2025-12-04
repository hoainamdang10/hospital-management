'use client';

import { ShieldCheck, DollarSign, CreditCard, Bell, Clock, FileText, Award, Lock } from 'lucide-react';

const features = [
    {
        icon: ShieldCheck,
        title: 'Bác sĩ được xác minh',
        description: 'Tất cả bác sĩ đều có chứng chỉ hành nghề được Bộ Y Tế cấp và xác thực',
        gradient: 'from-blue-600 to-cyan-600',
    },
    {
        icon: DollarSign,
        title: 'Giá cả minh bạch',
        description: 'Biết rõ chi phí khám trước khi đặt lịch, không phát sinh thêm bất kỳ khoản phí nào',
        gradient: 'from-cyan-600 to-blue-600',
    },
    {
        icon: CreditCard,
        title: 'Thanh toán trước an toàn',
        description: 'Hỗ trợ đa dạng phương thức: Thẻ ATM, Visa, Mastercard, ví điện tử',
        gradient: 'from-green-600 to-cyan-600',
    },
    {
        icon: Bell,
        title: 'Nhắc nhở tự động',
        description: 'Nhận thông báo qua SMS và email trước 24h và 2h để không bỏ lỡ lịch hẹn',
        gradient: 'from-purple-600 to-blue-600',
    },
    {
        icon: Clock,
        title: 'Đặt lịch 24/7',
        description: 'Hệ thống hoạt động liên tục, đặt lịch bất cứ lúc nào từ điện thoại hoặc máy tính',
        gradient: 'from-orange-600 to-red-600',
    },
    {
        icon: FileText,
        title: 'Hồ sơ điện tử',
        description: 'Lưu trữ toàn bộ lịch sử khám, đơn thuốc và kết quả xét nghiệm trên ứng dụng',
        gradient: 'from-indigo-600 to-purple-600',
    },
    {
        icon: Award,
        title: 'Đội ngũ chuyên môn cao',
        description: 'Bác sĩ 10-30 năm kinh nghiệm từ các bệnh viện hàng đầu Việt Nam',
        gradient: 'from-yellow-600 to-orange-600',
    },
    {
        icon: Lock,
        title: 'Bảo mật tuyệt đối',
        description: 'Mã hóa SSL 256-bit, tuân thủ quy định bảo mật y tế quốc tế (HIPAA)',
        gradient: 'from-red-600 to-pink-600',
    },
];

export function FeaturesSection() {
    return (
        <section className="bg-slate-50 py-24">
            <div className="container mx-auto px-4">
                <div className="mx-auto max-w-6xl">
                    {/* Section Header */}
                    <div className="mb-16 text-center">
                        <span className="inline-block rounded-full border border-blue-200 bg-blue-50 px-4 py-1.5 text-sm font-semibold text-blue-700">
                            Tại sao chọn chúng tôi
                        </span>
                        <h2 className="mt-4 font-heading text-3xl font-bold text-slate-900 sm:text-4xl">
                            Trải nghiệm đặt lịch khám hiện đại nhất
                        </h2>
                        <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-600">
                            Chúng tôi cam kết mang đến dịch vụ y tế chất lượng cao với công nghệ tiên tiến
                        </p>
                    </div>

                    {/* Features Grid */}
                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                        {features.map((feature, index) => {
                            const Icon = feature.icon;

                            return (
                                <div
                                    key={index}
                                    className="group cursor-pointer rounded-2xl border border-slate-200 bg-white p-6 transition-all duration-300 hover:-translate-y-1 hover:border-slate-300 hover:shadow-xl"
                                >
                                    {/* Icon */}
                                    <div className="mb-4">
                                        <div className={`inline-flex rounded-xl bg-gradient-to-br ${feature.gradient} p-3 shadow-lg transition-transform group-hover:scale-110`}>
                                            <Icon className="h-6 w-6 text-white" />
                                        </div>
                                    </div>

                                    {/* Content */}
                                    <h3 className="mb-2 font-heading text-lg font-bold text-slate-900">
                                        {feature.title}
                                    </h3>
                                    <p className="text-sm leading-relaxed text-slate-600">
                                        {feature.description}
                                    </p>
                                </div>
                            );
                        })}
                    </div>

                    {/* Bottom Stats */}
                    <div className="mt-16 grid gap-8 rounded-2xl border border-slate-200 bg-white p-8 sm:grid-cols-3">
                        <div className="text-center">
                            <div className="font-heading text-4xl font-bold text-blue-600">99.8%</div>
                            <div className="mt-2 text-sm font-medium text-slate-600">
                                Tỷ lệ bệnh nhân hài lòng
                            </div>
                        </div>
                        <div className="text-center">
                            <div className="font-heading text-4xl font-bold text-cyan-600">{'<'}2 phút</div>
                            <div className="mt-2 text-sm font-medium text-slate-600">
                                Thời gian đặt lịch trung bình
                            </div>
                        </div>
                        <div className="text-center">
                            <div className="font-heading text-4xl font-bold text-green-600">100K+</div>
                            <div className="mt-2 text-sm font-medium text-slate-600">
                                Lượt khám thành công
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
