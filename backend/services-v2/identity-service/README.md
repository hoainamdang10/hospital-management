# Identity & Access Service

Identity & Access microservice for Hospital Management System.

## 🏗️ Architecture

- **Clean Architecture** with DDD patterns
- **Port**: 3021 (External), 3001 (Internal)
- **Schema**: identity_schema
- **Patterns**: Strategy, Decorator, Repository

## 🚀 Features

- Authentication
- Authorization
- Session Management
- Role Management

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
docker build -t identity-service .
docker run -p 3021:3001 identity-service
```
