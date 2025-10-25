"use strict";
/**
 * Domain Events Exports
 * Centralized export for all domain events
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD
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
__exportStar(require("./MedicalRecordCreatedEvent"), exports);
__exportStar(require("./MedicalRecordUpdatedEvent"), exports);
__exportStar(require("./DiagnosisAddedEvent"), exports);
__exportStar(require("./MedicationAddedEvent"), exports);
__exportStar(require("./VitalSignsUpdatedEvent"), exports);
__exportStar(require("./MedicalRecordArchivedEvent"), exports);
//# sourceMappingURL=index.js.map