import type { DomainEvent } from "@domain/events/DomainEvent";

export abstract class Entity {
  #domainEvents: DomainEvent[] = [];

  protected addDomainEvent(event: DomainEvent): void {
    this.#domainEvents.push(event);
  }

  public pullDomainEvents(): DomainEvent[] {
    const events = [...this.#domainEvents];
    this.#domainEvents = [];
    return events;
  }

  get domainEvents() {
    return this.#domainEvents;
  }
}
