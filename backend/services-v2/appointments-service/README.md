# Appointments Service

Appointments microservice for Hospital Management System.

## 🏗️ Architecture

- **Clean Architecture** with DDD patterns
- **Port**: 3024
- **Schema**: appointments_schema
- **Patterns**: CQRS, Event-Driven, Clean Architecture

## 🚀 Features

- Appointments
- Slots
- Availability
- Queue Management

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
docker build -t appointments-service .
docker run -p 3004:3004 appointments-service
```
