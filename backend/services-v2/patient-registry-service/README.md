# Patient Registry Service

Patient Registry microservice for Hospital Management System.

## 🏗️ Architecture

- **Clean Architecture** with DDD patterns
- **Port**: 3003
- **Schema**: patient_schema
- **Patterns**: Repository, Domain Events, CQRS

## 🚀 Features

- Patient Registration
- Demographics
- Contact Management
- Insurance Info

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
docker build -t patient-registry-service .
docker run -p 3003:3003 patient-registry-service
```
