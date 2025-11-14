# Notification Service - Simplified Demo Version

## 🎯 Overview

Đây là phiên bản simplified của Notification Service Event Consumers được thiết kế đặc biệt cho demo đồ án tốt nghiệp. Phiên bản này giữ lại các tính năng core và architecture patterns quan trọng nhất.

## 📋 Features

### ✅ Core Features (Giữ lại)
- **2 Event Consumers**: Appointment + Staff
- **Clean Architecture**: 4 layers với proper separation
- **Event-Driven Architecture**: RabbitMQ integration
- **Vietnamese Healthcare Localization**: Full localization
- **Multi-channel Notifications**: Email, SMS, In-App, Push, Voice
- **Dependency Injection**: Complete DI container
- **Health Check & Monitoring**: Real-time health status
- **Error Handling**: Retry logic và graceful degradation

### 🗑️ Simplified Features (Loại bỏ)
- ~~Clinical EMR Event Consumer~~ (quá phức tạp cho demo)
- ~~Billing Event Consumer~~ (không cần thiết cho demo)
- ~~Advanced medical logic~~ (risk assessment, etc.)
- ~~Complex configuration options~~
- ~~Over-abtraction~~

## 🏗️ Architecture

```
📦 notifications-service (simplified)
├── 📁 src/
│   ├── 📁 infrastructure/
│   │   ├── 📁 events/
│   │   │   ├── ✅ AppointmentEventConsumer.ts
│   │   │   ├── ✅ StaffEventConsumer.ts
│   │   │   └── ✅ NotificationEventHandlers.ts
│   │   ├── 📁 config/
│   │   │   └── ✅ event-consumers.env.ts (simplified)
│   │   └── 📁 di/
│   │       └── ✅ setup.ts (updated)
│   ├── ✅ index.ts (updated)
│   └── 📁 application/, 📁 domain/, 📁 presentation/
└── 📊 Total: ~3,000-4,000 lines (manageable)
```

## 🔄 Event Types

### 📅 Appointment Events (7 types)
```typescript
appointment.scheduled     // Lịch hẹn được đặt
appointment.confirmed     // Lịch hẹn được xác nhận
appointment.cancelled     // Lịch hẹn bị hủy
appointment.completed     // Lịch hẹn hoàn thành
appointment.rescheduled   // Lịch hẹn dời lịch
appointment.reminder      // Nhắc nhở lịch hẹn
appointment.no_show       // Bệnh nhân không đến
```

### 👥 Staff Events (7 types)
```typescript
availability.staff.changed   // Thay đổi availability
shift.staff.assigned         // Gán ca làm việc
shift.staff.cancelled        // Hủy ca làm việc
schedule.staff.updated       // Cập nhật lịch làm việc
department.staff.assigned    // Gán phòng ban
oncall.staff.assigned        // Gán trực ban
performance.staff.reviewed   // Đánh giá hiệu suất
```

## 🚀 Quick Start

### 1. Environment Setup
```bash
# Copy environment file
cp .env.example .env

# Configure essential variables
RABBITMQ_URL=amqp://localhost:5672
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_key
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Run Service
```bash
# Development
npm run dev

