# 📡 EVENT CATALOG & PROJECTION GUIDE

## 🎯 Mục tiêu
- Chuẩn hóa contract sự kiện cho các bounded context tái cấu trúc, đảm bảo backward compatibility khi strangler triển khai nhiều giai đoạn.
- Giảm rủi ro drift bằng cách mô tả rõ schema, payload mẫu, routing và consumer chủ lực.
- Chuẩn bị nền tảng publish vào schema registry và lên kế hoạch truyền thông nội bộ.

## 🧱 Chuẩn cấu trúc sự kiện
Tất cả sự kiện tuân theo envelope chuẩn bên dưới; payload chứa dữ liệu chuyên biệt cho từng domain.

| Trường | Kiểu | Bắt buộc | Mô tả |
| --- | --- | --- | --- |
| eventId | UUID | Có | Định danh duy nhất (ULID/UUID v4). |
| eventType | string | Có | Định dạng `context.event_name`. |
| eventVersion | integer | Có | Version tăng dần khi có breaking change. |
| occurredAt | string (ISO 8601) | Có | Thời điểm sự kiện được ghi nhận tại producer. |
| producer | string | Có | Tên service phát (vd: `patient-registry-service`). |
| traceId | string | Có | Trace/span id phục vụ distributed tracing & audit HIPAA. |
| correlationId | string | Không | Liên kết các event cùng workflow (saga/process manager). |
| causationId | string | Không | `eventId` của sự kiện gây ra hành động hiện tại. |
| metadata | object | Không | Actor, tenant, channel, locale, policy version, compliance flag. |
| payload | object | Có | Dữ liệu nghiệp vụ chi tiết. |

```json
{
  "eventId": "1a2b3c4d-5678-4f9a-b123-0fedcba98765",
  "eventType": "patient.patient_registered",
  "eventVersion": 1,
  "occurredAt": "2025-09-25T04:12:45.912Z",
  "producer": "patient-registry-service",
  "traceId": "trace-0f1c2d3e4b",
  "correlationId": "workflow-20250925-0001",
  "causationId": "cmd-20250925-0001",
  "metadata": {
    "actorId": "user-8821",
    "actorRole": "receptionist",
    "tenantId": "hospital-hn",
    "channel": "web"
  },
  "payload": {}
}
```

## 📦 Event catalog theo bounded context

### Identity & Access
#### AccessAuditLogged
- **eventType**: `identity.access_audit_logged`
- **Mục đích**: Ghi nhận quyết định cấp/khóa quyền của policy engine (RBAC/ABAC) để phục vụ audit HIPAA.
- **Trigger**: Sau khi Supabase Auth + Policy Decision Point trả về ALLOW/DENY cho một request hoặc token issuance.
- **Consumers chính**: `Scheduling` (theo dõi truy cập slot nhạy cảm), `Clinical/EMR` (log truy cập hồ sơ bệnh án), `Billing` (đối soát tác vụ tài chính), `Security Analytics`.
- **Payload fields**:
  - `actorId` (string, UUID): Người dùng/dịch vụ thực hiện.
  - `actorType` (string): `user` \| `service`.
  - `action` (string): Tác vụ được yêu cầu (vd: `appointments.book`).
  - `resource` (string): Resource path (vd: `scheduling/appointments/app-123`).
  - `decision` (string): `ALLOW` \| `DENY`.
  - `policyVersion` (string): Version của bộ rule.
  - `reason` (string): Giải thích ngắn gọn.
  - `mfaVerified` (boolean): Đã qua MFA hay chưa.
  - `ipAddress` (string), `userAgent` (string): Dữ liệu thiết bị.
  - `tenantId` (string): Đa tenant nếu áp dụng.
