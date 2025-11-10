# 🏥 HMS EVENT-DRIVEN ARCHITECTURE ANALYSIS
## Phân tích Events cho Demo System

---

## 📊 EVENT MATRIX

### 1️⃣ IDENTITY SERVICE (Port: 3001)

#### **PUBLISHES:**
- ✅ `user.created.event` - Khi user được tạo sau email verification
- ✅ `user.activated.event` - Khi user được kích hoạt
- ✅ `user.updated.event` - Khi thông tin user được cập nhật
- ✅ `user.deleted.event` - Khi user bị xóa
- ✅ `user.deactivated.event` - Khi user bị vô hiệu hóa
- ✅ `user.role.changed.event` - Khi role của user thay đổi
- ⚠️ `auth.login.event` - Khi user login (có thể chưa publish)
- ⚠️ `auth.logout.event` - Khi user logout (có thể chưa publish)
- ⚠️ `auth.password.changed.event` - Khi đổi mật khẩu (có thể chưa publish)

#### **CONSUMES:**
- ❌ NONE - Identity Service không consume events từ services khác

---

### 2️⃣ PATIENT REGISTRY SERVICE (Port: 3003)

#### **PUBLISHES:**
- ✅ `patient.registered.event` - Khi patient profile được tạo
- ⚠️ `patient.updated.event` - Khi thông tin patient được cập nhật
- ⚠️ `patient.contact.updated.event` - Khi contact info được cập nhật
- ⚠️ `patient.insurance.added.event` - Khi thêm bảo hiểm
- ⚠️ `patient.emergency.contact.added.event` - Khi thêm liên hệ khẩn cấp

#### **CONSUMES:**
- ✅ `user.created.event` - Tự động tạo patient profile
- ✅ `user.activated.event` - Kích hoạt patient profile
- ✅ `user.updated.event` - Cập nhật thông tin từ Identity
- ✅ `user.deleted.event` - Xóa patient profile

#### **STATUS:** ✅ Đã fix routing keys và validation

---

### 3️⃣ PROVIDER/STAFF SERVICE (Port: 3002)

#### **PUBLISHES:**
- ✅ `staff.registered.event` - Khi staff profile được tạo
- ⚠️ `staff.department.assigned.event` - Khi staff được assign vào department
- ⚠️ `staff.schedule.updated.event` - Khi lịch làm việc được cập nhật
- ⚠️ `staff.credential.added.event` - Khi thêm chứng chỉ
- ⚠️ `staff.status.changed.event` - Khi trạng thái staff thay đổi

#### **CONSUMES:**
- ✅ `user.created.event` - Tự động tạo staff profile (chỉ cho healthcare roles)
- ✅ `user.deactivated.event` - Vô hiệu hóa staff profile
- ✅ `user.role.changed.event` - Cập nhật role/position
- ✅ `review.created` - Cập nhật rating từ review
- ✅ `review.updated` - Cập nhật rating
- ✅ `billing.payment.processed` - Cập nhật consultation fees
- ⚠️ `appointment.completed.event` - Cập nhật statistics
- ⚠️ `department.created.event` - Để assign staff

#### **STATUS:** 🔄 Đang fix - cần add IdentityEventConsumer vào main.ts

---

### 4️⃣ APPOINTMENTS SERVICE (Port: 3005)

#### **PUBLISHES:**
- ⚠️ `appointment.created.event` - Khi appointment được tạo
- ⚠️ `appointment.confirmed.event` - Khi appointment được xác nhận
- ⚠️ `appointment.cancelled.event` - Khi appointment bị hủy
- ⚠️ `appointment.rescheduled.event` - Khi appointment được đổi lịch
- ⚠️ `appointment.completed.event` - Khi appointment hoàn thành
- ⚠️ `appointment.no.show.event` - Khi patient không đến

#### **CONSUMES:**
- ⚠️ `patient.registered.event` - Cho phép patient đặt lịch
- ⚠️ `staff.registered.event` - Cho phép đặt lịch với staff
- ⚠️ `staff.schedule.updated.event` - Cập nhật available slots
- ⚠️ `payment.confirmed.event` - Xác nhận appointment sau thanh toán

#### **STATUS:** ❓ Cần kiểm tra

---

### 5️⃣ CLINICAL EMR SERVICE (Port: 3006)

