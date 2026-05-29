import type { HouseMapRepository } from "@domain/ports/HouseMapRepository";
import type { EventPublisher } from "@application/outbound/EventPublisher";
import type { IdGenerator } from "@application/outbound/IdGenerator";
import type { ZoneService } from "@application/inbound/ZoneService";
import { Zone } from "@domain/entities/Zone";
import { SmartFurnitureHookup } from "@domain/entities/SmartFurnitureHookup";
import { ZoneID } from "@domain/values/ZoneID";
import { ZoneName } from "@domain/values/ZoneName";
import { Color } from "@domain/values/Color";
import { Point } from "@domain/values/Point";
import { Polygon } from "@domain/values/Polygon";
import { stripErrors, ZoneNotFoundError } from "@domain/errors";
import { BusinessMetrics } from "@application/outbound/BusinessMetrics";
import { UnitOfWork } from "@application/outbound/UnitOfWork";

export class ZoneServiceImpl implements ZoneService {
  readonly #repository: HouseMapRepository;
  readonly #eventPublisher: EventPublisher;
  readonly #idGenerator: IdGenerator;
  readonly #metrics: BusinessMetrics;
  readonly #uow: UnitOfWork;

  constructor(
    repository: HouseMapRepository,
    eventPublisher: EventPublisher,
    idGenerator: IdGenerator,
    uow: UnitOfWork,
    metrics: BusinessMetrics,
  ) {
    this.#repository = repository;
    this.#eventPublisher = eventPublisher;
    this.#idGenerator = idGenerator;
    this.#uow = uow;
    this.#metrics = metrics;
  }

  async createZone(
    name: string,
    colorHex: string,
    vertices: [number, number][],
  ): Promise<Zone | Error> {
    const points = this.#parseVertices(vertices);

    if (points instanceof Error) return points;

    const props = stripErrors({
      id: ZoneID.from(this.#idGenerator.generate()),
      name: ZoneName.from(name),
      color: Color.from(colorHex),
      boundary: Polygon.from(points),
    });

    if (props instanceof Error) return props;

    const zone = Zone.create(props.id, props.name, props.color, props.boundary);

    await this.#uow.executeTransactionally(async () => {
      await this.#repository.saveZone(zone);
      await this.#assignHookupsToZone(zone);
    });

    this.#metrics.recordZoneCreation();

    return zone;
  }

  async getZones(): Promise<Zone[]> {
    return this.#repository.findAllZones();
  }

  async getZone(id: string): Promise<Zone | null> {
    const zoneId = ZoneID.from(id);
    if (zoneId instanceof Error) return null;
    return this.#repository.findZoneByID(zoneId);
  }

  async updateZone(
    id: string,
    name?: string,
    colorHex?: string,
    vertices?: [number, number][],
  ): Promise<Zone | Error> {
    const props = stripErrors({
      id: ZoneID.from(id),
      name: name ? ZoneName.from(name) : undefined,
      colorHex: colorHex ? Color.from(colorHex) : undefined,
    });
    if (props instanceof Error) return props;

    const zone = await this.#repository.findZoneByID(props.id);
    if (!zone) return new ZoneNotFoundError(id);

    if (name !== undefined) {
      const newName = ZoneName.from(name);
      if (newName instanceof Error) return newName;
      zone.rename(newName);
    }

    if (colorHex !== undefined) {
      const newColor = Color.from(colorHex);
      if (newColor instanceof Error) return newColor;
      zone.recolor(newColor);
    }

    if (vertices !== undefined) {
      const points = this.#parseVertices(vertices);
      if (points instanceof Error) return points;
      const newBoundary = Polygon.from(points);
      if (newBoundary instanceof Error) return newBoundary;
      zone.reshape(newBoundary);
    }

    await this.#uow.executeTransactionally(async () => {
      const updatedZone = await this.#repository.updateZone(zone);

      if (vertices !== undefined) {
        await this.#reassignHookupsForZoneChange(updatedZone);
      }
    });

    this.#metrics.recordZoneUpdate();

    return zone;
  }

  async deleteZone(id: string): Promise<undefined | Error> {
    const zoneId = ZoneID.from(id);
    if (zoneId instanceof Error) return zoneId;

    const zone = await this.#repository.findZoneByID(zoneId);
    if (!zone) return new ZoneNotFoundError(id);

    await this.#uow.executeTransactionally(async () => {
      await this.#removeAssignedHookupsFromZone(zoneId);
      await this.#repository.removeZone(zoneId);

      for (const event of zone.pullDomainEvents()) {
        await this.#eventPublisher.publish(event);
      }
    });

    this.#metrics.recordZoneDeletion();
  }

  #parseVertices(vertices: [number, number][]): Point[] | Error {
    const points: Point[] = [];

    for (const vertex of vertices) {
      const point = Point.from(vertex[0], vertex[1]);

      if (point instanceof Error) return point;
      points.push(point);
    }

    return points;
  }

  async #assignHookupsToZone(zone: Zone): Promise<void> {
    const allHookups = await this.#repository.findAllSmartFurnitureHookups();

    for (const hookup of allHookups) {
      if (zone.contains(hookup.position)) {
        hookup.assignToZone(zone.id);
        await this.#repository.updateSmartFurnitureHookup(hookup);
        await this.#publishHookupEvents(hookup);
      }
    }
  }

  async #reassignHookupsForZoneChange(changedZone: Zone): Promise<void> {
    const allHookups = await this.#repository.findAllSmartFurnitureHookups();

    for (const hookup of allHookups) {
      const isInsideChangedZone = changedZone.contains(hookup.position);
      const isAssignedToChangedZone =
        hookup.zoneId?.equals(changedZone.id) ?? false;

      if (isAssignedToChangedZone && !isInsideChangedZone) {
        hookup.unassignZone();
        await this.#repository.updateSmartFurnitureHookup(hookup);
        await this.#publishHookupEvents(hookup);
      } else if (!hookup.zoneId && isInsideChangedZone) {
        hookup.assignToZone(changedZone.id);
        await this.#repository.updateSmartFurnitureHookup(hookup);
        await this.#publishHookupEvents(hookup);
      }
    }
  }

  async #removeAssignedHookupsFromZone(zoneId: ZoneID): Promise<void> {
    const hookups =
      await this.#repository.findAllSmartFurnitureHookupsOfZone(zoneId);

    for (const hookup of hookups) {
      hookup.unassignZone();
      await this.#repository.updateSmartFurnitureHookup(hookup);
      await this.#publishHookupEvents(hookup);
    }
  }

  async #publishHookupEvents(hookup: SmartFurnitureHookup): Promise<void> {
    for (const event of hookup.pullDomainEvents()) {
      await this.#eventPublisher.publish(event);
    }
  }
}
