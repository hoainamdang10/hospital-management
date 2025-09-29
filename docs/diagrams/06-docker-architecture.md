# 🐳 Docker Container Architecture

## Mô tả
Diagram kiến trúc container hóa của hệ thống quản lý bệnh viện sử dụng Docker và Docker Compose.

## Diagram

```mermaid
graph TB
    subgraph "Docker Network: hospital-network"
        subgraph "Frontend Container"
            NEXT[Next.js Frontend<br/>Port: 3000<br/>Node.js 18]
        end
        
        subgraph "API Gateway Container"
            GATEWAY[API Gateway<br/>Port: 3100<br/>Express.js + Proxy]
        end
        
        subgraph "Microservices Containers"
            AUTH_C[Auth Service<br/>Port: 3001<br/>JWT + Supabase Auth]
            DOC_C[Doctor Service<br/>Port: 3002<br/>Express.js + TypeScript]
            PAT_C[Patient Service<br/>Port: 3003<br/>Express.js + TypeScript]
            APP_C[Appointment Service<br/>Port: 3004<br/>Express.js + Real-time]
            DEPT_C[Department Service<br/>Port: 3005<br/>Express.js + TypeScript]
            MED_C[Medical Records Service<br/>Port: 3006<br/>Express.js + TypeScript]
            BILL_C[Billing Service<br/>Port: 3007<br/>Express.js + TypeScript]
        end
        
        subgraph "Database Container"
            POSTGRES[PostgreSQL<br/>Port: 5432<br/>Data Persistence]
        end
        
        subgraph "Cache Container"
            REDIS_C[Redis<br/>Port: 6379<br/>Session & Cache]
        end
        
        subgraph "Message Queue Container"
            RABBIT_C[RabbitMQ<br/>Port: 5672, 15672<br/>Async Processing]
        end
        
        subgraph "Monitoring Containers"
            PROM_C[Prometheus<br/>Port: 9090<br/>Metrics Collection]
            GRAF_C[Grafana<br/>Port: 3010<br/>Dashboards]
            NODE_C[Node Exporter<br/>Port: 9100<br/>System Metrics]
        end
    end
    
    subgraph "External Services"
        SUPABASE[Supabase Cloud<br/>Database + Auth<br/>Real-time Features]
    end
    
    subgraph "Volume Mounts"
        DB_VOL[(postgres_data<br/>Database Storage)]
        REDIS_VOL[(redis_data<br/>Cache Storage)]
        RABBIT_VOL[(rabbitmq_data<br/>Queue Storage)]
        PROM_VOL[(prometheus_data<br/>Metrics Storage)]
        GRAF_VOL[(grafana_data<br/>Dashboard Config)]
    end
    
    %% Container Connections
    NEXT --> GATEWAY
    GATEWAY --> AUTH_C
    GATEWAY --> DOC_C
    GATEWAY --> PAT_C
    GATEWAY --> APP_C
    GATEWAY --> DEPT_C
    GATEWAY --> MED_C
    GATEWAY --> BILL_C
    
    %% Service to Database
    AUTH_C --> SUPABASE
    DOC_C --> SUPABASE
    PAT_C --> SUPABASE
    APP_C --> SUPABASE
    DEPT_C --> SUPABASE
    MED_C --> SUPABASE
    BILL_C --> SUPABASE
    
    %% Service to Cache
    DOC_C --> REDIS_C
    PAT_C --> REDIS_C
    APP_C --> REDIS_C
    
    %% Service to Message Queue
    APP_C --> RABBIT_C
    MED_C --> RABBIT_C
    BILL_C --> RABBIT_C
    
    %% Monitoring Connections
    GATEWAY --> PROM_C
    DOC_C --> PROM_C
    PAT_C --> PROM_C
    APP_C --> PROM_C
    NODE_C --> PROM_C
    PROM_C --> GRAF_C
    
    %% Volume Connections
    POSTGRES --> DB_VOL
    REDIS_C --> REDIS_VOL
    RABBIT_C --> RABBIT_VOL
    PROM_C --> PROM_VOL
    GRAF_C --> GRAF_VOL
    
    %% Styling
    classDef frontend fill:#e1f5fe,stroke:#01579b
    classDef gateway fill:#f3e5f5,stroke:#4a148c
    classDef service fill:#e8f5e8,stroke:#1b5e20
    classDef database fill:#fff3e0,stroke:#e65100
    classDef infrastructure fill:#fce4ec,stroke:#880e4f
    classDef monitoring fill:#f1f8e9,stroke:#33691e
    classDef external fill:#fff8e1,stroke:#ff8f00
    classDef volume fill:#f5f5f5,stroke:#424242
    
    class NEXT frontend
    class GATEWAY gateway
    class AUTH_C,DOC_C,PAT_C,APP_C,DEPT_C,MED_C,BILL_C service
    class POSTGRES database
    class REDIS_C,RABBIT_C infrastructure
    class PROM_C,GRAF_C,NODE_C monitoring
    class SUPABASE external
    class DB_VOL,REDIS_VOL,RABBIT_VOL,PROM_VOL,GRAF_VOL volume
```

