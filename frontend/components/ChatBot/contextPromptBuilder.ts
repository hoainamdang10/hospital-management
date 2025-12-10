/**
 * Context Prompt Builder
 * Tạo dynamic system prompt dựa trên context hiện tại
 * 
 * @author Hospital Management Team
 * @version 1.0.0
 */

import type {
    ChatContext,
    PaymentPendingContext,
    AppointmentsListContext,
    AppointmentDetailContext,
    BillingContext,
    DashboardContext
} from './types';

/**
 * Format số tiền theo VND
 */
function formatCurrency(amount: number, currency = 'VND'): string {
    return new Intl.NumberFormat('vi-VN').format(amount) + ' ' + currency;
}

/**
 * Format ngày theo tiếng Việt
 */
function formatDate(dateStr: string): string {
    try {
        const date = new Date(dateStr);
        return date.toLocaleDateString('vi-VN', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    } catch {
        return dateStr;
    }
}

/**
 * Build context summary cho trang Payment Pending
 */
function buildPaymentPendingContext(data: PaymentPendingContext): string {
    const lines: string[] = [
        `**Trang hiện tại:** Chờ thanh toán`,
        ``,
        `**Thông tin hóa đơn:**`,
        `- Mã hóa đơn: ${data.invoiceNumber || data.invoiceId.slice(0, 8)}`,
        `- Số tiền cần thanh toán: ${formatCurrency(data.outstandingAmount, data.currency)}`,
    ];

    if (data.insuranceCoverage && data.insuranceCoverage > 0) {
        lines.push(`- Bảo hiểm đã chi trả: ${formatCurrency(data.insuranceCoverage, data.currency)}`);
    }

    lines.push(`- Trạng thái: ${data.paymentStatus === 'pending' ? 'Chờ thanh toán' : data.paymentStatus}`);

    if (data.doctorName) {
        lines.push(``, `**Thông tin lịch hẹn:**`);
        lines.push(`- Bác sĩ: ${data.doctorName}`);
        if (data.departmentName) lines.push(`- Khoa: ${data.departmentName}`);
        if (data.appointmentDate) lines.push(`- Ngày: ${formatDate(data.appointmentDate)}`);
        if (data.appointmentTime) lines.push(`- Giờ: ${data.appointmentTime}`);
    }

    lines.push(
        ``,
        `**Phương thức thanh toán hỗ trợ:**`,
        `- VNPay (thanh toán online qua ngân hàng/thẻ)`,
        `- Ví nội bộ (số dư trong tài khoản bệnh viện)`,
        ``,
        `**Bạn có thể hỗ trợ người dùng:**`,
        `- Giải thích chi tiết hóa đơn`,
        `- Hướng dẫn cách thanh toán qua VNPay hoặc Ví`,
        `- Giải đáp về chính sách hoàn tiền`,
        `- Hướng dẫn đổi lịch nếu cần`
    );

    return lines.join('\n');
}

/**
 * Build context summary cho trang Danh sách lịch hẹn
 */
function buildAppointmentsListContext(data: AppointmentsListContext): string {
    const lines: string[] = [
        `**Trang hiện tại:** Danh sách lịch hẹn`,
        ``,
        `**Thống kê:**`,
        `- Lịch hẹn sắp tới: ${data.upcomingCount}`,
        `- Lịch hẹn hôm nay: ${data.todayCount}`,
    ];

    if (data.pendingPaymentCount > 0) {
        lines.push(`- ⚠️ Chờ thanh toán: ${data.pendingPaymentCount}`);
    }

    if (data.nextAppointment) {
        const next = data.nextAppointment;
        lines.push(
            ``,
            `**Lịch hẹn gần nhất:**`,
            `- Bác sĩ: ${next.doctorName}`,
            `- Ngày: ${formatDate(next.date)}`,
            `- Giờ: ${next.time}`,
            `- Trạng thái: ${next.status}`
        );
    }

    lines.push(
        ``,
        `**Bạn có thể hỗ trợ người dùng:**`,
        `- Đặt lịch khám mới`,
        `- Tìm bác sĩ theo chuyên khoa`,
        `- Xem chi tiết lịch hẹn`,
        `- Hướng dẫn hủy/đổi lịch`
    );

    return lines.join('\n');
}

/**
 * Build context summary cho trang Chi tiết lịch hẹn
 */
function buildAppointmentDetailContext(data: AppointmentDetailContext): string {
    const lines: string[] = [
        `**Trang hiện tại:** Chi tiết lịch hẹn`,
        ``,
        `**Thông tin lịch hẹn:**`,
        `- Mã: ${data.appointmentId.slice(0, 8)}`,
        `- Bác sĩ: ${data.doctorName}`,
        `- Khoa: ${data.departmentName}`,
        `- Ngày: ${formatDate(data.date)}`,
        `- Giờ: ${data.time}`,
        `- Trạng thái: ${data.status}`,
    ];

    if (data.reason) {
        lines.push(`- Lý do khám: ${data.reason}`);
    }

    if (data.location) {
        lines.push(`- Địa điểm: ${data.location}`);
    }

    if (data.paymentStatus) {
        lines.push(`- Thanh toán: ${data.paymentStatus}`);
    }

    lines.push(
        ``,
        `**Bạn có thể hỗ trợ người dùng:**`,
        `- Xem thông tin bác sĩ`,
        `- Hướng dẫn chuẩn bị trước khám`,
        `- Hướng dẫn đổi lịch/hủy lịch`,
        `- Giải đáp thắc mắc về khoa/chuyên môn`
    );

    return lines.join('\n');
}

/**
 * Build context summary cho trang Billing
 */
function buildBillingContext(data: BillingContext): string {
    const lines: string[] = [
        `**Trang hiện tại:** Quản lý hóa đơn`,
        ``,
        `**Thống kê:**`,
        `- Tổng số hóa đơn: ${data.totalInvoices}`,
    ];

    if (data.unpaidCount > 0) {
        lines.push(
            `- ⚠️ Chưa thanh toán: ${data.unpaidCount}`,
            `- Tổng số tiền chưa thanh toán: ${formatCurrency(data.totalUnpaidAmount || data.totalOutstanding || 0, data.currency)}`
        );
    } else {
        lines.push(`- ✅ Tất cả hóa đơn đã thanh toán`);
    }

    if (data.walletBalance !== undefined && data.walletBalance > 0) {
        lines.push(`- Số dư ví: ${formatCurrency(data.walletBalance, data.currency)}`);
    }

    lines.push(
        ``,
        `**Bạn có thể hỗ trợ người dùng:**`,
        `- Hướng dẫn thanh toán hóa đơn`,
        `- Giải thích chi tiết hóa đơn`,
        `- Thông tin về bảo hiểm y tế`,
        `- Hướng dẫn nạp tiền vào ví`,
        `- Chính sách hoàn tiền`
    );

    return lines.join('\n');
}

/**
 * Build context summary cho trang Dashboard
 */
function buildDashboardContext(data: DashboardContext): string {
    const lines: string[] = [
        `**Trang hiện tại:** Trang chủ bệnh nhân`,
        ``,
        `**Thống kê nhanh:**`,
        `- Lịch hẹn sắp tới (7 ngày): ${data.upcomingAppointments}`,
        `- Thanh toán đang chờ: ${data.pendingPayments}`,
    ];

    if (data.recentCompleted !== undefined) {
        lines.push(`- Lịch đã hoàn tất/hủy (30 ngày): ${data.recentCompleted}`);
    }

    lines.push(`- Hoàn thiện hồ sơ: ${data.profileCompletion}%`);

    const badges: string[] = [];
    if (data.hasInsurance) badges.push('🛡️ Có bảo hiểm');
    if (data.hasEmergencyContact) badges.push('📞 Có liên lạc khẩn cấp');
    if (badges.length > 0) {
        lines.push(`- Trạng thái: ${badges.join(', ')}`);
    }

    lines.push(
        ``,
        `**Bạn có thể hỗ trợ người dùng:**`,
        `- Đặt lịch khám mới`,
        `- Tìm bác sĩ theo chuyên khoa`,
        `- Xem lịch hẹn sắp tới`,
        `- Hướng dẫn thanh toán`,
        `- Giải đáp thắc mắc về dịch vụ`
    );

    return lines.join('\n');
}

/**
 * Build context mặc định cho các trang khác
 */
function buildGenericContext(page: string): string {
    // Xác định loại trang dựa trên path
    if (page.includes('/patient/dashboard')) {
        return [
            `**Trang hiện tại:** Trang chủ bệnh nhân`,
            ``,
            `**Bạn có thể hỗ trợ người dùng:**`,
            `- Đặt lịch khám mới`,
            `- Xem lịch hẹn sắp tới`,
            `- Tìm bác sĩ theo chuyên khoa`,
            `- Giải đáp thắc mắc về dịch vụ bệnh viện`,
        ].join('\n');
    }

    if (page.includes('/patient/profile')) {
        return [
            `**Trang hiện tại:** Hồ sơ cá nhân`,
            ``,
            `**Bạn có thể hỗ trợ người dùng:**`,
            `- Hướng dẫn cập nhật thông tin cá nhân`,
            `- Giải thích về bảo hiểm y tế`,
            `- Thông tin về bảo mật tài khoản`,
        ].join('\n');
    }

    // Default
    return [
        `**Trang hiện tại:** Hệ thống quản lý bệnh viện`,
        ``,
        `**Bạn có thể hỗ trợ người dùng:**`,
        `- Đặt lịch khám`,
        `- Tìm bác sĩ`,
        `- Xem thông tin khoa`,
        `- Giải đáp thắc mắc chung`,
    ].join('\n');
}

/**
 * Build dynamic system prompt dựa trên context
 * 
 * @param context - ChatContext từ component
 * @returns System prompt bổ sung cho AI
 */
export function buildDynamicSystemPrompt(context?: ChatContext): string {
    if (!context) {
        return buildGenericContext('');
    }

    const { page, data } = context;

    switch (page) {
        case '/patient/appointments/payment-pending':
            return buildPaymentPendingContext(data as PaymentPendingContext);

        case '/patient/appointments':
            return buildAppointmentsListContext(data as AppointmentsListContext);

        case '/patient/appointments/[id]':
            return buildAppointmentDetailContext(data as AppointmentDetailContext);

        case '/patient/billing':
            return buildBillingContext(data as BillingContext);

        case '/patient/dashboard':
            return buildDashboardContext(data as DashboardContext);

        default:
            return buildGenericContext(page);
    }
}

/**
 * Tạo welcome message dựa trên context
 */
export function getContextualWelcomeMessage(context?: ChatContext): string {
    if (!context) {
        return 'Xin chào! Tôi là AI Assistant của bệnh viện. Tôi có thể giúp bạn đặt lịch khám, tìm bác sĩ, hoặc xem lịch hẹn. Bạn cần hỗ trợ gì?';
    }

    switch (context.page) {
        case '/patient/appointments/payment-pending': {
            const data = context.data as PaymentPendingContext;
            const amount = new Intl.NumberFormat('vi-VN').format(data.outstandingAmount);
            return `Xin chào! Tôi thấy bạn đang có hóa đơn ${amount} VND chờ thanh toán. Tôi có thể giúp bạn:\n• Giải thích chi tiết hóa đơn\n• Hướng dẫn thanh toán\n• Đổi lịch hẹn nếu cần\n\nBạn cần hỗ trợ gì?`;
        }

        case '/patient/appointments': {
            const data = context.data as AppointmentsListContext;
            if (data.pendingPaymentCount > 0) {
                return `Xin chào! Bạn có ${data.upcomingCount} lịch hẹn sắp tới và ${data.pendingPaymentCount} hóa đơn chờ thanh toán. Tôi có thể giúp bạn quản lý lịch hẹn hoặc đặt lịch mới. Bạn cần hỗ trợ gì?`;
            }
            return `Xin chào! Bạn có ${data.upcomingCount} lịch hẹn sắp tới. Tôi có thể giúp bạn xem chi tiết hoặc đặt thêm lịch khám. Bạn cần hỗ trợ gì?`;
        }

        case '/patient/appointments/[id]': {
            const data = context.data as AppointmentDetailContext;
            return `Xin chào! Tôi thấy bạn đang xem lịch hẹn với ${data.doctorName} vào ${data.time}. Tôi có thể giúp bạn:\n• Xem thông tin bác sĩ\n• Hướng dẫn chuẩn bị trước khám\n• Đổi lịch nếu cần\n\nBạn cần hỗ trợ gì?`;
        }

        case '/patient/billing': {
            const data = context.data as BillingContext;
            if (data.unpaidCount > 0) {
                const amount = new Intl.NumberFormat('vi-VN').format(data.totalUnpaidAmount || data.totalOutstanding || 0);
                return `Xin chào! Bạn có ${data.unpaidCount} hóa đơn chưa thanh toán với tổng ${amount} VND. Tôi có thể giúp bạn:\n• Thanh toán hóa đơn\n• Giải thích chi tiết\n• Thông tin bảo hiểm\n\nBạn cần hỗ trợ gì?`;
            }
            return `Xin chào! Tất cả hóa đơn của bạn đã được thanh toán. Tôi có thể giúp bạn xem lịch sử thanh toán hoặc giải đáp thắc mắc về hóa đơn. Bạn cần hỗ trợ gì?`;
        }

        case '/patient/dashboard': {
            const data = context.data as DashboardContext;
            const messages: string[] = [`Xin chào! Chào mừng bạn quay lại.`];
            if (data.upcomingAppointments > 0) {
                messages.push(`Bạn có ${data.upcomingAppointments} lịch hẹn trong 7 ngày tới.`);
            }
            if (data.pendingPayments > 0) {
                messages.push(`Có ${data.pendingPayments} giao dịch đang chờ xử lý.`);
            }
            messages.push(`Tôi có thể giúp bạn đặt lịch khám, tìm bác sĩ, hoặc xem lịch hẹn. Bạn cần hỗ trợ gì?`);
            return messages.join(' ');
        }

        default:
            return 'Xin chào! Tôi là AI Assistant của bệnh viện. Tôi có thể giúp bạn đặt lịch khám, tìm bác sĩ, hoặc xem lịch hẹn. Bạn cần hỗ trợ gì?';
    }
}
