Tổng quan hệ thống người dùng**

- Lớp Auth gốc: `auth.users` (Supabase Auth) + `auth.identities`. Mọi account đều bắt đầu ở đây.
- Lớp hồ sơ mở rộng: `auth_schema.user_profiles` (metadata đầy đủ), `auth_schema.user_roles` (RBAC), `auth_schema.user_permissions` (override per-user), `auth_schema.two_factor_auth`/`two_factor_attempts` (2FA), `auth_schema.user_sessions` (phiên đăng nhập khi có), `auth_schema.login_attempts` (audit đăng nhập), `auth_schema.security_audit_events` (ghi log thao tác nhạy cảm).
- Lớp dịch vụ domain: mỗi service có schema riêng (ví dụ `patient_schema`, `provider_schema`, `appointments_schema`). Các bảng domain giữ reference tới `auth.users.id` hoặc `auth_schema.user_profiles.id` để đồng bộ thông tin.

**Loại user hiện có**

- **ADMIN**: `auth.users` + `auth_schema.user_profiles` (`role_type='admin'`) + `auth_schema.user_roles` (`role_name='admin'`). Có thể gán thêm quyền đặc biệt trong `auth_schema.user_permissions`. Thường linked với bảng `auth_schema.staff_invitations` và các bảng admin dashboard (nếu có).
- **DOCTOR**: hồ sơ nền trong `auth.users` → `auth_schema.user_profiles` (`role_type='doctor'`) → `auth_schema.user_roles` (`role_name='doctor'`) → bản ghi hành nghề trong `provider_schema.staff_profiles` (liên kết qua `user_id`). Department sync qua `provider_schema.staff_profiles.department_assignments` và bảng master `departments_schema.departments`.
- **NURSE**: tương tự doctor nhưng `staff_type='nurse'`.
- **RECEPTIONIST**: user hành chính; `staff_type='receptionist'` nếu có bản ghi trong provider schema.
- **PATIENT**: `auth.users` + `auth_schema.user_profiles` (`role_type='patient'`) + liên kết sang `patient_schema.patients` (trường `user_id` hoặc `patient_id` tùy thiết kế). Hệ thống đang chuẩn bị seeding schema bệnh nhân nên cần duy trì mapping ổn định.

**Thông tin tối thiểu mỗi user cần có**

1. **auth.users**
   - `id` (UUID) – khóa chính, dùng làm foreign key mọi nơi.
   - `email`, `phone`, `raw_user_meta_data` (chứa `full_name`, `primary_role`, số điện thoại) – dữ liệu dùng cho đăng nhập và hiển thị nhanh.
   - `role` (luôn `authenticated` trừ khi super admin), `last_sign_in_at`, `created_at`… dùng cho audit.

2. **auth.identities**
   - `user_id` khớp `auth.users.id`.
   - `provider` (hiện `email`), `identity_data->'email'` – phục vụ SSO/OAuth (mở rộng sau này).

3. **auth_schema.user_profiles**
   - `id` = `auth.users.id` (1-1).
   - Các field bắt buộc: `email`, `full_name`, `phone_number`, `role_type`, `account_status`, `is_active`, `is_verified`.
   - Thông tin mở rộng: `citizen_id`, `date_of_birth`, `gender`, `address`, `emergency_contact_*`, `subscription_*`, `created_by/updated_by`.
   - Đây là nơi các service khác nên đọc để hiển thị profile thống nhất.

4. **auth_schema.user_roles**
   - `user_id` ↔ `auth.users.id`.
   - `role_name` (admin/doctor/nurse/receptionist/patient/...).
   - `assigned_by`, `assigned_at` – phục vụ audit & RBAC. Từ đây repo quyền kết hợp role → permission.

5. **auth_schema.user_permissions** (tùy chọn)
   - Các override per-user. Chỉ điền khi cần cấp quyền vượt role.
   - Trường bắt buộc: `user_id`, `permission_name`, `granted_at`; nên điền `granted_by`.

6. **auth_schema.two_factor_auth / two_factor_attempts**
   - Bật 2FA: `user_id`, `method`, `is_enabled`, `secret_key`, `backup_codes`.
   - Log từng lần thử trong `two_factor_attempts`.

7. **auth_schema.user_sessions** + `login_attempts`, `security_audit_events`
   - Lưu audit login/session, IP, user-agent, trạng thái.

**Quan hệ với các schema domain**

- **Provider Service**
  - `provider_schema.staff_profiles.user_id` → `auth.users.id`.
  - `staff_type` xác định DOCTOR/NURSE/ADMIN/RECEPTIONIST.
  - `department_assignments` là JSON chứa `departmentId`, `departmentCode`, `departmentNameEn/Vi`, `role`, `isPrimary`, `isActive`, `startDate`, `endDate`.
  - `departmentId` phải trỏ tới `departments_schema.departments.id`. Khi cập nhật department, cần sửa JSON này để sync. Ví dụ: bác sĩ DOC-0001 hiện đã trỏ tới `f10ee789-ddec-4592-8d03-1161a3c3f4ed` (Cardiology).
  - Các info khác (schedule, specializations, credentials) nằm trong JSON subdocuments.

