import { Router } from "express";
import { WalletController } from "../controllers/WalletController";

export const createWalletRoutes = (controller: WalletController): Router => {
  const router = Router();

  router.get("/:patientId", (req, res) => controller.getWallet(req, res));
  router.post("/:patientId/top-up/link", (req, res) =>
    controller.createTopUpLink(req, res),
  );
  router.post("/:patientId/top-up", (req, res) => controller.topUp(req, res));
  router.post("/:patientId/charge", (req, res) => controller.charge(req, res));
  router.post("/:patientId/refund", (req, res) => controller.refund(req, res));

  return router;
};
