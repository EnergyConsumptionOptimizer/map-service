import { Schema } from "mongoose";

export interface PointDoc {
  x: number;
  y: number;
}

export const pointDocSchema = new Schema<PointDoc>(
  { x: { type: Number, required: true }, y: { type: Number, required: true } },
  { _id: false },
);
