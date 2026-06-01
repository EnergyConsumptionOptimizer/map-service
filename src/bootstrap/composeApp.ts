import type { Express } from "express";
import type { Logger } from "pino";
import { MongooseHouseMapRepository } from "@infrastructure/mongo/MongooseHouseMapRepository";
import { HTTPSmartFurnitureHookupServicePort } from "@infrastructure/HTTPSmartFurnitureHookupServicePort";
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
import { config } from "@bootstrap/config";
import { KafkaDlqPublisher } from "@infrastructure/messaging/KafkaDlqPublisher";
import { KafkaHookupConsumer } from "@presentation/event/KafkaHookupConsumer";
import { SmartFurnitureHookupMessageHandler } from "@presentation/event/handlers/SmartFurnitureHookupMessageHandler";
import { MongoInboxRepository } from "@infrastructure/persistance/inbox/mongo/MongoInboxRepository";

export interface ComposedApp {
  readonly app: Express;
  readonly hookupConsumer: KafkaHookupConsumer;
  readonly kafkaDlqPublisher: KafkaDlqPublisher;
}

export async function composeApp(logger: Logger): Promise<ComposedApp> {
  const repository = new MongooseHouseMapRepository(
    logger.child({ component: "MongooseHouseMapRepository" }),
  );
  const smartFurnitureHookupServicePort =
    new HTTPSmartFurnitureHookupServicePort(
      config.hookupServiceUrl,
      logger.child({ component: "HTTPSmartFurnitureHookupServicePort" }),
    );
  const idGenerator = new NodeCryptoIdGenerator();
  const eventPublisher = new MongoOutboxEventPublisher(
    logger.child({ component: "MongoOutboxEventPublisher" }),
  );
  const inboxRepository = new MongoInboxRepository(
    logger.child({ component: "MongoInboxRepository" }),
  );
  const uow = new MongoUnitOfWork(
    logger.child({ component: "MongoUnitOfWork" }),
  );
  const metrics = new OtelBusinessMetrics();

  const floorPlanService = new FloorPlanServiceImpl(repository, metrics);

  const zoneService = new ZoneServiceImpl(
    repository,
    eventPublisher,
    idGenerator,
    uow,
    metrics,
  );

  const smartFurnitureHookupService = new SmartFurnitureHookupServiceImpl(
    smartFurnitureHookupServicePort,
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

  const mainRouter = router(controllers, authMiddleware);
  const app = createApp(mainRouter, logger);

  const kafkaDlqPublisher = new KafkaDlqPublisher(
    config.kafka.brokers,
    config.kafka.clientId,
    config.kafka.topics.forecastsDlq,
    logger.child({ component: "KafkaDlqPublisher" }),
  );

  const forecastMessageHandler = new SmartFurnitureHookupMessageHandler(
    smartFurnitureHookupService,
    inboxRepository,
    kafkaDlqPublisher,
    logger.child({ component: "ForecastMessageHandler" }),
  );

  const hookupConsumer = new KafkaHookupConsumer(
    config.kafka.brokers,
    config.kafka.clientId,
    config.kafka.groupId,
    config.kafka.topics.hookup,
    forecastMessageHandler,
    logger.child({ component: "KafkaHookupConsumer" }),
  );

  return { app, hookupConsumer, kafkaDlqPublisher };
}
