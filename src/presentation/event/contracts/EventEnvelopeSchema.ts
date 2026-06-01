import { z } from "zod";

export const eventEnvelopeSchema = z.object({
  eventId: z.string().nonempty(),
  eventType: z.string().nonempty(),
  aggregateId: z.string().optional(),
  aggregateType: z.string().optional(),
  correlationId: z.string().optional(),
  occurredAt: z.iso.datetime().optional(),
  payload: z.unknown(),
});

export type EventEnvelope = z.infer<typeof eventEnvelopeSchema>;
