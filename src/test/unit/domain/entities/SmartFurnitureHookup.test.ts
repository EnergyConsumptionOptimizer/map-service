import { describe, expect, it } from "vitest";
import { point, validHookupID, validZoneID } from "@test/domainFactories";
import { SmartFurnitureHookup } from "@domain/entities/SmartFurnitureHookup";
import { SmartFurnitureHookupZoneChangedEvent } from "@domain/events/SmartFurnitureHookupAssignedToZoneEvent";

describe("SmartFurnitureHookup Entity", () => {
  describe("create()", () => {
    it("should create a hookup, unassigned by default, without emitting domain events", () => {
      const id = validHookupID("h1");
      const position = point(5, 5);

      const hookup = SmartFurnitureHookup.create(id, position);

      expect(hookup).toBeInstanceOf(SmartFurnitureHookup);
      expect(hookup.id).toBe(id);
      expect(hookup.position).toBe(position);
      expect(hookup.zoneId).toBeNull();
      expect(hookup.pullDomainEvents()).toHaveLength(0);
    });
  });

  describe("rehydrate()", () => {
    it("should restore a hookup without emitting domain events", () => {
      const hookup = SmartFurnitureHookup.rehydrate(
        validHookupID("h1"),
        point(5, 5),
        validZoneID("z9"),
      );

      expect(hookup.zoneId?.toString()).toBe("z9");
      expect(hookup.pullDomainEvents()).toHaveLength(0);
    });
  });

  describe("moveTo()", () => {
    it("should update the position without emitting domain events", () => {
      const hookup = SmartFurnitureHookup.create(
        validHookupID("h1"),
        point(5, 5),
      );

      hookup.moveTo(point(2, 3));

      expect(hookup.position.equals(point(2, 3))).toBe(true);
      expect(hookup.pullDomainEvents()).toHaveLength(0);
    });
  });

  describe("assignToZone()", () => {
    it("should set the zone and emit SmartFurnitureHookupZoneChangedEvent", () => {
      const hookup = SmartFurnitureHookup.create(
        validHookupID("h1"),
        point(5, 5),
      );

      hookup.assignToZone(validZoneID("z9"));

      expect(hookup.zoneId?.toString()).toBe("z9");

      const events = hookup.pullDomainEvents();
      expect(events).toHaveLength(1);
      expect(events[0]).toBeInstanceOf(SmartFurnitureHookupZoneChangedEvent);
      expect(
        (events[0] as SmartFurnitureHookupZoneChangedEvent).payload,
      ).toEqual({
        smartFurnitureHookupId: "h1",
        zoneId: "z9",
      });
    });
  });

  describe("unassignZone()", () => {
    it("should clear the zone and emit SmartFurnitureHookupZoneChangedEvent", () => {
      const hookup = SmartFurnitureHookup.rehydrate(
        validHookupID("h1"),
        point(5, 5),
        validZoneID("z9"),
      );

      hookup.unassignZone();

      expect(hookup.zoneId).toBeNull();

      const events = hookup.pullDomainEvents();
      expect(events).toHaveLength(1);
      expect(events[0]).toBeInstanceOf(SmartFurnitureHookupZoneChangedEvent);
      expect(
        (events[0] as SmartFurnitureHookupZoneChangedEvent).payload,
      ).toEqual({
        smartFurnitureHookupId: "h1",
        zoneId: null,
      });
    });
  });

  describe("equals()", () => {
    it("should compare hookups by identity", () => {
      const a = SmartFurnitureHookup.create(validHookupID("h1"), point(5, 5));
      const b = SmartFurnitureHookup.create(validHookupID("h1"), point(9, 9));

      expect(a.equals(b)).toBe(true);
    });
  });
});
