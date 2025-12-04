'use client';

import { useState } from 'react';
import { Menu, X, Calendar, User, ChevronDown } from 'lucide-react';
import Link from 'next/link';

export function Navbar() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    return (
        <nav className="fixed top-4 left-4 right-4 z-50 mx-auto max-w-7xl">
            <div className="rounded-2xl border border-slate-200 bg-white/95 shadow-lg shadow-slate-900/5 backdrop-blur-lg transition-all duration-200">
                <div className="flex items-center justify-between px-6 py-4">
                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-2 transition-opacity hover:opacity-80">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-cyan-600">
                            <svg
                                className="h-6 w-6 text-white"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2.5}
                                    d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                                />
                            </svg>
                        </div>
                        <span className="font-heading text-xl font-bold text-slate-900">
                            MediCare<span className="text-blue-600">+</span>
                        </span>
                    </Link>

                    {/* Desktop Navigation */}
                    <div className="hidden items-center gap-8 lg:flex">
                        <Link
                            href="#specialties"
                            className="text-sm font-medium text-slate-600 transition-colors hover:text-blue-600"
                        >
                            Chuyên khoa
                        </Link>
                        <Link
                            href="#doctors"
                            className="text-sm font-medium text-slate-600 transition-colors hover:text-blue-600"
                        >
                            Bác sĩ
                        </Link>
                        <Link
                            href="#how-it-works"
                            className="text-sm font-medium text-slate-600 transition-colors hover:text-blue-600"
                        >
                            Cách hoạt động
                        </Link>
                        <Link
                            href="#faq"
                            className="text-sm font-medium text-slate-600 transition-colors hover:text-blue-600"
                        >
                            Câu hỏi thường gặp
                        </Link>
                    </div>

                    {/* CTA Buttons */}
                    <div className="hidden items-center gap-3 lg:flex">
                        <Link
                            href="/auth/login"
                            className="group flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-700 transition-all hover:bg-slate-50"
                        >
                            <User className="h-4 w-4" />
                            Đăng nhập
                        </Link>
                        <Link
                            href="#book-appointment"
                            className="group flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/30 transition-all hover:shadow-xl hover:shadow-blue-600/40"
                        >
                            <Calendar className="h-4 w-4" />
                            Đặt lịch ngay
                        </Link>
                    </div>

                    {/* Mobile Menu Button */}
                    <button
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        className="rounded-lg p-2 text-slate-600 transition-colors hover:bg-slate-100 lg:hidden"
                        aria-label="Toggle menu"
                    >
                        {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                    </button>
                </div>

                {/* Mobile Menu */}
                {isMenuOpen && (
                    <div className="border-t border-slate-100 px-6 py-4 lg:hidden">
                        <div className="flex flex-col gap-4">
                            <Link
                                href="#specialties"
                                className="text-sm font-medium text-slate-600 transition-colors hover:text-blue-600"
                                onClick={() => setIsMenuOpen(false)}
                            >
                                Chuyên khoa
                            </Link>
                            <Link
                                href="#doctors"
                                className="text-sm font-medium text-slate-600 transition-colors hover:text-blue-600"
                                onClick={() => setIsMenuOpen(false)}
                            >
                                Bác sĩ
                            </Link>
                            <Link
                                href="#how-it-works"
                                className="text-sm font-medium text-slate-600 transition-colors hover:text-blue-600"
                                onClick={() => setIsMenuOpen(false)}
                            >
                                Cách hoạt động
                            </Link>
                            <Link
                                href="#faq"
                                className="text-sm font-medium text-slate-600 transition-colors hover:text-blue-600"
                                onClick={() => setIsMenuOpen(false)}
                            >
                                Câu hỏi thường gặp
                            </Link>
                            <div className="flex flex-col gap-2 border-t border-slate-100 pt-4">
                                <Link
                                    href="/auth/login"
                                    className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition-all hover:bg-slate-50"
                                >
                                    <User className="h-4 w-4" />
                                    Đăng nhập
                                </Link>
                                <Link
                                    href="#book-appointment"
                                    className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg"
                                >
                                    <Calendar className="h-4 w-4" />
                                    Đặt lịch ngay
                                </Link>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </nav>
    );
}
