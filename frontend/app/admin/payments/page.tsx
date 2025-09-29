'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function PaymentsRedirectPage() {
    const router = useRouter();

    useEffect(() => {
        // Redirect từ /admin/payments → /admin/payment-simple
        router.replace('/admin/payment-simple');
    }, [router]);

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Đang chuyển hướng đến trang quản lý thanh toán...</p>
            </div>
        </div>
    );
}
