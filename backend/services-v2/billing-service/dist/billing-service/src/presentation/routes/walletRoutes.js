"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createWalletRoutes = void 0;
const express_1 = require("express");
const createWalletRoutes = (controller) => {
    const router = (0, express_1.Router)();
    router.get("/:patientId", (req, res) => controller.getWallet(req, res));
    router.post("/:patientId/top-up/link", (req, res) => controller.createTopUpLink(req, res));
    router.post("/:patientId/top-up", (req, res) => controller.topUp(req, res));
    router.post("/:patientId/charge", (req, res) => controller.charge(req, res));
    router.post("/:patientId/refund", (req, res) => controller.refund(req, res));
    return router;
};
exports.createWalletRoutes = createWalletRoutes;
//# sourceMappingURL=walletRoutes.js.map