## Container Architecture

### **Frontend Layer**
- **Next.js Frontend**: React-based user interface
- **Technology**: Node.js 18, TypeScript, Tailwind CSS
- **Port**: 3000

### **API Gateway Layer**
- **API Gateway**: Request routing and authentication
- **Technology**: Express.js with http-proxy-middleware
- **Port**: 3100

### **Microservices Layer**
- **Auth Service** (3001): JWT authentication + Supabase Auth
- **Doctor Service** (3002): Doctor management with real-time features
- **Patient Service** (3003): Patient management and health tracking
- **Appointment Service** (3004): Booking system with WebSocket
- **Department Service** (3005): Hospital structure management
- **Medical Records Service** (3006): Health records and vital signs
- **Billing Service** (3007): Payment and billing management

### **Infrastructure Layer**
- **PostgreSQL** (5432): Primary database for local development
- **Redis** (6379): Caching and session storage
- **RabbitMQ** (5672, 15672): Message queue for async processing

### **Monitoring Layer**
- **Prometheus** (9090): Metrics collection and storage
- **Grafana** (3010): Monitoring dashboards and visualization
- **Node Exporter** (9100): System metrics collection

## Docker Compose Profiles

### **Core Profile** (Essential Services)
```bash
docker-compose --profile core up
```
- Frontend
- API Gateway
- Auth Service
- Doctor Service
- Patient Service
- Appointment Service
- Redis
- PostgreSQL

### **Full Profile** (All Services)
```bash
docker-compose --profile full up
```
- All Core services
- Department Service
- Medical Records Service
- Billing Service
- RabbitMQ
- Monitoring stack

### **Monitoring Profile** (Monitoring Only)
```bash
docker-compose --profile monitoring up
```
- Prometheus
- Grafana
- Node Exporter

## Volume Management

### **Persistent Storage**
- **postgres_data**: Database files
- **redis_data**: Cache persistence
- **rabbitmq_data**: Message queue storage
- **prometheus_data**: Metrics storage
- **grafana_data**: Dashboard configurations

### **Development Volumes**
- Source code bind mounts for hot reload
- Node modules caching
- Build artifacts

## Network Configuration

### **Internal Network**
- **Name**: hospital-network
- **Driver**: bridge
- **Isolation**: Container-to-container communication

### **Port Mapping**
- Frontend: 3000 → 3000
- API Gateway: 3100 → 3100
- Services: 3001-3007 → 3001-3007
- Database: 5432 → 5432
- Redis: 6379 → 6379
- RabbitMQ: 5672, 15672 → 5672, 15672
- Monitoring: 9090, 3010, 9100 → 9090, 3010, 9100

## Environment Configuration

### **Development Environment**
- Hot reload enabled
- Debug logging
- Development database
- Local file storage

### **Production Environment**
- Optimized builds
- Production logging
- External database (Supabase)
- Cloud storage integration

## Health Checks

### **Service Health Endpoints**
- All services expose `/health` endpoints
- Docker health checks configured
- Automatic restart on failure
- Dependency health validation

### **Monitoring Integration**
- Prometheus metrics collection
- Grafana dashboard visualization
- Alert configuration
- Performance monitoring
