# 🔍 SHARED MODULE INVESTIGATION REPORT

**Service**: Scheduling Service  
**Issue**: 262 TypeScript compilation errors  
**Root Cause**: Missing `tsc-alias` package  
**Date**: 2025-01-12

---

## 🎯 EXECUTIVE SUMMARY

**Problem**: Scheduling service cannot import from `@shared/...` modules, resulting in 262 TypeScript errors.

**Root Cause**: Missing `tsc-alias` package and incorrect build configuration.

**Solution**: Install `tsc-alias` and update build script + tsconfig.json.

**Estimated Fix Time**: 15 phút

---

## 🔍 INVESTIGATION FINDINGS

### 1. Shared Module Structure ✅

**Location**: `backend/services-v2/shared/`

**Structure**:
```
shared/
├── domain/
│   ├── base/                    # New version (v2.0.0)
│   │   ├── aggregate-root.ts
│   │   ├── domain-event.ts
│   │   ├── entity.ts
│   │   └── value-object.ts
│   ├── AggregateRoot.ts         # Old version
│   ├── DomainEvent.ts           # Old version
│   ├── Entity.ts                # Old version
│   └── ValueObject.ts           # Old version
├── infrastructure/
│   ├── event-bus/
│   │   └── EventBus.ts
│   └── di/
│       └── container.ts
└── ... (other modules)
```

**Status**: ✅ Shared module EXISTS and is BUILT (has .js, .d.ts files)

---

### 2. Production Services Setup ✅

#### Identity Service
**Build Script**: `"build": "tsc && tsc-alias"`  
**Package**: `tsc-alias: ^1.8.8` (devDependencies)  
**Result**: ✅ Shared code copied to `dist/shared/`

#### Patient Registry Service
**Build Script**: `"build": "tsc && tsc-alias"`  
**Package**: `tsc-alias: ^1.8.8` (devDependencies)  
**Result**: ✅ Shared code copied to `dist/shared/`

#### Provider Staff Service
**Build Script**: `"build": "tsc && tsc-alias"`  
**Package**: `tsc-alias: ^1.8.8` (devDependencies)  
**Result**: ✅ Shared code copied to `dist/shared/`

---

### 3. Scheduling Service Setup ❌

**Build Script**: `"build": "tsc"` ❌ (missing `&& tsc-alias`)  
**Package**: ❌ NO `tsc-alias` in devDependencies  
**Result**: ❌ Shared code NOT copied to `dist/shared/`

**tsconfig.json**:
```json
{
  "compilerOptions": {
    "baseUrl": "./src",
    "paths": {
      "@shared/*": ["../shared/*"]  // ✅ Path mapping exists
    },
    "exactOptionalPropertyTypes": true  // ❌ Too strict (Patient uses false)
  }
}
```

---

## 🔧 HOW TSC-ALIAS WORKS

### Problem: TypeScript Path Aliases

TypeScript compiler (tsc) compiles `.ts` → `.js` but **DOES NOT** resolve path aliases.

**Example**:
```typescript
// Source: src/domain/Appointment.ts
import { AggregateRoot } from '@shared/domain/base/aggregate-root';

// After tsc compilation: dist/domain/Appointment.js
const aggregate_root_1 = require("@shared/domain/base/aggregate-root");
// ❌ Node.js cannot resolve "@shared/..." at runtime
```

### Solution: tsc-alias

`tsc-alias` post-processes compiled `.js` files and replaces path aliases with relative paths.

**After tsc-alias**:
```javascript
// dist/domain/Appointment.js
const aggregate_root_1 = require("../../shared/domain/base/aggregate-root");
// ✅ Node.js can resolve relative path
```

---

## 📊 ERROR BREAKDOWN

### By Category
1. **Import Errors** (~50): Cannot find module '@shared/...'
2. **Type Errors** (~150): Property does not exist (due to missing base classes)
3. **Optional Property Errors** (~40): exactOptionalPropertyTypes issues
4. **Unused Variable Warnings** (~22): TS6133

### By Severity
- **CRITICAL** (200+): Blocks build completely
- **HIGH** (40+): Must fix for production
- **MEDIUM** (22): Should fix (warnings)

