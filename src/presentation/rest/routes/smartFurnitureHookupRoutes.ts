import { Router } from "express";
import type { SmartFurnitureHookupController } from "@presentation/rest/controllers/SmartFurnitureHookupController";
import type { AuthMiddleware } from "@presentation/rest/middlewares/AuthMiddleware";
import { validate } from "@presentation/rest/middlewares/validate";
import {
  SmartFurnitureHookupIdParamSchema,
  UpdateSmartFurnitureHookupSchema,
} from "@presentation/rest/schemas/SmartFurnitureHookupSchema";
import { UserRoles } from "@domain/values/UserRole";

export function smartFurnitureHookupRoutes(
  smartFurnitureHookupController: SmartFurnitureHookupController,
  authMiddleware: AuthMiddleware,
): Router {
  const router = Router();

  router.use(authMiddleware.forwardAuth.bind(authMiddleware));

  router
    .route("/")
    .get((req, res) =>
      smartFurnitureHookupController.getSmartFurnitureHookups(req, res),
    );

  router
    .route("/:id")
    .get(validate(SmartFurnitureHookupIdParamSchema), (req, res) =>
      smartFurnitureHookupController.getSmartFurnitureHookup(req, res),
    )
    .patch(
      authMiddleware.requireRole(UserRoles.ADMIN),
      validate(UpdateSmartFurnitureHookupSchema),
      (req, res) =>
        smartFurnitureHookupController.updateSmartFurnitureHookup(req, res),
    )
    .delete(
      authMiddleware.requireRole(UserRoles.ADMIN),
      validate(SmartFurnitureHookupIdParamSchema),
      (req, res) =>
        smartFurnitureHookupController.deleteSmartFurnitureHookup(req, res),
    );

  return router;
}
