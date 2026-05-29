import { describe, expect, it } from "vitest";
import { Color } from "@domain/values/Color";
import { InvalidColorError } from "@domain/errors";

describe("Color", () => {
  it("should accept #RRGGBB hex", () => {
    expect(Color.from("#A1B2C3")).toBeInstanceOf(Color);
  });

  it.each(["A1B2C3", "#FFF", "#GGGGGG", "#12345"])(
    "should reject invalid hex %s",
    (value) => {
      expect(Color.from(value)).toBeInstanceOf(InvalidColorError);
    },
  );

  it("should be case-insensitive in equality", () => {
    const a = Color.from("#abcdef") as Color;
    const b = Color.from("#ABCDEF") as Color;
    expect(a.equals(b)).toBe(true);
  });
});
