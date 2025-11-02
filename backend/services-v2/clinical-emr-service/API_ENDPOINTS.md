# Clinical EMR Service - API Endpoints

## Overview
RESTful API endpoints for Clinical EMR Service - Phase 2 Implementation

**Base URL**: `/api`

**Authentication**: All endpoints require valid JWT token (except health check)

**Response Format**: 
```json
{
  "success": true/false,
  "data": { ... },
  "error": { "message": "...", "code": "..." }
}
```

---

## 1. Clinical Notes API

### Base Path: `/api/clinical-notes`

#### Create Clinical Note
- **POST** `/api/clinical-notes`
- **Body**:
  ```json
  {
    "medicalRecordId": "string",
    "patientId": "PAT-202501-001",
    "noteType": "progress_note|soap_note|consultation|...",
    "title": "string",
    "content": { "text": "...", "sections": [] },
    "soapFormat": { "subjective": "...", "objective": "...", "assessment": "...", "plan": "..." },
    "encounterId": "string (optional)",
    "templateId": "string (optional)",
    "tags": ["tag1", "tag2"],
    "attachments": []
  }
  ```
- **Response**: `{ noteId, status, createdAt }`

#### Get Clinical Note
- **GET** `/api/clinical-notes/:noteId?accessPurpose=treatment`
- **Response**: Full note details with access logging

#### Update Clinical Note
- **PUT** `/api/clinical-notes/:noteId`
- **Body**: Partial update (title, content, soapFormat, tags, attachments, updateReason)
- **Response**: `{ noteId, version, updatedAt }`

#### Cosign Clinical Note
- **POST** `/api/clinical-notes/:noteId/cosign`
- **Body**: `{ cosignComments: "..." }`
- **Response**: `{ noteId, cosignedBy, cosignedAt }`

#### List Clinical Notes
- **GET** `/api/clinical-notes?patientId=...&noteType=...&status=...&limit=20&offset=0`
- **Query Params**: patientId, medicalRecordId, noteType, status, createdBy, fromDate, toDate, tags, searchText, limit, offset
- **Response**: `{ notes: [], total, limit, offset }`

---

## 2. Diagnostic Reports API

### Base Path: `/api/diagnostic-reports`

#### Create Diagnostic Report
- **POST** `/api/diagnostic-reports`
- **Body**:
  ```json
  {
    "medicalRecordId": "string",
    "patientId": "PAT-202501-001",
    "reportType": "lab_test|imaging|pathology|...",
    "title": "string",
    "orderedBy": "HOSP-DOC-202501-001",
    "orderedAt": "2025-01-15T10:00:00Z",
    "description": "string (optional)",
    "specimenInfo": { "type": "blood", "collectedAt": "..." },
    "imagingInfo": { "modality": "CT", "bodyPart": "chest" },
    "priority": "routine|urgent|critical"
  }
  ```
- **Response**: `{ reportId, status, createdAt }`

#### Get Diagnostic Report
- **GET** `/api/diagnostic-reports/:reportId?accessPurpose=review`
- **Response**: Full report details with access logging

#### Update Diagnostic Report
- **PUT** `/api/diagnostic-reports/:reportId`
- **Body**: findings, conclusion, recommendations, attachments, performedBy, performedAt
- **Response**: `{ reportId, status, updatedAt }`

#### Finalize Diagnostic Report
- **POST** `/api/diagnostic-reports/:reportId/finalize`
- **Body**: `{ verificationComments: "..." }`
- **Response**: `{ reportId, status, verifiedAt }`

#### List Diagnostic Reports
- **GET** `/api/diagnostic-reports?patientId=...&reportType=...&status=...&limit=20&offset=0`
- **Query Params**: patientId, medicalRecordId, reportType, status, orderedBy, fromDate, toDate, priority, searchText, limit, offset
- **Response**: `{ reports: [], total, limit, offset }`

---

## 3. Treatment Plans API

### Base Path: `/api/treatment-plans`

#### Create Treatment Plan
- **POST** `/api/treatment-plans`
- **Body**:
  ```json
  {
    "medicalRecordId": "string",
    "patientId": "PAT-202501-001",
    "diagnosis": "Diabetes Type 2",
    "diagnosisCode": "E11.9",
    "treatmentGoals": ["Control blood sugar", "Weight loss"],
    "treatmentItems": [
      {
        "type": "medication",
        "description": "Metformin 500mg",
        "instructions": "Take twice daily",
        "startDate": "2025-01-15",
        "endDate": "2025-07-15",
        "frequency": "BID",
        "duration": "6 months"
      }
    ],
    "startDate": "2025-01-15T00:00:00Z",
    "endDate": "2025-07-15T00:00:00Z (optional)",
    "notes": "string (optional)"
  }
  ```
