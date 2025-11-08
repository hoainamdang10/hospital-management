"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createMedicalRecordRouter = createMedicalRecordRouter;
const express_1 = require("express");
const auth_middleware_1 = require("../middlewares/auth.middleware");
function createMedicalRecordRouter(controller) {
    const router = (0, express_1.Router)();
    router.get("/medical-records", controller.list);
    router.get("/medical-records/:id", controller.get);
    router.post("/medical-records", (0, auth_middleware_1.requireRoles)("doctor", "nurse", "admin"), controller.create);
    router.put("/medical-records/:id", (0, auth_middleware_1.requireRoles)("doctor", "nurse", "admin"), controller.update);
    return router;
}