- **Ví dụ event**:
  ```json
  {
    "eventId": "7c9f9f18-4dba-4e52-9d37-1f8f9a1fb2b0",
    "eventType": "identity.access_audit_logged",
    "eventVersion": 1,
    "occurredAt": "2025-09-25T04:18:10.112Z",
    "producer": "identity-access-service",
    "traceId": "trace-5dfd2398e1",
    "correlationId": "workflow-20250925-0002",
    "metadata": {
      "tenantId": "hospital-hn"
    },
    "payload": {
      "actorId": "user-8821",
      "actorType": "user",
      "action": "appointments.book",
      "resource": "scheduling/appointments/app-9001",
      "decision": "ALLOW",
      "policyVersion": "2025-09-15",
      "reason": "Role receptionist matches policy scheduling.manage",
      "mfaVerified": true,
      "ipAddress": "203.0.113.42",
      "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
      "tenantId": "hospital-hn"
    }
  }
  ```

### Patient Registry
#### PatientRegistered
- **eventType**: `patient.patient_registered`
- **Mục đích**: Đồng bộ hồ sơ nhân khẩu mới cho Scheduling, Clinical/EMR và Notifications.
- **Trigger**: Transaction tạo bệnh nhân thành công (POST `/patients`).
- **Consumers chính**: `Scheduling`, `Clinical/EMR`, `Notifications`, dữ liệu báo cáo Master Patient Index.
- **Payload fields**:
  - `patientId` (string, UUID).
  - `registryVersion` (integer): Số lần cập nhật schema bệnh nhân.
  - `tenantId` (string).
  - `demographics.fullName` (string), `demographics.dateOfBirth` (date), `demographics.gender` (string), `demographics.language` (string).
  - `contact.primaryPhone` (string), `contact.email` (string), `contact.address` (object: `line1`, `city`, `province`, `country`).
  - `identifiers[]` (array): `{ system, value, isPrimary }`.
  - `insurance` (object): `{ providerCode, policyNumber, validUntil }`.
  - `createdBy` (string): Người thao tác.
- **Ví dụ event**:
  ```json
  {
    "eventId": "4c7f420e-3e35-4a1e-90d9-7ef90acb1123",
    "eventType": "patient.patient_registered",
    "eventVersion": 1,
    "occurredAt": "2025-09-25T04:20:03.512Z",
    "producer": "patient-registry-service",
    "traceId": "trace-a021bc55ef",
    "metadata": {
      "actorId": "user-1001",
      "actorRole": "receptionist",
      "tenantId": "hospital-hn"
    },
    "payload": {
      "patientId": "pat-9b31f4d4-0d27-4ff2-9b91-6c6f794fe201",
      "registryVersion": 1,
      "tenantId": "hospital-hn",
      "demographics": {
        "fullName": "Nguyễn Văn An",
        "dateOfBirth": "1988-07-12",
        "gender": "male",
        "language": "vi"
      },
      "contact": {
        "primaryPhone": "+84-912345678",
        "email": "an.nguyen@example.com",
        "address": {
          "line1": "123 Giải Phóng",
          "city": "Hà Nội",
          "province": "HN",
          "country": "VN"
        }
      },
      "identifiers": [
        {
          "system": "national_id",
          "value": "038088000999",
          "isPrimary": true
        },
        {
          "system": "hospital_mrn",
          "value": "MRN-20250925-001",
          "isPrimary": false
        }
      ],
      "insurance": {
        "providerCode": "BHYT",
        "policyNumber": "HN-1234567890",
        "validUntil": "2026-09-25"
      },
      "createdBy": "user-1001"
    }
  }
  ```

### Provider/Staff
#### ProviderCreated
- **eventType**: `provider.provider_created`
- **Mục đích**: Đồng bộ nhân sự mới cho Scheduling, Clinical/EMR và Notifications.
- **Trigger**: Tạo provider/staff thành công trong Provider Service.
- **Consumers chính**: `Scheduling` (publish availability), `Clinical/EMR` (gán encounter), `Notifications` (welcome nội bộ).
- **Payload fields**:
  - `providerId` (string, UUID).
  - `tenantId` (string).
  - `fullName` (string), `displayName` (string).
  - `role` (string): `doctor` \| `nurse` \| `technician` \| `admin`.
  - `departmentId` (string), `departmentName` (string).
  - `specialtyCodes[]` (array string).
  - `licenseNumber` (string, optional), `licenseValidUntil` (date, optional).
  - `employmentType` (string): `full_time` \| `part_time` \| `contract`.
  - `activeFrom` (date).
