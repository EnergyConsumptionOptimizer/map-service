import { describe, expect, it } from "vitest";
import { ZoneID } from "@domain/values/ZoneID";
import { IdEmptyError } from "@domain/errors";

describe("ZoneID", () => {
  it("should trim and wrap a non-empty id", () => {
    const id = ZoneID.from("  zone-1  ") as ZoneID;
    expect(id).toBeInstanceOf(ZoneID);
    expect(id.toString()).toBe("zone-1");
  });

  it("should return IdEmptyError for blank input", () => {
    expect(ZoneID.from("   ")).toBeInstanceOf(IdEmptyError);
  });

  it("should compare by value", () => {
    const a = ZoneID.from("z") as ZoneID;
    const b = ZoneID.from("z") as ZoneID;
    expect(a.equals(b)).toBe(true);
  });
});
