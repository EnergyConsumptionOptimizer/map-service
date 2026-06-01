import mongoose from "mongoose";
import type { Logger } from "pino";

export function connectMongo(uri: string, logger: Logger): Promise<void> {
  mongoose.connection.on("error", (err) => {
    logger.error({ err }, "MongoDB runtime connection error");
  });

  return mongoose
    .connect(uri, {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 10000,
    })
    .then(() => {
      logger.info("connected to MongoDB");
    })
    .catch((err) => {
      logger.fatal({ err }, "failed to connect to MongoDB");
      process.exit(1);
    });
}
