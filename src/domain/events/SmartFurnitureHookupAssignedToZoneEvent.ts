import { BaseDomainEvent } from "@domain/events/BaseDomainEvent";
import { SmartFurnitureHookup } from "@domain/entities/SmartFurnitureHookup";
import { HouseMapID } from "@domain/values/HouseMapID";

interface SmartFurnitureHookupZoneChangedPayload extends Record<
  string,
  unknown
> {
  readonly smartFurnitureHookupId: string;
  readonly zoneId: string | null;
}

export class SmartFurnitureHookupZoneChangedEvent extends BaseDomainEvent<SmartFurnitureHookupZoneChangedPayload> {
  readonly eventType = "SmartFurnitureHookupZoneChangedEvent";
  readonly aggregateType = "HouseMap";
  readonly payload: SmartFurnitureHookupZoneChangedPayload;

  constructor(hookup: SmartFurnitureHookup) {
    super(HouseMapID.value);
    this.payload = {
      smartFurnitureHookupId: hookup.id.toString(),
      zoneId: hookup.zoneId ? hookup.zoneId.toString() : null,
    };
  }
}
