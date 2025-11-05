/**
 * Session Management Routes
 * Handles listing, terminating sessions
 *
 * @author Hospital Management Team
 * @version 2.0.0
 */

import { Router } from "express";
import { RouteDependencies } from "./types";
import { AuthenticatedRequest } from "../middleware/AuthenticationMiddleware";

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error);
}

export function createSessionRoutes(deps: RouteDependencies): Router {
  const router = Router();
  const { logger } = deps;

  // List active sessions for current user (PROTECTED)
  router.get(
    "/:userId/sessions",
    deps.authMiddleware.authenticate(),
    deps.permissionMiddleware.requirePermission({
      permissions: ["sessions:read", "*"],
      checkOwnership: true,
      getResourceOwnerId: (req: AuthenticatedRequest) => req.params.userId,
    }),
    async (req: AuthenticatedRequest, res) => {
      try {
        const accessToken = req.headers.authorization?.startsWith("Bearer ")
          ? req.headers.authorization.substring(7)
          : undefined;

        const result = await deps.listActiveSessionsUseCase.execute({
          userId: req.params.userId,
          currentSessionId: req.user?.sessionId,
          accessToken,
        });

        res.json(result);
      } catch (error) {
        logger.error("List active sessions error", {
          error: getErrorMessage(error),
        });
        res.status(500).json({
          success: false,
          error: "Failed to list active sessions",
        });
      }
    },
  );

  // Terminate a specific session (PROTECTED)
  router.delete(
    "/:userId/sessions/:sessionId",
    deps.authMiddleware.authenticate(),
    deps.permissionMiddleware.requirePermission({
      permissions: ["sessions:delete", "*"],
      checkOwnership: true,
      getResourceOwnerId: (req: AuthenticatedRequest) => req.params.userId,
    }),
    async (req: AuthenticatedRequest, res) => {
      try {
        const result = await deps.terminateSessionUseCase.execute({
          userId: req.params.userId,
          sessionId: req.params.sessionId,
        });

        return res.json(result);
      } catch (error) {
        logger.error("Terminate session error", {
          error: getErrorMessage(error),
        });

        if (error instanceof Error) {
          if (error.message.includes("not found")) {
            return res.status(404).json({
              success: false,
              error: "Session not found",
            });
          }
          if (error.message.includes("Unauthorized")) {
            return res.status(403).json({
              success: false,
              error: "Unauthorized to terminate this session",
            });
          }
        }

        return res.status(500).json({
          success: false,
          error: "Failed to terminate session",
        });
      }
    },
  );

  // Terminate all sessions except current (PROTECTED)
  router.delete(
    "/:userId/sessions",
    deps.authMiddleware.authenticate(),
    deps.permissionMiddleware.requirePermission({
      permissions: ["sessions:delete", "*"],
      checkOwnership: true,
      getResourceOwnerId: (req: AuthenticatedRequest) => req.params.userId,
    }),
    async (req: AuthenticatedRequest, res) => {
      try {
        const accessToken = req.headers.authorization?.startsWith("Bearer ")
          ? req.headers.authorization.substring(7)
          : undefined;

        const result = await deps.terminateAllSessionsUseCase.execute({
          userId: req.params.userId,
          currentSessionId: req.user?.sessionId,
          accessToken,
        });

        res.json(result);
      } catch (error) {
        logger.error("Terminate all sessions error", {
          error: getErrorMessage(error),
        });
        res.status(500).json({
          success: false,
          error: "Failed to terminate all sessions",
        });
      }
    },
  );

  return router;
}
