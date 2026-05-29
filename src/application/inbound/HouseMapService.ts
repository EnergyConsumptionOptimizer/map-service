import type { HouseMap } from "@domain/entities/Map";

/**
 * @inbound
 * Service interface for retrieving the complete house map.
 */
export interface HouseMapService {
  /**
   * Retrieves the complete house map — floor plan, all zones, and all smart
   * furniture hookups — assembled into a single domain aggregate.
   *
   * @returns The HouseMap aggregate, or a FloorPlanNotFoundError if no floor
   *          plan has been uploaded yet.
   */
  getHouseMap(): Promise<HouseMap | Error>;
}
