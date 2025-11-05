# TODO - Hospital Management System

## Những gì đã làm xong

### Frontend & UI Components

- [Đã làm] Đã xây dựng xong toàn bộ UI components dựa trên shadcn/ui
- [Đã làm] Tích hợp theme dark/light mode, có thể chuyển đổi được
- [Đã làm] Landing page với đầy đủ sections: Hero, Services, Doctors, Why Choose Us, Footer
- [Đã làm] Responsive design, hỗ trợ mobile và desktop
- [Đã làm] PWA support - có thể install app, có service worker và manifest
- [Đã làm] Notification system với toast notifications (dùng sonner)
- [Đã làm] Chat system component (chưa test kỹ với backend)

### Authentication & Authorization

- [Đã làm] AuthContext đã setup, có login/logout
- [Đã làm] Session management component
- [Đã làm] MFA setup component (UI đã có, chưa tích hợp backend)
- [Đã làm] Email verification component (UI đã có)
- [Đã làm] Change password component
- [Chưa làm] Đang dùng mock users, chưa kết nối với backend thật
- [Chưa làm] Role-based access control có trong code nhưng chưa enforce đầy đủ

### Quản lý Appointments

- [Đã làm] UI đầy đủ cho appointment management
- [Đã làm] AppointmentOperations component với các tính năng: confirm, cancel, reschedule, check-in, complete
- [Đã làm] Service API đã setup (AppointmentServiceAPI)
- [Chưa làm] Cần test với backend thật xem các endpoints có hoạt động không

### Quản lý Bệnh nhân

- [Đã làm] PatientManagement component
- [Đã làm] MedicalRecordsManagement component
- [Đã làm] QueueManagement component
- [Đã làm] AppointmentManagement cho bệnh nhân
- [Đã làm] Service APIs đã có

### Quản lý Bác sĩ

- [Đã làm] DoctorManagement component
- [Đã làm] PrescriptionManagement component
- [Đã làm] ScheduleManagement component
- [Đã làm] StaffScheduleManagement component
- [Đã làm] Service APIs đã setup

### Quản lý Admin

- [Đã làm] UserManagement component - có UserServiceAPI
- [Đã làm] EquipmentManagement component - có EquipmentServiceAPI
- [Đã làm] DatabaseManagement component - UI đã có, chưa có service API (đang dùng mock data)
- [Đã làm] ReportsManagement component - UI đã có, chưa có service API (đang dùng mock data)
- [Đã làm] SettingsManagement component - UI đã có, chưa có service API (chỉ có local state)

### Billing & Payment

- [Đã làm] BillingManagement component
- [Đã làm] PaymentPage component
- [Đã làm] BillingServiceAPI đã setup

### Clinical Notes

- [Đã làm] ClinicalNotesManagement component
- [Đã làm] Service API có đầy đủ CRUD operations
- [Đã làm] Cosign feature đã có

### Communication

- [Đã làm] NotificationSystem component
- [Đã làm] ChatSystem component
- [Đã làm] ChatBot component
- [Đã làm] ContactSection component

### Service APIs còn thiếu

- [Chưa làm] DatabaseServiceAPI - cho DatabaseManagement component
- [Chưa làm] ReportsServiceAPI - cho ReportsManagement component
- [Chưa làm] SettingsServiceAPI - cho SettingsManagement component

### Features chưa hoàn thiện

- [Chưa làm] Export/Import data (Excel, PDF) - có button UI nhưng chưa có handler/implementation
- [Chưa làm] Advanced search và filtering - chỉ có search cơ bản, chưa có advanced filtering
- [Chưa làm] Real-time updates (WebSocket) - chưa có WebSocket implementation
- [Chưa làm] File upload cho medical records - có icon Upload nhưng chưa có input file và logic upload
- [Chưa làm] Image upload cho prescriptions - chưa có code upload image
- [Chưa làm] Print functionality - chưa có code print
- [Chưa làm] Email notifications - chưa có code gửi email
- [Chưa làm] SMS notifications - chưa có code gửi SMS
- [Chưa làm] Calendar integration - chưa tích hợp calendar bên ngoài (Google Calendar, etc.)
- [Chưa làm] Analytics dashboard với charts thật - ReportsManagement đang dùng mock data hardcoded, chưa fetch từ API

_File này được tạo để giúp người tiếp tục dự án hiểu rõ tình trạng hiện tại. Nếu có thay đổi, nhớ update file này nhé!_
