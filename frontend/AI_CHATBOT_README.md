# 🤖 AI Chatbot - Quick Start Guide

## ✨ Tính năng

AI Chatbot tích hợp **Google Gemini** hỗ trợ bệnh nhân:

- 🔍 Tìm bác sĩ theo chuyên khoa
- 📅 Xem khung giờ trống
- ✅ Đặt lịch khám tự động
- 📋 Xem lịch hẹn hiện tại
- 💬 Trả lời câu hỏi về bệnh viện

---

## 🚀 Setup trong 5 phút

### Bước 1: Lấy Gemini API Key (MIỄN PHÍ)

1. Vào: **https://aistudio.google.com/app/apikey**
2. Đăng nhập Google
3. Click **"Create API Key"**
4. Copy key

### Bước 2: Thêm vào .env.local

```bash
# Tạo/mở file .env.local trong thư mục frontend
echo "GEMINI_API_KEY=paste_your_key_here" >> .env.local
```

### Bước 3: Chạy dev server

```bash
npm run dev
```

### Bước 4: Test chatbot

1. Mở trình duyệt: http://localhost:3000
2. Tìm **floating button** (icon tin nhắn xanh tím) góc dưới phải
3. Click và chat thử!

---

## 💬 Ví dụ Chat

**User:** "Tôi muốn tìm bác sĩ tim mạch"
**Bot:** Tìm thấy 3 bác sĩ Tim mạch. Bạn muốn khám vào ngày nào?

**User:** "Ngày mai được không?"
**Bot:** Bác sĩ Nguyễn Văn A có khung giờ: 9h, 10h, 14h. Bạn chọn giờ nào?

**User:** "9h nhé"
**Bot:** Đặt lịch cho bạn lúc 9h ngày mai với BS Nguyễn Văn A. Lý do khám là gì?

**User:** "Khám tổng quát"
**Bot:** ✅ Đặt lịch thành công! Mã lịch hẹn: APT-2025-0001

---

## 📂 Files đã tạo

```
frontend/
├── app/
│   ├── api/
│   │   └── chat/
│   │       └── route.ts           ← API endpoint (Gemini integration)
│   └── layout.tsx                 ← Đã thêm <ChatBot />
├── components/
│   └── ChatBot.tsx               ← UI component
├── docs/
│   └── AI_CHATBOT_SETUP.md       ← Hướng dẫn chi tiết
└── env.example                   ← Updated
```

---

## 🔧 Troubleshooting

### Chatbot không hiển thị?

**Kiểm tra:**
- File `app/layout.tsx` có `<ChatBot />` chưa? ✅
- Console có lỗi không?
- Clear cache và reload

### Lỗi "GEMINI_API_KEY not configured"?

**Fix:**
```bash
# Kiểm tra file .env.local có key chưa
cat .env.local | grep GEMINI_API_KEY

# Nếu chưa có, thêm vào:
echo "GEMINI_API_KEY=your_key" >> .env.local

# Restart server
npm run dev
```

### Function không hoạt động?

**Kiểm tra backend services đang chạy:**
```bash
# Kiểm tra API Gateway
curl http://localhost:3001/health

# Kiểm tra appointments service
curl http://localhost:3024/health
```

---

## 🖥️ Deploy lên VPS

### Cách nhanh nhất:

```bash
# Build
npm run build

# Tạo .env.production trên VPS
GEMINI_API_KEY=your_key
NEXT_PUBLIC_API_URL=http://your-vps-ip:3001

# Run với PM2
pm2 start npm --name frontend -- start
```

**Chi tiết:** Xem file `docs/AI_CHATBOT_SETUP.md`

---

## 📊 Giới hạn Free Tier

- **60 requests/phút** (đủ cho demo/test)
- Nếu cần nhiều hơn → Upgrade Gemini API (rất rẻ)

---

## 🎨 Customize

### Đổi màu floating button:

File: `components/ChatBot.tsx` (dòng ~103)

```tsx
className="... bg-gradient-to-br from-blue-500 to-purple-600 ..."
// → Thay from-red-500 to-pink-600 chẳng hạn
```

### Thêm function mới:

File: `app/api/chat/route.ts`

1. Thêm vào `functionDeclarations` (dòng 50)
2. Thêm case trong `handleFunctionCall()` (dòng 157)

---

## 📖 Tài liệu đầy đủ

Xem: **`docs/AI_CHATBOT_SETUP.md`** cho:
- Deployment chi tiết
- Monitoring & logs
- Advanced features
- Best practices

---

## 🆘 Cần giúp?

1. Check console logs
2. Verify backend services đang chạy
3. Test API manually: `curl http://localhost:3001/v2/departments`

---

**Hoàn thành! Chatbot đã sẵn sàng hoạt động! 🎉**
