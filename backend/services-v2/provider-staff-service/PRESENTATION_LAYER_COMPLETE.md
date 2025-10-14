# Provider/Staff Service - Presentation Layer Documentation

## Overview

Presentation layer hoàn chỉnh cho Provider/Staff Service theo chuẩn Clean Architecture, RESTful API và best practices.

---

## Components Implemented

### 1. Controllers

#### StaffController
**File**: `src/presentation/controllers/StaffController.ts`

**Responsibilities**:
- Handle HTTP requests/responses
- Validate input data
- Call use cases and handlers
- Format responses
- Error handling

**Methods**:
- `registerStaff()` - Register new staff member
- `getStaffById()` - Get staff by ID
- `getStaffByUserId()` - Get staff by user ID
- `getStaffByLicenseNumber()` - Get staff by license number
- `searchStaff()` - Search staff with filters
- `updateStaffInfo()` - Update staff information

---

### 2. Routes

#### Staff Routes
**File**: `src/presentation/routes/staffRoutes.ts`

**API Base URL**: `/api/v1/staff`

**Endpoints**:

| Method | Endpoint | Description | Validation |
|--------|----------|-------------|------------|
| POST | / | Register new staff | validateRegisterStaff |
| GET | /search | Search staff | validateSearchStaff |
| GET | /user/:userId | Get by user ID | validateUserId |
| GET | /license/:licenseNumber | Get by license | validateLicenseNumber |
| GET | /:staffId | Get by staff ID | validateStaffId |
| PUT | /:staffId | Update staff info | validateUpdateStaffInfo |

---

### 3. Middleware

#### Error Handling Middleware
**File**: `src/presentation/middleware/ErrorHandlingMiddleware.ts`

**Features**:
- Custom error classes (ApplicationError, DomainError, NotFoundError, etc.)
- Centralized error handling
- Async handler wrapper
- Response helpers (success, created, paginated, error)
- Helper functions (getUserId, getUserRole, hasRole, hasPermission)

**Error Classes**:
- `ApplicationError` - Base error class
- `DomainError` - Domain validation errors (400)
- `NotFoundError` - Resource not found (404)
- `ValidationError` - Input validation errors (400)
- `UnauthorizedError` - Authentication errors (401)
- `ForbiddenError` - Authorization errors (403)
- `ConflictError` - Resource conflicts (409)

#### Validation Middleware
**File**: `src/presentation/middleware/ValidationMiddleware.ts`

**Validators**:
- `validateRegisterStaff` - Full staff registration validation
- `validateUpdateStaffInfo` - Update staff info validation
- `validateUpdateStaffStatus` - Status update validation
- `validateStaffId` - Staff ID format (STAFF-YYYYMM-XXX)
- `validateUserId` - UUID validation
- `validateLicenseNumber` - License number validation
- `validateSearchStaff` - Search parameters validation
- `validateAddCredential` - Credential addition validation
- `validateAssignDepartment` - Department assignment validation

**Validation Rules**:
- Staff Type: doctor, nurse, technician, pharmacist, therapist, admin, receptionist
- National ID: 9 or 12 digits
- Phone: Vietnamese format (0/+84)
- Email: Standard email format
- Staff ID: STAFF-YYYYMM-XXX pattern
- Employment Type: full-time, part-time, contract, temporary, intern
- Status: active, on-leave, suspended, terminated

---

### 4. DTOs (Data Transfer Objects)

**File**: `src/presentation/dtos/StaffDTOs.ts`

**Request DTOs**:
- `RegisterStaffRequestDto` - Staff registration data
- `UpdateStaffInfoRequestDto` - Update staff information
- `UpdateStaffStatusRequestDto` - Update staff status
- `AddStaffCredentialRequestDto` - Add credential
- `AssignStaffToDepartmentRequestDto` - Assign to department
- `SearchStaffRequestDto` - Search parameters

**Response DTOs**:
- `StaffResponseDto` - Complete staff information
- `StaffListResponseDto` - Paginated staff list
- `StaffStatisticsResponseDto` - Staff statistics
- `ApiResponse<T>` - Generic API response
- `PaginatedResponse<T>` - Paginated response
- `ErrorResponse` - Error response format

