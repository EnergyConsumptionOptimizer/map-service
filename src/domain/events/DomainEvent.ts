export interface DomainEvent<
  TPayload extends Record<string, unknown> = Record<string, unknown>,
> {
  readonly eventType: string;
  readonly occurredAt: string;
  readonly aggregateId: string;
  readonly aggregateType: string;
  readonly payload: TPayload;
}
