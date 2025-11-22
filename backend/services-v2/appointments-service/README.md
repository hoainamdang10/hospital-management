# Appointments Service

Appointments microservice for Hospital Management System V2.

## 🏗️ Architecture

- **Clean Architecture** with DDD patterns
- **Port**: 3004
- **Schema**: `appointments_schema`
- **Patterns**: CQRS, Event-Driven, Outbox Pattern, Clean Architecture
- **Status**: 🔄 In Development (60% Complete)

## 🚀 Features

### ✅ Implemented
- ✅ Appointment Scheduling
- ✅ Appointment Management (Confirm, Cancel, Complete)
- ✅ CQRS Read Model
- ✅ Event-Driven Architecture
- ✅ Outbox Pattern for reliable event publishing
- ✅ Provider Schedule Management
- ✅ Waiting Queue
- ✅ Conflict Detection
- ✅ Health Checks (Liveness, Readiness, Detailed)
- ✅ Structured Logging with Correlation IDs
- ✅ Configuration Validation
- ✅ Graceful Shutdown

### 🔄 In Progress
- 🔄 Recurring Appointments
- 🔄 Reminder Scheduling
- 🔄 Advanced Availability Search

## 📦 Installation

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Edit .env with your configuration
# Required: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
```

## 🔧 Configuration

### Required Environment Variables

```env
SUPABASE_URL=https://ciasxktujslgsdgylimv.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### Optional Environment Variables

See `.env.example` for all available configuration options including:
- External service URLs (Patient, Provider, Scheduler)
- RabbitMQ configuration
- Redis configuration
- CQRS settings
- Outbox pattern settings
- Logging configuration
- Health check settings

## 🏃 Running the Service

### Development Mode

```bash
npm run dev
```

### Production Mode

```bash
npm run build
npm start
```

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run integration tests only
npm run test:integration
```

## 🏥 Health Checks

The service provides multiple health check endpoints:

### Basic Health Check
```bash
curl http://localhost:3004/health
```

### Detailed Health Check
```bash
curl http://localhost:3004/health?detailed=true
```

### Liveness Probe (Kubernetes)
```bash
curl http://localhost:3004/health/live
```

### Readiness Probe (Kubernetes)
```bash
curl http://localhost:3004/health/ready
```

## 📊 Metrics

The service exposes metrics for monitoring:

### JSON Format
```bash
curl http://localhost:3004/metrics
```

### Prometheus Format
```bash
curl http://localhost:3004/metrics?format=prometheus
```

### Available Metrics

- **Request Metrics**: Total requests, success/error counts, by status code, by endpoint
- **Performance Metrics**: Average response time, P50/P95/P99 percentiles, slow requests
- **Business Metrics**: Appointments scheduled/cancelled/completed/no-show
- **System Metrics**: Uptime, memory usage, CPU usage
- **Event Metrics**: Events published/consumed/failed
- **Cache Metrics**: Cache hits/misses, hit rate

## 📡 API Endpoints

### V1 - Command Endpoints (Write Model)

```
POST   /api/v1/appointments              - Schedule appointment
POST   /api/v1/appointments/:id/confirm  - Confirm appointment
POST   /api/v1/appointments/:id/complete - Complete appointment
POST   /api/v1/appointments/:id/cancel   - Cancel appointment
GET    /api/v1/appointments/:id          - Get appointment (legacy)
GET    /api/v1/appointments              - List appointments (legacy)
```

### V2 - Query Endpoints (Read Model)

```
GET    /api/v2/appointments/:id                    - Get appointment details
GET    /api/v2/appointments                        - List appointments with filters
GET    /api/v2/patients/:patientId/appointments    - Patient appointments
GET    /api/v2/doctors/:doctorId/appointments      - Doctor appointments
```

### Availability Endpoints

```
GET    /api/appointments/available-slots           - Find available time slots
POST   /api/appointments/queue                     - Join waiting queue
```

## 🔄 Event-Driven Architecture

### Events Published

- `AppointmentScheduled` - When appointment is scheduled
- `AppointmentCancelled` - When appointment is cancelled
- `AppointmentRescheduled` - When appointment is rescheduled
- `AppointmentConfirmed` - When appointment is confirmed
- `AppointmentCompleted` - When appointment is completed
- `AppointmentNoShow` - When patient doesn't show up

### Events Consumed

- `PatientRegistered` - From Patient Service
- `PatientUpdated` - From Patient Service
- `StaffRegistered` - From Provider Service
- `StaffUpdated` - From Provider Service
- `StaffScheduleUpdated` - From Provider Service

## 📊 Database Schema

The service uses the `appointments_schema` in Supabase with the following tables:

- `appointments` - Main appointment aggregate
- `appointment_read_model` - CQRS read model
- `appointment_slots` - Time slot management
- `appointment_types` - Appointment type definitions
- `appointment_templates` - Recurring appointment templates
- `appointment_audit_logs` - Audit trail
- `phi_access_logs` - HIPAA compliance logging
- `provider_work_schedules` - Provider schedule cache
- `waiting_queue` - Queue management
- `outbox_events` - Transactional outbox

## 🔐 Security

- JWT authentication required for all endpoints
- RBAC enforcement
- PHI access logging (HIPAA compliance)
- Audit trails for all operations
- Request sanitization
- Rate limiting (100 requests per 15 minutes)
- CORS protection
- Helmet.js security headers

## 📝 Logging

The service uses structured logging with:
- Correlation IDs for request tracing
- JSON formatted logs
- Configurable log levels (debug, info, warn, error)
- Performance logging for slow requests (>1s)
- Error tracking with stack traces
- Sensitive data sanitization

## 🐳 Docker

```bash
# Build image
docker build -t appointments-service .

# Run container
docker run -p 3004:3004 --env-file .env appointments-service
```

## 🔧 Troubleshooting

### Service won't start

1. Check environment variables are set correctly
2. Verify Supabase connection
3. Check RabbitMQ is running
4. Check Redis is running

### Health check fails

```bash
# Check detailed health status
curl http://localhost:3004/health?detailed=true
```

### Events not being published

1. Check RabbitMQ connection
2. Check outbox worker logs
3. Verify outbox_events table has entries

## 📚 Documentation

- [Architecture Documentation](./docs/architecture.md)
- [API Documentation](./docs/api.md)
- [Event Documentation](./docs/events.md)
- [Database Schema](./database/schema.sql)

## 🤝 Contributing

1. Follow Clean Architecture principles
2. Write tests for all new features
3. Update documentation
4. Follow conventional commits

## 📄 License

MIT

