# Provider/Staff Service

Provider/Staff microservice for Hospital Management System.

## 🏗️ Architecture

- **Clean Architecture** with DDD patterns
- **Port**: 3022 (External), 3002 (Internal)
- **Schema**: provider_schema
- **Patterns**: Aggregate, Event Sourcing, Saga

## 🚀 Features

- Doctor Management
- Staff Management
- Schedules
- Departments

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
docker build -t provider-staff-service .
docker run -p 3022:3002 provider-staff-service
```
