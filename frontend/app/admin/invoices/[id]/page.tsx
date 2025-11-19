'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
    ArrowLeft,
    Printer,
    Download,
    FileText,
    User,
    CreditCard
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DashboardLayout } from '@/components/layout';
import { billingService, Invoice } from '@/lib/api/billing.service';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { toast } from 'sonner';

export default function InvoiceDetailPage() {
    const router = useRouter();
    const params = useParams();
    const id = params?.id as string;

    const [invoice, setInvoice] = useState<Invoice | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchInvoice = async () => {
            if (!id) return;
            setIsLoading(true);
            try {
                const res = await billingService.getInvoice(id);
                if (res.success && res.data) {
                    setInvoice(res.data);
                } else {
                    toast.error('Không tìm thấy hóa đơn');
                    router.push('/admin/invoices');
                }
            } catch (error) {
                console.error('Failed to fetch invoice:', error);
                toast.error('Lỗi khi tải thông tin hóa đơn');
            } finally {
                setIsLoading(false);
            }
        };

        fetchInvoice();
    }, [id, router]);

    const handlePrint = () => {
        window.print();
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'PAID':
                return <span className="inline-flex items-center rounded-full border border-green-200 bg-green-100 px-2.5 py-0.5 text-xs font-semibold text-green-700 hover:bg-green-100">Đã thanh toán</span>;
            case 'PENDING':
                return <span className="inline-flex items-center rounded-full border border-yellow-200 bg-yellow-100 px-2.5 py-0.5 text-xs font-semibold text-yellow-700 hover:bg-yellow-100">Chưa thanh toán</span>;
            case 'OVERDUE':
                return <span className="inline-flex items-center rounded-full border border-red-200 bg-red-100 px-2.5 py-0.5 text-xs font-semibold text-red-700 hover:bg-red-100">Quá hạn</span>;
            case 'CANCELLED':
                return <span className="inline-flex items-center rounded-full border border-gray-200 bg-gray-100 px-2.5 py-0.5 text-xs font-semibold text-gray-700">Đã hủy</span>;
            default:
                return <span className="inline-flex items-center rounded-full border border-gray-200 bg-gray-100 px-2.5 py-0.5 text-xs font-semibold text-gray-700">{status}</span>;
        }
    };

    if (isLoading) {
        return (
            <DashboardLayout>
                <div className="flex h-[50vh] items-center justify-center">
                    <div className="text-center">
                        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4"></div>
                        <p className="text-muted-foreground">Đang tải thông tin hóa đơn...</p>
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    if (!invoice) return null;

    return (
        <DashboardLayout>
            <div className="space-y-6 max-w-4xl mx-auto">
                {/* Header Actions */}
                <div className="flex items-center justify-between print:hidden">
                    <Button variant="ghost" onClick={() => router.back()}>
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Quay lại danh sách
                    </Button>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={handlePrint}>
                            <Printer className="mr-2 h-4 w-4" />
                            In hóa đơn
                        </Button>
                        <Button variant="outline">
                            <Download className="mr-2 h-4 w-4" />
                            Tải PDF
                        </Button>
                    </div>
                </div>

                {/* Invoice Content */}
                <div className="overflow-hidden rounded-lg border-2 bg-white shadow-sm print:border-0 print:shadow-none">
                    <div className="bg-slate-50 p-8 border-b print:bg-white print:border-b-2">
                        <div className="flex justify-between items-start">
                            <div>
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center">
                                        <FileText className="h-5 w-5 text-white" />
                                    </div>
                                    <h1 className="text-2xl font-bold text-primary">HÓA ĐƠN DỊCH VỤ</h1>
                                </div>
                                <p className="text-sm text-muted-foreground">Bệnh viện Đa khoa Quốc tế</p>
                                <p className="text-sm text-muted-foreground">123 Đường Nguyễn Văn Linh, Quận 7, TP.HCM</p>
                                <p className="text-sm text-muted-foreground">Hotline: 1900 1234</p>
                            </div>
                            <div className="text-right">
                                <h2 className="text-xl font-bold text-gray-900">{invoice.invoiceNumber}</h2>
                                <div className="mt-2 flex flex-col items-end gap-1">
                                    {getStatusBadge(invoice.status)}
                                    <span className="text-sm text-muted-foreground mt-1">
                                        Ngày tạo: {format(new Date(invoice.createdAt), 'dd/MM/yyyy HH:mm')}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="p-8 space-y-8">
                        {/* Patient & Payment Info */}
                        <div className="grid md:grid-cols-2 gap-8">
                            <div className="space-y-3">
                                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                                    <User className="h-4 w-4 text-primary" />
                                    Thông tin bệnh nhân
                                </h3>
                                <div className="bg-slate-50 p-4 rounded-lg space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Họ và tên:</span>
                                        <span className="font-medium">{invoice.patientName}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Mã bệnh nhân:</span>
                                        <span className="font-medium">{invoice.patientId}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Mã lịch hẹn:</span>
                                        <span className="font-medium">{invoice.appointmentId}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                                    <CreditCard className="h-4 w-4 text-primary" />
                                    Thông tin thanh toán
                                </h3>
                                <div className="bg-slate-50 p-4 rounded-lg space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Phương thức:</span>
                                        <span className="font-medium">Chuyển khoản / Thẻ</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Hạn thanh toán:</span>
                                        <span className="font-medium">
                                            {invoice.dueDate ? format(new Date(invoice.dueDate), 'dd/MM/yyyy') : 'N/A'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="h-[1px] w-full bg-gray-200" />

                        {/* Invoice Items */}
                        <div>
                            <h3 className="font-semibold text-gray-900 mb-4">Chi tiết dịch vụ</h3>
                            <div className="rounded-lg border overflow-hidden">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">STT</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dịch vụ</th>
                                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Đơn giá</th>
                                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">SL</th>
                                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Thành tiền</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {invoice.items && invoice.items.length > 0 ? (
                                            invoice.items.map((item, index) => (
                                                <tr key={index}>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{index + 1}</td>
                                                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{item.description}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                                                        {formatCurrency(item.unitPrice)}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">{item.quantity}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-right">
                                                        {formatCurrency(item.totalPrice)}
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan={5} className="px-6 py-4 text-center text-sm text-muted-foreground">
                                                    Không có chi tiết dịch vụ
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                    <tfoot className="bg-slate-50">
                                        <tr>
                                            <td colSpan={4} className="px-6 py-4 text-sm font-bold text-gray-900 text-right">Tổng cộng:</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-lg font-bold text-primary text-right">
                                                {formatCurrency(invoice.amount)}
                                            </td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        </div>

                        {/* Footer Notes */}
                        <div className="text-sm text-muted-foreground bg-slate-50 p-4 rounded-lg border border-dashed">
                            <p className="font-medium text-gray-900 mb-1">Lưu ý:</p>
                            <ul className="list-disc list-inside space-y-1">
                                <li>Hóa đơn này có giá trị thanh toán và đối chiếu.</li>
                                <li>Vui lòng kiểm tra kỹ thông tin trước khi rời quầy.</li>
                                <li>Mọi thắc mắc xin liên hệ bộ phận kế toán hoặc hotline hỗ trợ.</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
