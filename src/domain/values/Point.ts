import { InvalidCoordinateError } from "@domain/errors";

export class Point {
  private constructor(
    public readonly x: number,
    public readonly y: number,
  ) {}

  static from(x: number, y: number): Point | InvalidCoordinateError {
    if (!Number.isFinite(x) || !Number.isFinite(y)) {
      return new InvalidCoordinateError();
    }
    return new Point(x, y);
  }

  toString(): string {
    return `(${this.x}, ${this.y})`;
  }

  equals(other: Point): boolean {
    return this.x === other.x && this.y === other.y;
  }
}
