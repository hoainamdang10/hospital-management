'use client';

import { useState } from 'react';
import { Search, MapPin, Calendar, ArrowRight } from 'lucide-react';

export function QuickSearchSection() {
    const [searchQuery, setSearchQuery] = useState('');
    const [location, setLocation] = useState('');
    const [date, setDate] = useState('');

    const handleSearch = () => {
        // Handle search logic
        console.log({ searchQuery, location, date });
    };

    return (
        <section id="quick-search" className="relative -mt-16 pb-24">
            <div className="container mx-auto px-4">
                <div className="mx-auto max-w-5xl">
                    {/* Search Card */}
                    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl shadow-slate-900/10 sm:p-8">
                        <div className="mb-6 text-center">
                            <h2 className="font-heading text-2xl font-bold text-slate-900">
                                Tìm kiếm bác sĩ phù hợp
                            </h2>
                            <p className="mt-2 text-sm text-slate-600">
                                Nhập thông tin để tìm bác sĩ và đặt lịch ngay
                            </p>
                        </div>

                        {/* Search Form */}
                        <div className="grid gap-4 sm:grid-cols-3">
                            {/* Search Input */}
                            <div className="relative">
                                <label htmlFor="search" className="mb-2 block text-sm font-semibold text-slate-700">
                                    Chuyên khoa hoặc bác sĩ
                                </label>
                                <div className="relative">
                                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                                        <Search className="h-5 w-5 text-slate-400" />
                                    </div>
                                    <input
                                        id="search"
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        placeholder="VD: Tim mạch, BS. Nguyễn..."
                                        className="block w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-slate-900 placeholder:text-slate-400 transition-colors focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                    />
                                </div>
                            </div>

                            {/* Location Input */}
                            <div className="relative">
                                <label htmlFor="location" className="mb-2 block text-sm font-semibold text-slate-700">
                                    Địa điểm
                                </label>
                                <div className="relative">
                                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                                        <MapPin className="h-5 w-5 text-slate-400" />
                                    </div>
                                    <select
                                        id="location"
                                        value={location}
                                        onChange={(e) => setLocation(e.target.value)}
                                        className="block w-full cursor-pointer appearance-none rounded-xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-10 text-slate-900 transition-colors focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                    >
                                        <option value="">Chọn thành phố</option>
                                        <option value="hanoi">Hà Nội</option>
                                        <option value="hcm">TP. Hồ Chí Minh</option>
                                        <option value="danang">Đà Nẵng</option>
                                        <option value="haiphong">Hải Phòng</option>
                                        <option value="cantho">Cần Thơ</option>
                                    </select>
                                </div>
                            </div>

                            {/* Date Input */}
                            <div className="relative">
                                <label htmlFor="date" className="mb-2 block text-sm font-semibold text-slate-700">
                                    Ngày khám
                                </label>
                                <div className="relative">
                                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                                        <Calendar className="h-5 w-5 text-slate-400" />
                                    </div>
                                    <input
                                        id="date"
                                        type="date"
                                        value={date}
                                        onChange={(e) => setDate(e.target.value)}
                                        min={new Date().toISOString().split('T')[0]}
                                        className="block w-full cursor-pointer rounded-xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-slate-900 transition-colors focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Search Button */}
                        <button
                            onClick={handleSearch}
                            className="group mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 px-6 py-4 font-semibold text-white shadow-lg shadow-blue-600/30 transition-all hover:scale-[1.02] hover:shadow-xl hover:shadow-blue-600/40"
                        >
                            Tìm kiếm bác sĩ
                            <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                        </button>

                        {/* Popular Searches */}
                        <div className="mt-6 flex flex-wrap items-center gap-2">
                            <span className="text-sm font-medium text-slate-500">Tìm kiếm phổ biến:</span>
                            {['Tim mạch', 'Nhi khoa', 'Da liễu', 'Tai mũi họng'].map((term) => (
                                <button
                                    key={term}
                                    onClick={() => setSearchQuery(term)}
                                    className="cursor-pointer rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm font-medium text-slate-700 transition-all hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
                                >
                                    {term}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
