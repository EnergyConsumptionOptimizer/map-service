import { Entity } from "@domain/entities/Entity";
import { Zone } from "@domain/entities/Zone";
import { SmartFurnitureHookup } from "@domain/entities/SmartFurnitureHookup";
import { HouseMapID } from "@domain/values/HouseMapID";
import { FloorPlan } from "@domain/values/FloorPlan";

export class HouseMap extends Entity {
  readonly #id: HouseMapID;
  readonly #floorPlan: FloorPlan;
  readonly #zones: Zone[];
  readonly #hookups: SmartFurnitureHookup[];

  private constructor(
    id: HouseMapID,
    floorPlan: FloorPlan,
    zones: Zone[],
    hookups: SmartFurnitureHookup[],
  ) {
    super();
    this.#id = id;
    this.#floorPlan = floorPlan;
    this.#zones = zones;
    this.#hookups = hookups;
  }

  get floorPlan(): FloorPlan {
    return this.#floorPlan;
  }

  get zones(): readonly Zone[] {
    return this.#zones;
  }

  get smartFurnitureHookups(): readonly SmartFurnitureHookup[] {
    return [...this.#hookups.values()];
  }

  get id(): HouseMapID {
    return this.#id;
  }

  static create(floorPlan: FloorPlan): HouseMap {
    return new HouseMap(HouseMapID, floorPlan, [], []);
  }

  static rehydrate(
    floorPlan: FloorPlan,
    zones: Zone[],
    hookups: SmartFurnitureHookup[],
  ): HouseMap {
    return new HouseMap(HouseMapID, floorPlan, zones, hookups);
  }
}
