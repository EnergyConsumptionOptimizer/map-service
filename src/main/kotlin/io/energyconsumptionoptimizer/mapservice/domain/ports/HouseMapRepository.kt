package io.energyconsumptionoptimizer.mapservice.domain.ports

import io.energyconsumptionoptimizer.mapservice.domain.FloorPlan
import io.energyconsumptionoptimizer.mapservice.domain.SmartFurnitureHookup
import io.energyconsumptionoptimizer.mapservice.domain.SmartFurnitureHookupID
import io.energyconsumptionoptimizer.mapservice.domain.Zone
import io.energyconsumptionoptimizer.mapservice.domain.ZoneID

/**
 * Repository interface for managing and retrieving the house map
 * including the floor plan, the zones and the smart furniture hookups.
 *
 *
 */
interface HouseMapRepository {
    /**
     * Adds a new floor plan to the repository.
     *
     * @param floorPlan The floor plan information to save
     * @return The saved floor plan
     */
    suspend fun saveFloorPlan(floorPlan: FloorPlan): FloorPlan

    /**
     * Adds a new zone to the repository.
     *
     * @param zone The zone entity to save
     * @return The saved zone
     *
     * @throws io.energyconsumptionoptimizer.mapservice.domain.errors.ZoneNameAlreadyExistsException
     */
    suspend fun saveZone(zone: Zone): Zone

    /**
     * Adds a new smart furniture hookup to the repository.
     *
     * @param smartFurnitureHookup The smart furniture hookup entity to save
     * @return The saved smart furniture hookup
     *
     *  @throws io.energyconsumptionoptimizer.mapservice.domain.errors.SmartFurnitureHookupAlreadyExistsException
     */
    suspend fun saveSmartFurnitureHookup(smartFurnitureHookup: SmartFurnitureHookup): SmartFurnitureHookup

    /**
     * Updates an existing zone in the repository.
     *
     * @param zone The zone entity with updated values
     * @return The updated zone
     *
     * @throws io.energyconsumptionoptimizer.mapservice.domain.errors.ZoneIDNotFoundException
     */
    suspend fun updateZone(zone: Zone): Zone

    /**
     * Updates an existing smart furniture hookup in the repository.
     *
     * @param smartFurnitureHookup The smart furniture hookup entity with updated values
     * @return The updated smart furniture hookup
     *
     * @throws io.energyconsumptionoptimizer.mapservice.domain.errors.SmartFurnitureHookupIDNotFoundException
     */
    suspend fun updateSmartFurnitureHookup(smartFurnitureHookup: SmartFurnitureHookup): SmartFurnitureHookup

    /**
     * Retrieves the floor plan from the repository.
     *
     * @return The floor plan if it exists, null otherwise
     */
    suspend fun findFloorPlan(): FloorPlan?

    /**
     * Retrieves all zones defined within the floor plan.
     *
     * @return A list of all zones, or an empty list if no zones exist
     */
    suspend fun findAllZones(): List<Zone>

    /**
     * Retrieves a specific zone by its unique identifier.
     *
     * @param id The unique identifier of the zone
     * @return The zone if found, null otherwise
     */
    suspend fun findZoneByID(id: ZoneID): Zone?

    /**
     * Retrieves all smart furniture hookups in the floor plan.
     *
     * @return A list of all smart furniture hookups, or an empty list if none exist
     */
    suspend fun findAllSmartFurnitureHookups(): List<SmartFurnitureHookup>

    /**
     * Retrieves all smart furniture hookups located within a specific zone.
     *
     * @param zoneID The unique identifier of the zone
     * @return A list of smart furniture hookups in the specified zone, or an empty list if none exist
     */
    suspend fun findAllSmartFurnitureHookupsOfZone(zoneID: ZoneID): List<SmartFurnitureHookup>

    /**
     * Retrieves a specific smart furniture hookup by its unique identifier.
     *
     * @param id The unique identifier of the smart furniture hookup
     * @return The smart furniture hookup if found, null otherwise
     */
    suspend fun findSmartFurnitureHookupByID(id: SmartFurnitureHookupID): SmartFurnitureHookup?

    /**
     * Removes a zone from the repository.
     *
     * @param id The unique identifier of the zone to remove
     *
     * @throws io.energyconsumptionoptimizer.mapservice.domain.errors.ZoneIDNotFoundException
     */
    suspend fun removeZone(id: ZoneID)

    /**
     * Removes a smart furniture hookup from the repository.
     *
     * @param id The unique identifier of the smart furniture hookup to remove
     *
     * @throws io.energyconsumptionoptimizer.mapservice.domain.errors.SmartFurnitureHookupIDNotFoundException
     */
    suspend fun removeSmartFurnitureHookup(id: SmartFurnitureHookupID)
}
