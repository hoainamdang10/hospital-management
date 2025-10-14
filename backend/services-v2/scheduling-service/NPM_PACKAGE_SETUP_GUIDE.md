# 📦 NPM PACKAGE SETUP GUIDE - SHARED MODULE

**Project**: Hospital Management System V2  
**Goal**: Publish shared module as npm package  
**Approach**: Private npm package or npm link  
**Estimated Time**: 2-4 giờ

---

## 🎯 OVERVIEW

### Current Situation
```
backend/services-v2/
├── shared/                          # Source code
├── identity-service/
│   └── dist/shared/                 # ❌ Copied
├── patient-service/
│   └── dist/shared/                 # ❌ Copied
└── scheduling-service/
    └── dist/shared/                 # ❌ Copied
```

### Target Situation
```
backend/services-v2/
├── shared/                          # ✅ npm package
│   └── package.json                 # Published as @hospital/shared
├── identity-service/
│   └── node_modules/@hospital/shared/  # ✅ Installed
├── patient-service/
│   └── node_modules/@hospital/shared/  # ✅ Installed
└── scheduling-service/
    └── node_modules/@hospital/shared/  # ✅ Installed
```

---

## 📋 PREREQUISITES

### 1. npm Account (Optional)
**For Private Registry**:
- npm account (free or paid)
- Private package scope (paid: $7/month)

**For Local Development**:
- No npm account needed
- Use `npm link` instead

### 2. Tools
- Node.js >= 18.0.0
- npm >= 9.0.0
- Git

---

## 🚀 IMPLEMENTATION PLAN

### Phase 1: Prepare Shared Module (30 phút)
1. Create package.json
2. Configure TypeScript
3. Add build scripts
4. Test build

### Phase 2: Publish Package (30 phút)
**Option A**: Private npm registry (paid)
**Option B**: npm link (free, local only)

### Phase 3: Update Services (1-2 giờ)
1. Install package in each service
2. Update imports
3. Update tsconfig.json
4. Rebuild and test

### Phase 4: Verification (30 phút)
1. Test all services
2. Verify imports work
3. Test event subscriptions

---

## 📦 PHASE 1: PREPARE SHARED MODULE

### Step 1.1: Create package.json

**File**: `backend/services-v2/shared/package.json`

```json
{
  "name": "@hospital/shared",
  "version": "1.0.0",
  "description": "Shared domain and infrastructure code for Hospital Management System V2",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "scripts": {
    "build": "tsc",
    "clean": "rm -rf dist",
    "rebuild": "npm run clean && npm run build",
    "prepublishOnly": "npm run rebuild"
  },
  "keywords": [
    "hospital",
    "healthcare",
    "shared",
    "domain",
    "infrastructure"
  ],
  "author": "Hospital Management Team",
  "license": "MIT",
  "devDependencies": {
    "@types/node": "^20.5.0",
    "typescript": "^5.1.6"
  },
  "dependencies": {
    "amqplib": "^0.10.3",
    "uuid": "^9.0.1"
  },
  "files": [
    "dist",
    "README.md"
  ],
  "publishConfig": {
    "access": "restricted"
  }
}
```

### Step 1.2: Create tsconfig.json

**File**: `backend/services-v2/shared/tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020"],
    "module": "commonjs",
    "moduleResolution": "node",
    "outDir": "./dist",
    "rootDir": "./",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "removeComments": false,
    "noImplicitAny": true,
    "noImplicitReturns": true,
    "noImplicitThis": true,
    "noUnusedLocals": false,
    "noUnusedParameters": false,
    "exactOptionalPropertyTypes": false,
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true
  },
  "include": [
    "domain/**/*",
    "infrastructure/**/*",
    "application/**/*",
    "events/**/*"
  ],
  "exclude": [
    "node_modules",
    "dist",
    "examples/**/*",
    "testing/**/*",
    "workflows/**/*"
  ]
}
```

### Step 1.3: Create index.ts (Barrel Export)

**File**: `backend/services-v2/shared/index.ts`

