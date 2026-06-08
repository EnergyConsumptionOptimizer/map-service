export interface EnvelopeOverrides {
  eventId?: string;
  eventType?: string;
  correlationId?: string;
  aggregateId?: string;
  aggregateType?: string;
  occurredAt?: string;
  payload?: unknown;
}

export function anEventEnvelope(
  overrides: EnvelopeOverrides = {},
): Record<string, unknown> {
  const envelope: Record<string, unknown> = {
    eventId: overrides.eventId ?? "evt-1",
    eventType: overrides.eventType ?? "SmartFurnitureHookupCreatedEvent",
    payload:
      "payload" in overrides
        ? overrides.payload
        : { smartFurnitureHookupId: "sfh-1" },
  };
  if (overrides.correlationId !== undefined)
    envelope.correlationId = overrides.correlationId;
  if (overrides.aggregateId !== undefined)
    envelope.aggregateId = overrides.aggregateId;
  if (overrides.aggregateType !== undefined)
    envelope.aggregateType = overrides.aggregateType;
  if (overrides.occurredAt !== undefined)
    envelope.occurredAt = overrides.occurredAt;
  return envelope;
}

export function rawEnvelope(overrides: EnvelopeOverrides = {}): string {
  return JSON.stringify(anEventEnvelope(overrides));
}

export function aCreatedEvent(
  smartFurnitureHookupId = "sfh-1",
  overrides: EnvelopeOverrides = {},
): string {
  return rawEnvelope({
    eventType: "SmartFurnitureHookupCreatedEvent",
    payload: { smartFurnitureHookupId },
    ...overrides,
  });
}

export function aDeletedEvent(
  smartFurnitureHookupId = "sfh-1",
  overrides: EnvelopeOverrides = {},
): string {
  return rawEnvelope({
    eventType: "SmartFurnitureHookupDeletedEvent",
    payload: { smartFurnitureHookupId },
    ...overrides,
  });
}
