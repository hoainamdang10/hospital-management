# AI Chatbot - Hướng dẫn Setup và Deploy

## 📋 Tổng quan

AI Chatbot sử dụng **Google Gemini 1.5 Flash** để hỗ trợ bệnh nhân:
- ✅ Tìm bác sĩ theo chuyên khoa
- ✅ Xem khung giờ trống
- ✅ Đặt lịch khám
- ✅ Xem lịch hẹn hiện tại
- ✅ Giải đáp thắc mắc

## 🚀 Setup nhanh (Local Development)

### Bước 1: Lấy Gemini API Key

1. Truy cập: https://aistudio.google.com/app/apikey
2. Đăng nhập Google Account
3. Click "Create API Key" → Chọn project (hoặc tạo mới)
4. Copy API key

### Bước 2: Cấu hình Environment

Thêm vào file `frontend/.env.local`:

```bash
# AI Chatbot
GEMINI_API_KEY=AIzaSy...your_key_here

# API URL (đảm bảo backend services đang chạy)
NEXT_PUBLIC_API_URL=http://localhost:3001
```

### Bước 3: Cài đặt Dependencies

```bash
cd frontend
npm install
```

Package `@google/generative-ai` đã được cài sẵn.

### Bước 4: Chạy Development Server

```bash
npm run dev
```

Mở trình duyệt: http://localhost:3000

**Chatbot sẽ xuất hiện dưới dạng floating button** (icon tin nhắn màu xanh tím) ở góc dưới bên phải.

---

## 🖥️ Deploy lên VPS

### Option A: Next.js Standalone (Recommended)

**1. Build production:**

```bash
cd frontend
npm run build
```

**2. Upload lên VPS:**

```bash
# Scp hoặc rsync các file cần thiết:
- .next/
- public/
- package.json
- package-lock.json
```

**3. Trên VPS, cài đặt và chạy:**

```bash
# Cài dependencies
npm install --production

# Tạo file .env.production
cat > .env.production << EOF
GEMINI_API_KEY=your_gemini_api_key
NEXT_PUBLIC_API_URL=http://your-vps-ip:3001
EOF

# Chạy với PM2
pm2 start npm --name "hospital-frontend" -- start
pm2 save
pm2 startup
```

**4. Nginx reverse proxy (Optional):**

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## 🧪 Testing Chatbot

### Test Cases:

**1. Tìm bác sĩ:**
```
User: "Tôi muốn tìm bác sĩ tim mạch"
Bot: Sẽ gọi searchAvailableDoctors() và hiển thị danh sách
```

**2. Xem khung giờ:**
```
User: "Bác sĩ Nguyễn Văn A có khung giờ nào ngày mai?"
Bot: Sẽ gọi getAvailableSlots()
```

**3. Đặt lịch:**
```
User: "Tôi muốn đặt lịch khám ngày 2025-12-05 lúc 9h"
Bot: Sẽ hỏi thông tin bổ sung (lý do khám) → createAppointment()
```

**4. Xem lịch hẹn:**
```
User: "Xem lịch hẹn sắp tới của tôi"
Bot: Sẽ gọi getMyAppointments()
```

---

## 🔧 Troubleshooting

### Lỗi: "GEMINI_API_KEY not configured"

**Nguyên nhân:** Thiếu API key trong `.env.local`

**Giải pháp:**
```bash
echo "GEMINI_API_KEY=your_key" >> .env.local
# Restart dev server
```

### Lỗi: Chatbot không hiển thị

**Kiểm tra:**
1. Component `<ChatBot />` đã được thêm vào `app/layout.tsx`?
2. Console có lỗi gì không?
3. Z-index có bị che không?

### Lỗi: Function calls không hoạt động

**Kiểm tra:**
1. Backend services (appointments, provider-staff) đang chạy?
2. `NEXT_PUBLIC_API_URL` đúng chưa?
3. Check console logs: `[AI Chatbot] Function call: ...`

### API Rate Limits (Free tier)

- **Limit:** 60 requests/minute
- **Nếu vượt:** Đợi 1 phút hoặc upgrade lên paid tier

---

## 📊 Monitoring & Logs

### Development:

Console logs tự động hiển thị:
```
[AI Chatbot] Function call: searchAvailableDoctors { department: 'Cardiology', ... }
```

### Production (VPS):

```bash
# PM2 logs
pm2 logs hospital-frontend

# Filter chatbot logs
pm2 logs hospital-frontend | grep "AI Chatbot"
```

---

## 🎨 Customization

### Thay đổi vị trí Floating Button:

File: `components/ChatBot.tsx`

```tsx
// Line ~100 - Thay đổi position
className="fixed bottom-6 right-6 ..."  // → left-6 cho trái
```

### Thay đổi màu sắc:

```tsx
// Line ~103 - Gradient background
bg-gradient-to-br from-blue-500 to-purple-600  // Custom colors
```

### Thêm/bớt Functions:

File: `app/api/chat/route.ts`

1. Thêm function declaration vào `functionDeclarations` array (line 50)
2. Thêm case mới trong `handleFunctionCall()` switch (line 157)

---

## 💡 Tips & Best Practices

### 1. **Giới hạn conversation history**

Để tiết kiệm tokens, chỉ giữ 10 messages gần nhất:

```tsx
// ChatBot.tsx
const recentMessages = messages.slice(-10);
```

### 2. **Caching departments/doctors**

Lưu cache để giảm API calls:

```tsx
// Sử dụng React Query hoặc SWR
const { data: departments } = useDepartments();
```

### 3. **Error handling**

Luôn có fallback message thân thiện:

```tsx
catch (error) {
  return "Xin lỗi, tôi đang gặp sự cố kỹ thuật. Vui lòng thử lại sau."
}
```

### 4. **Security**

- ✅ API key luôn ở server-side (.env.local, KHÔNG commit)
- ✅ Validate userId trước khi đặt lịch
- ✅ Rate limiting nếu cần

---

## 📈 Nâng cấp sau này

### Tính năng có thể thêm:

1. **Voice input** - Speech-to-text
2. **Multilingual** - English + Vietnamese
3. **Appointment reminders** - Tích hợp notifications
4. **Medical knowledge** - RAG với vector database
5. **Analytics** - Track user queries, popular times

### Chuyển sang Microservice:

Nếu cần scale riêng biệt, tách chatbot sang service:

```
backend/services-v2/ai-chatbot-service/
├── src/
│   ├── modules/
│   │   ├── gemini/
│   │   └── session/
│   └── main.ts
└── Dockerfile
```

---

## 🆘 Support

Nếu gặp vấn đề:

1. Check logs: `pm2 logs hospital-frontend`
2. Verify API key: https://aistudio.google.com/app/apikey
3. Test backend health: `curl http://localhost:3001/health`

---

**Chúc bạn demo thành công! 🎉**
