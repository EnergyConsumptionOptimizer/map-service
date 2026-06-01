import { randomUUID } from "node:crypto";
import type { IdGenerator } from "@application/outbound/IdGenerator";

export class NodeCryptoIdGenerator implements IdGenerator {
  generate(): string {
    return randomUUID();
  }
}
