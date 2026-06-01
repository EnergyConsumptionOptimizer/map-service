import { UnrecoverableError } from "@presentation/event/errors";
import {
  EventEnvelope,
  eventEnvelopeSchema,
} from "@presentation/event/contracts/EventEnvelopeSchema";

export async function mapRawMessageToEventEnvelope(
  raw: string,
): Promise<EventEnvelope | UnrecoverableError> {
  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch (err) {
    return new UnrecoverableError(`Parse failure`, err);
  }

  const result = eventEnvelopeSchema.safeParse(json);

  if (!result.success) {
    return new UnrecoverableError(`Parse failure`, result.error);
  }

  return result.data;
}