- **Ví dụ event**:
  ```json
  {
    "eventId": "b0bb89b9-2428-4c28-8f3f-4e3cf9a30d11",
    "eventType": "provider.provider_created",
    "eventVersion": 1,
    "occurredAt": "2025-09-25T04:25:40.002Z",
    "producer": "provider-staff-service",
    "traceId": "trace-090a9123fb",
    "metadata": {
      "actorId": "user-2001",
      "actorRole": "hr_manager",
      "tenantId": "hospital-hn"
    },
    "payload": {
      "providerId": "pro-22b6d90c-7a04-470d-9bdf-7b61c8a2aabc",
      "tenantId": "hospital-hn",
      "fullName": "Bác sĩ Trần Minh Khoa",
      "displayName": "BS. Trần Minh Khoa",
      "role": "doctor",
      "departmentId": "dept-cardiology",
      "departmentName": "Tim mạch",
      "specialtyCodes": ["CARDIO"],
      "licenseNumber": "LIC-456789",
      "licenseValidUntil": "2027-12-31",
      "employmentType": "full_time",
      "activeFrom": "2024-01-01"
    }
  }
  ```

#### ProviderUpdated
- **eventType**: `provider.provider_updated`
- **Mục đích**: Phát hiện thay đổi phòng ban, chuyên khoa, tình trạng hoạt động để các service cập nhật read model.
- **Trigger**: PUT/PATCH thông tin provider hoàn tất transaction.
- **Consumers chính**: `Scheduling`, `Clinical/EMR`, `Notifications`.
- **Payload fields**:
  - `providerId` (string).
  - `changes` (array): `{ field, previousValue, newValue }`.
  - `effectiveAt` (datetime).
  - `updatedBy` (string).
- **Ví dụ event**:
  ```json
  {
    "eventId": "0b7fcec3-5527-4a56-8cb6-1bb451d74298",
    "eventType": "provider.provider_updated",
    "eventVersion": 1,
    "occurredAt": "2025-09-25T05:10:11.442Z",
    "producer": "provider-staff-service",
    "traceId": "trace-321c54d0aa",
    "payload": {
      "providerId": "pro-22b6d90c-7a04-470d-9bdf-7b61c8a2aabc",
      "changes": [
        {
          "field": "departmentId",
          "previousValue": "dept-cardiology",
          "newValue": "dept-emergency"
        },
        {
          "field": "specialtyCodes",
          "previousValue": ["CARDIO"],
          "newValue": ["ER"]
        }
      ],
      "effectiveAt": "2025-10-01T00:00:00Z",
      "updatedBy": "user-2002"
    }
  }
  ```

### Scheduling
#### AppointmentBooked
- **eventType**: `scheduling.appointment_booked`
- **Mục đích**: Thông báo lịch hẹn mới, phục vụ workflow hướng bệnh nhân và chuẩn bị encounter.
- **Trigger**: POST `/appointments` thành công (state `booked`).
- **Consumers chính**: `Notifications`, `Billing`, `Clinical/EMR`, Patient Portal.
- **Payload fields**:
  - `appointmentId` (string, UUID).
  - `patientId` (string), `providerId` (string).
  - `slot.start` (datetime), `slot.end` (datetime), `timezone` (string).
  - `locationId` (string), `locationName` (string).
  - `visitType` (string): `consultation` \| `follow_up` \| `telehealth`.
  - `bookingChannel` (string): `frontdesk` \| `portal` \| `callcenter`.
  - `requiresDeposit` (boolean).
  - `notes` (string, optional).
- **Ví dụ event**:
  ```json
  {
    "eventId": "1f55c8ab-5f90-4b25-a3b5-6f9a3c6f46b1",
    "eventType": "scheduling.appointment_booked",
    "eventVersion": 1,
    "occurredAt": "2025-09-25T05:30:00.100Z",
    "producer": "scheduling-service",
    "traceId": "trace-55f00af12c",
    "payload": {
      "appointmentId": "app-10001",
      "patientId": "pat-9b31f4d4-0d27-4ff2-9b91-6c6f794fe201",
      "providerId": "pro-22b6d90c-7a04-470d-9bdf-7b61c8a2aabc",
      "slot": {
        "start": "2025-09-27T08:00:00+07:00",
        "end": "2025-09-27T08:30:00+07:00",
        "timezone": "Asia/Ho_Chi_Minh"
      },
      "locationId": "room-501",
      "locationName": "Phòng khám 501",
      "visitType": "consultation",
      "bookingChannel": "frontdesk",
      "requiresDeposit": true,
      "notes": "Lần khám đầu"
    }
  }
  ```

