'use client';

import { Heart, Baby, Bone, Eye, Brain, Stethoscope, Activity, Smile } from 'lucide-react';
import Link from 'next/link';

const specialties = [
    {
        id: 'cardiology',
        name: 'Tim mạch',
        icon: Heart,
        doctorCount: 45,
        color: 'red',
    },
    {
        id: 'pediatrics',
        name: 'Nhi khoa',
        icon: Baby,
        doctorCount: 62,
        color: 'pink',
    },
    {
        id: 'orthopedics',
        name: 'Cơ xương khớp',
        icon: Bone,
        doctorCount: 38,
        color: 'orange',
    },
    {
        id: 'ophthalmology',
        name: 'Nhãn khoa',
        icon: Eye,
        doctorCount: 28,
        color: 'cyan',
    },
    {
        id: 'neurology',
        name: 'Thần kinh',
        icon: Brain,
        doctorCount: 34,
        color: 'purple',
    },
    {
        id: 'general',
        name: 'Đa khoa',
        icon: Stethoscope,
        doctorCount: 89,
        color: 'blue',
    },
    {
        id: 'emergency',
        name: 'Cấp cứu',
        icon: Activity,
        doctorCount: 52,
        color: 'red',
    },
    {
        id: 'dental',
        name: 'Nha khoa',
        icon: Smile,
        doctorCount: 41,
        color: 'green',
    },
];

const colorClasses = {
    red: 'from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600',
    pink: 'from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600',
    orange: 'from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600',
    cyan: 'from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600',
    purple: 'from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600',
    blue: 'from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600',
    green: 'from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600',
};

export function SpecialtiesSection() {
    return (
        <section id="specialties" className="bg-white py-24">
            <div className="container mx-auto px-4">
                <div className="mx-auto max-w-6xl">
                    {/* Section Header */}
                    <div className="mb-16 text-center">
                        <span className="inline-block rounded-full border border-blue-200 bg-blue-50 px-4 py-1.5 text-sm font-semibold text-blue-700">
                            Chuyên khoa
                        </span>
                        <h2 className="mt-4 font-heading text-3xl font-bold text-slate-900 sm:text-4xl">
                            Các chuyên khoa phổ biến
                        </h2>
                        <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-600">
                            Đội ngũ bác sĩ chuyên môn cao trong tất cả các lĩnh vực y khoa
                        </p>
                    </div>

                    {/* Specialties Grid */}
                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                        {specialties.map((specialty) => {
                            const Icon = specialty.icon;
                            const gradientClass = colorClasses[specialty.color as keyof typeof colorClasses];

                            return (
                                <Link
                                    key={specialty.id}
                                    href={`/specialties/${specialty.id}`}
                                    className="group cursor-pointer"
                                >
                                    <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 transition-all duration-300 hover:-translate-y-1 hover:border-slate-300 hover:shadow-xl">
                                        {/* Background Gradient on Hover */}
                                        <div className={`absolute inset-0 bg-gradient-to-br ${gradientClass} opacity-0 transition-opacity duration-300 group-hover:opacity-5`} />

                                        {/* Content */}
                                        <div className="relative">
                                            {/* Icon */}
                                            <div className="mb-4 inline-flex">
                                                <div className={`rounded-xl bg-gradient-to-br ${gradientClass} p-3 shadow-lg transition-transform group-hover:scale-110`}>
                                                    <Icon className="h-7 w-7 text-white" />
                                                </div>
                                            </div>

                                            {/* Text */}
                                            <h3 className="mb-2 font-heading text-xl font-bold text-slate-900">
                                                {specialty.name}
                                            </h3>
                                            <p className="text-sm font-medium text-slate-600">
                                                {specialty.doctorCount} bác sĩ
                                            </p>

                                            {/* Arrow indicator */}
                                            <div className="mt-4 flex items-center gap-2 text-sm font-semibold text-blue-600 opacity-0 transition-opacity group-hover:opacity-100">
                                                Xem bác sĩ
                                                <svg
                                                    className="h-4 w-4 transition-transform group-hover:translate-x-1"
                                                    fill="none"
                                                    viewBox="0 0 24 24"
                                                    stroke="currentColor"
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth={2}
                                                        d="M9 5l7 7-7 7"
                                                    />
                                                </svg>
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>

                    {/* View All Button */}
                    <div className="mt-12 text-center">
                        <Link
                            href="/specialties"
                            className="inline-flex items-center gap-2 rounded-xl border-2 border-slate-200 bg-white px-6 py-3 font-semibold text-slate-700 transition-all hover:border-slate-300 hover:bg-slate-50"
                        >
                            Xem tất cả chuyên khoa
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
