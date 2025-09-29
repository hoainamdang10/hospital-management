# 🔄 Detailed Sequence Diagrams

## Mô tả
Các sequence diagram chi tiết cho các use case phức tạp trong hệ thống quản lý bệnh viện.

## 1. Complete Patient Registration Sequence

```mermaid
sequenceDiagram
    participant U as User
    participant FE as Frontend
    participant GW as API Gateway
    participant AUTH as Auth Service
    participant PAT as Patient Service
    participant EMAIL as Email Service
    participant DB as Database
    participant CACHE as Redis Cache

    Note over U,CACHE: Patient Registration Flow
    
    U->>FE: Access registration page
    FE->>FE: Load registration form
    FE->>U: Display form with validation rules
    
    U->>FE: Fill form and submit
    FE->>FE: Client-side validation
    
    alt Validation fails
        FE->>U: Show validation errors
    else Validation passes
        FE->>GW: POST /api/auth/register/patient
        GW->>AUTH: Forward registration request
        
        AUTH->>CACHE: Check email in cache
        CACHE-->>AUTH: Email not found
        
        AUTH->>DB: Check if email exists
        DB-->>AUTH: Email available
        
        AUTH->>DB: Begin transaction
        AUTH->>DB: Create profile record
        DB-->>AUTH: Return profile_id
        
        AUTH->>PAT: Create patient record
        PAT->>DB: Generate patient_id (PAT-YYYYMM-XXX)
        PAT->>DB: Insert patient data
        DB-->>PAT: Patient created successfully
        PAT-->>AUTH: Return patient data
        
        AUTH->>DB: Commit transaction
        
        AUTH->>EMAIL: Send verification email
        EMAIL->>EMAIL: Generate verification token
        EMAIL->>EMAIL: Send email via SMTP
        EMAIL-->>AUTH: Email sent
        
        AUTH->>CACHE: Cache user session
        CACHE-->>AUTH: Session cached
        
        AUTH-->>GW: Return success + user data
        GW-->>FE: Return registration success
        FE->>FE: Store temporary session
        FE-->>U: Show success + verification message
    end
    
    Note over U,CACHE: Email Verification Flow
    
    U->>U: Check email and click verification link
    U->>FE: Access verification URL
    FE->>GW: GET /api/auth/verify-email?token=xxx
    GW->>AUTH: Forward verification request
    
    AUTH->>CACHE: Check token in cache
    alt Token in cache
        CACHE-->>AUTH: Return token data
    else Token not in cache
        AUTH->>DB: Verify token in database
        DB-->>AUTH: Return token data
    end
    
    alt Token valid
        AUTH->>DB: Update email_verified = true
        AUTH->>CACHE: Update cached user data
        AUTH-->>GW: Return verification success
        GW-->>FE: Return success
        FE-->>U: Show verification success + auto login
    else Token invalid/expired
        AUTH-->>GW: Return error
        GW-->>FE: Return error
        FE-->>U: Show error + resend option
    end
```

## 2. Doctor Consultation with Real-time Updates

```mermaid
sequenceDiagram
    participant D as Doctor
    participant P as Patient
    participant FE_D as Doctor Frontend
    participant FE_P as Patient Frontend
    participant GW as API Gateway
    participant APP as Appointment Service
    participant MED as Medical Records Service
    participant RT as Real-time Service
    participant DB as Database
    participant NOTIF as Notification Service

    Note over D,NOTIF: Consultation Start
    
    D->>FE_D: Click "Start Consultation" on appointment
    FE_D->>GW: POST /api/appointments/{id}/start
    GW->>APP: Forward start consultation
    
    APP->>DB: Update appointment status to 'in-progress'
    APP->>RT: Broadcast status change
    RT->>FE_P: Send real-time update to patient
    FE_P->>P: Show "Doctor is ready" notification
    
    APP-->>GW: Return success
    GW-->>FE_D: Return success
    FE_D->>FE_D: Open consultation interface
    FE_D-->>D: Show patient info + examination form

    Note over D,NOTIF: Medical Examination Process
    
    D->>FE_D: Fill examination details
    Note over D,FE_D: - Chief complaint<br/>- Present illness<br/>- Physical examination<br/>- Vital signs
    
    D->>FE_D: Record vital signs
    FE_D->>GW: POST /api/medical-records/vital-signs
    GW->>MED: Forward vital signs data
    
    MED->>MED: Calculate BMI
    MED->>MED: Check for abnormal values
    
    alt Abnormal vital signs detected
        MED->>RT: Send health alert
        RT->>FE_D: Show alert to doctor
        FE_D->>D: Display health warnings
        
        MED->>NOTIF: Queue alert notification
        NOTIF->>P: Send health alert to patient
    end
    
    MED->>DB: Save vital signs record
    MED-->>GW: Return vital signs data
    GW-->>FE_D: Return success
    FE_D->>FE_D: Update vital signs chart

    Note over D,NOTIF: Diagnosis and Treatment
    
    D->>FE_D: Enter diagnosis and treatment plan
    D->>FE_D: Submit medical record
    FE_D->>GW: POST /api/medical-records
    GW->>MED: Forward medical record creation
    
    MED->>DB: Begin transaction
    MED->>DB: Create medical record
    MED->>DB: Link to appointment
    MED->>DB: Update appointment status to 'completed'
    MED->>DB: Commit transaction
    
    MED->>RT: Broadcast consultation completion
    RT->>FE_P: Notify patient of completion
    FE_P->>P: Show "Consultation completed" message
    
    MED->>NOTIF: Queue follow-up notifications
    NOTIF->>P: Send prescription and instructions
    
    MED-->>GW: Return medical record data
    GW-->>FE_D: Return success
    FE_D-->>D: Show completion confirmation

    Note over D,NOTIF: Post-Consultation
    
    alt Follow-up needed
        D->>FE_D: Schedule follow-up appointment
        FE_D->>GW: POST /api/appointments/follow-up
        GW->>APP: Create follow-up appointment
        APP->>NOTIF: Send follow-up notification
        NOTIF->>P: Notify about follow-up appointment
    end
    
    NOTIF->>NOTIF: Schedule reminder notifications
    NOTIF->>P: Send medication reminders (if applicable)
```

