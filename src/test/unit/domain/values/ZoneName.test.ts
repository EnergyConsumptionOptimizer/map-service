import { describe, expect, it } from "vitest";
import { ZoneName } from "@domain/values/ZoneName";
import { ZoneNameEmptyError } from "@domain/errors";

describe("ZoneName", () => {
  it("should accept and trim valid names", () => {
    const name = ZoneName.from(" Kitchen ") as ZoneName;
    expect(name.toString()).toBe("Kitchen");
  });

  it("should reject blank names", () => {
    expect(ZoneName.from("  ")).toBeInstanceOf(ZoneNameEmptyError);
  });

  it("should compare by value", () => {
    const a = ZoneName.from("Kitchen") as ZoneName;
    const b = ZoneName.from("Kitchen") as ZoneName;
    expect(a.equals(b)).toBe(true);
  });
});
