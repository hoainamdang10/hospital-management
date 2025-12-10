'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import {
    ArrowLeft,
    Printer,
    Download,
    FileText,
    User,
    CreditCard,
    CheckCircle2,
    Clock,
    XCircle,
    AlertCircle,
    Undo2,
    Mail,
    Calendar,
    Stethoscope,
    Building2,
    Phone,
    MapPin,
    Hash,
    Receipt,
    Smartphone,
    Banknote,
    CalendarCheck,
    AlertTriangle,
    Copy,
    ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DashboardLayout } from '@/components/layout';
import { billingService, Invoice } from '@/lib/api/billing.service';
import { appointmentsService } from '@/lib/api/appointments.service';
import { Invoice as SharedInvoice } from '@/modules/billing/services/billing.service';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

// ============================================================================
// TYPES
// ============================================================================
interface ExtendedInvoice extends Invoice {
    // Payment info from payments array
    paymentMethod?: string;
    transactionId?: string;
    paidAt?: string;
    // Appointment/Doctor info
    doctorName?: string;
    departmentName?: string;
    appointmentDate?: string;
    appointmentTime?: string;
    // Patient contact
    patientPhone?: string;
    patientEmail?: string;
    // Raw payments array for display
    payments?: SharedInvoice['payments'];
}

// ============================================================================
// CONSTANTS
// ============================================================================
const STATUS_CONFIG: Record<string, { label: string; icon: React.ElementType; colors: string; bgColor: string; gradient: string }> = {
    PAID: {
        label: 'Đã thanh toán',
        icon: CheckCircle2,
        colors: 'text-emerald-600',
        bgColor: 'bg-emerald-50 border-emerald-200',
        gradient: 'from-emerald-500 to-green-600'
    },
    PENDING: {
        label: 'Chờ thanh toán',
        icon: Clock,
        colors: 'text-amber-600',
        bgColor: 'bg-amber-50 border-amber-200',
        gradient: 'from-amber-500 to-orange-600'
    },
    OVERDUE: {
        label: 'Quá hạn',
        icon: AlertCircle,
        colors: 'text-red-600',
        bgColor: 'bg-red-50 border-red-200',
        gradient: 'from-red-500 to-rose-600'
    },
    CANCELLED: {
        label: 'Đã hủy',
        icon: XCircle,
        colors: 'text-slate-600',
        bgColor: 'bg-slate-50 border-slate-200',
        gradient: 'from-slate-500 to-slate-600'
    },
    REFUNDED: {
        label: 'Đã hoàn tiền',
        icon: Undo2,
        colors: 'text-purple-600',
        bgColor: 'bg-purple-50 border-purple-200',
        gradient: 'from-purple-500 to-violet-600'
    },
    FAILED: {
        label: 'Thất bại',
        icon: AlertTriangle,
        colors: 'text-red-600',
        bgColor: 'bg-red-50 border-red-200',
        gradient: 'from-red-500 to-rose-600'
    },
};

