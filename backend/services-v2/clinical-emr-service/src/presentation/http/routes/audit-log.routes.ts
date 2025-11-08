import { Router } from "express";
import { AuditLogController } from "../controllers/AuditLogController";
import { requireRoles } from "../middlewares/auth.middleware";

export function createAuditLogRouter(controller: AuditLogController): Router {
  const router = Router({ mergeParams: true });
  router.get("/", controller.list);
  router.post("/", requireRoles("admin"), controller.create);
  return router;
}
