'use client';

import { Search, Calendar, CheckCircle } from 'lucide-react';

const steps = [
    {
        number: '01',
        icon: Search,
        title: 'Tìm kiếm bác sĩ',
        description: 'Chọn chuyên khoa, xem thông tin bác sĩ và đánh giá từ bệnh nhân khác',
        color: 'blue',
    },
    {
        number: '02',
        icon: Calendar,
        title: 'Đặt lịch & Thanh toán',
        description: 'Chọn khung giờ phù hợp và thanh toán trước an toàn qua hệ thống',
        color: 'cyan',
    },
    {
        number: '03',
        icon: CheckCircle,
        title: 'Nhận xác nhận ngay',
        description: 'Nhận thông báo xác nhận qua email và SMS. Đến khám đúng giờ đã đặt',
        color: 'green',
    },
];

const colorClasses = {
    blue: {
        bg: 'bg-blue-100',
        text: 'text-blue-600',
        border: 'border-blue-200',
        gradient: 'from-blue-600 to-cyan-600',
    },
    cyan: {
        bg: 'bg-cyan-100',
        text: 'text-cyan-600',
        border: 'border-cyan-200',
        gradient: 'from-cyan-600 to-blue-600',
    },
    green: {
        bg: 'bg-green-100',
        text: 'text-green-600',
        border: 'border-green-200',
        gradient: 'from-green-600 to-cyan-600',
    },
};

export function HowItWorksSection() {
    return (
        <section id="how-it-works" className="bg-white py-24">
            <div className="container mx-auto px-4">
                <div className="mx-auto max-w-6xl">
                    {/* Section Header */}
                    <div className="mb-16 text-center">
                        <span className="inline-block rounded-full border border-blue-200 bg-blue-50 px-4 py-1.5 text-sm font-semibold text-blue-700">
                            Quy trình đơn giản
                        </span>
                        <h2 className="mt-4 font-heading text-3xl font-bold text-slate-900 sm:text-4xl">
                            Đặt lịch khám chỉ với 3 bước
                        </h2>
                        <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-600">
                            Hệ thống đặt lịch thông minh giúp bạn kết nối với bác sĩ nhanh chóng và tiện lợi
                        </p>
                    </div>

                    {/* Steps */}
                    <div className="grid gap-8 md:grid-cols-3">
                        {steps.map((step, index) => {
                            const Icon = step.icon;
                            const colors = colorClasses[step.color as keyof typeof colorClasses];

                            return (
                                <div
                                    key={step.number}
                                    className="group relative cursor-pointer"
                                >
                                    {/* Connector Line (desktop only) */}
                                    {index < steps.length - 1 && (
                                        <div className="absolute top-16 left-1/2 hidden h-0.5 w-full md:block">
                                            <div className="h-full w-full bg-gradient-to-r from-slate-200 via-slate-300 to-slate-200" />
                                        </div>
                                    )}

                                    {/* Step Card */}
                                    <div className="relative rounded-2xl border-2 border-slate-200 bg-white p-8 transition-all duration-300 hover:border-blue-300 hover:shadow-xl">
                                        {/* Step Number */}
                                        <div className="absolute -top-4 -left-4">
                                            <div className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${colors.gradient} font-heading text-lg font-bold text-white shadow-lg`}>
                                                {step.number}
                                            </div>
                                        </div>

                                        {/* Icon */}
                                        <div className="mb-6 flex justify-center">
                                            <div className={`rounded-2xl ${colors.bg} p-4 transition-transform group-hover:scale-110`}>
                                                <Icon className={`h-8 w-8 ${colors.text}`} />
                                            </div>
                                        </div>

                                        {/* Content */}
                                        <h3 className="mb-3 text-center font-heading text-xl font-bold text-slate-900">
                                            {step.title}
                                        </h3>
                                        <p className="text-center text-slate-600">
                                            {step.description}
                                        </p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Bottom CTA */}
                    <div className="mt-16 text-center">
                        <p className="text-sm text-slate-500">
                            <strong className="font-semibold text-slate-900">Hoàn toàn miễn phí</strong> khi đặt lịch qua nền tảng
                        </p>
                    </div>
                </div>
            </div>
        </section>
    );
}