#### AppointmentCanceled
- **eventType**: `scheduling.appointment_canceled`
- **Mục đích**: Giải phóng slot, cập nhật notification, hoàn tiền nếu cần.
- **Trigger**: POST `/appointments/{id}/cancel` thành công.
- **Consumers chính**: `Notifications`, `Billing`, `Clinical/EMR` (đóng encounter dự kiến), Patient Portal.
- **Payload fields**:
  - `appointmentId` (string).
  - `patientId`, `providerId` (string).
  - `canceledBy` (string): `patient` \| `staff` \| `system`.
  - `reasonCode` (string).
  - `previousStatus` (string).
  - `canceledAt` (datetime).
  - `refundRequired` (boolean).
- **Ví dụ event**:
  ```json
  {
    "eventId": "38f1ec88-ef45-49fc-a8e4-7b8b2d4a6c77",
    "eventType": "scheduling.appointment_canceled",
    "eventVersion": 1,
    "occurredAt": "2025-09-26T02:15:55.551Z",
    "producer": "scheduling-service",
    "traceId": "trace-77a65ef0aa",
    "payload": {
      "appointmentId": "app-10001",
      "patientId": "pat-9b31f4d4-0d27-4ff2-9b91-6c6f794fe201",
      "providerId": "pro-22b6d90c-7a04-470d-9bdf-7b61c8a2aabc",
      "canceledBy": "patient",
      "reasonCode": "patient_unavailable",
      "previousStatus": "booked",
      "canceledAt": "2025-09-26T02:15:55.551Z",
      "refundRequired": true
    }
  }
  ```

#### AppointmentCheckedIn
- **eventType**: `scheduling.appointment_checked_in`
- **Mục đích**: Báo cho Clinical/EMR mở encounter và Billing chuẩn bị charge.
- **Trigger**: Frontdesk xác nhận bệnh nhân đã tới (PATCH trạng thái `checked_in`).
- **Consumers chính**: `Clinical/EMR`, `Billing`, `Notifications` (gửi hướng dẫn tiếp đón).
- **Payload fields**:
  - `appointmentId` (string), `patientId` (string), `providerId` (string).
  - `checkInTime` (datetime).
  - `receptionistId` (string).
  - `locationId` (string), `queueNumber` (string optional).
- **Ví dụ event**:
  ```json
  {
    "eventId": "9df8206e-8593-4164-b07a-936df7f835a3",
    "eventType": "scheduling.appointment_checked_in",
    "eventVersion": 1,
    "occurredAt": "2025-09-27T07:45:05.010Z",
    "producer": "scheduling-service",
    "traceId": "trace-11ff4bb0c3",
    "payload": {
      "appointmentId": "app-10001",
      "patientId": "pat-9b31f4d4-0d27-4ff2-9b91-6c6f794fe201",
      "providerId": "pro-22b6d90c-7a04-470d-9bdf-7b61c8a2aabc",
      "checkInTime": "2025-09-27T07:45:00+07:00",
      "receptionistId": "user-8821",
      "locationId": "room-501",
      "queueNumber": "A032"
    }
  }
  ```

### Clinical / EMR
#### EncounterOpened
- **eventType**: `clinical.encounter_opened`
- **Mục đích**: Cho biết encounter lâm sàng đã khởi tạo, các module khác chuẩn bị dữ liệu cần thiết.
- **Trigger**: Clinical Service tạo encounter ở trạng thái `open`, thường sau `AppointmentCheckedIn`.
- **Consumers chính**: `Billing` (dự phòng invoice), `Notifications` (gửi hướng dẫn), Analytics.
- **Payload fields**:
  - `encounterId` (string), `appointmentId` (string optional), `patientId`, `providerId`.
  - `encounterType` (string): `outpatient` \| `inpatient` \| `telehealth`.
  - `locationId` (string), `departmentId` (string).
  - `openedAt` (datetime).
  - `initiatedBy` (string).
