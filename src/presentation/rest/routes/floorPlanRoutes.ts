import { Router } from "express";
import type { FloorPlanController } from "@presentation/rest/controllers/FloorPlanController";
import type { AuthMiddleware } from "@presentation/rest/middlewares/AuthMiddleware";
import { validate } from "@presentation/rest/middlewares/validate";
import { CreateFloorPlanSchema } from "@presentation/rest/schemas/FloorPlanSchema";
import { UserRoles } from "@domain/values/UserRole";

export function floorPlanRoutes(
  floorPlanController: FloorPlanController,
  authMiddleware: AuthMiddleware,
): Router {
  const router = Router();

  router.use(authMiddleware.forwardAuth.bind(authMiddleware));

  router
    .route("/")
    .get((req, res) => floorPlanController.getFloorPlan(req, res))
    .post(
      authMiddleware.requireRole(UserRoles.ADMIN),
      validate(CreateFloorPlanSchema),
      (req, res) => floorPlanController.createFloorPlan(req, res),
    );

  return router;
}
