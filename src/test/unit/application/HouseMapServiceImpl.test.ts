import type { FloorPlanService } from "@application/inbound/FloorPlanService";
import type { ZoneService } from "@application/inbound/ZoneService";
import type { SmartFurnitureHookupService } from "@application/inbound/SmartFurnitureHookupService";
import { HouseMapServiceImpl } from "@application/HouseMapServiceImpl";
import { HouseMap } from "@domain/entities/Map";
import { FloorPlanNotFoundError } from "@domain/errors";
import { beforeEach, describe, expect, it } from "vitest";
import { mock, type MockProxy } from "vitest-mock-extended";
import {
  validFloorPlan,
  aZone,
  aSmartFurnitureHookup,
} from "@test/domainFactories";

describe("HouseMapServiceImpl", () => {
  let floorPlanService: MockProxy<FloorPlanService>;
  let zoneService: MockProxy<ZoneService>;
  let smartFurnitureHookupService: MockProxy<SmartFurnitureHookupService>;
  let service: HouseMapServiceImpl;

  beforeEach(() => {
    floorPlanService = mock<FloorPlanService>();
    zoneService = mock<ZoneService>();
    smartFurnitureHookupService = mock<SmartFurnitureHookupService>();
    service = new HouseMapServiceImpl(
      floorPlanService,
      zoneService,
      smartFurnitureHookupService,
    );
  });

  describe("getHouseMap()", () => {
    it("should assemble and return a HouseMap with floor plan, zones, and hookups", async () => {
      const floorPlan = validFloorPlan();
      const zones = [aZone({ id: "zone-1" }), aZone({ id: "zone-2" })];
      const hookups = [
        aSmartFurnitureHookup({ id: "sfh-1" }),
        aSmartFurnitureHookup({ id: "sfh-2" }),
      ];

      floorPlanService.getFloorPlan.mockResolvedValue(floorPlan);
      zoneService.getZones.mockResolvedValue(zones);
      smartFurnitureHookupService.getSmartFurnitureHookups.mockResolvedValue(
        hookups,
      );

      const result = await service.getHouseMap();

      expect(result).toBeInstanceOf(HouseMap);
      const map = result as HouseMap;
      expect(map.floorPlan).toBe(floorPlan);
      expect(map.zones).toHaveLength(2);
      expect(map.smartFurnitureHookups).toHaveLength(2);
    });

    it("should return FloorPlanNotFoundError when no floor plan exists", async () => {
      floorPlanService.getFloorPlan.mockResolvedValue(null);

      const result = await service.getHouseMap();

      expect(result).toBeInstanceOf(FloorPlanNotFoundError);
    });

    it("should not fetch zones or hookups when floor plan is missing", async () => {
      floorPlanService.getFloorPlan.mockResolvedValue(null);

      await service.getHouseMap();

      expect(zoneService.getZones).not.toHaveBeenCalled();
      expect(
        smartFurnitureHookupService.getSmartFurnitureHookups,
      ).not.toHaveBeenCalled();
    });

    it("should fetch zones and hookups in parallel", async () => {
      floorPlanService.getFloorPlan.mockResolvedValue(validFloorPlan());
      zoneService.getZones.mockResolvedValue([]);
      smartFurnitureHookupService.getSmartFurnitureHookups.mockResolvedValue(
        [],
      );

      await service.getHouseMap();

      expect(zoneService.getZones).toHaveBeenCalledOnce();
      expect(
        smartFurnitureHookupService.getSmartFurnitureHookups,
      ).toHaveBeenCalledOnce();
    });

    it("should return an empty HouseMap when there are no zones or hookups", async () => {
      floorPlanService.getFloorPlan.mockResolvedValue(validFloorPlan());
      zoneService.getZones.mockResolvedValue([]);
      smartFurnitureHookupService.getSmartFurnitureHookups.mockResolvedValue(
        [],
      );

      const result = await service.getHouseMap();

      const map = result as HouseMap;
      expect(map.zones).toHaveLength(0);
      expect(map.smartFurnitureHookups).toHaveLength(0);
    });
  });
});
