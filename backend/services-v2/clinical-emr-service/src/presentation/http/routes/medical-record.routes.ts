import { Router } from "express";
import { MedicalRecordController } from "../controllers/MedicalRecordController";
import { requireRoles } from "../middlewares/auth.middleware";

export function createMedicalRecordRouter(
  controller: MedicalRecordController,
): Router {
  const router = Router();

  router.get("/medical-records", controller.list);
  router.get("/medical-records/:id", controller.get);
  router.post(
    "/medical-records",
    requireRoles("doctor", "nurse", "admin"),
    controller.create,
  );
  router.put(
    "/medical-records/:id",
    requireRoles("doctor", "nurse", "admin"),
    controller.update,
  );

  return router;
}
