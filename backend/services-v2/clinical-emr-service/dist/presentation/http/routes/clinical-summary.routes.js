"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createClinicalSummaryRouter = createClinicalSummaryRouter;
const express_1 = require("express");
function createClinicalSummaryRouter(controller) {
    const router = (0, express_1.Router)();
    // Patient Summary
    router.get("/patients/:patientId/summary", controller.getPatientSummary.bind(controller));
    // Medical Record History
    router.get("/medical-records/:recordId/history", controller.getMedicalRecordHistory.bind(controller));
    // Search Clinical Data
    router.get("/search", controller.searchClinicalData.bind(controller));
    // Service Metrics
    router.get("/metrics", controller.getServiceMetrics.bind(controller));
    // Export Patient Data
    router.get("/patients/:patientId/export", controller.exportPatientData.bind(controller));
    return router;
}
