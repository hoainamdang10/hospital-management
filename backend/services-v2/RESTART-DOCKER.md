# Docker Restart Guide

## Docker Desktop không responding

Nếu gặp lỗi: `open //./pipe/dockerDesktopLinuxEngine: The system cannot find the file specified.`

### Manual Restart Steps:

1. **Quit Docker Desktop:**
   - Right-click Docker icon trong system tray (góc dưới phải taskbar)
   - Click "Quit Docker Desktop"
   - Đợi 5-10 giây

2. **Start Docker Desktop:**
   - Tìm "Docker Desktop" trong Start Menu
   - Click để mở
   - Đợi icon Docker trong system tray chuyển sang màu xanh (ready)
   - Có thể mất 30-60 giây

3. **Verify Docker is Running:**
   ```powershell
   docker ps
   ```
   
   Nếu thấy danh sách containers (hoặc rỗng) → Docker đã ready!

4. **Start Services:**
   ```powershell
   cd d:\hospital-management-V2\backend\services-v2
   docker-compose -f docker-compose.v2.yml up -d api-gateway identity-service patient-registry-service provider-staff-service department-service
   ```

5. **Check Status:**
   ```powershell
   docker-compose -f docker-compose.v2.yml ps
   ```

6. **Test Health:**
   ```powershell
   curl http://localhost:3101/health
   curl http://localhost:3001/health
   curl http://localhost:3003/health
   ```

### Quick Start (PowerShell)
```powershell
# After Docker Desktop is running:
cd d:\hospital-management-V2\backend\services-v2
npm run env:docker
docker-compose -f docker-compose.v2.yml up -d api-gateway identity-service patient-registry-service provider-staff-service department-service
Start-Sleep -Seconds 20
docker-compose -f docker-compose.v2.yml ps
curl http://localhost:3101/health
```

## Alternative: Use Local Environment

Nếu Docker có vấn đề, bạn có thể dùng local environment:

```powershell
cd d:\hospital-management-V2\backend\services-v2

# Switch to local
npm run env:local

# Start infrastructure only (Redis + RabbitMQ in Docker)
npm run dev:infrastructure

# Start services locally (each in separate terminal)
# Terminal 1
cd identity-service && npm run dev

# Terminal 2
cd patient-registry-service && npm run dev

# Terminal 3
cd provider-staff-service && npm run dev

# Terminal 4
cd api-gateway && npm run dev
```
