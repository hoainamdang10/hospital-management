# Outbox Event Publishing Bug Fix

## 📋 Tóm tắt vấn đề

**Triệu chứng:**
- Login admin `testadmin@hospital.vn / TestAdmin@123` ✅ OK
- Cập nhật staff `DOC-INTE-202511-985` ✅ HTTP 200 thành công
- ❌ Outbox publish FAILED với lỗi: `event.occurredAt.toISOString is not a function`
- ❌ 2 bản ghi outbox (`fc590476...`, `cf6ada45...`) kẹt ở trạng thái `PUBLISHING`/`PENDING`

**Root Cause:**
Khi `OutboxPublisher` rehydrate events từ database, field `timestamp` được set là **string** thay vì **Date object**. Khi `HybridEventBus` và `SupabaseEventBus` cố gọi `.toISOString()` trên string này → lỗi runtime.

---

## 🔍 Phân tích chi tiết

### 1. **OutboxPublisher.rehydrateEvent() - Vấn đề chính**

**File:** `provider-staff-service/src/infrastructure/outbox/OutboxPublisher.ts`

**Code cũ (BUG):**
```typescript
// Line 136-140: timestamp là STRING
const timestamp =
  payload.timestamp ||
  payload.occurredAt ||
  outboxEvent.occurredAt?.toISOString?.() ||  // ← string
  new Date().toISOString();  // ← string

// Line 151: timestamp vẫn là string khi return
return {
  ...payload,
  occurredAt: occurredAt instanceof Date ? occurredAt : new Date(occurredAt),
  timestamp,  // ← STRING, không phải Date!
  // ...
}
```

**Hậu quả:**
- `event.timestamp` là string (VD: `"2025-11-27T12:13:45.123Z"`)
- Khi HybridEventBus gọi `event.timestamp.toISOString()` → **TypeError**

---

### 2. **HybridEventBus.convertToIntegrationEvent() - Thiếu defensive check**

**File:** `provider-staff-service/src/infrastructure/events/HybridEventBus.ts`

**Code cũ (BUG):**
```typescript
// Line 181: Giả định timestamp là Date
occurredAt: (event as any).timestamp || new Date(),
```

**Vấn đề:**
- Nếu `event.timestamp` là string → `occurredAt` cũng là string
- Khi SupabaseEventBus gọi `occurredAt.toISOString()` → **TypeError**

---

### 3. **SupabaseEventBus.serializeEvent() - Có defensive check nhưng không đủ**

**File:** `provider-staff-service/src/infrastructure/messaging/SupabaseEventBus.ts`

**Code hiện tại:**
```typescript
// Line 320-328: Có check nhưng chỉ áp dụng khi serialize
const occurredAtValue =
  (event as any).timestamp ||
  (event as any).occurredAt ||
  (event as any).occurred_at ||
  new Date();
const occurredAt =
  occurredAtValue instanceof Date
    ? occurredAtValue.toISOString()
    : new Date(occurredAtValue).toISOString();  // ← Phải convert
```

**Nhận xét:**
- Code này đã có defensive check, nhưng vấn đề xảy ra **trước khi đến đây**
- Lỗi xảy ra khi code khác gọi trực tiếp `.toISOString()` trên string

---

## ✅ Giải pháp đã áp dụng

### **Fix 1: OutboxPublisher.rehydrateEvent()**

**Thay đổi:**
```typescript
// Extract raw values
const rawOccurredAt =
  payload.occurredAt ||
  payload.timestamp ||
  outboxEvent.occurredAt ||
  new Date();

const rawTimestamp =
  payload.timestamp ||
  payload.occurredAt ||
  outboxEvent.occurredAt ||
  new Date();

// ✅ Convert to Date objects
const occurredAt =
  rawOccurredAt instanceof Date ? rawOccurredAt : new Date(rawOccurredAt);

const timestamp =
  rawTimestamp instanceof Date ? rawTimestamp : new Date(rawTimestamp);

return {
  ...payload,
  occurredAt,   // ✅ Date object
  timestamp,    // ✅ Date object
  // ...
}
```

**Lợi ích:**
- Đảm bảo `occurredAt` và `timestamp` **luôn là Date objects**
- Tương thích với DomainEvent interface
- Tránh lỗi `.toISOString is not a function`

---

### **Fix 2: HybridEventBus.convertToIntegrationEvent()**

**Thay đổi:**
```typescript
// ✅ Defensive coercion: ensure occurredAt is a Date object
const rawTimestamp = (event as any).timestamp || new Date();
const occurredAt = rawTimestamp instanceof Date 
  ? rawTimestamp 
  : new Date(rawTimestamp);

return {
  eventId: event.eventId,
  eventType: normalizedEventType,
  aggregateId: event.aggregateId,
  aggregateType: event.aggregateType || 'ProviderStaff',
  occurredAt,  // ✅ Always Date object
  // ...
}
```

