# Hướng dẫn Cài đặt MCP cho Droid

## MCP là gì?
Model Context Protocol (MCP) là giao thức cho phép Droid kết nối với các dịch vụ bên ngoài để mở rộng khả năng. Mỗi MCP server cung cấp các công cụ và khả năng đặc biệt.

## Cách cài đặt MCP

### Bước 1: Cập nhật file config
File config nằm tại: `C:\Users\Dang Ngoc Thien\.codex\config.toml`

### Bước 2: Khởi động lại Droid
Sau khi cập nhật config, bạn cần restart Droid để các MCP servers được kích hoạt.

## Các MCP Servers đã cài

### 1. Context7 (Memory/Context)
- **Chức năng**: Lưu trữ context và lịch sử làm việc
- **Lệnh test**: Droid sẽ tự động nhớ context giữa các phiên làm việc

### 2. Playwright (Browser Testing)
- **Chức năng**: Kiểm thử UI tự động
- **Lệnh test**: Có thể chạy test E2E cho frontend

### 3. PostgreSQL Server
- **Chức năng**: Kết nối trực tiếp với database
- **Cấu hình**: Cần update connection string trong config
```toml
env = { POSTGRES_CONNECTION_STRING = "postgresql://user:password@localhost:5432/hospital_db" }
```

### 4. File System Server
- **Chức năng**: Thao tác file nâng cao
- **Path**: Đã cấu hình cho D:/hospital-management-V2

### 5. Git Server
- **Chức năng**: Quản lý version control
- **Repository**: D:/hospital-management-V2

### 6. Fetch Server
- **Chức năng**: Gọi HTTP APIs
- **Sử dụng**: Test APIs, fetch data từ external services

### 7. Time Server
- **Chức năng**: Xử lý thời gian, timezone
- **Sử dụng**: Scheduling, date calculations

## Cấu hình cho Supabase

Để kết nối với Supabase database của bạn, update PostgreSQL connection string:

```toml
[mcp_servers.postgres]
command = "npx"
args = ["-y", "@modelcontextprotocol/server-postgres"]
env = { 
  POSTGRES_CONNECTION_STRING = "postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres"
}
```

## Thêm MCP Server mới

### Format cơ bản:
```toml
[mcp_servers.server_name]
command = "npx"
args = ["-y", "@package-name"]
env = { KEY = "value" }  # Optional
```

### MCP Servers khác có thể hữu ích:

1. **Slack Integration**:
```toml
[mcp_servers.slack]
command = "npx"
args = ["-y", "@modelcontextprotocol/server-slack"]
env = { SLACK_BOT_TOKEN = "xoxb-..." }
```

2. **GitHub Integration**:
```toml
[mcp_servers.github]
command = "npx"
args = ["-y", "@modelcontextprotocol/server-github"]
env = { GITHUB_TOKEN = "ghp_..." }
```

3. **Docker Operations**:
```toml
[mcp_servers.docker]
command = "npx"
args = ["-y", "@modelcontextprotocol/server-docker"]
```

## Kiểm tra MCP đang hoạt động

1. Mở Droid
2. Gõ: "Show available MCP tools"
3. Droid sẽ liệt kê các tools từ MCP servers

## Lưu ý quan trọng

1. **Bảo mật**: Không commit file config chứa credentials
2. **Performance**: Quá nhiều MCP servers có thể làm chậm startup
3. **Compatibility**: Một số MCP servers cần Node.js 18+
4. **Network**: MCP servers cần internet để download lần đầu

## Troubleshooting

### Lỗi "command not found"
- Đảm bảo Node.js và npx đã được cài đặt
- Run: `npm install -g npx`

### MCP server không hoạt động
- Check logs trong Droid console
- Verify connection strings và credentials
- Restart Droid sau khi thay đổi config

### Performance issues
- Disable MCP servers không cần thiết
- Comment out bằng # trong config.toml

## Support

- MCP Documentation: https://modelcontextprotocol.io
- Droid Support: https://factory.ai/support