```typescript
/**
 * @hospital/shared - Shared Module
 * Hospital Management System V2
 */

// Domain Base Classes
export * from './domain/base/aggregate-root';
export * from './domain/base/entity';
export * from './domain/base/value-object';
export * from './domain/base/domain-event';

// Infrastructure
export * from './infrastructure/event-bus/EventBus';
export * from './infrastructure/di/container';

// Events
export * from './domain/events/domain-events';
```

### Step 1.4: Build Shared Module

```bash
cd backend/services-v2/shared
npm install
npm run build
```

**Expected Output**:
```
shared/
├── dist/
│   ├── domain/
│   ├── infrastructure/
│   ├── index.js
│   └── index.d.ts
├── package.json
└── tsconfig.json
```

---

## 📦 PHASE 2: PUBLISH PACKAGE

### Option A: Private npm Registry (PAID)

#### Step 2A.1: Login to npm
```bash
npm login
# Enter username, password, email
```

#### Step 2A.2: Publish Package
```bash
cd backend/services-v2/shared
npm publish --access restricted
```

**Cost**: $7/month for private packages

---

### Option B: npm link (FREE, LOCAL ONLY)

#### Step 2B.1: Create Global Link
```bash
cd backend/services-v2/shared
npm link
```

**Output**:
```
/usr/local/lib/node_modules/@hospital/shared -> /path/to/backend/services-v2/shared
```

#### Step 2B.2: Link in Services
```bash
cd backend/services-v2/identity-service
npm link @hospital/shared

cd backend/services-v2/patient-service
npm link @hospital/shared

cd backend/services-v2/scheduling-service
npm link @hospital/shared
```

**Pros**:
- ✅ Free
- ✅ Instant updates
- ✅ No npm account needed

