import "dotenv/config";
import { createLogger } from "./logger";
import { config } from "@bootstrap/config";
import { startInstrumentation } from "./instrumentation";
import { connectMongo } from "@bootstrap/mongoConnection";
import { composeApp } from "@bootstrap/composeApp";
import { setupGracefulShutdown } from "@bootstrap/shutdown";

const rootLogger = createLogger(config);
const logger = rootLogger.child({ component: "Server" });
const sdk = startInstrumentation(rootLogger);

async function start(): Promise<void> {
  await connectMongo(config.mongo.uri, logger);

  const { app } = await composeApp(rootLogger);

  const server = app.listen(config.port, () => {
    logger.info({ port: config.port }, "map-service listening");
  });

  setupGracefulShutdown(server, sdk, logger);
}

void start();
