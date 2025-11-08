# PayOS Integration Setup Guide

## 📋 Prerequisites

1. **PayOS Account**: https://my.payos.vn
2. **Payment Channel** created on PayOS dashboard
3. **Credentials** from PayOS:
   - Client ID
   - API Key
   - Checksum Key

---

## 🔧 Configuration

### 1. Add credentials to `.env` file:

```env
# PayOS Configuration
PAYOS_CLIENT_ID=your_client_id_here
PAYOS_API_KEY=your_api_key_here
PAYOS_CHECKSUM_KEY=your_checksum_key_here
```

### 2. Webhook URL Setup

For **development** (using ngrok or cloudflare tunnel):

```bash
# Install ngrok
ngrok http 3009

# Copy the HTTPS URL (e.g., https://abc123.ngrok.io)
# Webhook URL will be: https://abc123.ngrok.io/api/v1/billing/payments/webhook
```

For **production**:
```
https://your-domain.com/api/v1/billing/payments/webhook
```

### 3. Confirm Webhook URL (One-time setup)

```bash
curl -X POST http://localhost:3009/api/v1/billing/payments/webhook/confirm \
  -H "Content-Type: application/json" \
  -d '{
    "webhookUrl": "https://your-webhook-url.com/api/v1/billing/payments/webhook"
  }'
```

---

## 🚀 API Endpoints

### 1. Create Payment Link

```bash
POST /api/v1/billing/payments/create
Content-Type: application/json

{
  "invoiceId": "INV-2025-001",
  "amount": 500000,
  "description": "Thanh toán hóa đơn khám bệnh",
  "items": [
    {
      "name": "Khám bệnh",
      "quantity": 1,
      "price": 300000
    },
    {
      "name": "Đơn thuốc",
      "quantity": 1,
      "price": 200000
    }
  ],
  "buyerName": "Nguyễn Văn A",
  "buyerEmail": "nguyenvana@example.com",
  "buyerPhone": "0912345678"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "checkoutUrl": "https://pay.payos.vn/...",
    "qrCode": "data:image/png;base64,...",
    "paymentLinkId": "abc123",
    "orderCode": 123456,
    "amount": 500000
  }
}
```

### 2. Get Payment Info

```bash
GET /api/v1/billing/payments/:orderId
```

### 3. Cancel Payment

```bash
POST /api/v1/billing/payments/:orderCode/cancel
Content-Type: application/json

{
  "reason": "Khách hàng yêu cầu hủy"
}
```

### 4. Webhook (PayOS calls this)

```
POST /api/v1/billing/payments/webhook
```

PayOS will send payment result to this endpoint after customer completes payment.

---

## 🧪 Testing

### Test Payment Flow:

1. **Create payment link**:
```bash
curl -X POST http://localhost:3009/api/v1/billing/payments/create \
  -H "Content-Type: application/json" \
  -d '{
    "invoiceId": "TEST-001",
    "amount": 10000,
    "description": "Test payment",
    "items": [{"name": "Test", "quantity": 1, "price": 10000}]
  }'
```

2. **Open checkoutUrl** in browser

3. **Scan QR code** with banking app

4. **Complete payment**

5. **Check webhook** logs in console

---

## 📊 Payment Flow

```
User clicks "Thanh toán"
    ↓
Frontend calls /api/v1/billing/payments/create
    ↓
Backend creates payment link via PayOS
    ↓
User redirected to PayOS checkout page
    ↓
User scans QR code with banking app
    ↓
Payment completed
    ↓
PayOS sends webhook to backend
    ↓
Backend updates invoice status
    ↓
User redirected to returnUrl (success page)
```

---

## ⚠️ Important Notes

1. **Webhook URL must be HTTPS** in production
2. **orderCode must be unique** for each payment
3. **Amount must be in VND** (no decimals)
4. **Webhook signature** is automatically verified
5. **Always return 200** from webhook endpoint

---

## 🔍 Troubleshooting

### Webhook not receiving data:
- Check if webhook URL is publicly accessible
- Verify webhook URL is confirmed on PayOS dashboard
- Check firewall/security settings

### Payment link creation fails:
- Verify PayOS credentials are correct
- Check if amount is valid (must be integer)
- Ensure orderCode is unique

### QR code not working:
- Make sure banking app supports VietQR
- Check if payment link hasn't expired
- Verify amount is correct

---

## 📚 Resources

- PayOS Documentation: https://payos.vn/docs/
- PayOS Dashboard: https://my.payos.vn
- PayOS API Reference: https://payos.vn/docs/api/
- Node.js SDK: https://payos.vn/docs/sdks/back-end/node/
