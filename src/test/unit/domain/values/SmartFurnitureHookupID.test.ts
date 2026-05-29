import { describe, expect, it } from "vitest";
import { SmartFurnitureHookupID } from "@domain/values/SmartFurnitureHookupID";
import { IdEmptyError } from "@domain/errors";

describe("SmartFurnitureHookupID", () => {
  it("should trim and wrap a non-empty id", () => {
    const id = SmartFurnitureHookupID.from(" sfh-1 ") as SmartFurnitureHookupID;
    expect(id).toBeInstanceOf(SmartFurnitureHookupID);
    expect(id.toString()).toBe("sfh-1");
  });

  it("should return IdEmptyError for blank input", () => {
    expect(SmartFurnitureHookupID.from("   ")).toBeInstanceOf(IdEmptyError);
  });

  it("should compare by value", () => {
    const a = SmartFurnitureHookupID.from("h") as SmartFurnitureHookupID;
    const b = SmartFurnitureHookupID.from("h") as SmartFurnitureHookupID;
    expect(a.equals(b)).toBe(true);
  });
});
