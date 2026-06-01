import "dotenv/config";
import { createLogger } from "./logger";
import { config } from "@bootstrap/config";
import { startInstrumentation } from "./instrumentation";
import { connectMongo } from "@bootstrap/mongoConnection";
import { composeApp } from "@bootstrap/composeApp";
import { setupGracefulShutdown } from "@bootstrap/shutdown";
import { retryForever } from "@bootstrap/retryForever";

const rootLogger = createLogger(config);
const logger = rootLogger.child({ component: "Server" });
const sdk = startInstrumentation(rootLogger);

async function start(): Promise<void> {
  await connectMongo(config.mongo.uri, logger);

  const compose = await composeApp(rootLogger);

  const server = compose.app.listen(config.port, () => {
    logger.info({ port: config.port }, "map-service listening");
  });

  void retryForever(
    "Kafka consumer",
    async () => {
      await compose.hookupConsumer.connect();
      await compose.hookupConsumer.start();
    },
    logger,
  );

  void retryForever(
    "Kafka DLQ publisher",
    async () => {
      await compose.kafkaDlqPublisher.connect();
    },
    logger,
  );
  setupGracefulShutdown(server, sdk, logger, compose);
}

void start();
