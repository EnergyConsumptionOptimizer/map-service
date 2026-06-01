import {
  FloorPlanModel,
  FLOOR_PLAN_ID,
} from "@infrastructure/mongo/mongoose/FloorPlanModel";
import { ZoneModel } from "@infrastructure/mongo/mongoose/ZoneModel";
import { SmartFurnitureHookupModel } from "@infrastructure/mongo/mongoose/SmartFurnitureHookupModel";

export async function seedFloorPlan(
  svgContent = "<svg><rect/></svg>",
): Promise<void> {
  await FloorPlanModel.findOneAndReplace(
    { _id: FLOOR_PLAN_ID },
    { _id: FLOOR_PLAN_ID, svgContent },
    { upsert: true },
  ).exec();
}

export async function seedZone(
  id: string,
  name: string,
  color = "#FF8800",
  vertices = [
    { x: 0, y: 0 },
    { x: 10, y: 0 },
    { x: 10, y: 10 },
    { x: 0, y: 10 },
  ],
): Promise<void> {
  await ZoneModel.create({ _id: id, name, color, vertices });
}

export async function seedSmartFurnitureHookup(
  id: string,
  x = 0,
  y = 0,
  zoneId: string | null = null,
): Promise<void> {
  await SmartFurnitureHookupModel.create({
    _id: id,
    position: { x, y },
    zoneId,
  });
}
