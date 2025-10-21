# Provider Staff Service - Scripts

Utility scripts for development, testing, and deployment.

## Available Scripts

### 1. verify-fixes.ps1

**Purpose**: Verify all bug fixes and service health

**Usage**:
```powershell
# Windows PowerShell
.\scripts\verify-fixes.ps1
```

**What it checks**:
- ✅ Correct directory
- ✅ Node.js version (>= 18)
- ✅ Dependencies installed
- ✅ Environment variables configured
- ✅ TypeScript compilation
- ✅ DI container fixes
- ✅ Test execution
- ✅ Build output

**Exit Codes**:
- `0` - All checks passed
- `1` - Critical errors found

---

## Quick Commands

### Development
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run tests
npm test

# Run tests with coverage
npm run test:coverage
```

### Build & Deploy
```bash
# Build TypeScript
npm run build

# Start production server
npm start

# Lint code
npm run lint

# Fix linting issues
npm run lint:fix
```

### Docker
```bash
# Build Docker image
docker build -t provider-staff-service .

# Run container
docker run -p 3002:3002 provider-staff-service
```

---

## Troubleshooting

### Issue: TypeScript compilation errors

**Solution**:
```bash
# Clean build
rm -rf dist
npm run build
```

### Issue: Tests failing

**Solution**:
```bash
# Clear Jest cache
npm test -- --clearCache

# Run specific test
npm test -- tests/unit/domain/ProviderStaff.test.ts
```

### Issue: Port already in use

**Solution**:
```powershell
# Windows - Find process using port 3002
netstat -ano | findstr :3002

# Kill process
taskkill /PID <PID> /F
```

---

## Environment Setup

Create `.env` file with required variables:

```env
# Server
NODE_ENV=development
PORT=3002

# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Database
DATABASE_SCHEMA=provider_schema

# Messaging
RABBITMQ_URL=amqp://admin:admin@localhost:5673
REDIS_URL=redis://localhost:6380
```

---

## Additional Resources

- [Main README](../README.md)
- [Bug Fix Report](../docs/BUGFIX_REPORT.md)
- [Development Rules](../../../DEVELOPMENT_RULES.md)

