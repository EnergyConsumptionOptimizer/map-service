import { model, Schema, type Document } from "mongoose";
import { FloorPlan } from "@domain/values/FloorPlan";

export interface FloorPlanDocument extends Document<string> {
  readonly _id: string;
  readonly svgContent: string;
}

const floorPlanSchema = new Schema<FloorPlanDocument>(
  {
    _id: { type: String, required: true },
    svgContent: { type: String, required: true },
  },
  { timestamps: false, versionKey: false },
);

export const FloorPlanModel = model<FloorPlanDocument>(
  "FloorPlan",
  floorPlanSchema,
  "floorPlans",
);

export const FLOOR_PLAN_ID = "singleton-floor-plan";

export const FloorPlanMapper = {
  toPersistence(floorPlan: FloorPlan) {
    return {
      _id: FLOOR_PLAN_ID,
      svgContent: floorPlan.svgContent,
    };
  },

  toDomain(document: Pick<FloorPlanDocument, "svgContent">): FloorPlan {
    return FloorPlan.from(document.svgContent) as FloorPlan;
  },
};
