import pino from "pino";
import { vi } from "vitest";
import type { Express } from "express";
import { MongooseHouseMapRepository } from "@infrastructure/mongo/MongooseHouseMapRepository";
import { NodeCryptoIdGenerator } from "@infrastructure/NodeCryptoIdGenerator";
import { MongoOutboxEventPublisher } from "@infrastructure/events/MongoOutboxEventPublisher";
import { MongoUnitOfWork } from "@infrastructure/mongo/MongoUnitOfWork";
import { OtelBusinessMetrics } from "@infrastructure/metrics/OtelBusinessMetrics";
import { FloorPlanServiceImpl } from "@application/FloorPlanServiceImpl";
import { ZoneServiceImpl } from "@application/ZoneServiceImpl";
import { SmartFurnitureHookupServiceImpl } from "@application/SmartFurnitureHookupServiceImpl";
import { HouseMapServiceImpl } from "@application/HouseMapServiceImpl";
import { FloorPlanController } from "@presentation/rest/controllers/FloorPlanController";
import { ZoneController } from "@presentation/rest/controllers/ZoneController";
import { SmartFurnitureHookupController } from "@presentation/rest/controllers/SmartFurnitureHookupController";
import { HouseMapController } from "@presentation/rest/controllers/HouseMapController";
import { AuthMiddleware } from "@presentation/rest/middlewares/AuthMiddleware";
import { router } from "@presentation/rest/routes/router";
import { createApp } from "@bootstrap/app";
import type { SmartFurnitureHookupServicePort } from "@application/outbound/SmartFurnitureHookupServicePort";

export { clearDatabase, startMongo, stopMongo } from "@test/mongoSetup";

export interface ComponentTestContext {
  app: Express;
}

export async function composeAppForComponentTest(): Promise<ComponentTestContext> {
  const logger = pino({ level: "silent" });

  const repository = new MongooseHouseMapRepository(logger);
  const idGenerator = new NodeCryptoIdGenerator();
  const eventPublisher = new MongoOutboxEventPublisher(logger);
  const uow = new MongoUnitOfWork(logger);
  const metrics = new OtelBusinessMetrics();

  const mockSmartFurnitureHookupServicePort: SmartFurnitureHookupServicePort = {
    smartFurnitureHookupExists: vi.fn().mockResolvedValue(true),
  };

  const floorPlanService = new FloorPlanServiceImpl(repository, metrics);
  const zoneService = new ZoneServiceImpl(
    repository,
    eventPublisher,
    idGenerator,
    uow,
    metrics,
  );
  const smartFurnitureHookupService = new SmartFurnitureHookupServiceImpl(
    mockSmartFurnitureHookupServicePort,
    repository,
    uow,
    eventPublisher,
    metrics,
  );
  const houseMapService = new HouseMapServiceImpl(
    floorPlanService,
    zoneService,
    smartFurnitureHookupService,
  );

  const authMiddleware = new AuthMiddleware();
  const controllers = {
    floorPlanController: new FloorPlanController(floorPlanService),
    zoneController: new ZoneController(zoneService),
    smartFurnitureHookupController: new SmartFurnitureHookupController(
      smartFurnitureHookupService,
    ),
    houseMapController: new HouseMapController(houseMapService),
  };

  const app = createApp(router(controllers, authMiddleware), logger);

  return { app };
}
