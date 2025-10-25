"use strict";
/**
 * Use Cases - Export Index
 * Central export point for all use cases
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
// Core CRUD Use Cases
__exportStar(require("./CreateMedicalRecordUseCase"), exports);
__exportStar(require("./GetMedicalRecordUseCase"), exports);
__exportStar(require("./GetPatientMedicalRecordsUseCase"), exports);
__exportStar(require("./UpdateMedicalRecordUseCase"), exports);
__exportStar(require("./DeleteMedicalRecordUseCase"), exports);
// Archive/Restore Use Cases
__exportStar(require("./ArchiveMedicalRecordUseCase"), exports);
__exportStar(require("./RestoreMedicalRecordUseCase"), exports);
// Diagnosis Management Use Cases
__exportStar(require("./AddDiagnosisUseCase"), exports);
__exportStar(require("./RemoveDiagnosisUseCase"), exports);
// Medication Management Use Cases
__exportStar(require("./AddMedicationUseCase"), exports);
__exportStar(require("./RemoveMedicationUseCase"), exports);
// Vital Signs Use Cases
__exportStar(require("./UpdateVitalSignsUseCase"), exports);
// FHIR Use Cases
__exportStar(require("./ExportToFHIRUseCase"), exports);
__exportStar(require("./ValidateFHIRComplianceUseCase"), exports);
// Query Use Cases
__exportStar(require("./SearchMedicalRecordsUseCase"), exports);
__exportStar(require("./GetDoctorMedicalRecordsUseCase"), exports);
__exportStar(require("./GetMedicalRecordStatisticsUseCase"), exports);
// Reporting Use Cases
__exportStar(require("./GenerateMedicalReportUseCase"), exports);
// Access Control Use Cases
__exportStar(require("./GrantAccessUseCase"), exports);
__exportStar(require("./RevokeAccessUseCase"), exports);
__exportStar(require("./AuditAccessHistoryUseCase"), exports);
//# sourceMappingURL=index.js.map