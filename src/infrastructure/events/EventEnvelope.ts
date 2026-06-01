import type { DomainEvent } from "@domain/events/DomainEvent";

export class EventEnvelope<
  TPayload extends Record<string, unknown> = Record<string, unknown>,
> {
  readonly eventId: string;
  readonly correlationId?: string;
  readonly event: DomainEvent<TPayload>;

  constructor(props: {
    event: DomainEvent<TPayload>;
    eventId: string;
    correlationId?: string;
  }) {
    this.eventId = props.eventId;
    this.correlationId = props.correlationId;
    this.event = props.event;
  }
}
