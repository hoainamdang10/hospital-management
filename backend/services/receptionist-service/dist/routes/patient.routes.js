"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const patient_controller_1 = require("../controllers/patient.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = express_1.default.Router();
const patientController = new patient_controller_1.PatientController();
router.get('/search', auth_middleware_1.authMiddleware, auth_middleware_1.requireReceptionistOrAdmin, patientController.searchPatients);
router.get('/:patientId', auth_middleware_1.authMiddleware, patientController.getPatientDetails);
router.put('/:patientId/emergency-contact', auth_middleware_1.authMiddleware, auth_middleware_1.requireReceptionistOrAdmin, patientController.updateEmergencyContact);
router.put('/:patientId/insurance', auth_middleware_1.authMiddleware, auth_middleware_1.requireReceptionistOrAdmin, patientController.updateInsuranceInfo);
exports.default = router;
//# sourceMappingURL=patient.routes.js.map