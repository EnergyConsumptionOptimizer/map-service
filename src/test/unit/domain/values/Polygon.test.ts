import { describe, expect, it } from "vitest";
import { Point } from "@domain/values/Point";
import { Polygon } from "@domain/values/Polygon";
import { InvalidPolygonError } from "@domain/errors";

describe("Polygon", () => {
  const square = () =>
    Polygon.from([
      Point.from(0, 0) as Point,
      Point.from(10, 0) as Point,
      Point.from(10, 10) as Point,
      Point.from(0, 10) as Point,
    ]) as Polygon;

  it("should require at least 3 vertices", () => {
    const tooFew = Polygon.from([
      Point.from(0, 0) as Point,
      Point.from(1, 1) as Point,
    ]);
    expect(tooFew).toBeInstanceOf(InvalidPolygonError);
  });

  it("should report a point inside the boundary (ray casting)", () => {
    expect(square().contains(Point.from(5, 5) as Point)).toBe(true);
  });

  it("should report a point outside the boundary", () => {
    expect(square().contains(Point.from(50, 50) as Point)).toBe(false);
  });

  it("should compare by vertices", () => {
    expect(square().equals(square())).toBe(true);
  });
});
