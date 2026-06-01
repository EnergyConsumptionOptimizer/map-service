import { FloorPlan } from "@domain/values/FloorPlan";
import { Zone } from "@domain/entities/Zone";
import { ZoneID } from "@domain/values/ZoneID";
import { SmartFurnitureHookup } from "@domain/entities/SmartFurnitureHookup";
import { SmartFurnitureHookupID } from "@domain/values/SmartFurnitureHookupID";

/**
 * Repository interface for managing and retrieving the house map — the floor
 * plan, the zones and the smart furniture hookups.
 */
export interface HouseMapRepository {
  /**
   * Adds a new floor plan to the repository.
   *
   * @param floorPlan - The floor plan information to save.
   * @returns A promise that resolves to the saved floor plan.
   */
  saveFloorPlan(floorPlan: FloorPlan): Promise<FloorPlan>;

  /**
   * Adds a new zone to the repository.
   *
   * @param zone - The zone entity to save.
   * @returns A promise that resolves to the saved zone.
   *
   */
  saveZone(zone: Zone): Promise<Zone>;

  /**
   * Adds a new smart furniture hookup to the repository.
   *
   * @param smartFurnitureHookup - The smart furniture hookup entity to save.
   * @returns A promise that resolves to the saved smart furniture hookup.
   *
   */
  saveSmartFurnitureHookup(
    smartFurnitureHookup: SmartFurnitureHookup,
  ): Promise<SmartFurnitureHookup>;

  /**
   * Updates an existing zone in the repository.
   *
   * @param zone - The zone entity with updated values.
   * @returns A promise that resolves to the updated zone.
   */
  updateZone(zone: Zone): Promise<Zone>;

  /**
   * Updates an existing smart furniture hookup in the repository.
   *
   * @param smartFurnitureHookup - The smart furniture hookup with updated values.
   * @returns A promise that resolves to the updated smart furniture hookup.
   *
   */
  updateSmartFurnitureHookup(
    smartFurnitureHookup: SmartFurnitureHookup,
  ): Promise<SmartFurnitureHookup>;

  /**
   * Retrieves the floor plan from the repository.
   *
   * @returns The floor plan if it exists, `null` otherwise.
   */
  findFloorPlan(): Promise<FloorPlan | null>;

  /**
   * Retrieves all zones defined within the floor plan.
   *
   * @returns A list of all zones, or an empty list if no zones exist.
   */
  findAllZones(): Promise<Zone[]>;

  /**
   * Retrieves a specific zone by its unique identifier.
   *
   * @param id - The unique identifier of the zone.
   * @returns The zone if found, `null` otherwise.
   */
  findZoneByID(id: ZoneID): Promise<Zone | null>;

  /**
   * Retrieves all smart furniture hookups in the floor plan.
   *
   * @returns A list of all smart furniture hookups, or an empty list if none exist.
   */
  findAllSmartFurnitureHookups(): Promise<SmartFurnitureHookup[]>;

  /**
   * Retrieves all smart furniture hookups located within a specific zone.
   *
   * @param zoneID - The unique identifier of the zone.
   * @returns A list of smart furniture hookups in the zone, or an empty list.
   */
  findAllSmartFurnitureHookupsOfZone(
    zoneID: ZoneID,
  ): Promise<SmartFurnitureHookup[]>;

  /**
   * Retrieves a specific smart furniture hookup by its unique identifier.
   *
   * @param id - The unique identifier of the smart furniture hookup.
   * @returns The smart furniture hookup if found, `null` otherwise.
   */
  findSmartFurnitureHookupByID(
    id: SmartFurnitureHookupID,
  ): Promise<SmartFurnitureHookup | null | Error>;

  /**
   * Removes a zone from the repository.
   *
   * @param id - The unique identifier of the zone to remove.
   */
  removeZone(id: ZoneID): Promise<void>;

  /**
   * Removes a smart furniture hookup from the repository.
   *
   * @param id - The unique identifier of the smart furniture hookup to remove.
   */
  removeSmartFurnitureHookup(id: SmartFurnitureHookupID): Promise<void>;
}
