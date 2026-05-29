import { BaseDomainEvent } from "@domain/events/BaseDomainEvent";
import { HouseMapID } from "@domain/values/HouseMapID";
import { Zone } from "@domain/entities/Zone";

interface ZoneDeletedPayload extends Record<string, unknown> {
  readonly zoneId: string;
}

export class ZoneDeletedEvent extends BaseDomainEvent<ZoneDeletedPayload> {
  readonly eventType = "ZoneDeletedEvent";
  readonly aggregateType = "HouseMap";
  readonly payload: ZoneDeletedPayload;

  constructor(zone: Zone) {
    super(HouseMapID.value);

    this.payload = {
      zoneId: zone.id.toString(),
    };
  }
}
