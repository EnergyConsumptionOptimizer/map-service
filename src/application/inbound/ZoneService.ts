import type { Zone } from "@domain/entities/Zone";

/**
 * @inbound
 * Service interface for managing zone operations.
 */
export interface ZoneService {
  /**
   * Creates a new zone with the given name, color, and polygon boundary.
   *
   * After creation, any existing smart furniture hookups whose position falls
   * inside the new zone are automatically assigned to it.
   *
   * @returns The saved Zone, or an Error for validation failures
   *          (ZoneNameEmptyError, InvalidColorError, InvalidPolygonError,
   *          ZoneNameAlreadyExistsError).
   */
  createZone(
    name: string,
    colorHex: string,
    vertices: [number, number][],
  ): Promise<Zone | Error>;

  /**
   * Retrieves all zones defined within the floor plan.
   */
  getZones(): Promise<Zone[]>;

  /**
   * Retrieves a specific zone by its unique identifier.
   *
   * @returns The Zone if found, `null` otherwise.
   */
  getZone(id: string): Promise<Zone | null>;

  /**
   * Updates an existing zone's name, color, and/or boundary.
   *
   * Only supplied (non-undefined) parameters are updated.
   * When vertices are changed, smart furniture hookup zone assignments are
   * recalculated automatically.
   *
   * @returns The updated Zone, or an Error (ZoneNotFoundError, validation errors).
   */
  updateZone(
    id: string,
    name?: string,
    colorHex?: string,
    vertices?: [number, number][],
  ): Promise<Zone | Error>;

  /**
   * Deletes a zone and unassigns any smart furniture hookups that were inside it.
   * Also removes the zone's tag from the monitoring service measurements.
   *
   * @returns `undefined` on success, or an Error (ZoneNotFoundError, IdEmptyError).
   */
  deleteZone(id: string): Promise<undefined | Error>;
}
