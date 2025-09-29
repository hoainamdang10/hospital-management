"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_middleware_1 = require("../middleware/auth.middleware");
const checkRoleMiddleware_1 = require("../middleware/checkRoleMiddleware");
const patientController_1 = require("../controller/patientController");
const router = express_1.default.Router();
router.get('/profile', auth_middleware_1.authMiddleware, (0, checkRoleMiddleware_1.checkRoleMiddleware)('patient'), patientController_1.getPatientProfile);
exports.default = router;