## 3. System Health Monitoring Sequence

```mermaid
sequenceDiagram
    participant MONITOR as Health Monitor
    participant PROM as Prometheus
    participant SERVICES as Microservices
    participant DB as Database
    participant CACHE as Redis
    participant QUEUE as RabbitMQ
    participant GRAF as Grafana
    participant ADMIN as Admin
    participant ALERT as Alert Manager

    Note over MONITOR,ALERT: Continuous Health Monitoring
    
    loop Every 30 seconds
        MONITOR->>SERVICES: GET /health endpoints
        SERVICES-->>MONITOR: Return health status + metrics
        
        MONITOR->>DB: Check database connectivity
        DB-->>MONITOR: Return connection status
        
        MONITOR->>CACHE: Check Redis connectivity
        CACHE-->>MONITOR: Return cache status
        
        MONITOR->>QUEUE: Check RabbitMQ status
        QUEUE-->>MONITOR: Return queue status
        
        MONITOR->>PROM: Send metrics data
        PROM->>PROM: Store metrics
        
        alt Service unhealthy
            MONITOR->>ALERT: Trigger service alert
            ALERT->>ADMIN: Send immediate notification
            ADMIN->>ADMIN: Investigate issue
            
            MONITOR->>MONITOR: Attempt service restart
            MONITOR->>SERVICES: Restart unhealthy service
            
            alt Restart successful
                SERVICES-->>MONITOR: Service restored
                MONITOR->>ALERT: Send recovery notification
                ALERT->>ADMIN: Notify service recovery
            else Restart failed
                MONITOR->>ALERT: Escalate critical alert
                ALERT->>ADMIN: Send critical notification
            end
        end
        
        PROM->>GRAF: Update dashboards
        GRAF->>GRAF: Refresh visualizations
        
        alt Metrics exceed thresholds
            PROM->>ALERT: Trigger performance alert
            ALERT->>ADMIN: Send performance warning
        end
    end

    Note over MONITOR,ALERT: Weekly Health Report
    
    loop Every Sunday
        MONITOR->>PROM: Query weekly metrics
        PROM-->>MONITOR: Return aggregated data
        
        MONITOR->>MONITOR: Generate health report
        MONITOR->>ADMIN: Send weekly health summary
        
        MONITOR->>MONITOR: Cleanup old metrics
        MONITOR->>PROM: Remove outdated data
    end
```

## 4. Data Synchronization Sequence

```mermaid
sequenceDiagram
    participant APP as Application
    participant LOCAL_DB as Local Database
    participant SUPABASE as Supabase Cloud
    participant SYNC as Sync Service
    participant CACHE as Redis Cache
    participant BACKUP as Backup Service

    Note over APP,BACKUP: Real-time Data Sync
    
    APP->>LOCAL_DB: Write operation
    LOCAL_DB->>LOCAL_DB: Store data locally
    LOCAL_DB->>SYNC: Trigger sync event
    
    SYNC->>SUPABASE: Replicate to cloud
    
    alt Sync successful
        SUPABASE-->>SYNC: Confirm sync
        SYNC->>CACHE: Update cache
        SYNC->>LOCAL_DB: Mark as synced
    else Sync failed
        SYNC->>SYNC: Queue for retry
        SYNC->>SYNC: Log sync error
        
        loop Retry mechanism
            SYNC->>SUPABASE: Retry sync
            alt Retry successful
                SUPABASE-->>SYNC: Confirm sync
                SYNC->>CACHE: Update cache
                break
            else Retry failed
                SYNC->>SYNC: Exponential backoff
            end
        end
    end

    Note over APP,BACKUP: Conflict Resolution
    
    alt Concurrent updates detected
        SYNC->>SYNC: Detect conflict
        SYNC->>SUPABASE: Get latest version
        SUPABASE-->>SYNC: Return cloud version
        
        SYNC->>SYNC: Apply conflict resolution rules
        alt Local version newer
            SYNC->>SUPABASE: Update cloud with local
        else Cloud version newer
            SYNC->>LOCAL_DB: Update local with cloud
        else Manual resolution needed
            SYNC->>APP: Request user resolution
            APP->>APP: Show conflict resolution UI
        end
    end

    Note over APP,BACKUP: Backup Integration
    
    loop Every 6 hours
        BACKUP->>LOCAL_DB: Create incremental backup
        BACKUP->>BACKUP: Compress backup data
        BACKUP->>SUPABASE: Store backup in cloud
        BACKUP->>CACHE: Update backup status
    end
```

## Key Sequence Features

### **Error Handling**
- Comprehensive error scenarios
- Graceful degradation
- Automatic retry mechanisms
- User-friendly error messages

### **Real-time Communication**
- WebSocket connections
- Event-driven updates
- Live status synchronization
- Instant notifications

### **Performance Optimization**
- Caching strategies
- Database optimization
- Async processing
- Load balancing

### **Security Measures**
- Token validation
- Session management
- Data encryption
- Audit logging