- **Ví dụ event**:
  ```json
  {
    "eventId": "78e2840a-61f7-4d49-87a5-9f89e3a6db1a",
    "eventType": "clinical.encounter_opened",
    "eventVersion": 1,
    "occurredAt": "2025-09-27T07:50:00.300Z",
    "producer": "clinical-emr-service",
    "traceId": "trace-2210ff0cda",
    "payload": {
      "encounterId": "enc-60001",
      "appointmentId": "app-10001",
      "patientId": "pat-9b31f4d4-0d27-4ff2-9b91-6c6f794fe201",
      "providerId": "pro-22b6d90c-7a04-470d-9bdf-7b61c8a2aabc",
      "encounterType": "outpatient",
      "locationId": "room-501",
      "departmentId": "dept-cardiology",
      "openedAt": "2025-09-27T07:50:00+07:00",
      "initiatedBy": "user-3301"
    }
  }
  ```

#### ObservationRecorded
- **eventType**: `clinical.observation_recorded`
- **Mục đích**: Thông báo ghi nhận kết quả xét nghiệm/quan sát để Notifications gửi cho bệnh nhân và Analytics cập nhật dashboard.
- **Trigger**: Clinical Service ghi observation mới (lab result, vital sign, imaging note).
- **Consumers chính**: `Notifications`, `Analytics`, Data Warehouse.
- **Payload fields**:
  - `encounterId` (string), `observationId` (string).
  - `category` (string): `lab` \| `vital` \| `note`.
  - `code` (string): LOINC/SNOMED code.
  - `value` (string \| number \| object).
  - `unit` (string, optional).
  - `performedAt` (datetime).
  - `orderedBy` (string).
- **Ví dụ event**:
  ```json
  {
    "eventId": "6c0a9e0f-514d-42c5-902f-1cd57ce394e8",
    "eventType": "clinical.observation_recorded",
    "eventVersion": 1,
    "occurredAt": "2025-09-27T08:20:45.612Z",
    "producer": "clinical-emr-service",
    "traceId": "trace-55daaa81af",
    "payload": {
      "encounterId": "enc-60001",
      "observationId": "obs-70001",
      "category": "lab",
      "code": "4548-4",
      "value": 5.2,
      "unit": "mmol/L",
      "performedAt": "2025-09-27T08:20:30+07:00",
      "orderedBy": "pro-22b6d90c-7a04-470d-9bdf-7b61c8a2aabc"
    }
  }
  ```

#### EncounterClosed
- **eventType**: `clinical.encounter_closed`
- **Mục đích**: Bàn giao kết quả để Billing phát invoice, Notifications tổng hợp, Analytics snapshot.
- **Trigger**: Encounter chuyển trạng thái `closed`.
- **Consumers chính**: `Billing`, `Notifications`, Data Warehouse.
- **Payload fields**:
  - `encounterId` (string), `appointmentId` (string optional), `patientId`, `providerId`.
  - `status` (string): `completed` \| `terminated`.
  - `summary` (string): Tóm tắt chẩn đoán ngắn.
  - `diagnosisCodes[]` (array string, ICD-10).
  - `closedAt` (datetime).
  - `nextActions[]` (array string, optional).
- **Ví dụ event**:
  ```json
  {
    "eventId": "e16ae7c1-3f3d-4e57-9aa4-8cb9327d1532",
    "eventType": "clinical.encounter_closed",
    "eventVersion": 1,
    "occurredAt": "2025-09-27T09:10:15.220Z",
    "producer": "clinical-emr-service",
    "traceId": "trace-990a56ef11",
    "payload": {
      "encounterId": "enc-60001",
      "appointmentId": "app-10001",
      "patientId": "pat-9b31f4d4-0d27-4ff2-9b91-6c6f794fe201",
      "providerId": "pro-22b6d90c-7a04-470d-9bdf-7b61c8a2aabc",
      "status": "completed",
      "summary": "Tăng huyết áp độ 1, kê đơn thuốc điều hòa huyết áp",
      "diagnosisCodes": ["I10"],
      "closedAt": "2025-09-27T09:10:15+07:00",
      "nextActions": ["follow_up_30_days"]
    }
  }
  ```

