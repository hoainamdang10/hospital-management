## 🎯 HƯỚNG DẪN TEST CHATBOT NGAY

### Bước 1: Lấy API Key (2 phút)

1. Vào: **https://aistudio.google.com/app/apikey**
2. Login Google Account
3. Click "Create API Key in new project"
4. **Copy key** (dạng: AIzaSy...)

### Bước 2: Thêm vào .env.local

Tạo/mở file `.env.local` trong folder `frontend`, thêm dòng:

```
GEMINI_API_KEY=paste_your_key_here
```

**Hoặc chạy lệnh:**

```powershell
# Windows PowerShell
Add-Content -Path .env.local -Value "GEMINI_API_KEY=your_key_here"
```

### Bước 3: Chạy dev server

```powershell
npm run dev
```

### Bước 4: Mở trình duyệt

http://localhost:3000

**Tìm floating button** (icon tin nhắn màu xanh-tím) góc dưới bên phải → Click!

---

## 💬 Test Cases

**1. Hỏi chuyên khoa:**
```
"Bệnh viện có chuyên khoa nào?"
```

**2. Tìm bác sĩ:**
```
"Tôi muốn tìm bác sĩ tim mạch"
```

**3. Xem khung giờ (cần doctor ID từ bước 2):**
```
"Bác sĩ [tên] có lịch nào ngày mai?"
```

**4. Đặt lịch (cần login):**
```
Login as patient → Chat:
"Tôi muốn đặt lịch khám ngày 2025-12-10"
```

---

## 🚨 Nếu gặp lỗi

**Lỗi: "GEMINI_API_KEY not configured"**
→ Check file `.env.local` có key chưa
→ Restart `npm run dev`

**Chatbot không hiển thị:**
→ F12 → Console → Check lỗi gì
→ Clear browser cache

**Backend 404:**
→ Backend services phải chạy (Docker Compose)

---

## 📂 Files quan trọng

- `components/ChatBot.tsx` - UI component
- `app/api/chat/route.ts` - Gemini API logic
- `AI_CHATBOT_README.md` - Hướng dẫn đầy đủ
- `docs/AI_CHATBOT_IMPLEMENTATION.md` - Technical details

---

**Chúc mừng! Chatbot đã sẵn sàng! 🎉**
