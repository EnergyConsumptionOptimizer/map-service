import { Router } from "express";
import type { ZoneController } from "@presentation/rest/controllers/ZoneController";
import type { AuthMiddleware } from "@presentation/rest/middlewares/AuthMiddleware";
import { validate } from "@presentation/rest/middlewares/validate";
import {
  CreateZoneSchema,
  UpdateZoneSchema,
  ZoneIdParamSchema,
} from "@presentation/rest/schemas/ZoneSchema";
import { UserRoles } from "@domain/values/UserRole";

export function zoneRoutes(
  zoneController: ZoneController,
  authMiddleware: AuthMiddleware,
): Router {
  const router = Router();

  router.use(authMiddleware.forwardAuth.bind(authMiddleware));

  router
    .route("/")
    .get((req, res) => zoneController.getZones(req, res))
    .post(
      authMiddleware.requireRole(UserRoles.ADMIN),
      validate(CreateZoneSchema),
      (req, res) => zoneController.createZone(req, res),
    );

  router
    .route("/:id")
    .get(validate(ZoneIdParamSchema), (req, res) =>
      zoneController.getZone(req, res),
    )
    .patch(
      authMiddleware.requireRole(UserRoles.ADMIN),
      validate(UpdateZoneSchema),
      (req, res) => zoneController.updateZone(req, res),
    )
    .delete(
      authMiddleware.requireRole(UserRoles.ADMIN),
      validate(ZoneIdParamSchema),
      (req, res) => zoneController.deleteZone(req, res),
    );

  return router;
}
