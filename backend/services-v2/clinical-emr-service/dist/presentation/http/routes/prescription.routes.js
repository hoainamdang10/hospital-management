"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createPrescriptionRouter = createPrescriptionRouter;
const express_1 = require("express");
const auth_middleware_1 = require("../middlewares/auth.middleware");
function createPrescriptionRouter(controller) {
    const router = (0, express_1.Router)({ mergeParams: true });
    router.get("/", controller.list);
    router.post("/", (0, auth_middleware_1.requireRoles)("doctor", "nurse", "admin"), controller.create);
    router.delete("/:prescriptionId", (0, auth_middleware_1.requireRoles)("doctor", "nurse", "admin"), controller.delete);
    return router;
}
