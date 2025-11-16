# Archived Post-MVP Use Cases

This directory contains use cases that were archived during graduation project scope reduction (January 2025).

## Why Archived?

These features are **technically complete and production-ready**, but are **beyond the scope of the graduation project demo flows**. They represent advanced healthcare system capabilities that would be implemented in Phase 2 (post-MVP).

## Archived Feature Categories

### 1. Patient Master Index (PMI) Features
- **MatchPatientsUseCase.ts** - Advanced duplicate patient detection
- **MergePatientsUseCase.ts** - Complex patient record merging

**Reason**: PMI is an advanced feature requiring sophisticated matching algorithms. Not needed for basic patient registration (Demo Flow 1).

### 2. FHIR Advanced Features
- **LinkPatientsUseCase.ts** - FHIR `Patient.link` field (relates patients)
- **UploadPatientPhotoUseCase.ts** - FHIR `Patient.photo` field
- **GetPatientPhotoUseCase.ts** - Photo retrieval
- **DeletePatientPhotoUseCase.ts** - Photo deletion
- **UpdateCommunicationPreferencesUseCase.ts** - FHIR `Patient.communication`
- **GetCommunicationPreferencesUseCase.ts** - Communication preferences retrieval

**Reason**: FHIR R4 advanced fields not required for basic patient management in demo flows.

### 3. Patient Lifecycle Management
- **DeactivatePatientUseCase.ts** - Deactivate patient account
- **ReactivatePatientUseCase.ts** - Reactivate patient account
- **MarkAsDeceasedUseCase.ts** - Mark patient as deceased

**Reason**: Advanced lifecycle states not covered in demo flows 1, 4, 5.

### 4. HIPAA Consent Management
- **GrantConsentUseCase.ts** - Grant data sharing consent
- **GetConsentsUseCase.ts** - List all consents
- **GetConsentDetailsUseCase.ts** - Get specific consent details
- **RevokeConsentUseCase.ts** - Revoke consent
- **GetActiveConsentsUseCase.ts** - Get currently active consents

**Reason**: HIPAA consent is a post-MVP compliance feature. Basic data protection is handled by authentication/authorization.

### 5. Audit & Analytics
- **GetPatientHistoryUseCase.ts** - Full audit trail of patient changes
- **GetPatientStatisticsUseCase.ts** - Patient statistics and analytics

**Reason**: Advanced analytics not required for graduation project demo.

### 6. Advanced Emergency Contact Management
- **RemoveEmergencyContactUseCase.ts** - Remove emergency contact
- **SetPrimaryEmergencyContactUseCase.ts** - Set primary contact

**Reason**: Basic add/get emergency contacts (Demo Flow 1) is sufficient.

## What Remains Active?

### Essential Use Cases (14 total)

**Core CRUD (6)**:
- RegisterPatientUseCase
- GetPatientProfileUseCase
- UpdatePatientInfoUseCase
- SearchPatientsUseCase
- GetPatientByUserIdUseCase
- GetPatientListUseCase

**Insurance Management (5)** - Required for Demo Flow 4:
- AddInsuranceInfoUseCase
- GetInsuranceInfoUseCase
- UpdateInsuranceInfoUseCase
- VerifyInsuranceUseCase (BHYT validation)
- ValidateInsuranceUseCase

**Emergency Contacts (3)** - Required for Demo Flow 1:
- AddEmergencyContactUseCase
- GetEmergencyContactsUseCase
- UpdateEmergencyContactUseCase

## Future Restoration

When graduating from MVP to production, these use cases can be:
1. Moved back to `src/application/use-cases/`
2. Re-registered in DI container
3. Re-enabled in routes
4. Tests moved back from archive

All code is **fully functional and tested** - just not needed for graduation project scope.

## References

- Full analysis: `PATIENT_REGISTRY_SCOPE_AUDIT.md`
- Demo flows: `../../../DEPLOYMENT_GUIDE_FINAL_CORRECTED.md`
- Project scope: `../../../CLAUDE.md`

---

**Archived**: January 15, 2025
**Reason**: Graduation project scope reduction
**Status**: Production-ready, available for future use