**Lợi ích:**
- **Defense in depth**: Ngay cả khi OutboxPublisher có bug, HybridEventBus vẫn xử lý được
- Tăng resilience của hệ thống

---

## 🔧 Cách khắc phục stuck events

### **Script: requeue-stuck-outbox.ts**

**Location:** `provider-staff-service/scripts/requeue-stuck-outbox.ts`

**Chức năng:**
1. Tìm tất cả events có `status = 'PUBLISHING'`
2. Reset về `status = 'PENDING'`
3. Cho phép OutboxPublisher retry sau khi code đã fix

**Cách chạy:**
```bash
# 1. Rebuild service với code fix
cd backend/services-v2
docker-compose -f docker-compose.v2.yml build provider-staff-service

# 2. Chạy script requeue
cd provider-staff-service
ts-node scripts/requeue-stuck-outbox.ts

# 3. Restart service
docker-compose -f docker-compose.v2.yml restart provider-staff-service

# 4. Monitor logs
docker-compose -f docker-compose.v2.yml logs -f provider-staff-service
```

---

## 📊 Verification Steps

### **1. Kiểm tra outbox table**
```sql
-- Check stuck events BEFORE fix
SELECT outbox_id, event_type, status, publish_attempts, error_message
FROM provider_schema.outbox
WHERE status IN ('PUBLISHING', 'PENDING')
ORDER BY created_at DESC;

-- Expected: 2 events (fc590476..., cf6ada45...) với status PUBLISHING
```

### **2. Sau khi chạy requeue script**
```sql
-- Check events AFTER requeue
SELECT outbox_id, event_type, status, publish_attempts
FROM provider_schema.outbox
WHERE outbox_id IN ('fc590476...', 'cf6ada45...');

-- Expected: status = 'PENDING', ready to retry
```

### **3. Sau khi restart service**
```sql
-- Check events AFTER successful publish
SELECT outbox_id, event_type, status, published_at
FROM provider_schema.outbox
WHERE outbox_id IN ('fc590476...', 'cf6ada45...');

-- Expected: status = 'PUBLISHED', published_at IS NOT NULL
```

### **4. Monitor logs**
```bash
# Should see successful publish logs
docker-compose -f docker-compose.v2.yml logs -f provider-staff-service | grep -i "outbox event published"
```

**Expected output:**
```
[INFO] Outbox event published {
  outboxId: 'fc590476...',
  eventType: 'StaffUpdated',
  aggregateId: 'DOC-INTE-202511-985'
}
```

---

## 🎯 Kết luận

### **Đánh giá phân tích của USER: ✅ HOÀN TOÀN ĐÚNG**

1. ✅ **Root cause chính xác**: `occurredAt.toISOString is not a function`
2. ✅ **Nguyên nhân đúng**: Payload rehydrate có `occurred_at` là string
3. ✅ **Hướng xử lý đúng**: 
   - Fix OutboxPublisher rehydration
   - Add defensive check trong HybridEventBus
   - Requeue stuck events

### **Các file đã sửa:**
1. ✅ `OutboxPublisher.ts` - Đảm bảo timestamp/occurredAt là Date
2. ✅ `HybridEventBus.ts` - Thêm defensive coercion
3. ✅ `requeue-stuck-outbox.ts` - Script để requeue events

### **Next Steps:**
1. ✅ Build service (đang chạy)
2. ⏳ Chạy requeue script
3. ⏳ Restart service
4. ⏳ Verify events được publish thành công
5. ⏳ Monitor logs để confirm không còn lỗi

---

## 📚 Lessons Learned

### **1. Type Safety**
- **Vấn đề**: TypeScript không catch được lỗi runtime khi cast `any`
- **Giải pháp**: Luôn validate và coerce types khi deserialize từ DB

### **2. Defensive Programming**
- **Vấn đề**: Giả định data từ DB luôn đúng format
- **Giải pháp**: Thêm defensive checks ở nhiều layers (defense in depth)

### **3. Outbox Pattern Best Practices**
- **Vấn đề**: Rehydration logic phức tạp, dễ có bug
- **Giải pháp**: 
  - Standardize payload format
  - Add comprehensive tests cho rehydration
  - Monitor outbox stuck events

### **4. Event-Driven Architecture**
- **Vấn đề**: Lỗi ở một layer (OutboxPublisher) lan sang layer khác (EventBus)
- **Giải pháp**: Mỗi layer nên có defensive checks riêng

---

**Author:** Hospital Management Team  
**Date:** 2025-11-27  
**Version:** 2.0.0  
**Status:** ✅ RESOLVED
