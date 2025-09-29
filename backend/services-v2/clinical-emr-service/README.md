# Clinical/EMR Service

Clinical/EMR microservice for Hospital Management System.

## 🏗️ Architecture

- **Clean Architecture** with DDD patterns
- **Port**: 3027
- **Schema**: clinical_schema
- **Patterns**: Medical Workflow, FHIR Compliance, Audit Trail

## 🚀 Features

- Medical Records
- Encounters
- Diagnoses
- Prescriptions

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
docker build -t clinical-emr-service .
docker run -p 3027:3027 clinical-emr-service
```
