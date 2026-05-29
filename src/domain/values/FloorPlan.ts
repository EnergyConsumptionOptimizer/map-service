import { FloorPlanEmptyError } from "@domain/errors";

export class FloorPlan {
  private constructor(public readonly svgContent: string) {}

  static from(svgContent: string): FloorPlan | FloorPlanEmptyError {
    if (svgContent.length === 0) {
      return new FloorPlanEmptyError();
    }
    return new FloorPlan(svgContent);
  }

  toString(): string {
    return this.svgContent;
  }

  equals(other: FloorPlan): boolean {
    return this.svgContent === other.svgContent;
  }
}
