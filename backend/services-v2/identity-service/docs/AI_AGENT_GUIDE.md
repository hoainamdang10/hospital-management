# AI Agent Guide - Identity Service

**Purpose**: Quick reference for AI agents working on Identity Service  
**Last Updated**: 2025-10-07  
**Status**: ✅ Production Ready

---

## ⚠️ CRITICAL RULES FOR AI AGENTS

### Rule #1: All Database Tables Exist
```
❌ WRONG: "Table user_profiles doesn't exist, need to create migration"
✅ RIGHT: "Table user_profiles exists on Supabase with 7 rows"
```

**Before assuming a table is missing**:
1. Check [DATABASE_SCHEMA.md](DATABASE_SCHEMA.md)
2. Check [DATABASE_ERD.md](DATABASE_ERD.md)
3. Query Supabase via MCP if needed

**All 17 tables exist and are verified** (2025-01-11):
- ✅ user_profiles (7 rows)
- ✅ user_sessions (0 rows)
- ✅ healthcare_roles (5 active roles)
- ✅ permissions (52 rows)
- ✅ role_permissions (71 rows)
- ✅ user_roles (0 rows)
- ✅ user_permissions (0 rows)
- ✅ login_attempts (0 rows)
- ✅ password_policies (1 row)
- ✅ password_reset_tokens (0 rows)
- ✅ audit_logs (0 rows)
- ✅ recovery_methods (0 rows)
- ✅ recovery_history (0 rows)
- ✅ two_factor_auth (0 rows)
- ✅ two_factor_attempts (0 rows)
- ✅ staff_invitations (0 rows)
- ✅ security_events (0 rows)

---

### Rule #2: Never Use Math.random() for Security
```
❌ WRONG: Math.random() for tokens, IDs, secrets
✅ RIGHT: crypto.randomBytes() for security-sensitive data
```

**Security-sensitive operations**:
- User ID generation → `crypto.randomBytes()`
- Session tokens → Use Supabase JWT
- TOTP secrets → `crypto.randomBytes()`
- Backup codes → `crypto.randomBytes()`
- Password reset tokens → `crypto.randomBytes()`

---

### Rule #3: Always Sanitize Error Messages
```
❌ WRONG: return { error: error.message }
✅ RIGHT: return { error: 'Đăng ký thất bại. Vui lòng thử lại.' }
```

**Never expose**:
- Database error messages
- Stack traces
- Internal service names
- File paths
- SQL queries

---

### Rule #4: Proper Session Management
```
❌ WRONG: Generate fake session tokens
✅ RIGHT: Use real Supabase JWT accessToken
```

**Session flow**:
1. Login → Get Supabase JWT (accessToken + refreshToken)
2. Store in user_sessions table
3. Return accessToken to client
4. Client sends accessToken in Authorization header
5. Verify JWT on each request

---

### Rule #5: Complete API Parameters
```
❌ WRONG: resetPassword(accessToken, newPassword)
✅ RIGHT: resetPassword(accessToken, refreshToken, newPassword)
```

**Always verify API signatures**:
- Check Supabase documentation
- Check interface definitions
- Check existing implementations
- Add integration tests

---

## 📚 Quick Reference

### Database
- **Schema**: [DATABASE_SCHEMA.md](DATABASE_SCHEMA.md)
- **ERD**: [DATABASE_ERD.md](DATABASE_ERD.md)
- **Project ID**: ciasxktujslgsdgylimv
- **Schema Name**: auth_schema

### Architecture
- **Pattern**: Clean Architecture (Domain/Application/Infrastructure/Presentation)
- **DDD**: Aggregates, Entities, Value Objects, Domain Events
- **RBAC**: Pure Role-Based Access Control
- **Caching**: Multi-level (Memory + Redis) with Pub/Sub invalidation

### Security
- **Authentication**: Supabase Auth (JWT)
- **Session Storage**: user_sessions table
- **Password Policy**: Configurable via password_policies table
- **MFA**: TOTP (app), SMS, Email, Backup codes
- **Audit**: audit_logs table

### Testing
- **Framework**: Jest
- **Coverage**: 97.9% (920/940 tests)
- **Location**: tests/unit, tests/integration
- **Run**: `npm test`

---

## 🔍 Common Tasks

### Task 1: Check if Table Exists
```typescript
// Step 1: Check documentation first
// Read: docs/DATABASE_SCHEMA.md

// Step 2: If not sure, query Supabase
await list_tables_supabase({
  project_id: "ciasxktujslgsdgylimv",
  schemas: ["auth_schema"]
});
```

### Task 2: Add New Use Case
```typescript
// 1. Create use case in src/application/use-cases/
// 2. Follow existing patterns (AuthenticateUserUseCase.ts)
// 3. Add proper error handling
// 4. Sanitize error messages
// 5. Add unit tests in tests/unit/application/use-cases/
// 6. Run tests: npm test
```

### Task 3: Add New Repository Method
```typescript
// 1. Add method to interface in src/application/repositories/
// 2. Implement in src/infrastructure/repositories/
// 3. Check DATABASE_SCHEMA.md for table structure
// 4. Add unit tests
// 5. Run tests: npm test
```

### Task 4: Fix Security Issue
```typescript
// 1. Identify the issue
// 2. Check if it's one of the common patterns:
//    - Math.random() → crypto.randomBytes()
//    - Error message leakage → Sanitize
//    - Missing parameters → Add them
//    - Fake tokens → Use real Supabase JWT
// 3. Fix the issue
// 4. Add regression test
// 5. Run tests: npm test
```

