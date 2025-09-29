# Notifications Service

Notifications microservice for Hospital Management System.

## 🏗️ Architecture

- **Clean Architecture** with DDD patterns
- **Port**: 3031
- **Schema**: notification_schema
- **Patterns**: Observer, Template Method, Circuit Breaker

## 🚀 Features

- Email
- SMS
- Push Notifications
- Templates

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
docker build -t notifications-service .
docker run -p 3031:3031 notifications-service
```
