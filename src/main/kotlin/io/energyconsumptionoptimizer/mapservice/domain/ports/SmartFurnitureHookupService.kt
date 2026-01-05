package io.energyconsumptionoptimizer.mapservice.domain.ports

import io.energyconsumptionoptimizer.mapservice.domain.SmartFurnitureHookup
import io.energyconsumptionoptimizer.mapservice.domain.SmartFurnitureHookupID
import io.energyconsumptionoptimizer.mapservice.domain.ZoneID

/**
 * Service interface for managing smart furniture hookup operations.
 */

interface SmartFurnitureHookupService {
    /**
     * Creates a new smart furniture hookup at a specified position.
     *
     * Note: The zoneID should be assigned based on the position if is not provided.
     *
     * @param id The unique identifier for the smart furniture hookup
     * @param position The (x, y) coordinates of the hookup on the floor plan
     * @param zoneID The unique identifier of the zone containing this hookup, or null if not assigned to a zone
     * @return The created smart furniture hookup entity
     *
     * @throws io.energyconsumptionoptimizer.mapservice.domain.errors.SmartFurnitureHookupAlreadyExistsException
     */
    suspend fun createSmartFurnitureHookup(
        id: SmartFurnitureHookupID,
        position: Pair<Double, Double>,
        zoneID: ZoneID?,
    ): SmartFurnitureHookup

    /**
     * Retrieves all smart furniture hookups across the floor plan.
     *
     * @return A list of all smart furniture hookups, or an empty list if none exist
     */
    suspend fun getSmartFurnitureHookups(): List<SmartFurnitureHookup>

    /**
     * Retrieves a specific smart furniture hookup by its unique identifier.
     *
     * @param id The unique identifier of the smart furniture hookup
     * @return The smart furniture hookup if found, null otherwise
     */
    suspend fun getSmartFurnitureHookup(id: SmartFurnitureHookupID): SmartFurnitureHookup?

    /**
     * Updates an existing smart furniture hookup's position and/or zone assignment.
     *
     * Only non-null parameters will be updated. If a parameter is null, the existing value is retained.
     *
     * Note: The zoneID should be reassigned if the position changed and a new zoneId is not provided.
     *
     * @param id The unique identifier of the smart furniture hookup to update
     * @param position The new (x, y) coordinates, or null to keep the existing position
     * @param zoneID The new zone identifier, or null to keep the existing zone assignment
     * @return The updated smart furniture hookup entity
     *
     * @throws io.energyconsumptionoptimizer.mapservice.domain.errors.SmartFurnitureHookupIDNotFoundException
     */
    suspend fun updateSmartFurnitureHookup(
        id: SmartFurnitureHookupID,
        position: Pair<Double, Double>?,
        zoneID: ZoneID?,
    ): SmartFurnitureHookup

    /**
     * Deletes a smart furniture hookup.
     *
     * @param id The unique identifier of the smart furniture hookup to delete
     * @throws NoSuchElementException if the smart furniture hookup does not exist
     *
     * @throws io.energyconsumptionoptimizer.mapservice.domain.errors.SmartFurnitureHookupIDNotFoundException
     */
    suspend fun deleteSmartFurnitureHookup(id: SmartFurnitureHookupID)
}
