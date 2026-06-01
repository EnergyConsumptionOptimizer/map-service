import { describe, expect, it } from "vitest";
import { FloorPlan } from "@domain/values/FloorPlan";
import {
  FloorPlanMapper,
  FLOOR_PLAN_ID,
} from "@infrastructure/mongo/mongoose/FloorPlanModel";
import { validFloorPlan } from "@test/domainFactories";

describe("FloorPlanMapper", () => {
  describe("toPersistence()", () => {
    it("should use the singleton document ID", () => {
      const fp = validFloorPlan("<svg><rect/></svg>");
      const result = FloorPlanMapper.toPersistence(fp);
      expect(result._id).toBe(FLOOR_PLAN_ID);
    });

    it("should map the svgContent field", () => {
      const fp = validFloorPlan("<svg><circle r='5'/></svg>");
      const result = FloorPlanMapper.toPersistence(fp);
      expect(result.svgContent).toBe("<svg><circle r='5'/></svg>");
    });
  });

  describe("toDomain()", () => {
    it("should return a FloorPlan instance", () => {
      const result = FloorPlanMapper.toDomain({ svgContent: "<svg></svg>" });
      expect(result).toBeInstanceOf(FloorPlan);
    });

    it("should preserve the svgContent value", () => {
      const svg = "<svg><path d='M0 0'/></svg>";
      const result = FloorPlanMapper.toDomain({ svgContent: svg });
      expect(result.svgContent).toBe(svg);
    });
  });
});
