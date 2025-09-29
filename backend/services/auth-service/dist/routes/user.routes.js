"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const user_controller_1 = require("../controllers/user.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const auth_validators_1 = require("../validators/auth.validators");
const router = express_1.default.Router();
const userController = new user_controller_1.UserController();
router.get('/profile', auth_middleware_1.authMiddleware, userController.getProfile);
router.put('/profile', auth_middleware_1.authMiddleware, auth_validators_1.validateUpdateProfile, userController.updateProfile);
router.get('/', auth_middleware_1.authMiddleware, auth_middleware_1.requireAdmin, userController.getAllUsers);
router.get('/:userId', auth_middleware_1.authMiddleware, auth_middleware_1.requireAdmin, userController.getUserById);
router.patch('/:userId/activate', auth_middleware_1.authMiddleware, auth_middleware_1.requireAdmin, userController.activateUser);
router.patch('/:userId/deactivate', auth_middleware_1.authMiddleware, auth_middleware_1.requireAdmin, userController.deactivateUser);
router.patch('/:userId/role', auth_middleware_1.authMiddleware, auth_middleware_1.requireAdmin, auth_validators_1.validateRole, userController.updateUserRole);
router.delete('/:userId', auth_middleware_1.authMiddleware, auth_middleware_1.requireAdmin, userController.deleteUser);
exports.default = router;
//# sourceMappingURL=user.routes.js.map