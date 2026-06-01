import { Router } from "express";
import type { FloorPlanController } from "@presentation/rest/controllers/FloorPlanController";
import type { ZoneController } from "@presentation/rest/controllers/ZoneController";
import type { SmartFurnitureHookupController } from "@presentation/rest/controllers/SmartFurnitureHookupController";
import type { HouseMapController } from "@presentation/rest/controllers/HouseMapController";
import type { AuthMiddleware } from "@presentation/rest/middlewares/AuthMiddleware";
import { healthCheck } from "@presentation/rest/routes/healthCheck";
import { floorPlanRoutes } from "@presentation/rest/routes/floorPlanRoutes";
import { zoneRoutes } from "@presentation/rest/routes/zoneRoutes";
import { smartFurnitureHookupRoutes } from "@presentation/rest/routes/smartFurnitureHookupRoutes";
import { houseMapRoutes } from "@presentation/rest/routes/houseMapRoutes";
import { internalRoutes } from "@presentation/rest/routes/internal/internalRoutes";

export interface Controllers {
  floorPlanController: FloorPlanController;
  zoneController: ZoneController;
  smartFurnitureHookupController: SmartFurnitureHookupController;
  houseMapController: HouseMapController;
}

export function router(
  controllers: Controllers,
  authMiddleware: AuthMiddleware,
): Router {
  const r = Router();

  r.get("/health", healthCheck);

  r.use(
    "/api/floor-plan",
    floorPlanRoutes(controllers.floorPlanController, authMiddleware),
  );

  r.use("/api/zones", zoneRoutes(controllers.zoneController, authMiddleware));

  r.use(
    "/api/smart-furniture-hookups",
    smartFurnitureHookupRoutes(
      controllers.smartFurnitureHookupController,
      authMiddleware,
    ),
  );

  r.use(
    "/api/house-map",
    houseMapRoutes(controllers.houseMapController, authMiddleware),
  );

  r.use(
    "/api/internal",
    internalRoutes(controllers.smartFurnitureHookupController),
  );

  return r;
}
