import { jsPDF } from "jspdf";

interface ReceiptData {
  orderCode: string;
  appointmentId: string;
  patientName: string;
  doctorName: string;
  department: string;
  appointmentDate: string;
  timeSlot: string;
  amount: number;
  paymentMethod: "PayOS" | "cash";
  paymentStatus: "success" | "pending" | "failed";
  transactionId?: string;
  paymentDate: string;
  hospitalName?: string;
  hospitalAddress?: string;
  hospitalPhone?: string;
}

export class ReceiptGenerator {
  private static hospitalInfo = {
    name: "Bệnh viện Đa khoa Quốc tế",
    address: "123 Đường ABC, Quận 1, TP. Hồ Chí Minh",
    phone: "(028) 1234 5678",
    email: "info@hospital.com",
    website: "www.hospital.com",
  };

  /**
   * Generate PDF receipt for payment
   */
  static generatePDFReceipt(data: ReceiptData): Promise<Blob> {
    return new Promise((resolve) => {
      const doc = new jsPDF();

      // Header
      doc.setFontSize(20);
      doc.setFont("helvetica", "bold");
      doc.text(this.hospitalInfo.name, 105, 25, { align: "center" });

      doc.setFontSize(12);
      doc.setFont("helvetica", "normal");
      doc.text(this.hospitalInfo.address, 105, 35, { align: "center" });
      doc.text(
        `Tel: ${this.hospitalInfo.phone} | Email: ${this.hospitalInfo.email}`,
        105,
        42,
        { align: "center" }
      );

      // Title
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.text("HÓA ĐƠN THANH TOÁN", 105, 60, { align: "center" });
      doc.text("PAYMENT RECEIPT", 105, 68, { align: "center" });

      // Receipt details
      doc.setFontSize(11);
      doc.setFont("helvetica", "normal");

      let yPos = 85;
      const lineHeight = 8;

      // Receipt number and date
      doc.text(`Số hóa đơn / Receipt No: ${data.orderCode}`, 20, yPos);
      doc.text(
        `Ngày / Date: ${this.formatDate(data.paymentDate)}`,
        20,
        yPos + lineHeight
      );

      yPos += lineHeight * 3;

      // Patient information
      doc.setFont("helvetica", "bold");
      doc.text("THÔNG TIN BỆNH NHÂN / PATIENT INFORMATION", 20, yPos);
      doc.setFont("helvetica", "normal");
      yPos += lineHeight;

      doc.text(`Họ tên / Name: ${data.patientName}`, 20, yPos);
      yPos += lineHeight;
      doc.text(
        `Mã lịch khám / Appointment ID: ${data.appointmentId}`,
        20,
        yPos
      );
      yPos += lineHeight * 2;

      // Appointment information
      doc.setFont("helvetica", "bold");
      doc.text("THÔNG TIN KHÁM BỆNH / APPOINTMENT DETAILS", 20, yPos);
      doc.setFont("helvetica", "normal");
      yPos += lineHeight;

      doc.text(`Bác sĩ / Doctor: ${data.doctorName}`, 20, yPos);
      yPos += lineHeight;
      doc.text(`Khoa / Department: ${data.department}`, 20, yPos);
      yPos += lineHeight;
      doc.text(`Ngày khám / Date: ${data.appointmentDate}`, 20, yPos);
      yPos += lineHeight;
      doc.text(`Giờ khám / Time: ${data.timeSlot}`, 20, yPos);
      yPos += lineHeight * 2;

      // Payment information
      doc.setFont("helvetica", "bold");
      doc.text("THÔNG TIN THANH TOÁN / PAYMENT DETAILS", 20, yPos);
      doc.setFont("helvetica", "normal");
      yPos += lineHeight;

      doc.text(
        `Phương thức / Method: ${this.getPaymentMethodText(
          data.paymentMethod
        )}`,
        20,
        yPos
      );
      yPos += lineHeight;
      doc.text(
        `Trạng thái / Status: ${this.getStatusText(data.paymentStatus)}`,
        20,
        yPos
      );
      yPos += lineHeight;

      if (data.transactionId) {
        doc.text(
          `Mã giao dịch / Transaction ID: ${data.transactionId}`,
          20,
          yPos
        );
        yPos += lineHeight;
      }

      // Amount
      doc.setFontSize(13);
      doc.setFont("helvetica", "bold");
      doc.text(
        `Tổng tiền / Total Amount: ${this.formatCurrency(data.amount)}`,
        20,
        yPos + lineHeight
      );

      // Footer
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text("Cảm ơn bạn đã sử dụng dịch vụ của chúng tôi!", 105, 250, {
        align: "center",
      });
      doc.text("Thank you for using our services!", 105, 257, {
        align: "center",
      });

      // QR Code placeholder (if needed)
      doc.text("QR Code: [Scan để xác thực]", 105, 270, { align: "center" });

      const pdfBlob = doc.output("blob");
      resolve(pdfBlob);
    });
  }

