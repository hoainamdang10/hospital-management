# Billing Service

Billing microservice for Hospital Management System.

## 🏗️ Architecture

- **Clean Architecture** with DDD patterns
- **Port**: 3009
- **Schema**: billing_schema
- **Patterns**: Strategy, Outbox, Payment Gateway

## 🚀 Features

- Invoices
- Payments
- Insurance Claims
- PayOS Integration

## 📦 Installation

```bash
npm install
```

## 🔧 Development

```bash
npm run dev
```

## 🧪 Testing

```bash
npm test
```

## 🐳 Docker

```bash
docker build -t billing-service .
docker run -p 3009:3009 billing-service
```
