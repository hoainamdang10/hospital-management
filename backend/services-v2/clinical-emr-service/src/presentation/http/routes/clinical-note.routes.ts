import { Router } from "express";
import { ClinicalNoteController } from "../controllers/ClinicalNoteController";
import { requireRoles } from "../middlewares/auth.middleware";

export function createClinicalNoteRouter(
  controller: ClinicalNoteController,
): Router {
  const router = Router({ mergeParams: true });
  router.get("/", controller.list);
  router.post("/", requireRoles("doctor", "nurse", "admin"), controller.create);
  router.delete(
    "/:noteId",
    requireRoles("doctor", "nurse", "admin"),
    controller.delete,
  );
  return router;
}