  /**
   * Generate HTML receipt for email or print
   */
  static generateHTMLReceipt(data: ReceiptData): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>Hóa đơn thanh toán - ${data.orderCode}</title>
          <style>
            body { font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { text-align: center; border-bottom: 2px solid #0066cc; padding-bottom: 20px; margin-bottom: 30px; }
            .hospital-name { font-size: 24px; font-weight: bold; color: #0066cc; margin-bottom: 10px; }
            .hospital-info { font-size: 14px; color: #666; }
            .receipt-title { font-size: 20px; font-weight: bold; text-align: center; margin: 30px 0; color: #333; }
            .section { margin-bottom: 25px; }
            .section-title { font-size: 16px; font-weight: bold; color: #0066cc; border-bottom: 1px solid #ddd; padding-bottom: 5px; margin-bottom: 15px; }
            .info-row { display: flex; justify-content: space-between; margin-bottom: 8px; }
            .label { font-weight: bold; color: #333; }
            .value { color: #666; }
            .amount { font-size: 18px; font-weight: bold; color: #0066cc; text-align: center; padding: 15px; background-color: #f0f8ff; border-radius: 5px; }
            .footer { text-align: center; margin-top: 40px; font-size: 12px; color: #666; border-top: 1px solid #ddd; padding-top: 20px; }
            .status-success { color: #28a745; font-weight: bold; }
            .status-pending { color: #ffc107; font-weight: bold; }
            .status-failed { color: #dc3545; font-weight: bold; }
            @media print { body { padding: 0; } }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="hospital-name">${this.hospitalInfo.name}</div>
            <div class="hospital-info">
              ${this.hospitalInfo.address}<br>
              Tel: ${this.hospitalInfo.phone} | Email: ${
      this.hospitalInfo.email
    }
            </div>
          </div>

          <div class="receipt-title">
            HÓA ĐƠN THANH TOÁN<br>
            <small>PAYMENT RECEIPT</small>
          </div>

          <div class="section">
            <div class="info-row">
              <span class="label">Số hóa đơn / Receipt No:</span>
              <span class="value">${data.orderCode}</span>
            </div>
            <div class="info-row">
              <span class="label">Ngày / Date:</span>
              <span class="value">${this.formatDate(data.paymentDate)}</span>
            </div>
          </div>

          <div class="section">
            <div class="section-title">THÔNG TIN BỆNH NHÂN / PATIENT INFORMATION</div>
            <div class="info-row">
              <span class="label">Họ tên / Name:</span>
              <span class="value">${data.patientName}</span>
            </div>
            <div class="info-row">
              <span class="label">Mã lịch khám / Appointment ID:</span>
              <span class="value">${data.appointmentId}</span>
            </div>
          </div>

          <div class="section">
            <div class="section-title">THÔNG TIN KHÁM BỆNH / APPOINTMENT DETAILS</div>
            <div class="info-row">
              <span class="label">Bác sĩ / Doctor:</span>
              <span class="value">${data.doctorName}</span>
            </div>
            <div class="info-row">
              <span class="label">Khoa / Department:</span>
              <span class="value">${data.department}</span>
            </div>
            <div class="info-row">
              <span class="label">Ngày khám / Date:</span>
              <span class="value">${data.appointmentDate}</span>
            </div>
            <div class="info-row">
              <span class="label">Giờ khám / Time:</span>
              <span class="value">${data.timeSlot}</span>
            </div>
          </div>

          <div class="section">
            <div class="section-title">THÔNG TIN THANH TOÁN / PAYMENT DETAILS</div>
            <div class="info-row">
              <span class="label">Phương thức / Method:</span>
              <span class="value">${this.getPaymentMethodText(
                data.paymentMethod
              )}</span>
            </div>
            <div class="info-row">
              <span class="label">Trạng thái / Status:</span>
              <span class="value status-${
                data.paymentStatus
              }">${this.getStatusText(data.paymentStatus)}</span>
            </div>
            ${
              data.transactionId
                ? `
            <div class="info-row">
              <span class="label">Mã giao dịch / Transaction ID:</span>
              <span class="value">${data.transactionId}</span>
            </div>
            `
                : ""
            }
          </div>

          <div class="amount">
            Tổng tiền / Total Amount: ${this.formatCurrency(data.amount)}
          </div>

          <div class="footer">
            <p>Cảm ơn bạn đã sử dụng dịch vụ của chúng tôi!</p>
            <p>Thank you for using our services!</p>
            <p><small>Hóa đơn này được tạo tự động bởi hệ thống quản lý bệnh viện</small></p>
          </div>
        </body>
      </html>
    `;
  }

  /**
   * Download PDF receipt
   */
  static async downloadPDFReceipt(data: ReceiptData): Promise<void> {
    const pdfBlob = await this.generatePDFReceipt(data);
    const url = URL.createObjectURL(pdfBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `receipt-${data.orderCode}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  /**
   * Print receipt
   */
  static printReceipt(data: ReceiptData): void {
    const htmlContent = this.generateHTMLReceipt(data);
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
      printWindow.close();
    }
  }

  /**
   * Send receipt via email (placeholder - would integrate with email service)
   */
  static async emailReceipt(
    data: ReceiptData,
    email: string
  ): Promise<boolean> {
    try {
      // This would integrate with your email service
      const htmlContent = this.generateHTMLReceipt(data);

      const response = await fetch("/api/email/send-receipt", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          to: email,
          subject: `Hóa đơn thanh toán - ${data.orderCode}`,
          html: htmlContent,
          attachments: [
            {
              filename: `receipt-${data.orderCode}.pdf`,
              content: await this.generatePDFReceipt(data),
            },
          ],
        }),
      });

      return response.ok;
    } catch (error) {
      console.error("Error sending receipt email:", error);
      return false;
    }
  }

  // Helper methods
  private static formatCurrency(amount: number): string {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  }

  private static formatDate(dateString: string): string {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("vi-VN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  }

  private static getPaymentMethodText(method: string): string {
    const methods: Record<string, string> = {
      PayOS: "Thanh toán điện tử (PayOS)",
      cash: "Tiền mặt (Cash)",
    };
    return methods[method] || method;
  }

  private static getStatusText(status: string): string {
    const statuses: Record<string, string> = {
      success: "Thành công / Success",
      pending: "Đang xử lý / Pending",
      failed: "Thất bại / Failed",
    };
    return statuses[status] || status;
  }
}

export type { ReceiptData };

