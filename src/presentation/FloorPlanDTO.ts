import type { FloorPlan } from "@domain/values/FloorPlan";

export interface FloorPlanDTO {
  readonly svgContent: string;
}

export const floorPlanDTOMapper = {
  toDTO(floorPlan: FloorPlan): FloorPlanDTO {
    return { svgContent: floorPlan.svgContent };
  },
};
