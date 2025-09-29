# 🏗️ System Architecture Diagram

## Mô tả
Diagram tổng quan kiến trúc microservices của hệ thống quản lý bệnh viện, bao gồm tất cả các layer và thành phần chính.

## Diagram

```mermaid
graph TB
    subgraph "Frontend Layer"
        FE[Next.js Frontend<br/>Port: 3000<br/>TypeScript + Tailwind]
    end
    
    subgraph "API Gateway Layer"
        GW[API Gateway<br/>Port: 3100<br/>Request Routing & Auth]
    end
    
    subgraph "Microservices Layer"
        AUTH[Auth Service<br/>Port: 3001<br/>Authentication & Authorization]
        DOC[Doctor Service<br/>Port: 3002<br/>Doctor Management]
        PAT[Patient Service<br/>Port: 3003<br/>Patient Management]
        APP[Appointment Service<br/>Port: 3004<br/>Booking & Scheduling]
        DEPT[Department Service<br/>Port: 3005<br/>Hospital Structure]
        MED[Medical Records Service<br/>Port: 3006<br/>Health Records]
        BILL[Billing Service<br/>Port: 3007<br/>Payment Management]
    end
    
    subgraph "Database Layer"
        DB[(Supabase PostgreSQL<br/>Row Level Security<br/>Real-time Features)]
    end
    
    subgraph "Infrastructure Layer"
        REDIS[(Redis Cache<br/>Port: 6379)]
        RABBIT[(RabbitMQ<br/>Port: 5672<br/>Message Queue)]
    end
    
    subgraph "Monitoring Layer"
        PROM[Prometheus<br/>Port: 9090<br/>Metrics Collection]
        GRAF[Grafana<br/>Port: 3010<br/>Monitoring Dashboard]
    end
    
    %% Connections
    FE --> GW
    GW --> AUTH
    GW --> DOC
    GW --> PAT
    GW --> APP
    GW --> DEPT
    GW --> MED
    GW --> BILL
    
    AUTH --> DB
    DOC --> DB
    PAT --> DB
    APP --> DB
    DEPT --> DB
    MED --> DB
    BILL --> DB
    
    DOC --> REDIS
    PAT --> REDIS
    APP --> REDIS
    
    APP --> RABBIT
    MED --> RABBIT
    BILL --> RABBIT
    
    GW --> PROM
    DOC --> PROM
    PAT --> PROM
    APP --> PROM
    
    PROM --> GRAF
    
    %% Styling
    classDef frontend fill:#e1f5fe
    classDef gateway fill:#f3e5f5
    classDef service fill:#e8f5e8
    classDef database fill:#fff3e0
    classDef infrastructure fill:#fce4ec
    classDef monitoring fill:#f1f8e9
    
    class FE frontend
    class GW gateway
    class AUTH,DOC,PAT,APP,DEPT,MED,BILL service
    class DB database
    class REDIS,RABBIT infrastructure
    class PROM,GRAF monitoring
```

## Thành phần chính

### **Frontend Layer**
- **Next.js Frontend**: Giao diện người dùng với TypeScript và Tailwind CSS
- **Port**: 3000

### **API Gateway Layer**
- **API Gateway**: Điều hướng request và xác thực
- **Port**: 3100

### **Microservices Layer**
- **Auth Service** (3001): Xác thực và phân quyền
- **Doctor Service** (3002): Quản lý bác sĩ
- **Patient Service** (3003): Quản lý bệnh nhân
- **Appointment Service** (3004): Đặt lịch và lên lịch
- **Department Service** (3005): Cấu trúc bệnh viện
- **Medical Records Service** (3006): Hồ sơ sức khỏe
- **Billing Service** (3007): Quản lý thanh toán

### **Database Layer**
- **Supabase PostgreSQL**: Database chính với Row Level Security

### **Infrastructure Layer**
- **Redis Cache** (6379): Bộ nhớ đệm
- **RabbitMQ** (5672): Message queue

### **Monitoring Layer**
- **Prometheus** (9090): Thu thập metrics
- **Grafana** (3010): Dashboard giám sát

## Luồng dữ liệu
1. Frontend gửi request đến API Gateway
2. API Gateway xác thực và điều hướng đến service phù hợp
3. Service xử lý business logic và truy cập database
4. Kết quả được trả về qua API Gateway đến Frontend
5. Monitoring system theo dõi toàn bộ quá trình
