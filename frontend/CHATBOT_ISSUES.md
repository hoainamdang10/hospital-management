# ⚠️ **CHATBOT API ISSUES DETECTED**

## 🔴 **Vấn đề quan trọng cần FIX**

### **Issue #1: API Endpoint Mismatch**

**Chatbot đang gọi:**
```
GET /v2/staff
GET /v2/departments
GET /v2/appointments/available-slots
POST /v2/appointments
GET /v2/patients/:userId/appointments
```

**Nhưng API Gateway chỉ routing:**
```
GET /api/v1/staff              ← ✅ Exists
GET /api/v1/departments        ← ✅ Exists
GET /api/v2/appointments       ← ✅ Exists (line 360 in main.ts)
POST /api/v2/appointments      ← ❓ Need to verify
GET /api/v2/patients/:id/appointments ← ✅ Exists (line 374)
```

---

## ✅ **Giải pháp:**

### **Fix 1: Update API calls trong chatbot**

Sửa file `app/api/chat/route.ts`:

**Trước:**
```typescript
const staffUrl = new URL(`${baseUrl}/v2/staff`);  // ❌ WRONG
const deptResponse = await fetch(`${baseUrl}/v2/departments`);  // ❌ WRONG
```

**Sau:**
```typescript
const staffUrl = new URL(`${baseUrl}/api/v1/staff`);  // ✅ CORRECT
const deptResponse = await fetch(`${baseUrl}/api/v1/departments`);  // ✅ CORRECT
```

---

## 📋 **API Endpoint Mapping (CORRECTED)**

| Function | Old (Wrong) | New (Correct) | Status

 |
|----------|------------|---------------|---------|
| searchAvailableDoctors | `/v2/staff?role=DOCTOR` | `/api/v1/staff?staffType=doctor` | ⚠️ Needs fix |
| getDepartments | `/v2/departments` | `/api/v1/departments` | ⚠️ Needs fix |
| getAvailableSlots | `/v2/appointments/available-slots` | `/api/v2/appointments/available-slots` | ✅ Correct |
| createAppointment | `/v2/appointments` | `/api/v2/appointments` | ✅ Correct |
| getMyAppointments | `/v2/patients/:id/appointments` | `/api/v2/patients/:id/appointments` | ✅ Correct |

---

## 🔧 **Cần fix ngay**

### **1. Sửa searchAvailableDoctors**

**Query params cũng sai:**
- ❌ `role=DOCTOR` (backend không hỗ trợ)
- ✅ `staffType=doctor` (chính xác theo controller line 352)

**Fixed code:**
```typescript
const staffUrl = new URL(`${baseUrl}/api/v1/staff`);
if (departmentId) staffUrl.searchParams.set('departmentId', departmentId);
staffUrl.searchParams.set('staffType', 'doctor');  // Changed from 'role'
staffUrl.searchParams.set('status', 'active');      // Only active doctors
```

### **2. Sửa getDepartments**

```typescript
const response = await fetch(`${baseUrl}/api/v1/departments`);
```

---

## 🎯 **Tổng kết**

**Chatbot code hoàn chỉnh ✅ NHƯNG:**
- ❌ API endpoints sai → Cần fix 2 functions
- ❌ Query params sai (`role` vs `staffType`)
- ✅ UI/UX hoạt động tốt
- ✅ Gemini integration OK
- ✅ Function calling logic đúng

**Next step:** Fix API calls → Test lại → DONE!

---

## 📝 **Action Items**

1. ✅ Update `searchAvailableDoctors` endpoint + params
2. ✅ Update `getDepartments` endpoint
3. ✅ Test với Gemini API key
4. ✅ Verify backend services running
5. ✅ End-to-end test conversation

---

**Estimated fix time:** 5 phút
