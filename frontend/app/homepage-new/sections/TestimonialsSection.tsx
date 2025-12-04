'use client';

import { Star, Quote } from 'lucide-react';

const testimonials = [
    {
        id: '1',
        name: 'Nguyễn Thị Mai',
        location: 'Hà Nội',
        rating: 5,
        comment: 'Đặt lịch rất nhanh, chỉ mất 2 phút. Bác sĩ tận tâm, khám rất kỹ. Tôi rất hài lòng với dịch vụ.',
        specialty: 'Tim mạch',
        date: '2 ngày trước',
    },
    {
        id: '2',
        name: 'Trần Văn Bình',
        location: 'TP. HCM',
        rating: 5,
        comment: 'Thanh toán trước tiện lợi, không phải chờ đợi khi đến bệnh viện. Hệ thống nhắc lịch rất chu đáo.',
        specialty: 'Nhi khoa',
        date: '1 tuần trước',
    },
    {
        id: '3',
        name: 'Lê Thị Hương',
        location: 'Đà Nẵng',
        rating: 5,
        comment: 'Lần đầu tiên tôi thấy đặt lịch khám bệnh dễ dàng đến vậy. Giao diện đẹp, dễ sử dụng. Rất recommend!',
        specialty: 'Da liễu',
        date: '3 ngày trước',
    },
    {
        id: '4',
        name: 'Phạm Minh Tuấn',
        location: 'Hải Phòng',
        rating: 5,
        comment: 'Đội ngũ bác sĩ chuyên nghiệp, nhiều năm kinh nghiệm. Giá cả rõ ràng, không phát sinh thêm chi phí.',
        specialty: 'Cơ xương khớp',
        date: '5 ngày trước',
    },
    {
        id: '5',
        name: 'Hoàng Thị Lan',
        location: 'Cần Thơ',
        rating: 5,
        comment: 'Tôi đã khám cho con qua nền tảng này. Rất yên tâm vì bác sĩ được xác minh rõ ràng.',
        specialty: 'Nhi khoa',
        date: '1 tuần trước',
    },
    {
        id: '6',
        name: 'Vũ Đức Anh',
        location: 'Hà Nội',
        rating: 5,
        comment: 'Hỗ trợ nhiều phương thức thanh toán, rất tiện. Nhân viên CSKH nhiệt tình, giải đáp nhanh chóng.',
        specialty: 'Thần kinh',
        date: '4 ngày trước',
    },
];

export function TestimonialsSection() {
    return (
        <section className="bg-white py-24">
            <div className="container mx-auto px-4">
                <div className="mx-auto max-w-6xl">
                    {/* Section Header */}
                    <div className="mb-16 text-center">
                        <span className="inline-block rounded-full border border-blue-200 bg-blue-50 px-4 py-1.5 text-sm font-semibold text-blue-700">
                            Đánh giá từ bệnh nhân
                        </span>
                        <h2 className="mt-4 font-heading text-3xl font-bold text-slate-900 sm:text-4xl">
                            Hơn 50.000 bệnh nhân tin tưởng
                        </h2>
                        <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-600">
                            Những chia sẻ chân thực từ bệnh nhân đã sử dụng dịch vụ của chúng tôi
                        </p>
                    </div>

                    {/* Testimonials Grid */}
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {testimonials.map((testimonial) => (
                            <div
                                key={testimonial.id}
                                className="group relative cursor-pointer rounded-2xl border border-slate-200 bg-white p-6 transition-all duration-300 hover:-translate-y-1 hover:border-slate-300 hover:shadow-xl"
                            >
                                {/* Quote Icon */}
                                <div className="absolute -top-3 -right-3 rounded-full bg-gradient-to-br from-blue-600 to-cyan-600 p-2 shadow-lg">
                                    <Quote className="h-5 w-5 text-white" fill="currentColor" />
                                </div>

                                {/* Rating */}
                                <div className="mb-4 flex items-center gap-1">
                                    {[...Array(testimonial.rating)].map((_, i) => (
                                        <Star
                                            key={i}
                                            className="h-5 w-5 fill-yellow-400 text-yellow-400"
                                        />
                                    ))}
                                </div>

                                {/* Comment */}
                                <p className="mb-6 text-slate-700 leading-relaxed">
                                    "{testimonial.comment}"
                                </p>

                                {/* Author Info */}
                                <div className="flex items-center justify-between border-t border-slate-100 pt-4">
                                    <div>
                                        <div className="font-semibold text-slate-900">{testimonial.name}</div>
                                        <div className="mt-0.5 text-sm text-slate-500">{testimonial.location}</div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-xs font-semibold text-blue-600">{testimonial.specialty}</div>
                                        <div className="mt-0.5 text-xs text-slate-400">{testimonial.date}</div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Trust Badge */}
                    <div className="mt-16 text-center">
                        <div className="inline-flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-6 py-4">
                            <div className="flex items-center">
                                <Star className="h-6 w-6 fill-yellow-400 text-yellow-400" />
                                <Star className="h-6 w-6 fill-yellow-400 text-yellow-400 -ml-1" />
                                <Star className="h-6 w-6 fill-yellow-400 text-yellow-400 -ml-1" />
                                <Star className="h-6 w-6 fill-yellow-400 text-yellow-400 -ml-1" />
                                <Star className="h-6 w-6 fill-yellow-400 text-yellow-400 -ml-1" />
                            </div>
                            <div className="border-l border-slate-300 pl-3 text-left">
                                <div className="font-heading text-2xl font-bold text-slate-900">4.9/5</div>
                                <div className="text-sm text-slate-600">từ 2,547 đánh giá</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
