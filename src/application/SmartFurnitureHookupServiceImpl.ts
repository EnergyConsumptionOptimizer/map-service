import type { HouseMapRepository } from "@domain/ports/HouseMapRepository";

import type { SmartFurnitureHookupService } from "@application/inbound/SmartFurnitureHookupService";
import { SmartFurnitureHookup } from "@domain/entities/SmartFurnitureHookup";
import { SmartFurnitureHookupID } from "@domain/values/SmartFurnitureHookupID";
import { ZoneID } from "@domain/values/ZoneID";
import { Point } from "@domain/values/Point";
import { Zone } from "@domain/entities/Zone";
import {
  SmartFurnitureHookupNotFoundError,
  stripErrors,
  ZoneNotFoundError,
} from "@domain/errors";
import { EventPublisher } from "@application/outbound/EventPublisher";
import { UnitOfWork } from "@application/outbound/UnitOfWork";
import { BusinessMetrics } from "@application/outbound/BusinessMetrics";
import { SmartFurnitureHookupServicePort } from "@application/outbound/SmartFurnitureHookupServicePort";

export class SmartFurnitureHookupServiceImpl implements SmartFurnitureHookupService {
  readonly #smartFurnitureHookupServicePort: SmartFurnitureHookupServicePort;
  readonly #repository: HouseMapRepository;
  readonly #eventPublisher: EventPublisher;
  readonly #uow: UnitOfWork;
  readonly #metrics: BusinessMetrics;

  constructor(
    smartFurnitureHookupServicePort: SmartFurnitureHookupServicePort,
    repository: HouseMapRepository,
    uow: UnitOfWork,
    eventPublisher: EventPublisher,
    metrics: BusinessMetrics,
  ) {
    this.#smartFurnitureHookupServicePort = smartFurnitureHookupServicePort;
    this.#repository = repository;
    this.#eventPublisher = eventPublisher;
    this.#uow = uow;
    this.#metrics = metrics;
  }

  async createSmartFurnitureHookup(
    id: string,
  ): Promise<SmartFurnitureHookup | Error> {
    const props = stripErrors({
      id: SmartFurnitureHookupID.from(id),
      position: Point.from(0, 0),
    });

    if (props instanceof Error) return props;

    const smartFurnitureHookupEntity = SmartFurnitureHookup.create(
      props.id,
      props.position,
      ZoneID.from("UNSET") as ZoneID,
    );

    await this.#repository.saveSmartFurnitureHookup(smartFurnitureHookupEntity);
    this.#metrics.recordSmartFurnitureHookupCreation();
    return smartFurnitureHookupEntity;
  }

  async getSmartFurnitureHookups(): Promise<SmartFurnitureHookup[]> {
    return this.#repository.findAllSmartFurnitureHookups();
  }

  async getSmartFurnitureHookup(
    id: string,
  ): Promise<SmartFurnitureHookup | Error> {
    const hookupId = SmartFurnitureHookupID.from(id);
    if (hookupId instanceof Error) return hookupId;
    const hookup =
      await this.#repository.findSmartFurnitureHookupByID(hookupId);

    if (!hookup)
      return new SmartFurnitureHookupNotFoundError(hookupId.toString());

    return hookup;
  }

  async updateSmartFurnitureHookup(
    id: string,
    position?: [number, number],
    zoneID?: string,
  ): Promise<SmartFurnitureHookup | Error> {
    const props = stripErrors({
      hookupId: SmartFurnitureHookupID.from(id),
      position: position ? Point.from(position[0], position[1]) : undefined,
      zoneID: zoneID ? ZoneID.from(zoneID) : undefined,
    });

    if (props instanceof Error) return props;

    const hookup = await this.#findSmartFurnitureHookupByIDOrCreate(id);

    if (hookup instanceof Error) return hookup;

    if (props.position) hookup.moveTo(props.position);

    if (props.zoneID) {
      const result = await this.#assignToZoneOrFindNew(hookup, props.zoneID);

      if (result instanceof Error) return result;
    } else if (props.position) await this.#reassignZoneByPosition(hookup);

    const events = hookup.pullDomainEvents();

    await this.#uow.executeTransactionally(async () => {
      await this.#repository.updateSmartFurnitureHookup(hookup);

      for (const event of events) {
        await this.#eventPublisher.publish(event);
      }
    });

    this.#metrics.recordSmartFurnitureHookupUpdate();

    return hookup;
  }

  async #findSmartFurnitureHookupByIDOrCreate(id: string) {
    const hookup =
      await this.#smartFurnitureHookupServicePort.getSmartFurnitureHookup(id);

    if (hookup instanceof Error) return hookup;

    return this.createSmartFurnitureHookup(id);
  }

  async deleteSmartFurnitureHookup(id: string): Promise<undefined | Error> {
    const hookupId = SmartFurnitureHookupID.from(id);
    if (hookupId instanceof Error) return hookupId;

    const hookup =
      await this.#repository.findSmartFurnitureHookupByID(hookupId);
    if (!hookup) return new SmartFurnitureHookupNotFoundError(id);

    await this.#repository.removeSmartFurnitureHookup(hookupId);

    this.#metrics.recordSmartFurnitureHookupDeletion();
  }

  async #findZoneForPosition(position: Point): Promise<Zone | null> {
    const zones = await this.#repository.findAllZones();
    const matchingZone = zones.find((zone: Zone) => zone.contains(position));
    return matchingZone ?? null;
  }

  async #assignToZoneOrFindNew(
    hookup: SmartFurnitureHookup,
    zoneID: ZoneID,
  ): Promise<unknown | ZoneNotFoundError> {
    const zone = await this.#repository.findZoneByID(zoneID);

    if (!zone) return new ZoneNotFoundError(zoneID.toString());

    if (zone.contains(hookup.position)) {
      hookup.assignToZone(zone.id);
      return;
    }

    return this.#reassignZoneByPosition(hookup);
  }

  async #reassignZoneByPosition(hookup: SmartFurnitureHookup) {
    const possibleZone = await this.#findZoneForPosition(hookup.position);

    if (possibleZone) {
      hookup.assignToZone(possibleZone.id);
      return;
    }

    hookup.unassignZone();
  }
}
