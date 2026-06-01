import mongoose, { Schema } from "mongoose";

export interface OutboxEventDoc {
  eventId: string;
  aggregateId: string;
  aggregateType: string;
  eventType: string;
  occurredAt: string;
  payload: Record<string, unknown>;
  correlationId?: string;
  createdAt: Date;
}

const outboxEventSchema = new Schema<OutboxEventDoc>(
  {
    eventId: { type: String, required: true },
    aggregateId: { type: String, required: true },
    aggregateType: { type: String, required: true },
    eventType: { type: String, required: true },
    occurredAt: { type: String, required: true },
    payload: { type: Schema.Types.Mixed, required: true },
    correlationId: { type: String },
  },
  { timestamps: { createdAt: true, updatedAt: false }, versionKey: false },
);

outboxEventSchema.index({ createdAt: 1 }, { expireAfterSeconds: 604800 });

export const OutboxEvent = mongoose.model<OutboxEventDoc>(
  "OutboxEvent",
  outboxEventSchema,
  "outboxevents",
);
