'use client';

import Link from 'next/link';
import { Facebook, Twitter, Instagram, Linkedin, Mail, Phone, MapPin } from 'lucide-react';

export function Footer() {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="bg-slate-900 text-slate-300">
            <div className="container mx-auto px-4">
                {/* Main Footer */}
                <div className="grid gap-12 py-16 md:grid-cols-2 lg:grid-cols-4">
                    {/* Brand Column */}
                    <div>
                        <Link href="/" className="flex items-center gap-2">
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
                            <span className="font-heading text-xl font-bold text-white">
                                MediCare<span className="text-blue-500">+</span>
                            </span>
                        </Link>
                        <p className="mt-4 text-sm leading-relaxed">
                            Nền tảng đặt lịch khám bệnh trực tuyến hàng đầu Việt Nam. Kết nối bạn với hơn 500+ bác sĩ chuyên khoa uy tín.
                        </p>
                        <div className="mt-6 flex gap-3">
                            <a
                                href="https://facebook.com"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-800 text-slate-400 transition-colors hover:bg-blue-600 hover:text-white"
                                aria-label="Facebook"
                            >
                                <Facebook className="h-5 w-5" />
                            </a>
                            <a
                                href="https://twitter.com"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-800 text-slate-400 transition-colors hover:bg-cyan-500 hover:text-white"
                                aria-label="Twitter"
                            >
                                <Twitter className="h-5 w-5" />
                            </a>
                            <a
                                href="https://instagram.com"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-800 text-slate-400 transition-colors hover:bg-pink-600 hover:text-white"
                                aria-label="Instagram"
                            >
                                <Instagram className="h-5 w-5" />
                            </a>
                            <a
                                href="https://linkedin.com"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-800 text-slate-400 transition-colors hover:bg-blue-700 hover:text-white"
                                aria-label="LinkedIn"
                            >
                                <Linkedin className="h-5 w-5" />
                            </a>
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h3 className="mb-4 font-heading text-base font-bold text-white">Liên kết nhanh</h3>
                        <ul className="space-y-3 text-sm">
                            <li>
                                <Link href="/about" className="transition-colors hover:text-blue-400">
                                    Về chúng tôi
                                </Link>
                            </li>
                            <li>
                                <Link href="/specialties" className="transition-colors hover:text-blue-400">
                                    Chuyên khoa
                                </Link>
                            </li>
                            <li>
                                <Link href="/doctors" className="transition-colors hover:text-blue-400">
                                    Bác sĩ
                                </Link>
                            </li>
                            <li>
                                <Link href="/blog" className="transition-colors hover:text-blue-400">
                                    Tin tức y tế
                                </Link>
                            </li>
                            <li>
                                <Link href="/careers" className="transition-colors hover:text-blue-400">
                                    Tuyển dụng
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Support */}
                    <div>
                        <h3 className="mb-4 font-heading text-base font-bold text-white">Hỗ trợ</h3>
                        <ul className="space-y-3 text-sm">
                            <li>
                                <Link href="/help" className="transition-colors hover:text-blue-400">
                                    Trung tâm trợ giúp
                                </Link>
                            </li>
                            <li>
                                <Link href="/faq" className="transition-colors hover:text-blue-400">
                                    Câu hỏi thường gặp
                                </Link>
                            </li>
                            <li>
                                <Link href="/terms" className="transition-colors hover:text-blue-400">
                                    Điều khoản dịch vụ
                                </Link>
                            </li>
                            <li>
                                <Link href="/privacy" className="transition-colors hover:text-blue-400">
                                    Chính sách bảo mật
                                </Link>
                            </li>
                            <li>
                                <Link href="/contact" className="transition-colors hover:text-blue-400">
                                    Liên hệ
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Contact Info */}
                    <div>
                        <h3 className="mb-4 font-heading text-base font-bold text-white">Liên hệ</h3>
                        <ul className="space-y-4 text-sm">
                            <li className="flex items-start gap-3">
                                <MapPin className="h-5 w-5 flex-shrink-0 text-blue-500" />
                                <span>123 Đường ABC, Quận 1, TP. Hồ Chí Minh, Việt Nam</span>
                            </li>
                            <li className="flex items-center gap-3">
                                <Phone className="h-5 w-5 flex-shrink-0 text-blue-500" />
                                <a href="tel:1900xxxx" className="transition-colors hover:text-blue-400">
                                    1900-xxxx (Miễn phí)
                                </a>
                            </li>
                            <li className="flex items-center gap-3">
                                <Mail className="h-5 w-5 flex-shrink-0 text-blue-500" />
                                <a href="mailto:support@medicare.vn" className="transition-colors hover:text-blue-400">
                                    support@medicare.vn
                                </a>
                            </li>
                        </ul>
                        <div className="mt-6">
                            <p className="text-xs text-slate-400">Giờ làm việc:</p>
                            <p className="mt-1 text-sm font-medium text-white">
                                Thứ 2 - Thứ 7: 7:00 - 22:00
                            </p>
                            <p className="text-sm font-medium text-white">
                                Chủ nhật: 8:00 - 20:00
                            </p>
                        </div>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="border-t border-slate-800 py-6">
                    <div className="flex flex-col items-center justify-between gap-4 text-sm sm:flex-row">
                        <p className="text-slate-400">
                            © {currentYear} MediCare+. Bảo lưu mọi quyền.
                        </p>
                        <div className="flex flex-wrap items-center justify-center gap-6">
                            <Link href="/terms" className="text-slate-400 transition-colors hover:text-blue-400">
                                Điều khoản
                            </Link>
                            <Link href="/privacy" className="text-slate-400 transition-colors hover:text-blue-400">
                                Bảo mật
                            </Link>
                            <Link href="/cookies" className="text-slate-400 transition-colors hover:text-blue-400">
                                Cookies
                            </Link>
                            <Link href="/sitemap" className="text-slate-400 transition-colors hover:text-blue-400">
                                Sitemap
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
}