- **Response**: `{ planId, status, progressPercentage, createdAt }`

#### Get Treatment Plan
- **GET** `/api/treatment-plans/:planId?accessPurpose=review`
- **Response**: Full plan details with items and progress

#### Update Treatment Plan
- **PUT** `/api/treatment-plans/:planId`
- **Body**: treatmentGoals, treatmentItems, itemStatusUpdates, endDate, notes, progressPercentage, patientConsent
- **Response**: `{ planId, status, progressPercentage, updatedAt }`

#### Complete Treatment Plan
- **POST** `/api/treatment-plans/:planId/complete`
- **Body**: `{ completionNotes: "..." }`
- **Response**: `{ planId, status, completedAt }`

#### List Treatment Plans
- **GET** `/api/treatment-plans?patientId=...&status=...&limit=20&offset=0`
- **Query Params**: patientId, medicalRecordId, status, createdBy, fromDate, toDate, diagnosisCode, hasConsent, searchText, limit, offset
- **Response**: `{ plans: [], total, limit, offset }`

---

## 4. Prescriptions API

### Base Path: `/api/prescriptions`

#### Create Prescription
- **POST** `/api/prescriptions`
- **Body**:
  ```json
  {
    "medicalRecordId": "string",
    "patientId": "PAT-202501-001",
    "prescribedBy": "HOSP-DOC-202501-001",
    "medications": [
      {
        "medicationName": "Amoxicillin",
        "dosage": "500mg",
        "dosageForm": "capsule",
        "route": "oral",
        "frequency": "Three times daily",
        "duration": "7 days",
        "quantity": 21,
        "instructions": "Take with food",
        "sideEffects": "Nausea, diarrhea"
      }
    ],
    "prescribedDate": "2025-01-15T10:00:00Z",
    "diagnosis": "Bacterial infection (optional)",
    "diagnosisCode": "A49.9 (optional)",
    "generalInstructions": "Complete full course (optional)",
    "precautions": "Avoid alcohol (optional)",
    "validUntil": "2025-04-15T23:59:59Z (optional)",
    "refillsAllowed": 2
  }
  ```
- **Response**: `{ prescriptionId, medicationCount, status, createdAt }`

#### Get Prescription
- **GET** `/api/prescriptions/:prescriptionId?accessPurpose=dispensing`
- **Response**: Full prescription details with medications and refill info

#### Dispense Prescription
- **POST** `/api/prescriptions/:prescriptionId/dispense`
- **Body**: `{ pharmacyId: "PHARM-001" }`
- **Response**: `{ prescriptionId, status, dispensedAt }`

#### List Prescriptions
- **GET** `/api/prescriptions?patientId=...&status=...&limit=20&offset=0`
- **Query Params**: patientId, medicalRecordId, prescribedBy, status, pharmacyId, fromDate, toDate, hasRefills, limit, offset
- **Response**: `{ prescriptions: [], total, limit, offset }`

---

## 5. Health Check

### Get Service Health
- **GET** `/health`
- **Authentication**: Not required
- **Response**:
  ```json
  {
    "status": "ok",
    "service": "clinical-emr-service",
    "timestamp": "2025-01-15T10:00:00Z"
  }
  ```

---

## Error Responses

### Standard Error Format
```json
{
  "success": false,
  "error": {
    "message": "Error description",
    "code": "ERROR_CODE",
    "details": {} // Only in development
  }
}
```

### Common Error Codes
- `NOT_FOUND` (404) - Resource not found
- `VALIDATION_ERROR` (400) - Invalid request data
- `UNAUTHORIZED` (401) - Missing or invalid JWT
- `FORBIDDEN` (403) - Insufficient permissions
- `INTERNAL_ERROR` (500) - Server error

---

## Implementation Status

✅ **Phase 2.1-2.2**: Clinical Notes (13 files)
✅ **Phase 2.3**: Diagnostic Reports (14 files)
✅ **Phase 2.4**: Treatment Plans (14 files)
✅ **Phase 2.5**: Prescriptions (13 files)
✅ **Phase 2.6**: Repositories (4 files)
✅ **Phase 2.7**: Controllers & Routes (12 files)

**Total**: 70 files (~9,000 LOC)

---

## Next Steps

⏳ **Phase 2.8**: Integration Tests
⏳ **Phase 3**: Advanced Features (Lab Results, Emergency Detection, Reporting)