### Billing
#### InvoiceCreated
- **eventType**: `billing.invoice_created`
- **Mục đích**: Thông báo hóa đơn mới để Notifications gửi yêu cầu thanh toán và Scheduling/Saga theo dõi.
- **Trigger**: Billing Service tạo invoice (thường theo `EncounterClosed` hoặc `AppointmentBooked` yêu cầu đặt cọc).
- **Consumers chính**: `Notifications`, `Scheduling` (giữ slot nếu chưa thanh toán), Patient Portal.
- **Payload fields**:
  - `invoiceId` (string).
  - `patientId` (string), `encounterId` (string optional), `appointmentId` (string optional).
  - `amount` (number), `currency` (string), `status` (string): `pending` \| `paid` \| `void`.
  - `dueDate` (date).
  - `lineItems[]`: `{ code, description, quantity, unitPrice }`.
  - `payerType` (string): `self` \| `insurance` \| `mixed`.
- **Ví dụ event**:
  ```json
  {
    "eventId": "fc8204b2-55c9-4c45-91e8-9f5f56859682",
    "eventType": "billing.invoice_created",
    "eventVersion": 1,
    "occurredAt": "2025-09-27T09:12:00.000Z",
    "producer": "billing-service",
    "traceId": "trace-44aa22bb66",
    "payload": {
      "invoiceId": "inv-50001",
      "patientId": "pat-9b31f4d4-0d27-4ff2-9b91-6c6f794fe201",
      "encounterId": "enc-60001",
      "appointmentId": "app-10001",
      "amount": 1200000,
      "currency": "VND",
      "status": "pending",
      "dueDate": "2025-09-30",
      "lineItems": [
        {
          "code": "CONSULT",
          "description": "Khám bác sĩ chuyên khoa",
          "quantity": 1,
          "unitPrice": 800000
        },
        {
          "code": "LAB-BIO",
          "description": "Xét nghiệm sinh hóa",
          "quantity": 1,
          "unitPrice": 400000
        }
      ],
      "payerType": "self"
    }
  }
  ```

#### PaymentSucceeded
- **eventType**: `billing.payment_succeeded`
- **Mục đích**: Thông báo thanh toán thành công để cập nhật lịch (nếu giữ slot), gửi biên lai và khóa các hành động tiếp theo.
- **Trigger**: Callback PayOS/đối soát nội bộ xác nhận giao dịch thành công.
- **Consumers chính**: `Scheduling`, `Notifications`, `Clinical/EMR` (đảm bảo phát thuốc chỉ sau khi thanh toán), Accounting.
- **Payload fields**:
  - `paymentId` (string), `invoiceId` (string).
  - `patientId` (string).
  - `amount` (number), `currency` (string).
  - `method` (string): `cash` \| `card` \| `bank_transfer` \| `payos`.
  - `processedAt` (datetime).
  - `transactionReference` (string).
- **Ví dụ event**:
  ```json
  {
    "eventId": "3d4f8535-6f54-4a16-92c4-3c1fc037d230",
    "eventType": "billing.payment_succeeded",
    "eventVersion": 1,
    "occurredAt": "2025-09-27T09:40:12.444Z",
    "producer": "billing-service",
    "traceId": "trace-5e5aa771cb",
    "payload": {
      "paymentId": "pay-88001",
      "invoiceId": "inv-50001",
      "patientId": "pat-9b31f4d4-0d27-4ff2-9b91-6c6f794fe201",
      "amount": 1200000,
      "currency": "VND",
      "method": "payos",
      "processedAt": "2025-09-27T09:40:12+07:00",
      "transactionReference": "PAYOS-20250927-9988"
    }
  }
  ```