const PAYMENT_METHOD_CONFIG: Record<string, { label: string; icon: React.ElementType; colors: string }> = {
    // PayOS variants
    PayOS: { label: 'PayOS', icon: Smartphone, colors: 'bg-indigo-100 text-indigo-700 border-indigo-200' },
    payos: { label: 'PayOS', icon: Smartphone, colors: 'bg-indigo-100 text-indigo-700 border-indigo-200' },
    PAYOS: { label: 'PayOS', icon: Smartphone, colors: 'bg-indigo-100 text-indigo-700 border-indigo-200' },
    // VNPay variants
    VNPay: { label: 'VNPay', icon: CreditCard, colors: 'bg-blue-100 text-blue-700 border-blue-200' },
    vnpay: { label: 'VNPay', icon: CreditCard, colors: 'bg-blue-100 text-blue-700 border-blue-200' },
    VNPAY: { label: 'VNPay', icon: CreditCard, colors: 'bg-blue-100 text-blue-700 border-blue-200' },
    // Wallet variants
    wallet: { label: 'Ví', icon: Banknote, colors: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
    Wallet: { label: 'Ví', icon: Banknote, colors: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
    WALLET: { label: 'Ví', icon: Banknote, colors: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
    // Other methods
    MoMo: { label: 'MoMo', icon: Smartphone, colors: 'bg-pink-100 text-pink-700 border-pink-200' },
    momo: { label: 'MoMo', icon: Smartphone, colors: 'bg-pink-100 text-pink-700 border-pink-200' },
    Cash: { label: 'Tiền mặt', icon: Banknote, colors: 'bg-green-100 text-green-700 border-green-200' },
    cash: { label: 'Tiền mặt', icon: Banknote, colors: 'bg-green-100 text-green-700 border-green-200' },
    Card: { label: 'Thẻ', icon: CreditCard, colors: 'bg-cyan-100 text-cyan-700 border-cyan-200' },
    card: { label: 'Thẻ', icon: CreditCard, colors: 'bg-cyan-100 text-cyan-700 border-cyan-200' },
    BankTransfer: { label: 'Chuyển khoản', icon: Building2, colors: 'bg-slate-100 text-slate-700 border-slate-200' },
    bank_transfer: { label: 'Chuyển khoản', icon: Building2, colors: 'bg-slate-100 text-slate-700 border-slate-200' },
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================
export default function InvoiceDetailPage() {
    const router = useRouter();
    const params = useParams();
    const id = params?.id as string;

    const [invoice, setInvoice] = useState<ExtendedInvoice | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchInvoice = async () => {
            if (!id) return;
            setIsLoading(true);
            try {
                const res = await billingService.getInvoice(id);
                if (res.success && res.data) {
                    const invoiceData = res.data as any; // Access raw data including payments

                    // Extract payment info from payments array (if exists)
                    const payments = invoiceData.payments || [];
                    const paidPayment = payments.find((p: any) =>
                        p.status === 'completed' || p.status === 'COMPLETED' ||
                        p.method?.toLowerCase() !== 'refund'
                    );

                    // Determine payment method and transaction ID from actual payments
                    const paymentMethod = paidPayment?.method ||
                        (invoiceData.metadata?.paymentMethod) ||
                        (invoiceData.metadata?.paymentGateway) ||
                        undefined;
                    const transactionId = paidPayment?.transactionId ||
                        paidPayment?.transaction_id ||
                        (invoiceData.metadata?.transactionId) ||
                        undefined;
                    const paidAt = paidPayment?.paidAt ||
                        paidPayment?.paid_at ||
                        paidPayment?.processedAt ||
                        paidPayment?.processed_at ||
                        invoiceData.paidAt ||
                        undefined;

                    // Initialize extended invoice with invoice data
                    let extendedInvoice: ExtendedInvoice = {
                        ...res.data,
                        paymentMethod,
                        transactionId,
                        paidAt,
                        payments,
                        // These will be enriched from appointment if available
                        doctorName: invoiceData.doctorName || invoiceData.metadata?.doctorName,
                        departmentName: invoiceData.doctorDepartment || invoiceData.metadata?.departmentName,
                        appointmentDate: invoiceData.metadata?.appointmentDate,
                        appointmentTime: invoiceData.metadata?.appointmentTime,
                        patientPhone: invoiceData.metadata?.patientPhone,
                        patientEmail: invoiceData.metadata?.patientEmail,
                    };

                    // If we have appointmentId, fetch appointment details for rich info
                    if (res.data.appointmentId) {
                        try {
                            const appointment = await appointmentsService.getById(res.data.appointmentId);
                            if (appointment) {
                                extendedInvoice = {
                                    ...extendedInvoice,
                                    doctorName: appointment.doctorName || appointment.doctor?.fullName || extendedInvoice.doctorName,
                                    departmentName: appointment.doctorDepartment || appointment.doctor?.department || extendedInvoice.departmentName,
                                    appointmentDate: appointment.appointmentDate || extendedInvoice.appointmentDate,
                                    appointmentTime: appointment.appointmentTime || extendedInvoice.appointmentTime,
                                    patientPhone: appointment.patientPhone || appointment.patient?.phone || extendedInvoice.patientPhone,
                                    patientEmail: appointment.patientEmail || appointment.patient?.email || extendedInvoice.patientEmail,
                                };
                            }
                        } catch (appointmentError) {
                            console.warn('Could not fetch appointment details:', appointmentError);
                            // Continue with invoice data only
                        }
                    }

                    setInvoice(extendedInvoice);
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

    const handleDownloadPDF = () => {
        toast.success('Đang tải PDF...', { description: 'Tính năng đang phát triển' });
    };

    const handleSendEmail = () => {
        toast.success('Đã gửi email', { description: `Hóa đơn đã được gửi đến ${invoice?.patientEmail}` });
    };

    const handleRefund = () => {
        toast.info('Yêu cầu hoàn tiền', { description: 'Đang xử lý...' });
    };

    const handleCopyTransactionId = () => {
        if (invoice?.transactionId) {
            navigator.clipboard.writeText(invoice.transactionId);
            toast.success('Đã sao chép mã giao dịch');
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(amount);
    };

    if (isLoading) {
        return (
            <DashboardLayout>
                <div className="flex h-[60vh] items-center justify-center">
                    <div className="flex flex-col items-center gap-4">
                        <div className="relative">
                            <div className="h-16 w-16 rounded-full border-4 border-indigo-100" />
                            <div className="absolute inset-0 h-16 w-16 animate-spin rounded-full border-4 border-transparent border-t-indigo-600" />
                        </div>
                        <p className="text-slate-500">Đang tải thông tin hóa đơn...</p>
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    if (!invoice) return null;

    const statusConfig = STATUS_CONFIG[invoice.status] || STATUS_CONFIG.PENDING;
    const StatusIcon = statusConfig.icon;
    const paymentConfig = PAYMENT_METHOD_CONFIG[invoice.paymentMethod || 'PayOS'];
    const PaymentIcon = paymentConfig?.icon || CreditCard;

    return (
        <DashboardLayout>
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-purple-50/20 print:bg-white">
                <div className="mx-auto max-w-5xl space-y-6 p-6 print:p-0">
                    {/* Header Actions - Hidden when printing */}
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center justify-between print:hidden"
                    >
                        <Button
                            variant="ghost"
                            onClick={() => router.back()}
                            className="text-slate-600 hover:text-slate-900"
                        >
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Quay lại danh sách
                        </Button>
                        <div className="flex items-center gap-2">
                            <Button variant="outline" onClick={handlePrint}>
                                <Printer className="mr-2 h-4 w-4" />
                                In hóa đơn
                            </Button>
                            <Button variant="outline" onClick={handleDownloadPDF}>
                                <Download className="mr-2 h-4 w-4" />
                                Tải PDF
                            </Button>
                            {invoice.status === 'PAID' && (
                                <>
                                    <Button variant="outline" onClick={handleSendEmail}>
                                        <Mail className="mr-2 h-4 w-4" />
                                        Gửi email
                                    </Button>
                                    <Button
                                        variant="outline"
                                        onClick={handleRefund}
                                        className="text-purple-600 border-purple-200 hover:bg-purple-50"
                                    >
                                        <Undo2 className="mr-2 h-4 w-4" />
                                        Hoàn tiền
                                    </Button>
                                </>
                            )}
                        </div>
                    </motion.div>

                    {/* Invoice Content */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="overflow-hidden rounded-2xl border border-slate-200/50 bg-white shadow-xl print:border-2 print:shadow-none"
                    >
                        {/* Invoice Header */}
                        <div className={cn(
                            'relative overflow-hidden p-8 text-white print:bg-slate-100 print:text-slate-900',
                            `bg-gradient-to-r ${statusConfig.gradient}`
                        )}>
                            {/* Background Pattern */}
                            <div className="absolute inset-0 opacity-10 print:hidden">
                                <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-white/20" />
                                <div className="absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-white/20" />
                            </div>

                            <div className="relative flex items-start justify-between">
                                <div>
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm print:bg-slate-200">
                                            <Receipt className="h-6 w-6" />
                                        </div>
                                        <div>
                                            <h1 className="text-2xl font-bold">HÓA ĐƠN DỊCH VỤ</h1>
                                            <p className="text-sm opacity-90">Bệnh viện Đa khoa Quốc tế</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4 text-sm opacity-80">
                                        <span className="flex items-center gap-1">
                                            <MapPin className="h-4 w-4" />
                                            123 Đường Y Tế, Quận 7, TP.HCM
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <Phone className="h-4 w-4" />
                                            1900 1234
                                        </span>
                                    </div>
                                </div>

                                <div className="text-right">
                                    <div className="inline-flex items-center gap-2 rounded-xl bg-white/20 px-4 py-2 backdrop-blur-sm print:bg-slate-200">
                                        <StatusIcon className="h-5 w-5" />
                                        <span className="font-semibold">{statusConfig.label}</span>
                                    </div>
                                    <p className="mt-3 text-2xl font-bold">{invoice.invoiceNumber}</p>
                                    <p className="mt-1 text-sm opacity-80">
                                        Ngày tạo: {format(new Date(invoice.createdAt), 'dd/MM/yyyy HH:mm', { locale: vi })}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="p-8 space-y-8">
                            {/* Info Cards Grid */}
                            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                                {/* Patient Info */}
                                <InfoCard
                                    title="Thông tin bệnh nhân"
                                    icon={User}
                                    gradient="from-blue-500 to-indigo-600"
                                >
                                    <InfoRow label="Họ và tên" value={invoice.patientName || 'N/A'} />
                                    <InfoRow label="Mã bệnh nhân" value={invoice.patientId} mono />
                                    <InfoRow label="Số điện thoại" value={invoice.patientPhone || 'N/A'} />
                                    <InfoRow label="Email" value={invoice.patientEmail || 'N/A'} />
                                </InfoCard>

                                {/* Appointment Info */}
                                <InfoCard
                                    title="Thông tin lịch hẹn"
                                    icon={CalendarCheck}
                                    gradient="from-cyan-500 to-teal-600"
                                >
                                    <InfoRow label="Bác sĩ" value={invoice.doctorName || 'N/A'} />
                                    <InfoRow label="Khoa" value={invoice.departmentName || 'N/A'} />
                                    <InfoRow
                                        label="Ngày khám"
                                        value={invoice.appointmentDate ? format(new Date(invoice.appointmentDate), 'dd/MM/yyyy', { locale: vi }) : 'N/A'}
                                    />
                                    <InfoRow label="Giờ khám" value={invoice.appointmentTime || 'N/A'} />
                                </InfoCard>

                                {/* Payment Info */}
                                <InfoCard
                                    title="Thông tin thanh toán"
                                    icon={CreditCard}
                                    gradient="from-purple-500 to-pink-600"
                                >
                                    <div className="flex items-center justify-between py-2">
                                        <span className="text-sm text-slate-500">Phương thức</span>
                                        {invoice.paymentMethod ? (
                                            <span className={cn(
                                                'inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium',
                                                paymentConfig?.colors || 'bg-slate-100 text-slate-600'
                                            )}>
                                                <PaymentIcon className="h-3.5 w-3.5" />
                                                {paymentConfig?.label || invoice.paymentMethod}
                                            </span>
                                        ) : (
                                            <span className="text-sm text-slate-400">Chưa thanh toán</span>
                                        )}
                                    </div>
                                    <div className="flex items-center justify-between py-2">
                                        <span className="text-sm text-slate-500">Mã giao dịch</span>
                                        {invoice.transactionId ? (
                                            <button
                                                onClick={handleCopyTransactionId}
                                                className="flex items-center gap-1 font-mono text-sm font-medium text-slate-900 hover:text-indigo-600"
                                            >
                                                {invoice.transactionId.length > 15
                                                    ? `${invoice.transactionId.slice(0, 15)}...`
                                                    : invoice.transactionId}
                                                <Copy className="h-3 w-3" />
                                            </button>
                                        ) : (
                                            <span className="text-sm text-slate-400">N/A</span>
                                        )}
                                    </div>
                                    {invoice.paidAt && (
                                        <InfoRow
                                            label="Thời gian TT"
                                            value={format(new Date(invoice.paidAt), 'HH:mm dd/MM/yyyy', { locale: vi })}
                                        />
                                    )}
                                    <InfoRow
                                        label="Hạn thanh toán"
                                        value={invoice.dueDate ? format(new Date(invoice.dueDate), 'dd/MM/yyyy', { locale: vi }) : 'N/A'}
                                    />
                                </InfoCard>
                            </div>

                            {/* Divider */}
                            <div className="h-px w-full bg-gradient-to-r from-transparent via-slate-200 to-transparent" />

                            {/* Invoice Items Table */}
                            <div>
                                <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-slate-900">
                                    <FileText className="h-5 w-5 text-indigo-600" />
                                    Chi tiết dịch vụ
                                </h3>
                                <div className="overflow-hidden rounded-xl border border-slate-200">
                                    <table className="min-w-full divide-y divide-slate-200">
                                        <thead className="bg-gradient-to-r from-slate-50 to-slate-100">
                                            <tr>
                                                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">STT</th>
                                                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Dịch vụ</th>
                                                <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">Đơn giá</th>
                                                <th className="px-6 py-4 text-center text-xs font-semibold uppercase tracking-wider text-slate-500">SL</th>
                                                <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">Thành tiền</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 bg-white">
                                            {invoice.items && invoice.items.length > 0 ? (
                                                invoice.items.map((item, index) => (
                                                    <tr key={index} className="transition-colors hover:bg-slate-50">
                                                        <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-500">{index + 1}</td>
                                                        <td className="px-6 py-4 text-sm font-medium text-slate-900">{item.description}</td>
                                                        <td className="whitespace-nowrap px-6 py-4 text-right text-sm text-slate-600">
                                                            {formatCurrency(item.unitPrice)}
                                                        </td>
                                                        <td className="whitespace-nowrap px-6 py-4 text-center text-sm text-slate-600">{item.quantity}</td>
                                                        <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-semibold text-slate-900">
                                                            {formatCurrency(item.totalPrice)}
                                                        </td>
                                                    </tr>
                                                ))
                                            ) : (
                                                <tr>
                                                    <td colSpan={5} className="px-6 py-8 text-center text-sm text-slate-400">
                                                        <FileText className="mx-auto mb-2 h-8 w-8 text-slate-300" />
                                                        Không có chi tiết dịch vụ
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                        <tfoot className="bg-gradient-to-r from-indigo-50 to-purple-50">
                                            <tr className="border-b border-slate-200">
                                                <td colSpan={4} className="px-6 py-3 text-right text-sm text-slate-600">
                                                    Tạm tính:
                                                </td>
                                                <td className="whitespace-nowrap px-6 py-3 text-right text-sm font-medium text-slate-900">
                                                    {formatCurrency(invoice.subtotal || invoice.amount)}
                                                </td>
                                            </tr>
                                            <tr className="border-b border-slate-200">
                                                <td colSpan={4} className="px-6 py-3 text-right text-sm text-slate-600">
                                                    Thuế VAT (10%):
                                                </td>
                                                <td className="whitespace-nowrap px-6 py-3 text-right text-sm font-medium text-slate-900">
                                                    {formatCurrency(invoice.tax || 0)}
                                                </td>
                                            </tr>
                                            {(invoice.insuranceCoverage && invoice.insuranceCoverage > 0) && (
                                                <tr className="border-b border-slate-200 bg-emerald-50/50">
                                                    <td colSpan={4} className="px-6 py-3 text-right text-sm font-medium text-emerald-700">
                                                        🛡️ Bảo hiểm chi trả:
                                                    </td>
                                                    <td className="whitespace-nowrap px-6 py-3 text-right text-sm font-semibold text-emerald-600">
                                                        -{formatCurrency(invoice.insuranceCoverage)}
                                                    </td>
                                                </tr>
                                            )}
                                            <tr>
                                                <td colSpan={4} className="px-6 py-4 text-right text-sm font-bold text-slate-900">
                                                    Tổng thanh toán:
                                                </td>
                                                <td className="whitespace-nowrap px-6 py-4 text-right text-xl font-bold text-indigo-600">
                                                    {formatCurrency(invoice.outstandingAmount || invoice.amount)}
                                                </td>
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>
                            </div>

                            {/* Footer Notes */}
                            <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6">
                                <p className="mb-3 font-semibold text-slate-900">📋 Lưu ý:</p>
                                <ul className="space-y-2 text-sm text-slate-600">
                                    <li className="flex items-start gap-2">
                                        <span className="mt-1 h-1.5 w-1.5 rounded-full bg-indigo-500" />
                                        Hóa đơn điện tử này có giá trị pháp lý tương đương hóa đơn giấy.
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="mt-1 h-1.5 w-1.5 rounded-full bg-indigo-500" />
                                        Thanh toán Prepaid: Số tiền đã được thanh toán trước khi khám.
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="mt-1 h-1.5 w-1.5 rounded-full bg-indigo-500" />
                                        Hoàn tiền: Nếu hủy lịch trước 24h, tiền sẽ được hoàn 100% trong 3-5 ngày làm việc.
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="mt-1 h-1.5 w-1.5 rounded-full bg-indigo-500" />
                                        Mọi thắc mắc xin liên hệ hotline 1900 1234 hoặc email support@hospital.vn
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </DashboardLayout>
    );
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

interface InfoCardProps {
    title: string;
    icon: React.ElementType;
    gradient: string;
    children: React.ReactNode;
}

function InfoCard({ title, icon: Icon, gradient, children }: InfoCardProps) {
    return (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition-all hover:shadow-md">
            <div className={cn('flex items-center gap-3 p-4 text-white', `bg-gradient-to-r ${gradient}`)}>
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/20 backdrop-blur-sm">
                    <Icon className="h-5 w-5" />
                </div>
                <h3 className="font-semibold">{title}</h3>
            </div>
            <div className="divide-y divide-slate-100 p-4">
                {children}
            </div>
        </div>
    );
}

interface InfoRowProps {
    label: string;
    value: string;
    mono?: boolean;
}

function InfoRow({ label, value, mono }: InfoRowProps) {
    return (
        <div className="flex items-center justify-between py-2">
            <span className="text-sm text-slate-500">{label}</span>
            <span className={cn('text-sm font-medium text-slate-900', mono && 'font-mono')}>{value}</span>
        </div>
    );
}
