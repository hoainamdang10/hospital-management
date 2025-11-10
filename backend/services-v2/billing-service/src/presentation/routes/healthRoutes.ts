/**
 * Health Routes
 */

import { Router, Request, Response } from "express";

export function createHealthRoutes(): Router {
  const router = Router();

  router.get("/health", (_req: Request, res: Response) => {
    res.status(200).json({
      status: "healthy",
      service: "billing-service",
      timestamp: new Date().toISOString(),
    });
  });

  return router;
}
