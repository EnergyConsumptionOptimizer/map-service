import { InvalidPolygonError } from "@domain/errors";
import { Point } from "@domain/values/Point";

export class Polygon {
  private constructor(private readonly _vertices: readonly Point[]) {}

  static from(vertices: readonly Point[]): Polygon | InvalidPolygonError {
    if (vertices.length < 3) {
      return new InvalidPolygonError();
    }
    return new Polygon([...vertices]);
  }

  get vertices(): readonly Point[] {
    return this._vertices;
  }

  contains(point: Point): boolean {
    let inside = false;
    const { x, y } = point;

    let j = this._vertices.length - 1;
    for (let i = 0; i < this._vertices.length; i++) {
      const xi = this._vertices[i].x;
      const yi = this._vertices[i].y;
      const xj = this._vertices[j].x;
      const yj = this._vertices[j].y;

      const intersect =
        yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;

      if (intersect) {
        inside = !inside;
      }

      j = i;
    }

    return inside;
  }

  equals(other: Polygon): boolean {
    if (this._vertices.length !== other._vertices.length) {
      return false;
    }
    return this._vertices.every((vertex, index) =>
      vertex.equals(other._vertices[index]),
    );
  }

  toString(): string {
    return `Polygon[${this._vertices.map((v) => v.toString()).join(", ")}]`;
  }
}