# Production
npm start
```

### 4. Health Check
```bash
curl http://localhost:3031/health
```

## 📊 Demo Scenarios

### 🎯 Scenario 1: Appointment Booking Flow
1. Patient books appointment → `appointment.scheduled`
2. System sends confirmation → Email + SMS
3. 24h before appointment → `appointment.reminder`
4. Patient confirms → `appointment.confirmed`
5. 2h before appointment → Final reminder

### 🎯 Scenario 2: Staff Management Flow
1. Admin assigns shift → `shift.staff.assigned`
2. Staff receives notification → In-App + Email
3. Staff updates availability → `availability.staff.changed`
4. System updates schedule → `schedule.staff.updated`

## 🌐 Vietnamese Healthcare Features

### 📍 Localization
- **Vietnamese medical terminology**: "Bác sĩ", "Bệnh nhân", "Lịch hẹn"
- **Cultural formatting**: DD/MM/YYYY, VND currency
- **Healthcare context**: Appropriate communication styles

### 📱 Multi-channel Delivery
- **Email**: Detailed appointment information
- **SMS**: Quick reminders and confirmations
- **In-App**: Real-time notifications
- **Push**: Mobile app notifications
- **Voice**: Emergency alerts (if needed)

## 📊 Monitoring & Health Checks

### 🔍 Health Check Endpoint
```json
GET /health
{
  "status": "healthy",
  "service": "notifications-service",
  "version": "2.0.0-simplified",
  "demo": "Simplified for graduation project",
  "eventConsumers": {
    "appointment": true,
    "staff": true
  },
  "checks": {
    "eventConsumers": "pass",
    "database": "pass",
    "rabbitmq": "pass"
  }
}
```

### 📈 Metrics
- Event processing rate
- Notification delivery status
- Connection health status
- Error rates and retry attempts

## 🛠️ Technical Stack

### ✅ Core Technologies
- **TypeScript**: Full type safety
- **Node.js**: Runtime environment
- **Express.js**: HTTP server
- **RabbitMQ**: Message broker
- **Supabase**: Database and real-time
- **AMQP**: Messaging protocol

### 🏗️ Architecture Patterns
- **Clean Architecture**: 4-layer structure
- **Event-Driven**: Async event processing
- **Dependency Injection**: IoC container
- **Repository Pattern**: Data access abstraction
- **Observer Pattern**: Event handling

## 📚 Documentation

### 📖 Key Files
- `src/infrastructure/events/AppointmentEventConsumer.ts` - Appointment event handling
- `src/infrastructure/events/StaffEventConsumer.ts` - Staff event handling
- `src/infrastructure/config/event-consumers.env.ts` - Configuration management
- `src/infrastructure/di/setup.ts` - Dependency injection setup
- `src/index.ts` - Service entry point

### 🎯 Demo Points
1. **Architecture Patterns**: Show Clean Architecture implementation
2. **Event-Driven Design**: Demonstrate async event processing
3. **Vietnamese Localization**: Healthcare context in Vietnamese
4. **Multi-channel Delivery**: Different notification channels
5. **Health Monitoring**: Real-time system health
6. **Error Handling**: Retry logic and graceful degradation

## 🚀 Deployment

### 🐳 Docker (Optional)
```bash
docker build -t notifications-service:simplified .
docker run -p 3031:3031 notifications-service:simplified
```

### ☁️ Production Considerations
- Environment variables configuration
- RabbitMQ cluster setup
- Database connection pooling
- Monitoring and logging
- Load balancing

## 🎓 Educational Value

### 📚 Learning Outcomes
1. **Microservices Architecture**: Service communication patterns
2. **Event-Driven Design**: Async message processing
3. **Clean Architecture**: Layered architecture principles
4. **TypeScript**: Type-safe development
5. **Healthcare Systems**: Domain knowledge application
6. **Vietnamese Localization**: Cultural adaptation

### 🎯 Demo Highlights
- **Real-time Processing**: Live event handling
- **Multi-language Support**: Vietnamese healthcare context
- **Modern Architecture**: Industry-standard patterns
- **Production Ready**: Monitoring, health checks, error handling
- **Scalable Design**: Event-driven scalability

---

## 🎉 Summary

Phiên bản simplified này cung cấp:
- ✅ **Đủ complexity** để thể hiện kiến thức chuyên môn
- ✅ **Dễ quản lý** cho timeframe đồ án tốt nghiệp
- ✅ **Demo được** với các scenarios thực tế
- ✅ **Architecture patterns** quan trọng được giữ lại
- ✅ **Vietnamese healthcare context** được bảo toàn

**Perfect cho graduation project demo!** 🎯
