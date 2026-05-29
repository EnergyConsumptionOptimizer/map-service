import type { HouseMapService } from "@application/inbound/HouseMapService";
import type { FloorPlanService } from "@application/inbound/FloorPlanService";
import type { ZoneService } from "@application/inbound/ZoneService";
import type { SmartFurnitureHookupService } from "@application/inbound/SmartFurnitureHookupService";
import { HouseMap } from "@domain/entities/Map";
import { FloorPlanNotFoundError } from "@domain/errors";

export class HouseMapServiceImpl implements HouseMapService {
  readonly #floorPlanService: FloorPlanService;
  readonly #zoneService: ZoneService;
  readonly #smartFurnitureHookupService: SmartFurnitureHookupService;

  constructor(
    floorPlanService: FloorPlanService,
    zoneService: ZoneService,
    smartFurnitureHookupService: SmartFurnitureHookupService,
  ) {
    this.#floorPlanService = floorPlanService;
    this.#zoneService = zoneService;
    this.#smartFurnitureHookupService = smartFurnitureHookupService;
  }

  async getHouseMap(): Promise<HouseMap | Error> {
    const floorPlan = await this.#floorPlanService.getFloorPlan();
    if (!floorPlan) return new FloorPlanNotFoundError();

    const [zones, hookups] = await Promise.all([
      this.#zoneService.getZones(),
      this.#smartFurnitureHookupService.getSmartFurnitureHookups(),
    ]);

    return HouseMap.rehydrate(floorPlan, zones, hookups);
  }
}
