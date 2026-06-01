import { model, Schema, type Document } from "mongoose";
import { Zone } from "@domain/entities/Zone";
import { ZoneID } from "@domain/values/ZoneID";
import { ZoneName } from "@domain/values/ZoneName";
import { Color } from "@domain/values/Color";
import { Polygon } from "@domain/values/Polygon";
import { Point } from "@domain/values/Point";
import {
  PointDoc,
  pointDocSchema,
} from "@infrastructure/mongo/mongoose/PointModel";

export interface ZoneDocument extends Document<string> {
  readonly _id: string;
  readonly name: string;
  readonly color: string;
  readonly vertices: PointDoc[];
}

const zoneSchema = new Schema<ZoneDocument>(
  {
    _id: { type: String, required: true },
    name: { type: String, required: true, unique: true },
    color: { type: String, required: true },
    vertices: { type: [pointDocSchema], required: true },
  },
  { timestamps: false, versionKey: false },
);

export const ZoneModel = model<ZoneDocument>("Zone", zoneSchema, "zones");

export const ZoneMapper = {
  toPersistence(zone: Zone) {
    return {
      _id: zone.id.value,
      name: zone.name.value,
      color: zone.color.value,
      vertices: zone.boundary.vertices.map((v) => ({ x: v.x, y: v.y })),
    };
  },

  toDomain(
    document: Pick<ZoneDocument, "_id" | "name" | "color" | "vertices">,
  ): Zone {
    const points = document.vertices.map((v) => Point.from(v.x, v.y) as Point);

    return Zone.rehydrate(
      ZoneID.from(document._id) as ZoneID,
      ZoneName.from(document.name) as ZoneName,
      Color.from(document.color) as Color,
      Polygon.from(points) as Polygon,
    );
  },
};
