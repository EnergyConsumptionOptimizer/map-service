import { Router } from "express";
import type { SmartFurnitureHookupController } from "@presentation/rest/controllers/SmartFurnitureHookupController";
import { validate } from "@presentation/rest/middlewares/validate";
import { SmartFurnitureHookupIdParamSchema } from "@presentation/rest/schemas/SmartFurnitureHookupSchema";

export function internalSmartFurnitureHookupRoutes(
  smartFurnitureHookupController: SmartFurnitureHookupController,
): Router {
  const router = Router();

  router.get("/:id", validate(SmartFurnitureHookupIdParamSchema), (req, res) =>
    smartFurnitureHookupController.getSmartFurnitureHookup(req, res),
  );

  router.get("/", (req, res) =>
    smartFurnitureHookupController.getSmartFurnitureHookups(req, res),
  );

  return router;
}
