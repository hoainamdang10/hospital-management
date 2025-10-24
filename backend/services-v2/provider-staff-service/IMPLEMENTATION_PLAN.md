# Provider Staff Service - Implementation Plan
## Missing Endpoints & Critical Fixes

**Date**: 2025-01-22
**Status**: Implementation Required

---

## TÓM TẮT CÁC VẤN ĐỀ

### 1. Event Publishing (HIGH) ⚠️
- Domain events không thoát khỏi service
- Chỉ publish vào SupabaseEventBus, không tới RabbitMQ
- Các service khác không nhận được updates

### 2. UpdateStaffInfo Handler (HIGH) ⚠️
- PUT /api/v1/staff/:staffId không hoạt động thật
- Handler chỉ return success giả với TODO
- UpdateStaffProfileUseCase không được gọi

### 3. UpdateStaffProfileUseCase (HIGH) ⚠️
- Tạo PersonalInfo/ProfessionalInfo mới nhưng không gán vào aggregate
- ProviderStaff thiếu methods updatePersonalInfo() và updateProfessionalInfo()

### 4. GetStaffProfile by License (MEDIUM) ⚠️
- GET /api/v1/staff/license/:licenseNumber luôn fail
- Use case không hỗ trợ licenseNumber lookup

### 5. Duplicate /health Endpoint (LOW) ⚠️
- /health được đăng ký 2 lần
- Bản detailed bị middleware 404 chặn

### 6. Missing Endpoints ❌
- Schedule Management (PUT/GET /api/v1/staff/:staffId/schedule)
- Availability Management (GET/POST/PUT/DELETE /api/v1/staff/:staffId/availability)
- Specialization Management (GET/POST/PUT/DELETE /api/v1/staff/:staffId/specializations)

---

## GIẢI PHÁP CHI TIẾT

Xem file đầy đủ trong repository để biết implementation details.

**Estimated Effort**: 50.5 hours (~1.5 weeks)

**Priority Order**:
1. Fix event publishing (4h)
2. Fix UpdateStaffInfo handler (2h)
3. Fix UpdateStaffProfileUseCase (3h)
4. Fix GetStaffProfile by license (1h)
5. Fix duplicate /health (0.5h)
6. Implement missing endpoints (20h)
7. Testing (16h)
8. Documentation (4h)

---

**Author**: AI Agent  
**Date**: 2025-01-22