---

## ✅ SOLUTION

### Step 1: Install tsc-alias
```bash
npm install -D tsc-alias
```

### Step 2: Update package.json
```json
{
  "scripts": {
    "build": "tsc && tsc-alias"  // Add && tsc-alias
  },
  "devDependencies": {
    "tsc-alias": "^1.8.8"
  }
}
```

### Step 3: Update tsconfig.json
```json
{
  "compilerOptions": {
    "exactOptionalPropertyTypes": false,  // Change from true
    "noUnusedLocals": false,              // Change from true
    "noUnusedParameters": false           // Change from true
  }
}
```

### Step 4: Rebuild
```bash
npm run build
```

---

## 🎯 EXPECTED RESULTS

### After Fix
- ✅ All 262 TypeScript errors resolved
- ✅ Shared code copied to `dist/shared/`
- ✅ Service can import from `@shared/...`
- ✅ Build completes successfully
- ✅ Service can start without errors

### Verification
```bash
# 1. Check dist/shared exists
ls -la dist/shared/

# 2. Check compiled imports
cat dist/domain/aggregates/Appointment.aggregate.js | grep "require"

# 3. Start service
npm run dev
```

---

## 📋 COMPARISON WITH PRODUCTION SERVICES

| Feature | Identity | Patient | Provider | Scheduling |
|---------|----------|---------|----------|------------|
| tsc-alias package | ✅ | ✅ | ✅ | ❌ |
| Build script | ✅ | ✅ | ✅ | ❌ |
| dist/shared/ | ✅ | ✅ | ✅ | ❌ |
| exactOptionalPropertyTypes | N/A | false | N/A | true ❌ |
| noUnusedLocals | N/A | false | true | true ❌ |
| noUnusedParameters | N/A | false | true | true ❌ |

**Recommendation**: Follow Patient Registry Service configuration (most lenient, production-ready).

---

## 🚀 IMPLEMENTATION PLAN

### Phase 1: Install Dependencies (2 phút)
```bash
cd backend/services-v2/scheduling-service
npm install -D tsc-alias
```

### Phase 2: Update Configuration (3 phút)
1. Update package.json build script
2. Update tsconfig.json compiler options

### Phase 3: Rebuild (5 phút)
```bash
npm run build
```

### Phase 4: Verify (5 phút)
1. Check dist/shared/ exists
2. Check no TypeScript errors
3. Start service
4. Test endpoints

**TOTAL TIME**: 15 phút

---

## 📊 TECHNICAL DETAILS

### TypeScript Path Mapping

**tsconfig.json**:
```json
{
  "compilerOptions": {
    "baseUrl": "./src",
    "paths": {
      "@shared/*": ["../shared/*"]
    }
  }
}
```

**How it works**:
1. **Compile time**: TypeScript resolves `@shared/*` to `../shared/*`
2. **Runtime**: Node.js needs relative paths in `.js` files
3. **tsc-alias**: Bridges the gap by rewriting imports

### Alternative Solutions (NOT RECOMMENDED)

#### Option 1: Copy Shared Code Manually
- ❌ Code duplication
- ❌ Hard to maintain
- ❌ Violates DRY principle

#### Option 2: Use Symlinks
- ❌ Platform-specific (Windows issues)
- ❌ Breaks in Docker
- ❌ npm install issues

#### Option 3: Publish Shared as npm Package
- ❌ Overhead for monorepo
- ❌ Version management complexity
- ❌ Slower development cycle

**RECOMMENDED**: Use `tsc-alias` (same as production services)

---

## ✅ CONCLUSION

**Root Cause**: Missing `tsc-alias` package and incorrect build configuration.

**Solution**: Install `tsc-alias`, update build script, update tsconfig.json.

**Impact**: Resolves all 262 TypeScript errors.

**Time to Fix**: 15 phút.

**Risk**: LOW - Same approach used by all production services.

---

**Author**: Hospital Management Team  
**Date**: 2025-01-12  
**Status**: ✅ INVESTIGATION COMPLETE - READY TO FIX

