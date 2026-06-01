import { model, Schema, type Document } from "mongoose";
import { SmartFurnitureHookup } from "@domain/entities/SmartFurnitureHookup";
import { SmartFurnitureHookupID } from "@domain/values/SmartFurnitureHookupID";
import { Point } from "@domain/values/Point";
import { ZoneID } from "@domain/values/ZoneID";
import {
  PointDoc,
  pointDocSchema,
} from "@infrastructure/mongo/mongoose/PointModel";

export interface SmartFurnitureHookupDocument extends Document<string> {
  readonly _id: string;
  readonly position: PointDoc;
  readonly zoneId: string | null;
}

const smartFurnitureHookupSchema = new Schema<SmartFurnitureHookupDocument>(
  {
    _id: { type: String, required: true },
    position: { type: pointDocSchema, required: true },
    zoneId: { type: String, default: null },
  },
  { timestamps: false, versionKey: false },
);

export const SmartFurnitureHookupModel = model<SmartFurnitureHookupDocument>(
  "SmartFurnitureHookup",
  smartFurnitureHookupSchema,
  "smartFurnitureHookups",
);

export const SmartFurnitureHookupMapper = {
  toPersistence(sfh: SmartFurnitureHookup) {
    return {
      _id: sfh.id.value,
      position: { x: sfh.position.x, y: sfh.position.y },
      zoneId: sfh.zoneId?.value ?? null,
    };
  },

  toDomain(
    document: Pick<SmartFurnitureHookupDocument, "_id" | "position" | "zoneId">,
  ): SmartFurnitureHookup {
    return SmartFurnitureHookup.rehydrate(
      SmartFurnitureHookupID.from(document._id) as SmartFurnitureHookupID,
      Point.from(document.position.x, document.position.y) as Point,
      document.zoneId ? (ZoneID.from(document.zoneId) as ZoneID) : null,
    );
  },
};
