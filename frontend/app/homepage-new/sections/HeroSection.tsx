'use client';

import { ArrowRight, Shield, Star, Users } from 'lucide-react';
import Link from 'next/link';

export function HeroSection() {
    return (
        <section className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-white to-cyan-50 pt-32 pb-20 lg:pt-40 lg:pb-32">
            {/* Background Decorations */}
            <div className="absolute inset-0 -z-10">
                <div className="absolute top-0 right-0 h-[600px] w-[600px] rounded-full bg-gradient-to-br from-blue-100/40 to-cyan-100/40 blur-3xl" />
                <div className="absolute bottom-0 left-0 h-[500px] w-[500px] rounded-full bg-gradient-to-tr from-cyan-100/30 to-blue-100/30 blur-3xl" />
            </div>

            <div className="container mx-auto px-4">
                <div className="mx-auto max-w-4xl text-center">
                    {/* Badge */}
                    <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50/80 px-4 py-2 backdrop-blur-sm">
                        <span className="flex h-2 w-2">
                            <span className="absolute inline-flex h-2 w-2 animate-ping rounded-full bg-blue-400 opacity-75" />
                            <span className="relative inline-flex h-2 w-2 rounded-full bg-blue-500" />
                        </span>
                        <span className="text-sm font-semibold text-blue-700">
                            Nền tảng đặt lịch khám trực tuyến hàng đầu Việt Nam
                        </span>
                    </div>

                    {/* Heading */}
                    <h1 className="font-heading text-5xl font-bold leading-tight tracking-tight text-slate-900 sm:text-6xl lg:text-7xl">
                        Đặt lịch khám bệnh{' '}
                        <span className="bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                            chỉ trong 60 giây
                        </span>
                    </h1>

                    {/* Subcopy */}
                    <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-slate-600 sm:text-xl">
                        Kết nối với hơn <strong className="font-semibold text-slate-900">500+ bác sĩ chuyên khoa</strong> uy tín.
                        Thanh toán trước an toàn. Nhận lịch hẹn ngay lập tức.
                    </p>

                    {/* CTA Buttons */}
                    <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
                        <Link
                            href="#quick-search"
                            className="group flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 px-8 py-4 text-base font-semibold text-white shadow-xl shadow-blue-600/30 transition-all hover:scale-105 hover:shadow-2xl hover:shadow-blue-600/40 sm:w-auto"
                        >
                            Đặt lịch khám ngay
                            <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                        </Link>
                        <Link
                            href="#how-it-works"
                            className="group flex w-full items-center justify-center gap-2 rounded-xl border-2 border-slate-200 bg-white px-8 py-4 text-base font-semibold text-slate-700 transition-all hover:border-slate-300 hover:bg-slate-50 sm:w-auto"
                        >
                            Tìm hiểu thêm
                            <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                        </Link>
                    </div>

                    {/* Social Proof Stats */}
                    <div className="mt-16 grid grid-cols-1 gap-8 sm:grid-cols-3">
                        <div className="rounded-2xl border border-slate-200 bg-white/80 p-6 backdrop-blur-sm transition-all hover:shadow-lg">
                            <div className="mb-2 flex items-center justify-center">
                                <div className="rounded-xl bg-blue-100 p-3">
                                    <Users className="h-6 w-6 text-blue-600" />
                                </div>
                            </div>
                            <div className="font-heading text-3xl font-bold text-slate-900">500+</div>
                            <div className="mt-1 text-sm font-medium text-slate-600">Bác sĩ chuyên khoa</div>
                        </div>

                        <div className="rounded-2xl border border-slate-200 bg-white/80 p-6 backdrop-blur-sm transition-all hover:shadow-lg">
                            <div className="mb-2 flex items-center justify-center">
                                <div className="rounded-xl bg-cyan-100 p-3">
                                    <Shield className="h-6 w-6 text-cyan-600" />
                                </div>
                            </div>
                            <div className="font-heading text-3xl font-bold text-slate-900">100%</div>
                            <div className="mt-1 text-sm font-medium text-slate-600">Bảo mật thanh toán</div>
                        </div>

                        <div className="rounded-2xl border border-slate-200 bg-white/80 p-6 backdrop-blur-sm transition-all hover:shadow-lg">
                            <div className="mb-2 flex items-center justify-center">
                                <div className="rounded-xl bg-green-100 p-3">
                                    <Star className="h-6 w-6 text-green-600" />
                                </div>
                            </div>
                            <div className="font-heading text-3xl font-bold text-slate-900">4.9/5</div>
                            <div className="mt-1 text-sm font-medium text-slate-600">Đánh giá từ bệnh nhân</div>
                        </div>
                    </div>

                    {/* Trust Indicators */}
                    <div className="mt-12 flex flex-wrap items-center justify-center gap-4 text-sm text-slate-500">
                        <div className="flex items-center gap-2">
                            <Shield className="h-4 w-4 text-green-600" />
                            <span>Chứng nhận bởi Bộ Y Tế</span>
                        </div>
                        <span className="text-slate-300">•</span>
                        <div className="flex items-center gap-2">
                            <Shield className="h-4 w-4 text-blue-600" />
                            <span>Thanh toán an toàn 256-bit SSL</span>
                        </div>
                        <span className="text-slate-300">•</span>
                        <div className="flex items-center gap-2">
                            <Shield className="h-4 w-4 text-purple-600" />
                            <span>Đã phục vụ 100K+ bệnh nhân</span>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
