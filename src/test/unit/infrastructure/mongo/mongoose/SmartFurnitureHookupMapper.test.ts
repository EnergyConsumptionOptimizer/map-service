import { describe, expect, it } from "vitest";
import { SmartFurnitureHookup } from "@domain/entities/SmartFurnitureHookup";
import { SmartFurnitureHookupMapper } from "@infrastructure/mongo/mongoose/SmartFurnitureHookupModel";
import {
  aSmartFurnitureHookup,
  point,
  validZoneID,
} from "@test/domainFactories";

function aHookupDoc(overrides?: {
  _id?: string;
  position?: { x: number; y: number };
  zoneId?: string | null;
}) {
  return {
    _id: overrides?._id ?? "sfh-1",
    position: overrides?.position ?? { x: 5, y: 5 },
    zoneId: overrides?.zoneId !== undefined ? overrides.zoneId : null,
  };
}

describe("SmartFurnitureHookupMapper", () => {
  describe("toPersistence()", () => {
    it("should map id and position", () => {
      const sfh = aSmartFurnitureHookup({ id: "sfh-1", position: point(3, 7) });
      const result = SmartFurnitureHookupMapper.toPersistence(sfh);

      expect(result._id).toBe("sfh-1");
      expect(result.position).toEqual({ x: 3, y: 7 });
    });

    it("should set zoneId to null when the hookup has no zone", () => {
      const sfh = aSmartFurnitureHookup({ zoneId: null });
      const result = SmartFurnitureHookupMapper.toPersistence(sfh);

      expect(result.zoneId).toBeNull();
    });

    it("should map zoneId to a string when the hookup is assigned to a zone", () => {
      const sfh = aSmartFurnitureHookup({ zoneId: validZoneID("zone-42") });
      const result = SmartFurnitureHookupMapper.toPersistence(sfh);

      expect(result.zoneId).toBe("zone-42");
    });
  });

  describe("toDomain()", () => {
    it("should return a SmartFurnitureHookup instance", () => {
      const result = SmartFurnitureHookupMapper.toDomain(aHookupDoc());
      expect(result).toBeInstanceOf(SmartFurnitureHookup);
    });

    it("should restore id and position", () => {
      const result = SmartFurnitureHookupMapper.toDomain(
        aHookupDoc({ _id: "sfh-99", position: { x: 3, y: 7 } }),
      );
      expect(result.id.value).toBe("sfh-99");
      expect(result.position).toMatchObject({ x: 3, y: 7 });
    });

    it("should set zoneId to null when the document has no zone", () => {
      const result = SmartFurnitureHookupMapper.toDomain(
        aHookupDoc({ zoneId: null }),
      );
      expect(result.zoneId).toBeNull();
    });

    it("should restore the zoneId when the document has one", () => {
      const result = SmartFurnitureHookupMapper.toDomain(
        aHookupDoc({ zoneId: "zone-42" }),
      );
      expect(result.zoneId?.value).toBe("zone-42");
    });

    it("should produce no domain events on rehydration", () => {
      const result = SmartFurnitureHookupMapper.toDomain(aHookupDoc());
      expect(result.pullDomainEvents()).toHaveLength(0);
    });
  });
});
