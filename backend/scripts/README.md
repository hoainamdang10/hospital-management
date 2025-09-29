# 🛠️ Hospital Management System - Scripts

Essential scripts for database management and system operations.

## 📋 **Current Scripts**

### **Database Management**
- `hospital-database-functions.sql` - Core database functions for ID generation
- `check-all-id-functions.sql` - Verify ID generation functions

### **Backup & Recovery**
- `backup-database.sh` - Database backup script
- `backup-via-api.js` - API-based backup
- `backup-with-supabase-cli.sh` - Supabase CLI backup
- `backup.bat` - Windows backup script

### **Docker Management**
- `clean-docker-build.bat` - Windows Docker cleanup
- `clean-docker-build.sh` - Linux Docker cleanup
- `quick-rebuild.sh` - Quick service rebuild

### **Security & Validation**
- `security-audit.js` - Security audit script
- `setup-security.js` - Security configuration
- `validate-ports.js` - Port validation

## 🚀 **Usage**

### **Database Cleanup (New)**
```bash
# Run the new database cleanup for 4-role system
cd backend
node ../scripts/run-database-cleanup.js
```

### **Backup Database**
```bash
# Linux/Mac
./scripts/backup-database.sh

# Windows
scripts\backup.bat
```

### **Docker Management**
```bash
# Clean rebuild
./scripts/clean-docker-build.sh

# Quick rebuild
./scripts/quick-rebuild.sh
```

### **Security Audit**
```bash
node scripts/security-audit.js
```

## 📝 **Notes**

- All old test data creation scripts have been removed
- Focus on essential maintenance and operations scripts
- Database cleanup script is in root `/scripts/` folder
- Backup scripts preserve data before major changes

## 🔧 **Maintenance**

Scripts are organized by function:
- **Database**: Core database operations
- **Backup**: Data preservation
- **Docker**: Container management  
- **Security**: System security

For 4-role system implementation, use the new database cleanup script in the root scripts folder.
