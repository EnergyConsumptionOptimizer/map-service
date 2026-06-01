import { Router } from "express";
import type { SmartFurnitureHookupController } from "@presentation/rest/controllers/SmartFurnitureHookupController";
import { internalSmartFurnitureHookupRoutes } from "./smartFurnitureHookupRoutes";

export function internalRoutes(
  smartFurnitureHookupController: SmartFurnitureHookupController,
): Router {
  const router = Router();

  router.use(
    "/smart-furniture-hookups",
    internalSmartFurnitureHookupRoutes(smartFurnitureHookupController),
  );

  return router;
}
