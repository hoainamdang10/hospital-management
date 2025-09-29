# Scheduling Service

Scheduling microservice for Hospital Management System.

## 🏗️ Architecture

- **Clean Architecture** with DDD patterns
- **Port**: 3004
- **Schema**: scheduling_schema
- **Patterns**: Command, Event-Driven, Workflow

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
docker build -t scheduling-service .
docker run -p 3004:3004 scheduling-service
```