- **Patient Registry**
  - Bảng chính (ví dụ `patient_schema.patients`) cần trường `user_id` hoặc `profile_id` để sync với `auth_schema.user_profiles`.
  - Khi tạo bệnh nhân mới từ identity-service, workflow nên:
    1. Tạo `auth.users`.
    2. Ghi `auth_schema.user_profiles` + gán `user_roles`.
    3. Gọi Patient service để tạo bản ghi domain, giữ `user_id` reference.

- **Appointments Service**
  - `appointments_schema.appointments` chứa `doctor_id` (soft ref tới `provider_schema.staff_profiles.staff_id`) và `department_id` (hiện rỗng, cần chuyển sang dùng `departments_schema.departments.id` hoặc `department_code` thống nhất).
  - `provider_read_model`, `patient_read_model`, `queues`, `provider_work_schedules`… là các bảng đọc phục vụ CQRS; đã được truncate để chuẩn bị seed mới, nên khi import dữ liệu phải đảm bảo mapping user/doctor/patient theo các ID chuẩn ở trên.

**Luồng đồng bộ đề xuất**

1. **Tạo user mới**
   - Identity Service tạo `auth.users`, `auth_schema.user_profiles`, `auth_schema.user_roles`, optional `user_permissions`.
   - Nếu user là nhân viên y tế → Provider Service tạo `staff_profiles` với `user_id` + department_assignments (dùng ID thực từ Department Service).
   - Nếu user là bệnh nhân → Patient Service tạo `patients` (gắn `user_id`).
   - Đối với các service khác (Appointments, Clinical, Billing…), chỉ sử dụng `user_id` hoặc các mã domain (`staff_id`, `patient_id`) được phát sinh ở step tương ứng nhưng phải lưu `user_id` để đồng bộ.

2. **Đồng bộ department**
   - Department Service quản lý bảng master `departments_schema.departments`.
   - Provider Service chỉ lưu thông tin department như bản sao (JSON) để truy cập nhanh; phải cập nhật khi department thay đổi. Có thể thêm trigger/job để refresh.

3. **RBAC & quyền đặc thù**
   - Service nào cần kiểm soát quyền nên query `SupabasePermissionRepository`:
     - Bước 1: lấy toàn bộ override từ `user_permissions`.
     - Bước 2: lấy role từ `user_roles` và ánh xạ sang permission qua `role_permissions` + `healthcare_roles`.
     - Bước 3: expand theo `permission_inheritance`.
   - Chỉ khi cần grant manual mới thêm bản ghi `user_permissions`.

4. **Audit & bảo mật**
   - Mọi thao tác quan trọng (grant/revoke, login, truy cập PHI) phải ghi vào `auth_schema.security_audit_events`, `phi_access_log` (khi truy cập hồ sơ bệnh nhân).
   - `appointments_schema.phi_access_logs` đã bị truncate và sẽ được ghi lại khi hệ thống mới chạy.

**Checklist dữ liệu cho mỗi loại user**

- **Trường chung** (tất cả user):
  - `auth.users`: `id`, `email`, `role`, `raw_user_meta_data.full_name`, `created_at`.
  - `auth_schema.user_profiles`: `full_name`, `phone_number`, `role_type`, `account_status`, `is_active`.

- **ADMIN**
  - `auth_schema.user_roles.role_name = 'admin'`.
  - Có thể có bản ghi trong `auth_schema.admins` (nếu schema dùng) – hiện bảng trống.
  - Optional: `auth_schema.user_permissions` cho quyền đặc biệt.

- **DOCTOR/NURSE/RECEPTIONIST**
  - `provider_schema.staff_profiles`: `staff_id`, `user_id`, `staff_type`, `department_assignments`, `license_number`, `years_of_experience`, `status`.
  - Department phải khớp với `departments_schema.departments`.
  - Nếu tham gia lịch, `provider_work_schedules` sẽ sync theo `staff_id`.

- **PATIENT**
  - `patient_schema.patients`: `patient_id`, `user_id`, thông tin BHYT/BHTN, emergency contacts.
  - Appointments hoặc Clinical service sử dụng `patient_id`, nhưng nên luôn lưu `user_id` để join với profile.
  Đặc tả dữ liệu mới**

  - `provider_schema.staff_profiles`: mỗi bác sĩ có `personal_info`, `professional_info`, `specializations`, `credentials`, `availability`, `department_assignments` chứa đầy đủ `departmentId/Code/NameEn/NameVi`, `hire_date`, `years_of_experience`, `consultation_fee`.
  - `patient_schema.patients`: JSON `personal_info`, `contact_info` (bao gồm emergency contact), `basic_medical_info`, `communication_preference` và `status = active`. `insurance_info` chia đều các loại `BHYT/BHTN/private/self_pay`.
  - `auth.users` tổng hợp: `doctor_accounts=81`, `patient_accounts=51`, `admin_accounts=2` (chưa kể 3 account cũ). Toàn bộ `raw_user_meta_data`/`phone` đã khớp.
  - `auth_schema.user_roles` được bổ sung tương ứng (role `doctor`/`patient`/`admin`); `user_profiles.created_by/updated_by` trỏ về admin gốc (`b0f3bb3c-5ff2-4957-8da1-1e01951ed245`).
