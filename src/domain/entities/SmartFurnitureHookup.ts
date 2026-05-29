import { SmartFurnitureHookupID } from "@domain/values/SmartFurnitureHookupID";
import { Point } from "@domain/values/Point";
import { ZoneID } from "@domain/values/ZoneID";
import { Entity } from "@domain/entities/Entity";
import { SmartFurnitureHookupZoneChangedEvent } from "@domain/events/SmartFurnitureHookupAssignedToZoneEvent";

export class SmartFurnitureHookup extends Entity {
  #position: Point;
  #zoneId: ZoneID | null;

  private constructor(
    public readonly id: SmartFurnitureHookupID,
    position: Point,
    zoneId: ZoneID | null,
  ) {
    super();
    this.#position = position;
    this.#zoneId = zoneId;
  }

  get position(): Point {
    return this.#position;
  }

  get zoneId(): ZoneID | null {
    return this.#zoneId;
  }

  static create(
    id: SmartFurnitureHookupID,
    position: Point,
    zoneId: ZoneID | null = null,
  ): SmartFurnitureHookup {
    return new SmartFurnitureHookup(id, position, zoneId);
  }

  static rehydrate(
    id: SmartFurnitureHookupID,
    position: Point,
    zoneId: ZoneID | null = null,
  ): SmartFurnitureHookup {
    return new SmartFurnitureHookup(id, position, zoneId);
  }

  moveTo(newPosition: Point): void {
    this.#position = newPosition;
  }

  assignToZone(zoneId: ZoneID): void {
    this.#zoneId = zoneId;
    this.addDomainEvent(new SmartFurnitureHookupZoneChangedEvent(this));
  }

  unassignZone(): void {
    this.#zoneId = null;
    this.addDomainEvent(new SmartFurnitureHookupZoneChangedEvent(this));
  }

  equals(other: SmartFurnitureHookup): boolean {
    return this.id.equals(other.id);
  }

  toString() {
    return {
      id: this.id.toString(),
      position: { x: this.#position.x, y: this.#position.y },
      zoneId: this.#zoneId ? this.#zoneId.toString() : null,
    };
  }
}
