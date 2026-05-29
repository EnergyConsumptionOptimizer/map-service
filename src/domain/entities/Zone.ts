import { ZoneID } from "@domain/values/ZoneID";
import { ZoneName } from "@domain/values/ZoneName";
import { Color } from "@domain/values/Color";
import { Polygon } from "@domain/values/Polygon";
import { Point } from "@domain/values/Point";
import { Entity } from "@domain/entities/Entity";
import { ZoneDeletedEvent } from "@domain/events/ZoneDeletedEvent";

export class Zone extends Entity {
  #name: ZoneName;
  #color: Color;
  #boundary: Polygon;

  private constructor(
    public readonly id: ZoneID,
    name: ZoneName,
    color: Color,
    boundary: Polygon,
  ) {
    super();

    this.#name = name;
    this.#color = color;
    this.#boundary = boundary;
  }

  get name(): ZoneName {
    return this.#name;
  }

  get color(): Color {
    return this.#color;
  }

  get boundary(): Polygon {
    return this.#boundary;
  }

  static create(
    id: ZoneID,
    name: ZoneName,
    color: Color,
    boundary: Polygon,
  ): Zone {
    return new Zone(id, name, color, boundary);
  }

  static rehydrate(
    id: ZoneID,
    name: ZoneName,
    color: Color,
    boundary: Polygon,
  ): Zone {
    return new Zone(id, name, color, boundary);
  }

  prepareForDeletion(): void {
    this.addDomainEvent(new ZoneDeletedEvent(this));
  }

  rename(newName: ZoneName): void {
    this.#name = newName;
  }

  recolor(newColor: Color): void {
    this.#color = newColor;
  }

  reshape(newBoundary: Polygon): void {
    this.#boundary = newBoundary;
  }

  contains(point: Point): boolean {
    return this.#boundary.contains(point);
  }

  equals(other: Zone): boolean {
    return this.id.equals(other.id);
  }

  toString() {
    return {
      id: this.id.toString(),
      name: this.#name.toString(),
      color: this.#color.toString(),
      vertices: this.#boundary.vertices.map((v) => ({ x: v.x, y: v.y })),
    };
  }
}
