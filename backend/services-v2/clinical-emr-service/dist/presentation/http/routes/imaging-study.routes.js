"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createImagingStudyRouter = createImagingStudyRouter;
const express_1 = require("express");
const auth_middleware_1 = require("../middlewares/auth.middleware");
function createImagingStudyRouter(controller) {
    const router = (0, express_1.Router)({ mergeParams: true });
    router.get("/", controller.list);
    router.post("/", (0, auth_middleware_1.requireRoles)("doctor", "nurse", "admin"), controller.create);
    router.delete("/:studyId", (0, auth_middleware_1.requireRoles)("doctor", "nurse", "admin"), controller.delete);
    return router;
}
