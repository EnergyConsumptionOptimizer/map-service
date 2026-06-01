import mongoose from "mongoose";
import type { Logger } from "pino";
import { UnitOfWork } from "@application/outbound/UnitOfWork";
import { mongoSessionContext } from "@infrastructure/mongo/mongoSessionContext";

export class MongoUnitOfWork implements UnitOfWork {
  readonly #logger?: Logger;

  constructor(logger?: Logger) {
    this.#logger = logger;
  }

  async executeTransactionally<T>(operation: () => Promise<T>): Promise<T> {
    const session = await mongoose.startSession();
    const startTime = Date.now();

    try {
      const result = await session.withTransaction(() =>
        mongoSessionContext.run(session, operation),
      );
      this.#logger?.debug(
        { durationMs: Date.now() - startTime },
        "transaction committed",
      );
      return result;
    } catch (err) {
      this.#logger?.error(
        { err, durationMs: Date.now() - startTime },
        "transaction failed",
      );
      throw err;
    } finally {
      await session.endSession();
    }
  }
}