#### **PUBLISHES:**
- ⚠️ `medical.record.created.event` - Khi EMR được tạo
- ⚠️ `visit.recorded.event` - Khi visit được ghi nhận
- ⚠️ `diagnosis.added.event` - Khi thêm chẩn đoán
- ⚠️ `prescription.created.event` - Khi kê đơn thuốc
- ⚠️ `lab.order.created.event` - Khi order xét nghiệm
- ⚠️ `vital.signs.recorded.event` - Khi nhập vital signs

#### **CONSUMES:**
- ⚠️ `patient.registered.event` - Tạo EMR cho patient mới
- ⚠️ `appointment.completed.event` - Tạo visit record
- ⚠️ `appointment.checked.in.event` - Bắt đầu visit

#### **STATUS:** ❓ Cần kiểm tra

---

### 6️⃣ BILLING SERVICE (Port: 3007)

#### **PUBLISHES:**
- ⚠️ `invoice.generated.event` - Khi hóa đơn được tạo
- ⚠️ `payment.processed.event` - Khi thanh toán được xử lý
- ⚠️ `payment.confirmed.event` - Khi thanh toán được xác nhận
- ⚠️ `payment.refunded.event` - Khi hoàn tiền
- ⚠️ `consultation.fee.updated.event` - Khi cập nhật phí khám

#### **CONSUMES:**
- ⚠️ `appointment.completed.event` - Tạo hóa đơn
- ⚠️ `prescription.created.event` - Thêm phí thuốc
- ⚠️ `lab.order.created.event` - Thêm phí xét nghiệm
- ⚠️ `visit.recorded.event` - Tạo billing summary

#### **STATUS:** ❓ Cần kiểm tra

---

### 7️⃣ NOTIFICATIONS SERVICE (Port: 3008)

#### **PUBLISHES:**
- ⚠️ `notification.sent.event` - Khi notification được gửi
- ⚠️ `notification.read.event` - Khi notification được đọc
- ⚠️ `email.sent.event` - Khi email được gửi
- ⚠️ `sms.sent.event` - Khi SMS được gửi

#### **CONSUMES:**
- ⚠️ `user.created.event` - Gửi welcome email
- ⚠️ `appointment.created.event` - Gửi appointment confirmation
- ⚠️ `appointment.reminder.event` - Gửi reminder
- ⚠️ `payment.confirmed.event` - Gửi receipt
- ⚠️ `prescription.created.event` - Gửi prescription notification

#### **STATUS:** ❓ Cần kiểm tra

---

### 8️⃣ DEPARTMENT SERVICE (Port: 3009)

#### **PUBLISHES:**
- ⚠️ `department.created.event` - Khi department được tạo
- ⚠️ `department.updated.event` - Khi thông tin department được cập nhật
- ⚠️ `department.head.assigned.event` - Khi gán trưởng khoa

#### **CONSUMES:**
- ⚠️ `staff.registered.event` - Cập nhật staff count
- ⚠️ `staff.department.assigned.event` - Cập nhật danh sách staff

#### **STATUS:** ❓ Cần kiểm tra

---

## 🎯 CÁC FLOW DEMO CHỦ YẾU

### **FLOW 1: Patient Registration**
```
1. POST /api/auth/register (role=patient)
   → Identity Service

2. POST /api/auth/verify-email?token=xxx
   → Identity Service

3. Identity publishes: user.created.event
   → Patient Registry consumes
   → Notifications consumes (welcome email)

4. Patient Registry publishes: patient.registered.event
   → Appointments consumes (enable booking)
   → Clinical EMR consumes (create EMR)

STATUS: ✅ WORKING (vừa fix xong)
```

### **FLOW 2: Doctor Registration**
```
1. Admin creates doctor account
   → Identity Service

2. Doctor verifies email
   → Identity Service

3. Identity publishes: user.created.event (role=doctor)
   → Staff Service consumes
   → Notifications consumes (welcome email)

4. Staff Service publishes: staff.registered.event
   → Appointments consumes (enable scheduling)
   → Department Service consumes (update staff count)

STATUS: 🔄 TESTING (đang test sau khi fix)
```

