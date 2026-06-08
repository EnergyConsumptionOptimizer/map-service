import { beforeEach, describe, expect, it } from "vitest";
import { mock, type MockProxy } from "vitest-mock-extended";
import { StatusCodes } from "http-status-codes";
import { SmartFurnitureHookupController } from "@presentation/rest/controllers/SmartFurnitureHookupController";
import type { SmartFurnitureHookupService } from "@application/inbound/SmartFurnitureHookupService";
import { smartFurnitureHookupDTOMapper } from "@presentation/SmartFurnitureHookupDTO";
import {
  SmartFurnitureHookupNotFoundError,
  ZoneNotFoundError,
} from "@domain/errors";
import { mockRequest } from "@test/unit/presentation/mockRequest";
import { mockResponse } from "@test/unit/presentation/mockResponse";
import {
  mockHookupDesk,
  mockHookupLamp,
  mockHookupFridge,
} from "@test/unit/presentation/controllers/mockData";

describe("SmartFurnitureHookupController", () => {
  let smartFurnitureHookupService: MockProxy<SmartFurnitureHookupService>;
  let controller: SmartFurnitureHookupController;

  beforeEach(() => {
    smartFurnitureHookupService = mock<SmartFurnitureHookupService>();
    controller = new SmartFurnitureHookupController(
      smartFurnitureHookupService,
    );
  });

  describe("getSmartFurnitureHookups()", () => {
    it("should return 200 with all hookups wrapped in a smartFurnitureHookups array", async () => {
      const hookups = [mockHookupDesk, mockHookupLamp, mockHookupFridge];
      smartFurnitureHookupService.getSmartFurnitureHookups.mockResolvedValue(
        hookups,
      );
      const req = mockRequest();
      const res = mockResponse();

      await controller.getSmartFurnitureHookups(req, res);

      expect(res.status).toHaveBeenCalledWith(StatusCodes.OK);
      expect(res.json).toHaveBeenCalledWith({
        smartFurnitureHookups: hookups.map(smartFurnitureHookupDTOMapper.toDTO),
      });
    });

    it("should return an empty smartFurnitureHookups array when none exist", async () => {
      smartFurnitureHookupService.getSmartFurnitureHookups.mockResolvedValue(
        [],
      );
      const req = mockRequest();
      const res = mockResponse();

      await controller.getSmartFurnitureHookups(req, res);

      expect(res.json).toHaveBeenCalledWith({ smartFurnitureHookups: [] });
    });
  });

  describe("getSmartFurnitureHookup()", () => {
    it("should return 200 and the hookup DTO when found", async () => {
      smartFurnitureHookupService.getSmartFurnitureHookup.mockResolvedValue(
        mockHookupDesk,
      );
      const req = mockRequest({ params: { id: "sfh-desk" } });
      const res = mockResponse();

      await controller.getSmartFurnitureHookup(req, res);

      expect(
        smartFurnitureHookupService.getSmartFurnitureHookup,
      ).toHaveBeenCalledWith("sfh-desk");
      expect(res.status).toHaveBeenCalledWith(StatusCodes.OK);
      expect(res.json).toHaveBeenCalledWith(
        smartFurnitureHookupDTOMapper.toDTO(mockHookupDesk),
      );
    });

    it("should throw SmartFurnitureHookupNotFoundError when not found", async () => {
      smartFurnitureHookupService.getSmartFurnitureHookup.mockResolvedValue(
        new SmartFurnitureHookupNotFoundError("unknown"),
      );
      const req = mockRequest({ params: { id: "unknown" } });
      const res = mockResponse();

      await expect(
        controller.getSmartFurnitureHookup(req, res),
      ).rejects.toThrow(SmartFurnitureHookupNotFoundError);
    });
  });

  describe("updateSmartFurnitureHookup()", () => {
    it("should return 200 and the updated hookup DTO when position is changed", async () => {
      smartFurnitureHookupService.updateSmartFurnitureHookup.mockResolvedValue(
        mockHookupDesk,
      );
      const req = mockRequest({
        params: { id: "sfh-desk" },
        body: { position: { x: 3, y: 4 } },
      });
      const res = mockResponse();

      await controller.updateSmartFurnitureHookup(req, res);

      expect(
        smartFurnitureHookupService.updateSmartFurnitureHookup,
      ).toHaveBeenCalledWith("sfh-desk", [3, 4], undefined);
      expect(res.status).toHaveBeenCalledWith(StatusCodes.OK);
      expect(res.json).toHaveBeenCalledWith(
        smartFurnitureHookupDTOMapper.toDTO(mockHookupDesk),
      );
    });

    it("should pass the zoneId when provided", async () => {
      smartFurnitureHookupService.updateSmartFurnitureHookup.mockResolvedValue(
        mockHookupDesk,
      );
      const req = mockRequest({
        params: { id: "sfh-desk" },
        body: { zoneId: "zone-living-room" },
      });
      const res = mockResponse();

      await controller.updateSmartFurnitureHookup(req, res);

      expect(
        smartFurnitureHookupService.updateSmartFurnitureHookup,
      ).toHaveBeenCalledWith("sfh-desk", undefined, "zone-living-room");
    });

    it("should pass both position and zoneId when both are provided", async () => {
      smartFurnitureHookupService.updateSmartFurnitureHookup.mockResolvedValue(
        mockHookupDesk,
      );
      const req = mockRequest({
        params: { id: "sfh-desk" },
        body: { position: { x: 5, y: 5 }, zoneId: "zone-kitchen" },
      });
      const res = mockResponse();

      await controller.updateSmartFurnitureHookup(req, res);

      expect(
        smartFurnitureHookupService.updateSmartFurnitureHookup,
      ).toHaveBeenCalledWith("sfh-desk", [5, 5], "zone-kitchen");
    });

    it("should throw SmartFurnitureHookupNotFoundError when the hookup does not exist", async () => {
      smartFurnitureHookupService.updateSmartFurnitureHookup.mockResolvedValue(
        new SmartFurnitureHookupNotFoundError("unknown"),
      );
      const req = mockRequest({
        params: { id: "unknown" },
        body: { position: { x: 1, y: 1 } },
      });
      const res = mockResponse();

      await expect(
        controller.updateSmartFurnitureHookup(req, res),
      ).rejects.toThrow(SmartFurnitureHookupNotFoundError);
    });

    it("should throw ZoneNotFoundError when the given zone does not exist", async () => {
      smartFurnitureHookupService.updateSmartFurnitureHookup.mockResolvedValue(
        new ZoneNotFoundError("missing-zone"),
      );
      const req = mockRequest({
        params: { id: "sfh-desk" },
        body: { zoneId: "missing-zone" },
      });
      const res = mockResponse();

      await expect(
        controller.updateSmartFurnitureHookup(req, res),
      ).rejects.toThrow(ZoneNotFoundError);
    });
  });
});
