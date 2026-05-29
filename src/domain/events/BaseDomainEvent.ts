import type { DomainEvent } from "@domain/events/DomainEvent";

export abstract class BaseDomainEvent<
  TPayload extends Record<string, unknown>,
> implements DomainEvent<TPayload> {
  abstract readonly eventType: string;
  abstract readonly aggregateType: string;
  abstract readonly payload: TPayload;
  readonly aggregateId: string;
  readonly occurredAt: string;

  constructor(aggregateId: string) {
    this.aggregateId = aggregateId;
    this.occurredAt = new Date().toISOString();
  }
}
