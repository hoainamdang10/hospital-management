'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { X, Home, ArrowLeft } from 'lucide-react';
import PublicLayout from '@/components/layout/PublicLayout';
import Swal from 'sweetalert2';

export default function PaymentCancelPage() {
    const router = useRouter();
    const searchParams = useSearchParams();

    useEffect(() => {
        // Show cancellation message immediately
        Swal.fire({
            title: 'Thanh toán đã hủy',
            text: 'Bạn đã hủy quá trình thanh toán. Bạn có muốn thử lại không?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Thử lại',
            cancelButtonText: 'Không, về trang chủ'
        }).then((result) => {
            if (result.isConfirmed) {
                handleTryAgain();
            } else {
                router.push('/patient/dashboard');
            }
        });
    }, []);

    const handleTryAgain = () => {
        // Redirect to the doctor details page
        try {
            const pendingBooking = localStorage.getItem('pendingBooking');
            if (pendingBooking) {
                const bookingData = JSON.parse(pendingBooking);
                if (bookingData.doctorId) {
                    router.push(`/doctors/${bookingData.doctorId}`);
                    return;
                }
            }
        } catch (error) {
            console.error('Error parsing pending booking:', error);
        }

        // Fall back to doctor listing if we can't get the specific doctor
        router.push('/doctors');
    };

    return (
        <PublicLayout currentPage="payment">
            <div className="min-h-screen bg-gray-50 py-12">
                <div className="container mx-auto px-4">
                    <div className="max-w-3xl mx-auto">
                        <Card className="shadow-lg border-0">
                            <CardContent className="p-8 text-center">
                                <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <X className="h-10 w-10 text-red-600" />
                                </div>

                                <h1 className="text-3xl font-bold text-gray-900 mb-2">Thanh toán đã bị hủy</h1>
                                <p className="text-gray-600 mb-8">
                                    Bạn đã hủy quá trình thanh toán hoặc có lỗi xảy ra trong quá trình xử lý.
                                </p>

                                <div className="space-y-4">
                                    <Button
                                        onClick={handleTryAgain}
                                        className="w-full bg-blue-600 hover:bg-blue-700 py-6 text-lg"
                                    >
                                        <ArrowLeft className="mr-2 h-5 w-5" />
                                        Thử lại
                                    </Button>

                                    <Button
                                        variant="outline"
                                        onClick={() => router.push('/patient/dashboard')}
                                        className="w-full py-5"
                                    >
                                        <Home className="mr-2 h-5 w-5" />
                                        Về trang chủ
                                    </Button>
                                </div>

                                <p className="mt-8 text-sm text-gray-500">
                                    Nếu bạn gặp vấn đề khi thanh toán, vui lòng thử lại hoặc liên hệ với bộ phận hỗ trợ của chúng tôi.
                                </p>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </PublicLayout>
    );
}