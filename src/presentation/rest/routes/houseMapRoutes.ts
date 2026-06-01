import { Router } from "express";
import type { HouseMapController } from "@presentation/rest/controllers/HouseMapController";
import type { AuthMiddleware } from "@presentation/rest/middlewares/AuthMiddleware";

export function houseMapRoutes(
  houseMapController: HouseMapController,
  authMiddleware: AuthMiddleware,
): Router {
  const router = Router();

  router.use(authMiddleware.forwardAuth.bind(authMiddleware));

  router.get("/", (req, res) => houseMapController.getHouseMap(req, res));

  return router;
}
