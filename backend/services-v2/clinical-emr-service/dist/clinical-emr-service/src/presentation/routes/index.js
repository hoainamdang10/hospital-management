"use strict";
/**
 * Routes - Export Index
 * Central export point for all route creators
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
exports.setupRoutes = setupRoutes;
const clinicalNoteRoutes_1 = require("./clinicalNoteRoutes");
const diagnosticReportRoutes_1 = require("./diagnosticReportRoutes");
const treatmentPlanRoutes_1 = require("./treatmentPlanRoutes");
const prescriptionRoutes_1 = require("./prescriptionRoutes");
__exportStar(require("./clinicalNoteRoutes"), exports);
__exportStar(require("./diagnosticReportRoutes"), exports);
__exportStar(require("./treatmentPlanRoutes"), exports);
__exportStar(require("./prescriptionRoutes"), exports);
/**
 * Setup all routes for the application
 */
function setupRoutes(app, container) {
    // Get controllers from container
    const clinicalNoteController = container.resolve('ClinicalNoteController');
    const diagnosticReportController = container.resolve('DiagnosticReportController');
    const treatmentPlanController = container.resolve('TreatmentPlanController');
    const prescriptionController = container.resolve('PrescriptionController');
    // Mount routes
    app.use('/api/clinical/notes', (0, clinicalNoteRoutes_1.createClinicalNoteRoutes)(clinicalNoteController));
    app.use('/api/clinical/diagnostic-reports', (0, diagnosticReportRoutes_1.createDiagnosticReportRoutes)(diagnosticReportController));
    app.use('/api/clinical/treatment-plans', (0, treatmentPlanRoutes_1.createTreatmentPlanRoutes)(treatmentPlanController));
    app.use('/api/clinical/prescriptions', (0, prescriptionRoutes_1.createPrescriptionRoutes)(prescriptionController));
}
//# sourceMappingURL=index.js.map