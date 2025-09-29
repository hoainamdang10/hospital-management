# 🚀 Hướng dẫn Setup PayOS Miễn Phí

## 📋 Tổng quan
PayOS cung cấp **Sandbox Environment hoàn toàn miễn phí** cho việc phát triển và test payment. Không cần xác thực doanh nghiệp hay tốn phí.

## 🎯 Bước 1: Đăng ký PayOS Sandbox

1. **Truy cập**: https://payos.vn/
2. **Đăng ký tài khoản** với email cá nhân
3. **Chọn "Sandbox Environment"** - 100% miễn phí
4. **Xác thực email** và hoàn tất đăng ký

## 🔑 Bước 2: Lấy API Keys

1. **Đăng nhập** PayOS Dashboard
2. **Vào "Cài đặt" → "API Keys"**
3. **Copy 3 thông tin này**:
   - `Client ID`
   - `API Key`
   - `Checksum Key`

## ⚙️ Bước 3: Cấu hình Environment

Cập nhật file `.env` trong thư mục `payment-service`:

```bash
# PayOS Configuration (Sandbox - Miễn phí)
PAYOS_CLIENT_ID=your_actual_client_id_here
PAYOS_API_KEY=your_actual_api_key_here
PAYOS_CHECKSUM_KEY=your_actual_checksum_key_here
PAYOS_ENVIRONMENT=sandbox
FRONTEND_URL=http://localhost:3000
```

## 🧪 Bước 4: Test Integration

### Test cơ bản (không cần PayOS):
```bash
cd backend/services/payment-service
node test-payos-integration.js basic
```

### Test đầy đủ (sau khi có API keys):
```bash
node test-payos-integration.js full
```

## 🚀 Bước 5: Khởi động Service

```bash
# Cài đặt dependencies
npm install

# Khởi động development mode
npm run dev

# Service sẽ chạy tại: http://localhost:3009
```

## 💳 Bước 6: Test Payment Flow

1. **Tạo payment link** qua API
2. **Sử dụng test cards** trong Sandbox:
   - Visa: `4111111111111111`
   - Mastercard: `5555555555554444`
   - CVV: `123`, Expiry: `12/25`

## 🔗 Endpoints chính

- **Health Check**: `GET /health`
- **Create Payment**: `POST /api/payments/payos/create`
- **Payment History**: `GET /api/payments/history`
- **Webhook**: `POST /api/webhooks/payos`

## 📊 Monitoring

- **Logs**: Xem trong thư mục `logs/`
- **PayOS Dashboard**: Theo dõi transactions
- **Database**: Kiểm tra bảng `payments`

## 🎉 Lợi ích Sandbox

✅ **Hoàn toàn miễn phí**
✅ **Không giới hạn giao dịch test**
✅ **Đầy đủ tính năng như Production**
✅ **Test cards sẵn có**
✅ **Webhook testing**
✅ **Không cần xác thực doanh nghiệp**

## 🔄 Chuyển sang Production

Khi sẵn sàng deploy:
1. **Đăng ký PayOS Production**
2. **Xác thực doanh nghiệp** (cần giấy phép kinh doanh)
3. **Cập nhật `PAYOS_ENVIRONMENT=production`**
4. **Thay đổi API keys sang Production**

## 🆘 Troubleshooting

### Lỗi thường gặp:
- **"PayOS credentials not configured"**: Kiểm tra file `.env`
- **"Payment creation failed"**: Kiểm tra API keys và network
- **"Webhook verification failed"**: Kiểm tra checksum key

### Debug:
```bash
# Xem logs
tail -f logs/combined.log

# Test health
curl http://localhost:3009/health
```

## 📞 Hỗ trợ

- **PayOS Documentation**: https://payos.vn/docs
- **PayOS Support**: support@payos.vn
- **Telegram**: @payos_support