### **FLOW 3: Appointment Booking**
```
1. Patient books appointment
   → Appointments Service

2. Appointments publishes: appointment.created.event
   → Notifications consumes (send confirmation)
   → Billing consumes (reserve billing)

3. Appointment reminder (scheduled)
   → Notifications sends reminder

4. Appointment completed
   → Clinical EMR creates visit
   → Billing creates invoice

STATUS: ❓ CHƯA TEST (cần kiểm tra)
```

### **FLOW 4: Clinical Visit**
```
1. Check-in appointment
   → Appointments Service
   → publishes: appointment.checked.in.event

2. Clinical consumes → Create visit record
   → Clinical EMR Service

3. Doctor adds diagnosis + prescription
   → publishes: prescription.created.event

4. Billing consumes → Add charges
   → Billing Service

5. Payment processed
   → publishes: payment.confirmed.event
   → Notifications sends receipt

STATUS: ❓ CHƯA TEST
```

---

## ❌ CÁC EVENTS THIẾU/CẦN BỔ SUNG

### **CRITICAL - Cần cho Demo:**

1. **Appointments Service:**
   - ❌ `appointment.checked.in.event` - Để trigger visit creation
   - ❌ `appointment.reminder.event` - Scheduled notifications

2. **Clinical EMR:**
   - ❌ `prescription.created.event` - Để trigger billing

3. **Billing:**
   - ❌ `payment.confirmed.event` - Để confirm appointment và send receipt

4. **Notifications:**
   - ❌ Cần consume tất cả events để gửi notifications

### **NICE TO HAVE:**

1. **Identity:**
   - `auth.login.event` - Audit trail
   - `auth.logout.event` - Session management

2. **Patient Registry:**
   - `patient.insurance.verified.event` - Insurance workflow

3. **Staff:**
   - `staff.availability.changed.event` - Dynamic scheduling

---

## 🔧 ACTION ITEMS

### **IMMEDIATE (Cho Demo):**

1. ✅ Fix Patient Registry routing keys - DONE
2. ✅ Fix Patient Registry validation - DONE
3. 🔄 Fix Staff Service IdentityEventConsumer - IN PROGRESS
4. ❓ Test Staff registration flow
5. ❓ Verify Appointments Service events
6. ❓ Verify Notifications Service subscriptions
7. ❓ Test end-to-end appointment flow

### **SHORT TERM:**

1. Implement Appointment lifecycle events
2. Implement Clinical EMR events for visit/prescription
3. Implement Billing payment events
4. Connect Notifications to all critical events

### **LONG TERM:**

1. Add audit events for compliance
2. Add analytics events for reporting
3. Add integration events for external systems

---

## 📈 EVENT COVERAGE STATUS

| Service | Publishes | Consumes | Status |
|---------|-----------|----------|--------|
| Identity | 6/9 (67%) | 0/0 (N/A) | ⚠️ Partial |
| Patient Registry | 1/5 (20%) | 4/4 (100%) | ✅ Consumer OK |
| Staff Service | 1/5 (20%) | 7/10 (70%) | 🔄 Testing |
| Appointments | 0/6 (0%) | 0/4 (0%) | ❌ Missing |
| Clinical EMR | 0/6 (0%) | 0/3 (0%) | ❌ Missing |
| Billing | 0/5 (0%) | 0/4 (0%) | ❌ Missing |
| Notifications | 0/4 (0%) | 0/5 (0%) | ❌ Missing |
| Department | 0/3 (0%) | 0/2 (0%) | ❌ Missing |

**OVERALL:** ~25% event coverage - CẦN BỔ SUNG NHIỀU!

---

## 🎬 DEMO SCENARIOS (Priority Order)

### **PHASE 1: User Management** ✅
- ✅ Patient registration
- 🔄 Doctor registration
- ⚠️ Staff onboarding

### **PHASE 2: Appointments** ❌
- Book appointment
- Confirm appointment
- Send reminders
- Cancel/Reschedule

### **PHASE 3: Clinical** ❌
- Check-in
- Record visit
- Write prescription
- Order labs

### **PHASE 4: Billing** ❌
- Generate invoice
- Process payment
- Send receipt
- Handle refunds

---

## 💡 RECOMMENDATIONS

1. **Priority 1:** Fix Staff Service event consumer (đang làm)
2. **Priority 2:** Verify và test Appointments Service events
3. **Priority 3:** Implement Notifications Service consumers
4. **Priority 4:** Implement Clinical & Billing critical events

**Estimated effort:** 2-3 ngày để có basic event flow cho demo
