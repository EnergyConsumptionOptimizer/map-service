import { describe, expect, it } from "vitest";
import { Zone } from "@domain/entities/Zone";
import { ZoneMapper } from "@infrastructure/mongo/mongoose/ZoneModel";
import { aZone } from "@test/domainFactories";

function aZoneDoc(overrides?: {
  _id?: string;
  name?: string;
  color?: string;
  vertices?: { x: number; y: number }[];
}) {
  return {
    _id: overrides?._id ?? "zone-1",
    name: overrides?.name ?? "Living Room",
    color: overrides?.color ?? "#FF8800",
    vertices: overrides?.vertices ?? [
      { x: 0, y: 0 },
      { x: 10, y: 0 },
      { x: 10, y: 10 },
      { x: 0, y: 10 },
    ],
  };
}

describe("ZoneMapper", () => {
  describe("toPersistence()", () => {
    it("should map id, name, color, and vertices", () => {
      const zone = aZone({
        id: "zone-1",
        name: "Living Room",
        color: "#FF8800",
      });
      const result = ZoneMapper.toPersistence(zone);

      expect(result._id).toBe("zone-1");
      expect(result.name).toBe("Living Room");
      expect(result.color).toBe("#FF8800");
    });

    it("should map each boundary vertex to a {x, y} subdoc", () => {
      const zone = aZone();
      const result = ZoneMapper.toPersistence(zone);

      expect(result.vertices).toHaveLength(4);
      expect(result.vertices[0]).toEqual({ x: 0, y: 0 });
      expect(result.vertices[1]).toEqual({ x: 10, y: 0 });
    });
  });

  describe("toDomain()", () => {
    it("should return a Zone instance", () => {
      const result = ZoneMapper.toDomain(aZoneDoc());
      expect(result).toBeInstanceOf(Zone);
    });

    it("should restore id, name, and color", () => {
      const result = ZoneMapper.toDomain(
        aZoneDoc({ _id: "zone-42", name: "Kitchen", color: "#AABBCC" }),
      );
      expect(result.id.value).toBe("zone-42");
      expect(result.name.value).toBe("Kitchen");
      expect(result.color.value).toBe("#AABBCC");
    });

    it("should restore all boundary vertices", () => {
      const result = ZoneMapper.toDomain(aZoneDoc());
      expect(result.boundary.vertices).toHaveLength(4);
      expect(result.boundary.vertices[0]).toMatchObject({ x: 0, y: 0 });
      expect(result.boundary.vertices[2]).toMatchObject({ x: 10, y: 10 });
    });

    it("should produce no domain events on rehydration", () => {
      const result = ZoneMapper.toDomain(aZoneDoc());
      expect(result.pullDomainEvents()).toHaveLength(0);
    });
  });
});
