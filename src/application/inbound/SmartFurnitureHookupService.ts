import type { SmartFurnitureHookup } from "@domain/entities/SmartFurnitureHookup";

/**
 * @inbound
 * Service interface for managing smart furniture hookup placement operations.
 *
 * Note: The "smart furniture hookup" in this context is a positioned device on
 * the floor plan map; its ID originates from the separate smart-furniture-hookup
 * service.
 */
export interface SmartFurnitureHookupService {
  /**
   * Places a smart furniture hookup on the floor plan at the given position.
   *
   * If `zoneID` is not provided the zone is auto-detected from the hookup's
   * coordinates. If `zoneID` is provided, the referenced zone must exist.
   *
   * @returns The saved SmartFurnitureHookup, or an Error (IdEmptyError,
   *          InvalidCoordinateError, ZoneNotFoundError,
   *          SmartFurnitureHookupAlreadyExistsError).
   */
  createSmartFurnitureHookup(id: string): Promise<SmartFurnitureHookup | Error>;

  /**
   * Retrieves all smart furniture hookups on the floor plan.
   */
  getSmartFurnitureHookups(): Promise<SmartFurnitureHookup[]>;

  /**
   * Retrieves a single smart furniture hookup by its unique identifier.
   *
   * @returns The SmartFurnitureHookup if found, `null` otherwise.
   */
  getSmartFurnitureHookup(id: string): Promise<SmartFurnitureHookup | Error>;

  /**
   * Updates the position and/or zone assignment of a smart furniture hookup.
   *
   * Only supplied (non-undefined) parameters are updated. When position changes
   * and no explicit `zoneID` is given, the zone is recalculated automatically.
   * Pass `zoneID: null` to explicitly unassign the hookup from its zone.
   *
   * @returns The updated SmartFurnitureHookup, or an Error (IdEmptyError,
   *          InvalidCoordinateError, SmartFurnitureHookupNotFoundError,
   *          ZoneNotFoundError).
   */
  updateSmartFurnitureHookup(
    id: string,
    position?: [number, number],
    zoneID?: string,
  ): Promise<SmartFurnitureHookup | Error>;

  /**
   * Removes a smart furniture hookup from the floor plan.
   *
   * @returns `undefined` on success, or an Error (IdEmptyError,
   *          SmartFurnitureHookupNotFoundError).
   */
  deleteSmartFurnitureHookup(id: string): Promise<undefined | Error>;
}
