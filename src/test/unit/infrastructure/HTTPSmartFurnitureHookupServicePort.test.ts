import axios from "axios";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { HTTPSmartFurnitureHookupServicePort } from "@infrastructure/HTTPSmartFurnitureHookupServicePort";

vi.mock("axios");

describe("HTTPSmartFurnitureHookupServicePort", () => {
  const BASE_URL = "http://hookup-service:3000";
  let service: HTTPSmartFurnitureHookupServicePort;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new HTTPSmartFurnitureHookupServicePort(BASE_URL);
  });

  describe("smartFurnitureHookupExists()", () => {
    it("should call the internal endpoint with the correct URL", async () => {
      vi.mocked(axios.get).mockResolvedValue({ data: { id: "sfh-1" } });

      await service.smartFurnitureHookupExists("sfh-1");

      expect(axios.get).toHaveBeenCalledWith(
        `${BASE_URL}/api/internal/smart-furniture-hookups/sfh-1`,
      );
    });

    it("should return true when the response matches the expected schema", async () => {
      vi.mocked(axios.get).mockResolvedValue({ data: { id: "sfh-1" } });

      const result = await service.smartFurnitureHookupExists("sfh-1");

      expect(result).toBe(true);
    });

    it("should return false when the response does not match the schema", async () => {
      vi.mocked(axios.get).mockResolvedValue({ data: { status: 200 } });

      const result = await service.smartFurnitureHookupExists("sfh-1");

      expect(result).toBe(false);
    });

    it("should return false for an empty response", async () => {
      vi.mocked(axios.get).mockResolvedValue({ data: {} });

      const result = await service.smartFurnitureHookupExists("sfh-1");

      expect(result).toBe(false);
    });

    it("should return the Error instance when axios throws an Error", async () => {
      const networkError = new Error("Network Error");
      vi.mocked(axios.get).mockRejectedValue(networkError);

      const result = await service.smartFurnitureHookupExists("sfh-1");

      expect(result).toBe(networkError);
    });

    it("should wrap a non-Error throw in a new Error", async () => {
      vi.mocked(axios.get).mockRejectedValue("unexpected string rejection");

      const result = await service.smartFurnitureHookupExists("sfh-1");

      expect(result).toBeInstanceOf(Error);
      expect((result as Error).message).toBe("Could not reach hookup service");
    });
  });
});
