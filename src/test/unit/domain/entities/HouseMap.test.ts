import { describe, expect, it } from "vitest";
import {
  point,
  unitSquare,
  validColor,
  validFloorPlan,
  validHookupID,
  validZoneID,
  validZoneName,
} from "@test/domainFactories";
import { HouseMap } from "@domain/entities/Map";
import { Zone } from "@domain/entities/Zone";
import { SmartFurnitureHookup } from "@domain/entities/SmartFurnitureHookup";

describe("HouseMap Aggregate", () => {
  describe("create()", () => {
    it("should create an empty map without emitting domain events", () => {
      const map = HouseMap.create(validFloorPlan());

      expect(map).toBeInstanceOf(HouseMap);
      expect(map.zones).toHaveLength(0);
      expect(map.smartFurnitureHookups).toHaveLength(0);
      expect(map.pullDomainEvents()).toHaveLength(0);
    });
  });

  describe("rehydrate()", () => {
    it("should restore a map with its zones and hookups, without emitting domain events", () => {
      const zone = Zone.rehydrate(
        validZoneID("z1"),
        validZoneName("Kitchen"),
        validColor(),
        unitSquare(),
      );
      const hookup = SmartFurnitureHookup.rehydrate(
        validHookupID("h1"),
        point(5, 5),
        validZoneID("z1"),
      );

      const map = HouseMap.rehydrate(validFloorPlan(), [zone], [hookup]);

      expect(map).toBeInstanceOf(HouseMap);
      expect(map.zones).toHaveLength(1);
      expect(map.smartFurnitureHookups).toHaveLength(1);
      expect(map.pullDomainEvents()).toHaveLength(0);
    });
  });
});
