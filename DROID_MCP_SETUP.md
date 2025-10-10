# Hướng dẫn Cài đặt MCP cho Droid

## 🎯 MCP (Model Context Protocol) là gì?
MCP cho phép Droid kết nối với các dịch vụ bên ngoài để mở rộng khả năng làm việc. Mỗi MCP server cung cấp các công cụ chuyên biệt.

## 📍 File Config của Droid
```
C:\Users\Dang Ngoc Thien\.factory\mcp.json
```

## ✅ Các MCP Servers đã cấu hình

### 1. 📁 **FileSystem Server**
- **Chức năng**: Thao tác file nâng cao trong project
- **Path**: D:/hospital-management-V2
- **Commands**: read, write, list, search files

### 2. 🔀 **Git Server**
- **Chức năng**: Quản lý version control
- **Repository**: D:/hospital-management-V2
- **Commands**: commit, branch, diff, log

### 3. 🗄️ **PostgreSQL Server** ⚠️ (Cần cấu hình)
- **Chức năng**: Kết nối trực tiếp với Supabase database
- **Cần update**: Connection string trong mcp.json

### 4. 🌐 **Fetch Server**
- **Chức năng**: HTTP requests, test APIs
- **Use cases**: Test identity-service, patient-registry APIs

### 5. ⏰ **Time Server**
- **Chức năng**: Xử lý thời gian, timezone
- **Use cases**: Appointment scheduling, date calculations

### 6. 🧠 **Memory Server**
- **Chức năng**: Lưu trữ context giữa các phiên làm việc
- **Use cases**: Nhớ progress, task history

### 7. 🤔 **Sequential Thinking Server**
- **Chức năng**: Tư duy logic từng bước
- **Use cases**: Complex problem solving, step-by-step reasoning

### 8. 🔗 **Context7 Server**
- **Chức năng**: Enhanced context management
- **Use cases**: Better context tracking, advanced session management

### 9. 🎭 **Playwright Server**
- **Chức năng**: Browser automation và web testing
- **Use cases**: E2E testing, web scraping, UI automation

### 10. 🧠 **Knowledge Graph Server** ✅
- **Chức năng**: Lưu trữ và truy vấn kiến thức có cấu trúc về project
- **Storage Path**: C:\Users\Dang Ngoc Thien\.factory\knowledge-graph
- **Use cases**: 
  - Persistent memory về project structure
  - Store entities và relationships
  - Query knowledge base
  - Build project documentation graph

## 🔧 Cấu hình Supabase Connection

### Bước 1: Lấy connection string từ Supabase
1. Vào Supabase Dashboard
2. Settings → Database
3. Copy Connection String (Session mode)

### Bước 2: Update mcp.json
```json
"postgres": {
  "env": {
    "POSTGRES_CONNECTION_STRING": "postgresql://postgres.[PROJECT-REF]:[YOUR-PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres"
  }
}
```

### Bước 3: Bảo mật
- KHÔNG commit file mcp.json với real passwords
- Sử dụng environment variables nếu có thể

## 🚀 Kích hoạt MCP trong Droid

### 1. Restart Droid
- Đóng và mở lại Droid CLI
- MCP servers sẽ tự động được load

### 2. Kiểm tra MCP đã hoạt động
Trong Droid, gõ:
```
Show available MCP tools
```

### 3. Test từng MCP server
```bash
# Test FileSystem
List files in D:/hospital-management-V2

# Test Git
Show git status

# Test PostgreSQL (sau khi config)
Query database tables

# Test Fetch
Make HTTP request to localhost:3001/health
```

## 📝 Troubleshooting

### "MCP server không hoạt động"
1. Kiểm tra Node.js version: `node --version` (cần 18+)
2. Kiểm tra npx: `npx --version`
3. Install missing: `npm install -g npx`

### "Cannot connect to database"
1. Verify connection string format
2. Check Supabase service status
3. Verify password không có special characters

### "MCP tools not showing"
1. Restart Droid
2. Check mcp.json syntax (valid JSON)
3. Check logs trong `~/.factory/logs/`

## 🔒 Security Notes

1. **Database Credentials**
   - Sử dụng read-only user cho development
   - Rotate passwords định kỳ
   - Không share connection strings

2. **API Keys**
   - Store trong environment variables
   - Sử dụng .env.local (không commit)
   - Restrict API key permissions

3. **File Access**
   - FileSystem server chỉ access D:/hospital-management-V2
   - Không cho phép access system files

## 📊 MCP Use Cases cho Hospital Management

### 1. Database Operations
```javascript
// Query patients
SELECT * FROM patients WHERE status = 'active'

// Update appointment
UPDATE appointments SET status = 'confirmed' WHERE id = ?
```

### 2. Git Workflow
```bash
# Create feature branch
git checkout -b feature/new-module

# Commit changes
git commit -m "feat: add new patient module"
```

### 3. API Testing
```javascript
// Test identity service
GET http://localhost:3001/api/v1/health

// Test patient registry
POST http://localhost:3002/api/v1/patients
```

### 4. File Operations
```javascript
// Read service config
Read backend/services-v2/identity-service/.env

// Search for patterns
Search for "TODO" in all TypeScript files
```

## 🎯 Next Steps

1. ✅ Update PostgreSQL connection string
2. ✅ Get Brave API key (optional)
3. ✅ Restart Droid
4. ✅ Test MCP tools
5. ✅ Start using enhanced capabilities!

## 📚 Resources

- [MCP Documentation](https://modelcontextprotocol.io)
- [Droid Docs](https://factory.ai/docs)
- [Supabase Connection Docs](https://supabase.com/docs/guides/database/connecting-to-postgres)

## 💡 Tips

- Use MCP tools in parallel for better performance
- Combine multiple MCP servers for complex tasks
- Monitor resource usage with many servers active
- Keep mcp.json backed up before changes

---
*Last Updated: January 2025*
*Configured for: hospital-management-V2 project*
