package io.energyconsumptionoptimizer.mapservice.domain.ports

import io.energyconsumptionoptimizer.mapservice.domain.Zone
import io.energyconsumptionoptimizer.mapservice.domain.ZoneID

/**
 * Service interface for managing zone operations.
 */
interface ZoneService {
    /**
     * Creates a new zone with the specified properties.
     *
     * @param name The human-readable name of the zone
     * @param colorHex The hexadecimal color code for visual representation
     * @param vertices The list of (x, y) coordinate pairs defining the zone's vertices
     * @return The created zone entity
     *
     * @throws io.energyconsumptionoptimizer.mapservice.domain.errors.ZoneNameAlreadyExistsException
     * @throws IllegalArgumentException if the vertices do not form a valid polygon, if the name is blank or if the color format is invalid
     */
    suspend fun createZone(
        name: String,
        colorHex: String,
        vertices: List<Pair<Double, Double>>,
    ): Zone

    /**
     * Retrieves all zones defined within the floor plan.
     *
     * @return A list of all zones, or an empty list if no zones exist
     */
    suspend fun getZones(): List<Zone>

    /**
     * Retrieves a specific zone by its unique identifier.
     *
     * @param id The unique identifier of the zone
     * @return The zone if found, null otherwise
     */
    suspend fun getZone(id: ZoneID): Zone?

    /**
     * Updates an existing zone's properties.
     *
     * Only non-null parameters will be updated. If a parameter is null, the existing value is retained.
     *
     * @param id The unique identifier of the zone to update
     * @param name The new name for the zone, or null to keep the existing name
     * @param colorHex The new hexadecimal color code, or null to keep the existing color
     * @param vertices The new list of coordinate pairs defining the boundary, or null to keep the existing boundary
     * @return The updated zone entity
     * @throws io.energyconsumptionoptimizer.mapservice.domain.errors.ZoneIDNotFoundException
     * @throws IllegalArgumentException if the new vertices do not form a valid polygon or if the color format is invalid
     */
    suspend fun updateZone(
        id: ZoneID,
        name: String? = null,
        colorHex: String? = null,
        vertices: List<Pair<Double, Double>>? = null,
    ): Zone

    /**
     * Deletes a zone from the system.
     *
     * Note: This operation should affect smart furniture hookups assigned to this zone.
     *
     * @param id The unique identifier of the zone to delete
     * @throws NoSuchElementException if the zone does not exist
     */
    suspend fun deleteZone(id: ZoneID)
}
