"use strict";
/**
 * Express App Configuration Example
 * Shows how to wire up controllers and routes
 *
 * @compliance Clean Architecture, Dependency Injection
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createApp = createApp;
const express_1 = __importDefault(require("express"));
const supabase_js_1 = require("@supabase/supabase-js");
const controllers_1 = require("./controllers");
const routes_1 = require("./routes");
const errorHandler_1 = require("./middleware/errorHandler");
// Import repositories
const SupabaseClinicalNoteRepository_1 = require("../infrastructure/repositories/SupabaseClinicalNoteRepository");
const SupabaseDiagnosticReportRepository_1 = require("../infrastructure/repositories/SupabaseDiagnosticReportRepository");
const SupabaseTreatmentPlanRepository_1 = require("../infrastructure/repositories/SupabaseTreatmentPlanRepository");
const SupabasePrescriptionRepository_1 = require("../infrastructure/repositories/SupabasePrescriptionRepository");
// Import use cases
const use_cases_1 = require("../application/use-cases");
function createApp() {
    const app = (0, express_1.default)();
    // Middleware
    app.use(express_1.default.json());
    app.use(express_1.default.urlencoded({ extended: true }));
    // Initialize Supabase client
    const supabase = (0, supabase_js_1.createClient)(process.env.SUPABASE_URL || '', process.env.SUPABASE_SERVICE_ROLE_KEY || '');
    // Initialize repositories
    const clinicalNoteRepo = new SupabaseClinicalNoteRepository_1.SupabaseClinicalNoteRepository(supabase);
    const diagnosticReportRepo = new SupabaseDiagnosticReportRepository_1.SupabaseDiagnosticReportRepository(supabase);
    const treatmentPlanRepo = new SupabaseTreatmentPlanRepository_1.SupabaseTreatmentPlanRepository(supabase);
    const prescriptionRepo = new SupabasePrescriptionRepository_1.SupabasePrescriptionRepository(supabase);
    // Initialize use cases - Clinical Notes
    const createNoteUseCase = new use_cases_1.CreateClinicalNoteUseCase(clinicalNoteRepo);
    const getNoteUseCase = new use_cases_1.GetClinicalNoteUseCase(clinicalNoteRepo);
    const updateNoteUseCase = new use_cases_1.UpdateClinicalNoteUseCase(clinicalNoteRepo);
    const cosignNoteUseCase = new use_cases_1.CosignClinicalNoteUseCase(clinicalNoteRepo);
    const listNotesUseCase = new use_cases_1.ListClinicalNotesUseCase(clinicalNoteRepo);
    // Initialize use cases - Diagnostic Reports
    const createReportUseCase = new use_cases_1.CreateDiagnosticReportUseCase(diagnosticReportRepo);
    const getReportUseCase = new use_cases_1.GetDiagnosticReportUseCase(diagnosticReportRepo);
    const updateReportUseCase = new use_cases_1.UpdateDiagnosticReportUseCase(diagnosticReportRepo);
    const finalizeReportUseCase = new use_cases_1.FinalizeDiagnosticReportUseCase(diagnosticReportRepo);
    const listReportsUseCase = new use_cases_1.ListDiagnosticReportsUseCase(diagnosticReportRepo);
    // Initialize use cases - Treatment Plans
    const createPlanUseCase = new use_cases_1.CreateTreatmentPlanUseCase(treatmentPlanRepo);
    const getPlanUseCase = new use_cases_1.GetTreatmentPlanUseCase(treatmentPlanRepo);
    const updatePlanUseCase = new use_cases_1.UpdateTreatmentPlanUseCase(treatmentPlanRepo);
    const completePlanUseCase = new use_cases_1.CompleteTreatmentPlanUseCase(treatmentPlanRepo);
    const listPlansUseCase = new use_cases_1.ListTreatmentPlansUseCase(treatmentPlanRepo);
    // Initialize use cases - Prescriptions
    const createPrescriptionUseCase = new use_cases_1.CreatePrescriptionUseCase(prescriptionRepo);
    const getPrescriptionUseCase = new use_cases_1.GetPrescriptionUseCase(prescriptionRepo);
    const dispensePrescriptionUseCase = new use_cases_1.DispensePrescriptionUseCase(prescriptionRepo);
    const listPrescriptionsUseCase = new use_cases_1.ListPrescriptionsUseCase(prescriptionRepo);
    // Initialize controllers
    const clinicalNoteController = new controllers_1.ClinicalNoteController(createNoteUseCase, getNoteUseCase, updateNoteUseCase, cosignNoteUseCase, listNotesUseCase);
    const diagnosticReportController = new controllers_1.DiagnosticReportController(createReportUseCase, getReportUseCase, updateReportUseCase, finalizeReportUseCase, listReportsUseCase);
    const treatmentPlanController = new controllers_1.TreatmentPlanController(createPlanUseCase, getPlanUseCase, updatePlanUseCase, completePlanUseCase, listPlansUseCase);
    const prescriptionController = new controllers_1.PrescriptionController(createPrescriptionUseCase, getPrescriptionUseCase, dispensePrescriptionUseCase, listPrescriptionsUseCase);
    // Register routes
    app.use('/api/clinical-notes', (0, routes_1.createClinicalNoteRoutes)(clinicalNoteController));
    app.use('/api/diagnostic-reports', (0, routes_1.createDiagnosticReportRoutes)(diagnosticReportController));
    app.use('/api/treatment-plans', (0, routes_1.createTreatmentPlanRoutes)(treatmentPlanController));
    app.use('/api/prescriptions', (0, routes_1.createPrescriptionRoutes)(prescriptionController));
    // Health check
    app.get('/health', (req, res) => {
        res.json({ status: 'ok', service: 'clinical-emr-service', timestamp: new Date().toISOString() });
    });
    // Error handlers (must be last)
    app.use(errorHandler_1.notFoundHandler);
    app.use(errorHandler_1.errorHandler);
    return app;
}
//# sourceMappingURL=app.example.js.map