import { Router } from "express";
import { ImagingStudyController } from "../controllers/ImagingStudyController";
import { requireRoles } from "../middlewares/auth.middleware";

export function createImagingStudyRouter(
  controller: ImagingStudyController,
): Router {
  const router = Router({ mergeParams: true });
  router.get("/", controller.list);
  router.post("/", requireRoles("doctor", "nurse", "admin"), controller.create);
  router.delete(
    "/:studyId",
    requireRoles("doctor", "nurse", "admin"),
    controller.delete,
  );
  return router;
}
