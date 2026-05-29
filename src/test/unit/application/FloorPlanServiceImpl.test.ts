import type { HouseMapRepository } from "@domain/ports/HouseMapRepository";
import type { BusinessMetrics } from "@application/outbound/BusinessMetrics";
import { FloorPlanServiceImpl } from "@application/FloorPlanServiceImpl";
import { FloorPlan } from "@domain/values/FloorPlan";
import { InvalidFloorPlanError } from "@domain/errors";
import { beforeEach, describe, expect, it } from "vitest";
import { mock, type MockProxy } from "vitest-mock-extended";
import { validFloorPlan } from "@test/domainFactories";

describe("FloorPlanServiceImpl", () => {
  let repository: MockProxy<HouseMapRepository>;
  let metrics: MockProxy<BusinessMetrics>;
  let service: FloorPlanServiceImpl;

  beforeEach(() => {
    repository = mock<HouseMapRepository>();
    metrics = mock<BusinessMetrics>();
    service = new FloorPlanServiceImpl(repository, metrics);
  });

  describe("createFloorPlan()", () => {
    it("should validate, save, record metrics, and return the floor plan for a valid SVG string", async () => {
      const svg = "<svg><rect/></svg>";

      const result = await service.createFloorPlan(svg);

      expect(result).toBeInstanceOf(FloorPlan);
      expect(repository.saveFloorPlan).toHaveBeenCalledWith(
        expect.any(FloorPlan),
      );
      expect(metrics.recordFloorPlanCreation).toHaveBeenCalledOnce();
    });

    it("should accept SVG with attributes on the opening tag", async () => {
      const svg =
        '<svg xmlns="http://www.w3.org/2000/svg"><circle r="5"/></svg>';

      const result = await service.createFloorPlan(svg);

      expect(result).toBeInstanceOf(FloorPlan);
      expect(metrics.recordFloorPlanCreation).toHaveBeenCalledOnce();
    });

    it("should accept SVG with leading whitespace", async () => {
      const result = await service.createFloorPlan("  \n<svg></svg>");

      expect(result).toBeInstanceOf(FloorPlan);
      expect(repository.saveFloorPlan).toHaveBeenCalled();
    });

    it("should return InvalidFloorPlanError for non-SVG markup without saving or recording metrics", async () => {
      const result = await service.createFloorPlan("<html><body/></html>");

      expect(result).toBeInstanceOf(InvalidFloorPlanError);
      expect(repository.saveFloorPlan).not.toHaveBeenCalled();
      expect(metrics.recordFloorPlanCreation).not.toHaveBeenCalled();
    });

    it("should return InvalidFloorPlanError for empty string without saving or recording metrics", async () => {
      const result = await service.createFloorPlan("");

      expect(result).toBeInstanceOf(InvalidFloorPlanError);
      expect(repository.saveFloorPlan).not.toHaveBeenCalled();
      expect(metrics.recordFloorPlanCreation).not.toHaveBeenCalled();
    });

    it("should return InvalidFloorPlanError for plain text without saving or recording metrics", async () => {
      const result = await service.createFloorPlan("just some text");

      expect(result).toBeInstanceOf(InvalidFloorPlanError);
      expect(repository.saveFloorPlan).not.toHaveBeenCalled();
      expect(metrics.recordFloorPlanCreation).not.toHaveBeenCalled();
    });
  });

  describe("getFloorPlan()", () => {
    it("should return the floor plan when one exists", async () => {
      const floorPlan = validFloorPlan();
      repository.findFloorPlan.mockResolvedValue(floorPlan);

      const result = await service.getFloorPlan();

      expect(result).toBe(floorPlan);
    });

    it("should return null when no floor plan has been saved yet", async () => {
      repository.findFloorPlan.mockResolvedValue(null);

      const result = await service.getFloorPlan();

      expect(result).toBeNull();
    });
  });
});
