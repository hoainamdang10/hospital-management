"use strict";
/**
 * Staff Routes
 * Defines HTTP routes for staff management
 *
 * @author Hospital Management Team
 * @version 2.0.0
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.createStaffRoutes = createStaffRoutes;
const express_1 = require("express");
function createStaffRoutes(staffController) {
    const router = (0, express_1.Router)();
    // Register new staff
    router.post('/', (req, res) => staffController.registerStaff(req, res));
    // Get staff profile by ID
    router.get('/:id', (req, res) => staffController.getStaffProfile(req, res));
    return router;
}
//# sourceMappingURL=staffRoutes.js.map