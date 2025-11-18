# Port Mapping Audit - Hospital Management V2

## Current State (Before Fix)

### From AGENTS.md
| Service | Port |
|---------|------|
| identity-service | 3001 |
| patient-registry-service | 3002 |
| provider-staff-service (+ Departments) | 3003 |
| appointments-service | 3004 |
| notifications-service | 3007 |
| api-gateway | 3009 |

### From docker-compose.v2.yml
| Service | External:Internal Port |
|---------|------------------------|
| identity-service | 3001:3001 |
| patient-registry-service | 3002:3002 (CHANGED) |
| provider-staff-service | 3003:3003 (CHANGED) |
| appointments-service | 3004:3004 |
| billing-service | 3009:3009 |
| notifications-service | 3011:3011 |
| api-gateway | 3101:3101 |

### From .env.docker files
- identity-service: PORT=3001 ✅
- patient-registry-service: PORT=3003 ❌ (mismatch with docker 3002)
- provider-staff-service: PORT=3002 ❌ (mismatch with docker 3003)
- appointments-service: PORT=3004 ✅

### From main.ts source code
- identity-service: 3001 (default) ✅
- patient-registry-service: 3003 (default) ❌
- provider-staff-service: 3002 (default) ❌

## Issues Found

1. **Patient Registry Service**: 
   - .env.docker: 3003
   - docker-compose: 3002
   - Source code default: 3003
   - **MISMATCH!**

2. **Provider Staff Service**:
   - .env.docker: 3002
   - docker-compose: 3003
   - Source code default: 3002
   - **MISMATCH!**

## Recommended Fix

Follow AGENTS.md as source of truth:

| Service | Correct Port |
|---------|--------------|
| identity-service | 3001 |
| patient-registry-service | 3002 |
| provider-staff-service | 3003 |
| appointments-service | 3004 |
| clinical-emr-service | 3005 (if enabled) |
| billing-service | 3006 |
| notifications-service | 3007 |
| api-gateway | 3009 (internal), 3101 (external) |

### Changes Needed:

1. **patient-registry-service/.env.docker**: PORT=3003 → PORT=3002
2. **patient-registry-service/src/main.ts**: default 3003 → 3002
3. **provider-staff-service/.env.docker**: PORT=3002 → PORT=3003
4. **provider-staff-service/src/main.ts**: default 3002 → 3003
5. **docker-compose.v2.yml**: Already updated correctly
