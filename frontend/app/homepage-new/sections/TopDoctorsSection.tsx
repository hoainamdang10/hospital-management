'use client';

import { Star, MapPin, Award, Calendar } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

const topDoctors = [
    {
        id: '1',
        name: 'BS. Nguyễn Văn An',
        specialty: 'Tim mạch',
        hospital: 'BV Bạch Mai',
        experience: 15,
        rating: 4.9,
        reviews: 127,
        price: '500.000',
        avatar: '/placeholder-doctor-1.jpg',
        verified: true,
    },
    {
        id: '2',
        name: 'BS. Trần Thị Bình',
        specialty: 'Nhi khoa',
        hospital: 'BV Nhi Trung ương',
        experience: 12,
        rating: 4.8,
        reviews: 98,
        price: '450.000',
        avatar: '/placeholder-doctor-2.jpg',
        verified: true,
    },
    {
        id: '3',
        name: 'BS. Lê Hoàng Cường',
        specialty: 'Thần kinh',
        hospital: 'BV Việt Đức',
        experience: 20,
        rating: 5.0,
        reviews: 156,
        price: '600.000',
        avatar: '/placeholder-doctor-3.jpg',
        verified: true,
    },
];

export function TopDoctorsSection() {
    return (
        <section id="doctors" className="bg-slate-50 py-24">
            <div className="container mx-auto px-4">
                <div className="mx-auto max-w-6xl">
                    {/* Section Header */}
                    <div className="mb-16 text-center">
                        <span className="inline-block rounded-full border border-blue-200 bg-blue-50 px-4 py-1.5 text-sm font-semibold text-blue-700">
                            Bác sĩ hàng đầu
                        </span>
                        <h2 className="mt-4 font-heading text-3xl font-bold text-slate-900 sm:text-4xl">
                            Đội ngũ bác sĩ nổi bật
                        </h2>
                        <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-600">
                            Được bệnh nhân tin tưởng và đánh giá cao nhất trên nền tảng
                        </p>
                    </div>

                    {/* Doctors Grid */}
                    <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                        {topDoctors.map((doctor) => (
                            <div
                                key={doctor.id}
                                className="group cursor-pointer rounded-2xl border border-slate-200 bg-white p-6 transition-all duration-300 hover:-translate-y-1 hover:border-slate-300 hover:shadow-2xl"
                            >
                                {/* Doctor Header */}
                                <div className="mb-4 flex items-start gap-4">
                                    {/* Avatar */}
                                    <div className="relative">
                                        <div className="h-16 w-16 overflow-hidden rounded-xl bg-gradient-to-br from-blue-400 to-cyan-400">
                                            {/* Placeholder for avatar */}
                                            <div className="flex h-full w-full items-center justify-center text-2xl font-bold text-white">
                                                {doctor.name.charAt(4)}
                                            </div>
                                        </div>
                                        {doctor.verified && (
                                            <div className="absolute -bottom-1 -right-1 rounded-full bg-white p-0.5">
                                                <div className="rounded-full bg-blue-600 p-0.5">
                                                    <Award className="h-3 w-3 text-white" />
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Name & Specialty */}
                                    <div className="flex-1">
                                        <h3 className="font-heading text-lg font-bold text-slate-900">
                                            {doctor.name}
                                        </h3>
                                        <p className="mt-0.5 text-sm font-semibold text-blue-600">
                                            {doctor.specialty}
                                        </p>
                                        <div className="mt-1 flex items-center gap-1 text-xs text-slate-500">
                                            <MapPin className="h-3 w-3" />
                                            {doctor.hospital}
                                        </div>
                                    </div>
                                </div>

                                {/* Stats */}
                                <div className="mb-4 flex items-center gap-4 border-y border-slate-100 py-3">
                                    <div className="flex items-center gap-1">
                                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                        <span className="text-sm font-bold text-slate-900">{doctor.rating}</span>
                                        <span className="text-xs text-slate-500">({doctor.reviews})</span>
                                    </div>
                                    <div className="h-4 w-px bg-slate-200" />
                                    <div className="text-sm text-slate-600">
                                        <span className="font-semibold text-slate-900">{doctor.experience}</span> năm KN
                                    </div>
                                </div>

                                {/* Price */}
                                <div className="mb-4 flex items-baseline justify-between">
                                    <div>
                                        <span className="text-sm text-slate-500">Phí khám:</span>
                                    </div>
                                    <div className="text-right">
                                        <span className="font-heading text-xl font-bold text-slate-900">
                                            {doctor.price}
                                        </span>
                                        <span className="ml-1 text-sm text-slate-500">đ</span>
                                    </div>
                                </div>

                                {/* Book Button */}
                                <Link
                                    href={`/doctors/${doctor.id}`}
                                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 px-4 py-3 font-semibold text-white shadow-lg shadow-blue-600/20 transition-all hover:scale-[1.02] hover:shadow-xl hover:shadow-blue-600/30"
                                >
                                    <Calendar className="h-4 w-4" />
                                    Đặt lịch khám
                                </Link>
                            </div>
                        ))}
                    </div>

                    {/* View All Button */}
                    <div className="mt-12 text-center">
                        <Link
                            href="/doctors"
                            className="inline-flex items-center gap-2 rounded-xl border-2 border-slate-200 bg-white px-6 py-3 font-semibold text-slate-700 transition-all hover:border-slate-300 hover:bg-slate-50"
                        >
                            Xem tất cả bác sĩ
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
                                    d="M17 8l4 4m0 0l-4 4m4-4H3"
                                />
                            </svg>
                        </Link>
                    </div>
                </div>
            </div>
        </section>
    );
}
