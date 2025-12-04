'use client';

import { Calendar, ArrowRight, Sparkles } from 'lucide-react';
import Link from 'next/link';

export function CTASection() {
    return (
        <section className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-cyan-600 to-blue-700 py-24">
            {/* Background Pattern */}
            <div className="absolute inset-0 -z-10">
                <div className="absolute top-0 left-0 h-full w-full opacity-10">
                    <div className="absolute top-10 left-10 h-64 w-64 rounded-full bg-white blur-3xl" />
                    <div className="absolute bottom-10 right-10 h-96 w-96 rounded-full bg-white blur-3xl" />
                </div>
            </div>

            <div className="container relative mx-auto px-4">
                <div className="mx-auto max-w-4xl text-center">
                    {/* Badge */}
                    <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-4 py-2 backdrop-blur-sm">
                        <Sparkles className="h-4 w-4 text-yellow-300" />
                        <span className="text-sm font-semibold text-white">
                            Ưu đãi đặc biệt cho người dùng mới
                        </span>
                    </div>

                    {/* Heading */}
                    <h2 className="font-heading text-4xl font-bold text-white sm:text-5xl lg:text-6xl">
                        Bắt đầu chăm sóc sức khỏe <br className="hidden sm:block" />
                        của bạn ngay hôm nay
                    </h2>

                    {/* Subcopy */}
                    <p className="mx-auto mt-6 max-w-2xl text-lg text-blue-50 sm:text-xl">
                        Tham gia cùng hơn <strong className="font-semibold text-white">100.000+ bệnh nhân</strong> đã tin tưởng
                        sử dụng nền tảng đặt lịch khám trực tuyến hàng đầu Việt Nam
                    </p>

                    {/* CTA Buttons */}
                    <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
                        <Link
                            href="#quick-search"
                            className="group flex w-full items-center justify-center gap-2 rounded-xl bg-white px-8 py-4 text-base font-semibold text-blue-600 shadow-2xl transition-all hover:scale-105 hover:bg-blue-50 sm:w-auto"
                        >
                            <Calendar className="h-5 w-5" />
                            Đặt lịch khám ngay
                            <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                        </Link>

                        <Link
                            href="/register"
                            className="group flex w-full items-center justify-center gap-2 rounded-xl border-2 border-white/30 bg-white/10 px-8 py-4 text-base font-semibold text-white backdrop-blur-sm transition-all hover:bg-white/20 sm:w-auto"
                        >
                            Đăng ký miễn phí
                            <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                        </Link>
                    </div>

                    {/* Trust Indicators */}
                    <div className="mt-12 flex flex-wrap items-center justify-center gap-8 text-sm text-blue-100">
                        <div className="flex items-center gap-2">
                            <svg
                                className="h-5 w-5 text-green-300"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                            >
                                <path
                                    fillRule="evenodd"
                                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                    clipRule="evenodd"
                                />
                            </svg>
                            <span className="font-medium">Không cần thẻ tín dụng</span>
                        </div>
                        <span className="text-blue-300">•</span>
                        <div className="flex items-center gap-2">
                            <svg
                                className="h-5 w-5 text-green-300"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                            >
                                <path
                                    fillRule="evenodd"
                                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                    clipRule="evenodd"
                                />
                            </svg>
                            <span className="font-medium">Hủy lịch miễn phí (trước 24h)</span>
                        </div>
                        <span className="text-blue-300">•</span>
                        <div className="flex items-center gap-2">
                            <svg
                                className="h-5 w-5 text-green-300"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                            >
                                <path
                                    fillRule="evenodd"
                                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                    clipRule="evenodd"
                                />
                            </svg>
                            <span className="font-medium">Hỗ trợ 24/7</span>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
