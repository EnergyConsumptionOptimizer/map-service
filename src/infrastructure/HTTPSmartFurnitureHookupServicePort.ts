import axios from "axios";
import type { Logger } from "pino";
import type { SmartFurnitureHookupServicePort } from "@application/outbound/SmartFurnitureHookupServicePort";
import { getSmartFurnitureHookupResponse } from "@infrastructure/contracts/getSmartFurnitureHookupResponse";

export class HTTPSmartFurnitureHookupServicePort implements SmartFurnitureHookupServicePort {
  readonly #logger?: Logger;

  constructor(
    private readonly baseUrl: string,
    logger?: Logger,
  ) {
    this.#logger = logger;
  }

  async smartFurnitureHookupExists(id: string): Promise<boolean | Error> {
    const url = `${this.baseUrl}/api/internal/smart-furniture-hookups/${id}`;

    try {
      const { data } = await axios.get(url);

      const parsed = getSmartFurnitureHookupResponse.safeParse(data);

      return parsed.success;
    } catch (error) {
      this.#logger?.error(
        { error, smartFurnitureHookupId: id },
        "Could not reach hookup service",
      );

      return error instanceof Error
        ? error
        : new Error("Could not reach hookup service");
    }
  }
}
