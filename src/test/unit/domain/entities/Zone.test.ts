import { describe, expect, it } from "vitest";
import {
  point,
  unitSquare,
  validColor,
  validZoneID,
  validZoneName,
} from "@test/domainFactories";
import { Zone } from "@domain/entities/Zone";
import { ZoneDeletedEvent } from "@domain/events/ZoneDeletedEvent";

describe("Zone Entity", () => {
  describe("create()", () => {
    it("should create a zone", () => {
      const zone = Zone.create(
        validZoneID("z1"),
        validZoneName("Kitchen"),
        validColor("#112233"),
        unitSquare(),
      );

      expect(zone).toBeInstanceOf(Zone);
      expect(zone.id.toString()).toBe("z1");
      expect(zone.name.toString()).toBe("Kitchen");
      expect(zone.color.toString()).toBe("#112233");
    });
  });

  describe("rehydrate()", () => {
    it("should restore a zone", () => {
      const zone = Zone.rehydrate(
        validZoneID("z1"),
        validZoneName("Kitchen"),
        validColor("#112233"),
        unitSquare(),
      );

      expect(zone).toBeInstanceOf(Zone);
    });
  });

  describe("rename()", () => {
    it("should update the name", () => {
      const zone = Zone.rehydrate(
        validZoneID("z1"),
        validZoneName("Old"),
        validColor(),
        unitSquare(),
      );

      zone.rename(validZoneName("New"));

      expect(zone.name.toString()).toBe("New");
    });
  });

  describe("recolor()", () => {
    it("should update the color", () => {
      const zone = Zone.rehydrate(
        validZoneID("z1"),
        validZoneName("Z"),
        validColor("#FFFFFF"),
        unitSquare(),
      );

      zone.recolor(validColor("#000000"));

      expect(zone.color.equals(validColor("#000000"))).toBe(true);
    });
  });

  describe("reshape()", () => {
    it("should update the boundary", () => {
      const zone = Zone.rehydrate(
        validZoneID("z1"),
        validZoneName("Z"),
        validColor(),
        unitSquare(),
      );

      zone.reshape(unitSquare());
    });
  });

  describe("contains()", () => {
    it("should delegate point containment to its boundary", () => {
      const zone = Zone.rehydrate(
        validZoneID("z1"),
        validZoneName("Z"),
        validColor(),
        unitSquare(),
      );

      expect(zone.contains(point(5, 5))).toBe(true);
      expect(zone.contains(point(50, 50))).toBe(false);
    });
  });

  describe("prepareForDeletion()", () => {
    it("should emit ZoneDeletedEvent", () => {
      const zone = Zone.rehydrate(
        validZoneID("z1"),
        validZoneName("Z"),
        validColor(),
        unitSquare(),
      );

      zone.prepareForDeletion();

      const events = zone.pullDomainEvents();
      expect(events).toHaveLength(1);
      expect(events[0]).toBeInstanceOf(ZoneDeletedEvent);
    });
  });
});