---

## Architecture Patterns

### Clean Architecture
- Presentation layer depends only on Application layer
- No business logic in controllers
- DTOs for data transfer
- Middleware for cross-cutting concerns

### RESTful API Design
- Resource-based URLs
- HTTP verbs (GET, POST, PUT, DELETE)
- Status codes (200, 201, 400, 404, 500)
- JSON request/response

### Middleware Pattern
- Validation middleware
- Error handling middleware
- Authentication middleware (ready for integration)
- Logging middleware

### DTO Pattern
- Request DTOs for input validation
- Response DTOs for output formatting
- Type-safe data transfer
- Separation of concerns

---

## API Response Format

### Success Response
```json
{
  "success": true,
  "message": "Success message",
  "data": { ... }
}
```

### Created Response (201)
```json
{
  "success": true,
  "message": "Created successfully",
  "data": { ... }
}
```

### Paginated Response
```json
{
  "success": true,
  "message": "Success",
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

### Error Response
```json
{
  "success": false,
  "error": "ERROR_CODE",
  "message": "Error message",
  "details": { ... }
}
```

---

## Validation Examples

### Register Staff Request
```json
{
  "userId": "uuid-here",
  "staffType": "doctor",
  "personalInfo": {
    "fullName": "Dr. Nguyen Van A",
    "dateOfBirth": "1985-01-15",
    "gender": "male",
    "nationalId": "123456789",
    "nationality": "Vietnamese",
    "phoneNumber": "0901234567",
    "email": "doctor@example.com",
    "address": {
      "street": "123 Main St",
      "ward": "Ward 1",
      "district": "District 1",
      "city": "Ho Chi Minh City",
      "province": "Ho Chi Minh",
      "country": "Vietnam"
    }
  },
  "professionalInfo": {
    "title": "Dr.",
    "department": "Cardiology",
    "position": "Senior Doctor",
    "education": ["MD - Medical University"],
    "languages": ["Vietnamese", "English"],
    "bio": "Experienced cardiologist"
  },
  "workSchedule": {
    "workingDays": ["monday", "tuesday", "wednesday"],
    "workingHours": {
      "start": "08:00",
      "end": "17:00"
    },
    "timeZone": "Asia/Ho_Chi_Minh",
    "isFlexible": false
  },
  "licenseNumber": "BS-12345",
  "employmentType": "full-time",
  "hireDate": "2024-01-01",
  "yearsOfExperience": 10,
  "consultationFee": 500000,
  "specializations": [
    {
      "code": "CARDIO",
      "name": "Cardiology",
      "description": "Heart specialist",
      "isActive": true
    }
  ]
}
```

---

## Testing

### Unit Tests Required
- [ ] StaffController tests
- [ ] ValidationMiddleware tests
- [ ] ErrorHandlingMiddleware tests
- [ ] DTO validation tests

### Integration Tests Required
- [ ] API endpoint tests
- [ ] Error handling tests
- [ ] Validation tests
- [ ] Response format tests

---

## Security Considerations

1. **Input Validation**: All inputs validated using express-validator
2. **Error Handling**: Sensitive information not exposed in errors
3. **Authentication**: Ready for JWT authentication middleware
4. **Authorization**: Role-based access control helpers implemented
5. **CORS**: Configured with allowed origins
6. **Helmet**: Security headers enabled

---

## Next Steps

1. Implement authentication middleware integration
2. Add authorization checks to endpoints
3. Write comprehensive tests
4. Add API documentation (Swagger/OpenAPI)
5. Implement rate limiting
6. Add request logging
7. Implement caching strategies

---

## Status

- [x] Controllers implemented
- [x] Routes configured
- [x] Validation middleware complete
- [x] Error handling middleware complete
- [x] DTOs defined
- [x] Response helpers implemented
- [ ] Tests written
- [ ] Authentication integrated
- [ ] Authorization implemented
- [ ] API documentation added

---

**Version**: 2.0.0  
**Last Updated**: 2025-01-10  
**Author**: Hospital Management Team

