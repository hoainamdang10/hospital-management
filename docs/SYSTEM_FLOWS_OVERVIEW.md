# 📋 Tổng Quan Các Luồng Chính Trong Hệ Thống Quản Lý Bệnh Viện

> **Tài liệu này mô tả chi tiết các luồng chức năng chính trong hệ thống Hospital Management V2**
> 
> Cập nhật: 10/12/2024

---

## Mục Lục

1. [AI Chatbot](#1--luồng-ai-chatbot)
2. [Bắt Đầu Khám](#2--luồng-bắt-đầu-khám-start-examination)
3. [Bệnh Nhân Vắng Mặt](#3--luồng-bệnh-nhân-vắng-mặt-no-show)
4. [Hủy Lịch](#4--luồng-hủy-lịch-cancel-appointment)
5. [Bảo Hiểm Y Tế & Tính Phí](#5--luồng-bảo-hiểm-y-tế--tính-phí)
6. [Sơ Đồ Trạng Thái](#-sơ-đồ-tổng-quan-các-trạng-thái-lịch-hẹn)
7. [Mối Liên Hệ Giữa Các Luồng](#-mối-liên-hệ-giữa-các-luồng)

---

## 1. 🤖 Luồng AI Chatbot

### Tổng quan

AI Chatbot là một trợ lý ảo giúp bệnh nhân tra cứu thông tin và hướng dẫn thao tác trong hệ thống. Chatbot sử dụng **Groq API** với model **LLaMA 3.1** và có khả năng gọi function để truy vấn dữ liệu thực.

### Các thành phần chính

| File | Mô tả |
|------|-------|
| `frontend/components/ChatBot.tsx` | Component UI chính, xử lý giao tiếp người dùng |
| `frontend/app/api/chat/route.ts` | API route xử lý tin nhắn, gọi AI và thực thi function calls |
| `frontend/components/ChatBot/contextPromptBuilder.ts` | Xây dựng prompt động dựa trên context trang hiện tại |
| `frontend/components/ChatBot/types.ts` | Định nghĩa các kiểu dữ liệu cho context |
| `frontend/components/ChatBot/SmartSuggestions.tsx` | Gợi ý thông minh dựa trên context |
| `frontend/components/ChatBot/suggestionsConfig.ts` | Cấu hình các gợi ý theo từng trang |

### Các Function Calls hỗ trợ

Chatbot có **10 function calls** được định nghĩa để truy vấn dữ liệu:

```typescript
1. searchAvailableDoctors    // Tìm bác sĩ theo chuyên khoa
2. getAvailableSlots         // Xem khung giờ trống của bác sĩ
3. getMyAppointments         // Xem lịch hẹn của bệnh nhân
4. getDepartments            // Lấy danh sách chuyên khoa
5. getDepartmentStaffCount   // Đếm số bác sĩ trong khoa
6. getDepartmentDetails      // Thông tin chi tiết khoa
7. getPatientProfile         // Xem hồ sơ bệnh nhân
8. getPatientInsurance       // Xem thông tin bảo hiểm
9. getPendingInvoices        // Xem hóa đơn chờ thanh toán
10. getAppointmentDetails    // Chi tiết lịch hẹn
```

### Luồng hoạt động

```
┌─────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  User Input │────▶│  /api/chat      │────▶│  Groq LLaMA 3.1 │
└─────────────┘     │  (route.ts)      │     └────────┬────────┘
                    └──────────────────┘              │
                             ▲                        │
                             │    Function Call       │
                             │ ◀──────────────────────┘
                             │
                    ┌────────┴────────┐
                    │ Backend APIs    │
                    │ (v1/v2 APIs)    │
                    └─────────────────┘
```

### Tính năng Context-Aware

Chatbot tự động nhận biết context của trang hiện tại để đưa ra phản hồi phù hợp:

| Trang | Context Data | Khả năng hỗ trợ |
|-------|-------------|-----------------|
| Payment Pending | invoiceId, outstandingAmount, insuranceCoverage | Giải thích hóa đơn, hướng dẫn thanh toán |
| Appointments List | upcomingCount, pendingPaymentCount | Quản lý lịch hẹn, đặt lịch mới |
| Appointment Detail | doctorName, date, time, status | Thông tin bác sĩ, chuẩn bị khám |
| Billing | totalInvoices, unpaidCount, totalUnpaidAmount | Thanh toán, giải thích hóa đơn |
| Dashboard | - | Đặt lịch, tìm bác sĩ |
| Profile | - | Cập nhật thông tin, bảo hiểm |

### QUAN TRỌNG - Giới hạn quyền

- ✅ CHỈ có quyền **TRA CỨU** thông tin (READ-only)
- ❌ KHÔNG thể tạo, sửa, hủy lịch hẹn thay người dùng
- ❌ KHÔNG thể thực hiện thanh toán thay người dùng
- 💡 Khi người dùng muốn thực hiện hành động, chatbot sẽ **HƯỚNG DẪN** thao tác trên giao diện

---

## 2. 🩺 Luồng Bắt Đầu Khám (Start Examination)

### Tổng quan

Bác sĩ sử dụng nút **"Bắt đầu khám"** trên trang chi tiết lịch hẹn để chuyển trạng thái từ `CONFIRMED/SCHEDULED` sang `IN_PROGRESS`.

### Các thành phần chính

| File | Mô tả |
|------|-------|
| `frontend/app/doctor/appointments/[id]/page.tsx` | Trang chi tiết lịch hẹn của bác sĩ (dòng 550-565) |
| `frontend/lib/api/appointments.service.ts` | Service gọi API (dòng 416-418) |

### Logic kiểm soát thời gian

```typescript
// Biến môi trường điều khiển cho phép bắt đầu sớm (development)
const allowEarlyStart = process.env.NEXT_PUBLIC_ALLOW_EARLY_START === 'true';

// Kiểm tra đã đến giờ khám chưa
const hasReachedStartTime = appointmentStartDate
  ? currentTimeMs >= appointmentStartDate.getTime()
  : false;

// Cho phép bắt đầu khi: cho phép sớm HOẶC đã đến giờ
const canStartExam = allowEarlyStart || hasReachedStartTime;
```

### API Endpoint

```typescript
// POST /api/v1/appointments/:id/start
async startAppointment(id: string, payload: { roomId?: string } = {}): Promise<SuccessResponse>
```

### Luồng hoạt động

```
CONFIRMED/SCHEDULED ──▶ Click "Bắt đầu khám" ──▶ IN_PROGRESS
        │                       │                    │
        │                       ▼                    │
        │               Check conditions:            │
        │               - Đã đến giờ? ────NO────▶ Disable button
        │               - allowEarlyStart? ──YES──▶ Enable
        │                       │
        └───────────────────────┴────────────────────┘
```

### UI/UX

- **Nút "Bắt đầu khám"**: Màu trắng với text cyan, icon `PlayCircle`
- **Trạng thái disabled**: Khi chưa đến giờ và `NEXT_PUBLIC_ALLOW_EARLY_START !== 'true'`
- **Tooltip**: "Chỉ bắt đầu khám khi đến giờ hẹn"

---

## 3. 👻 Luồng Bệnh Nhân Vắng Mặt (No-Show)

### Tổng quan

Khi bệnh nhân không đến khám **sau 15 phút** so với giờ hẹn, bác sĩ có thể đánh dấu **"BN vắng mặt"** (No-Show). Điều này sẽ **KHÔNG hoàn tiền** cho bệnh nhân.

### Các thành phần chính

| File | Mô tả |
|------|-------|
| `frontend/app/doctor/appointments/[id]/page.tsx` | Trang chi tiết (dòng 590-606) |
| `frontend/lib/api/appointments.service.ts` | Service gọi API (dòng 434-437) |
| `backend/services-v2/billing-service/src/application/services/BillingService.ts` | Tạo hóa đơn phí vắng mặt |

### Logic kiểm soát thời gian

```typescript
// Biến môi trường cho phép đánh dấu sớm (development)
const allowEarlyNoShow = process.env.NEXT_PUBLIC_ALLOW_EARLY_NO_SHOW === 'true';

// Kiểm tra đã quá 15 phút chưa
const hasPassedNoShowThreshold = appointmentStartDate
  ? currentTimeMs >= appointmentStartDate.getTime() + 15 * 60 * 1000  // +15 phút
  : false;

const canMarkNoShow = allowEarlyNoShow || hasPassedNoShowThreshold;
```

### API Endpoint

```typescript
// POST /api/v1/appointments/:id/no-show
async markNoShow(id: string): Promise<SuccessResponse>
```

### Backend xử lý (BillingService)

```typescript
// Tạo hóa đơn phí vắng mặt
async generateNoShowFee(request: NoShowFeeRequest): Promise<Invoice> {
  const lineItems = [{
    description: `No-show fee (Occurrence #${request.noShowCount})`,
    quantity: 1,
    unitPrice: request.feeAmount,
  }];
  
  // Tạo invoice với metadata:
  // - invoiceType: "no_show_fee"
  // - serviceName: "Phí bỏ khám"
  // - occurrence: số lần vắng mặt
  // Không áp dụng bảo hiểm cho phí này
}
```

### Luồng hoạt động

```
CONFIRMED/SCHEDULED ──▶ Quá 15 phút ──▶ Click "BN vắng mặt" ──▶ NO_SHOW
        │                                      │
        │                                      ▼
        │                              Dialog xác nhận
        │                                      │
        │                                      ▼
        │                              Tạo hóa đơn "no_show_fee"
        │                              (Không hoàn tiền khám)
        └──────────────────────────────────────┘
```

### UI/UX

- **Nút "BN vắng mặt"**: Viền cam, text cam, icon `UserX`
- **Trạng thái disabled**: Khi chưa quá 15 phút và `NEXT_PUBLIC_ALLOW_EARLY_NO_SHOW !== 'true'`
- **Tooltip**: "Chỉ đánh dấu vắng mặt sau 15 phút kể từ giờ khám"
- **Dialog xác nhận**: Hiển thị trước khi thực hiện

---

## 4. ❌ Luồng Hủy Lịch (Cancel Appointment)

### Tổng quan

Có **2 loại hủy lịch** với chính sách khác nhau:

| Người hủy | Chính sách hoàn tiền | Phí phạt |
|-----------|---------------------|----------|
| Bác sĩ hủy | **Hoàn tiền 100%** | Không |
| Bệnh nhân hủy sớm | Theo chính sách | Không |
| Bệnh nhân hủy muộn | Theo chính sách | Có thể có "late_cancellation_fee" |

### Các thành phần

| Vai trò | File | Component |
|---------|------|-----------|
| Doctor | `app/doctor/appointments/[id]/page.tsx` | Inline dialog (dòng 577-588) |
| Patient | `components/appointments/CancelAppointmentDialog.tsx` | Dialog riêng |

### Lý do hủy có sẵn (Patient)

```typescript
const CANCELLATION_REASONS = [
  'Bận việc đột xuất',
  'Sức khỏe đã tốt hơn',
  'Muốn đổi bác sĩ khác',
  'Muốn đổi thời gian khác',
  'Lý do cá nhân',
  'Khác',  // Cho phép nhập tự do
];
```

### API Endpoint

```typescript
// POST /api/v1/appointments/:id/cancel
async cancel(id: string, data: CancelAppointmentRequest): Promise<CancelAppointmentResponse>

interface CancelAppointmentRequest {
  cancellationReason: string;
}
```

### Backend xử lý phí hủy muộn

```typescript
// Tạo phí hủy muộn (late cancellation)
async generateLateCancellationFee(request: LateCancellationFeeRequest): Promise<Invoice> {
  // invoiceType = "late_cancellation_fee"
  // serviceName = "Phí hủy lịch muộn"
  // Phí này không được bảo hiểm chi trả
}
```

### Luồng hoạt động - Bác sĩ hủy

```
┌─────────────────────────────────────────────────────────────┐
│                    Bác sĩ hủy lịch                          │
│                                                             │
│  CONFIRMED ──▶ Click "Hủy lịch"                            │
│                     │                                       │
│                     ▼                                       │
│            Dialog nhập lý do                                │
│                     │                                       │
│                     ▼                                       │
│            Reason = "[Bác sĩ hủy] " + lý do                │
│                     │                                       │
│                     ▼                                       │
│            Status → CANCELLED                               │
│            Hoàn tiền 100% cho bệnh nhân                     │
│            Redirect → /doctor/appointments                  │
└─────────────────────────────────────────────────────────────┘
```

### Luồng hoạt động - Bệnh nhân hủy

```
┌─────────────────────────────────────────────────────────────┐
│                   Bệnh nhân hủy lịch                        │
│                                                             │
│  CONFIRMED ──▶ Click "Hủy lịch"                            │
│                     │                                       │
│                     ▼                                       │
│            CancelAppointmentDialog                          │
│            - Hiển thị thông tin lịch hẹn                   │
│            - Cảnh báo không thể khôi phục                   │
│            - Chọn/nhập lý do                               │
│                     │                                       │
│                     ▼                                       │
│            Kiểm tra thời điểm hủy                          │
│            - Hủy sớm: Hoàn tiền theo chính sách            │
│            - Hủy muộn: Tạo "late_cancellation_fee"         │
│                     │                                       │
│                     ▼                                       │
│            Status → CANCELLED                               │
└─────────────────────────────────────────────────────────────┘
```

### UI/UX

**Bác sĩ:**
- **Nút "Hủy lịch"**: Viền đỏ, text đỏ, icon `XCircle`
- **Dialog**: Yêu cầu nhập lý do bắt buộc
- **Toast thành công**: "Đã hủy lịch hẹn. Bệnh nhân sẽ được hoàn tiền 100%"

**Bệnh nhân:**
- **Dialog**: Hiển thị thông tin BS, ngày giờ hẹn
- **Cảnh báo**: Background vàng với icon ⚠️
- **Lý do**: Radio buttons với option "Khác" cho phép nhập tự do
- **Nút xác nhận**: variant="destructive"

---

## 5. 🏥 Luồng Bảo Hiểm Y Tế & Tính Phí

### Tổng quan

Hệ thống hỗ trợ **4 loại bảo hiểm** với tỷ lệ chi trả khác nhau. Khi đặt lịch khám, phí khám sẽ được tự động tính giảm dựa trên thông tin bảo hiểm của bệnh nhân.

### Các loại bảo hiểm & tỷ lệ chi trả

```typescript
// frontend/lib/constants/insurance.ts
export const CONSULTATION_COVERAGE_BY_TYPE: Record<string, number> = {
  'BHYT': 80,      // Bảo hiểm y tế nhà nước → 80%
  'BHTN': 70,      // Bảo hiểm tai nạn → 70%
  'private': 60,   // Bảo hiểm tư nhân → 60%
  'self_pay': 0,   // Tự chi trả → 0%
};
```

### Thành phần quản lý bảo hiểm

| File | Mô tả |
|------|-------|
| `frontend/components/profile/InsuranceTab.tsx` | Tab quản lý bảo hiểm trong Profile |
| `frontend/lib/constants/insurance.ts` | Hằng số & utility functions |
| `backend/services-v2/billing-service/src/application/services/BillingService.ts` | Tính toán phí bảo hiểm |
| `backend/services-v2/billing-service/src/infrastructure/mappers/InvoiceMapper.ts` | Map dữ liệu invoice |

### Thông tin bảo hiểm lưu trữ

```typescript
interface InsuranceInfo {
  provider: string;          // Nhà cung cấp (BHXH Việt Nam, Manulife, ...)
  policyNumber: string;      // Số thẻ bảo hiểm
  groupNumber?: string;      // Mã nhóm (tùy chọn)
  validFrom: string;         // Ngày bắt đầu (YYYY-MM-DD)
  validTo: string;           // Ngày hết hạn (YYYY-MM-DD)
  coverageType: 'BHYT' | 'BHTN' | 'private' | 'self_pay';
  bhytNumber?: string;       // Mã BHYT (nếu là BHYT/BHTN)
  isPrimary: boolean;        // Bảo hiểm chính
  isActive: boolean;         // Đang có hiệu lực
  notes?: string;            // Ghi chú
}
```

### Utility Functions (Frontend)

```typescript
// Lấy tỷ lệ % bảo hiểm chi trả
function getConsultationCoveragePercent(coverageType?: string): number {
  if (!coverageType) return 0;
  return CONSULTATION_COVERAGE_BY_TYPE[coverageType] || 0;
}

// Tính số tiền bảo hiểm chi trả
function calculateInsuranceDiscount(amount: number, coverageType?: string): number {
  const coveragePercent = getConsultationCoveragePercent(coverageType);
  return Math.round(amount * (coveragePercent / 100));
}

// Tính số tiền bệnh nhân cần trả
function calculatePatientPayment(amount: number, coverageType?: string): number {
  const insuranceDiscount = calculateInsuranceDiscount(amount, coverageType);
  return amount - insuranceDiscount;
}
```

### Backend calculation

```typescript
// BillingService.ts
private readonly COVERAGE_BY_TYPE: Record<string, number> = {
  BHYT: 80,      // Bảo hiểm y tế nhà nước → 80%
  BHTN: 70,      // Bảo hiểm tai nạn → 70%
  private: 60,   // Bảo hiểm tư nhân → 60%
  self_pay: 0,   // Tự chi trả → 0%
};

private calculateInsuranceCoverage(
  amount: number,
  insuranceInfo: any,
  category: string,
): number {
  if (!insuranceInfo) return 0;
  if (insuranceInfo.coverageType === 'self_pay') return 0;
  
  // Lấy tỷ lệ theo loại bảo hiểm
  const coveragePercentage = this.getCoveragePercentByType(
    insuranceInfo.coverageType
  );
  
  return Math.round(amount * (coveragePercentage / 100));
}
```

### Luồng tính phí khi đặt lịch

```
┌─────────────────────────────────────────────────────────────────────┐
│  1. Bệnh nhân đặt lịch khám                                         │
│                                                                     │
│     consultationFee = 800,000 VND                                   │
│                 │                                                   │
│                 ▼                                                   │
│  2. Kiểm tra thông tin bảo hiểm từ Patient Profile                  │
│     insuranceInfo = {                                               │
│       coverageType: 'BHYT',                                         │
│       isActive: true,                                               │
│       provider: 'BHXH Việt Nam'                                     │
│     }                                                               │
│                 │                                                   │
│                 ▼                                                   │
│  3. Tính coverage                                                   │
│     coveragePercent = COVERAGE_BY_TYPE['BHYT'] = 80%               │
│     insuranceCoverage = 800,000 × 0.8 = 640,000 VND                │
│                 │                                                   │
│                 ▼                                                   │
│  4. Tính số tiền bệnh nhân cần trả                                  │
│     outstandingAmount = 800,000 - 640,000 = 160,000 VND            │
│                 │                                                   │
│                 ▼                                                   │
│  5. Tạo Invoice với:                                                │
│     {                                                               │
│       totalAmount: 800,000,                                         │
│       insuranceCoverage: 640,000,                                   │
│       outstandingAmount: 160,000,                                   │
│       insurance: {                                                  │
│         provider: 'BHXH Việt Nam',                                  │
│         policyNumber: 'DN479...',                                   │
│         coveragePercentage: 80                                      │
│       }                                                             │
│     }                                                               │
└─────────────────────────────────────────────────────────────────────┘
```

### Ví dụ tính toán

| Loại BH | Phí khám | % Chi trả | BH trả | BN trả |
|---------|----------|-----------|--------|--------|
| BHYT | 800,000₫ | 80% | 640,000₫ | 160,000₫ |
| BHTN | 800,000₫ | 70% | 560,000₫ | 240,000₫ |
| Private | 800,000₫ | 60% | 480,000₫ | 320,000₫ |
| Self-pay | 800,000₫ | 0% | 0₫ | 800,000₫ |

### Hiển thị trên Frontend

| Trang | Thông tin hiển thị |
|-------|-------------------|
| Đặt lịch (Confirmation) | Phí gốc, bảo hiểm chi trả, số tiền cần thanh toán |
| Payment Pending | Số tiền bảo hiểm đã chi trả, số tiền còn lại |
| Patient Billing | Danh sách hóa đơn với chi tiết bảo hiểm |
| Admin Invoice Detail | Thông tin bảo hiểm, breakdown chi phí |
| AI Chatbot | Tra cứu qua `getPatientInsurance` function |

### InsuranceTab UI

Tab quản lý bảo hiểm trong Profile bệnh nhân cho phép:
- ✅ Xem thông tin bảo hiểm hiện tại
- ✅ Chỉnh sửa thông tin bảo hiểm
- ✅ Hiển thị trạng thái: "Đang có hiệu lực" / "Hết hiệu lực"
- ✅ Validation các trường bắt buộc
- ✅ Hỗ trợ 4 loại bảo hiểm: BHYT, BHTN, Private, Self-pay
- ✅ Trường Mã BHYT chỉ hiện khi chọn BHYT/BHTN

---

## 📊 Sơ Đồ Tổng Quan Các Trạng Thái Lịch Hẹn

```
                         ┌─────────────────┐
                         │   SCHEDULED     │
                         │   (Đã đặt)      │
                         └────────┬────────┘
                                  │
                                  │ confirm()
                                  ▼
                         ┌─────────────────┐
           ┌─────────────│   CONFIRMED     │─────────────┐
           │             │   (Chờ khám)    │             │
           │             └────────┬────────┘             │
           │                      │                      │
           │ cancel()             │ start()              │ markNoShow()
           │ (by doctor/patient)  │                      │ (after 15 mins)
           │                      │                      │
           ▼                      ▼                      ▼
    ┌────────────┐        ┌────────────┐         ┌────────────┐
    │ CANCELLED  │        │IN_PROGRESS │         │  NO_SHOW   │
    │ (Đã hủy)   │        │(Đang khám) │         │ (Vắng mặt) │
    └────────────┘        └──────┬─────┘         └────────────┘
                                 │
                                 │ complete()
                                 ▼
                         ┌────────────┐
                         │ COMPLETED  │
                         │(Hoàn thành)│
                         └────────────┘
```

### Status Configuration

```typescript
const STATUS_CONFIG = {
  IN_PROGRESS: {
    label: 'Đang khám',
    color: 'text-blue-700',
    bg: 'bg-blue-50 border-blue-200',
    icon: Activity,
  },
  COMPLETED: {
    label: 'Hoàn thành',
    color: 'text-slate-700',
    bg: 'bg-slate-100 border-slate-200',
    icon: CheckCircle,
  },
  CONFIRMED: {
    label: 'Chờ khám',
    color: 'text-emerald-700',
    bg: 'bg-emerald-50 border-emerald-200',
    icon: Clock,
  },
  SCHEDULED: {
    label: 'Đã đặt',
    color: 'text-amber-700',
    bg: 'bg-amber-50 border-amber-200',
    icon: Calendar,
  },
  CANCELLED: {
    label: 'Đã hủy',
    color: 'text-rose-700',
    bg: 'bg-rose-50 border-rose-200',
    icon: AlertCircle,
  },
  NO_SHOW: {
    label: 'Vắng mặt',
    color: 'text-orange-700',
    bg: 'bg-orange-50 border-orange-200',
    icon: UserX,
  },
};
```

---

## 🔗 Mối Liên Hệ Giữa Các Luồng

### Bảng tổng hợp

| Luồng | Ảnh hưởng đến Billing | Ảnh hưởng đến Lịch hẹn | Liên quan đến AI |
|-------|----------------------|------------------------|------------------|
| Đặt lịch + BHYT | Tạo invoice với insuranceCoverage | Status = SCHEDULED | Chatbot tra cứu được |
| Bắt đầu khám | Không | Status → IN_PROGRESS | Không |
| Hoàn thành khám | Có thể tạo thêm invoice cho dịch vụ | Status → COMPLETED | Không |
| Vắng mặt | Tạo invoice "no_show_fee", không hoàn tiền | Status → NO_SHOW | Không |
| Bác sĩ hủy | Hoàn tiền 100% | Status → CANCELLED | Không |
| Bệnh nhân hủy | Tạo invoice "late_cancellation_fee" nếu muộn | Status → CANCELLED | Không |
| AI Chatbot | Tra cứu invoice, không thể tạo/sửa | Tra cứu, không thể sửa | ✅ Core |

### Các loại Invoice

| invoiceType | Mô tả | Áp dụng BH |
|-------------|-------|------------|
| `appointment_booking` | Phí đặt lịch khám | ✅ Có |
| `late_cancellation_fee` | Phí hủy lịch muộn | ❌ Không |
| `no_show_fee` | Phí vắng mặt | ❌ Không |
| `reschedule_fee` | Phí đổi lịch (nếu có) | ❌ Không |
| `prescription` | Phí thuốc | Tùy chính sách |
| `lab_test` | Phí xét nghiệm | Tùy chính sách |
| `treatment_plan` | Phí điều trị | Tùy chính sách |
| `medical_record` | Phí hồ sơ y tế | Tùy chính sách |

---

## 🛠️ Environment Variables

Các biến môi trường liên quan:

```env
# Frontend (.env.local)
NEXT_PUBLIC_ALLOW_EARLY_START=true    # Cho phép bắt đầu khám trước giờ
NEXT_PUBLIC_ALLOW_EARLY_NO_SHOW=true  # Cho phép đánh dấu vắng mặt trước 15 phút

# AI Chatbot
GROQ_API_KEY=gsk_xxx                   # API key cho Groq
GROQ_MODEL=llama-3.1-8b-instant        # Model AI sử dụng
```

---

## 📝 Ghi Chú Kỹ Thuật

### Chat với Doctor-Patient

Trên trang chi tiết lịch hẹn của bác sĩ (`/doctor/appointments/[id]`), có tính năng chat trực tiếp giữa bác sĩ và bệnh nhân:

- Sử dụng Supabase Realtime cho tin nhắn real-time
- Fallback polling mỗi 4 giây nếu Supabase không configured
- Tin nhắn được lưu trong bảng `chat_messages`
- Hỗ trợ 3 loại sender: `doctor`, `patient`, `system`

### AI Chatbot vs Doctor-Patient Chat

| Feature | AI Chatbot | Doctor-Patient Chat |
|---------|-----------|---------------------|
| Vị trí | Floating button toàn app | Trong trang appointment detail |
| Đối tượng | Bệnh nhân ↔ AI | Bác sĩ ↔ Bệnh nhân |
| Mục đích | Tra cứu, hướng dẫn | Trao đổi lâm sàng |
| Real-time | Không | Có (Supabase) |
| Ẩn trên | Trang detail appointment có chat | - |

---

*Tài liệu được tạo tự động từ phân tích mã nguồn hệ thống Hospital Management V2*
