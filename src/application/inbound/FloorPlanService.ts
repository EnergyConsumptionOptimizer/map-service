import type { FloorPlan } from "@domain/values/FloorPlan";

/**
 * @inbound
 * Service interface for managing floor plan operations.
 */
export interface FloorPlanService {
  /**
   * Creates a new floor plan from an SVG string.
   * Validates that the content is non-empty and is a valid SVG document.
   *
   * @returns The saved FloorPlan, or an Error (InvalidFloorPlanError) if the SVG is invalid.
   */
  createFloorPlan(floorPlanSVG: string): Promise<FloorPlan | Error>;

  /**
   * Retrieves the current floor plan.
   *
   * @returns The FloorPlan if one exists, or `null` if none has been uploaded yet.
   */
  getFloorPlan(): Promise<FloorPlan | null>;
}
