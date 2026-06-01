import { beforeEach, describe, expect, it } from "vitest";
import { mock, type MockProxy } from "vitest-mock-extended";
import { StatusCodes } from "http-status-codes";
import { FloorPlanController } from "@presentation/rest/controllers/FloorPlanController";
import type { FloorPlanService } from "@application/inbound/FloorPlanService";
import { floorPlanDTOMapper } from "@presentation/FloorPlanDTO";
import { InvalidFloorPlanError, FloorPlanNotFoundError } from "@domain/errors";
import { mockRequest } from "@test/unit/presentation/mockRequest";
import { mockResponse } from "@test/unit/presentation/mockResponse";
import { mockFloorPlan } from "@test/unit/presentation/controllers/mockData";

describe("FloorPlanController", () => {
  let floorPlanService: MockProxy<FloorPlanService>;
  let controller: FloorPlanController;

  beforeEach(() => {
    floorPlanService = mock<FloorPlanService>();
    controller = new FloorPlanController(floorPlanService);
  });

  describe("createFloorPlan()", () => {
    it("should return 201 and the floor plan DTO on success", async () => {
      floorPlanService.createFloorPlan.mockResolvedValue(mockFloorPlan);
      const req = mockRequest({
        body: { svgContent: mockFloorPlan.svgContent },
      });
      const res = mockResponse();

      await controller.createFloorPlan(req, res);

      expect(floorPlanService.createFloorPlan).toHaveBeenCalledWith(
        mockFloorPlan.svgContent,
      );
      expect(res.status).toHaveBeenCalledWith(StatusCodes.CREATED);
      expect(res.json).toHaveBeenCalledWith(
        floorPlanDTOMapper.toDTO(mockFloorPlan),
      );
    });

    it("should throw when the service returns an InvalidFloorPlanError", async () => {
      const error = new InvalidFloorPlanError();
      floorPlanService.createFloorPlan.mockResolvedValue(error);
      const req = mockRequest({ body: { svgContent: "<html/>" } });
      const res = mockResponse();

      await expect(controller.createFloorPlan(req, res)).rejects.toThrow(
        InvalidFloorPlanError,
      );
    });
  });

  describe("getFloorPlan()", () => {
    it("should return 200 and the floor plan DTO when a floor plan exists", async () => {
      floorPlanService.getFloorPlan.mockResolvedValue(mockFloorPlan);
      const req = mockRequest();
      const res = mockResponse();

      await controller.getFloorPlan(req, res);

      expect(res.status).toHaveBeenCalledWith(StatusCodes.OK);
      expect(res.json).toHaveBeenCalledWith(
        floorPlanDTOMapper.toDTO(mockFloorPlan),
      );
    });

    it("should throw FloorPlanNotFoundError when no floor plan has been uploaded", async () => {
      floorPlanService.getFloorPlan.mockResolvedValue(null);
      const req = mockRequest();
      const res = mockResponse();

      await expect(controller.getFloorPlan(req, res)).rejects.toThrow(
        FloorPlanNotFoundError,
      );
    });
  });
});
