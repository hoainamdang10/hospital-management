"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const session_controller_1 = require("../controllers/session.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = express_1.default.Router();
const sessionController = new session_controller_1.SessionController();
router.get('/current', auth_middleware_1.authMiddleware, sessionController.getCurrentSession);
router.get('/all', auth_middleware_1.authMiddleware, sessionController.getUserSessions);
router.post('/revoke-all', auth_middleware_1.authMiddleware, sessionController.revokeAllSessions);
router.get('/admin/all', auth_middleware_1.authMiddleware, auth_middleware_1.requireAdmin, sessionController.getAllSessions);
router.post('/admin/:userId/revoke', auth_middleware_1.authMiddleware, auth_middleware_1.requireAdmin, sessionController.revokeUserSessions);
exports.default = router;
//# sourceMappingURL=session.routes.js.map