### Task 5: Add New Migration
```typescript
// 1. Check existing migrations in migrations/
// 2. Create new file: 00X_description.sql
// 3. Use proper SQL syntax
// 4. Test locally first
// 5. Apply via Supabase MCP:
await apply_migration_supabase({
  project_id: "ciasxktujslgsdgylimv",
  name: "description",
  query: "CREATE TABLE ..."
});
// 6. Update DATABASE_SCHEMA.md
// 7. Update DATABASE_ERD.md
```

---

## 🚨 Common Mistakes to Avoid

### Mistake #1: Assuming Tables Don't Exist
**Symptom**: "Need to create user_profiles table"  
**Fix**: Check DATABASE_SCHEMA.md first

### Mistake #2: Using Math.random() for Security
**Symptom**: Insecure random generation  
**Fix**: Use crypto.randomBytes()

### Mistake #3: Exposing Internal Errors
**Symptom**: Database errors shown to users  
**Fix**: Sanitize error messages

### Mistake #4: Missing API Parameters
**Symptom**: API calls fail with missing parameters  
**Fix**: Check Supabase documentation

### Mistake #5: Fake Session Tokens
**Symptom**: Sessions don't work across requests  
**Fix**: Use real Supabase JWT

### Mistake #6: Pub/Sub Channel Mismatch
**Symptom**: Cache invalidation doesn't work  
**Fix**: Use same channel name for publish/subscribe

### Mistake #7: Not Running Tests
**Symptom**: Breaking existing functionality  
**Fix**: Always run `npm test` before committing

### Mistake #8: Hardcoding Values
**Symptom**: Code not flexible  
**Fix**: Use environment variables, configuration

### Mistake #9: Not Following Clean Architecture
**Symptom**: Domain logic in infrastructure layer  
**Fix**: Respect layer boundaries

### Mistake #10: Not Updating Documentation
**Symptom**: Documentation out of sync  
**Fix**: Update docs when changing code

---

## 🎯 Best Practices

### Code Quality
1. ✅ Use TypeScript strict mode
2. ✅ Avoid `any` types (use `unknown` or specific types)
3. ✅ Follow Clean Architecture boundaries
4. ✅ Write unit tests for all use cases
5. ✅ Run ESLint before committing

### Security
1. ✅ Use crypto.randomBytes() for security-sensitive data
2. ✅ Sanitize all error messages
3. ✅ Validate all inputs
4. ✅ Use parameterized queries
5. ✅ Implement rate limiting

### Performance
1. ✅ Use multi-level caching
2. ✅ Implement Pub/Sub for cache invalidation
3. ✅ Add database indexes
4. ✅ Use connection pooling
5. ✅ Monitor query performance

### Testing
1. ✅ Write unit tests for all use cases
2. ✅ Write integration tests for repositories
3. ✅ Mock external dependencies
4. ✅ Test error cases
5. ✅ Aim for >90% coverage

### Documentation
1. ✅ Update DATABASE_SCHEMA.md when schema changes
2. ✅ Update DATABASE_ERD.md when relationships change
3. ✅ Document all API endpoints
4. ✅ Document all domain events
5. ✅ Keep README up to date

---

## 📊 Metrics to Track

### Code Quality
- **Type Safety**: Target 97%+ (currently 97%)
- **ESLint Warnings**: Target <50 (currently 34)
- **Build Status**: Must be ✅
- **Test Coverage**: Target >90% (currently 97.9%)

### Security
- **Critical Vulnerabilities**: Target 0 (currently 0)
- **Math.random() Usage**: Target 0 in production (currently 0)
- **Error Message Leakage**: Target 0 (currently 0)

### Performance
- **Response Time**: Target <100ms (p95)
- **Cache Hit Rate**: Target >80%
- **Database Query Time**: Target <50ms (p95)

---

## 🆘 Troubleshooting

### Issue: "Table doesn't exist"
1. Check [DATABASE_SCHEMA.md](DATABASE_SCHEMA.md)
2. Verify table name spelling
3. Check schema name (auth_schema vs public)
4. Query Supabase via MCP

### Issue: "Foreign key constraint violation"
1. Check [DATABASE_ERD.md](DATABASE_ERD.md)
2. Verify referenced record exists
3. Check cascade delete settings

### Issue: "Permission denied"
1. Check RLS policies
2. Verify user role/permissions
3. Use service role for admin operations

### Issue: "Tests failing"
1. Run `npm test` to see errors
2. Check mock setup
3. Verify test data
4. Check for race conditions

### Issue: "Build failing"
1. Run `npm run build` to see errors
2. Check TypeScript errors
3. Fix type issues
4. Run ESLint

---

## 📞 Getting Help

### Documentation
1. [DATABASE_SCHEMA.md](DATABASE_SCHEMA.md) - Database tables
2. [DATABASE_ERD.md](DATABASE_ERD.md) - Database relationships
3. [API Contract](api/IDENTITY_API_CONTRACT.md) - API documentation
4. [Event Catalog](events/IDENTITY_EVENT_CATALOG.md) - Domain events
5. [Operations Runbook](ops/IDENTITY_RUNBOOK.md) - Operations guide

### Tools
- **Supabase MCP**: Query database, apply migrations
- **Jest**: Run tests
- **ESLint**: Check code quality
- **TypeScript**: Type checking

---

**Last Updated**: 2025-10-07  
**Verified By**: Supabase MCP  
**Status**: ✅ Production Ready

