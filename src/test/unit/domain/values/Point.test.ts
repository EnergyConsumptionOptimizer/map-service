import { describe, expect, it } from "vitest";
import { Point } from "@domain/values/Point";
import { InvalidCoordinateError } from "@domain/errors";

describe("Point", () => {
  it("should create from finite coordinates", () => {
    const p = Point.from(1.5, -2) as Point;
    expect(p.x).toBe(1.5);
    expect(p.y).toBe(-2);
    expect(p.toString()).toBe("(1.5, -2)");
  });

  it.each([
    [NaN, 0],
    [0, Infinity],
  ])("should reject non-finite coordinates (%s, %s)", (x, y) => {
    expect(Point.from(x, y)).toBeInstanceOf(InvalidCoordinateError);
  });

  it("should compare by coordinates", () => {
    const a = Point.from(3, 4) as Point;
    const b = Point.from(3, 4) as Point;
    expect(a.equals(b)).toBe(true);
  });
});