#### PaymentFailed
- **eventType**: `billing.payment_failed`
- **Mục đích**: Báo lỗi thanh toán để Notifications gửi cảnh báo, Scheduling quyết định giải phóng slot hoặc retry saga.
- **Trigger**: Thanh toán bị lỗi/timeout hoặc PayOS trả về thất bại.
- **Consumers chính**: `Scheduling`, `Notifications`, `Billing` retry worker.
- **Payload fields**:
  - `paymentId` (string), `invoiceId` (string).
  - `patientId` (string).
  - `amount` (number), `currency` (string).
  - `failureReason` (string).
  - `retryable` (boolean).
  - `failedAt` (datetime).
- **Ví dụ event**:
  ```json
  {
    "eventId": "55d7cf71-dde5-48eb-9c3e-5d9a2c82f6f2",
    "eventType": "billing.payment_failed",
    "eventVersion": 1,
    "occurredAt": "2025-09-27T09:41:00.000Z",
    "producer": "billing-service",
    "traceId": "trace-5e5aa771cb",
    "payload": {
      "paymentId": "pay-88001",
      "invoiceId": "inv-50001",
      "patientId": "pat-9b31f4d4-0d27-4ff2-9b91-6c6f794fe201",
      "amount": 1200000,
      "currency": "VND",
      "failureReason": "payos_timeout",
      "retryable": true,
      "failedAt": "2025-09-27T09:41:00+07:00"
    }
  }
  ```

### Notifications
Notifications chủ yếu consume sự kiện; khi cần audit có thể phát `notifications.delivery_failed` vào DLQ. Định nghĩa sẽ được bổ sung ở giai đoạn triển khai DLQ.

## 📊 Read model projections đề xuất
| Projection | Nguồn sự kiện | Consumer chính | Mục đích nghiệp vụ | Cập nhật |
| --- | --- | --- | --- | --- |
| `Scheduling.CalendarAvailability` | `provider.provider_created/updated`, `scheduling.appointment_booked/canceled` | Frontend đặt lịch, Provider portal | Hiển thị slot trống, phụ trợ auto-matching | Streaming theo event (quasi real-time) |
| `Scheduling.AppointmentTimeline` | `scheduling.appointment_booked/canceled/checked_in`, `billing.payment_succeeded/failed` | Quầy tiếp đón, điều dưỡng | Theo dõi trạng thái từng lịch hẹn trong ngày | Streaming theo event |
| `Clinical.PatientEncounterSummary` | `patient.patient_registered`, `clinical.encounter_opened/closed`, `clinical.observation_recorded` | Bác sĩ, EMR viewer | Tổng hợp encounter gần nhất, kết quả xét nghiệm, hướng dẫn tiếp theo | Rebuild theo event, cache 15 phút |
| `Billing.PatientFinancialLedger` | `billing.invoice_created`, `billing.payment_succeeded/failed`, `clinical.encounter_closed` | Nhóm tài chính, patient portal | Theo dõi hóa đơn, dư nợ, lịch sử thanh toán | Streaming + nightly reconciliation |
| `Notifications.EventDigest` | Tất cả sự kiện chính (Patient, Scheduling, Clinical, Billing) | Notification service, marketing automation | Lập queue gửi thông báo, batch digest | Batch mỗi 15 phút + realtime cho critical |
| `Identity.AccessHeatmap` | `identity.access_audit_logged` | Bảo mật, compliance | Phân tích truy cập bất thường theo khoa/thiết bị | Batch ETL hàng giờ |

## 🚀 Quy trình chia sẻ với đội ngũ
1. Tạo PR bổ sung tài liệu này vào `docs/` và gắn label `architecture` để review liên phòng ban.
2. Tổ chức buổi walkthrough 30 phút (Architect + Lead của từng bounded context) để thống nhất contract và versioning.
3. Đăng ký mỗi event vào schema registry (ví dụ: `docs/schema-registry.json`) và cập nhật pipeline CI để validate breaking change.
4. Cập nhật backlog Jira: tạo task implement publisher/consumer tương ứng cho mỗi service, liên kết tới tài liệu này.
5. Sau khi merge, thông báo qua Slack `#hms-arch` kèm checklist áp dụng (config outbox, retry policy, DLQ).