**Cons**:
- ❌ Local only (doesn't work in CI/CD)
- ❌ Must run `npm link` on each machine
- ❌ Can break if shared module moved

---

## 📦 PHASE 3: UPDATE SERVICES

### Step 3.1: Install Package

**For Private npm Registry**:
```bash
cd backend/services-v2/scheduling-service
npm install @hospital/shared
```

**For npm link**:
```bash
cd backend/services-v2/scheduling-service
npm link @hospital/shared
```

### Step 3.2: Update package.json

**File**: `backend/services-v2/scheduling-service/package.json`

```json
{
  "dependencies": {
    "@hospital/shared": "^1.0.0",
    // ... other dependencies
  }
}
```

### Step 3.3: Update Imports

**Before**:
```typescript
// ❌ Old imports
import { AggregateRoot } from '../../../shared/domain/base/aggregate-root';
import { DomainEvent } from '../../../shared/domain/base/domain-event';
import { EventBus } from '@shared/infrastructure/event-bus/EventBus';
```

**After**:
```typescript
// ✅ New imports
import { AggregateRoot } from '@hospital/shared';
import { DomainEvent } from '@hospital/shared';
import { EventBus } from '@hospital/shared';
```

### Step 3.4: Update tsconfig.json

**File**: `backend/services-v2/scheduling-service/tsconfig.json`

**Remove** `@shared/*` path mapping:
```json
{
  "compilerOptions": {
    "baseUrl": "./src",
    "paths": {
      "@/*": ["*"],
      "@domain/*": ["domain/*"],
      "@application/*": ["application/*"],
      "@infrastructure/*": ["infrastructure/*"],
      "@presentation/*": ["presentation/*"]
      // ❌ Remove: "@shared/*": ["../shared/*"]
    }
  }
}
```

### Step 3.5: Rebuild Service

```bash
cd backend/services-v2/scheduling-service
npm run build
```

---

## 📦 PHASE 4: VERIFICATION

### Step 4.1: Check Installation

```bash
cd backend/services-v2/scheduling-service
ls -la node_modules/@hospital/shared/
```

**Expected**:
```
node_modules/@hospital/shared/
├── dist/
│   ├── domain/
│   ├── infrastructure/
│   ├── index.js
│   └── index.d.ts
├── package.json
└── README.md
```

### Step 4.2: Test Build

```bash
npm run build
```

**Expected**: No TypeScript errors

### Step 4.3: Test Service

```bash
npm run dev
```

**Expected**: Service starts without errors

### Step 4.4: Test Imports

```bash
# Check compiled imports
cat dist/domain/aggregates/Appointment.aggregate.js | grep "require"
```

**Expected**:
```javascript
const shared_1 = require("@hospital/shared");
```

---

## 🔄 UPDATING SHARED MODULE

### Scenario: Bug Fix in Shared Module

#### Step 1: Update Shared Module
```bash
cd backend/services-v2/shared
# Fix bug in code
npm version patch  # 1.0.0 → 1.0.1
npm run build
```

#### Step 2A: Publish (Private npm)
```bash
npm publish
```

#### Step 2B: Update Link (npm link)
```bash
# No action needed - changes are instant
```

#### Step 3: Update Services
```bash
cd backend/services-v2/scheduling-service
npm update @hospital/shared  # For npm registry
# OR
# No action needed for npm link

npm run build
npm test
```

---

## 📊 COMPARISON: npm Registry vs npm link

| Feature | Private npm Registry | npm link |
|---------|---------------------|----------|
| Cost | $7/month | Free |
| Setup | Complex | Simple |
| CI/CD | ✅ Works | ❌ Doesn't work |
| Version Control | ✅ Yes | ❌ No |
| Team Collaboration | ✅ Easy | ⚠️ Each dev must link |
| Updates | Manual | Instant |
| Production Ready | ✅ Yes | ❌ No |

---

## 🎯 RECOMMENDATION

### For Development (NOW)
**RECOMMEND**: ✅ **npm link**

**Rationale**:
- ✅ Free
- ✅ Fast setup (30 phút)
- ✅ Instant updates
- ✅ Good for local development

**Action**:
```bash
cd backend/services-v2/shared
npm link

cd ../scheduling-service
npm link @hospital/shared
npm run build
```

---

### For Production (LATER)
**RECOMMEND**: ✅ **Private npm Registry**

**Rationale**:
- ✅ CI/CD support
- ✅ Version control
- ✅ Team collaboration
- ✅ Production-ready

**Action**:
```bash
# Setup npm account
npm login

# Publish shared module
cd backend/services-v2/shared
npm publish --access restricted

# Install in services
cd ../scheduling-service
npm install @hospital/shared
```

---

## ⏱️ TIME ESTIMATES

### npm link (Development)
- Phase 1: Prepare Shared Module - 30 phút
- Phase 2: npm link - 5 phút
- Phase 3: Update Services - 30 phút
- Phase 4: Verification - 15 phút
- **TOTAL**: 1.5 giờ

### Private npm Registry (Production)
- Phase 1: Prepare Shared Module - 30 phút
- Phase 2: Setup npm account + Publish - 30 phút
- Phase 3: Update Services - 1 giờ
- Phase 4: Verification - 30 phút
- **TOTAL**: 2.5 giờ

---

## ✅ BENEFITS

### Short-term
- ✅ Single source of truth
- ✅ No code duplication
- ✅ Easy updates
- ✅ Version control

### Long-term
- ✅ Better maintainability
- ✅ Consistent across services
- ✅ Easier to add new services
- ✅ Professional setup

---

## ⚠️ RISKS & MITIGATION

### Risk 1: Breaking Changes
**Mitigation**: Use semantic versioning (semver)

```json
{
  "dependencies": {
    "@hospital/shared": "^1.0.0"  // Only patch/minor updates
  }
}
```

### Risk 2: npm link Breaks
**Mitigation**: Document setup process

```markdown
# SETUP.md
## For New Developers
1. cd backend/services-v2/shared
2. npm link
3. cd ../scheduling-service
4. npm link @hospital/shared
```

### Risk 3: CI/CD Issues
**Mitigation**: Use private npm registry for CI/CD

```yaml
# .github/workflows/ci.yml
- name: Install dependencies
  run: |
    npm config set //registry.npmjs.org/:_authToken=${{ secrets.NPM_TOKEN }}
    npm install
```

---

**Author**: Hospital Management Team  
**Date**: 2025-01-12  
**Status**: ✅ READY TO IMPLEMENT

