"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createClinicalNoteRouter = createClinicalNoteRouter;
const express_1 = require("express");
const auth_middleware_1 = require("../middlewares/auth.middleware");
function createClinicalNoteRouter(controller) {
    const router = (0, express_1.Router)({ mergeParams: true });
    router.get("/", controller.list);
    router.post("/", (0, auth_middleware_1.requireRoles)("doctor", "nurse", "admin"), controller.create);
    router.delete("/:noteId", (0, auth_middleware_1.requireRoles)("doctor", "nurse", "admin"), controller.delete);
    return router;
}
