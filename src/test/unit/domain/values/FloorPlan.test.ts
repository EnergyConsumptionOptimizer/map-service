import { describe, expect, it } from "vitest";
import { FloorPlan } from "@domain/values/FloorPlan";
import { FloorPlanEmptyError } from "@domain/errors";

describe("FloorPlan", () => {
  it("should wrap non-empty svg content", () => {
    const fp = FloorPlan.from("<svg/>") as FloorPlan;
    expect(fp.toString()).toBe("<svg/>");
  });

  it("should reject empty svg content", () => {
    expect(FloorPlan.from("")).toBeInstanceOf(FloorPlanEmptyError);
  });
});
