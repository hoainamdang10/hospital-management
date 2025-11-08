"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createTreatmentPlanRouter = createTreatmentPlanRouter;
const express_1 = require("express");
const auth_middleware_1 = require("../middlewares/auth.middleware");
function createTreatmentPlanRouter(controller) {
    const router = (0, express_1.Router)({ mergeParams: true });
    router.get("/", controller.list);
    router.post("/", (0, auth_middleware_1.requireRoles)("doctor", "nurse", "admin"), controller.create);
    router.patch("/:planId/status", (0, auth_middleware_1.requireRoles)("doctor", "nurse", "admin"), controller.updateStatus);
    router.delete("/:planId", (0, auth_middleware_1.requireRoles)("doctor", "nurse", "admin"), controller.delete);
    return router;
}
