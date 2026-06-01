import { beforeEach, describe, expect, it } from "vitest";
import { mock, type MockProxy } from "vitest-mock-extended";
import { StatusCodes } from "http-status-codes";
import { HouseMapController } from "@presentation/rest/controllers/HouseMapController";
import type { HouseMapService } from "@application/inbound/HouseMapService";
import { houseMapDTOMapper } from "@presentation/HouseMapDTO";
import { FloorPlanNotFoundError } from "@domain/errors";
import { mockRequest } from "@test/unit/presentation/mockRequest";
import { mockResponse } from "@test/unit/presentation/mockResponse";
import { mockHouseMap } from "@test/unit/presentation/controllers/mockData";

describe("HouseMapController", () => {
  let houseMapService: MockProxy<HouseMapService>;
  let controller: HouseMapController;

  beforeEach(() => {
    houseMapService = mock<HouseMapService>();
    controller = new HouseMapController(houseMapService);
  });

  describe("getHouseMap()", () => {
    it("should return 200 and the full house map DTO on success", async () => {
      houseMapService.getHouseMap.mockResolvedValue(mockHouseMap);
      const req = mockRequest();
      const res = mockResponse();

      await controller.getHouseMap(req, res);

      expect(res.status).toHaveBeenCalledWith(StatusCodes.OK);
      expect(res.json).toHaveBeenCalledWith(
        houseMapDTOMapper.toDTO(mockHouseMap),
      );
    });

    it("should include floor plan, zones, and hookups in the response", async () => {
      houseMapService.getHouseMap.mockResolvedValue(mockHouseMap);
      const req = mockRequest();
      const res = mockResponse();

      await controller.getHouseMap(req, res);

      const dto = houseMapDTOMapper.toDTO(mockHouseMap);
      expect(dto.floorPlan).toBeDefined();
      expect(dto.zones).toHaveLength(dto.zones.length);
      expect(dto.smartFurnitureHookups).toHaveLength(
        dto.smartFurnitureHookups.length,
      );
    });

    it("should throw FloorPlanNotFoundError when no floor plan exists", async () => {
      houseMapService.getHouseMap.mockResolvedValue(
        new FloorPlanNotFoundError(),
      );
      const req = mockRequest();
      const res = mockResponse();

      await expect(controller.getHouseMap(req, res)).rejects.toThrow(
        FloorPlanNotFoundError,
      );
    });
  });
});
